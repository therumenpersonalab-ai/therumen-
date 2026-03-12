import { initDb, pool, dbMode } from '../lib/db.js';
import { makeCode, saveCode, createCodeToken } from '../lib/verification.js';
import { getMailDiagnostics, sendVerificationCodeEmail } from '../lib/email.js';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();
    if (dbMode() !== 'postgres') {
      return res.status(503).json({ error: '인증 서버 설정이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.' });
    }
    const { email, purpose } = req.body || {};
    const normalized = String(email || '').toLowerCase().trim();

    if (!isValidEmail(normalized)) {
      return res.status(400).json({ error: '유효한 이메일 형식이 아닙니다.' });
    }
    if (!['signup', 'reset'].includes(purpose)) {
      return res.status(400).json({ error: 'invalid purpose' });
    }

    const q = await pool.query('SELECT id FROM users WHERE email=$1', [normalized]);
    const exists = q.rowCount > 0;

    if (purpose === 'signup' && exists) {
      return res.status(400).json({ error: '이미 가입된 이메일입니다.' });
    }
    if (purpose === 'reset' && !exists) {
      return res.status(404).json({ error: '가입된 이메일이 없습니다.' });
    }

    const code = makeCode();
    await saveCode(normalized, purpose, code, 10);
    const codeToken = createCodeToken(normalized, purpose, code, 10);

    const mail = await sendVerificationCodeEmail({
      to: normalized,
      purpose,
      code,
    });

    if (!mail.ok) {
      const diag = getMailDiagnostics();
      const missing = [];
      if (!diag.hostConfigured) missing.push('SMTP_HOST');
      if (!diag.userConfigured) missing.push('SMTP_USER');
      if (!diag.passConfigured) missing.push('SMTP_PASS');
      if (!diag.fromConfigured) missing.push('SMTP_FROM');

      return res.status(503).json({
        error: '인증코드 메일 발송에 실패했습니다.',
        reason: mail.code,
        details: mail.message,
        missing,
        diagnostics: diag,
      });
    }

    return res.status(200).json({ ok: true, sent: true, codeToken });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'server error' });
  }
}
