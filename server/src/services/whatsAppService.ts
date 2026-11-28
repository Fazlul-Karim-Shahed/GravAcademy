import path from 'path';
import fs from 'fs/promises';
import QRCode from 'qrcode';
import makeWASocket, { Browsers, DisconnectReason, useMultiFileAuthState, WASocket } from '@whiskeysockets/baileys';
import { User } from '../models/User';
import { EnrollmentRequest } from '../models/EnrollmentRequest';
import { AuditLog } from '../models/AuditLog';

type ConnectionState = 'starting' | 'qr' | 'ready' | 'disconnected' | 'error';
let client: WASocket | null = null;
let state: ConnectionState = 'starting';
let qrImage: string | null = null;
let lastError: string | null = null;
let sendQueue: Promise<void> = Promise.resolve();
const pendingMessages: Array<{ email: string; subject: string; body: string }> = [];
let intentionalDisconnect = false;

const auditWhatsApp = async (action: string, email: string, metadata: Record<string, any>) => { try { await AuditLog.create({ action, resourceType: 'WhatsApp', actorEmail: email, metadata }); } catch (error) { console.warn('[WhatsApp] Audit log failed:', error instanceof Error ? error.message : error); } };
export const getWhatsAppStatus = () => ({ state, qrImage, lastError });

export const startWhatsApp = async () => {
  if (client) return;
  intentionalDisconnect = false;
  state = 'starting';
  const sessionPath = process.env.WHATSAPP_SESSION_PATH || path.resolve(process.cwd(), '.baileys_auth');
  try {
    const { state: authState, saveCreds } = await useMultiFileAuthState(sessionPath);
    const socket = makeWASocket({ auth: authState, browser: Browsers.ubuntu('Chrome'), printQRInTerminal: false, syncFullHistory: false, markOnlineOnConnect: false, shouldIgnoreJid: (jid) => jid === 'status@broadcast' });
    client = socket;
    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) { state = 'qr'; lastError = null; try { qrImage = await QRCode.toDataURL(qr, { margin: 2, width: 320 }); } catch { state = 'error'; lastError = 'QR code could not be generated'; } }
      if (connection === 'open') { state = 'ready'; qrImage = null; lastError = null; console.info('[WhatsApp] Baileys connected'); flushPendingMessages(); }
      if (connection === 'close') {
        client = null; qrImage = null; state = 'disconnected';
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = !intentionalDisconnect && statusCode !== DisconnectReason.loggedOut;
        lastError = statusCode === DisconnectReason.loggedOut ? 'WhatsApp session logged out. Scan a new QR code.' : String(lastDisconnect?.error || 'Connection closed');
        if (shouldReconnect) setTimeout(() => { void startWhatsApp(); }, 5000);
      }
    });
  } catch (error) { client = null; state = 'error'; lastError = error instanceof Error ? error.message : 'Initialization failed'; console.warn('[WhatsApp] Baileys startup failed:', lastError); if (!intentionalDisconnect) setTimeout(() => { void startWhatsApp(); }, 10000); }
};

export const disconnectWhatsApp = async () => { intentionalDisconnect = true; const activeClient = client; client = null; try { await activeClient?.logout(); } catch { /* continue cleanup */ } const sessionPath = process.env.WHATSAPP_SESSION_PATH || path.resolve(process.cwd(), '.baileys_auth'); await fs.rm(sessionPath, { recursive: true, force: true }); state = 'disconnected'; qrImage = null; lastError = null; };
const normalizePhone = (raw?: string): string | null => { const digits = (raw || '').replace(/\D/g, ''); if (/^8801\d{9}$/.test(digits)) return digits; if (/^01\d{9}$/.test(digits)) return `88${digits}`; if (/^1\d{9}$/.test(digits)) return `880${digits}`; return null; };
const resolvePhone = async (email: string): Promise<string | null> => { const normalizedEmail = email.trim().toLowerCase(); const user = await User.findOne({ email: normalizedEmail }).select('phone').lean(); if (user?.phone) return normalizePhone(user.phone); const request = await EnrollmentRequest.findOne({ email: normalizedEmail }).sort({ createdAt: -1 }).select('phone').lean(); return normalizePhone(request?.phone); };
const enqueueSend = (email: string, subject: string, body: string) => { sendQueue = sendQueue.catch(() => undefined).then(async () => { try { if (state !== 'ready' || !client) { pendingMessages.push({ email, subject, body }); setTimeout(flushPendingMessages, 5000); return; } const phone = await resolvePhone(email); if (!phone) { await auditWhatsApp('WHATSAPP_DELIVERY_FAILED', email, { subject, reason: 'No valid phone number found' }); return; } await client.sendMessage(`${phone}@s.whatsapp.net`, { text: `*${subject}*\n\n${body}` }); await auditWhatsApp('WHATSAPP_DELIVERY_SENT', email, { subject, phone: `${phone.slice(0, 4)}******${phone.slice(-2)}` }); await new Promise((resolve) => setTimeout(resolve, 1500)); } catch (error) { console.warn('[WhatsApp] Delivery failed for', email, error instanceof Error ? error.message : error); await auditWhatsApp('WHATSAPP_DELIVERY_FAILED', email, { subject, reason: error instanceof Error ? error.message : String(error) }); } }); };
const flushPendingMessages = () => { if (state !== 'ready' || !client || !pendingMessages.length) return; const messages = pendingMessages.splice(0, pendingMessages.length); for (const message of messages) enqueueSend(message.email, message.subject, message.body); };
export const queueWhatsAppForEmail = (email: string, subject: string, body: string) => { const isVerificationMessage = /verify|verification|ইমেইল যাচাই/i.test(subject); const whatsappBody = isVerificationMessage ? 'আপনার Grav Academy ইমেইলে একটি verification link পাঠানো হয়েছে। অনুগ্রহ করে email inbox বা spam folder চেক করে সেই link-এ click করে আপনার ইমেইল verify করুন।' : body; pendingMessages.push({ email, subject: isVerificationMessage ? 'ইমেইল যাচাই করুন' : subject, body: whatsappBody }); flushPendingMessages(); };
export const sendWhatsAppToPhone = async (rawPhone: string, message: string): Promise<void> => { if (state !== 'ready' || !client) throw new Error('WhatsApp is not connected'); const phone = normalizePhone(rawPhone); if (!phone) throw new Error('A valid Bangladesh phone number is required'); const result = await client.onWhatsApp(`${phone}@s.whatsapp.net`); if (!result?.[0]?.exists) throw new Error('This phone number is not registered on WhatsApp'); await client.sendMessage(`${phone}@s.whatsapp.net`, { text: message }); };
