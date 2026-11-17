import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { disconnectWhatsApp, getWhatsAppStatus, sendWhatsAppToPhone } from '../services/whatsAppService';

export const getStatus = (_req: unknown, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.json({ success: true, data: getWhatsAppStatus() });
};

export const disconnect = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    await disconnectWhatsApp();
    return res.json({ success: true, message: 'WhatsApp account disconnected.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'WhatsApp disconnect failed.' });
  }
};

export const sendToStudent = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const message = String(req.body?.message || '').trim();
  if (!mongoose.isValidObjectId(userId) || !message || message.length > 2000) {
    return res.status(400).json({ success: false, message: 'Valid student and 1–2000 character message required.' });
  }
  const student = await User.findOne({ _id: userId, role: 'student' }).select('phone name');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
  if (!student.phone) return res.status(400).json({ success: false, message: 'Student phone number is missing.' });
  try {
    await sendWhatsAppToPhone(student.phone, message);
    await AuditLog.create({
      actorId: req.user?._id,
      actorEmail: req.user?.email,
      action: 'WHATSAPP_MESSAGE_SENT',
      resourceType: 'User',
      resourceId: student._id.toString(),
      metadata: { recipientName: student.name },
      ipAddress: req.ip,
    });
    return res.json({ success: true, message: 'WhatsApp accepted the message.' });
  } catch (error) {
    return res.status(503).json({ success: false, message: error instanceof Error ? error.message : 'WhatsApp send failed.' });
  }
};
