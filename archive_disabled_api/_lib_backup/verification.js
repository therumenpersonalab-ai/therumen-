import crypto from 'crypto';
import { dbMode, pool } from './db.js';

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

export async function verifyCode(email, purpose, code) {
  const codeHash = hashCode(code);
  const now = new Date();
  const normalized = String(email).toLowerCase().trim();

  if (dbMode() === 'memory') {
    const row = memCodes.get(key(normalized, purpose));
    if (!row) return false;
    if (new Date(row.expiresAt) < now) return false;
    if (row.codeHash !== codeHash) return false;
    memCodes.delete(key(normalized, purpose));
    return true;
  }

  const q = await pool.query('SELECT code_hash, expires_at FROM email_verifications WHERE email=$1 AND purpose=$2', [normalized, purpose]);
  if (q.rowCount === 0) return false;
  const row = q.rows[0];
  if (new Date(row.expires_at) < now) return false;
  if (row.code_hash !== codeHash) return false;
  await pool.query('DELETE FROM email_verifications WHERE email=$1 AND purpose=$2', [normalized, purpose]);
  return true;
}
