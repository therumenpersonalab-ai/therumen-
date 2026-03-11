# MEMORY.md — 루멘 웹 빌더 (OpenClaw 에이전트용)

## 프로젝트 정체성
- **이름**: 루멘 웹 빌더 (Lumen Web Builder)
- **버전**: 0.5.2
- **목적**: 소상공인이 업종만 선택하면 AI가 전문 홈페이지를 자동 생성하는 웹서비스
- **운영**: 더루멘 에듀매거진 (대전, 사업자 631-28-01957)
- **핵심 철학**: "뇌 빼고도 만들 수 있을 정도로 쉽게"

## 기술 스택
- **프론트엔드**: React 18 + Vite 6
- **백엔드**: Express.js (API 프록시)
- **AI 엔진**: Claude Opus 4.6 (HTML 생성) + DALL-E 3 (이미지 생성)
- **디자인 시스템**: Gamma.app + 아임웹 시각 클러스터 기반 프롬프트
- **배포**: Node.js 서버 (Vite 빌드 + Express 정적 서빙)

## 디렉토리 구조
```
lumen-web-builder/
├── package.json          # 의존성 + 스크립트
├── vite.config.js        # Vite 설정 (dev proxy → localhost:3001)
├── .env                  # API 키 (ANTHROPIC_API_KEY, OPENAI_API_KEY)
├── index.html            # HTML 엔트리
├── src/
│   ├── main.jsx          # React 루트
│   ├── App.jsx           # 메인 컴포넌트 (1,338줄, 모놀리식)
│   ├── api/
│   │   ├── client.js     # fetch 래퍼 (callClaude, generateDalleImage)
│   │   └── editableHtml.js  # 인라인 편집 HTML 주입
│   ├── constants/
│   │   ├── costs.js      # 크레딧 비용 상수
│   │   ├── themes.js     # 테마 5종 + 업종 12종 + UI 옵션
│   │   └── presets.js    # 업종 프리셋 + 기능 + AI 이미지 슬롯
│   └── styles/
│       └── global.css
├── server/
│   ├── index.js          # Express 서버
│   └── routes/
│       ├── generate.js   # Claude API 프록시 (이어쓰기 포함)
│       └── dalle.js      # DALL-E API 프록시
└── public/
```

## 핵심 작동 원리
1. 사용자가 업종 선택 → INDUSTRY_PRESETS가 소개글·서비스·테마·페이지 자동 세팅
2. 4단계 폼 완성 → buildPrompt()가 감마+아임웹 디자인 시스템 프롬프트 생성
3. /api/generate → Claude Opus 4.6이 전체 HTML을 한 파일로 생성
4. 결과 화면에서 인라인 편집(contentEditable) / AI 수정(5C) / 기능 추가 / 이미지 교체

## 크레딧 체계
| 액션 | 비용 |
|---|---|
| 초안 생성 | 80C |
| 재생성 | 30C |
| AI 이미지 | 20C |
| AI 문구 수정 | 5C |
| 인라인 편집 (최초) | 무료 |
| 인라인 편집 (추가) | 3C |
| 이미지 교체 | 무료 |

## 명령어
```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 (Vite 5173 + Express 3001)
npm run build        # 프로덕션 빌드
npm start            # 프로덕션 실행 (Express가 dist/ 서빙)
```

## 환경변수 (필수)
```
ANTHROPIC_API_KEY=sk-ant-xxxxx   # Claude API (필수)
OPENAI_API_KEY=sk-proj-xxxxx     # DALL-E 3 (선택)
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development|production
```

## 주의사항
- App.jsx는 현재 모놀리식 (1,338줄). 추후 컴포넌트 분리 예정
- Claude API 이어쓰기: HTML이 </html>로 안 끝나면 자동 continuation 요청
- 인라인 편집: postMessage("lumen-edit")로 iframe↔부모 통신
- 프롬프트에 업종별 시각 무드(editorial/corporate/bold/playful)가 자동 주입됨

## 향후 작업
1. App.jsx 컴포넌트 분리 (현재 모놀리식)
2. 크레딧 구매 UI (토스페이먼츠)
3. 생성 결과 DB 저장 (현재 클라이언트 메모리만)
4. 사용자 인증 (현재 없음)
5. 커스텀 도메인 퍼블리시
