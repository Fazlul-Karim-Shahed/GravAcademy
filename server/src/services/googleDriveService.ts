import { google } from 'googleapis';
import stream from 'stream';

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

  return {
    fileId: response.data.id,
    webViewLink: response.data.webViewLink || undefined,
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
