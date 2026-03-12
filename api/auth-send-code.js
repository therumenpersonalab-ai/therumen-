import { initDb } from './_lib/db.js';
import { saveCode, makeCode } from './_lib/verification.js';
import { sendEmail } from './_lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const { email, purpose } = req.body || {};
    const normalized = String(email || '').toLowerCase().trim();
    if (!normalized) return res.status(400).json({ error: 'email required' });
    if (!['signup', 'reset'].includes(purpose)) return res.status(400).json({ error: 'invalid purpose' });

    const code = makeCode();
    await saveCode(normalized, purpose, code, 10);

    const subject = purpose === 'signup' ? '[루멘] 회원가입 인증코드' : '[루멘] 비밀번호 재설정 인증코드';
    const text = `인증코드: ${code}\n유효시간: 10분`;
    const mailResult = await sendEmail({ to: normalized, subject, text });

    return res.status(200).json({ ok: true, sent: !!mailResult.sent, skipped: !!mailResult.skipped });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
