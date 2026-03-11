# Gamma 분석 반영 메모

## 요약
제공된 Gamma 리포트를 바탕으로 루멘 웹빌더 로컬 템플릿 엔진에 적용할 설계 청사진을 정리했습니다.

## 반영 파일
- `src/constants/gammaBlueprints.js`
  - 입력 3입구(Generate/Paste/Import)
  - Archetype 5종
  - Smart Layout 12종
  - 카드 스타일 제어 축
  - SEO 공개 상태 모델
  - MVP 체크리스트

## 다음 자동화 구현 순서
1. 첫 화면을 3입구 기반으로 개편
2. 생성기 내부 모델을 Site > Page > Card > Block으로 분리
3. localGenerator를 Smart Layout preset 기반 렌더러로 분해
4. 페이지별 slug/meta/noindex 관리 추가
5. 카드 단위 분석 이벤트(체류/CTA 클릭) 추가
