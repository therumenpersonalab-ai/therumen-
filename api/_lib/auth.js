import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'change-this-auth-secret';

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

export function signToken(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(req) {
  const h = req.headers.authorization || req.headers.Authorization;
  if (!h || !String(h).startsWith('Bearer ')) return null;
  return String(h).slice(7);
}
