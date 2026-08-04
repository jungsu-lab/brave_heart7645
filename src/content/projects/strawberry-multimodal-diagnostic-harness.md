---
title: "LLM에게 농가 CSV와 이미지를 바로 주지 않은 이유"
description: "환경·제어·근권·생육·이미지를 Evidence Pack으로 만들고 구조화 검증과 fail-closed로 진단을 통제한 과정."
date: 2026-07-22
tags:
  - 딸기
  - 멀티모달
  - LLM
  - 신뢰성
role: "Evidence 설계, 모델 비교, 출력 검증, open-set 감사"
status: "Complete"
stack:
  - Python
  - Gemini
  - Random Forest
  - JSON Schema
---

문제 2에서는 한 농가의 환경·제어·근권·생육 CSV와 이미지를 받아 진단 보고서를 만들어야 했다. 단순히 병 이름 하나를 맞히는 문제가 아니라, 상태 진단과 원인, 관리 제안까지 정해진 형식으로 내야 했다.

모든 파일을 LLM에 넣고 보고서를 쓰게 하는 방식은 간단하지만, 농가와 구역이 섞이거나 원자료에 없는
숫자를 만들거나 이미지의 구역을 잘못 단정할 수 있었다. API 오류가 규칙 답안으로 조용히 대체되면
실제 모델 성능도 알 수 없다.

그래서 LLM 하나에 모든 판단을 맡기지 않았다. 입력을 정리하는 단계, 판단하는 단계, 결과를 검사하는 단계, 보고서를 만드는 단계를 따로 두고 각 단계가 무엇을 책임지는지 나눴다.

## Evidence Pack에서 보고서까지

<ol class="process-contract">
  <li>원자료 품질검사</li>
  <li>Evidence Pack</li>
  <li>구조화 모델 판단</li>
  <li>로컬 계약 검증</li>
  <li>결정적 보고서</li>
</ol>

환경·제어·근권·생육 자료에서 주간·야간 온도, VPD, 고습 노출, 장치 작동률, 배지온·수분·EC,
생육 변화량과 구역별 이상도를 계산했다. 각 근거에는 `E_Z4_TEMP`, `R_Z4_ROOT`,
`A_Z4_CONTROL`, `G_Z4_DELTA` 같은 fact ID를 부여했다.

모델은 최종 보고서를 바로 쓰지 않고 주진단, 진단별 점수, 우선·비교구역, 근거 fact ID, 대체진단을
JSON Schema로 반환했다. 로컬 validator가 다음을 확인한 뒤에만 보고서를 만들었다.

- 허용된 진단명과 점수 합계
- 실제 존재하는 구역과 fact ID
- 환경·근권·제어·생육 근거의 포함
- 근거 밖 숫자 생성 여부
- 이미지의 구역 귀속 오류
- 세 개 보고서 섹션과 분량 계약

최종 숫자 문장은 모델 자유서술을 그대로 쓰지 않고 renderer가 원자료에서 다시 삽입했다.

## strict-blind 입력 격리

성능 평가용 `blind` 정책에서는 현재 농가의 정답, 다른 농가 ID와 라벨, 진단별 예시, 35농가를 본 뒤
만든 normal guard와 임계값을 모델 입력에서 제외했다. gold label은 응답이 끝난 뒤 평가에만 사용했다.

정답이 있는 8사례의 관측 결과는 Top-1 `7/8`, strict Top-3 `8/8`이었다. 그러나 Top-1 Wilson
95% 구간은 `52.9~97.8%`였고 등장한 gold class도 10개 중 7개뿐이었다. 따라서 이를 독립 일반화
정확도라고 부르지 않았다.

공개 gold가 없는 문제 농가 4곳은 유효 보고서 `3/4`였다. 이것은 운영 성공률이지 정확도가 아니다.
한 농가는 repair 뒤에도 점수 합계가 100이 아니어서 fail-closed됐다.

## 제일 아쉬웠던 오답: 원인을 한 단계 낮게 봤다

