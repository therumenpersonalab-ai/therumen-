export const SITE_CATEGORIES = [
  "쇼핑몰",
  "비즈니스 홍보",
  "블로그·미디어",
  "이벤트·프로젝트",
  "포트폴리오",
  "커뮤니티",
  "예약·기타",
];

export const IA_PRESETS = {
  "쇼핑몰": ["hero", "brand", "productGrid", "collections", "reviews", "cta", "footer"],
  "비즈니스 홍보": ["hero", "valueProps", "kpi", "services", "process", "reviews", "leadForm", "footer"],
  "블로그·미디어": ["hero", "featuredPosts", "archive", "newsletter", "footer"],
  "이벤트·프로젝트": ["hero", "eventInfo", "program", "speakers", "archive", "ticketCta", "footer"],
  "포트폴리오": ["hero", "about", "works", "caseStudies", "clients", "contact", "footer"],
  "커뮤니티": ["hero", "mission", "stats", "recruit", "board", "reviews", "faq", "footer"],
  "예약·기타": ["hero", "about", "catalog", "location", "notice", "reservationForm", "footer"],
};

export const VISUAL_MOODS = {
  editorial: {
    name: "미니멀/에디토리얼",
    heroType: ["fullscreen", "center"],
    density: "low",
    cardStyle: "minimal-border",
  },
  corporate: {
    name: "코퍼레이트/SaaS",
    heroType: ["split"],
    density: "medium",
    cardStyle: "outlined",
  },
  bold: {
    name: "볼드/포스터형",
    heroType: ["banner", "fullscreen"],
    density: "high",
    cardStyle: "thick-border",
  },
  playful: {
    name: "플레이풀/일러스트형",
    heroType: ["fullscreen", "split"],
    density: "medium",
    cardStyle: "soft-round",
  },
  darkNeon: {
    name: "다크/네온 이벤트형",
    heroType: ["banner", "fullscreen"],
    density: "medium",
    cardStyle: "glow",
  },
};

export const IMWEB_REFERENCE_GROUPS = {
  editorial: ["Fashion", "The Soap Company", "DIVINE", "달항아리 약방"],
  corporate: ["workflow", "my cleaning", "GLOBAL LOGISTICS", "Startup"],
  bold: ["Seoul Designer Conference", "Grab it"],
  playful: ["PIT A PET", "ZIGULAB", "제주도 농산물 마켓"],
  darkNeon: ["Volt.X", "Jazz festival"],
};
