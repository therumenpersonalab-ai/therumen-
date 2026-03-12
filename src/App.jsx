import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { generateLocalHtml } from "./api/localGenerator";
import benchmarkCards from "../data/benchmark_cards.json";

const INITIAL_CREDIT  = 200;
const COST_GENERATE   = 80;
const COST_REGENERATE = 30;
const COST_AI_IMAGE   = 20;
const COST_TEXT_EDIT   = 5;
const COST_INLINE_EDIT = 3;

// ── 업종별 자동 프리셋 (아임웹 시각 클러스터 반영) ──────────
const INDUSTRY_PRESETS = {
  "음식/카페": { desc:"정성 가득한 수제 요리와 특별한 분위기의 카페", services:"시그니처 커피, 브런치 세트, 디저트, 케이크", target:"20~40대 맛집 탐방 고객", purpose:["info","booking"], pages:["about","service","review","map","contact"], themeId:"fresh_mint", tone:"friendly", illust:"flat", visualMood:"editorial", heroType:"fullscreen" },
  "뷰티/미용": { desc:"고객 한 분 한 분에게 맞춤 시술을 제공하는 뷰티 전문점", services:"커트, 펌, 염색, 두피케어, 네일아트", target:"20~50대 여성, 스타일 변화를 원하는 분", purpose:["info","booking","brand"], pages:["about","service","portfolio","review","map","contact"], themeId:"warm_rose", tone:"friendly", illust:"line", visualMood:"editorial", heroType:"fullscreen" },
  "의료/헬스": { desc:"전문 의료진이 함께하는 건강한 삶을 위한 파트너", services:"건강검진, 진료, 물리치료, 운동처방, PT", target:"30~60대 건강관리에 관심 있는 분", purpose:["info","booking","brand"], pages:["about","service","review","faq","map","contact"], themeId:"deep_navy", tone:"professional", illust:"minimal", visualMood:"corporate", heroType:"split" },
  "교육/학원": { desc:"학생의 잠재력을 끌어내는 맞춤형 교육 프로그램", services:"수학, 영어, 입시컨설팅, 내신관리, 특강", target:"중·고등학생 학부모", purpose:["info","booking","edu"], pages:["about","service","review","faq","contact"], themeId:"deep_navy", tone:"professional", illust:"flat", visualMood:"corporate", heroType:"split" },
  "IT/소프트웨어": { desc:"비즈니스 성장을 가속하는 기술 솔루션 전문 기업", services:"웹개발, 앱개발, 클라우드, AI 솔루션", target:"스타트업 및 중소기업 의사결정자", purpose:["info","brand","invest"], pages:["about","service","portfolio","review","faq","contact"], themeId:"deep_navy", tone:"professional", illust:"iso", visualMood:"corporate", heroType:"split" },
  "제조/생산": { desc:"최고 품질의 제품을 생산하는 신뢰받는 제조 전문 기업", services:"제품설계, 금형제작, 대량생산, 품질관리", target:"B2B 거래처 및 납품 기업", purpose:["info","brand","invest"], pages:["about","service","portfolio","faq","contact"], themeId:"deep_navy", tone:"professional", illust:"minimal", visualMood:"corporate", heroType:"split" },
  "법무/세무/컨설팅": { desc:"전문가의 노하우로 고객의 성공을 함께 만드는 파트너", services:"법률상담, 세무기장, 경영컨설팅, 노무관리", target:"개인사업자 및 중소기업 대표", purpose:["info","booking","brand"], pages:["about","service","review","faq","contact"], themeId:"deep_navy", tone:"professional", illust:"minimal", visualMood:"corporate", heroType:"split" },
  "쇼핑/이커머스": { desc:"엄선된 상품을 합리적인 가격에 만나보세요", services:"인기상품, 신상품, 베스트셀러, 한정특가", target:"20~40대 온라인 쇼핑 고객", purpose:["info","shop","brand"], pages:["about","service","review","faq","contact"], themeId:"vibrant_energy", tone:"friendly", illust:"flat", visualMood:"bold", heroType:"fullscreen" },
  "부동산": { desc:"믿을 수 있는 부동산 전문가와 함께하는 최적의 선택", services:"매매, 전월세, 상가임대, 분양상담, 투자자문", target:"30~50대 내집마련·투자 관심 고객", purpose:["info","booking","brand"], pages:["about","service","portfolio","review","map","contact"], themeId:"deep_navy", tone:"professional", illust:"minimal", visualMood:"corporate", heroType:"split" },
  "여행/숙박": { desc:"특별한 순간을 만드는 힐링 여행·숙박 전문", services:"객실예약, 패키지투어, 체험프로그램, 식사", target:"20~50대 여행·힐링에 관심 있는 고객", purpose:["info","booking","portfolio"], pages:["about","service","portfolio","review","map","contact"], themeId:"fresh_mint", tone:"emotional", illust:"line", visualMood:"editorial", heroType:"fullscreen" },
  "반려동물": { desc:"사랑하는 반려동물과 함께하는 행복한 시간", services:"미용, 호텔링, 건강검진, 용품, 놀이터", target:"20~40대 반려동물 양육 가족", purpose:["info","booking","brand"], pages:["about","service","review","map","contact"], themeId:"warm_rose", tone:"friendly", illust:"flat", visualMood:"playful", heroType:"fullscreen" },
  "기타": { desc:"", services:"", target:"", purpose:["info","brand"], pages:["about","service","review","contact"], themeId:"deep_navy", tone:"professional", illust:"flat", visualMood:"corporate", heroType:"split" },
};

const THEMES = [
  { id:"warm_rose",      name:"🌸 Warm Rose",      desc:"미용·뷰티·반려동물",      primary:"#E8847A", secondary:"#F5E6D3", accent:"#C9A96E", bg:"#FDF8F5", text:"#3D2B1F", font:"Noto Serif KR",  mood:"감성/따뜻함",    btnBg:"#E8847A", btnText:"#fff", surfaceBg:"#FFF8F5", borderColor:"rgba(61,43,31,0.08)" },
  { id:"fresh_mint",     name:"🌿 Fresh Mint",     desc:"카페·베이커리·여행",        primary:"#5BA9A0", secondary:"#F0F7F5", accent:"#E8D5B0", bg:"#F8FFFE", text:"#1A3330", font:"Gmarket Sans",   mood:"감성/따뜻함",    btnBg:"#5BA9A0", btnText:"#fff", surfaceBg:"#F0F7F5", borderColor:"rgba(26,51,48,0.08)" },
  { id:"deep_navy",      name:"🌊 Deep Navy",      desc:"학원·의원·컨설팅·IT",      primary:"#1B3A5C", secondary:"#F8F9FA", accent:"#4A90D9", bg:"#FFFFFF", text:"#1B3A5C", font:"Pretendard",     mood:"전문적/신뢰감",  btnBg:"#1B3A5C", btnText:"#fff", surfaceBg:"#F1F5F9", borderColor:"rgba(27,58,92,0.08)" },
  { id:"vibrant_energy", name:"⚡ Vibrant Energy", desc:"헬스·쇼핑·엔터테인먼트",   primary:"#FF6B35", secondary:"#FFF7ED", accent:"#FFD700", bg:"#FFFCFA", text:"#1A1A2E", font:"Pretendard",     mood:"활기/역동적",    btnBg:"#FF6B35", btnText:"#fff", surfaceBg:"#FFF7ED", borderColor:"rgba(26,26,46,0.08)" },
  { id:"natural_wood",   name:"🪵 Natural Wood",   desc:"공방·플로리스트·소품샵",   primary:"#8B6F47", secondary:"#FAF6F0", accent:"#6B8E6B", bg:"#FAF6F0", text:"#3D2B1F", font:"Noto Serif KR", mood:"단순/미니멀",    btnBg:"#8B6F47", btnText:"#fff", surfaceBg:"#F5EFE6", borderColor:"rgba(61,43,31,0.08)" },
];

const ILLUST_STYLES = [
  { id:"flat",    label:"🎨 플랫",    desc:"색면 위주, 모던" },
  { id:"line",    label:"✏️ 라인",    desc:"손그림 감성" },
  { id:"iso",     label:"📦 입체",    desc:"3D 아이소" },
  { id:"minimal", label:"🔲 미니멀",  desc:"도형+선" },
];

const INTRO_TONES = [
  { id:"friendly",     label:"😊 친근", desc:"편안하고 다정" },
  { id:"professional", label:"👔 전문", desc:"신뢰감·전문성" },
  { id:"emotional",    label:"✨ 감성", desc:"따뜻하고 감성적" },
];

const INDUSTRIES = ["음식/카페","뷰티/미용","의료/헬스","교육/학원","IT/소프트웨어","제조/생산","법무/세무/컨설팅","쇼핑/이커머스","부동산","여행/숙박","반려동물","기타"];

const INDUSTRY_TEMPLATE_MATCH = {
  "음식/카페": ["식품", "카페", "요식", "푸드", "라이프"],
  "뷰티/미용": ["뷰티", "패션", "디자인"],
  "의료/헬스": ["의료", "헬스", "건강"],
  "교육/학원": ["교육", "학원", "기업"],
  "IT/소프트웨어": ["IT", "가전", "기업", "비즈니스"],
  "제조/생산": ["기업", "비즈니스", "인테리어", "건축"],
  "법무/세무/컨설팅": ["기업", "비즈니스", "컨설팅"],
  "쇼핑/이커머스": ["패션", "잡화", "식품", "동물", "식물", "IT"],
  "부동산": ["인테리어", "건축", "기업", "비즈니스"],
  "여행/숙박": ["여행", "숙박", "생활", "취미"],
  "반려동물": ["동물", "식물", "생활"],
  "기타": [],
};

const MOOD_LABELS = {
  editorial: "감성 에디토리얼 무드",
  "minimal-premium": "프리미엄 미니멀 무드",
  "image-immersive": "이미지 몰입형 무드",
  "minimal-editorial": "정돈된 미니멀 무드",
  "bold-d2c": "강한 D2C 세일즈 무드",
  "lifestyle-magazine": "라이프스타일 매거진 무드",
  "friendly-trust": "친근·신뢰형 무드",
  "corporate-tooling": "코퍼레이트 툴형 무드",
  "auto-derived": "균형형 비즈니스 무드",
};

const PURPOSE_OPTIONS = [
  { id:"info",      label:"📋 정보 제공",   desc:"메뉴·위치·영업시간" },
  { id:"booking",   label:"📅 예약·문의",   desc:"온라인 예약 및 상담" },
  { id:"shop",      label:"🛒 온라인 판매", desc:"쇼핑몰·결제" },
  { id:"portfolio", label:"🖼️ 포트폴리오", desc:"작업물·사례 전시" },
  { id:"brand",     label:"✨ 브랜드 신뢰", desc:"이미지 제고" },
  { id:"invest",    label:"💼 투자자 유치", desc:"IR·파트너" },
  { id:"recruit",   label:"👥 채용",        desc:"인재 채용" },
  { id:"edu",       label:"📚 교육·강의",   desc:"강의·프로그램" },
];

const BUSINESS_MODES = ["auto","판매형","소개/문의형","포트폴리오형","예약형","콘텐츠형","커뮤니티형","행사/프로모션형"];

const MODE_COPY_PRESETS = {
  "판매형": { desc: "지금 가장 잘 나가는 상품을 빠르게 만나보세요", services: "베스트셀러 상품, 시즌 특가, 추천 패키지" },
  "소개/문의형": { desc: "신뢰할 수 있는 서비스와 전문 상담을 제공합니다", services: "핵심 서비스 소개, 상담 문의, 맞춤 제안" },
  "포트폴리오형": { desc: "완성도 높은 결과물과 실제 사례를 확인해보세요", services: "대표 작업 사례, 프로젝트 소개, 성과 리뷰" },
  "예약형": { desc: "원하는 시간에 간편하게 예약하고 이용하세요", services: "실시간 예약, 일정 선택, 방문/상담 접수" },
  "콘텐츠형": { desc: "유익한 정보와 노하우를 정리해 전달합니다", services: "전문 칼럼, 가이드 콘텐츠, 업데이트 소식" },
  "커뮤니티형": { desc: "고객과 함께 소통하며 가치를 만들어갑니다", services: "후기 공유, Q&A, 커뮤니티 소식" },
  "행사/프로모션형": { desc: "지금 진행 중인 특별 혜택과 이벤트를 확인하세요", services: "기간 한정 이벤트, 할인 프로모션, 참여 안내" },
};

const PAGE_OPTIONS = [
  { id:"about",     label:"회사 소개" },
  { id:"service",   label:"서비스/제품" },
  { id:"portfolio", label:"포트폴리오" },
  { id:"review",    label:"고객 후기" },
  { id:"faq",       label:"FAQ" },
  { id:"map",       label:"오시는 길" },
  { id:"contact",   label:"문의/예약" },
];

const FEATURES = [
  { id:"map",       label:"📍 구글 지도 삽입",   cost:10, prompt:"오시는 길 섹션에 구글 지도 임베드 placeholder를 추가하세요." },
  { id:"kakao",     label:"💬 카카오채널 버튼",  cost:15, prompt:"우측 하단 고정 카카오채널 상담 버튼을 추가하세요." },
  { id:"color",     label:"🎨 컬러 테마 변경",   cost:15, prompt:"전체 색상 팔레트를 세련된 다른 컬러로 리디자인하세요." },
  { id:"popup",     label:"📢 팝업 배너",         cost:20, prompt:"페이지 진입 시 이벤트/공지 팝업을 추가하세요." },
  { id:"sns",       label:"📷 SNS 피드 연동",     cost:25, prompt:"인스타그램 피드 스타일의 갤러리 섹션을 추가하세요." },
  { id:"form",      label:"📅 예약/문의 폼",      cost:40, prompt:"이메일 연동 예약 및 문의 폼 섹션을 추가하세요." },
  { id:"ai_text",   label:"✍️ 소개글 AI 재작성", cost:20, prompt:"업종과 브랜드에 맞는 감성적인 소개글로 전면 교체하세요." },
  { id:"animation", label:"✨ 애니메이션 효과",   cost:25, prompt:"스크롤 시 섹션들이 부드럽게 등장하는 CSS 애니메이션을 추가하세요." },
];

