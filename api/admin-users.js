import { initDb, pool } from '../lib/db.js';
import { getBearerToken, verifyToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();

    const token = getBearerToken(req);
    const payload = verifyToken(token);
    if (!payload?.id) return res.status(401).json({ error: 'unauthorized' });

    const me = await pool.query('SELECT id, role FROM users WHERE id=$1', [payload.id]);
    if (!me.rowCount || me.rows[0].role !== 'admin') return res.status(403).json({ error: '관리자 권한이 필요합니다.' });

    const q = await pool.query('SELECT id,email,name,role,credits,created_at FROM users ORDER BY created_at DESC');
    return res.status(200).json({ ok: true, users: q.rows });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
