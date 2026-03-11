# best_production_list 분석 반영 메모

## 적용 내용
- 업종+운영목적 2축 생성 전략 반영
- 사례 URL 기반 벤치마크 카드 데이터셋 생성
- 모바일 재배치 규칙 정의
- 업그레이드용 페이지 블루프린트(JSON) 생성

## 생성 산출물
- `data/benchmark_cards.json`
- `data/mobile_rules.json`
- `data/page_blueprint.json`

## 다음 자동 구현
1. 랜딩 첫 화면에 업종/운영목적 2축 선택 UI 삽입
2. 선택값에 따라 benchmark card 필터링 렌더
3. localGenerator가 business_mode + industry_vertical 기반 섹션 조합 생성
4. advanced modules 토글 적용(FAQ/Q&A/archive/support)
