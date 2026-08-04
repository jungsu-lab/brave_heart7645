---
title: "같은 온실 데이터에 서로 다른 모델을 사용한 이유"
description: "함수율은 앙상블, EC는 level과 shape, 배지온은 열기억으로 나눠 최종 모델을 선택한 과정."
date: 2026-07-21
tags:
  - 딸기
  - 스마트팜
  - 모델 선택
  - 시계열 예측
role: "타깃별 모델링, 앙상블, OOF 승격 감사"
status: "Complete"
stack:
  - LightGBM
  - GRU
  - Ridge
  - Huber
---

처음에는 세 타깃에 같은 모델을 적용해도 될 거라고 생각했다. 그런데 EDA를 해보니 함수율·EC·배지온은 같은 센서 입력을 쓰면서도 움직이는 방식이 달랐다. 그래서 모델 하나를 고르는 대신, 각 타깃에서 실제로 버텨 주는 방법을 따로 찾았다.

## 함수율: 전역 사전학습보다 온실별 학습

기존 GRU는 모든 온실을 함께 사전학습하고 각 온실에 짧게 fine-tuning했다. 하지만 GRU 입력에 온실
식별자가 없었다. 서로 다른 절대 level을 가진 온실을 같은 동역학처럼 학습한 셈이었다.

온실별로 GRU를 처음부터 학습하자 단독 성능과 LightGBM과의 상보성이 좋아졌다. 확정 v7 기준선은
다음 비율로 고정했다.

```text
v7 moisture
  = 55.00% LightGBM
  + 33.75% 기존 GRU
  + 11.25% Physics-A GRU
```

- OOF pooled RMSE: `0.612289`
- grouped-8 fold-equal RMSE: `0.478448`

보조 모델의 절대 level은 버리고 centered intraday shape만 재사용했을 때
`0.605828 / 0.473999`까지 좋아진 OOF 후보도 있었다. 그러나 동일한 테스트 branch가 없어 확정 v7
결과를 덮어쓰지 않았다. 좋은 OOF와 제출 가능한 재현 경로는 별개의 조건이었다.

1분 원본 전체를 다시 계산한 E1 역시 기존 5분 LGBM보다 나빴다. 실제 60분 rolling으로 교체한 뒤
최근 5분 smoothing을 추가한 S10은 LGBM-only에서 약 `0.38%` 개선됐지만, 일부 농가와 DAT가
회귀해 full pipeline으로 즉시 승격하지 않았다.

## EC: 복잡한 모델보다 온실별 기준값이 먼저였다

EC는 온실 간 level이 전체 분산의 약 `98.4%`를 설명했다. 일내 변화는 작고 프로브 노이즈 비중은
상대적으로 컸다. 이런 타깃에서는 복잡한 시퀀스 모델이 언제나 유리하지 않았다.

초기 v6는 GRU와 LightGBM 조합으로 pooled/fold-equal RMSE `0.061201 / 0.054260`을 기록했다.
level/state 모델은 `0.059607 / 0.053327`, strict nested v7_ec는 fold-equal `0.053199`까지
개선됐다.

최종 정리본에서는 GRU를 제거하고 경계 복원, daily level, median-zero shape를 분리했다.

<figure>
  <img src="/images/projects/strawberry/ec-final-v2.png" alt="GRU-free EC v2의 curve, shape, daily level OOF 진단" loading="lazy" />
  <figcaption>GRU-free EC v2. 작은 일내 신호를 억지로 복잡한 모델에 맡기지 않고 level과 shape를 분리했다.</figcaption>
</figure>

| 지표 | Strict grouped OOF |
| --- | ---: |
| curve RMSE | `0.056804` |
| fold-equal RMSE | `0.049084` |
| curve R² | `0.989239` |
| centered shape R² | `0.459785` |
| within-block daily-level R² | `0.210421` |

과거 수치와 final v2는 달력 재구성과 평가 계약이 다르므로 절대값만으로 직접 순위를 매기지 않았다.
동일 계약의 기준선과 비교하고, 최종 test 변환까지 재현되는지를 따로 확인했다.

## 배지온: 과거값보다 열이 남는 시간을 봤다

배지온은 온실 정체성보다 열동역학이 중요했다. 현재 내부·외부 온도만 보는 대신 30·90·180·360분
prior-only EWMA와 누적 일사·VPD·냉난방 노출을 compact Ridge 피처로 만들었다.

후속 freezev5는 strict 재구성 베이스의 centered shape와 일별 Huber level을 결합했다.

```text
shape25  = 0.75 × centered(base) + 0.25 × centered(phase Ridge)
freezev5 = 0.50 × daily_mean(base) + 0.50 × Huber level + shape25
```

<figure>
  <img src="/images/projects/strawberry/temperature-freezev5.png" alt="freezev5와 shape25의 weather fold 및 날짜별 RMSE 비교" loading="lazy" />
  <figcaption>평균 개선뿐 아니라 회귀한 fold와 DAT도 함께 표시한 승격 근거.</figcaption>
</figure>

| 지표 | shape25 | freezev5 |
| --- | ---: | ---: |
| pooled RMSE | `0.575571` | `0.517893` |
| fold-equal RMSE | `0.546805` | `0.470387` |
| daily-level RMSE | `0.404908` | `0.317618` |
| centered-shape RMSE | `0.409062` | `0.409062` |
| fold 승리 | — | `7/8` |

Huber level은 하루 전체 X 요약을 사용한다. 하루 입력이 모두 주어지는 대회 batch 추론에는 사용할 수
있지만 실시간 서비스에서는 미래 covariate 문제가 생긴다. fold `110+116`과 DAT130도 악화됐다.
그래서 모든 상황에서 더 좋은 모델이 아니라 **대회 batch 계약에서 검증된 모델**로 범위를 제한했다.

## 최종적으로 사용한 승격 기준

<ol class="process-contract">
  <li>정보 경계 고정</li>
  <li>Strict OOF 생성</li>
  <li>Fold·실패일 확인</li>
  <li>Test parity 확인</li>
  <li>채택 또는 기각</li>
</ol>

평균 RMSE가 낮아도 특정 fold 하나에 의존하거나, 테스트 생성 경로가 없거나, 같은 OOF를 반복해서 본
selection bias가 크면 승격하지 않았다. 기각 실험도 삭제하지 않고 다음 가설의 범위를 좁히는 근거로
남겼다.

결국 이 작업에서는 모델 이름보다 데이터의 구조가 더 중요했다. 함수율은 기준 level을 알려 주는 입력이 부족했고, EC는 온실별 기준값이 압도적이었으며, 배지온은 열이 남는 시간이 핵심이었다. 같은 스마트팜 데이터라도 문제를 같은 방식으로 풀 수 없었다.
