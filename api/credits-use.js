import { initDb, pool, dbMode } from './_lib/db.js';
import { getBearerToken, verifyToken } from './_lib/auth.js';
import { COSTS } from './_lib/credits.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const token = getBearerToken(req);
    const payload = verifyToken(token);
    if (!payload?.id) return res.status(401).json({ error: 'unauthorized' });

    const { action } = req.body || {};
    const cost = COSTS[action];
    if (typeof cost !== 'number') return res.status(400).json({ error: 'invalid action' });

    if (dbMode() === 'memory') {
      const credits = Number(payload.credits ?? 200);
      if ((payload.role || 'user') === 'admin') return res.status(200).json({ ok: true, credits: 99999999, unlimited: true, mode: 'memory' });
      if (credits < cost) return res.status(403).json({ error: '크레딧 부족', credits });
      return res.status(200).json({ ok: true, credits: credits - cost, cost, mode: 'memory' });
    }

    const q = await pool.query('SELECT id,role,credits FROM users WHERE id=$1', [payload.id]);
    if (q.rowCount === 0) return res.status(401).json({ error: 'unauthorized' });
    const u = q.rows[0];

    if (u.role === 'admin') return res.status(200).json({ ok: true, credits: 99999999, unlimited: true });

    if (u.credits < cost) return res.status(403).json({ error: '크레딧 부족', credits: u.credits });

    const updated = await pool.query('UPDATE users SET credits = credits - $1 WHERE id=$2 RETURNING credits', [cost, u.id]);
    return res.status(200).json({ ok: true, credits: updated.rows[0].credits, cost });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
