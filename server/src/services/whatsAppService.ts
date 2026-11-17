import path from 'path';
import QRCode from 'qrcode';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { User } from '../models/User';
import { EnrollmentRequest } from '../models/EnrollmentRequest';

type ConnectionState = 'starting' | 'qr' | 'ready' | 'disconnected' | 'error';
let client: Client | null = null;
let state: ConnectionState = 'starting';
let qrImage: string | null = null;
let lastError: string | null = null;
let sendQueue: Promise<void> = Promise.resolve();

export const getWhatsAppStatus = () => ({ state, qrImage, lastError });

export const startWhatsApp = () => {
  if (client) return;
  const sessionPath = process.env.WHATSAPP_SESSION_PATH || path.resolve(process.cwd(), '.wwebjs_auth');
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath, clientId: 'gravacademy' }),
    puppeteer: {
      headless: true,
      ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
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
  });
  client.initialize().catch((error) => {
    state = 'error';
    lastError = error instanceof Error ? error.message : 'Initialization failed';
    console.warn('[WhatsApp] Startup failed:', lastError);
  });
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

export const queueWhatsAppForEmail = (email: string, subject: string, body: string) => {
  if (state !== 'ready' || !client) return;
  sendQueue = sendQueue.catch(() => undefined).then(async () => {
    try {
      if (state !== 'ready' || !client) return;
      const phone = await resolvePhone(email);
      if (!phone) return;
      await client.sendMessage(`${phone}@c.us`, `*${subject}*\n\n${body}`);
      // Limit burst traffic from classroom announcements.
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      console.warn('[WhatsApp] Delivery failed for', email, error instanceof Error ? error.message : error);
    }
  });
};

export const sendWhatsAppToPhone = async (rawPhone: string, message: string): Promise<void> => {
  if (state !== 'ready' || !client) throw new Error('WhatsApp is not connected');
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new Error('A valid Bangladesh phone number is required');
  const recipient = await client.getNumberId(phone);
  if (!recipient) throw new Error('This phone number is not registered on WhatsApp');
  await client.sendMessage(recipient._serialized, message);
};
