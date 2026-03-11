import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { initDb, pool } from './_lib/db.js';
import { signToken } from './_lib/auth.js';
import { DEFAULT_SIGNUP_CREDITS } from './_lib/credits.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await initDb();
    const { email, name, password } = req.body || {};
    if (!email || !name || !password) return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    if (String(password).length < 8) return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });

    const normalized = String(email).toLowerCase().trim();
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [normalized]);
    if (exists.rowCount) return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });

    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(String(password), 12);

    await pool.query(
      'INSERT INTO users(id, email, name, password_hash, role, credits) VALUES($1,$2,$3,$4,$5,$6)',
      [id, normalized, String(name).trim(), hash, 'user', DEFAULT_SIGNUP_CREDITS]
    );

    const token = signToken({ id, email: normalized, role: 'user', exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    return res.status(200).json({ token, user: { id, email: normalized, name, role: 'user', credits: DEFAULT_SIGNUP_CREDITS } });
  } catch (e) {
    return res.status(500).json({ error: e.message || '서버 오류' });
  }
}
