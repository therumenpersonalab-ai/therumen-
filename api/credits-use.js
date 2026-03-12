import { initDb, pool, dbMode } from '../lib/db.js';
import { getBearerToken, verifyToken } from '../lib/auth.js';
import { COSTS } from '../lib/credits.js';
import { isForcedAdminEmail } from '../lib/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const token = getBearerToken(req);
    const payload = verifyToken(token);
    if (!payload?.id) return res.status(401).json({ error: 'unauthorized' });

    const { action } = req.body || {};
    const isRefund = action === 'refund_feature';
    let cost = COSTS[action];
    if ((typeof cost !== 'number' && action === 'feature') || isRefund) {
      const custom = Number(req.body?.cost);
      if (Number.isFinite(custom) && custom > 0 && custom <= 50) cost = Math.round(custom);
    }
    if (typeof cost !== 'number') return res.status(400).json({ error: 'invalid action' });

    if (dbMode() === 'memory') {
      const credits = Number(payload.credits ?? 200);
      if ((payload.role || 'user') === 'admin' || isForcedAdminEmail(payload.email)) return res.status(200).json({ ok: true, credits: 99999999, unlimited: true, mode: 'memory' });
      if (!isRefund && credits < cost) return res.status(403).json({ error: '크레딧 부족', credits });
      return res.status(200).json({ ok: true, credits: isRefund ? (credits + cost) : (credits - cost), cost, mode: 'memory', refund: isRefund });
    }

    if (isForcedAdminEmail(payload.email)) {
      return res.status(200).json({ ok: true, credits: 99999999, unlimited: true });
    }

    const q = await pool.query('SELECT id,role,credits FROM users WHERE id=$1', [payload.id]);
    if (q.rowCount === 0) return res.status(401).json({ error: 'unauthorized' });
    const u = q.rows[0];

    if (u.role === 'admin') return res.status(200).json({ ok: true, credits: 99999999, unlimited: true });

    if (!isRefund && u.credits < cost) return res.status(403).json({ error: '크레딧 부족', credits: u.credits });

    const updated = await pool.query(
      `UPDATE users SET credits = credits ${isRefund ? '+' : '-'} $1 WHERE id=$2 RETURNING credits`,
      [cost, u.id]
    );
    return res.status(200).json({ ok: true, credits: updated.rows[0].credits, cost, refund: isRefund });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
