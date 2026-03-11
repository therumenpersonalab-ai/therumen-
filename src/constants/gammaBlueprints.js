export const INPUT_ENTRIES = [
  { id: "generate", label: "Generate", desc: "아이디어로 초안 생성" },
  { id: "paste", label: "Paste", desc: "기존 텍스트를 구조화" },
  { id: "import", label: "Import", desc: "URL/문서/슬라이드 가져오기" },
];

export const SITE_ARCHETYPES = ["business", "personal", "leadMagnet", "portfolio", "generic"];

export const SMART_LAYOUTS = [
  "hero-centered",
  "hero-split",
  "feature-2col",
  "feature-3grid",
  "stats-row",
  "timeline",
  "gallery",
  "testimonial-cards",
  "faq-accordion",
  "cta-band",
  "logo-cloud",
  "contact-split",
];

export const CARD_STYLE_CONTROLS = {
  layout: ["no-media", "media-top", "media-left", "media-right", "media-bg"],
  background: ["solid", "image", "gradient"],
  overlay: ["none", "soft", "strong", "blur"],
  alignment: ["top", "center", "bottom"],
  density: ["compact", "regular", "spacious"],
  emphasis: ["standard", "featured", "full-bleed"],
};

export const SEO_STATES = ["draft", "published-noindex", "published-index"];

export const MVP_CHECKLIST = [
  "3입구(Generate/Paste/Import)",
  "Site>Page>Card>Block 구조",
  "Smart Layout 12종",
  "멀티페이지 + 공통 Navbar",
  "페이지 SEO(meta/slugs)",
  "모바일 프리뷰",
];
