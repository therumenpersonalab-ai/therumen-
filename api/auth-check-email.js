import { initDb, pool } from '../lib/db.js';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();
    const { email, purpose } = req.body || {};
    const normalized = String(email || '').toLowerCase().trim();

    if (!isValidEmail(normalized)) {
      return res.status(400).json({ error: '유효한 이메일 형식이 아닙니다.' });
    }
    if (!['signup', 'reset'].includes(purpose)) {
      return res.status(400).json({ error: 'invalid purpose' });
    }

    const q = await pool.query('SELECT id FROM users WHERE email=$1', [normalized]);
    const exists = q.rowCount > 0;

    if (purpose === 'signup' && exists) {
      return res.status(400).json({ error: '이미 가입된 이메일입니다.' });
    }
    if (purpose === 'reset' && !exists) {
      return res.status(404).json({ error: '가입된 이메일이 없습니다.' });
    }

    return res.status(200).json({ ok: true, exists });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
