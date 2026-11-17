import { google } from 'googleapis';
import { EnrollmentRequest } from '../models/EnrollmentRequest';

const getGmail = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth });
};

const decodeBase64Url = (value?: string) => {
  if (!value) return '';
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
};

const collectText = (part: any): string => {
  if (!part) return '';
  const own = part.body?.data ? decodeBase64Url(part.body.data) : '';
  return own + (part.parts || []).map(collectText).join('\n');
};

const extractFailedRecipients = (text: string) => {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  return [...new Set(matches.map((email) => email.toLowerCase()))];
};

export const scanEmailBounces = async () => {
  const gmail = getGmail();
  if (!gmail) return;
  const list = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:(mailer-daemon OR postmaster) newer_than:2d',
    maxResults: 50,
  });
  for (const item of list.data.messages || []) {
    if (!item.id) continue;
    const message = await gmail.users.messages.get({ userId: 'me', id: item.id, format: 'full' });
    const text = `${message.data.snippet || ''}\n${collectText(message.data.payload)}`;
    if (!/(address not found|user unknown|mailbox unavailable|delivery incomplete|failed delivery|550|5\.1\.1)/i.test(text)) continue;
    const failedRecipients = extractFailedRecipients(text);
    if (!failedRecipients.length) continue;
    await EnrollmentRequest.updateMany(
      { isGuest: true, status: 'pending', email: { $in: failedRecipients } },
      { $set: { status: 'email_failed', reviewNote: 'Confirmation email bounced: recipient address was not found.', reviewedAt: new Date() } },
    );
  }
};
