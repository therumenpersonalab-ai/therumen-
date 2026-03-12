import bcrypt from 'bcryptjs';
import { initDb, pool } from '../lib/db.js';
import { verifyCode } from '../lib/verification.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const { email, code, newPassword, codeToken } = req.body || {};
    const normalized = String(email || '').toLowerCase().trim();
    if (!normalized || !code || !newPassword) return res.status(400).json({ error: '필수값 누락' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: '비밀번호 8자 이상' });

    const ok = await verifyCode(normalized, 'reset', code, codeToken);
    if (!ok) return res.status(400).json({ error: '인증코드가 올바르지 않거나 만료되었습니다.' });

    const hash = await bcrypt.hash(String(newPassword), 12);
    const q = await pool.query('UPDATE users SET password_hash=$1 WHERE email=$2 RETURNING id,email', [hash, normalized]);
    if (q.rowCount === 0) return res.status(404).json({ error: '가입된 이메일이 없습니다.' });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
