import { initDb, pool, dbMode } from '../lib/db.js';
import { getBearerToken, verifyToken } from '../lib/auth.js';
import { isForcedAdminEmail } from '../lib/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const token = getBearerToken(req);
    const payload = verifyToken(token);
    if (!payload?.id) return res.status(401).json({ error: 'unauthorized' });

    if (dbMode() === 'memory') {
      const role = isForcedAdminEmail(payload.email) ? 'admin' : (payload.role || 'user');
      return res.status(200).json({
        user: {
          id: payload.id,
          email: payload.email,
          name: payload.name || String(payload.email || '').split('@')[0],
          role,
          credits: Number(payload.credits ?? 200),
          mode: 'memory',
        },
      });
    }

    const q = await pool.query('SELECT id,email,name,role,credits FROM users WHERE id=$1', [payload.id]);
    if (q.rowCount === 0) return res.status(401).json({ error: 'unauthorized' });
    const user = q.rows[0];
    if (isForcedAdminEmail(user.email) && user.role !== 'admin') {
      await pool.query('UPDATE users SET role=$1 WHERE id=$2', ['admin', user.id]);
      user.role = 'admin';
    }
    return res.status(200).json({ user: { ...user, mode: 'postgres' } });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
