const DEFAULT_ADMIN = 'goqgoq@naver.com';

function normalize(v) {
  return String(v || '').trim().toLowerCase();
}

function buildAllowList() {
  const fromEnv = String(process.env.FORCED_ADMIN_EMAILS || '')
    .split(',')
    .map(normalize)
    .filter(Boolean);

  // 기본 관리자 계정은 환경변수 설정 여부와 무관하게 항상 포함
  return Array.from(new Set([normalize(DEFAULT_ADMIN), ...fromEnv]));
}

export function isForcedAdminEmail(email) {
  return buildAllowList().includes(normalize(email));
}
