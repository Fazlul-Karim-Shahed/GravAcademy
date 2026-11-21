import path from 'path';
import fs from 'fs/promises';
import QRCode from 'qrcode';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { User } from '../models/User';
import { EnrollmentRequest } from '../models/EnrollmentRequest';
import { AuditLog } from '../models/AuditLog';

type ConnectionState = 'starting' | 'qr' | 'ready' | 'disconnected' | 'error';
let client: Client | null = null;
let state: ConnectionState = 'starting';
let qrImage: string | null = null;
let lastError: string | null = null;
let sendQueue: Promise<void> = Promise.resolve();
const pendingMessages: Array<{ email: string; subject: string; body: string }> = [];
let intentionalDisconnect = false;

const auditWhatsApp = async (action: string, email: string, metadata: Record<string, any>) => {
  try {
    await AuditLog.create({ action, resourceType: 'WhatsApp', actorEmail: email, metadata });
  } catch (error) {
    console.warn('[WhatsApp] Audit log failed:', error instanceof Error ? error.message : error);
  }
};

export const getWhatsAppStatus = () => ({ state, qrImage, lastError });

export const startWhatsApp = () => {
  if (client) return;
  intentionalDisconnect = false;
  const sessionPath = process.env.WHATSAPP_SESSION_PATH || path.resolve(process.cwd(), '.wwebjs_auth');
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath, clientId: 'gravacademy' }),
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html',
    },
    puppeteer: {
      headless: true,
      ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-sync',
        '--no-first-run',
        '--no-default-browser-check',
      ],
    },
  });
  client.on('qr', async (qr) => {
    state = 'qr';
    lastError = null;
    try {
      qrImage = await QRCode.toDataURL(qr, { margin: 2, width: 320 });
    } catch {
      state = 'error';
      lastError = 'QR code could not be generated';
    }
  });
  client.on('ready', () => {
    state = 'ready';
    qrImage = null;
    lastError = null;
    console.info('[WhatsApp] Connected');
    flushPendingMessages();
  });
  client.on('authenticated', () => { state = 'starting'; qrImage = null; });
  client.on('auth_failure', (message) => {
    state = 'error';
    qrImage = null;
    lastError = message || 'Authentication failed';
    console.warn('[WhatsApp] Authentication failed');
  });
  client.on('disconnected', (reason) => {
    state = 'disconnected';
    qrImage = null;
    lastError = String(reason);
    console.warn('[WhatsApp] Disconnected:', reason);
    const disconnectedClient = client;
    client = null;
    void disconnectedClient?.destroy().catch(() => undefined);
    // Reconnect using the persisted LocalAuth session after transient drops.
    if (!intentionalDisconnect) setTimeout(() => startWhatsApp(), 5000);
  });
  client.initialize().catch((error) => {
    state = 'error';
    lastError = error instanceof Error ? error.message : 'Initialization failed';
    console.warn('[WhatsApp] Startup failed:', lastError);
    const failedClient = client;
    client = null;
    void failedClient?.destroy().catch(() => undefined);
    if (!intentionalDisconnect) setTimeout(() => startWhatsApp(), 10000);
  });
};

export const disconnectWhatsApp = async () => {
  intentionalDisconnect = true;
  const activeClient = client;
  client = null;
  if (activeClient) {
    try { await activeClient.logout(); } catch { /* already disconnected */ }
    try { await activeClient.destroy(); } catch { /* cleanup continues */ }
  }
  const sessionPath = process.env.WHATSAPP_SESSION_PATH || path.resolve(process.cwd(), '.wwebjs_auth');
  await fs.rm(sessionPath, { recursive: true, force: true });
  state = 'disconnected';
  qrImage = null;
  lastError = null;
};

const normalizePhone = (raw?: string): string | null => {
  const digits = (raw || '').replace(/\D/g, '');
  if (/^8801\d{9}$/.test(digits)) return digits;
  if (/^01\d{9}$/.test(digits)) return `88${digits}`;
  if (/^1\d{9}$/.test(digits)) return `880${digits}`;
  return null;
};

const resolvePhone = async (email: string): Promise<string | null> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('phone').lean();
  if (user?.phone) return normalizePhone(user.phone);
  const request = await EnrollmentRequest.findOne({ email: normalizedEmail })
    .sort({ createdAt: -1 }).select('phone').lean();
  return normalizePhone(request?.phone);
};

const enqueueSend = (email: string, subject: string, body: string) => {
  sendQueue = sendQueue.catch(() => undefined).then(async () => {
    try {
      if (state !== 'ready' || !client) {
        pendingMessages.push({ email, subject, body });
        setTimeout(flushPendingMessages, 5000);
        return;
      }
      const phone = await resolvePhone(email);
      if (!phone) {
        await auditWhatsApp('WHATSAPP_DELIVERY_FAILED', email, { subject, reason: 'No valid phone number found' });
        return;
      }
      await client.sendMessage(`${phone}@c.us`, `*${subject}*\n\n${body}`);
      await auditWhatsApp('WHATSAPP_DELIVERY_SENT', email, { subject, phone: `${phone.slice(0, 4)}******${phone.slice(-2)}` });
      // Limit burst traffic from classroom announcements.
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      console.warn('[WhatsApp] Delivery failed for', email, error instanceof Error ? error.message : error);
      await auditWhatsApp('WHATSAPP_DELIVERY_FAILED', email, { subject, reason: error instanceof Error ? error.message : String(error) });
    }
  });
};

const flushPendingMessages = () => {
  if (state !== 'ready' || !client || !pendingMessages.length) return;
  const messages = pendingMessages.splice(0, pendingMessages.length);
  for (const message of messages) enqueueSend(message.email, message.subject, message.body);
};

export const queueWhatsAppForEmail = (email: string, subject: string, body: string) => {
  const isVerificationMessage = /verify|verification|ইমেইল যাচাই/i.test(subject);
  const whatsappBody = isVerificationMessage
    ? 'আপনার Grav Academy ইমেইলে একটি verification link পাঠানো হয়েছে। অনুগ্রহ করে email inbox বা spam folder চেক করে সেই link-এ click করে আপনার ইমেইল verify করুন।'
    : body;
  const whatsappSubject = isVerificationMessage ? 'ইমেইল যাচাই করুন' : subject;
  pendingMessages.push({ email, subject: whatsappSubject, body: whatsappBody });
  flushPendingMessages();
};

export const sendWhatsAppToPhone = async (rawPhone: string, message: string): Promise<void> => {
  if (state !== 'ready' || !client) throw new Error('WhatsApp is not connected');
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new Error('A valid Bangladesh phone number is required');
  const recipient = await client.getNumberId(phone);
  if (!recipient) throw new Error('This phone number is not registered on WhatsApp');
  await client.sendMessage(recipient._serialized, message);
};
