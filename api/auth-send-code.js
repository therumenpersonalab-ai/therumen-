import crypto from 'crypto';
import { initDb, pool } from '../lib/db.js';

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signToken(payload) {
  const secret = process.env.AUTH_SECRET || 'change-this-auth-secret';
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const { email, purpose } = req.body || {};
    const normalized = String(email || '').toLowerCase().trim();
    if (!normalized) return res.status(400).json({ error: 'email required' });
    if (!['signup', 'reset'].includes(purpose)) return res.status(400).json({ error: 'invalid purpose' });

    const q = await pool.query('SELECT id FROM users WHERE email=$1', [normalized]);
    const exists = q.rowCount > 0;
    if (purpose === 'signup' && exists) return res.status(400).json({ error: '이미 가입된 이메일입니다.' });
    if (purpose === 'reset' && !exists) return res.status(404).json({ error: '가입된 이메일이 없습니다.' });

    const code = makeCode();
    const codeToken = signToken({
      kind: 'email-code',
      email: normalized,
      purpose,
      codeHash: hashCode(code),
      exp: Date.now() + 10 * 60 * 1000,
    });

    // 메일 서버 설정 여부와 관계없이 코드토큰 발급은 항상 성공 처리
    // SMTP가 설정된 경우에만 실제 발송을 시도하고, 실패해도 가입 플로우는 진행 가능
    let sent = false;
    let skipped = true;
    let mailError = null;

    try {
      const host = process.env.SMTP_HOST;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      if (host && user && pass) {
        const nodemailer = await import('nodemailer');
        const port = Number(process.env.SMTP_PORT || 587);
        const transporter = nodemailer.default.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
        const from = process.env.SMTP_FROM || user;
        const subject = purpose === 'signup' ? '[루멘] 회원가입 인증코드' : '[루멘] 비밀번호 재설정 인증코드';
        const text = `인증코드: ${code}\n유효시간: 10분`;
        await transporter.sendMail({ from, to: normalized, subject, text });
        sent = true;
        skipped = false;
      }
    } catch (e) {
      mailError = String(e?.message || e);
      sent = false;
      skipped = true;
    }

    return res.status(200).json({ ok: true, sent, skipped, codeToken, mailError });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
