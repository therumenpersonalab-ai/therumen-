import { initDb, pool, dbMode } from '../lib/db.js';
import { getBearerToken, verifyToken } from '../lib/auth.js';
import { isForcedAdminEmail } from '../lib/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    if (dbMode() !== 'postgres') return res.status(503).json({ error: '인증 서버 설정이 완료되지 않았습니다.' });
    const token = getBearerToken(req);
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Unauthorized' });

    const me = await pool.query('SELECT id, role FROM users WHERE id=$1', [payload.id]);
    const adminByDb = me.rowCount && me.rows[0].role === 'admin';
    const adminByForcedEmail = isForcedAdminEmail(payload.email);
    if (!adminByDb && !adminByForcedEmail) return res.status(403).json({ error: '관리자 권한이 필요합니다.' });

    const { targetEmail, amount } = req.body || {};
    const amt = Number(amount || 0);
    if (!targetEmail || !Number.isFinite(amt) || amt === 0) return res.status(400).json({ error: 'targetEmail/amount를 확인해주세요.' });

    const up = await pool.query(
      'UPDATE users SET credits = credits + $1 WHERE email = $2 RETURNING id,email,name,role,credits',
      [amt, String(targetEmail).toLowerCase().trim()]
    );
    if (!up.rowCount) return res.status(404).json({ error: '대상 사용자를 찾을 수 없습니다.' });

    return res.status(200).json({ ok: true, user: up.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message || '서버 오류' });
  }
}
