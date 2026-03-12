import { Pool } from 'pg';

let _pool = null;
let initialized = false;

function ensurePool() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  if (!_pool) {
    _pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return _pool;
}

export const pool = {
  query: (...args) => ensurePool().query(...args),
};

export async function initDb() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      credits INTEGER NOT NULL DEFAULT 200,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  initialized = true;
}
