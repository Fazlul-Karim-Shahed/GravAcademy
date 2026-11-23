import { google } from 'googleapis';
import stream from 'stream';

export type ManagedDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
};

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
 * Upload a file directly to configured Google Drive
 */
export const uploadFileToDrive = async (
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  folderId?: string
): Promise<{ fileId: string; webViewLink?: string }> => {
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
};

/**
 * Stream file binary directly from Google Drive to express response
 */
export const getDriveFileStream = async (fileId: string) => {
  const drive = getDriveClient();
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return response.data;
};

/** Lists only files inside Grav Academy's configured upload folder. */
export const listManagedDriveFiles = async (): Promise<ManagedDriveFile[]> => {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured.');

  const drive = getDriveClient();
  const files: ManagedDriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: 100,
      pageToken,
      orderBy: 'createdTime desc',
      fields: 'nextPageToken, files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    for (const file of response.data.files || []) {
      if (!file.id) continue;
      files.push({
        id: file.id,
        name: file.name || 'Unnamed file',
        mimeType: file.mimeType || 'application/octet-stream',
        sizeBytes: Number(file.size || 0),
        createdTime: file.createdTime || undefined,
        modifiedTime: file.modifiedTime || undefined,
        webViewLink: file.webViewLink || undefined,
      });
    }
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
};

/** Moves a configured-folder file to Google Drive Trash so it remains recoverable. */
export const trashManagedDriveFile = async (fileId: string): Promise<void> => {
  const drive = getDriveClient();
  await drive.files.update({
    fileId,
    requestBody: { trashed: true },
    supportsAllDrives: true,
  });
};