오답 사례에서 모델은 저온과 난방 문제를 읽었다. 하지만 인과 사슬의 상위 관리 원인 대신 중간 생리
결과를 Top-1로 골랐다.

```text
난방 실패 → 공중·근권 저온 → 뿌리 흡수 저하 → 생육 지연
  정답                                      모델 Top-1
```

오답을 본 뒤 prompt에 해당 사례를 외우게 만드는 것은 쉽다. 하지만 같은 사례의 개선은 일반화 증거가
아니다. 상위원인·중간기전·증상을 구조화하되 새로운 잠금 농가에서 다시 검증하는 과제로 남겼다.

## 가벼운 수치 모델과 피처 선택

LLM과 별개로 농가당 한 행의 수치 요약을 사용해 Decision Tree, Random Forest, robust centroid를
비교했다. 농가 LOO와 시작 월 holdout을 분리했다.

<figure>
  <img src="/images/projects/strawberry/temporal-ablation.png" alt="Decision Tree와 Random Forest에서 3시간대 피처 추가 전후 성능 비교" loading="lazy" />
  <figcaption>Random Forest로 바꾸는 효과는 컸지만, 배지온 3시간대 8피처는 두 검증에서 모두 악화됐다.</figcaption>
</figure>

| 모델 | 농가 LOO | 월 holdout |
| --- | ---: | ---: |
| Decision Tree core6 | `27/35` | `19/35` |
| Random Forest core6 | `33/35` | `28/35` |
| Decision Tree + 시간대 8피처 | `26/35` | `18/35` |
| Random Forest + 시간대 8피처 | `28/35` | `23/35` |

농가 평균에 숨은 국소 이상을 표현하기 위해 최대 습도, 고습 노출, 최대 EC, 최소 배지온, 생육 감소
구역 수를 targeted feature로 추가했다.

<figure>
  <img src="/images/projects/strawberry/model-selection.png" alt="Random Forest targeted feature, centroid, nested SHAP 모델 비교" loading="lazy" />
  <figcaption>Targeted feature와 robust centroid는 개선됐지만 nested SHAP top-6는 오히려 악화됐다.</figcaption>
</figure>

| 모델 | 농가 LOO | 월 holdout | 월 Macro-F1 |
| --- | ---: | ---: | ---: |
| RF core6 | `33/35` | `28/35` | `0.796` |
| RF + targeted6 | `34/35` | `30/35` | `0.843` |
| NearestCentroid core6 | `33/35` | `31/35` | `0.852` |
| Nested SHAP top6 | `31/35` | `26/35` | `0.735` |

SHAP top-6는 평균 EC와 최대 EC, 평균 배지온과 최소 배지온처럼 상관된 피처를 여러 슬롯에 선택했다.
중요도 순위가 좋은 독립 피처 집합을 보장하지 않는 사례였다.

## 높은 closed-set 점수 뒤의 open-set 문제

RF12와 Centroid6은 폐쇄형 개발 검사에서 각각 `32/35`, `33/35`였다. 그러나 같은 35농가가 피처와
라우터 설계에 사용됐으므로 생산 성능으로 승격할 수 없었다.

한 질병을 통째로 학습에서 빼는 leave-one-disease-out에서 기존 gate는 미학습 오답 `15/35`를 자동
통과시켰다. 보수적인 거리 gate도 `7/35`를 통과시켰다. 학습에 없는 질병이 feature space에서 반드시
멀리 떨어지는 것은 아니었다.

Freeze-2의 nested open-set 감사에서도 오답 자동승인을 0으로 만들면 유효한 수치 진단 coverage가
0이 됐다. 결국 자동승인 자격을 `eligible_classes=[]`로 봉인하고 모든 사례를 review로 보냈다.

이건 모델을 포기한 게 아니라, 자동확정할 근거가 없는 상태를 코드에서 숨기지 않은 선택이었다. 이 작업을 하면서 모델 이름보다 더 중요했던 건 무엇을 입력으로 줬는지, 그 답을 어디까지 검증했는지, 그리고 언제 멈추게 했는지였다.
