import { initDb, pool } from './_lib/db.js';
import { getBearerToken, verifyToken } from './_lib/auth.js';
import { COSTS } from './_lib/credits.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const token = getBearerToken(req);
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Unauthorized' });

    const { action } = req.body || {};
    const cost = COSTS[action];
    if (!cost) return res.status(400).json({ error: '잘못된 액션입니다.' });

    const q = await pool.query('SELECT id,role,credits FROM users WHERE id=$1', [payload.id]);
    if (!q.rowCount) return res.status(401).json({ error: 'Unauthorized' });
    const u = q.rows[0];

    if (u.role === 'admin') return res.status(200).json({ ok: true, credits: u.credits, unlimited: true });
    if (u.credits < cost) return res.status(403).json({ error: '크레딧이 부족합니다.', credits: u.credits });

    const up = await pool.query('UPDATE users SET credits = credits - $1 WHERE id = $2 RETURNING credits', [cost, u.id]);
    return res.status(200).json({ ok: true, credits: up.rows[0].credits, deducted: cost });
  } catch (e) {
    return res.status(500).json({ error: e.message || '서버 오류' });
  }
}
