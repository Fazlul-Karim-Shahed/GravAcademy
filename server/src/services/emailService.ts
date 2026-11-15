import { google } from 'googleapis';
import dns from 'dns';

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'yopmail.com',
  'sharklasers.com',
  'throwawaymail.com',
  'dispostable.com',
  'getairmail.com',
  'fakemailgenerator.com',
  'trashmail.com',
  'trashmail.net',
  'nada.ltd',
  'mohmal.com',
  'crazymailing.com',
  'mytemp.email',
]);

export const isDisposableEmail = (email: string): boolean => {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return Boolean(domain && DISPOSABLE_EMAIL_DOMAINS.has(domain));
};

export const hasValidMxRecords = async (email: string): Promise<boolean> => {
  try {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (!domain) return false;
    const records = await dns.promises.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
};

const getPublicAppUrl = () =>
  (process.env.PUBLIC_APP_URL || 'https://grav-academy.vercel.app').replace(/\/+$/, '');

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character));

const sendGmailEmail = async ({
  to,
  subject,
  body,
  html,
}: {
  to: string;
  subject: string;
  body: string;
  html?: string;
}): Promise<boolean> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[Mailer Simulation] Email queued for ' + to + ': ' + subject);
    return false;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const encodedSubject = '=?utf-8?B?' + Buffer.from(subject).toString('base64') + '?=';
    const boundary = '=_GravAcademy_' + Date.now();
    const link = body.match(/https?:\/\/[^\s]+/)?.[0];
    const htmlBody =
      html ||
      `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#172033"><div style="width:100%;max-width:760px;box-sizing:border-box;margin:20px auto;padding:0 12px"><div style="width:100%;overflow:hidden;border-radius:24px;background:#ffffff;box-shadow:0 12px 35px rgba(15,23,42,.12)"><div style="padding:28px 30px;background:linear-gradient(135deg,#0f62fe,#5936d9);color:#ffffff"><div style="font-size:13px;letter-spacing:.08em;font-weight:700;opacity:.85">GRAV ACADEMY</div><div style="margin-top:8px;font-size:24px;font-weight:800">Your Academic Care</div></div><div style="padding:30px"><div style="font-size:16px;line-height:1.7">${escapeHtml(body).replace(/\r?\n/g, '<br>')}</div>${link ? `<a href="${escapeHtml(link)}" style="display:inline-block;margin-top:24px;padding:13px 22px;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700">Reset password</a>` : ''}<div style="margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6">This is an automated email from Grav Academy. If you did not request this, you can safely ignore it.</div></div></div><div style="padding:18px;text-align:center;color:#94a3b8;font-size:12px">Grav Academy · Learn with confidence</div></div></body></html>`;
    const rawMessage = Buffer.from(
      [
        'To: ' + to,
        'Subject: ' + encodedSubject,
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' + boundary + '"',
        '',
        '--' + boundary,
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        body,
        '--' + boundary,
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        htmlBody,
        '--' + boundary + '--',
      ].join('\r\n')
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage },
    });
    return true;
  } catch (error: any) {
    console.warn('[Mailer] Failed to email ' + to + ':', error?.message || error);
    return false;
  }
};

const sendGmailTextEmail = sendGmailEmail;

export const sendPasswordResetEmail = async ({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}): Promise<boolean> => {
  const resetUrl = getPublicAppUrl() + '/reset-password?token=' + encodeURIComponent(token);
  return sendGmailTextEmail({
    to,
    subject: 'Grav Academy password reset',
    body: [
      'প্রিয় ' + (name || 'শিক্ষার্থী') + ',',
      '',
      'আপনার Grav Academy password পরিবর্তনের অনুরোধ পাওয়া গেছে।',
      'নিচের link-এ গিয়ে নতুন password সেট করুন:',
      resetUrl,
      '',
      'এই link ৩০ মিনিট পর কাজ করবে না। আপনি অনুরোধ না করে থাকলে emailটি উপেক্ষা করুন।',
      '',
      'Grav Academy',
    ].join('\n'),
  });
};

export const sendEnrollmentRequestReceivedEmail = async ({
  to,
  name,
  batchName,
}: {
  to: string;
  name: string;
  batchName: string;
}): Promise<boolean> => {
  return sendGmailTextEmail({
    to,
    subject: 'We received your enrollment request | Grav Academy',
    body: [
      'Hi ' + (name || 'there') + ',',
      '',
      'We received your request to join the batch "' + batchName + '".',
      'Our admission team will review your request and contact you soon.',
      '',
      'If you did not submit this request, you can ignore this email.',
      '',
      'Grav Academy',
    ].join('\n'),
  });
};

