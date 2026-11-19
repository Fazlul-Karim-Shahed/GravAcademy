import { google } from 'googleapis';
import stream from 'stream';
import fs from 'fs';
import path from 'path';

const getDriveClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive credentials are not configured in server/.env');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: 'v3', auth: oauth2Client });
};

/**
 * Upload a file directly to configured Google Drive with automatic local storage fallback
 */
export const uploadFileToDrive = async (
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  folderId?: string
): Promise<{ fileId: string; webViewLink?: string }> => {
  try {
    const drive = getDriveClient();

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const targetFolder = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: targetFolder ? [targetFolder] : undefined,
      },
      media: {
        mimeType,
        body: bufferStream,
      },
      fields: 'id, name, webViewLink',
    });

    if (!response.data.id) {
      throw new Error('Google Drive upload failed to return file ID');
    }

    const fileId = response.data.id;

    // Make the file readable by anyone with the link so students can view it seamlessly
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permErr) {
      console.warn('Could not set public permission on Drive file:', permErr);
    }

    return {
      fileId,
      webViewLink: response.data.webViewLink || `https://lh3.googleusercontent.com/d/${fileId}`,
    };
  } catch (driveErr: any) {
    console.warn('⚠️ Google Drive upload error (e.g. insufficient permission), falling back to server local storage:', driveErr?.message);
    const subFolder = fileName.startsWith('avatar_') ? 'avatars' : 'documents';
    const uploadDir = path.resolve(__dirname, '../../public/uploads', subFolder);
    fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    const hostUrl = process.env.SERVER_URL || 'https://gravapi.138.2.92.182.nip.io';
    const localUrl = `${hostUrl.replace(/\/$/, '')}/uploads/${subFolder}/${fileName}`;
    return {
      fileId: `local_${fileName}`,
      webViewLink: localUrl,
    };
  }
};

/**
 * Stream file binary directly from Google Drive or local storage to express response
 */
export const getDriveFileStream = async (fileId: string) => {
  if (fileId.startsWith('local_')) {
    const fileName = fileId.replace(/^local_/, '');
    const subFolder = fileName.startsWith('avatar_') ? 'avatars' : 'documents';
    const filePath = path.resolve(__dirname, '../../public/uploads', subFolder, fileName);
    if (fs.existsSync(filePath)) {
      return fs.createReadStream(filePath);
    }
  }
  const drive = getDriveClient();
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return response.data;
};
