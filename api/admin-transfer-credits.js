import { initDb, pool } from './_lib/db.js';
import { getBearerToken, verifyToken } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const token = getBearerToken(req);
    const payload = verifyToken(token);
    if (!payload?.id) return res.status(401).json({ error: 'unauthorized' });

    const me = await pool.query('SELECT id,role FROM users WHERE id=$1', [payload.id]);
    if (me.rowCount === 0 || me.rows[0].role !== 'admin') return res.status(403).json({ error: 'admin only' });

    const { targetEmail, credits } = req.body || {};
    const c = Number(credits);
    if (!targetEmail || !Number.isFinite(c) || c <= 0) return res.status(400).json({ error: 'invalid payload' });

    const q = await pool.query('UPDATE users SET credits = credits + $1 WHERE email=$2 RETURNING id,email,credits', [c, String(targetEmail).toLowerCase().trim()]);
    if (q.rowCount === 0) return res.status(404).json({ error: 'target not found' });

    return res.status(200).json({ ok: true, target: q.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
