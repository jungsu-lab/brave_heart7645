---
title: "딸기 대회 데이터 1차 정제"
description: "딸기 생육 대회 데이터를 BerryNext v001 기준으로 정리해, 모델링 프레임과 상태 기반 전이 검증용 데이터셋으로 나눈 작업"
date: 2026-07-03
tags:
  - 딸기
  - 데이터 전처리
  - 대회
role: "데이터 정제, 상태 프레임 구성, QA 문서 정리"
status: "Complete"
stack:
  - Python
  - CSV
  - YAML
  - BerryNext v001
---

딸기 생육 대회 데이터를 바로 모델이나 시뮬레이터에 넣기보다, 먼저 `데이터1차정제본.zip` 형태로 정리했다.

압축 파일 안에는 일별 모델링 기준이 되는 `modeling_frame_daily.csv`, 상태 기반 검증에 쓰는 `state_snapshot_matrix_internal_only_simulator_ready_v001.csv`, 관측 전이 쌍을 모은 `observed_state_transition_internal_only_v001.csv`를 나누어 넣었다. 환경 평균값, 생육 상태값, 타깃 availability flag, forward-fill 편의 컬럼을 분리해 어떤 값이 입력이고 어떤 값이 평가용 메타데이터인지 구분하려고 했다.

결과적으로 이 작업은 액션 기반 시뮬레이터 완성이 아니라, 상태 기반 추천 dry-run과 수동 전이 검증을 위한 1차 정제본이다. 실제 제어 행동의 효과를 추정하려면 별도의 action proxy 검증이 더 필요하다는 한계도 함께 남겼다.