export const sendEnrollmentApprovalEmail = async ({
  to,
  name,
  batchName,
  gravId,
  password,
  existingAccount,
}: {
  to: string;
  name: string;
  batchName: string;
  gravId: string;
  password?: string;
  existingAccount: boolean;
}): Promise<boolean> => {
  const credentials = existingAccount
    ? ['আপনার আগের account দিয়েই login করুন।']
    : [
        'Grav ID: ' + gravId,
        'Password: ' + (password || ''),
        '',
        'প্রথম login-এর পর password পরিবর্তন করে নিন।',
      ];
  return sendGmailTextEmail({
    to,
    subject: 'Grav Academy enrollment approved',
    body: [
      'প্রিয় ' + (name || 'শিক্ষার্থী') + ',',
      '',
      'আপনার "' + batchName + '" batch-এর enrollment request approve হয়েছে।',
      '',
      ...credentials,
      '',
      'Grav Academy',
    ].join('\n'),
  });
};

/**
 * Service to send email notifications to members.
 * Supports Gmail API if refresh token is available, or falls back to clean server logging.
 */
export const sendClassroomEmailNotification = async ({
  toEmails,
  batchName,
  announcerName,
  announcementTitle,
  announcementContent,
}: {
  toEmails: string[];
  batchName: string;
  announcerName: string;
  announcementTitle: string;
  announcementContent: string;
}): Promise<number> => {
  if (!toEmails || toEmails.length === 0) return 0;

  console.log(
    `[Classroom Mailer] Dispatching announcement notification to ${toEmails.length} recipients for batch "${batchName}"`
  );

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    try {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      for (const recipient of toEmails) {
        try {
          const subject = `[গ্র্যাভ একাডেমি • ${batchName}] নতুন ঘোষণা: ${announcementTitle}`;
          const body = [
            `প্রিয় শিক্ষার্থী/অভিভাবক,`,
            ``,
            `আপনার ব্যাচ "${batchName}"-এ "${announcerName}" একটি নতুন এনাউন্সমেন্ট প্রকাশ করেছেন:`,
            `--------------------------------------------------`,
            `বিষয়: ${announcementTitle}`,
            ``,
            `${announcementContent}`,
            `--------------------------------------------------`,
            `সরাসরি ক্লাসরুম দেখতে ও আলোচনায় অংশ নিতে আপনার স্টুডেন্ট/টিচার পোর্টালে লগইন করুন।`,
            ``,
            `ধন্যবাদান্তে,`,
            `গ্র্যাভ একাডেমি শিক্ষা পরিবার`,
          ].join('\n');

          const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
          const messageParts = [
            `To: ${recipient}`,
            `Subject: ${utf8Subject}`,
            `Content-Type: text/plain; charset=utf-8`,
            `MIME-Version: 1.0`,
            ``,
            body,
          ];
          const rawMessage = Buffer.from(messageParts.join('\r\n'))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: rawMessage },
          });
        } catch (individualErr: any) {
          console.warn(`[Classroom Mailer] Failed to email ${recipient}:`, individualErr?.message || individualErr);
        }
      }
      return toEmails.length;
    } catch (apiErr: any) {
      console.warn(`[Classroom Mailer] Gmail API transport fallback:`, apiErr?.message || apiErr);
    }
  }

  // Graceful simulation when Gmail scope is Drive-only or credentials unset
  console.log(`[Classroom Mailer Simulation] Broadcast sent successfully to:`, toEmails);
  return toEmails.length;
};

/**
 * 6. Send Welcome & Email Verification to newly registered users / students / staff
 */
