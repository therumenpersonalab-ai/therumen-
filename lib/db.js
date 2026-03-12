import { Pool } from 'pg';

let _pool = null;
let initialized = false;
const mem = { users: [] };

function hasDb() {
  return !!process.env.DATABASE_URL;
}

function ensurePool() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) return null;
  if (!_pool) {
    _pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return _pool;
}

export async function query(text, params = []) {
  const p = ensurePool();
  if (p) return p.query(text, params);

  // in-memory fallback mode (non-persistent)
  const sql = String(text).trim().toLowerCase();

  if (sql.startsWith('select id from users where email=')) {
    const email = String(params[0]).toLowerCase();
    const found = mem.users.find((u) => u.email === email);
    return { rowCount: found ? 1 : 0, rows: found ? [{ id: found.id }] : [] };
  }
  if (sql.startsWith('insert into users')) {
    const [id, email, name, password_hash, role, credits] = params;
    mem.users.push({ id, email: String(email).toLowerCase(), name, password_hash, role, credits, created_at: new Date().toISOString() });
    return { rowCount: 1, rows: [] };
  }
  if (sql.startsWith('select id,email,name,password_hash,role,credits from users where email=')) {
    const email = String(params[0]).toLowerCase();
    const u = mem.users.find((x) => x.email === email);
    return { rowCount: u ? 1 : 0, rows: u ? [u] : [] };
  }
  if (sql.startsWith('select id,email,name,role,credits from users where id=')) {
    const id = params[0];
    const u = mem.users.find((x) => x.id === id);
    if (!u) return { rowCount: 0, rows: [] };
    const { email, name, role, credits } = u;
    return { rowCount: 1, rows: [{ id, email, name, role, credits }] };
  }
  if (sql.startsWith('select id,role,credits from users where id=')) {
    const id = params[0];
    const u = mem.users.find((x) => x.id === id);
    if (!u) return { rowCount: 0, rows: [] };
    return { rowCount: 1, rows: [{ id: u.id, role: u.role, credits: u.credits }] };
  }
  if (sql.startsWith('update users set credits = credits -')) {
    const [cost, id] = params;
    const u = mem.users.find((x) => x.id === id);
    if (!u) return { rowCount: 0, rows: [] };
    u.credits -= Number(cost);
    return { rowCount: 1, rows: [{ credits: u.credits }] };
  }
  if (sql.startsWith('select id,role from users where id=')) {
    const id = params[0];
    const u = mem.users.find((x) => x.id === id);
    return { rowCount: u ? 1 : 0, rows: u ? [{ id: u.id, role: u.role }] : [] };
  }
  if (sql.startsWith('select id,email,name,role,credits,created_at from users order by created_at desc')) {
    const rows = [...mem.users]
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
      .map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, credits: u.credits, created_at: u.created_at }));
    return { rowCount: rows.length, rows };
  }
  if (sql.startsWith('update users set credits = credits +')) {
    const [c, email] = params;
    const u = mem.users.find((x) => x.email === String(email).toLowerCase());
    if (!u) return { rowCount: 0, rows: [] };
    u.credits += Number(c);
    return { rowCount: 1, rows: [{ id: u.id, email: u.email, credits: u.credits }] };
  }
  if (sql.startsWith('update users set role=')) {
    const [role, email] = params;
    const u = mem.users.find((x) => x.email === String(email).toLowerCase());
    if (!u) return { rowCount: 0, rows: [] };
    u.role = role;
    return { rowCount: 1, rows: [{ id: u.id, email: u.email, role: u.role }] };
  }
  if (sql.startsWith('update users set password_hash=')) {
    const [hash, email] = params;
    const u = mem.users.find((x) => x.email === String(email).toLowerCase());
    if (!u) return { rowCount: 0, rows: [] };
    u.password_hash = hash;
    return { rowCount: 1, rows: [{ id: u.id, email: u.email }] };
  }

  return { rowCount: 0, rows: [] };
}

export async function initDb() {
  if (initialized) return;
  if (hasDb()) {
    await query(`
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
    await query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        email TEXT NOT NULL,
        purpose TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (email, purpose)
      );
    `);
  }
  initialized = true;
}

export const pool = { query };

export function dbMode() {
  return hasDb() ? 'postgres' : 'memory';
}