const AI_IMAGE_SLOTS = [
  { id:"hero",   label:"히어로 이미지", size:"1792x1024",
    buildPrompt:(f,kr) => "A stunning professional hero banner for a " + f.industry + " business called " + f.company + ". High-end commercial photography, cinematic lighting." + (kr ? " Korean people if applicable." : "") + " Absolutely no text anywhere." },
  { id:"svc1",   label:"서비스 이미지 1", size:"1024x1024",
    buildPrompt:(f,kr) => "Professional service photo for " + f.company + " " + f.industry + "." + (kr ? " Korean people." : "") + " No text anywhere." },
  { id:"svc2",   label:"서비스 이미지 2", size:"1024x1024",
    buildPrompt:(f,kr) => "Lifestyle scene for " + f.company + " " + f.industry + "." + (kr ? " Korean people." : "") + " No text anywhere." },
  { id:"svc3",   label:"서비스 이미지 3", size:"1024x1024",
    buildPrompt:(f,kr) => "Detail close-up for " + f.company + " " + f.industry + " quality." + (kr ? " Korean people." : "") + " No text anywhere." },
  { id:"bg",     label:"배경 이미지", size:"1792x1024",
    buildPrompt:(f,_)  => "Abstract background texture for " + f.industry + " website. Subtle elegant. No text anywhere." },
];

// ── API ────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function callClaude(messages) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: 16000 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.html;
}

async function generateDalleImage(prompt, size) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task: 'ai_image', prompt, size }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.image;
}

