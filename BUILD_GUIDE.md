# 🏗️ 루멘 웹 빌더 — 제작 과정 가이드 (BUILD_GUIDE.md)

> OpenClaw 또는 직접 배포 시 이 문서를 따라가면 됩니다.

---

## 1단계: 환경 준비

### 1-1. 필수 소프트웨어
```bash
# Node.js 20+ 설치 확인
node --version    # v20.x 이상

# npm 확인
npm --version     # 10.x 이상
```

### 1-2. 프로젝트 클론 & 의존성 설치
```bash
cd lumen-web-builder
npm install
```

### 1-3. 환경변수 설정
```bash
cp .env.example .env
```

`.env` 파일을 열어 API 키 입력:
```
ANTHROPIC_API_KEY=sk-ant-api03-실제키입력
OPENAI_API_KEY=sk-proj-실제키입력
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**API 키 발급처:**
- Claude API: https://console.anthropic.com → API Keys
- OpenAI API: https://platform.openai.com → API Keys

---

## 2단계: 로컬 개발 실행

```bash
npm run dev
```

이 명령은 동시에 실행합니다:
- **프론트엔드**: http://localhost:5173 (Vite dev server)
- **백엔드**: http://localhost:3001 (Express API server)

Vite가 자동으로 `/api/*` 요청을 Express 서버로 프록시합니다.

### 확인 방법
1. 브라우저에서 http://localhost:5173 접속
2. "무료로 시작하기" 클릭
3. 업종 선택 → 4단계 폼 완성 → 홈페이지 생성
4. 생성된 HTML 미리보기, 인라인 편집, 다운로드 확인

---

## 3단계: 프로젝트 구조 이해

### 3-1. 파일별 역할

| 파일 | 역할 | 줄 수 |
|---|---|---|
| `src/App.jsx` | 메인 UI 전체 (폼·생성·결과·편집) | ~1,340 |
| `src/constants/costs.js` | 크레딧 비용 상수 | 6 |
| `src/constants/themes.js` | 테마 5종, 업종 12종, UI 옵션 | 60 |
| `src/constants/presets.js` | 업종 프리셋, 기능 추가, AI 이미지 | 50 |
| `src/api/client.js` | API 클라이언트 (callClaude, generateDalleImage) | 30 |
| `src/api/editableHtml.js` | 인라인 편집 HTML 주입 | 50 |
| `server/index.js` | Express 서버 메인 | 30 |
| `server/routes/generate.js` | Claude API 프록시 (+이어쓰기) | 55 |
| `server/routes/dalle.js` | DALL-E API 프록시 | 25 |

### 3-2. 데이터 흐름

```
[사용자] 업종 선택
    ↓
[App.jsx] INDUSTRY_PRESETS 자동 적용
    ↓
[App.jsx] buildPrompt() — 감마+아임웹 디자인 프롬프트 생성
    ↓
[App.jsx] fetch("/api/generate")
    ↓
[server/routes/generate.js] Claude Opus 4.6 호출 (+ 이어쓰기)
    ↓
[App.jsx] HTML 수신 → iframe srcDoc으로 미리보기
    ↓
[사용자] 인라인 편집 / AI 수정 / 기능 추가 / HTML 다운로드
```

### 3-3. 프롬프트 시스템

`App.jsx`의 `buildPrompt()` 함수가 핵심입니다. 구성:

1. **핵심 원칙** — 아름다움이 기본값, 카드 기반, 콘텐츠 우선
2. **브랜드 정보** — 폼에서 입력받은 데이터
3. **테마 시스템** — 선택된 테마의 12개 토큰
4. **시각 무드 규칙** — 업종별 자동 매핑 (editorial/corporate/bold/playful)
5. **섹션 리듬** — 아임웹 68개 템플릿 공통 패턴 (배경색 교차)
6. **섹션별 상세 CSS** — NAV, HERO, BRAND_STORY, STATS, SERVICE, PROCESS, CTA, REVIEW, FAQ, LOCATION, FOOTER
7. **타이포그래피 스케일** — 감마 6단계
8. **반응형 규칙** — 3단 브레이크포인트
9. **출력 규칙** — 9개 필수 준수 사항

---

## 4단계: 프로덕션 빌드 & 배포

### 4-1. 빌드
```bash
npm run build
```
→ `dist/` 폴더에 정적 파일 생성

### 4-2. 프로덕션 실행
```bash
NODE_ENV=production npm start
```
→ Express가 `dist/`를 서빙 + API 프록시 동시 처리

### 4-3. 배포 옵션

#### A. VPS 직접 배포 (Vultr, AWS EC2 등)
```bash
# 서버에서
git clone <repo-url>
cd lumen-web-builder
npm install
cp .env.example .env
# .env에 API 키 입력
npm run build
NODE_ENV=production PORT=80 npm start
```

#### B. Railway / Render 배포
1. GitHub 리포 연결
2. 빌드 커맨드: `npm run build`
3. 시작 커맨드: `npm start`
4. 환경변수에 API 키 추가

#### C. Docker 배포
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3001
ENV NODE_ENV=production
CMD ["npm", "start"]
```

```bash
docker build -t lumen-web-builder .
docker run -p 3001:3001 --env-file .env lumen-web-builder
```

---

## 5단계: 핵심 코드 수정 가이드

### 5-1. 업종 추가
`src/constants/presets.js`의 `INDUSTRY_PRESETS`에 새 업종 추가:
```js
"새업종": {
  desc: "한줄 소개",
  services: "서비스 목록",
  target: "타겟 고객",
  purpose: ["info", "booking"],
  pages: ["about", "service", "review", "contact"],
  themeId: "deep_navy",        // themes.js의 테마 ID
  tone: "professional",        // friendly / professional / emotional
  illust: "flat",              // flat / line / iso / minimal
  visualMood: "corporate",     // editorial / corporate / bold / playful
  heroType: "split"            // split / fullscreen
}
```

`src/constants/themes.js`의 `INDUSTRIES` 배열과 `INDUSTRY_ICONS`에도 추가.

### 5-2. 테마 추가
`src/constants/themes.js`의 `THEMES` 배열에 새 테마 객체 추가:
```js
{
  id: "테마id",
  name: "🎨 테마명",
  desc: "적합 업종",
  primary: "#컬러",    // CTA, 강조
  secondary: "#컬러",  // 교대 배경
  accent: "#컬러",     // 뱃지, 포인트
  bg: "#컬러",         // 페이지 배경
  text: "#컬러",       // 본문 텍스트
  font: "폰트명",
  mood: "무드 설명",
  btnBg: "#컬러",
  btnText: "#컬러",
  surfaceBg: "#컬러",
  borderColor: "rgba(r,g,b,0.08)"
}
```

### 5-3. 크레딧 비용 조정
`src/constants/costs.js` 수정.

### 5-4. 프롬프트 수정
`src/App.jsx`의 `buildPrompt()` 함수 내 백틱 템플릿 수정.
주의: 프롬프트 변경은 생성 결과에 직접 영향을 미치므로 신중하게.

### 5-5. 기능 추가 항목
`src/constants/presets.js`의 `FEATURES` 배열에 추가:
```js
{ id: "기능id", label: "🔧 기능명", cost: 15, prompt: "AI에게 전달할 수정 지시" }
```

---

## 6단계: OpenClaw 자동화 설정

### 6-1. MEMORY.md 활용
프로젝트 루트의 `MEMORY.md`가 OpenClaw 에이전트의 온보딩 문서입니다.
에이전트가 프로젝트 구조, 명령어, 환경변수를 즉시 파악할 수 있습니다.

### 6-2. 자동화 가능한 작업

| 작업 | 방법 |
|---|---|
| 서버 상태 모니터링 | Heartbeat → GET /api/health |
| 새 업종 추가 | Cron → presets.js 수정 + 서버 재시작 |
| 프롬프트 A/B 테스트 | buildPrompt 변형 → 결과 비교 |
| 크레딧 사용량 로깅 | generate.js에 로깅 미들웨어 추가 |
| 자동 배포 | GitHub push → webhook → npm run build + restart |

### 6-3. 웹훅 연동 예시
`server/index.js`에 추가:
```js
app.post('/api/webhook/deploy', async (req, res) => {
  // GitHub webhook → git pull + npm run build + pm2 restart
  const { execSync } = await import('child_process');
  execSync('git pull && npm run build', { cwd: __dirname + '/..' });
  res.json({ status: 'deployed' });
});
```

---

## 7단계: 향후 확장 로드맵

### Phase 1 (현재 → 1개월)
- [ ] App.jsx 컴포넌트 분리 (FormWizard, ResultScreen, RightPanel 등)
- [ ] 크레딧 구매 UI (토스페이먼츠)
- [ ] 생성 결과 DB 저장 (SQLite 또는 Supabase)
- [ ] 사용자 인증 (카카오 로그인)

### Phase 2 (1~3개월)
- [ ] 카드 단위 AI 편집 (특정 섹션만 재생성)
- [ ] 다중 페이지 지원 (About, Service, Contact 분리)
- [ ] SEO 메타태그 자동 생성
- [ ] 커스텀 도메인 연결 (아임웹 호스팅 연동)

### Phase 3 (3~6개월)
- [ ] 템플릿 마켓플레이스
- [ ] A/B 테스트 내장
- [ ] 방문자 분석 대시보드
- [ ] API/MCP 공개 (감마 개발자 모델 참고)

---

## 트러블슈팅

### "Claude API 오류" 발생 시
1. `.env`의 `ANTHROPIC_API_KEY` 확인
2. API 크레딧 잔액 확인: https://console.anthropic.com
3. 서버 로그 확인: `npm run dev:server`

### HTML이 잘리는 경우
- `server/routes/generate.js`에 이어쓰기 로직이 내장됨
- `max_tokens: 16000` (메인) + `8000` (이어쓰기)
- 그래도 잘리면 프롬프트에서 SVG를 더 단순화하도록 수정

### 인라인 편집이 안 될 때
- iframe `sandbox="allow-same-origin allow-scripts"` 확인
- 브라우저 콘솔에서 postMessage 이벤트 확인
- `nav` 내부 요소는 의도적으로 편집 제외됨

### 빌드 실패 시
```bash
rm -rf node_modules dist
npm install
npm run build
```

---

*최종 업데이트: 2026-03-09 | v0.5.2 | claude-opus-4-6*
