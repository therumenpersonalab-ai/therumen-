import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail({ to, subject, text }) {
  const tx = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@lumen.local';
  if (!tx) {
    return { sent: false, skipped: true };
  }
  await tx.sendMail({ from, to, subject, text });
  return { sent: true };
}
