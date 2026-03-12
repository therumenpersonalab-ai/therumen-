import { initDb, pool } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const { email, secret } = req.body || {};
    if (secret !== process.env.ADMIN_BOOTSTRAP_SECRET) return res.status(403).json({ error: '승인되지 않은 요청입니다.' });
    if (!email) return res.status(400).json({ error: 'email이 필요합니다.' });

    const up = await pool.query(
      `UPDATE users SET role='admin', credits=99999999 WHERE email=$1 RETURNING id,email,name,role,credits`,
      [String(email).toLowerCase().trim()]
    );
    if (!up.rowCount) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    return res.status(200).json({ ok: true, user: up.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message || '서버 오류' });
  }
}
