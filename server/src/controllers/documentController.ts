import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { FileAsset } from '../models/FileAsset';
import { Enrollment } from '../models/Enrollment';
import { Lesson } from '../models/ContentHierarchy';
import { ROLES, UserRole } from '../types/roles';
import { uploadFileToDrive, getDriveFileStream } from '../services/googleDriveService';
import { AuditLog } from '../models/AuditLog';

/**
 * Upload Document: Receives file -> Uploads to Google Drive -> Stores FileAsset in MongoDB
 */
export const uploadDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Security: Validate file type (PDFs, docs, images)
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Only PDF, DOCX, and JPG/PNG are allowed.',
      });
    }

    // Sanitize filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');

    let driveFileId = '';

    // Check if Google Drive credentials are configured
    const isDriveConfigured =
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN;

    if (isDriveConfigured) {
      const driveRes = await uploadFileToDrive(sanitizedName, file.mimetype, file.buffer);
      driveFileId = driveRes.fileId;
    } else {
      // In development if credentials not yet supplied, log clear warning
      console.warn('⚠️ Google Drive OAuth credentials not configured. Using stub reference.');
      driveFileId = `stub_drive_${Date.now()}`;
    }

    const fileAsset = await FileAsset.create({
      originalName: file.originalname,
      sanitizedName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      googleDriveFileId: driveFileId,
      uploaderId: req.user?._id,
      referenceCount: 1,
    });

    await AuditLog.create({
      actorId: req.user?._id,
      actorEmail: req.user?.email,
      action: 'DOCUMENT_UPLOAD',
      resourceType: 'FileAsset',
      resourceId: fileAsset._id.toString(),
      metadata: { originalName: file.originalname, size: file.size, driveFileId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const directUrl = isDriveConfigured
      ? `https://drive.google.com/uc?export=view&id=${driveFileId}`
      : `/api/documents/${fileAsset._id}/stream`;

    return res.status(201).json({
      success: true,
      message: 'Document successfully uploaded and saved to Google Drive',
      data: {
        ...fileAsset.toObject(),
        url: directUrl,
        fileUrl: directUrl,
      },
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload document',
    });
  }
};

/**
 * Protected Document Streaming:
 * Verifies student enrollment or admin authorization before streaming file
 */
export const streamProtectedDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileAssetId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const fileAsset = await FileAsset.findById(fileAssetId);
    if (!fileAsset) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Role-based authorization check:
    // Superadmin, Admin, and Teacher always have access
    const isStaff = ([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TEACHER] as UserRole[]).includes(user.role);

    if (!isStaff) {
      // For student: Verify they are enrolled in the batch containing this document
      const lessonWithFile = await Lesson.findOne({ 'resources.fileAssetId': fileAssetId });
      if (!lessonWithFile) {
        return res.status(403).json({ success: false, message: 'Document access denied' });
      }

      const isEnrolled = await Enrollment.findOne({
        studentId: user._id,
        batchId: lessonWithFile.batchId,
        status: 'enrolled',
      });

      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not enrolled in the batch that owns this document.',
        });
      }
    }

    // Stream file from Google Drive
    res.setHeader('Content-Type', fileAsset.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileAsset.sanitizedName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const driveStream = await getDriveFileStream(fileAsset.googleDriveFileId);
    driveStream.pipe(res);
  } catch (error: any) {
    console.error('Protected document streaming error:', error);
    return res.status(500).json({ success: false, message: 'Failed to stream document' });
  }
};
