import { initDb } from '../lib/db.js';
import { saveCode, makeCode, createCodeToken } from '../lib/verification.js';
import { sendEmail } from '../lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const { email, purpose } = req.body || {};
    const normalized = String(email || '').toLowerCase().trim();
    if (!normalized) return res.status(400).json({ error: 'email required' });
    if (!['signup', 'reset'].includes(purpose)) return res.status(400).json({ error: 'invalid purpose' });

    const code = makeCode();
    const codeToken = createCodeToken(normalized, purpose, code, 10);

    try {
      await saveCode(normalized, purpose, code, 10);
    } catch {
      // DB 저장 실패 시에도 token 검증으로 진행 가능
    }

    const subject = purpose === 'signup' ? '[루멘] 회원가입 인증코드' : '[루멘] 비밀번호 재설정 인증코드';
    const text = `인증코드: ${code}\n유효시간: 10분`;
    const mailResult = await sendEmail({ to: normalized, subject, text });

    return res.status(200).json({ ok: true, sent: !!mailResult.sent, skipped: !!mailResult.skipped, codeToken });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
