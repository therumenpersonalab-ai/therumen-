import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { initDb, pool, dbMode } from './_lib/db.js';
import { signToken } from './_lib/auth.js';
import { DEFAULT_SIGNUP_CREDITS } from './_lib/credits.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const { email, name, password } = req.body || {};
    if (!email || !name || !password) return res.status(400).json({ error: '필수값 누락' });
    if (String(password).length < 8) return res.status(400).json({ error: '비밀번호 8자 이상' });

    const normalized = String(email).toLowerCase().trim();
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [normalized]);
    if (exists.rowCount > 0) return res.status(400).json({ error: '이미 가입된 이메일' });

    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(String(password), 12);
    await pool.query(
      'INSERT INTO users(id,email,name,password_hash,role,credits) VALUES($1,$2,$3,$4,$5,$6)',
      [id, normalized, String(name).trim(), hash, 'user', DEFAULT_SIGNUP_CREDITS]
    );

    const mode = dbMode();
    const token = signToken({ id, email: normalized, name: String(name).trim(), role: 'user', credits: DEFAULT_SIGNUP_CREDITS, mode, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    return res.status(200).json({ token, user: { id, email: normalized, name, role: 'user', credits: DEFAULT_SIGNUP_CREDITS, mode } });
  } catch (e) {
    console.error('auth-signup error:', e);
    return res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' });
  }
}
