import bcrypt from 'bcryptjs';
import { initDb, pool, dbMode } from '../lib/db.js';
import { signToken } from '../lib/auth.js';
import { isForcedAdminEmail } from '../lib/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: '필수값 누락' });

    const normalized = String(email).toLowerCase().trim();

    if (dbMode() === 'memory') {
      if (String(password).length < 8) return res.status(401).json({ error: '로그인 실패' });
      const id = `mem_${normalized}`;
      const role = isForcedAdminEmail(normalized) ? 'admin' : 'user';
      const token = signToken({ id, email: normalized, name: normalized.split('@')[0], role, credits: 200, mode: 'memory', exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
      return res.status(200).json({ token, user: { id, email: normalized, name: normalized.split('@')[0], role, credits: 200, mode: 'memory' } });
    }

    const q = await pool.query('SELECT id,email,name,password_hash,role,credits FROM users WHERE email=$1', [normalized]);
    if (q.rowCount === 0) return res.status(401).json({ error: '로그인 실패' });
    const u = q.rows[0];

    const ok = await bcrypt.compare(String(password), u.password_hash);
    if (!ok) return res.status(401).json({ error: '로그인 실패' });

    let role = u.role;
    if (isForcedAdminEmail(u.email) && u.role !== 'admin') {
      await pool.query('UPDATE users SET role=$1 WHERE id=$2', ['admin', u.id]);
      role = 'admin';
    }

    const token = signToken({ id: u.id, email: u.email, name: u.name, role, credits: u.credits, mode: 'postgres', exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    return res.status(200).json({ token, user: { id: u.id, email: u.email, name: u.name, role, credits: u.credits, mode: 'postgres' } });
  } catch (e) {
    console.error('auth-login error:', e);
    return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
  }
}
