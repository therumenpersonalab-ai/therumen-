import { initDb, pool } from '../lib/db.js';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, purpose } = req.body || {};
  const normalized = String(email || '').toLowerCase().trim();

  if (!isValidEmail(normalized)) {
    return res.status(400).json({ error: '유효한 이메일 형식이 아닙니다.' });
  }
  if (!['signup', 'reset'].includes(purpose)) {
    return res.status(400).json({ error: 'invalid purpose' });
  }

  try {
    await initDb();
    const q = await pool.query('SELECT id FROM users WHERE email=$1', [normalized]);
    const exists = q.rowCount > 0;

    if (purpose === 'signup' && exists) {
      return res.status(400).json({ error: '이미 가입된 이메일입니다.' });
    }
    if (purpose === 'reset' && !exists) {
      return res.status(404).json({ error: '가입된 이메일이 없습니다.' });
    }

    return res.status(200).json({ ok: true, exists, degraded: false });
  } catch (e) {
    // signup 사전 확인은 보조 단계이므로 DB 장애 시에도 진행을 막지 않음.
    if (purpose === 'signup') {
      return res.status(200).json({
        ok: true,
        exists: false,
        degraded: true,
        message: '서버 상태로 사전 확인을 생략하고 다음 단계로 진행합니다.',
      });
    }

    // reset 은 가입 여부 확인이 필수
    return res.status(503).json({
      error: '서버 상태로 이메일 확인에 실패했습니다. 잠시 후 다시 시도해주세요.',
      code: 'email_check_unavailable',
      details: String(e?.message || e),
    });
  }
}
