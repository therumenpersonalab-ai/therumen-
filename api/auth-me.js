import { initDb, pool } from './_lib/db.js';
import { getBearerToken, verifyToken } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const token = getBearerToken(req);
    const payload = verifyToken(token);
    if (!payload?.id) return res.status(401).json({ error: 'unauthorized' });

    const q = await pool.query('SELECT id,email,name,role,credits FROM users WHERE id=$1', [payload.id]);
    if (q.rowCount === 0) return res.status(401).json({ error: 'unauthorized' });
    return res.status(200).json({ user: q.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
