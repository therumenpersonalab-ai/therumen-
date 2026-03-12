import bcrypt from 'bcryptjs';
import { initDb, pool, dbMode } from '../lib/db.js';
import { getBearerToken, verifyToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();
    if (dbMode() !== 'postgres') return res.status(503).json({ error: '인증 서버 설정이 완료되지 않았습니다.' });

    const token = getBearerToken(req);
    const payload = verifyToken(token);
    if (!payload?.id) return res.status(401).json({ error: 'unauthorized' });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: '새 비밀번호는 8자 이상이어야 합니다.' });

    const q = await pool.query('SELECT id,password_hash FROM users WHERE id=$1', [payload.id]);
    if (!q.rowCount) return res.status(401).json({ error: 'unauthorized' });

    const ok = await bcrypt.compare(String(currentPassword), q.rows[0].password_hash || '');
    if (!ok) return res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다.' });

    const nextHash = await bcrypt.hash(String(newPassword), 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [nextHash, payload.id]);

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
