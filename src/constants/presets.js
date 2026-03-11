export const INDUSTRY_PRESETS = {
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

export const FEATURES = [
  { id:"map", label:"📍 구글 지도 삽입", cost:10, prompt:"오시는 길 섹션에 구글 지도 임베드 placeholder를 추가하세요." },
  { id:"kakao", label:"💬 카카오채널 버튼", cost:15, prompt:"우측 하단 고정 카카오채널 상담 버튼을 추가하세요." },
  { id:"color", label:"🎨 컬러 테마 변경", cost:15, prompt:"전체 색상 팔레트를 세련된 다른 컬러로 리디자인하세요." },
  { id:"popup", label:"📢 팝업 배너", cost:20, prompt:"페이지 진입 시 이벤트/공지 팝업을 추가하세요." },
  { id:"sns", label:"📷 SNS 피드 연동", cost:25, prompt:"인스타그램 피드 스타일의 갤러리 섹션을 추가하세요." },
  { id:"form", label:"📅 예약/문의 폼", cost:40, prompt:"이메일 연동 예약 및 문의 폼 섹션을 추가하세요." },
  { id:"ai_text", label:"✍️ 소개글 AI 재작성", cost:20, prompt:"업종과 브랜드에 맞는 감성적인 소개글로 전면 교체하세요." },
  { id:"animation", label:"✨ 애니메이션 효과", cost:25, prompt:"스크롤 시 섹션들이 부드럽게 등장하는 CSS 애니메이션을 추가하세요." },
];

export const AI_IMAGE_SLOTS = [
  { id:"hero", label:"히어로 이미지", size:"1792x1024", buildPrompt:(f,kr) => `A stunning professional hero banner for a ${f.industry} business called ${f.company}. High-end commercial photography, cinematic lighting.${kr ? " Korean people if applicable." : ""} Absolutely no text anywhere.` },
  { id:"svc1", label:"서비스 이미지 1", size:"1024x1024", buildPrompt:(f,kr) => `Professional service photo for ${f.company} ${f.industry}.${kr ? " Korean people." : ""} No text anywhere.` },
  { id:"svc2", label:"서비스 이미지 2", size:"1024x1024", buildPrompt:(f,kr) => `Lifestyle scene for ${f.company} ${f.industry}.${kr ? " Korean people." : ""} No text anywhere.` },
  { id:"svc3", label:"서비스 이미지 3", size:"1024x1024", buildPrompt:(f,kr) => `Detail close-up for ${f.company} ${f.industry} quality.${kr ? " Korean people." : ""} No text anywhere.` },
  { id:"bg", label:"배경 이미지", size:"1792x1024", buildPrompt:(f) => `Abstract background texture for ${f.industry} website. Subtle elegant. No text anywhere.` },
];
