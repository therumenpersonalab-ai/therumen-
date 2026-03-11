export const THEMES = [
  { id:"warm_rose", name:"🌸 Warm Rose", desc:"미용·뷰티·반려동물", primary:"#E8847A", secondary:"#F5E6D3", accent:"#C9A96E", bg:"#FDF8F5", text:"#3D2B1F", font:"Noto Serif KR", mood:"감성/따뜻함", btnBg:"#E8847A", btnText:"#fff", surfaceBg:"#FFF8F5", borderColor:"rgba(61,43,31,0.08)" },
  { id:"fresh_mint", name:"🌿 Fresh Mint", desc:"카페·베이커리·여행", primary:"#5BA9A0", secondary:"#F0F7F5", accent:"#E8D5B0", bg:"#F8FFFE", text:"#1A3330", font:"Gmarket Sans", mood:"감성/따뜻함", btnBg:"#5BA9A0", btnText:"#fff", surfaceBg:"#F0F7F5", borderColor:"rgba(26,51,48,0.08)" },
  { id:"deep_navy", name:"🌊 Deep Navy", desc:"학원·의원·컨설팅·IT", primary:"#1B3A5C", secondary:"#F8F9FA", accent:"#4A90D9", bg:"#FFFFFF", text:"#1B3A5C", font:"Pretendard", mood:"전문적/신뢰감", btnBg:"#1B3A5C", btnText:"#fff", surfaceBg:"#F1F5F9", borderColor:"rgba(27,58,92,0.08)" },
  { id:"vibrant_energy", name:"⚡ Vibrant Energy", desc:"헬스·쇼핑·엔터테인먼트", primary:"#FF6B35", secondary:"#FFF7ED", accent:"#FFD700", bg:"#FFFCFA", text:"#1A1A2E", font:"Pretendard", mood:"활기/역동적", btnBg:"#FF6B35", btnText:"#fff", surfaceBg:"#FFF7ED", borderColor:"rgba(26,26,46,0.08)" },
  { id:"natural_wood", name:"🪵 Natural Wood", desc:"공방·플로리스트·소품샵", primary:"#8B6F47", secondary:"#FAF6F0", accent:"#6B8E6B", bg:"#FAF6F0", text:"#3D2B1F", font:"Noto Serif KR", mood:"단순/미니멀", btnBg:"#8B6F47", btnText:"#fff", surfaceBg:"#F5EFE6", borderColor:"rgba(61,43,31,0.08)" },
];

export const ILLUST_STYLES = [
  { id:"flat", label:"🎨 플랫", desc:"색면 위주, 모던" },
  { id:"line", label:"✏️ 라인", desc:"손그림 감성" },
  { id:"iso", label:"📦 입체", desc:"3D 아이소" },
  { id:"minimal", label:"🔲 미니멀", desc:"도형+선" },
];

export const INTRO_TONES = [
  { id:"friendly", label:"😊 친근", desc:"편안하고 다정" },
  { id:"professional", label:"👔 전문", desc:"신뢰감·전문성" },
  { id:"emotional", label:"✨ 감성", desc:"따뜻하고 감성적" },
];

export const INDUSTRIES = [
  "음식/카페","뷰티/미용","의료/헬스","교육/학원","IT/소프트웨어",
  "제조/생산","법무/세무/컨설팅","쇼핑/이커머스","부동산","여행/숙박","반려동물","기타"
];

export const INDUSTRY_ICONS = {
  "음식/카페":"☕","뷰티/미용":"💇","의료/헬스":"🏥","교육/학원":"📚",
  "IT/소프트웨어":"💻","제조/생산":"🏭","법무/세무/컨설팅":"⚖️","쇼핑/이커머스":"🛒",
  "부동산":"🏠","여행/숙박":"✈️","반려동물":"🐾","기타":"📋"
};

export const PURPOSE_OPTIONS = [
  { id:"info", label:"📋 정보 제공", desc:"메뉴·위치·영업시간" },
  { id:"booking", label:"📅 예약·문의", desc:"온라인 예약 및 상담" },
  { id:"shop", label:"🛒 온라인 판매", desc:"쇼핑몰·결제" },
  { id:"portfolio", label:"🖼️ 포트폴리오", desc:"작업물·사례 전시" },
  { id:"brand", label:"✨ 브랜드 신뢰", desc:"이미지 제고" },
  { id:"invest", label:"💼 투자자 유치", desc:"IR·파트너" },
  { id:"recruit", label:"👥 채용", desc:"인재 채용" },
  { id:"edu", label:"📚 교육·강의", desc:"강의·프로그램" },
];

export const PAGE_OPTIONS = [
  { id:"about", label:"회사 소개" },
  { id:"service", label:"서비스/제품" },
  { id:"portfolio", label:"포트폴리오" },
  { id:"review", label:"고객 후기" },
  { id:"faq", label:"FAQ" },
  { id:"map", label:"오시는 길" },
  { id:"contact", label:"문의/예약" },
];
