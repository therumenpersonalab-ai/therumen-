import { initDb, pool } from './_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const { adminEmail, bootstrapKey } = req.body || {};
    if (!adminEmail) return res.status(400).json({ error: 'adminEmail required' });

    const expected = process.env.ADMIN_BOOTSTRAP_KEY;
    if (!expected || bootstrapKey !== expected) return res.status(403).json({ error: 'invalid bootstrap key' });

    const q = await pool.query('UPDATE users SET role=$1 WHERE email=$2 RETURNING id,email,role', ['admin', String(adminEmail).toLowerCase().trim()]);
    if (q.rowCount === 0) return res.status(404).json({ error: 'user not found' });

    return res.status(200).json({ ok: true, user: q.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
