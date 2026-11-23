import mongoose from 'mongoose';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditLog } from '../models/AuditLog';
import { listManagedDriveFiles, ManagedDriveFile, trashManagedDriveFile } from '../services/googleDriveService';

const EXCLUDED_COLLECTIONS = new Set([
  'auditlogs',
  'emailverificationtokens',
  'passwordresettokens',
]);

const DRIVE_ID_PATTERNS = [
  /(?:lh3\.googleusercontent\.com\/d\/|drive\.google\.com\/file\/d\/)([A-Za-z0-9_-]{20,})/g,
  /drive\.google\.com\/(?:open|uc)\?[^\s"']*?\bid=([A-Za-z0-9_-]{20,})/g,
];

const extractDriveIds = (value: string, ids: Set<string>) => {
  for (const pattern of DRIVE_ID_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(value))) ids.add(match[1]);
  }
};

const collectDriveIds = (value: unknown, ids: Set<string>, visited = new WeakSet<object>()) => {
  if (typeof value === 'string') {
    extractDriveIds(value, ids);
    return;
  }
  if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) return;
  if (visited.has(value as object)) return;
  visited.add(value as object);
  if (Array.isArray(value)) {
    for (const item of value) collectDriveIds(item, ids, visited);
    return;
  }
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    // Protected lesson documents store their Drive ID as a plain field rather
    // than a public Drive URL, so include that explicit database reference.
    if (key === 'googleDriveFileId' && typeof nestedValue === 'string' && /^[A-Za-z0-9_-]{20,}$/.test(nestedValue)) {
      ids.add(nestedValue);
    }
    collectDriveIds(nestedValue, ids, visited);
  }
};

/**
 * Scans current database records only when an administrator explicitly requests it.
 * Audit/token collections are excluded so historic records never keep old uploads alive.
 */
const getReferencedDriveIds = async (): Promise<Set<string>> => {
  const database = mongoose.connection.db;
  if (!database) throw new Error('Database connection is unavailable.');
  const referencedIds = new Set<string>();
  const collections = await database.listCollections({}, { nameOnly: true }).toArray();

  for (const { name } of collections) {
    if (!name || EXCLUDED_COLLECTIONS.has(name)) continue;
    const cursor = database.collection(name).find({}, { batchSize: 100 });
    for await (const document of cursor) collectDriveIds(document, referencedIds);
  }
  return referencedIds;
};

const serializeFile = (file: ManagedDriveFile) => ({
  ...file,
  createdTime: file.createdTime || null,
  modifiedTime: file.modifiedTime || null,
  webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
});

export const scanDriveCleanup = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [driveFiles, referencedIds] = await Promise.all([listManagedDriveFiles(), getReferencedDriveIds()]);
    // The browser performs the used/unused comparison and all filtering. The server
    // only reads the two sources that must remain private: Drive and MongoDB.
    return res.status(200).json({
      success: true,
      data: {
        files: driveFiles.map(serializeFile),
        referencedIds: [...referencedIds],
      },
    });
  } catch (error: any) {
    console.error('Drive cleanup scan error:', error);
    return res.status(500).json({ success: false, message: error?.message || 'Google Drive scan করা যায়নি।' });
  }
};

export const trashUnusedDriveFiles = async (req: AuthenticatedRequest, res: Response) => {
  const incomingFileIds: unknown[] = Array.isArray(req.body?.fileIds) ? req.body.fileIds : [];
  const fileIds = [...new Set(incomingFileIds.filter((id): id is string => typeof id === 'string'))];
  if (!fileIds.length) return res.status(400).json({ success: false, message: 'Delete করার জন্য অন্তত একটি file নির্বাচন করুন।' });
  if (fileIds.length > 100) return res.status(400).json({ success: false, message: 'একবারে সর্বোচ্চ 100টি file Trash করা যাবে।' });

  try {
    const [driveFiles, referencedIds] = await Promise.all([listManagedDriveFiles(), getReferencedDriveIds()]);
    const managedById = new Map(driveFiles.map((file) => [file.id, file]));
    const safeFiles = fileIds.map((id) => managedById.get(id)).filter((file): file is ManagedDriveFile => Boolean(file) && !referencedIds.has(file!.id));
    const skippedIds = fileIds.filter((id) => !safeFiles.some((file) => file.id === id));

    await Promise.all(safeFiles.map((file) => trashManagedDriveFile(file.id)));
    if (safeFiles.length && req.user) {
      await AuditLog.create({
        actorId: req.user._id,
        actorEmail: req.user.email,
        action: 'GOOGLE_DRIVE_UNUSED_FILES_TRASHED',
        resourceType: 'GoogleDrive',
        metadata: { fileIds: safeFiles.map((file) => file.id), fileNames: safeFiles.map((file) => file.name), skippedIds },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    return res.status(200).json({
      success: true,
      message: `${safeFiles.length}টি unused file Google Drive Trash-এ পাঠানো হয়েছে।`,
      data: { trashedIds: safeFiles.map((file) => file.id), skippedIds },
    });
  } catch (error: any) {
    console.error('Drive cleanup trash error:', error);
    return res.status(500).json({ success: false, message: error?.message || 'File Trash করা যায়নি।' });
  }
};