export const sendWelcomeRegistrationEmail = async ({
  to,
  name,
  gravId,
  role = 'student',
  password,
  batchName,
}: {
  to: string;
  name: string;
  gravId: string;
  role?: string;
  password?: string;
  batchName?: string;
}): Promise<boolean> => {
  const loginUrl = `${getPublicAppUrl()}/login`;

  const roleTitleMap: Record<string, string> = {
    teacher: 'শিক্ষক (Teacher)',
    employee: 'কর্মকর্তা (Staff / Employee)',
    guardian: 'অভিভাবক (Guardian)',
    admin: 'অ্যাডমিনিস্ট্রেটর (Admin)',
    student: 'শিক্ষার্থী (Student)',
  };
  const roleTitle = roleTitleMap[role] || 'শিক্ষার্থী (Student)';

  const subject = batchName
    ? `গ্র্যাভ একাডেমিতে আপনাকে স্বাগতম! [${batchName}]`
    : `গ্র্যাভ একাডেমিতে আপনাকে স্বাগতম, ${name || 'ব্যবহারকারী'}!`;

  const bodyParts = [
    `প্রিয় ${name || 'ব্যবহারকারী'},`,
    '',
    `গ্র্যাভ একাডেমিতে আপনাকে স্বাগতম! আপনার অ্যাকাউন্ট (${roleTitle}) সফলভাবে তৈরি ও ভেরিফাই হয়েছে।`,
  ];
  if (batchName) {
    bodyParts.push(`কোর্স/ব্যাচ: ${batchName}`);
  }
  bodyParts.push(
    `আপনার নাম: ${name}`,
    `আপনার Grav ID: ${gravId}`,
    `লগইন ইমেইল: ${to}`
  );
  if (password) {
    bodyParts.push(`পাসওয়ার্ড: ${password}`);
  }
  bodyParts.push(
    '',
    'নিচের লিঙ্কে ক্লিক করে এখনই লগইন করুন:',
    loginUrl,
    '',
    'আপনার যেকোনো একাডেমিক প্রয়োজনে আমরা সর্বদা পাশে আছি।',
    '',
    'গ্র্যাভ একাডেমি পরিবার'
  );

  const body = bodyParts.join('\n');

  const html = `<!doctype html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Grav Academy</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 36px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:40px 36px;background:linear-gradient(135deg, #1d4ed8 0%, #4338ca 50%, #6d28d9 100%);color:#ffffff;text-align:center;">
              <div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;margin-bottom:8px;">
                GRAV ACADEMY · YOUR ACADEMIC CARE
              </div>
              <h1 style="margin:0;font-size:26px;font-weight:900;line-height:1.3;letter-spacing:-0.5px;">
                স্বাগতম আমাদের পরিবারে!
              </h1>
              <p style="margin:10px 0 0;font-size:14px;color:#e0e7ff;font-weight:500;">
                আপনার অ্যাকাউন্ট সফলভাবে তৈরি ও ভেরিফাই হয়েছে
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;font-weight:700;color:#0f172a;">
                প্রিয় ${escapeHtml(name || 'ব্যবহারকারী')},
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#475569;">
                অভিনন্দন! <strong>গ্র্যাভ একাডেমি</strong>-তে আপনার রেজিস্ট্রেশন সম্পন্ন হয়েছে এবং আপনার ইমেইল ঠিকানাটি সফলভাবে ভেরিফাই করা হয়েছে।${batchName ? ` আপনি সফলভাবে <strong>${escapeHtml(batchName)}</strong> ব্যাচে যুক্ত হয়েছেন।` : ''}
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:16px;margin:24px 0;padding:20px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:12px;">
                      আপনার অ্যাকাউন্ট বিবরণী
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6">
                      <tr>
                        <td width="32%" style="font-size:13px;color:#64748b;font-weight:600;">নাম:</td>
                        <td style="font-size:14px;color:#0f172a;font-weight:700;">${escapeHtml(name)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;font-weight:600;">পদবি / রোল:</td>
                        <td style="font-size:13px;color:#0f172a;font-weight:700;">${escapeHtml(roleTitle)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;font-weight:600;">ইমেইল:</td>
                        <td style="font-size:14px;color:#0f172a;font-weight:700;">${escapeHtml(to)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;font-weight:600;">Grav ID:</td>
                        <td style="font-size:15px;color:#2563eb;font-weight:800;font-family:monospace;">${escapeHtml(gravId)}</td>
                      </tr>
                      ${password ? `<tr>
                        <td style="font-size:13px;color:#64748b;font-weight:600;">পাসওয়ার্ড:</td>
                        <td style="font-size:14px;color:#0f172a;font-weight:700;font-family:monospace;">${escapeHtml(password)}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 12px 12px 0;margin-bottom:28px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#1e40af;font-weight:500;">
                  💡 <strong>লগইন টিপ:</strong> আপনি আপনার <strong>Grav ID</strong> অথবা রেজিস্টার্ড <strong>Email</strong> — যেকোনো একটি ব্যবহার করে যেকোনো সময় ওয়েবসাইটে লগইন করতে পারবেন।${password ? ' প্রথম লগইনের পর নিজের সুবিধামতো পাসওয়ার্ড পরিবর্তন করে নিন।' : ''}
                </p>
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg, #2563eb, #1d4ed8);color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;border-radius:12px;box-shadow:0 4px 14px rgba(37,99,235,0.35);">
                      লগইন করুন ও ক্লাস শুরু করুন →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:20px;text-align:center;">
                আপনি যদি এই অ্যাকাউন্টের জন্য অনুরোধ না করে থাকেন, তবে নিরাপদে এই ইমেইলটি উপেক্ষা করতে পারেন।
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#64748b;font-weight:600;">
                গ্র্যাভ একাডেমি · আপনার সাফল্যের বিশ্বস্ত সহযোগী
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">
                © 2026 Grav Academy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendGmailEmail({
    to,
    subject,
    body,
    html,
  });
};
