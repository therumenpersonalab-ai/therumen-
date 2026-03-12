const DEFAULT_ADMIN = 'goqgoq@naver.com';

function normalize(v) {
  return String(v || '').trim().toLowerCase();
}

export function isForcedAdminEmail(email) {
  const allow = String(process.env.FORCED_ADMIN_EMAILS || DEFAULT_ADMIN)
    .split(',')
    .map(normalize)
    .filter(Boolean);
  return allow.includes(normalize(email));
}
