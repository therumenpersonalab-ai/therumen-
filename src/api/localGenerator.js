function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function score(seed = "") {
  return [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
}

function pick(list, seed) {
  return list[score(seed) % list.length];
}

function inferBusinessMode(form) {
  if (form.businessMode && form.businessMode !== "auto") return form.businessMode;
  const txt = `${form.industry} ${form.description} ${form.services}`;
  if (/예약|객실|숙박|병원|케어/.test(txt)) return "예약형";
  if (/프로젝트|포트폴리오|디자인|건축|인테리어/.test(txt)) return "포트폴리오형";
  if (/블로그|뉴스|아카이브|매거진|콘텐츠/.test(txt)) return "콘텐츠형";
  if (/행사|컨퍼런스|페스티벌|프로모션|이벤트/.test(txt)) return "행사/프로모션형";
  if ((form.purpose || []).includes("shop")) return "판매형";
  return "소개/문의형";
}

function makeFeatureCards(items = [], t) {
  return items
    .map(
      (s, i) => `<div class="card fade-up" style="animation-delay:${i * 0.06}s"><h3>${escapeHtml(
        s
      )}</h3><p>${escapeHtml(s)} 중심으로 바로 운영 가능한 섹션입니다.</p></div>`
    )
    .join("");
}

function makeTemplateBlock(mode) {
  const map = {
    "판매형": ["프로모션 바", "카테고리 그리드", "상품 카드", "리뷰/Q&A", "FAQ"],
    "소개/문의형": ["핵심가치", "서비스 소개", "신뢰지표", "문의 폼"],
    "포트폴리오형": ["프로젝트 카테고리", "사례 그리드", "프로세스", "문의 CTA"],
    "예약형": ["객실/서비스", "예약 플로우", "위치", "공지"],
    "콘텐츠형": ["피처드 글", "아카이브", "구독 CTA", "소셜 연동"],
    "커뮤니티형": ["미션", "공지", "커뮤니티 후기", "Q&A"],
    "행사/프로모션형": ["행사개요", "프로그램", "연사", "신청 CTA"],
  };
  return map[mode] || map["소개/문의형"];
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
  const mode = inferBusinessMode(form);
  const desc = escapeHtml(form.description || `${company}는 ${industry} 분야의 전문 서비스를 제공합니다.`);

  const services = (form.services || "맞춤 컨설팅, 전문 서비스, 빠른 응대")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  const seed = `${form.company}-${industry}-${mode}-${options.extra || ""}`;
  const heroLayout = pick(["split", "center", "banner"], seed);
  const ctaText = pick(["무료로 시작하기", "지금 상담하기", "바로 문의하기", "샘플 보기"], seed + "cta");

  const heroImage = form?.uploadedImages?.hero || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1400&auto=format&fit=crop";
  const logo = form?.uploadedImages?.logo || "";

  const modeBlocks = makeTemplateBlock(mode);
  const featureCards = makeFeatureCards(services.length ? services : modeBlocks, t);

  const sectionVariant = pick(["surface", "white", "surface"], seed + "sec");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${company} | ${mode}</title>
<meta name="description" content="${company} ${industry} ${mode} 템플릿" />
<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box} body{margin:0;font-family:'${t.font}',Pretendard,sans-serif;background:${t.bg};color:${t.text};line-height:1.65}
.container{max-width:1180px;margin:0 auto;padding:0 20px}
.utility{background:${t.primary};color:#fff;font-size:12px;padding:8px 0;text-align:center}
nav{position:sticky;top:0;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid ${t.borderColor};z-index:20}
.nav-wrap{height:70px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.logo{font-weight:800;letter-spacing:-.4px}
.menu{display:flex;gap:14px;font-size:14px;color:#475569}
.hero{padding:86px 0;background:linear-gradient(140deg,${t.secondary},${t.bg})}
.hero-grid{display:grid;grid-template-columns:${heroLayout === "split" ? "1.1fr .9fr" : "1fr"};gap:28px;align-items:center}
.hero.center{text-align:center}
.hero h1{font-size:clamp(32px,5vw,58px);margin:0 0 12px;line-height:1.12;letter-spacing:-1.2px}
.hero p{font-size:18px;color:#475569;max-width:760px}
.btn{display:inline-block;background:${t.btnBg};color:${t.btnText};padding:13px 22px;border-radius:12px;text-decoration:none;font-weight:600;margin-top:10px;border:0}
.btn-ghost{display:inline-block;margin-left:8px;padding:12px 18px;border-radius:12px;border:1px solid ${t.primary};color:${t.primary};text-decoration:none;font-weight:600}
.hero-img{width:100%;border-radius:22px;min-height:340px;object-fit:cover;background:${t.surfaceBg};border:1px solid ${t.borderColor}}
section{padding:82px 0}
.surface{background:${t.surfaceBg}}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.card{background:#fff;border:1px solid ${t.borderColor};border-radius:16px;padding:24px}
.card h3{margin:0 0 8px;font-size:20px}
.card p{margin:0;color:#64748B;font-size:15px}
.badge{display:inline-block;background:${t.primary}15;color:${t.primary};padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:10px}
.cta{background:linear-gradient(135deg,${t.primary},${t.accent});color:#fff;border-radius:22px;padding:42px;text-align:center}
footer{padding:36px 0;background:#0F172A;color:#cbd5e1}
.fade-up{opacity:0;transform:translateY(14px);animation:fadeUp .6s ease forwards}
@keyframes fadeUp{to{opacity:1;transform:translateY(0)}}
@media (max-width: 1024px){.menu{display:none}}
@media (max-width: 900px){.hero-grid{grid-template-columns:1fr}.hero{padding:62px 0}.hero.center p{margin:0 auto}}
@media (max-width: 640px){section{padding:52px 0}.btn,.btn-ghost{display:block;margin:8px 0 0}}
</style>
</head>
<body>
<div class="utility">무료 로컬 템플릿 모드 · 업종+운영목적 기반 자동 생성</div>
<nav><div class="container nav-wrap"><div class="logo">${logo ? `<img src="${logo}" alt="logo" style="height:34px"/>` : company}</div><div class="menu"><span>업종: ${industry}</span><span>모드: ${mode}</span><span>테마: ${escapeHtml(t.name || "기본")}</span></div><a href="#contact" class="btn" style="padding:10px 16px">문의하기</a></div></nav>
<header class="hero ${heroLayout === "center" ? "center" : ""}"><div class="container hero-grid"><div><div class="badge">${mode} 템플릿</div><h1>${company}<br/>${industry} 맞춤 웹페이지</h1><p>${desc}</p><a class="btn" href="#service">${ctaText}</a><a class="btn-ghost" href="#preview">템플릿 구조 보기</a></div>${heroLayout === "split" ? `<img class="hero-img" src="${heroImage}" alt="hero"/>` : ""}</div></header>
<section id="preview"><div class="container"><h2 style="font-size:36px;margin:0 0 10px">자동 추천 템플릿 구성</h2><p style="max-width:760px;color:#64748B">업종(${industry}) + 운영목적(${mode}) 조합을 기반으로 실제 사례 패턴을 반영했습니다.</p><div class="grid" style="margin-top:18px">${modeBlocks.map((m, i) => `<div class="card fade-up" style="animation-delay:${i * 0.04}s"><h3>${escapeHtml(m)}</h3><p>${escapeHtml(m)} 섹션이 자동 포함되어 운영 시작 속도를 높입니다.</p></div>`).join("")}</div></div></section>
<section class="${sectionVariant}" id="service"><div class="container"><h2 style="font-size:36px;margin:0 0 18px">상세 콘텐츠 섹션</h2><div class="grid">${featureCards}</div></div></section>
<section><div class="container"><div class="cta"><h2 style="font-size:34px;margin:0 0 10px">${mode} 운영에 맞게 바로 배포하세요</h2><p style="margin:0 0 14px;opacity:.92">업종 중심 구조로 먼저 만들고, 필요한 경우 고급 모듈(FAQ/Q&A/아카이브/지원센터)을 추가할 수 있습니다.</p><a class="btn" style="background:#fff;color:${t.primary}" href="#contact">지금 시작하기</a></div></div></section>
<footer id="contact"><div class="container"><div style="font-weight:700;margin-bottom:8px">${company}</div><div>전화: ${escapeHtml(form.phone || "미입력")} · 이메일: ${escapeHtml(form.email || "미입력")} · 주소: ${escapeHtml(form.address || "미입력")}</div><div style="margin-top:8px;font-size:13px;opacity:.8">© ${new Date().getFullYear()} ${company}. All rights reserved.</div></div></footer>
</body>
</html>`;
}
