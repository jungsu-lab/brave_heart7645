---
title: "FrameFit 사진 코치 앱"
description: "원하는 사진 스타일을 고르면 촬영 구도와 템플릿 미리보기를 안내하는 Flutter 기반 사진 코칭 앱 프로토타입."
date: 2026-07-03
tags:
  - Flutter
  - 사진 앱
  - UI 프로토타입
role: "제품 기획, 화면 흐름 설계, Flutter UI 구현"
status: "Study"
stack:
  - Flutter
  - Dart
  - Material 3
  - Mock Data
---

FrameFit은 사진을 찍은 뒤 보정하는 앱보다, 찍기 전 구도와 거리, 여백, 조명 방향을 안내하는 사진 코치 앱을 목표로 만든 프로토타입이다.

현재 구현은 실제 카메라나 AI 분석 제품이 아니라 UI 플로우 검증에 가깝다. 온보딩, 홈, 템플릿 라이브러리, 템플릿 상세, mock 카메라 코치, 정적 분석 요약, 미리보기, 결과 화면까지 연결했다.

템플릿 데이터는 로컬 mock으로 구성했고, 프로필·셀카·음식·여행·상품·감성 사진 같은 카테고리를 탐색할 수 있게 만들었다. 각 템플릿에는 설명, 촬영 팁, 구도 가이드, 추천 문구를 붙였다.

아직 실제 device camera, 얼굴/사물 인식, AI 분석, 이미지 편집, 고해상도 저장, 공유 기능은 구현하지 않았다. 지금 단계는 제품 아이디어와 사용자 흐름을 검증하기 위한 Flutter 앱 구조와 화면 시안이다.

저장소: [jungsu-lab/photograpthapp](https://github.com/jungsu-lab/photograpthapp)
