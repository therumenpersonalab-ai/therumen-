function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hash(seed = "") {
  return [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
}

function pick(arr, seed) {
  return arr[hash(seed) % arr.length];
}

function pickMany(arr, count, seed) {
  const cloned = [...arr];
  const out = [];
  let s = hash(seed) || 1;
  while (cloned.length && out.length < count) {
    const idx = s % cloned.length;
    out.push(cloned.splice(idx, 1)[0]);
    s = (s * 13 + 7) % 9973;
  }
  return out;
}

function inferBusinessMode(form) {
  if (form.businessMode && form.businessMode !== "auto") return form.businessMode;
  const txt = `${form.industry} ${form.description} ${form.services}`;
  if (/예약|객실|숙박|병원|케어|진료/.test(txt)) return "예약형";
  if (/프로젝트|포트폴리오|시공|디자인|건축|작품/.test(txt)) return "포트폴리오형";
  if (/블로그|뉴스|아카이브|매거진|콘텐츠|구독/.test(txt)) return "콘텐츠형";
  if (/행사|컨퍼런스|페스티벌|프로모션|이벤트|티켓/.test(txt)) return "행사/프로모션형";
  if (/커뮤니티|모임|동호회|Q&A|게시판/.test(txt)) return "커뮤니티형";
  if ((form.purpose || []).includes("shop") || /상품|쇼핑|판매|스토어/.test(txt)) return "판매형";
  return "소개/문의형";
}

function inferMood(industry = "") {
  if (/IT|가전|소프트웨어|기업|법무|컨설팅/.test(industry)) return "corporate";
  if (/패션|뷰티|예술|디자인|카페/.test(industry)) return "editorial";
  if (/행사|프로모션|피트니스|쇼핑/.test(industry)) return "bold";
  if (/동물|식물|교육|커뮤니티/.test(industry)) return "playful";
  return "corporate";
}

const MODE_PLANS = {
  "판매형": ["story", "categoryGrid", "productGrid", "reviews", "faq", "cta"],
  "소개/문의형": ["valueProps", "stats", "process", "testimonials", "contact", "cta"],
  "포트폴리오형": ["portfolioGrid", "timeline", "caseStudies", "testimonials", "contact", "cta"],
  "예약형": ["serviceGrid", "reservationFlow", "location", "faq", "contact", "cta"],
  "콘텐츠형": ["featuredPosts", "archive", "newsletter", "community", "cta"],
  "커뮤니티형": ["mission", "community", "board", "reviews", "faq", "cta"],
  "행사/프로모션형": ["eventProgram", "speakers", "schedule", "ticket", "faq", "cta"],
};

function sectionTitle(mode) {
  const map = {
    "판매형": "지금 판매를 시작하는 구조",
    "소개/문의형": "신뢰와 문의 전환 중심 구조",
    "포트폴리오형": "작품/사례를 돋보이게 하는 구조",
    "예약형": "예약 완료까지 이어지는 구조",
    "콘텐츠형": "구독과 재방문을 만드는 구조",
    "커뮤니티형": "참여와 소통을 키우는 구조",
    "행사/프로모션형": "신청 전환 중심 이벤트 구조",
  };
  return map[mode] || "맞춤형 구조";
}

function card(title, text, delay = 0) {
  return `<div class="card fade-up" style="animation-delay:${delay}s"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`;
}

function renderSection(key, ctx) {
  const { t, company, industry, services, seed } = ctx;
  const s3 = pickMany(services.length ? services : ["맞춤 전략", "실행 지원", "빠른 피드백", "지속 운영"], 3, seed + key);

  if (key === "story") {
    return `<section><div class="container"><h2>${company} 브랜드 스토리</h2><p class="lead">${company}는 ${industry} 분야에서 고객이 실제 성과를 체감할 수 있도록 운영되는 브랜드입니다. 소개·판매·신뢰요소를 함께 배치해 전환 효율을 높였습니다.</p></div></section>`;
  }

  if (key === "valueProps") {
    return `<section class="surface"><div class="container"><h2>왜 ${company}인가요?</h2><div class="grid">${card(s3[0], "핵심 문제를 빠르게 파악하고 실행합니다.", 0)}${card(s3[1], "쉽게 이해되는 구조로 결과를 전달합니다.", 0.06)}${card(s3[2], "운영 이후 개선까지 이어집니다.", 0.12)}</div></div></section>`;
  }

  if (key === "stats") {
    const nums = pickMany(["98%", "1,200+", "24h", "10년+", "4.9/5"], 4, seed + "stats");
    return `<section><div class="container"><h2>핵심 지표</h2><div class="stats">${nums.map((n, i) => `<div class="stat card fade-up" style="animation-delay:${i * 0.05}s"><strong>${n}</strong><span>운영 성과 지표</span></div>`).join("")}</div></div></section>`;
  }

  if (key === "process") {
    const steps = ["요구 파악", "구조 설계", "빠른 제작", "배포/개선"];
    return `<section class="surface"><div class="container"><h2>진행 프로세스</h2><div class="steps">${steps.map((st, i) => `<div class="step fade-up" style="animation-delay:${i * 0.05}s"><b>STEP ${i + 1}</b><h4>${st}</h4><p>${company} ${industry} 운영 목적에 맞게 단계별로 진행됩니다.</p></div>`).join("")}</div></div></section>`;
  }

  if (key === "categoryGrid") {
    const cats = pickMany(["신상품", "베스트", "기획전", "카테고리", "타임세일", "리뷰추천"], 6, seed + "cat");
    return `<section class="surface"><div class="container"><h2>카테고리 탐색</h2><div class="grid">${cats.map((c, i) => card(c, `${c} 중심으로 빠르게 탐색할 수 있습니다.`, i * 0.04)).join("")}</div></div></section>`;
  }

  if (key === "productGrid") {
    return `<section><div class="container"><h2>추천 상품/서비스</h2><div class="grid">${s3.map((x, i) => card(x, `${x} 관련 설명과 후기/문의로 전환을 유도합니다.`, i * 0.05)).join("")}${card("베스트 패키지", "프로모션 배지/혜택바를 함께 배치할 수 있습니다.", 0.2)}</div></div></section>`;
  }

  if (key === "portfolioGrid") {
    const works = pickMany(["상업공간", "브랜딩", "디지털", "리뉴얼", "시공사례", "프로젝트"], 6, seed + "works");
    return `<section><div class="container"><h2>프로젝트 갤러리</h2><div class="grid">${works.map((w, i) => card(w, `${w} 사례를 카테고리별로 보여주는 포트폴리오형 그리드`, i * 0.04)).join("")}</div></div></section>`;
  }

  if (key === "caseStudies") {
    return `<section class="surface"><div class="container"><h2>대표 사례</h2><div class="grid">${card("문제 정의", "고객 상황을 진단하고 핵심 목표를 명확히 설정", 0)}${card("해결 실행", "운영 목적에 맞춰 구조/카피/시각을 재구성", 0.06)}${card("성과 확인", "문의·예약·구매 전환 흐름까지 검증", 0.12)}</div></div></section>`;
  }

  if (key === "serviceGrid") {
    return `<section class="surface"><div class="container"><h2>서비스 안내</h2><div class="grid">${s3.map((x, i) => card(x, `${x} 예약/문의 가능 시간과 조건을 명확하게 안내`, i * 0.04)).join("")}</div></div></section>`;
  }

  if (key === "reservationFlow") {
    return `<section><div class="container"><h2>예약 진행 절차</h2><div class="steps">${["희망 일정 선택", "상세 정보 입력", "확인 연락", "예약 확정"].map((st, i) => `<div class="step fade-up" style="animation-delay:${i * 0.05}s"><b>${i + 1}</b><h4>${st}</h4><p>모바일에서도 간단하게 완료할 수 있습니다.</p></div>`).join("")}</div></div></section>`;
  }

  if (key === "location") {
    return `<section class="surface"><div class="container"><h2>위치/운영 정보</h2><div class="contact-box"><div><b>주소</b><p>${escapeHtml(ctx.form.address || "주소를 입력하면 지도/경로 버튼이 자동 연동됩니다.")}</p></div><div><b>운영시간</b><p>${escapeHtml(ctx.form.businessHours || "월-토 10:00~20:00")}</p></div><div><b>연락처</b><p>${escapeHtml(ctx.form.phone || "전화번호 미입력")}</p></div></div></div></section>`;
  }

  if (key === "featuredPosts") {
    return `<section><div class="container"><h2>추천 콘텐츠</h2><div class="grid">${card("핵심 인사이트", "짧고 강한 요약으로 클릭을 유도", 0)}${card("업데이트 소식", "신규 소식/공지/변경사항을 빠르게 전달", 0.06)}${card("실전 가이드", "업종 맞춤 실전 팁을 카드형으로 제공", 0.12)}</div></div></section>`;
  }

  if (key === "archive") {
    return `<section class="surface"><div class="container"><h2>아카이브</h2><div class="grid">${["공지", "뉴스", "리뷰", "이벤트"].map((x, i) => card(`${x} 보드`, `${x}를 날짜/카테고리로 관리합니다.`, i * 0.05)).join("")}</div></div></section>`;
  }

  if (key === "newsletter") {
    return `<section><div class="container"><div class="cta"><h2>새 소식을 먼저 받아보세요</h2><p>콘텐츠형 페이지에 최적화된 구독 섹션입니다.</p><a class="btn white" href="#contact">구독 시작</a></div></div></section>`;
  }

  if (key === "mission") {
    return `<section><div class="container"><h2>커뮤니티 미션</h2><p class="lead">${company} 커뮤니티는 정보 공유와 실제 실행을 함께 만드는 참여형 공간입니다.</p></div></section>`;
  }

  if (key === "community") {
    return `<section class="surface"><div class="container"><h2>커뮤니티 하이라이트</h2><div class="grid">${card("공지/일정", "월간 일정과 주요 안내를 한눈에", 0)}${card("참여 후기", "실제 참여 경험과 리뷰", 0.05)}${card("Q&A", "운영자 답변 중심 소통", 0.1)}</div></div></section>`;
  }

  if (key === "board") {
    return `<section><div class="container"><h2>게시판/질문</h2><div class="grid">${card("자주 묻는 질문", "핵심 질문을 먼저 보여주는 FAQ", 0)}${card("실시간 문의", "문의 채널과 응답 시간 안내", 0.06)}${card("운영 공지", "변경사항/점검/이벤트 공지", 0.12)}</div></div></section>`;
  }

  if (key === "eventProgram") {
    return `<section><div class="container"><h2>행사 개요</h2><p class="lead">프로모션/행사형 페이지에 맞춘 핵심 메시지와 신청 CTA를 중심으로 구성됩니다.</p></div></section>`;
  }

  if (key === "speakers") {
    return `<section class="surface"><div class="container"><h2>연사/파트너</h2><div class="grid">${["키노트", "세션", "패널"].map((x, i) => card(`${x} 소개`, `${x} 중심의 핵심 콘텐츠를 미리 안내`, i * 0.05)).join("")}</div></div></section>`;
  }

  if (key === "schedule") {
    return `<section><div class="container"><h2>프로그램 일정</h2><div class="steps">${["오프닝", "핵심 세션", "네트워킹", "클로징"].map((x, i) => `<div class="step fade-up" style="animation-delay:${i * 0.05}s"><b>${i + 1}</b><h4>${x}</h4><p>시간/장소/진행 정보를 명확히 표시합니다.</p></div>`).join("")}</div></div></section>`;
  }

  if (key === "ticket") {
    return `<section class="surface"><div class="container"><div class="cta"><h2>신청/참가 접수</h2><p>행사 목적에 맞는 신청 버튼과 안내 문구를 배치합니다.</p><a class="btn white" href="#contact">신청하기</a></div></div></section>`;
  }

  if (key === "reviews") {
    return `<section class="surface"><div class="container"><h2>고객 후기</h2><div class="grid">${card("김OO", "빠르게 반영되어 바로 운영할 수 있었습니다.", 0)}${card("박OO", "구조가 명확해서 문의 전환이 좋아졌어요.", 0.05)}${card("이OO", "모바일에서도 깔끔하게 보입니다.", 0.1)}</div></div></section>`;
  }

  if (key === "testimonials") {
    return `<section class="surface"><div class="container"><h2>추천/검증</h2><div class="grid">${card("도입 후기", "핵심 메시지가 명확해져 제안 성공률이 높아졌습니다.", 0)}${card("협업 후기", "작업-배포-수정이 빠르게 이어졌습니다.", 0.06)}${card("운영 후기", "초안 품질이 높아 운영 시작이 쉬웠습니다.", 0.12)}</div></div></section>`;
  }

  if (key === "timeline") {
    return `<section class="surface"><div class="container"><h2>프로젝트 타임라인</h2><div class="steps">${["기획", "디자인", "제작", "배포"].map((x, i) => `<div class="step fade-up" style="animation-delay:${i * 0.05}s"><b>${i + 1}</b><h4>${x}</h4><p>각 단계별 산출물을 명확히 보여줍니다.</p></div>`).join("")}</div></div></section>`;
  }

  if (key === "contact") {
    return `<section id="contact"><div class="container"><h2>문의/연락</h2><div class="contact-box"><div><b>전화</b><p>${escapeHtml(ctx.form.phone || "전화번호 미입력")}</p></div><div><b>이메일</b><p>${escapeHtml(ctx.form.email || "이메일 미입력")}</p></div><div><b>주소</b><p>${escapeHtml(ctx.form.address || "주소 미입력")}</p></div></div></div></section>`;
  }

  if (key === "faq") {
    const faqs = [
      ["얼마나 빨리 시작할 수 있나요?", "기본 템플릿은 즉시 생성되고 바로 수정 가능합니다."],
      ["모바일 최적화가 되나요?", "네, 모바일 우선 규칙이 기본 반영됩니다."],
      ["운영 중 수정도 쉬운가요?", "섹션 단위로 텍스트/구조를 쉽게 바꿀 수 있습니다."],
    ];
    return `<section><div class="container"><h2>자주 묻는 질문</h2><div class="faq">${faqs.map(([q, a], i) => `<details class="fade-up" style="animation-delay:${i * 0.05}s"><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div></section>`;
  }

  if (key === "cta") {
    return `<section><div class="container"><div class="cta"><h2>${sectionTitle(ctx.mode)}</h2><p>${industry} 업종과 ${ctx.mode} 목적에 맞는 구조를 지금 바로 사용할 수 있습니다.</p><a class="btn white" href="#contact">지금 시작하기</a></div></div></section>`;
  }

  return "";
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
  const mood = inferMood(form.industry || "");
  const desc = escapeHtml(form.description || `${company}는 ${industry} 분야의 전문 서비스를 제공합니다.`);
  const benchmark = form.benchmarkSiteName ? `${escapeHtml(form.benchmarkSiteName)} 레퍼런스 기반` : "업종 레퍼런스 기반";
  const services = (form.services || "맞춤 전략, 실행 지원, 운영 개선, 빠른 대응")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  const seed = `${form.company}-${industry}-${mode}-${form.benchmarkSiteUrl || ''}-${form.selectedTheme?.id || ''}-${options.extra || ""}`;
  const heroLayout = pick(["split", "center", "banner", "split", "center"], seed + "hero");
  const ctaText = pick(["무료로 시작하기", "지금 상담하기", "바로 문의하기", "샘플 보기"], seed + "cta");
  const heroImage = form?.uploadedImages?.hero || "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1400&auto=format&fit=crop";
  const logo = form?.uploadedImages?.logo || "";

  const plan = MODE_PLANS[mode] || MODE_PLANS["소개/문의형"];
  const sections = plan.map((k) => renderSection(k, { t, company, industry, mode, services, form, seed })).join("\n");

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
.hero{padding:86px 0;background:${mood === "bold" ? `linear-gradient(135deg, ${t.primary}, ${t.accent})` : `linear-gradient(140deg, ${t.secondary}, ${t.bg})`}}
.hero-grid{display:grid;grid-template-columns:${heroLayout === "split" ? "1.1fr .9fr" : "1fr"};gap:28px;align-items:center}
.hero.center{text-align:center}
.hero h1{font-size:clamp(34px,5vw,62px);margin:0 0 12px;line-height:1.1;letter-spacing:-1.2px;color:${mood === "bold" ? "#fff" : t.text}}
.hero p{font-size:18px;color:${mood === "bold" ? "rgba(255,255,255,.9)" : "#475569"};max-width:760px}
.btn{display:inline-block;background:${t.btnBg};color:${t.btnText};padding:13px 22px;border-radius:12px;text-decoration:none;font-weight:600;margin-top:10px;border:0}
.btn.white{background:#fff;color:${t.primary}}
.btn-ghost{display:inline-block;margin-left:8px;padding:12px 18px;border-radius:12px;border:1px solid ${mood === "bold" ? "#fff" : t.primary};color:${mood === "bold" ? "#fff" : t.primary};text-decoration:none;font-weight:600}
.hero-img{width:100%;border-radius:22px;min-height:340px;object-fit:cover;background:${t.surfaceBg};border:1px solid ${t.borderColor}}
section{padding:82px 0}
.surface{background:${t.surfaceBg}}
h2{font-size:36px;line-height:1.2;margin:0 0 14px;letter-spacing:-.8px}
.lead{font-size:18px;color:#64748B;max-width:840px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.card{background:#fff;border:1px solid ${t.borderColor};border-radius:16px;padding:24px}
.card h3{margin:0 0 8px;font-size:20px}
.card p{margin:0;color:#64748B;font-size:15px}
.badge{display:inline-block;background:${t.primary}15;color:${t.primary};padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:10px}
.cta{background:linear-gradient(135deg,${t.primary},${t.accent});color:#fff;border-radius:22px;padding:42px;text-align:center}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.stat strong{display:block;font-size:36px;line-height:1.1;color:${t.primary}}
.stat span{font-size:13px;color:#64748B}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.step{background:#fff;border:1px solid ${t.borderColor};border-radius:14px;padding:18px}
.step b{display:inline-block;background:${t.primary};color:#fff;border-radius:999px;padding:4px 10px;font-size:12px}
.step h4{margin:10px 0 6px;font-size:18px}
.step p{margin:0;color:#64748B}
.faq details{background:#fff;border:1px solid ${t.borderColor};border-radius:12px;padding:14px 16px;margin-bottom:10px}
.faq summary{cursor:pointer;font-weight:600}
.faq p{margin:8px 0 0;color:#64748B}
.contact-box{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.contact-box > div{background:#fff;border:1px solid ${t.borderColor};border-radius:14px;padding:16px}
footer{padding:36px 0;background:#0F172A;color:#cbd5e1}
.fade-up{opacity:0;transform:translateY(14px);animation:fadeUp .6s ease forwards}
@keyframes fadeUp{to{opacity:1;transform:translateY(0)}}
@media (max-width: 1024px){.menu{display:none}}
@media (max-width: 900px){.hero-grid{grid-template-columns:1fr}.hero{padding:62px 0}.hero.center p{margin:0 auto}}
@media (max-width: 640px){section{padding:52px 0}.btn,.btn-ghost{display:block;margin:8px 0 0}h2{font-size:30px}.lead{font-size:16px}}
</style>
</head>
<body>
<div class="utility">무료 로컬 템플릿 모드 · 업종+운영목적 기반 자동 생성</div>
<nav><div class="container nav-wrap"><div class="logo">${logo ? `<img src="${logo}" alt="logo" style="height:34px"/>` : company}</div><div class="menu"><span>업종: ${industry}</span><span>모드: ${mode}</span><span>테마: ${escapeHtml(t.name || "기본")}</span></div><a href="#contact" class="btn" style="padding:10px 16px">문의하기</a></div></nav>
<header class="hero ${heroLayout === "center" ? "center" : ""}"><div class="container hero-grid"><div><div class="badge">${mode} 템플릿 · ${benchmark}</div><h1>${company}<br/>${industry} 맞춤 웹페이지</h1><p>${desc}</p><a class="btn" href="#contact">${ctaText}</a></div>${heroLayout === "split" ? `<img class="hero-img" src="${heroImage}" alt="hero"/>` : ""}</div></header>
<section id="structure"><div class="container"><h2>${sectionTitle(mode)}</h2><p class="lead">업종(${industry}) + 운영목적(${mode}) 조합을 기반으로 실제 사례 패턴을 반영해 템플릿을 자동 구성했습니다.</p></div></section>
${sections}
<footer><div class="container"><div style="font-weight:700;margin-bottom:8px">${company}</div><div>전화: ${escapeHtml(form.phone || "미입력")} · 이메일: ${escapeHtml(form.email || "미입력")} · 주소: ${escapeHtml(form.address || "미입력")}</div><div style="margin-top:8px;font-size:13px;opacity:.8">© ${new Date().getFullYear()} ${company}. All rights reserved.</div></div></footer>
</body>
</html>`;
}
