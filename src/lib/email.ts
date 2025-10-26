// @ts-ignore - using nodemailer without types (ensure it is installed). If types needed, install @types/nodemailer.
import nodemailer from 'nodemailer';
import { createActionToken } from './actionToken';

// Create a transporter using environment variables; fallback to console if missing
export function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env as Record<string,string|undefined>;
  if (!SMTP_HOST || !SMTP_PORT) {
    return null; // indicate fallback mode
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export async function sendVerificationEmail(opts: { to: string; username: string; token: string; baseUrl: string; isAdmin?: boolean; }) {
  const { to, username, token, baseUrl, isAdmin } = opts;
  const verifyLink = `${baseUrl.replace(/\/$/, '')}/api/auth/verify-email?token=${encodeURIComponent(token)}&u=${encodeURIComponent(username)}`;
  const subject = isAdmin ? 'Admin Email Verification' : 'Verify your email';
  const html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${subject}</title>
      <style>
        :root { color-scheme: light dark; }
        body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background:#f5f7fa; padding:24px; }
        .container { max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e5e9f0; border-radius:10px; padding:32px 36px; }
        h1 { font-size:20px; margin:0 0 16px; color:#111827; }
        p { line-height:1.5; font-size:14px; color:#374151; margin:0 0 14px; }
        .btn-wrap { text-align:center; margin:28px 0 32px; }
        .btn { display:inline-block; background:#4f46e5; color:#ffffff !important; text-decoration:none; padding:14px 32px; font-size:14px; font-weight:600; border-radius:8px; letter-spacing:.5px; box-shadow:0 4px 10px rgba(79,70,229,.35); }
        .btn:hover { background:#4338ca; }
        .meta { font-size:12px; color:#6b7280; margin-top:32px; }
        a.plain { color:#4f46e5; word-break:break-all; font-size:12px; }
        .badge { display:inline-block; background:#eef2ff; color:#3730a3; font-size:11px; padding:2px 8px; border-radius:999px; font-weight:600; margin-left:8px; }
        @media (prefers-color-scheme: dark){ body { background:#0f172a; } .container { background:#1e293b; border-color:#334155; } h1 { color:#f1f5f9; } p { color:#e2e8f0; } .meta { color:#94a3b8; } }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${isAdmin ? 'Admin Email Verification' : 'Verify Your Email'} ${isAdmin ? '<span class="badge">ADMIN</span>' : ''}</h1>
        <p>Hello <strong>${username}</strong>,</p>
        <p>Please confirm your ${isAdmin ? 'admin ' : ''}account email to activate secure access.</p>
        <div class="btn-wrap">
          <a class="btn" href="${verifyLink}" target="_blank" rel="noopener">Verify Email</a>
        </div>
        <p>This link will expire in <strong>24 hours</strong>. For your security it can be used only once.</p>
        <p>If the button doesn’t work, copy and paste this URL:</p>
        <p><a class="plain" href="${verifyLink}">${verifyLink}</a></p>
        <p class="meta">If you didn’t create this account, you can safely ignore this message and no changes will occur.</p>
        <p class="meta">— Task App Notification Service</p>
      </div>
    </body>
  </html>`;
  const text = `Hello ${username}\n\nPlease verify your ${isAdmin ? 'admin ' : ''}account by opening the link below (valid 24h):\n${verifyLink}\n\nIf you did not create this account you can ignore this message.`;
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[DEV:EMAIL:VERIFY]', { to, verifyLink });
    return { simulated: true, verifyLink };
  }
  await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html, text });
  return { simulated: false, verifyLink };
}

export async function sendRequestAcceptedEmail(opts: { baseUrl: string; adminEmail: string; requestId: string; project: string; requester: string; acceptedBy: string; adminUsername?: string; }) {
  const { baseUrl, adminEmail, requestId, project, requester, acceptedBy, adminUsername } = opts;
  const approveToken = createActionToken(requestId, 'approve', undefined, adminUsername);
  const denyToken = createActionToken(requestId, 'deny', undefined, adminUsername);
  // Add redirect=1 so clicking Approve/Deny performs action then redirects to admin page.
  // (Legacy emails with silent=1 are still supported by the API.)
  const approveLink = `${baseUrl.replace(/\/$/, '')}/api/requests/action?t=${encodeURIComponent(approveToken)}&redirect=1`;
  const denyLink = `${baseUrl.replace(/\/$/, '')}/api/requests/action?t=${encodeURIComponent(denyToken)}&redirect=1`;
  const adminPage = `${baseUrl.replace(/\/$/, '')}/request-form/admin`;
  const subject = `Request Accepted: ${project}`;
  const html = `<!DOCTYPE html><html><head><meta charSet="UTF-8"/><style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f7fa;padding:24px;margin:0;}
  .card{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e9f0;border-radius:14px;padding:32px 36px;}
  h1{font-size:20px;margin:0 0 16px;color:#111827;}
  p{font-size:14px;line-height:1.5;margin:0 0 14px;color:#374151;}
  /* Button container now avoids flex/gap for broader email client support */
  .btns{margin:28px 0 8px;}
  a.btn{text-align:center;text-decoration:none;padding:14px 18px;font-size:13px;font-weight:600;border-radius:10px;color:#fff;letter-spacing:.5px;box-shadow:0 4px 12px rgba(0,0,0,.18);display:inline-block;min-width:120px;}
  a.approve{background:#059669;}
  a.approve:hover{background:#047857;}
  a.deny{background:#dc2626;}
  a.deny:hover{background:#b91c1c;}
  a.manage{background:#2563eb;}
  a.manage:hover{background:#1d4ed8;}
  .meta{font-size:11px;color:#6b7280;margin-top:28px;}
  @media(prefers-color-scheme:dark){body{background:#0f172a}.card{background:#1e293b;border-color:#334155}h1{color:#f1f5f9}p{color:#e2e8f0}.meta{color:#94a3b8}}
  </style></head><body><div class="card">
  <h1>Request Accepted</h1>
  <p>The request <strong>${project}</strong> from <strong>${requester}</strong> was accepted by <strong>${acceptedBy}</strong>.</p>
  <p>You can approve or deny directly below:</p>
  <div class="btns">
    <a class="btn approve" style="margin:0 12px 12px 0;" href="${approveLink}" target="_blank" rel="noopener">Approve</a>
    <a class="btn deny" style="margin:0 12px 12px 0;" href="${denyLink}" target="_blank" rel="noopener">Deny</a>
    <a class="btn manage" style="margin:0 0 12px 0;" href="${adminPage}" target="_blank" rel="noopener">Go to Admin Page</a>
  </div>
  <p class="meta">Links are valid for 24 hours. Actions are single-use. If already processed, they have no effect.</p>
  <p class="meta">Request ID: ${requestId}</p>
  </div></body></html>`;
  const text = `Request Accepted\n\nProject: ${project}\nRequester: ${requester}\nAccepted By: ${acceptedBy}\n\nApprove: ${approveLink}\nDeny: ${denyLink}\nAdmin Page: ${adminPage}\n(Links valid 24h)`;
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[DEV:EMAIL:REQUEST_ACCEPTED]', { to: adminEmail, approveLink, denyLink });
    return { simulated: true };
  }
  await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: adminEmail, subject, html, text });
  return { simulated: false };
}

