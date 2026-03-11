function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pickLayout(seed = "") {
  const n = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  return ["split", "center", "banner"][n % 3];
}

export function generateLocalHtml(form, options = {}) {
  const t = form.selectedTheme || {
    primary: "#1B3A5C",
    secondary: "#F8F9FA",
    accent: "#4A90D9",
    bg: "#FFFFFF",
    text: "#1B3A5C",
    btnBg: "#1B3A5C",
    btnText: "#fff",
    surfaceBg: "#F1F5F9",
    borderColor: "rgba(27,58,92,0.08)",
    font: "Pretendard",
    name: "Deep Navy",
  };

  const company = escapeHtml(form.company || "더 루멘");
  const industry = escapeHtml(form.industry || "비즈니스");
  const desc = escapeHtml(form.description || `${company}는 ${industry} 분야의 전문 서비스를 제공합니다.`);
  const services = (form.services || "맞춤 컨설팅, 전문 서비스, 빠른 응대")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  const layout = pickLayout(`${form.company}-${industry}-${options.extra || ""}`);
  const heroImage = form?.uploadedImages?.hero || "";
  const logo = form?.uploadedImages?.logo || "";

  const serviceCards = services
    .map(
      (s, i) => `<div class="card fade-up" style="animation-delay:${i * 0.06}s"><h3>${escapeHtml(s)}</h3><p>${company}의 ${escapeHtml(s)} 서비스는 고객 목표에 맞춰 설계됩니다.</p></div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${company}</title>
<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box} body{margin:0;font-family:'${t.font}',Pretendard,sans-serif;background:${t.bg};color:${t.text};line-height:1.65}
.container{max-width:1160px;margin:0 auto;padding:0 20px}
nav{position:sticky;top:0;background:rgba(255,255,255,.9);backdrop-filter:blur(8px);border-bottom:1px solid ${t.borderColor};z-index:20}
.nav-wrap{height:68px;display:flex;align-items:center;justify-content:space-between}
.logo{font-weight:800;letter-spacing:-.4px}
.hero{padding:86px 0;background:linear-gradient(140deg,${t.secondary},${t.bg})}
.hero-grid{display:grid;grid-template-columns:${layout === "split" ? "1.1fr .9fr" : "1fr"};gap:28px;align-items:center}
.hero h1{font-size:clamp(30px,5vw,56px);margin:0 0 12px;line-height:1.12;letter-spacing:-1px}
.hero p{font-size:18px;color:#475569;max-width:680px}
.btn{display:inline-block;background:${t.btnBg};color:${t.btnText};padding:13px 22px;border-radius:12px;text-decoration:none;font-weight:600;margin-top:10px}
.hero-img{width:100%;border-radius:22px;min-height:320px;object-fit:cover;background:${t.surfaceBg};border:1px solid ${t.borderColor}}
section{padding:82px 0}
.surface{background:${t.surfaceBg}}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.card{background:#fff;border:1px solid ${t.borderColor};border-radius:16px;padding:24px}
.card h3{margin:0 0 8px;font-size:20px}
.card p{margin:0;color:#64748B;font-size:15px}
.cta{background:linear-gradient(135deg,${t.primary},${t.accent});color:#fff;border-radius:22px;padding:42px;text-align:center}
footer{padding:36px 0;background:#0F172A;color:#cbd5e1}
.fade-up{opacity:0;transform:translateY(14px);animation:fadeUp .6s ease forwards}
@keyframes fadeUp{to{opacity:1;transform:translateY(0)}}
@media (max-width: 860px){.hero-grid{grid-template-columns:1fr}.hero{padding:62px 0}}
</style>
</head>
<body>
<nav><div class="container nav-wrap"><div class="logo">${logo ? `<img src="${logo}" alt="logo" style="height:34px"/>` : company}</div><a href="#contact" class="btn" style="padding:10px 16px">문의하기</a></div></nav>
<header class="hero"><div class="container hero-grid"><div><h1>${company}<br/>${industry} 전문 홈페이지</h1><p>${desc}</p><a class="btn" href="#service">서비스 보기</a></div>${layout === "split" ? `<img class="hero-img" src="${heroImage || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"}" alt="hero"/>` : ""}</div></header>
<section><div class="container"><h2 style="font-size:36px;margin:0 0 12px">브랜드 소개</h2><p style="max-width:760px;color:#64748B">${company}는 ${industry} 분야에서 고객의 문제를 빠르게 해결하고 실질적인 결과를 만드는 데 집중합니다. 더 루멘 웹빌더 로컬 템플릿으로 생성된 무료 버전입니다.</p></div></section>
<section class="surface" id="service"><div class="container"><h2 style="font-size:36px;margin:0 0 18px">핵심 서비스</h2><div class="grid">${serviceCards || `<div class="card"><h3>맞춤 서비스</h3><p>업종에 맞는 설명을 입력하면 더 풍부한 페이지가 생성됩니다.</p></div>`}</div></div></section>
<section><div class="container"><div class="cta"><h2 style="font-size:34px;margin:0 0 10px">지금 바로 상담 받아보세요</h2><p style="margin:0 0 14px;opacity:.92">전화/카카오/네이버 예약 등 원하는 채널로 빠르게 연결해드립니다.</p><a class="btn" style="background:#fff;color:${t.primary}" href="#contact">상담 시작하기</a></div></div></section>
<footer id="contact"><div class="container"><div style="font-weight:700;margin-bottom:8px">${company}</div><div>전화: ${escapeHtml(form.phone || "미입력")} · 이메일: ${escapeHtml(form.email || "미입력")}</div><div style="margin-top:8px;font-size:13px;opacity:.8">© ${new Date().getFullYear()} ${company}. All rights reserved.</div></div></footer>
</body>
</html>`;
}