// ── 감마 + 아임웹 디자인 시스템 기반 프롬프트 빌더 ──────────
function buildPrompt(form, extra) {
  const pages = ["메인(홈)", ...PAGE_OPTIONS.filter(p => form.pages.includes(p.id)).map(p => p.label)];
  const purposeText = form.purpose
    .map(id => (PURPOSE_OPTIONS.find(p => p.id === id) || {}).label || id)
    .join(", ");
  const theme = form.selectedTheme;
  const tonLabel = (INTRO_TONES.find(t => t.id === form.introTone) || {}).label || "전문";
  const illustDesc = { line:"라인 스케치(stroke-width:1.5)", iso:"아이소메트릭(60도 축)", minimal:"미니멀 아이콘(기하도형)", flat:"플랫 일러스트(색면)" }[form.illustStyle] || "플랫";
  const { logo, hero, products } = form.uploadedImages;
  const primaryColor = theme ? theme.primary : "#2563EB";
  const kakaoUrl = form.kakaoId ? "https://pf.kakao.com/_" + form.kakaoId + "/chat" : "";
  const hasCta = !!(form.kakaoId || form.naverUrl);
  const preset = INDUSTRY_PRESETS[form.industry] || {};
  const visualMood = preset.visualMood || "corporate";
  const heroType = preset.heroType || "split";

  // 아임웹 시각 클러스터별 디자인 규칙
  const MOOD_RULES = {
    editorial: `[시각 무드: 미니멀/에디토리얼 — 아임웹 The Soap Company, DIVINE, Fresh Grove 참고]
- 넉넉한 여백(섹션 패딩 120px+), 콘텐츠는 좁은 max-width(680px) 집중
- 이미지는 border-radius:0 또는 4px (날카로운 인상), aspect-ratio:3/4 또는 16/9
- 타이포: 세리프 또는 얇은 산세리프, letter-spacing:0.5~1px (heading), 대문자 사용 가능
- 색상: 뉴트럴 베이지/오프화이트/차콜, 포인트 컬러는 매우 절제
- 카드: border 없이 여백으로 구분, 또는 매우 얇은 1px border
- CTA: ghost 스타일 또는 텍스트 링크 + 화살표(→) 우선
- 히어로: 풀블리드 이미지 + 중앙 대형 카피(오버레이), 또는 큰 여백 + 에디토리얼 텍스트`,
    corporate: `[시각 무드: 코퍼레이트/SaaS — 아임웹 workflow, GLOBAL LOGISTICS, Startup 참고]
- 정보 밀도 높음, 섹션마다 명확한 목적(문제제기→기능→이점→신뢰→전환)
- 히어로: 좌측 텍스트(60%) + 우측 이미지/일러스트(40%) split 레이아웃
- KPI/지표 섹션 필수: 대형 숫자(48px+) + 라벨, 3~4개 가로 배치
- 기능 카드: 아이콘(SVG) + 제목 + 2줄 설명, 3열 그리드
- 프로세스/How it works: 번호 매긴 3~4단계 스텝 (STEP 01 → 02 → 03)
- 고객사 로고 클라우드: 5~6개 회색 로고 가로 배치 (신뢰 섹션)
- CTA: Primary 버튼 강하게, 여러 섹션에서 반복 노출
- 색상: 화이트 기반, 포인트 컬러는 버튼과 아이콘에 집중`,
    bold: `[시각 무드: 볼드/포스터형 — 아임웹 Grab it, Seoul Designer Conference 참고]
- 강한 타이포그래피가 주인공: display 사이즈 72px+, font-weight:900
- 고채도 대비 색상 조합, 배경색 전환이 과감 (섹션마다 완전 다른 배경색)
- 히어로: 풀스크린 컬러 배경 + 거대 텍스트(72~96px) + 미니멀 CTA
- 이미지: 잘라내기(clip-path), 동그란 마스크, 또는 배경으로만 사용
- 카드: 두꺼운 border(2~3px) 또는 강한 배경색 카드
- 여백: 상대적으로 타이트, 요소 간 gap 작고 밀집도 높음
- CTA: 풀폭 버튼 또는 대형 pill 버튼, 강한 대비색`,
    playful: `[시각 무드: 플레이풀/일러스트형 — 아임웹 PIT A PET, 제주도 농산물 마켓 참고]
- 둥근 corner-radius(20px+), 부드러운 그림자, 따뜻한 색감
- 히어로: 일러스트/캐릭터 + 텍스트, 또는 컬러풀 그라디언트 배경
- 카드: 라운드(20px), 살짝 기울어진 느낌, 배경색 카드
- 아이콘: 둥글고 컬러풀한 원형 배경 위 아이콘
- 서체: 부드러운 고딕(Gmarket Sans, Pretendard), 행간 넓게
- 색상: 파스텔 + 포인트 비비드, 배경도 컬러 사용
- CTA: pill 형태(border-radius:50px), 그림자 있는 부드러운 버튼`
  };

  const moodRule = MOOD_RULES[visualMood] || MOOD_RULES.corporate;

  // 아임웹 공통 패턴: 섹션 리듬
  const sectionRhythm = `=== 섹션 리듬 (아임웹 68개 템플릿 공통 패턴) ===
페이지는 "같은 스타일의 섹션 반복"이 아니라 시각적 리듬을 가져야 합니다:
1. [히어로] 강한 첫 인상 — 대형 비주얼 + 핵심 카피 + CTA
2. [브랜드 소개] 텍스트 중심 — 미션·가치·스토리 (여백 넓게)
3. [서비스/상품] 카드 그리드 — 배경색 전환 (surface 컬러)
4. [프로세스] 번호 스텝 또는 타임라인 — "어떻게 이용하나요?"
5. [신뢰 증명] KPI 숫자 + 고객 후기 카드 — 진한 배경 또는 액센트 배경
6. [CTA 밴드] 전환 유도 — 그라디언트/진한 배경 + 강한 버튼
7. [위치/연락] 실용 정보 — 지도·영업시간·연락처
8. [푸터] 다크 배경 — 법적 정보·링크·SNS

핵심: 배경색이 흰색→surface→흰색→진한색 순으로 교차해야 시각 리듬이 생깁니다.
절대로 연속 3개 섹션이 같은 배경색이면 안 됩니다.`;

  const text = `당신은 아임웹(imweb.me) + Gamma.app 수준의 세계 최고 한국어 웹 디자이너입니다.
아래 정보를 기반으로 실제 런칭 가능한 소상공인 홈페이지를 단일 HTML 파일로 생성하세요.

=== 핵심 원칙 (아임웹 + Gamma 통합) ===
1. "아름다움이 기본값" — 디자인 지식 없는 소상공인도 바로 쓸 수 있는 퀄리티
2. "3층 구조" — 공통 컴포넌트 엔진 + 업종별 정보구조 + 시각 무드 토큰
3. "콘텐츠 우선" — 장식보다 텍스트 가독성, 사진이 주인공
4. "결과 중심 CTA" — 기능명이 아닌 행동 문구 (예: "지금 예약하기", "견적 받기")
5. "섹션 리듬" — 배경색 교차, 밀도 변화, 시각적 박자감

=== 브랜드 정보 ===
브랜드명: ${form.company}
업종: ${form.industry}
소개: ${form.description}
서비스/제품: ${form.services}
대표자: ${form.ceo || "-"}
목적: ${purposeText}
타겟: ${form.target}
페이지 구성: ${pages.join(" / ")}
소개글 톤: ${tonLabel}

=== 연락처 & 채널 ===
전화: ${form.phone || "-"} | 이메일: ${form.email || "-"} | 주소: ${form.address || "-"} | SNS: ${form.sns || "-"}
카카오채널: ${form.kakaoId ? "@" + form.kakaoId : "없음"} | 네이버예약: ${form.naverUrl || "없음"} | 영업시간: ${form.businessHours || "-"}

=== 테마 시스템 ===
${theme ? `테마: ${theme.name}
Primary: ${theme.primary} (CTA·강조) | Secondary: ${theme.secondary} (교대 섹션 배경)
Accent: ${theme.accent} (뱃지·태그) | 배경: ${theme.bg} | 텍스트: ${theme.text}
버튼: bg=${theme.btnBg} text=${theme.btnText} | Surface: ${theme.surfaceBg}
Border: ${theme.borderColor} | 폰트: ${theme.font}` : "자유 설계"}

${moodRule}

=== 이미지 처리 ===
${logo ? '로고: <img src="__LOGO__"> nav+footer (max-height:44px)' : '로고 없음 → font-weight:800 워드마크 (letter-spacing:-1px)'}
${hero ? '히어로: <img src="__HERO__"> (object-fit:cover, 어두운 오버레이 30~50%)' : '히어로 없음 → 시각 무드에 맞는 CSS 배경 (그라디언트/패턴/단색)'}
${products.length > 0 ? products.length + "장 제품: __PRODUCT_0__~__PRODUCT_" + (products.length - 1) + "__ (border-radius:16px, object-fit:cover)" : "제품 없음 → SVG 아이콘 + 그라디언트 배경 카드"}

=== SVG 규칙 ===
스타일: ${illustDesc}
- viewBox="0 0 48 48", 도형+선 최대 3개, fill="none" stroke="${primaryColor}" stroke-width="1.5"
- 서비스 카드: 72x72 둥근 배경(${primaryColor}10) 위에 48x48 아이콘

=== 레이아웃 그리드 ===
Desktop: max-width:1200px, 12col grid, gutter:24px, section-padding:96px 0
Tablet(<1024px): container:90vw, gutter:20px, section-padding:72px 0
Mobile(<768px): container:100%, padding:0 16px, section-padding:48px 0, single column

=== 타이포그래피 스케일 ===
display-xl: 64px/36px(모바일) — Hero H1, font-weight:700, letter-spacing:-2px, line-height:1.1
heading-xl: 44px/28px — 섹션 H2, font-weight:600, letter-spacing:-1px, line-height:1.2
heading-md: 24px/20px — 카드 제목, font-weight:600
body-lg: 20px/17px — Hero 서브, line-height:1.65
body-md: 17px/16px — 본문, line-height:1.65
caption: 14px/13px — 라벨/헬퍼

=== 카드 스타일 ===
radius: sm=12px, md=16px, lg=24px
border: 1px solid ${theme ? theme.borderColor : "rgba(0,0,0,0.06)"}
shadow-soft: 0 8px 24px rgba(15,23,42,0.06)
shadow-hover: 0 16px 40px rgba(15,23,42,0.1)
카드 hover: transform:translateY(-4px) + shadow-hover (transition:all 0.3s)

=== 버튼 스타일 ===
Primary: height:52px, radius:14px, font:16px/600, padding:0 28px, bg:${primaryColor}, color:${theme ? theme.btnText : "#fff"}
  hover: translateY(-2px) + box-shadow:0 8px 20px ${primaryColor}40
Secondary: outline, border:1.5px solid ${primaryColor}, bg:transparent, color:${primaryColor}
  hover: bg:${primaryColor}08

${sectionRhythm}

=== 페이지 카드 구조 (상세) ===

[NAV] height:72px, sticky, top:0, z-index:100
  스크롤0: background:transparent
  스크롤50+: bg:rgba(255,255,255,0.92), backdrop-filter:blur(12px), shadow:0 1px 3px rgba(0,0,0,0.06)
  좌측: 로고/워드마크 | 우측: 메뉴링크(15px/400) + CTA버튼(Primary 스타일, 작은 사이즈)
  모바일(<768px): 햄버거(☰) + 슬라이드 드로어(right, 전체높이, 배경 blur)

[HERO] min-height:${heroType === "fullscreen" ? "100vh" : "90vh"}
${heroType === "fullscreen"
  ? `  풀스크린 레이아웃: 전체 배경(이미지 또는 그라디언트) + 중앙 정렬 텍스트
  오버레이: background:rgba(0,0,0,0.35) (이미지 있을 때)
  h1: clamp(36px,6vw,72px), color:#fff(이미지시) 또는 ${theme ? theme.text : "#1E293B"}, text-align:center
  서브: 20px, max-width:600px, margin:0 auto, text-align:center
  CTA 버튼: 중앙 정렬, Primary + Secondary 나란히`
  : `  Split 레이아웃: 좌측 텍스트(55%) + 우측 미디어(45%)
  h1: clamp(36px,5vw,64px), font-weight:700, letter-spacing:-2px
  서브: 18px, line-height:1.7, color:${theme ? theme.text + "99" : "#6B7280"}, max-width:520px
  CTA 버튼: Primary + Secondary 나란히, 모바일은 수직스택
  우측: 이미지 또는 SVG 일러스트 (border-radius:24px, shadow-soft)`}

[BRAND_STORY] padding:96px 0, text-align:center, 배경:흰색
  브랜드 소개글(${tonLabel} 톤, 3~4문장), max-width:680px, margin:0 auto
  font-size:20px, line-height:1.8, color:${theme ? theme.text : "#374151"}
  하단에 구분선(width:48px, height:2px, bg:${primaryColor}, margin:24px auto 0)

[STATS] padding:64px 0, 배경:${theme ? theme.surfaceBg : "#F8FAFC"}
  신뢰 수치 3~4개: display:flex, justify-content:center, gap:64px
  각 수치: font-size:clamp(36px,4vw,56px)/700/${primaryColor}
  라벨: font-size:14px/#6B7280, margin-top:4px
  수치 예: 경력 N년 / 누적 고객 N+ / 만족도 N% / 시술 건수 N+ (업종에 맞게)

[SERVICE] padding:96px 0, 배경:흰색
  섹션 타이틀: clamp(28px,3.5vw,44px)/600/center, margin-bottom:16px
  섹션 서브: 16px/#6B7280/center, max-width:500px, margin:0 auto 48px
  그리드: repeat(auto-fit, minmax(280px, 1fr)), gap:24px
  카드: bg:${theme ? theme.surfaceBg : "#F8FAFC"}, radius:16px, padding:32px, border:1px solid ${theme ? theme.borderColor : "rgba(0,0,0,0.06)"}
  카드 내부: SVG아이콘(72x72배경+48x48) → 서비스명(20px/600, margin:16px 0 8px) → 설명/가격(15px/1.65/#6B7280)

[PROCESS] padding:96px 0, 배경:${theme ? theme.surfaceBg : "#F8FAFC"}
  제목: "이용 방법" 또는 "서비스 프로세스"
  3~4 스텝: 번호 원형(48x48, bg:${primaryColor}, color:#fff, font:20px/700) + 스텝명(18px/600) + 설명(15px/#6B7280)
  가로 배치(데스크탑) → 세로 스택(모바일), 스텝 간 점선 연결

${hasCta ? `[CTA_BAND] padding:80px 0, text-align:center
  배경: linear-gradient(135deg, ${primaryColor}, ${theme ? theme.accent : "#7C3AED"})
  제목: #fff, 32px/600 | 서브: rgba(255,255,255,0.85), 16px
  버튼: ${form.kakaoId ? "카카오(bg:#FEE500, color:#3A1D1D, radius:14px, padding:16px 28px, href:" + kakaoUrl + ")" : ""} ${form.naverUrl ? "네이버(bg:#03C75A, color:#fff, radius:14px, padding:16px 28px, href:" + form.naverUrl + ")" : ""}` : ""}

${form.pages.includes("review") ? `[REVIEW] padding:96px 0, 배경:흰색
  제목: "고객 후기" + 서브텍스트
  후기 카드 3개(grid, gap:24px)
  각 카드: bg:${theme ? theme.surfaceBg : "#F8FAFC"}, radius:16px, padding:28px
  카드 상단: 큰따옴표 SVG(${primaryColor}, 32x32, opacity:0.3) 
  후기 텍스트: 16px/1.7/${theme ? theme.text : "#374151"} (실제 후기처럼 자연스럽게)
  하단: 이름(14px/600) + 직업/지역(13px/#94A3B8) | 별점 ★★★★★(${primaryColor})` : ""}

${form.pages.includes("faq") ? `[FAQ] padding:96px 0, 배경:${theme ? theme.surfaceBg : "#F8FAFC"}
  제목: "자주 묻는 질문"
  details/summary 아코디언, max-width:720px, margin:0 auto
  각 항목: border-bottom:1px solid ${theme ? theme.borderColor : "rgba(0,0,0,0.08)"}
  summary: 18px/600, padding:20px 0, cursor:pointer, list-style:none
  summary::after: "+" 아이콘(open시 "−"로 전환)
  답변: 16px/1.7/#6B7280, padding:0 0 20px
  4~5개 FAQ (업종에 맞는 실제 질문+답변)` : ""}

[LOCATION] padding:96px 0, 배경:흰색
  2컬럼: 좌측(영업시간 테이블 + 주소 + 전화 + 이메일) | 우측(카카오맵 링크 버튼 또는 지도 placeholder)
  영업시간: 작은 테이블 형태(요일 | 시간), font-size:15px
  모바일: 수직 스택

[FOOTER] padding:48px 0, 배경:${theme ? theme.text : "#111827"}, color:rgba(255,255,255,0.65)
  상단: 3컬럼 — ①로고+한줄소개 ②메뉴링크(세로 나열) ③연락처+SNS아이콘
  하단: border-top:1px solid rgba(255,255,255,0.1), padding-top:24px
  좌측: © ${new Date().getFullYear()} ${form.company}. All rights reserved.
  우측: '루멘 웹 빌더로 제작' (font-size:11px, opacity:0.35)
  모바일: 세로 스택, 중앙 정렬

${hasCta ? `[플로팅 CTA]
PC(>768px): fixed, right:24px, bottom:24px, flex-direction:column, gap:8px
  버튼: radius:50px, padding:14px 20px, shadow:0 8px 24px rgba(0,0,0,0.15), font-weight:600
모바일(<=768px): fixed, bottom:0, left:0, right:0, flex, gap:8px, padding:12px 16px
  bg:rgba(255,255,255,0.95), backdrop-filter:blur(8px), border-top:1px solid rgba(0,0,0,0.06)
  각 버튼: flex:1, radius:12px, padding:14px, text-align:center, font-weight:600
  플로팅 CTA가 있으면 footer에 padding-bottom:80px 추가 (겹침 방지)` : ""}

=== 글로벌 CSS ===
* { box-sizing:border-box; margin:0; padding:0 }
body { word-break:keep-all; -webkit-font-smoothing:antialiased; overflow-x:hidden }
Google Fonts: ${theme ? theme.font : "Pretendard"} (400,500,600,700)
font-family: '${theme ? theme.font : "Pretendard"}', 'Noto Sans KR', -apple-system, sans-serif
.container { max-width:1200px; margin:0 auto; padding:0 24px }
img { max-width:100%; height:auto }
a { text-decoration:none; color:inherit }

=== 여백 체계 ===
카드 내부: 12/16px | 요소 그룹: 24/32px | 섹션 간: 96px(PC)/48px(모바일)
섹션 제목→콘텐츠: 48~60px | 카드 내 아이콘→텍스트: 16px

=== 애니메이션 ===
Intersection Observer로 .fade-up 토글
@keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
.fade-up { opacity:0 } .fade-up.visible { animation:fadeUp 0.6s ease forwards }
순차 지연: 각 카드에 transition-delay:0.1s * index
카드 hover: transition:all 0.3s | 버튼 hover: transition:all 0.2s

=== 반응형 규칙 ===
@media(max-width:1024px) { 2컬럼 그리드, 패딩 축소 }
@media(max-width:768px) { 1컬럼, h1→36px, nav→햄버거, 섹션패딩→48px, split→수직스택 }
@media(max-width:480px) { 여백 16px, 폰트 추가 축소, 카드 padding:24px }
stats-row: <=768px에서 2열 그리드 | <=480px에서 1열
process-steps: <=768px에서 세로 스택

=== 출력 규칙 (절대 준수) ===
1. <!DOCTYPE html>로 시작 → </html>로 완전히 끝낼 것
2. 모든 섹션을 빠짐없이 전부 포함 — NAV, HERO, BRAND_STORY, STATS, SERVICE, PROCESS 필수
3. SVG는 도형+선 최대 3개로 단순화 → 토큰 절약 → 모든 섹션 완성 우선
4. style+script 인라인, 외부 import는 Google Fonts만
5. HTML 코드만 출력, 설명·주석·마크다운 코드블록 금지
6. 한국어 텍스트는 실제 비즈니스처럼 자연스럽게 (Lorem ipsum 금지)
7. 서비스 정보(${form.services})를 실제 내용으로 채워넣기
8. 모든 섹션에 class="fade-up" 적용, JS로 IntersectionObserver 구현
9. 배경색이 반드시 교차되어야 함 (흰색→surface→흰색→진한→흰색)
${extra || ""}`;

  const content = [];
  if (logo) {
    content.push({ type: "image", source: { type: "base64", media_type: logo.split(";")[0].split(":")[1], data: logo.split(",")[1] } });
    content.push({ type: "text", text: "위 이미지 = 로고(__LOGO__)" });
  }
  if (hero) {
    content.push({ type: "image", source: { type: "base64", media_type: hero.split(";")[0].split(":")[1], data: hero.split(",")[1] } });
    content.push({ type: "text", text: "위 이미지 = 히어로(__HERO__)" });
  }
  products.forEach((img, i) => {
    content.push({ type: "image", source: { type: "base64", media_type: img.split(";")[0].split(":")[1], data: img.split(",")[1] } });
    content.push({ type: "text", text: "위 이미지 = 제품" + (i + 1) + "번(__PRODUCT_" + i + "__)" });
  });
  content.push({ type: "text", text });
  return content;
}

function injectImages(html, images) {
  let r = html;
  if (images.logo) r = r.replaceAll("__LOGO__", images.logo);
  if (images.hero) r = r.replaceAll("__HERO__", images.hero);
  images.products.forEach((img, i) => { r = r.replaceAll("__PRODUCT_" + i + "__", img); });
  return r;
}

function makeEditableHtml(html) {
  const injection = '<style data-lumen-edit>' +
    '[contenteditable]{outline:none;transition:outline 0.15s,background 0.15s}' +
    '[contenteditable]:hover{outline:2px dashed rgba(37,99,235,0.35);outline-offset:3px;cursor:text;border-radius:4px}' +
    '[contenteditable]:focus{outline:2.5px solid #2563EB;outline-offset:3px;background:rgba(37,99,235,0.04);border-radius:4px}' +
    '.le-bar{position:fixed;top:0;left:0;right:0;background:linear-gradient(135deg,#2563EB,#7C3AED);color:#fff;padding:12px 20px;font-size:13px;font-family:-apple-system,sans-serif;z-index:10000;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 16px rgba(37,99,235,0.25)}' +
    '.le-bar .le-dot{width:8px;height:8px;border-radius:50%;background:#34D399;animation:le-pulse 1.5s infinite}' +
    '@keyframes le-pulse{0%,100%{opacity:1}50%{opacity:0.4}}' +
    '</style>' +
    '<div class="le-bar" data-lumen-edit><div class="le-dot"></div> 편집 모드 — 텍스트를 클릭하면 바로 수정됩니다</div>' +
    '<script data-lumen-edit>' +
    '(function(){' +
    'document.body.style.paddingTop="48px";' +
    'var sels="h1,h2,h3,h4,h5,h6,p,span,li,a,td,th,figcaption,blockquote,dt,dd";' +
    'document.querySelectorAll(sels).forEach(function(el){' +
    'if(el.closest("script,style,[data-lumen-edit],nav"))return;' +
    'if(el.querySelectorAll("h1,h2,h3,h4,h5,h6,p,div,ul,ol").length>2)return;' +
    'el.contentEditable="true";el.spellcheck=false;' +
    '});' +
    'var tm;document.addEventListener("input",function(){' +
    'clearTimeout(tm);tm=setTimeout(function(){' +
    'var c=document.documentElement.cloneNode(true);' +
    'c.querySelectorAll("[contenteditable]").forEach(function(e){e.removeAttribute("contenteditable");e.removeAttribute("spellcheck")});' +
    'c.querySelectorAll("[data-lumen-edit]").forEach(function(e){e.remove()});' +
    'c.querySelector("body").style.paddingTop="";' +
    'window.parent.postMessage({type:"lumen-edit",html:"<!DOCTYPE html><html>"+c.innerHTML+"</html>"},"*");' +
    '},400)});' +
    '})();<\/script>';
  if (html.includes('</body>')) return html.replace('</body>', injection + '</body>');
  if (html.includes('</html>')) return html.replace('</html>', injection + '</html>');
  return html + injection;
}

// ── 공통 UI ───────────────────────────────────────────────────
function StepBar({ current, total }) {
  return (
    <div style={{ display:"flex", gap:5, marginBottom:22 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i <= current ? "#2563EB" : "#E2E8F0", transition:"background .3s" }} />
      ))}
    </div>
  );
}

function CreditBadge({ credit }) {
  const ok = credit > 30;
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5, background: ok ? "#EFF6FF" : "#FEF2F2", border:"1px solid " + (ok ? "#BFDBFE" : "#FECACA"), borderRadius:20, padding:"6px 14px", fontSize:13, fontWeight:500, color: ok ? "#1D4ED8" : "#DC2626" }}>
      ⚡ {credit}C
    </div>
  );
}

function ChangePasswordBox({ authToken }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/auth-change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '비밀번호 변경 실패');
      alert('비밀번호가 변경되었습니다. 다음 로그인부터 적용됩니다.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      alert(e.message || '비밀번호 변경 실패');
    }
    setLoading(false);
  };

  return (
    <div style={{ border:'1px solid #E2E8F0', borderRadius:10, padding:10, marginTop:10 }}>
      <div style={{ fontSize:12, fontWeight:700, marginBottom:6 }}>비밀번호 변경</div>
      <input type='password' style={{ width:'100%', padding:8, border:'1px solid #E2E8F0', borderRadius:8, marginBottom:6 }} placeholder='현재 비밀번호' value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
      <input type='password' style={{ width:'100%', padding:8, border:'1px solid #E2E8F0', borderRadius:8, marginBottom:6 }} placeholder='새 비밀번호(8자 이상)' value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      <button onClick={submit} disabled={loading || !currentPassword || !newPassword} style={{ width:'100%', padding:8, border:'none', borderRadius:8, background:'#334155', color:'#fff', cursor:'pointer' }}>{loading ? '변경 중...' : '비밀번호 변경'}</button>
    </div>
  );
}

function AdminTransferBox({ authToken, onDone }) {
  const [targetEmail, setTargetEmail] = useState('');
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ targetEmail, amount: Number(amount) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '전송 실패');
      alert(`크레딧 전송 완료: ${d.user.email} (${d.user.credits}C)`);
      setTargetEmail('');
      onDone?.();
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ border:'1px dashed #CBD5E1', borderRadius:10, padding:10 }}>
      <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>관리자 크레딧 지급</div>
      <input style={{ width:'100%', padding:8, border:'1px solid #E2E8F0', borderRadius:8, marginBottom:6 }} placeholder='대상 이메일' value={targetEmail} onChange={e => setTargetEmail(e.target.value)} />
      <input style={{ width:'100%', padding:8, border:'1px solid #E2E8F0', borderRadius:8, marginBottom:6 }} placeholder='크레딧 수량' value={amount} onChange={e => setAmount(e.target.value)} />
      <button onClick={submit} disabled={loading || !targetEmail} style={{ width:'100%', padding:8, border:'none', borderRadius:8, background:'#2563EB', color:'#fff', cursor:'pointer' }}>{loading ? '처리 중...' : '크레딧 지급'}</button>
    </div>
  );
}

function AdminUsersPanel({ authToken }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin-users', { headers: { Authorization: `Bearer ${authToken}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '사용자 조회 실패');
      setUsers(Array.isArray(d.users) ? d.users : []);
    } catch (e) {
      alert(e.message || '사용자 조회 실패');
    }
    setLoading(false);
  };

  useEffect(() => { if (authToken) load(); }, [authToken]);

  return (
    <div style={{ border:'1px solid #E2E8F0', borderRadius:10, padding:10, marginTop:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ fontSize:12, fontWeight:700 }}>가입 계정 관리</div>
        <button onClick={load} disabled={loading} style={{ padding:'6px 8px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:11 }}>{loading ? '새로고침 중...' : '새로고침'}</button>
      </div>
      <div style={{ maxHeight:200, overflow:'auto', border:'1px solid #F1F5F9', borderRadius:8 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead style={{ position:'sticky', top:0, background:'#F8FAFC' }}>
            <tr>
              <th style={{ textAlign:'left', padding:'6px 8px', borderBottom:'1px solid #E2E8F0' }}>이메일</th>
              <th style={{ textAlign:'left', padding:'6px 8px', borderBottom:'1px solid #E2E8F0' }}>권한</th>
              <th style={{ textAlign:'right', padding:'6px 8px', borderBottom:'1px solid #E2E8F0' }}>크레딧</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ padding:'6px 8px', borderBottom:'1px solid #F1F5F9' }}>{u.email}</td>
                <td style={{ padding:'6px 8px', borderBottom:'1px solid #F1F5F9' }}>{u.role === 'admin' ? '관리자' : '일반'}</td>
                <td style={{ padding:'6px 8px', borderBottom:'1px solid #F1F5F9', textAlign:'right' }}>{u.role === 'admin' ? '∞' : `${u.credits}C`}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={3} style={{ padding:'10px 8px', textAlign:'center', color:'#64748B' }}>가입 계정이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImageDropZone({ label, hint, multiple, value, onChange, compact }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const handle = useCallback(async (files) => {
    const arr = Array.from(files).slice(0, multiple ? 6 : 1);
    const b64s = await Promise.all(arr.map(fileToBase64));
    onChange(multiple ? [...(value || []), ...b64s].slice(0, 6) : b64s[0]);
  }, [multiple, value, onChange]);
  const previews = multiple ? (value || []) : (value ? [value] : []);
  const sz = compact ? 52 : 72;
  return (
    <div style={{ marginBottom: compact ? 10 : 18 }}>
      <label style={{ display:"block", fontSize: compact ? 11 : 13, fontWeight:500, color:"#374151", marginBottom:5 }}>{label}</label>
      <div onClick={() => ref.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
        style={{ border:"2px dashed " + (drag ? "#2563EB" : "#CBD5E1"), borderRadius:10, padding: compact ? "10px" : "18px 16px", cursor:"pointer", background: drag ? "#EFF6FF" : "#F8FAFC", textAlign:"center" }}>
        {previews.length === 0 ? (
          <>
            <div style={{ fontSize: compact ? 20 : 28, marginBottom:4 }}>📁</div>
            <div style={{ fontSize: compact ? 11 : 13, fontWeight:500, color:"#475569" }}>클릭 또는 드래그</div>
            {hint && <div style={{ fontSize:10, color:"#94A3B8", marginTop:3 }}>{hint}</div>}
          </>
        ) : (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position:"relative" }}>
                <img src={src} alt="" style={{ width:sz, height:sz, objectFit:"cover", borderRadius:7, border:"2px solid #E2E8F0" }} />
                <button onClick={e => { e.stopPropagation(); onChange(multiple ? (value || []).filter((_, j) => j !== i) : null); }}
                  style={{ position:"absolute", top:-5, right:-5, width:18, height:18, borderRadius:"50%", background:"#EF4444", border:"none", color:"#fff", fontSize:11, cursor:"pointer" }}>×</button>
              </div>
            ))}
            {multiple && previews.length < 6 && (
              <div style={{ width:sz, height:sz, borderRadius:7, border:"1.5px dashed #CBD5E1", display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8", fontSize:22 }}>+</div>
            )}
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple={!!multiple} style={{ display:"none" }} onChange={e => handle(e.target.files)} />
    </div>
  );
}

function AiImagePanel({ form, credit, resultHtml, setResultHtml, consumeCredit }) {
  const [generating, setGenerating] = useState({});
  const [imgs, setImgs]             = useState({});
  const [errors, setErrors]         = useState({});
  const [korean, setKorean]         = useState(false);

  const handle = async (slot) => {
    if (credit < COST_AI_IMAGE) { alert("크레딧 부족"); return; }
    
    setGenerating(p => ({ ...p, [slot.id]: true }));
    setErrors(p => ({ ...p, [slot.id]: null }));
    try {
      await consumeCredit('ai_image', COST_AI_IMAGE);
      const img = await generateDalleImage(slot.buildPrompt(form, korean), slot.size);
      setImgs(p => ({ ...p, [slot.id]: img }));
      if (resultHtml) {
        const newHtml = await callClaude([{ role:"user", content:"다음 HTML에서 " + slot.label + " 위치 img src를 \"__NEWIMG__\"로 교체. HTML만 출력.\n\n" + resultHtml }]);
        setResultHtml(newHtml.replaceAll("__NEWIMG__", img));
      }
    } catch (e) {
      setErrors(p => ({ ...p, [slot.id]: e.message }));
    }
    setGenerating(p => ({ ...p, [slot.id]: false }));
  };

  return (
    <div style={{ padding:"14px 16px" }}>
      <div style={{ fontSize:12, color:"#64748B", marginBottom:12, background:"#F0F9FF", borderRadius:8, padding:"10px 12px", border:"1px solid #BAE6FD" }}>
        🎨 <strong style={{ color:"#0369A1" }}>AI 맞춤 생성</strong>은 서버로 전달되어 에이레 처리 경로로 자동 반영됩니다.
      </div>
      <div onClick={() => setKorean(v => !v)}
        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:10, border:"1.5px solid " + (korean ? "#2563EB" : "#E2E8F0"), background: korean ? "#EFF6FF" : "#F8FAFC", cursor:"pointer", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:500, color: korean ? "#2563EB" : "#374151" }}>🇰🇷 한국인 외모 고정</div>
          <div style={{ fontSize:10, color:"#94A3B8" }}>{korean ? "인물 → 한국인 외모로 생성" : "인물 외모 무작위"}</div>
        </div>
        <div style={{ width:40, height:22, borderRadius:11, background: korean ? "#2563EB" : "#CBD5E1", position:"relative", flexShrink:0 }}>
          <div style={{ position:"absolute", top:2, left: korean ? 20 : 2, width:18, height:18, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,.2)", transition:"left .2s" }} />
        </div>
      </div>
      {AI_IMAGE_SLOTS.map(slot => {
        const isGen = generating[slot.id];
        const img   = imgs[slot.id];
        const err   = errors[slot.id];
        const ok    = credit >= COST_AI_IMAGE;
        return (
          <div key={slot.id} style={{ marginBottom:10, background:"#F8FAFC", borderRadius:10, padding:"11px", border:"1px solid #E2E8F0" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: img ? 8 : 0 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:"#1E293B" }}>{slot.label}</div>
                <div style={{ fontSize:10, color:"#94A3B8" }}>{slot.size} · {COST_AI_IMAGE}C</div>
              </div>
              <button onClick={() => handle(slot)} disabled={isGen || !ok}
                style={{ padding:"5px 11px", borderRadius:7, fontSize:11, fontWeight:500, border:"none", cursor:(isGen || !ok) ? "not-allowed" : "pointer", background: isGen ? "#E2E8F0" : img ? "#D1FAE5" : ok ? "#EFF6FF" : "#F1F5F9", color: isGen ? "#64748B" : img ? "#065F46" : ok ? "#2563EB" : "#94A3B8" }}>
                {isGen ? "생성중..." : img ? "✓ 재생성" : "✨ " + COST_AI_IMAGE + "C"}
              </button>
            </div>
            {img && (
              <div style={{ borderRadius:7, overflow:"hidden", border:"1px solid #E2E8F0" }}>
                <img src={img} alt="" style={{ width:"100%", height:80, objectFit:"cover", display:"block" }} />
                <div style={{ padding:"5px 9px", fontSize:10, color:"#16A34A", background:"#F0FDF4", fontWeight:500 }}>✅ 홈페이지에 삽입됨</div>
              </div>
            )}
            {err && <div style={{ fontSize:10, color:"#DC2626", marginTop:4, background:"#FEF2F2", padding:"5px 8px", borderRadius:6 }}>❌ {err}</div>}
          </div>
        );
      })}
    </div>
  );
}

function RightPanel({ credit, form, resultHtml, setResultHtml, appliedFeatures, setAppliedFeatures, currentImages, setCurrentImages, consumeCredit }) {
  const [tab, setTab]                 = useState("feature");
  const [loadingFeature, setLoading]  = useState(null);
  const [replacingImg, setReplacing]  = useState(false);
  const [editInput, setEditInput]     = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editHistory, setEditHistory] = useState([]);

  const handleFeature = async (f) => {
    if (credit < f.cost || appliedFeatures.includes(f.id)) return;
    setLoading(f.id);
    try {
      await consumeCredit('feature', f.cost, { cost: f.cost });
      const html = await callClaude([{ role:"user", content:"다음 HTML에 기능 추가:\n" + f.prompt + "\n\n기존 HTML:\n" + resultHtml + "\n\nHTML만 출력." }]);
      setResultHtml(html);
      setAppliedFeatures(prev => [...prev, f.id]);
    } catch (e) {
      alert(e?.message || '기능 추가 실패');
    }
    setLoading(null);
  };

  const handleImgReplace = async (type, newVal) => {
    if (!newVal) return;
    setReplacing(true);
    try {
      const label = type === "logo" ? "로고" : type === "hero" ? "히어로" : "제품" + (parseInt(type.replace("product_", "")) + 1) + "번";
      const content = [
        { type:"image", source:{ type:"base64", media_type: newVal.split(";")[0].split(":")[1], data: newVal.split(",")[1] } },
        { type:"text", text:"다음 HTML에서 " + label + " img src를 \"__NEWIMG__\"로 교체. HTML만 출력.\n\n" + resultHtml }
      ];
      const raw = await callClaude([{ role:"user", content }]);
      setResultHtml(raw.replaceAll("__NEWIMG__", newVal));
      const u = { ...currentImages };
      if (type === "logo") u.logo = newVal;
      else if (type === "hero") u.hero = newVal;
      else { const i = parseInt(type.replace("product_", "")); const p = [...(u.products || [])]; p[i] = newVal; u.products = p; }
      setCurrentImages(u);
    } catch (e) { console.error(e); }
    setReplacing(false);
  };

  const handleTextEdit = async () => {
    if (!editInput.trim() || credit < COST_TEXT_EDIT || editLoading) return;
    setEditLoading(true);
    try {
      await consumeCredit('ai_text', COST_TEXT_EDIT);
      const html = await callClaude([{ role:"user", content:
        "다음 HTML에서 사용자가 요청한 문구 수정만 정확히 반영하세요.\n\n" +
        "=== 수정 요청 ===\n" + editInput.trim() + "\n\n" +
        "=== 규칙 ===\n" +
        "- 요청된 텍스트만 변경하고 나머지 HTML은 그대로 유지\n" +
        "- 디자인/스타일/레이아웃 절대 변경 금지\n" +
        "- HTML 코드만 출력, 설명 없음\n\n" +
        "=== 현재 HTML ===\n" + resultHtml
      }]);
      setResultHtml(html);
      setEditHistory(prev => [editInput.trim(), ...prev].slice(0, 10));
      setEditInput("");
    } catch (e) {
      alert("수정 실패: " + e.message);
    }
    setEditLoading(false);
  };

  return (
    <div>
      <div style={{ display:"flex", gap:3, padding:3, background:"#F1F5F9", borderRadius:14, marginBottom:12, border:"1px solid #E2E8F0" }}>
        {[{id:"ai_edit",icon:"✨",label:"AI 수정"},{id:"feature",icon:"⚡",label:"기능"},{id:"image",icon:"📸",label:"이미지"},{id:"ai_image",icon:"🎨",label:"AI생성"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:"9px 4px", border:"none", cursor:"pointer", fontSize:10, fontWeight: tab === t.id ? 600 : 400, background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? "#1E293B" : "#94A3B8", borderRadius:10, boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition:"all 0.2s", lineHeight:1.3 }}>
            <div style={{ fontSize:15, marginBottom:1 }}>{t.icon}</div>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, marginBottom:12, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", background: credit > 30 ? "linear-gradient(135deg,#F0FDF4,#ECFDF5)" : "linear-gradient(135deg,#FEF2F2,#FFF1F2)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background: credit > 30 ? "#DCFCE7" : "#FEE2E2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{credit > 30 ? "⚡" : "⚠️"}</div>
            <div>
              <div style={{ fontSize:10, color:"#64748B", fontWeight:500 }}>잔여 크레딧</div>
              <div style={{ fontSize:22, fontWeight:700, color: credit > 30 ? "#16A34A" : "#DC2626", letterSpacing:"-0.5px" }}>{credit}C</div>
            </div>
          </div>
          {credit <= 30 && <div style={{ padding:"6px 10px", background:"#FEE2E2", borderRadius:8, fontSize:10, color:"#991B1B", fontWeight:600 }}>충전 필요</div>}
        </div>

        {/* 문구 수정 탭 */}
        {tab === "ai_edit" && (
          <div style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:12, color:"#475569", marginBottom:10, lineHeight:1.7 }}>
              서버로 요청되면 에이레가 수정본을 만들어 자동 반영합니다. (FAQ 추가, 톤 변경, 섹션 재작성 등)
              <span style={{ display:"inline-block", background:"#EFF6FF", color:"#2563EB", padding:"1px 6px", borderRadius:4, fontSize:10, fontWeight:600, marginLeft:4 }}>{COST_TEXT_EDIT}C</span>
            </div>
            <textarea
              value={editInput}
              onChange={e => setEditInput(e.target.value)}
              placeholder={"예시:\n• 소개글 톤을 더 친근하게 변경\n• FAQ에 '주차 가능한가요?' 항목 추가\n• 서비스 섹션을 4개에서 6개로 확장\n• 히어로 카피를 더 임팩트 있게 재작성"}
              style={{ width:"100%", minHeight:100, padding:"10px 12px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, color:"#1E293B", outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical", lineHeight:1.6, background:"#F8FAFC" }}
            />
            <button
              onClick={handleTextEdit}
              disabled={!editInput.trim() || credit < COST_TEXT_EDIT || editLoading}
              style={{ width:"100%", padding:"10px", borderRadius:10, border:"none", fontSize:13, fontWeight:600, cursor: (!editInput.trim() || credit < COST_TEXT_EDIT || editLoading) ? "not-allowed" : "pointer", background: editLoading ? "#E2E8F0" : editInput.trim() && credit >= COST_TEXT_EDIT ? "#2563EB" : "#E2E8F0", color: editLoading ? "#64748B" : editInput.trim() && credit >= COST_TEXT_EDIT ? "#fff" : "#94A3B8", marginTop:8, transition:"all 0.2s" }}>
              {editLoading ? "⏳ AI 수정 중..." : "✨ AI 수정하기 (" + COST_TEXT_EDIT + "C)"}
            </button>
            {editHistory.length > 0 && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:10, fontWeight:600, color:"#94A3B8", marginBottom:6 }}>최근 수정 내역</div>
                {editHistory.map((h, i) => (
                  <div key={i} style={{ padding:"6px 10px", background:"#F8FAFC", borderRadius:6, fontSize:11, color:"#475569", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:"#16A34A", fontSize:10, flexShrink:0 }}>✓</span>
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 기능 추가 탭 */}
        {tab === "feature" && (
          <div style={{ maxHeight:400, overflowY:"auto" }}>
            {FEATURES.map(f => {
              const applied = appliedFeatures.includes(f.id);
              const isLoading = loadingFeature === f.id;
              const ok = credit >= f.cost;
              return (
                <div key={f.id} style={{ padding:"10px 14px", borderBottom:"1px solid #F8FAFC", display:"flex", alignItems:"center", justifyContent:"space-between", opacity: applied ? 0.5 : 1 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:"#1E293B" }}>{f.label}</div>
                    <div style={{ fontSize:10, color: applied ? "#16A34A" : "#94A3B8" }}>{applied ? "✅ 적용됨" : f.cost + "C"}</div>
                  </div>
                  <button onClick={() => handleFeature(f)} disabled={applied || isLoading || !ok}
                    style={{ padding:"6px 14px", borderRadius:8, fontSize:11, fontWeight:600, border: applied ? "none" : ok ? "1.5px solid #2563EB" : "1.5px solid #E2E8F0", cursor:(applied||!ok)?"not-allowed":"pointer", background: applied?"#D1FAE5":ok?"#EFF6FF":"#F8FAFC", color: applied?"#065F46":ok?"#2563EB":"#CBD5E1", minWidth:56 }}>
                    {isLoading ? "⏳" : applied ? "✓" : "+" + f.cost + "C"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 이미지 교체 탭 */}
        {tab === "image" && (
          <div style={{ padding:"14px 16px" }}>
            {replacingImg && <div style={{ background:"#EFF6FF", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#1D4ED8", fontWeight:500, marginBottom:10 }}>⚙️ 이미지 교체 중...</div>}
            <div style={{ fontSize:12, color:"#475569", marginBottom:12 }}><span style={{ background:"#D1FAE5", color:"#065F46", padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:600 }}>무료</span> 새 사진 업로드 시 즉시 교체</div>
            <ImageDropZone compact label="🏷️ 로고" value={currentImages.logo} onChange={v => handleImgReplace("logo", v)} />
            <ImageDropZone compact label="🖼️ 히어로" value={currentImages.hero} onChange={v => handleImgReplace("hero", v)} />
            {Array.from({ length: Math.max((currentImages.products || []).length, 2) }).map((_, i) => (
              <ImageDropZone key={i} compact label={"📦 제품 " + (i + 1)} value={(currentImages.products || [])[i] || null} onChange={v => handleImgReplace("product_" + i, v)} />
            ))}
          </div>
        )}

        {/* AI 이미지 생성 탭 */}
        {tab === "ai_image" && (
          <AiImagePanel form={form} credit={credit} resultHtml={resultHtml} setResultHtml={setResultHtml} consumeCredit={consumeCredit} />
        )}
      </div>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────
export default function LumenWebBuilder() {
  const [authToken, setAuthToken]     = useState(() => localStorage.getItem("lumen_token") || "");
  const [me, setMe]                   = useState(null);
  const [authMode, setAuthMode]       = useState("login");
  const [authForm, setAuthForm]       = useState({ email:"", password:"", name:"", code:"", newPassword:"", signupCodeToken:"", resetCodeToken:"" });
  const [authLoading, setAuthLoading] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailCheckOk, setEmailCheckOk] = useState(false);
  const [emailCheckMsg, setEmailCheckMsg] = useState('');

  const [step, setStep]               = useState("intro");
  const [formStep, setFormStep]       = useState(0);
  const [credit, setCredit]           = useState(INITIAL_CREDIT);
  useEffect(() => {
    if (me?.role === 'admin') setCredit(99999999);
    else if (typeof me?.credits === 'number') setCredit(me.credits);
  }, [me]);
  const [appliedFeatures, setApplied] = useState([]);
  const [genLog, setGenLog]           = useState([]);
  const [genProgress, setProgress]    = useState(0);
  const [resultHtml, setResultHtml]   = useState("");
  const [curImages, setCurImages]     = useState({ logo:null, hero:null, products:[] });
  const [accountTab, setAccountTab]   = useState('account');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const [viewport, setViewport]       = useState("desktop");
  const [editMode, setEditMode]       = useState(false);
  const [editConfirmed, setEditConfirmed] = useState(false);
  const pendingHtml = useRef("");

  // postMessage로 iframe에서 편집된 HTML 수신
  useEffect(() => {
    const handler = (e) => {
      if (e.data && e.data.type === "lumen-edit") {
        pendingHtml.current = e.data.html;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const startEditMode = async () => {
    if (editConfirmed) {
      if (credit < COST_INLINE_EDIT) { alert("크레딧이 부족합니다 (" + COST_INLINE_EDIT + "C 필요)"); return; }
      try {
        await consumeCredit('inline_edit', COST_INLINE_EDIT);
      } catch (e) {
        alert(e?.message || '크레딧 처리 실패');
        return;
      }
    }
    setEditMode(true);
    pendingHtml.current = "";
  };

  const confirmEdit = () => {
    if (pendingHtml.current) setResultHtml(pendingHtml.current);
    setEditMode(false);
    if (!editConfirmed) setEditConfirmed(true);
    pendingHtml.current = "";
  };

  const cancelEdit = () => {
    setEditMode(false);
    pendingHtml.current = "";
  };

  const previewSrc = editMode ? makeEditableHtml(resultHtml) : resultHtml;

  async function fetchMe(token) {
    if (!token) { setMe(null); return; }
    try {
      const r = await fetch('/api/auth-me', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '인증 실패');
      setMe(d.user);
      setAccountTab(d.user?.role === 'admin' ? 'admin' : 'account');
    } catch {
      localStorage.removeItem('lumen_token');
      setAuthToken('');
      setMe(null);
    }
  }

  useEffect(() => { fetchMe(authToken); }, [authToken]);

  async function checkEmailBeforeCode(purpose) {
    const normalizedEmail = String(authForm.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailChecked(true);
      setEmailCheckOk(false);
      setEmailCheckMsg('이메일을 먼저 입력해주세요.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setEmailChecked(true);
      setEmailCheckOk(false);
      setEmailCheckMsg('유효한 이메일 형식이 아닙니다.');
      return false;
    }

    setCheckingEmail(true);
    try {
      const checkRes = await fetch('/api/auth-check-email', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: normalizedEmail, purpose }),
      });
      const checkRaw = await checkRes.text();
      let checkData = {};
      try { checkData = checkRaw ? JSON.parse(checkRaw) : {}; } catch { checkData = { error: checkRaw?.slice(0, 180) || '이메일 확인 실패' }; }

      if (!checkRes.ok) {
        throw new Error(checkData.error || '이메일 확인 실패');
      }

      setEmailChecked(true);
      setEmailCheckOk(true);
      if (checkData?.degraded) {
        setEmailCheckMsg('서버 사전확인을 생략하고 코드발송 단계로 진행합니다.');
      } else {
        setEmailCheckMsg(purpose === 'signup' ? '가입 가능한 이메일입니다.' : '가입된 이메일이 확인되었습니다.');
      }
      return true;
    } catch (e) {
      // signup은 사전확인이 보조 단계라 일시 장애 시 코드발송 단계로 진행 허용
      if (purpose === 'signup') {
        setEmailChecked(true);
        setEmailCheckOk(true);
        setEmailCheckMsg('사전 확인이 불안정해 코드발송 단계에서 최종 확인합니다.');
        return true;
      }

      setEmailChecked(true);
      setEmailCheckOk(false);
      setEmailCheckMsg(e.message || '이메일 확인 실패');
      return false;
    } finally {
      setCheckingEmail(false);
    }
  }

  async function sendAuthCode(purpose) {
    const okCheck = await checkEmailBeforeCode(purpose);
    if (!okCheck) return;
    const normalizedEmail = String(authForm.email || '').trim().toLowerCase();
    setCodeSending(true);
    try {
      const r = await fetch('/api/auth-send-code', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: normalizedEmail, purpose }),
      });
      const raw = await r.text();
      let d = {};
      try { d = raw ? JSON.parse(raw) : {}; } catch { d = { error: raw?.slice(0, 180) || '서버 응답 파싱 실패' }; }
      if (!r.ok) {
        const missing = Array.isArray(d?.missing) && d.missing.length ? `\n누락 환경변수: ${d.missing.join(', ')}` : '';
        const reason = d?.reason ? `\n원인코드: ${d.reason}` : '';
        throw new Error((d.error || '인증코드 발송 실패') + reason + missing);
      }
      setAuthForm(f => ({
        ...f,
        signupCodeToken: purpose === 'signup' ? (d.codeToken || '') : f.signupCodeToken,
        resetCodeToken: purpose === 'reset' ? (d.codeToken || '') : f.resetCodeToken,
      }));
      alert('인증코드를 이메일로 발송했습니다. (유효시간 10분)');
    } catch (e) {
      const msg = String(e?.message || '인증코드 발송 중 오류가 발생했습니다.');
      alert(msg);
      console.error('[auth-send-code] failed:', e);
    }
    setCodeSending(false);
  }

  useEffect(() => {
    setEmailChecked(false);
    setEmailCheckOk(false);
    setEmailCheckMsg('');
  }, [authForm.email, authMode]);

  async function submitAuth() {
    setAuthLoading(true);
    try {
      const normalizedEmail = String(authForm.email || '').trim().toLowerCase();
      if (authMode === 'forgot') {
        if (!emailCheckOk) throw new Error('이메일 확인을 먼저 진행해주세요.');
        const r = await fetch('/api/auth-reset-password', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email: normalizedEmail, code: authForm.code, newPassword: authForm.newPassword, codeToken: authForm.resetCodeToken }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || '비밀번호 변경 실패');
        alert('비밀번호가 변경되었습니다. 로그인 해주세요.');
        setAuthMode('login');
        setAuthForm(f => ({ ...f, password:'', code:'', newPassword:'' }));
        return;
      }

      const endpoint = authMode === 'signup' ? '/api/auth-signup' : '/api/auth-login';
      if (authMode === 'signup' && !emailCheckOk) throw new Error('이메일 확인을 먼저 진행해주세요.');
      const payload = authMode === 'signup'
        ? { email: normalizedEmail, password: authForm.password, name: authForm.name, code: authForm.code, codeToken: authForm.signupCodeToken }
        : { email: normalizedEmail, password: authForm.password };
      const r = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const raw = await r.text();
      let d = {};
      try { d = raw ? JSON.parse(raw) : {}; } catch { d = { error: raw?.slice(0, 180) || '서버 응답 파싱 실패' }; }
      if (!r.ok) throw new Error(d.error || '인증 실패');
      localStorage.setItem('lumen_token', d.token);
      setAuthToken(d.token);
      setMe(d.user);
      setAccountTab(d.user?.role === 'admin' ? 'admin' : 'account');
      setStep('form');
    } catch (e) {
      alert(e.message);
    }
    setAuthLoading(false);
  }

  async function consumeCredit(action, fallbackCost = 0, extra = {}) {
    if (!authToken) {
      if (!fallbackCost) throw new Error('로그인이 필요합니다.');
      if (credit < fallbackCost) throw new Error('크레딧 부족');
      setCredit((prev) => prev - fallbackCost);
      return { ok: true, local: true, cost: fallbackCost };
    }
    const r = await fetch('/api/credits-use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ action, ...extra }),
    });
    const raw = await r.text();
    let d = {};
    try { d = raw ? JSON.parse(raw) : {}; } catch { d = { error: raw?.slice(0, 180) || '서버 응답 파싱 실패' }; }
    if (!r.ok) throw new Error(d.error || '크레딧 처리 실패');
    await fetchMe(authToken);
    return d;
  }

  async function useCredit(action) {
    return consumeCredit(action);
  }

  const [form, setForm] = useState({
    company:"", industry:"", businessMode:"auto", benchmarkSiteUrl:"", benchmarkSiteName:"", description:"", services:"", ceo:"",
    purpose:[], target:"", pages:[],
    selectedTheme:null, mood:"", color:"",
    illustStyle:"flat",
    introTone:"professional",
    kakaoId:"", naverUrl:"", businessHours:"",
    phone:"", email:"", address:"", sns:"",
    uploadedImages:{ logo:null, hero:null, products:[] },
  });

  const upd    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updImg = (k, v) => setForm(f => ({ ...f, uploadedImages: { ...f.uploadedImages, [k]: v } }));
  const toggleArr = (key, id) => setForm(f => ({ ...f, [key]: f[key].includes(id) ? f[key].filter(x => x !== id) : [...f[key], id] }));

  const isBenchmarkRelatedToIndustry = (industry, card) => {
    if (!industry || industry === '기타') return true;
    if (card.lumen_industry && card.lumen_industry === industry) return true;
    const keys = INDUSTRY_TEMPLATE_MATCH[industry] || [];
    const hay = `${card.industry_vertical || ''} ${card.visual_mood || ''} ${card.site_name || ''}`;
    return keys.some(k => hay.includes(k));
  };

  const benchmarkMoodText = (card, idx) => {
    const mood = MOOD_LABELS[card.visual_mood] || '균형형 비즈니스 무드';
    const mode = card.business_mode || '자동 추천';
    const modules = (card.key_modules || []).slice(0, 3).join(' · ');
    return {
      title: `레퍼런스 스타일 ${String(idx + 1).padStart(2, '0')}`,
      subtitle: `${mood} · ${mode}`,
      modules,
    };
  };

  // 업종 선택 시 프리셋 자동 적용
  const applyPreset = (industry) => {
    const p = INDUSTRY_PRESETS[industry];
    if (!p) return;
    const theme = THEMES.find(t => t.id === p.themeId) || null;
    const modeCopy = MODE_COPY_PRESETS[form.businessMode];
    setForm(f => ({
      ...f,
      industry,
      description: modeCopy ? `${industry} 고객을 위한 ${modeCopy.desc}` : (p.desc || ""),
      services: modeCopy ? modeCopy.services : (p.services || ""),
      target: p.target || "",
      purpose: p.purpose || [],
      pages: p.pages || [],
      selectedTheme: theme,
      mood: theme ? theme.mood : "",
      introTone: p.tone || "professional",
      illustStyle: p.illust || "flat",
    }));
  };

  const applyBusinessMode = (mode) => {
    setForm(prev => {
      const p = INDUSTRY_PRESETS[prev.industry] || {};
      const modeCopy = MODE_COPY_PRESETS[mode];
      return {
        ...prev,
        businessMode: mode,
        description: modeCopy
          ? `${prev.industry || "우리"} 고객을 위한 ${modeCopy.desc}`
          : (p.desc || prev.description || ""),
        services: modeCopy
          ? modeCopy.services
          : (p.services || prev.services || ""),
      };
    });
  };

  const runGenerate = async (extra, formOverride = null) => {
    const workingForm = formOverride || form;
    setStep("generating"); setGenLog([]); setProgress(0);
    const { logo, hero, products } = workingForm.uploadedImages;
    const LOG_MSGS = [
      "✅ 인테이크 폼 분석 중...",
      "✅ 이미지 처리 (로고:" + (logo?"✓":"✗") + " 히어로:" + (hero?"✓":"✗") + " 제품:" + products.length + "장)",
      "✅ " + (workingForm.selectedTheme ? workingForm.selectedTheme.name + " 테마 + " : "") + (ILLUST_STYLES.find(s => s.id === workingForm.illustStyle)||{}).label + " 적용 중...",
      "✅ 로컬 템플릿 엔진으로 카드 구조 생성 중...",
      "✅ HTML · CSS 코드 생성 중...",
      "✅ CTA 삽입 및 반응형 최적화 중...",
      "✅ 최종 검수 및 마무리 중...",
      "✅ 완성!",
    ];
    const LOG_THRESHOLDS = [3, 10, 20, 35, 55, 72, 88];
    for (let i = 0; i < 2; i++) { await new Promise(r => setTimeout(r, 500)); setGenLog(prev => [...prev, LOG_MSGS[i]]); setProgress(LOG_THRESHOLDS[i]); }
    let currentPct = 10;
    try {
      let nextLogIdx = 2;
      await new Promise((resolve) => {
        const iv = setInterval(() => {
          const remaining = 92 - currentPct;
          currentPct = Math.min(92, currentPct + Math.max(0.6, remaining * 0.09));
          setProgress(Math.round(currentPct));
          if (nextLogIdx < LOG_THRESHOLDS.length && currentPct >= LOG_THRESHOLDS[nextLogIdx]) {
            setGenLog(prev => [...prev, LOG_MSGS[nextLogIdx]]);
            nextLogIdx++;
          }
          if (currentPct >= 92) {
            clearInterval(iv);
            resolve();
          }
        }, 140);
      });
      const final = generateLocalHtml(workingForm, { extra });
      for (let i = nextLogIdx; i < LOG_THRESHOLDS.length; i++) setGenLog(prev => [...prev, LOG_MSGS[i]]);
      setProgress(95); await new Promise(r => setTimeout(r, 300));
      setProgress(100); setGenLog(prev => [...prev, LOG_MSGS[LOG_MSGS.length - 1]]);
      await new Promise(r => setTimeout(r, 500));
      setResultHtml(final);
      setCurImages({ logo: workingForm.uploadedImages.logo, hero: workingForm.uploadedImages.hero, products: [...workingForm.uploadedImages.products] });
      setApplied([]); setEditConfirmed(false); setEditMode(false); setStep("result");
    } catch (e) { setGenLog(prev => [...prev, "❌ 오류: " + e.message]); }
  };

  const handleGenerate = async () => {
    try {
      await useCredit('generate');
      runGenerate('');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRegenerate = async () => {
    try {
      await useCredit('regenerate');
      const alternates = recommendedBenchmarks.filter((b) => b.site_url !== form.benchmarkSiteUrl);
      let nextForm = form;
      if (alternates.length > 0) {
        const pick = alternates[Math.floor(Math.random() * alternates.length)];
        nextForm = { ...form, benchmarkSiteUrl: pick.site_url, benchmarkSiteName: pick.site_name || '' };
        setForm(nextForm);
      }
      runGenerate('이전 결과와 확실히 다르게, 현재 선택된 레퍼런스 템플릿 분위기를 강하게 반영해 재생성. 섹션 순서/카드 스타일/히어로 구성을 다르게 구성.', nextForm);
    } catch (e) {
      alert(e.message);
    }
  };

  const stepValid = () => {
    if (!me) return false;
    if (formStep === 0) return form.company && form.industry;
    return true;
  };

  const TOTAL = 4;
  const LABELS = ["업종 & 브랜드","디자인 & 스타일","사진 & 채널","확인 & 생성"];

  const tc = form.selectedTheme ? form.selectedTheme.primary : "#2563EB";
  const WRAP = { fontFamily:"'Noto Sans KR',-apple-system,sans-serif", minHeight:"100vh", background:"linear-gradient(160deg,#EEF2FF 0%,#F8FAFC 50%,#F5F0FF 100%)" };
  const HDR  = { width:"100%", background:"rgba(255,255,255,0.85)", backdropFilter:"blur(14px)", borderBottom:"1px solid rgba(226,232,240,0.7)", padding:"12px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10, boxSizing:"border-box" };
  const CARD = { background:"rgba(255,255,255,0.9)", backdropFilter:"blur(10px)", borderRadius:20, border:"1px solid rgba(226,232,240,0.6)", padding:"32px 38px", width:"100%", maxWidth:600, margin:"36px auto", boxShadow:"0 8px 40px rgba(37,99,235,0.07)", boxSizing:"border-box" };
  const H2   = { fontSize:20, fontWeight:600, color:"#1E293B", margin:"0 0 5px", letterSpacing:"-.3px" };
  const SUB  = { fontSize:13, color:"#64748B", margin:"0 0 20px", lineHeight:1.7 };
  const LBL  = { display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:5 };
  const INP  = { width:"100%", padding:"10px 13px", borderRadius:10, border:"1.5px solid #E8EDF5", fontSize:14, color:"#1E293B", outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"rgba(248,250,252,0.8)" };
  const SEL  = { ...INP };
  const BTNP = { width:"100%", padding:"13px", borderRadius:12, background:"#2563EB", color:"#fff", border:"none", fontSize:14, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 16px rgba(37,99,235,0.3)" };
  const BTNS = { padding:"11px 18px", borderRadius:12, background:"rgba(241,245,249,0.9)", color:"#475569", border:"1px solid #E2E8F0", fontSize:13, cursor:"pointer" };
  const chip = on => ({ display:"inline-flex", alignItems:"center", padding:"7px 13px", borderRadius:20, fontSize:12, cursor:"pointer", margin:3, border:"1.5px solid " + (on ? "#2563EB" : "#E2E8F0"), background: on ? "#EFF6FF" : "rgba(255,255,255,0.7)", color: on ? "#2563EB" : "#64748B", transition:"all .15s" });
  const FLD  = { marginBottom:16 };

  const industryMatchedBenchmarks = useMemo(() => (
    benchmarkCards
      .filter((c) => isBenchmarkRelatedToIndustry(form.industry, c))
      .filter((c) => form.businessMode === "auto" || c.business_mode === form.businessMode)
  ), [form.industry, form.businessMode]);

  const recommendedBenchmarks = useMemo(() => (
    industryMatchedBenchmarks.length > 0
      ? industryMatchedBenchmarks
      : benchmarkCards.filter((c) => form.businessMode === "auto" || c.business_mode === form.businessMode)
  ), [industryMatchedBenchmarks, form.businessMode]);

  useEffect(() => {
    if (!form.industry || recommendedBenchmarks.length === 0) return;
    const stillValid = recommendedBenchmarks.some((c) => c.site_url === form.benchmarkSiteUrl);
    if (!stillValid) {
      const first = recommendedBenchmarks[0];
      setForm((prev) => ({ ...prev, benchmarkSiteUrl: first.site_url, benchmarkSiteName: first.site_name || '' }));
    }
  }, [form.industry, form.benchmarkSiteUrl, recommendedBenchmarks]);

  const openAdminMode = () => {
    setAccountTab('admin');
    setStep('result');
  };

  const Hdr = () => (
    <div style={HDR}>
      <div style={{ fontWeight:600, fontSize:17, color:"#1E293B", letterSpacing:"-0.4px" }}>루멘<span style={{ color:"#2563EB" }}> 웹 빌더</span></div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {me && (
          <div style={{ fontSize:11, fontWeight:500, color:"#475569", background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:16, padding:"4px 10px" }}>
            {me.email}{me.role === "admin" ? " (관리자)" : ""}
          </div>
        )}
        {me?.role === 'admin' && (
          <button
            onClick={openAdminMode}
            style={{ padding:"7px 10px", borderRadius:8, border:"1px solid #DBEAFE", background:"#EFF6FF", color:"#1D4ED8", fontSize:11, cursor:"pointer", fontWeight:600 }}
          >
            관리자모드 보기
          </button>
        )}
        <CreditBadge credit={credit} />
        {me && (
          <button
            onClick={() => {
              localStorage.removeItem("lumen_token");
              setAuthToken("");
              setMe(null);
              setStep("intro");
            }}
            style={{ padding:"7px 10px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", color:"#475569", fontSize:11, cursor:"pointer" }}
          >
            로그아웃
          </button>
        )}
      </div>
    </div>
  );

  // ─ INTRO ─────────────────────────────────────────────────────
  if (step === "intro") return (
    <div style={WRAP}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <Hdr />
      <div style={{ display:"flex", justifyContent:"center", padding:"0 20px" }}>
        <div style={{ ...CARD, textAlign:"center", padding:"44px 38px" }}>
          <div style={{ fontSize:48, marginBottom:14 }}>🏗️</div>
          <h1 style={{ fontSize:24, fontWeight:600, color:"#1E293B", margin:"0 0 10px", letterSpacing:"-0.8px" }}>업종만 고르면<br />홈페이지 완성</h1>
          <p style={{ fontSize:13, color:"#64748B", lineHeight:1.8, margin:"0 0 22px" }}>업종 선택 한 번이면 AI가 테마·구성·텍스트를<br />자동으로 세팅합니다. 뇌 빼고 만드세요.</p>
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:20 }}>
            {THEMES.map(t => <div key={t.id} title={t.name} style={{ width:28, height:28, borderRadius:"50%", background:t.primary, border:"2px solid #E2E8F0", flexShrink:0 }} />)}
          </div>
          <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:12, padding:"15px 18px", marginBottom:18, textAlign:"left" }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#166534", marginBottom:7 }}>🎁 가입 혜택</div>
            <div style={{ fontSize:13, color:"#15803D", lineHeight:2 }}>
              • 무료 모드 <strong>비용 0원</strong> 즉시 사용<br />
              • 업종별 <strong>자동 프리셋</strong> (텍스트·테마·구성)<br />
              • Gamma AI 수준 <strong>디자인 시스템</strong> 적용<br />
              • <strong>4단계</strong>만에 완성 (체크만 하면 OK)
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:22 }}>
            {[["🏪 업종 선택","자동 프리셋"],["🎨 테마 5종","원클릭 적용"],["⚡ 4단계 완성","최소 입력"],["📱 반응형","모바일 최적화"]].map(([t, d]) => (
              <div key={t} style={{ background:"#F8FAFC", borderRadius:9, padding:"11px 9px", textAlign:"center" }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{t}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>{d}</div>
              </div>
            ))}
          </div>
          {!me ? (
            <div style={{ marginTop:10, textAlign:'left' }}>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <button style={{ ...BTNS, flex:1, background: authMode==='login' ? '#EFF6FF' : '#fff' }} onClick={() => setAuthMode('login')}>로그인</button>
                <button style={{ ...BTNS, flex:1, background: authMode==='signup' ? '#EFF6FF' : '#fff' }} onClick={() => setAuthMode('signup')}>회원가입</button>
                <button style={{ ...BTNS, flex:1, background: authMode==='forgot' ? '#EFF6FF' : '#fff' }} onClick={() => setAuthMode('forgot')}>비번찾기</button>
              </div>

              {authMode === 'signup' && <input style={{ ...INP, marginBottom:8 }} placeholder='이름' value={authForm.name} onChange={e => setAuthForm(f => ({...f, name:e.target.value}))} />}

              <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                <input style={{ ...INP, marginBottom:0, flex:1 }} placeholder='이메일' value={authForm.email} onChange={e => setAuthForm(f => ({...f, email:e.target.value}))} />
                {(authMode === 'signup' || authMode === 'forgot') && (
                  <button
                    style={{ ...BTNS, whiteSpace:'nowrap' }}
                    onClick={() => checkEmailBeforeCode(authMode === 'signup' ? 'signup' : 'reset')}
                    disabled={checkingEmail}
                  >
                    {checkingEmail ? '확인중...' : '이메일 확인'}
                  </button>
                )}
              </div>

              {(authMode === 'signup' || authMode === 'forgot') && emailChecked && (
                <div style={{ marginBottom:8, fontSize:11, color: emailCheckOk ? '#15803D' : '#DC2626' }}>
                  {emailCheckOk ? '✅ ' : '❌ '}{emailCheckMsg}
                </div>
              )}

              {(authMode === 'signup' || authMode === 'forgot') && (
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <input style={{ ...INP, marginBottom:0, flex:1 }} placeholder='이메일 인증코드 6자리' value={authForm.code} onChange={e => setAuthForm(f => ({...f, code:e.target.value}))} />
                  <button style={{ ...BTNS, whiteSpace:'nowrap' }} onClick={() => sendAuthCode(authMode === 'signup' ? 'signup' : 'reset')} disabled={codeSending || !emailCheckOk}>
                    {codeSending ? '발송중...' : '코드발송'}
                  </button>
                </div>
              )}

              {authMode === 'forgot' ? (
                <input type='password' style={{ ...INP, marginBottom:8 }} placeholder='새 비밀번호(8자 이상)' value={authForm.newPassword} onChange={e => setAuthForm(f => ({...f, newPassword:e.target.value}))} />
              ) : (
                <input type='password' style={{ ...INP, marginBottom:8 }} placeholder='비밀번호(8자 이상)' value={authForm.password} onChange={e => setAuthForm(f => ({...f, password:e.target.value}))} />
              )}

              <button style={BTNP} onClick={submitAuth} disabled={authLoading}>
                {authLoading ? '처리 중...' : (authMode === 'signup' ? '이메일 인증 후 회원가입' : authMode === 'forgot' ? '비밀번호 재설정' : '로그인 후 시작')}
              </button>
            </div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns: me?.role === 'admin' ? '1fr 1fr' : '1fr', gap:8 }}>
                <button style={BTNP} onClick={() => { setAccountTab('account'); setStep('form'); }}>웹사이트 만들기 시작</button>
                {me?.role === 'admin' && (
                  <button style={{ ...BTNP, background:'#0F766E' }} onClick={openAdminMode}>관리자모드 보기</button>
                )}
              </div>
              <div style={{ fontSize:11, color:'#0f766e', marginTop:9 }}>로그인됨: {me.email} {me.role === 'admin' ? '(관리자 · 무제한)' : `(크레딧 ${credit}C)`}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ─ FORM (4단계) ──────────────────────────────────────────────
  if (step === "form") return (
    <div style={WRAP}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <Hdr />
      <div style={{ display:"flex", justifyContent:"center", padding:"0 20px" }}>
        <div style={CARD}>
          <StepBar current={formStep} total={TOTAL} />
          <div style={{ fontSize:11, fontWeight:600, color:"#94A3B8", marginBottom:4 }}>STEP {formStep + 1}/{TOTAL} — {LABELS[formStep]}</div>

          {/* STEP 1: 업종 & 브랜드 */}
          {formStep === 0 && <>
            <h2 style={H2}>업종을 선택하세요</h2>
            <p style={SUB}>업종만 고르면 소개글·서비스·테마·구성이 <strong style={{ color:"#2563EB" }}>자동 세팅</strong>됩니다.</p>
            <div style={FLD}>
              <label style={LBL}>업종 *</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
                {INDUSTRIES.map(ind => {
                  const on = form.industry === ind;
                  const icons = {"음식/카페":"☕","뷰티/미용":"💇","의료/헬스":"🏥","교육/학원":"📚","IT/소프트웨어":"💻","제조/생산":"🏭","법무/세무/컨설팅":"⚖️","쇼핑/이커머스":"🛒","부동산":"🏠","여행/숙박":"✈️","반려동물":"🐾","기타":"📋"};
                  return (
                    <div key={ind} onClick={() => applyPreset(ind)}
                      style={{ padding:"10px 8px", borderRadius:10, cursor:"pointer", border:"1.5px solid " + (on ? "#2563EB" : "#E2E8F0"), background: on ? "#EFF6FF" : "#F8FAFC", textAlign:"center", transition:"all .15s" }}>
                      <div style={{ fontSize:20, marginBottom:3 }}>{icons[ind]||"📋"}</div>
                      <div style={{ fontSize:11, fontWeight: on ? 600 : 400, color: on ? "#2563EB" : "#374151" }}>{ind.split("/")[0]}</div>
                    </div>
                  );
                })}
              </div>
              {form.industry && form.industry !== "기타" && (
                <div style={{ marginTop:10, padding:"10px 13px", background:"#F0FDF4", borderRadius:8, fontSize:11, color:"#15803D", lineHeight:1.7 }}>
                  ✅ <strong>{form.industry}</strong> 프리셋 적용됨 — 소개글·서비스·테마·구성페이지 자동 세팅 완료
                </div>
              )}
            </div>
            <div style={FLD}>
              <label style={LBL}>운영 목적(템플릿 모드)</label>
              <div style={{ display:"flex", flexWrap:"wrap" }}>
                {BUSINESS_MODES.map(m => (
                  <span key={m} style={chip(form.businessMode === m)} onClick={() => applyBusinessMode(m)}>
                    {form.businessMode === m ? "✓ " : ""}{m === "auto" ? "자동 추천" : m}
                  </span>
                ))}
              </div>
            </div>
            <div style={FLD}>
              <label style={LBL}>추천 레퍼런스 템플릿 (자동 누적 데이터 반영)</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {recommendedBenchmarks.map((b, idx) => {
                  const on = form.benchmarkSiteUrl === b.site_url;
                  const mood = benchmarkMoodText(b, idx);
                  return (
                    <button key={b.site_url} onClick={() => setForm(f => ({ ...f, benchmarkSiteUrl: b.site_url, benchmarkSiteName: b.site_name }))}
                      style={{ textAlign:"left", padding:"10px 11px", borderRadius:10, border:"1.5px solid " + (on ? "#2563EB" : "#E2E8F0"), background:on?"#EFF6FF":"#fff", cursor:"pointer" }}>
                      <div style={{ fontSize:12, fontWeight:600, color:on?"#2563EB":"#1E293B" }}>{mood.title}</div>
                      <div style={{ fontSize:10, color:"#64748B", marginTop:2 }}>{mood.subtitle}</div>
                      {mood.modules && <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>구성: {mood.modules}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={FLD}>
              <label style={LBL}>상호명 / 브랜드명 *</label>
              <input style={INP} placeholder="예: 헤어살롱봄" value={form.company} onChange={e => upd("company", e.target.value)} />
            </div>
            <div style={FLD}>
              <label style={LBL}>한줄 소개 <span style={{ color:"#94A3B8", fontWeight:400 }}>(자동 생성됨, 수정 가능)</span></label>
              <input style={INP} placeholder="예: 10년 경력 원장의 1:1 두피케어 전문 헤어살롱" value={form.description} onChange={e => upd("description", e.target.value)} />
            </div>
            <div style={FLD}>
              <label style={LBL}>핵심 서비스/제품 <span style={{ color:"#94A3B8", fontWeight:400 }}>(자동 생성됨, 수정 가능)</span></label>
              <input style={INP} placeholder="예: 커트 30,000원 / 펌 80,000원~" value={form.services} onChange={e => upd("services", e.target.value)} />
            </div>
          </>}

          {/* STEP 2: 디자인 & 스타일 */}
          {formStep === 1 && <>
            <h2 style={H2}>디자인 스타일</h2>
            <p style={SUB}>테마와 톤을 선택하세요. 업종에 맞게 자동 추천되어 있어요.</p>
            <div style={FLD}>
              <label style={LBL}>컬러 테마</label>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {THEMES.map(t => {
                  const on = form.selectedTheme && form.selectedTheme.id === t.id;
                  return (
                    <div key={t.id} onClick={() => setForm(f => ({ ...f, selectedTheme: on ? null : t, mood: t.mood }))}
                      style={{ padding:"12px 14px", borderRadius:12, cursor:"pointer", border:"2px solid " + (on ? "#2563EB" : "#E2E8F0"), background: on ? "#EFF6FF" : "#fff", display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:"linear-gradient(135deg," + t.primary + "," + t.accent + ")", border:"1px solid #E2E8F0" }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight: on ? 600 : 500, color: on ? "#2563EB" : "#1E293B" }}>{on ? "✓ " : ""}{t.name}</div>
                        <div style={{ fontSize:11, color:"#64748B" }}>{t.desc}</div>
                      </div>
                      <div style={{ display:"flex", gap:3 }}>
                        {[t.primary, t.secondary, t.accent].map(c => <div key={c} style={{ width:12, height:12, borderRadius:3, background:c, border:"1px solid #E2E8F0" }} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={FLD}>
              <label style={LBL}>소개글 톤</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {INTRO_TONES.map(t => {
                  const on = form.introTone === t.id;
                  return (
                    <div key={t.id} onClick={() => upd("introTone", t.id)}
                      style={{ padding:"10px 8px", borderRadius:10, cursor:"pointer", border:"1.5px solid " + (on ? "#2563EB" : "#E2E8F0"), background: on ? "#EFF6FF" : "#F8FAFC", textAlign:"center" }}>
                      <div style={{ fontSize:13, fontWeight: on ? 600 : 400, color: on ? "#2563EB" : "#374151" }}>{t.label}</div>
                      <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>{t.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={FLD}>
              <label style={LBL}>일러스트 스타일</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6 }}>
                {ILLUST_STYLES.map(s => {
                  const on = form.illustStyle === s.id;
                  return (
                    <div key={s.id} onClick={() => upd("illustStyle", s.id)}
                      style={{ padding:"8px", borderRadius:8, cursor:"pointer", border:"1.5px solid " + (on ? "#2563EB" : "#E2E8F0"), background: on ? "#EFF6FF" : "#F8FAFC", textAlign:"center" }}>
                      <div style={{ fontSize:12, fontWeight: on ? 600 : 400, color: on ? "#2563EB" : "#374151" }}>{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={FLD}>
              <label style={LBL}>구성 페이지 <span style={{ color:"#94A3B8", fontWeight:400 }}>(자동 추천됨, 변경 가능)</span></label>
              <div style={{ display:"flex", flexWrap:"wrap" }}>
                {PAGE_OPTIONS.map(p => <span key={p.id} style={chip(form.pages.includes(p.id))} onClick={() => toggleArr("pages", p.id)}>{form.pages.includes(p.id) ? "✓ " : ""}{p.label}</span>)}
              </div>
            </div>
          </>}

          {/* STEP 3: 사진 & 채널 */}
          {formStep === 2 && <>
            <h2 style={H2}>사진 & 채널 연동</h2>
            <p style={SUB}>사진이 없어도 AI가 일러스트를 그려넣어요. 채널은 선택사항이에요.</p>
            <ImageDropZone label="🏷️ 로고 (선택)" hint="없으면 브랜드명으로 자동 표시" value={form.uploadedImages.logo} onChange={v => updImg("logo", v)} />
            <ImageDropZone label="🖼️ 히어로 이미지 (선택)" hint="가게·제품·분위기 사진" value={form.uploadedImages.hero} onChange={v => updImg("hero", v)} />
            <ImageDropZone label="📦 제품/서비스 사진 (최대 6장)" hint="드래그하여 여러 장 업로드" multiple value={form.uploadedImages.products} onChange={v => updImg("products", v)} />
            <div style={{ background:"#F8FAFC", borderRadius:12, padding:"16px", marginTop:8, border:"1px solid #E2E8F0" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:10 }}>📱 채널 연동 (선택)</div>
              <div style={{ ...FLD, marginBottom:10 }}>
                <label style={{ ...LBL, fontSize:11 }}>카카오채널 ID</label>
                <div style={{ position:"relative" }}>
                  <input style={{ ...INP, paddingLeft:30, fontSize:13 }} placeholder="예: xAbCdE" value={form.kakaoId} onChange={e => upd("kakaoId", e.target.value)} />
                  <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13 }}>@</span>
                </div>
              </div>
              <div style={FLD}>
                <label style={{ ...LBL, fontSize:11 }}>네이버 예약 URL</label>
                <input style={{ ...INP, fontSize:13 }} placeholder="예: https://naver.me/xxxxxxxx" value={form.naverUrl} onChange={e => upd("naverUrl", e.target.value)} />
              </div>
            </div>
          </>}

          {/* STEP 4: 확인 & 생성 */}
          {formStep === 3 && <>
            <h2 style={H2}>거의 다 됐어요!</h2>
            <p style={SUB}>아래 내용을 확인하고, 필요한 연락처만 추가하세요.</p>
            <div style={{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:12, padding:"16px 18px", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0369A1", marginBottom:8 }}>📋 생성 요약</div>
              <div style={{ fontSize:12, color:"#0C4A6E", lineHeight:2.2 }}>
                <strong>{form.company || "(상호명)"}</strong> · {form.industry}<br />
                테마: {form.selectedTheme ? form.selectedTheme.name : "자동"} · 모드: {form.businessMode === "auto" ? "자동 추천" : form.businessMode} · 톤: {(INTRO_TONES.find(t => t.id === form.introTone) || {}).label}<br />
                구성: {form.pages.map(id => (PAGE_OPTIONS.find(p => p.id === id) || {}).label).join(", ")}<br />
                {form.benchmarkSiteName ? "🧩 레퍼런스: " + form.benchmarkSiteName + "  " : ""}
                {form.kakaoId ? "💬 @" + form.kakaoId + "  " : ""}{form.naverUrl ? "📅 네이버예약  " : ""}
                {form.uploadedImages.logo ? "🏷️ 로고  " : ""}{form.uploadedImages.hero ? "🖼️ 히어로  " : ""}
                {form.uploadedImages.products.length > 0 ? "📦 제품 " + form.uploadedImages.products.length + "장" : ""}
              </div>
            </div>
            <div style={{ background:"#F8FAFC", borderRadius:12, padding:"16px", border:"1px solid #E2E8F0", marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:10 }}>📞 연락처 (선택 — 홈페이지에 표시됩니다)</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[["phone","전화번호","042-000-0000"],["email","이메일","hello@example.com"],["address","주소","대전 서구 둔산동"],["businessHours","영업시간","화~일 10:00~20:00"]].map(([k, l, ph]) => (
                  <div key={k}>
                    <label style={{ ...LBL, fontSize:10 }}>{l}</label>
                    <input style={{ ...INP, fontSize:12, padding:"8px 10px" }} placeholder={ph} value={form[k]} onChange={e => upd(k, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding:"10px 14px", background:"#fff", borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #E2E8F0" }}>
              <span style={{ fontSize:13, fontWeight:500 }}>홈페이지 초안 생성</span>
              <span style={{ fontSize:14, fontWeight:600, color:"#2563EB" }}>-{COST_GENERATE}C</span>
            </div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:5, textAlign:"right" }}>현재 {credit}C → 생성 후 {credit - COST_GENERATE}C</div>
          </>}

          <div style={{ marginTop:20, display:"flex", gap:10 }}>
            {formStep > 0 && <button style={BTNS} onClick={() => setFormStep(f => f - 1)}>← 이전</button>}
            {formStep < TOTAL - 1
              ? <button style={{ ...BTNP, opacity: stepValid() ? 1 : 0.4, cursor: stepValid() ? "pointer" : "not-allowed" }} onClick={() => stepValid() && setFormStep(f => f + 1)}>다음 →</button>
              : <button style={{ ...BTNP, background: credit >= COST_GENERATE ? "#2563EB" : "#94A3B8" }} onClick={handleGenerate} disabled={credit < COST_GENERATE}>⚡ 홈페이지 생성하기 ({COST_GENERATE}C)</button>
            }
          </div>
        </div>
      </div>
    </div>
  );

  // ─ GENERATING ────────────────────────────────────────────────
  if (step === "generating") return (
    <div style={WRAP}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}} @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <Hdr />
      <div style={{ display:"flex", justifyContent:"center", padding:"36px 20px" }}>
        <div style={{ ...CARD, textAlign:"center", padding:"40px", maxWidth:520 }}>
          <div style={{ width:68, height:68, borderRadius:"50%", background:"linear-gradient(135deg,#EFF6FF,#DBEAFE)", border:"2px solid " + tc + "55", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:18, animation:"spin 3s linear infinite" }}>
            <span style={{ fontSize:30 }}>⚙️</span>
          </div>
          <h2 style={{ ...H2, textAlign:"center", marginBottom:5 }}>홈페이지 제작 중</h2>
          <p style={{ ...SUB, textAlign:"center", marginBottom:26, fontSize:12 }}>
            <strong style={{ color:"#1E293B" }}>{form.company}</strong>
            {form.selectedTheme && <span style={{ color:tc, fontWeight:500 }}> · {form.selectedTheme.name}</span>}
            <br /><span style={{ fontSize:10, color:"#94A3B8" }}>Claude Opus 4.6 · Gamma 디자인 시스템 적용</span>
          </p>
          <div style={{ marginBottom:26 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:7 }}>
              <span style={{ fontSize:11, fontWeight:500, color:"#64748B" }}>진행률</span>
              <span style={{ fontSize:28, fontWeight:700, color:tc, letterSpacing:"-1px" }}>{genProgress}%</span>
            </div>
            <div style={{ height:8, background:"#E2E8F0", borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:genProgress + "%", background:"linear-gradient(90deg," + tc + "88," + tc + ")", borderRadius:99, transition:"width 0.7s cubic-bezier(.4,0,.2,1)" }} />
            </div>
          </div>
          <div style={{ background:"#0F172A", borderRadius:11, padding:"15px 18px", textAlign:"left", minHeight:130 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8, paddingBottom:7, borderBottom:"1px solid #1E293B" }}>
              {["#FF5F57","#FFBD2E","#28CA41"].map(c => <div key={c} style={{ width:8, height:8, borderRadius:"50%", background:c }} />)}
              <span style={{ fontSize:10, color:"#475569", marginLeft:4, fontFamily:"monospace" }}>lumen-builder ~ opus-4.6</span>
            </div>
            {genLog.map((log, i) => (
              <div key={i} style={{ fontSize:11, color:"#34D399", fontFamily:"monospace", marginBottom:4, animation:"fadeUp .4s ease" }}>
                <span style={{ color:"#475569", marginRight:5 }}>{String(i + 1).padStart(2, "0")}.</span>{log}
              </div>
            ))}
            {genProgress < 100 && <div style={{ fontSize:11, color:"#334155", fontFamily:"monospace", animation:"blink 1.2s infinite" }}>▋</div>}
          </div>
          <div style={{ fontSize:11, color:"#94A3B8", marginTop:14 }}>Opus 4.6 + Gamma 디자인 · 평균 40초 ~ 2분</div>
        </div>
      </div>
    </div>
  );

  // ─ RESULT ────────────────────────────────────────────────────
  if (step === "result") {
    const vwNum = viewport === "desktop" ? "1280" : viewport === "tablet" ? "768" : "375";
    return (
      <div style={{ ...WRAP, minHeight:"100vh" }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        <div style={HDR}>
          <div style={{ fontWeight:600, fontSize:17, color:"#1E293B", letterSpacing:"-0.4px" }}>루멘<span style={{ color:"#2563EB" }}> 웹 빌더</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {form.selectedTheme && <div style={{ fontSize:11, fontWeight:500, background:tc + "22", color:tc, border:"1px solid " + tc + "44", borderRadius:20, padding:"4px 10px" }}>{form.selectedTheme.name}</div>}
            <div style={{ fontSize:11, color:"#16A34A", fontWeight:500, background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:20, padding:"4px 10px" }}>🆓 로컬 템플릿 모드</div>
            <CreditBadge credit={credit} />
          </div>
        </div>
        <div style={{ width:"100%", maxWidth:1200, padding:"20px 16px", boxSizing:"border-box", margin:"0 auto" }}>
          <div style={{ background:"linear-gradient(135deg," + tc + "," + (form.selectedTheme ? form.selectedTheme.accent : "#7C3AED") + ")", borderRadius:13, padding:"16px 22px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between", color:"#fff", flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:2 }}>🎉 홈페이지가 완성됐습니다!</div>
              <div style={{ fontSize:11, opacity:0.85 }}>{form.company} · {form.industry} {form.selectedTheme ? "· " + form.selectedTheme.name : ""}</div>
            </div>
            <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
              <button onClick={handleRegenerate} disabled={credit < COST_REGENERATE}
                style={{ padding:"8px 14px", borderRadius:8, border:"1.5px solid rgba(255,255,255,.4)", background:"transparent", color:"#fff", fontSize:11, fontWeight:500, cursor: credit >= COST_REGENERATE ? "pointer" : "not-allowed", opacity: credit >= COST_REGENERATE ? 1 : 0.5 }}>
                🔄 재생성 ({COST_REGENERATE}C)
              </button>
              <button onClick={() => { setFormStep(0); setStep("form"); }}
                style={{ padding:"8px 14px", borderRadius:8, border:"1.5px solid rgba(255,255,255,.4)", background:"transparent", color:"#fff", fontSize:11, fontWeight:500, cursor:"pointer" }}>✏️ 폼 수정</button>
              <button onClick={() => { const b = new Blob([resultHtml], { type:"text/html" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = (form.company || "homepage") + "_홈페이지.html"; a.click(); }}
                style={{ padding:"8px 14px", borderRadius:8, border:"none", background:"#fff", color:tc, fontSize:11, fontWeight:600, cursor:"pointer" }}>💾 HTML 다운로드</button>
              {me && (
                <>
                  <div style={{ padding:"8px 12px", borderRadius:8, border:"1.5px solid rgba(255,255,255,.4)", background:"rgba(255,255,255,.12)", color:"#fff", fontSize:11, fontWeight:600 }}>
                    {me.email} · {me.role === 'admin' ? '관리자' : `크레딧 ${credit}C`}
                  </div>
                  {me?.role === 'admin' && (
                    <button onClick={() => setShowAdminModal(true)} style={{ padding:"8px 14px", borderRadius:8, border:"1.5px solid rgba(255,255,255,.4)", background:"rgba(255,255,255,.12)", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>관리자 모드</button>
                  )}
                  <button onClick={() => setShowPasswordModal(true)} style={{ padding:"8px 14px", borderRadius:8, border:"1.5px solid rgba(255,255,255,.4)", background:"rgba(255,255,255,.12)", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>🔐 비밀번호 변경</button>
                  <button onClick={() => { localStorage.removeItem('lumen_token'); setAuthToken(''); setMe(null); setStep('intro'); setAccountTab('account'); }} style={{ padding:"8px 14px", borderRadius:8, border:"1.5px solid rgba(255,255,255,.4)", background:"rgba(255,255,255,.12)", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>↩ 로그아웃</button>
                </>
              )}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) 300px", gap:12, alignItems:"start" }}>
            <div>
              {/* 인라인 편집 컨트롤 */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, padding:"10px 14px", background: editMode ? "linear-gradient(135deg,#EEF2FF,#F0F9FF)" : "#fff", borderRadius:12, border: editMode ? "1.5px solid #2563EB" : "1px solid #E2E8F0" }}>
                {!editMode ? (
                  <>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:"#1E293B" }}>✏️ 문구 수정</span>
                      {!editConfirmed && <span style={{ background:"#D1FAE5", color:"#065F46", padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:600 }}>무료</span>}
                    </div>
                    <button onClick={startEditMode}
                      style={{ padding:"7px 16px", borderRadius:8, border:"none", background: editConfirmed ? "#EFF6FF" : "#2563EB", color: editConfirmed ? "#2563EB" : "#fff", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                      {editConfirmed ? "✏️ 추가 수정 (" + COST_INLINE_EDIT + "C)" : "✏️ 무료 문구 수정 시작"}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:"#2563EB", animation:"blink 1.2s infinite" }} />
                      <span style={{ fontSize:12, fontWeight:600, color:"#2563EB" }}>편집 중 — 미리보기에서 텍스트를 클릭하세요</span>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={cancelEdit}
                        style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", color:"#64748B", fontSize:11, fontWeight:500, cursor:"pointer" }}>취소</button>
                      <button onClick={confirmEdit}
                        style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#2563EB", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>✓ 확정</button>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:500, color:"#374151" }}>🖥️ 미리보기</div>
                <div style={{ display:"flex", background:"rgba(241,245,249,0.9)", borderRadius:10, padding:3, gap:2, border:"1px solid #E2E8F0" }}>
                  {[["desktop","🖥️","PC"],["tablet","📱","태블릿"],["mobile","📲","모바일"]].map(([id, icon, label]) => (
                    <button key={id} onClick={() => setViewport(id)}
                      style={{ padding:"5px 11px", borderRadius:7, border:"none", cursor:"pointer", fontSize:10, fontWeight:500, background: viewport === id ? "#fff" : "transparent", color: viewport === id ? tc : "#64748B", boxShadow: viewport === id ? "0 1px 6px rgba(0,0,0,.1)" : "none" }}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ background:"#1A2035", borderRadius:14, overflow:"hidden", padding:"10px 10px 0", boxShadow:"0 16px 50px rgba(0,0,0,.2)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8, paddingLeft:3 }}>
                  {["#FF5F57","#FFBD2E","#28CA41"].map(c => <div key={c} style={{ width:9, height:9, borderRadius:"50%", background:c }} />)}
                  <div style={{ flex:1, background:"rgba(255,255,255,0.08)", borderRadius:6, padding:"3px 10px", fontSize:10, color:"#8892A4", marginLeft:5 }}>
                    {"🔒 " + (form.company || "preview").toLowerCase().replace(/\s/g, "-") + ".lumen.app"}
                  </div>
                  <div style={{ fontSize:9, color:"#4A5568", marginRight:3, fontFamily:"monospace" }}>{vwNum + "px"}</div>
                </div>
                {viewport === "desktop" && (
                  <iframe key="desktop" srcDoc={previewSrc} style={{ width:"100%", height:660, border:"none", borderRadius:"8px 8px 0 0", background:"#fff", display:"block" }} title="preview-desktop" sandbox="allow-same-origin allow-scripts" scrolling="auto" />
                )}
                {viewport === "tablet" && (() => {
                  const SCALE = 600 / 768, FRAME_H = Math.round(640 * SCALE);
                  return (
                    <div style={{ background:"#242B3D", display:"flex", justifyContent:"center", padding:"12px 12px 0" }}>
                      <div style={{ width:600, height:FRAME_H + 30, overflow:"hidden", borderRadius:"14px 14px 0 0", flexShrink:0, boxShadow:"0 -4px 30px rgba(0,0,0,.5)" }}>
                        <div style={{ height:30, background:"#1E293B", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                          <div style={{ width:60, height:6, borderRadius:3, background:"rgba(255,255,255,0.2)" }} />
                        </div>
                        <div style={{ width:600, height:FRAME_H, overflow:"auto", WebkitOverflowScrolling:"touch" }}>
                          <iframe key="tablet" srcDoc={previewSrc} style={{ width:768, height:Math.round(FRAME_H/SCALE), border:"none", background:"#fff", display:"block", transformOrigin:"top left", transform:"scale("+SCALE.toFixed(4)+")" }} title="preview-tablet" sandbox="allow-same-origin allow-scripts" scrolling="auto" />
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {viewport === "mobile" && (
                  <div style={{ background:"#242B3D", display:"flex", justifyContent:"center", padding:"12px 12px 0" }}>
                    <div style={{ width:390, flexShrink:0, borderRadius:"32px 32px 0 0", overflow:"hidden", boxShadow:"0 -4px 30px rgba(0,0,0,.5)", border:"1.5px solid #3A4460", borderBottom:"none" }}>
                      <div style={{ height:44, background:"#0F172A", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", fontFamily:"monospace" }}>9:41</div>
                        <div style={{ width:90, height:20, borderRadius:10, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <div style={{ width:60, height:6, borderRadius:3, background:"rgba(255,255,255,0.3)" }} />
                        </div>
                        <div style={{ width:12, height:8, borderRadius:1, border:"1.5px solid rgba(255,255,255,0.6)" }} />
                      </div>
                      <div style={{ width:390, height:620, overflow:"auto", WebkitOverflowScrolling:"touch" }}>
                        <iframe key="mobile" srcDoc={previewSrc} style={{ width:390, height:620, border:"none", background:"#fff", display:"block" }} title="preview-mobile" sandbox="allow-same-origin allow-scripts" scrolling="auto" />
                      </div>
                      <div style={{ height:24, background:"#0F172A", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ width:100, height:4, borderRadius:2, background:"rgba(255,255,255,0.3)" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:10 }}>
                {[["desktop","🖥️","PC","1280px"],["tablet","📱","태블릿","768px"],["mobile","📲","모바일","375px"]].map(([id, icon, nm, d]) => (
                  <div key={id} onClick={() => setViewport(id)} style={{ fontSize:10, color: viewport === id ? tc : "#94A3B8", textAlign:"center", cursor:"pointer", fontWeight: viewport === id ? 500 : 400 }}>
                    {icon} {nm}<br /><span style={{ fontSize:9 }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
            <RightPanel
              credit={credit}
              form={form}
              resultHtml={resultHtml}
              setResultHtml={setResultHtml}
              appliedFeatures={appliedFeatures}
              setAppliedFeatures={setApplied}
              currentImages={curImages}
              setCurrentImages={setCurImages}
              consumeCredit={consumeCredit}
            />

          </div>

          {showAdminModal && me?.role === 'admin' && (
            <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }}>
              <div style={{ width:'100%', maxWidth:520, background:'#fff', borderRadius:12, border:'1px solid #E2E8F0', boxShadow:'0 20px 40px rgba(0,0,0,0.2)', padding:14, maxHeight:'80vh', overflow:'auto' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#1E293B' }}>관리자 모드</div>
                  <button onClick={() => setShowAdminModal(false)} style={{ border:'none', background:'transparent', fontSize:18, cursor:'pointer', color:'#64748B' }}>×</button>
                </div>
                <AdminTransferBox authToken={authToken} onDone={() => fetchMe(authToken)} />
                <AdminUsersPanel authToken={authToken} />
              </div>
            </div>
          )}

          {showPasswordModal && (
            <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 }}>
              <div style={{ width:'100%', maxWidth:420, background:'#fff', borderRadius:12, border:'1px solid #E2E8F0', boxShadow:'0 20px 40px rgba(0,0,0,0.2)', padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#1E293B' }}>비밀번호 변경</div>
                  <button onClick={() => setShowPasswordModal(false)} style={{ border:'none', background:'transparent', fontSize:18, cursor:'pointer', color:'#64748B' }}>×</button>
                </div>
                <ChangePasswordBox authToken={authToken} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
