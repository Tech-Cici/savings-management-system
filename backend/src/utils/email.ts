import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.EMAIL_FROM || 'no-reply@example.com';

export const transporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    })
  : null;

export async function sendEmail(to: string, subject: string, html: string) {
  // If no transporter, try Ethereal in development for testing
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      const testAccount = await nodemailer.createTestAccount();
      const etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const info = await etherealTransporter.sendMail({ from: fromEmail, to, subject, html });
      const url = nodemailer.getTestMessageUrl(info);
      console.log(`[email] Sent via Ethereal to ${to}. Preview URL: ${url}`);
      return;
    }
    console.warn('[email] SMTP not configured; skipping email to', to, 'subject:', subject);
    return;
  }
  try {
    await transporter.sendMail({ from: fromEmail, to, subject, html });
  } catch (err) {
    // Fallback to Ethereal in non-production if real SMTP fails (e.g., bad credentials)
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[email] Primary SMTP failed, falling back to Ethereal:', (err as Error).message);
      const testAccount = await nodemailer.createTestAccount();
      const etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const info = await etherealTransporter.sendMail({ from: fromEmail, to, subject, html });
      const url = nodemailer.getTestMessageUrl(info);
      console.log(`[email] Sent via Ethereal to ${to}. Preview URL: ${url}`);
      return;
    }
    throw err;
  }
}

export function buildRegistrationPendingEmail(name: string, otp: string) {
  return {
    subject: 'Confirm your email and pending admin verification',
    html: `
      <h2>Hello ${name},</h2>
      <p>Thanks for registering. Please confirm your email using the OTP below:</p>
      <p style="font-size:18px;font-weight:bold;">${otp}</p>
      <p>After confirming, an administrator will verify your account. You will receive another email once verified.</p>
      <p>If you did not sign up, please ignore this email.</p>
    `,
  };
}

export function buildVerifiedEmail(name: string) {
  return {
    subject: 'Your account has been verified',
    html: `
      <h2>Hello ${name},</h2>
      <p>Your account has been verified by an administrator. You can now log in.</p>
    `,
  };
}

export function buildLoginOtpEmail(name: string, otp: string) {
  return {
    subject: 'Your login OTP code',
    html: `
      <h2>Hello ${name},</h2>
      <p>Your account has been verified. Use the OTP below to complete your login:</p>
      <p style="font-size:18px;font-weight:bold;">${otp}</p>
      <p>The code expires in 10 minutes.</p>
    `,
  };
}

export function buildVerifiedWithOtpEmail(name: string, otp: string) {
  return {
    subject: 'Your account has been verified – Login OTP inside',
    html: `
      <h2>Hello ${name},</h2>
      <p>Your account has been verified by an administrator.</p>
      <p>Use this one-time code to complete your login (expires in 10 minutes):</p>
      <p style="font-size:18px;font-weight:bold;">${otp}</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  };
}

export function buildRejectedEmail(name: string, reason?: string) {
  return {
    subject: 'Your account verification was rejected',
    html: `
      <h2>Hello ${name},</h2>
      <p>We're sorry, but your account verification request was rejected by an administrator.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you believe this was a mistake, please contact support or try registering again with correct details.</p>
    `,
  };
}


