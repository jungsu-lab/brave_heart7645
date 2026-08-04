---
title: "스마트팜 시계열 대회에서 모델보다 먼저 확인한 것들"
description: "1분 입력과 5분 타깃을 정렬하고, DAT 경계와 grouped weather 검증을 고정한 뒤 함수율 실패를 분석한 과정."
date: 2026-07-20
tags:
  - 딸기
  - 스마트팜
  - 시계열
  - 데이터 검증
role: "데이터 감사, EDA, 검증 설계, 함수율 오류 분석"
status: "Complete"
stack:
  - Python
  - Pandas
  - LightGBM
  - Grouped CV
---

모델을 돌리기 전에 먼저 확인한 건, 모델이 같은 시나리오의 앞뒤를 몰래 보고 있지 않은가였다. 입력은 1분 간격인데 토양수분·EC·배지온 타깃은 5분 간격이라, 정렬과 경계를 잘못 잡으면 점수는 좋아 보여도 실제 검증은 무의미해질 수 있었다. 정리 뒤 기준 데이터는 학습 타깃 7,488행, 테스트 타깃 시점 3,456행이 됐다.

## 같은 데이터 안의 서로 다른 세 문제

처음에는 세 타깃을 하나의 일반적인 시계열 회귀 문제로 볼 수 있었다. 원시 신호를 온실별로 그려 보자
구조가 전혀 달랐다.

<figure>
  <img src="/images/projects/strawberry/raw-rootzone-targets.png" alt="네 개 온실의 토양수분, 토양 EC, 배지온 원시 시계열" loading="lazy" />
  <figcaption>예측·보간·평활을 섞지 않은 원시 타깃. 같은 입력을 쓰더라도 변동 구조는 서로 달랐다.</figcaption>
</figure>

- 토양수분은 계단형 level 변화와 하루 안의 완만한 shape가 함께 나타났다.
- EC는 온실별 절대 level 차이가 대부분의 분산을 차지했다.
- 배지온은 외기·내부온·일사에 대한 지연 반응, 즉 열관성이 중요했다.
- 일부 구간에는 물리 변화로 보기 어려운 센서 급등락이 있었다.

이 관찰 이후 세 타깃을 동일 모델로 밀어붙이지 않고 각각 다른 검증 질문을 세웠다.

## DAT 번호를 날짜처럼 이어 붙이면 안 됐다

가장 위험한 함정은 `DAT` 번호를 연속된 달력 날짜로 해석하는 것이었다. 실제로는 독립 시나리오에
가까웠고, 인접 DAT 사이에도 자정에 외기온이 비현실적으로 점프했다. DAT110과 DAT111도 전날과
다음 날의 물리 상태처럼 이어 붙일 수 없었다.

전처리 계약을 다음처럼 고정했다.

1. rolling, EWMA, 누적량과 sequence는 `온실 × DAT` 경계에서 초기화한다.
2. `previous_day_end`나 24시간 lag처럼 DAT 경계를 넘는 피처를 쓰지 않는다.
3. 1분 입력에서 피처를 만든 뒤 정확한 5분 타깃 시점에 조인한다.
4. 검증일 타깃으로 level, 변화점, 이상 구간을 다시 정하지 않는다.
5. `fcu_pump`는 관수가 아니라 팬코일 난방 펌프로 해석한다.

후속 1분 재구축에서는 학습 `26 × 1,440 = 37,440`행, 테스트 `12 × 1,440 = 17,280`행의
연속성·중복·minute gap을 검사했다. 모든 시계열 통계가 DAT 경계를 넘지 않는지도 테스트로 고정했다.

## 행 단위 무작위 분할 대신 시나리오를 통째로 비웠다

같은 날의 인접 행은 환경과 타깃이 거의 같다. 행을 무작위로 나누면 모델이 사실상 같은 시나리오를
학습과 검증에서 동시에 보게 된다. 그래서 날씨 family 하나를 통째로 제외하는 grouped LOWO 8-fold를
사용했다.

평가도 pooled RMSE 하나로 끝내지 않았다.

- fold-equal RMSE와 fold 승패
- 가장 크게 악화된 fold
- DAT별 RMSE와 bias
- daily level과 centered intraday shape
- 대표 실패일의 실제 시계열

앙상블 가중치와 피처 선택은 가능한 한 held-out fold 밖에서 결정했다. 같은 OOF에서 수십 개 후보를
비교한 뒤 최저값을 다시 검증 점수라고 부르는 selection bias를 줄이기 위해서다.

## 평균 점수가 가린 함수율 실패

초기 모델은 전체 일중 곡선을 따라가면서도 일부 날의 절대 level을 크게 놓쳤다. GH1 DAT120은 모델
bias가 약 `-1.96`, RMSE가 약 `2.02`였다. GH2 DAT128 후반에는 센서 이상으로 보이는 큰 급락이
반복됐다.

<figure>
  <img src="/images/projects/strawberry/moisture-key-days.png" alt="함수율 모델의 대표 검증 날짜 실제값과 예측 비교" loading="lazy" />
  <figcaption>DAT120의 level 실패와 DAT128의 센서 이상. 주황 음영은 FCU 동작이며 관수가 아니다.</figcaption>
</figure>

함수율을 `구간별 level + 구간 내부 shape + 짧은 이상 변동`으로 나눠 진단했다. 변화점 43개로
구조 상태를 나누고 구간 내부에는 robust local-linear smoother를 적용했다.

<figure>
  <img src="/images/projects/strawberry/moisture-decomposition.png" alt="함수율의 구조 level, 구간 내부 동역학, 센서 이상 분해" loading="lazy" />
  <figcaption>계단형 structural level, smooth dynamics, transient를 분리한 진단. 타깃으로 만든 분해는 모델 입력에 사용하지 않았다.</figcaption>
</figure>

이 분해는 실패 원인을 이해하는 데 유용했지만 그대로 테스트 feature로 쓸 수는 없었다. 타깃으로 계산한
변화점과 중심형 smoother는 테스트에서 알 수 없기 때문이다.

## 좋은 진단이 좋은 예측 피처가 되지는 않았다

Frozen v3 기준선 `0.599867`에 대해 X-only residual 보정을 strict OOF로 비교했다.

| 시도 | 최선 RMSE | 판단 |
| --- | ---: | --- |
| dynamics-only Ridge | `0.601888` | 악화 |
| raw residual 보정 | `0.611427` | 악화 |
| state-only 보정 | `0.623649` | 악화 |
| 전체 cache 300개 후보 | `0.607722` | 악화 |
| cleaned target Ridge | `0.599751` | 개선폭이 너무 작아 미승격 |

강우와 분광 daily anchor 가설도 여러 fold와 permutation 검정을 통과하지 못했다. 한 날의 강한 상관을
일반적인 규칙으로 바꾸면 다른 날이 악화됐다.

결론은 모델이 단순해서 생긴 문제가 아니었다. 실제 관수량, 배액량, 전날 마지막 함수율, 테스트 시점의 근권 EC·온도처럼 절대 level을 알려 줄 입력이 없었다. 관측되지 않은 상태를 더 복잡한 보정으로 되살리려는 시도에는 한계가 분명했다.

다음 글에서는 이 진단을 바탕으로 함수율·EC·배지온에 서로 다른 모델을 선택한 과정을 정리한다.
