import nodemailer from 'nodemailer';

function getMailConfig() {
  const host = process.env.SMTP_HOST || '';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = user ? `THE RUMEN <${user}>` : '';
  const port = Number(process.env.SMTP_PORT || 587);

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: port === 465,
    ready: Boolean(host && user && pass && from),
  };
}

export function getMailDiagnostics() {
  const cfg = getMailConfig();
  return {
    ready: cfg.ready,
    hostConfigured: Boolean(cfg.host),
    userConfigured: Boolean(cfg.user),
    passConfigured: Boolean(cfg.pass),
    fromConfigured: Boolean(cfg.from),
    port: cfg.port,
    secure: cfg.secure,
  };
}

export async function sendVerificationCodeEmail({ to, purpose, code }) {
  const cfg = getMailConfig();
  if (!cfg.ready) {
    return {
      ok: false,
      code: 'smtp_not_configured',
      message: 'SMTP 환경변수가 설정되지 않았습니다.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    });

    const subject = purpose === 'signup' ? '[루멘] 회원가입 인증코드' : '[루멘] 비밀번호 재설정 인증코드';
    const text = `인증코드: ${code}\n유효시간: 10분`;

    await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
    });

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      code: 'smtp_send_failed',
      message: String(e?.message || e),
    };
  }
}
