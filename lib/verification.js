import crypto from 'crypto';
import { dbMode, pool } from './db.js';
import { signToken, verifyToken } from './auth.js';

const memCodes = new Map();

function key(email, purpose) {
  return `${String(email).toLowerCase().trim()}::${purpose}`;
}

export function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

export async function saveCode(email, purpose, code, ttlMinutes = 10) {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const codeHash = hashCode(code);

  if (dbMode() === 'memory') {
    memCodes.set(key(email, purpose), { codeHash, expiresAt: expiresAt.toISOString() });
    return;
  }

  await pool.query(
    `INSERT INTO email_verifications(email,purpose,code_hash,expires_at)
     VALUES($1,$2,$3,$4)
     ON CONFLICT (email,purpose)
     DO UPDATE SET code_hash=EXCLUDED.code_hash, expires_at=EXCLUDED.expires_at, created_at=NOW()`,
    [String(email).toLowerCase().trim(), purpose, codeHash, expiresAt.toISOString()]
  );
}

export function createCodeToken(email, purpose, code, ttlMinutes = 10) {
  const normalized = String(email).toLowerCase().trim();
  return signToken({
    kind: 'email-code',
    email: normalized,
    purpose,
    codeHash: hashCode(code),
    exp: Date.now() + ttlMinutes * 60 * 1000,
  });
}

export function verifyCodeWithToken(email, purpose, code, token) {
  const payload = verifyToken(token);
  if (!payload || payload.kind !== 'email-code') return false;
  const normalized = String(email).toLowerCase().trim();
  if (payload.email !== normalized) return false;
  if (payload.purpose !== purpose) return false;
  return payload.codeHash === hashCode(code);
}

export async function verifyCode(email, purpose, code, codeToken = null) {
  const codeHash = hashCode(code);
  const now = new Date();
  const normalized = String(email).toLowerCase().trim();

  if (dbMode() === 'memory') {
    const row = memCodes.get(key(normalized, purpose));
    if (row && new Date(row.expiresAt) >= now && row.codeHash === codeHash) {
      memCodes.delete(key(normalized, purpose));
      return true;
    }
    return codeToken ? verifyCodeWithToken(normalized, purpose, code, codeToken) : false;
  }

  try {
    const q = await pool.query('SELECT code_hash, expires_at FROM email_verifications WHERE email=$1 AND purpose=$2', [normalized, purpose]);
    if (q.rowCount > 0) {
      const row = q.rows[0];
      if (new Date(row.expires_at) >= now && row.code_hash === codeHash) {
        await pool.query('DELETE FROM email_verifications WHERE email=$1 AND purpose=$2', [normalized, purpose]);
        return true;
      }
    }
  } catch {
    // fallback to token-based verification below
  }

  return codeToken ? verifyCodeWithToken(normalized, purpose, code, codeToken) : false;
}
