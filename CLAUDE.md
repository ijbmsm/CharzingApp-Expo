# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 필요한 가이드를 제공합니다.

## 프로젝트 개요

CharzingApp-Expo는 한국의 전기차 배터리 진단 및 관리 서비스를 위한 React Native 애플리케이션입니다. Expo managed workflow로 구축되었으며, 전문가가 직접 방문하여 배터리 상태를 진단하고 상세한 리포트를 제공하는 한국 전용 서비스입니다.

## 기술 스택 및 아키텍처

### 핵심 기술
- **프론트엔드**: React Native (Expo SDK 54) + TypeScript
- **상태 관리**: Redux Toolkit + Redux Persist (AsyncStorage)
- **네비게이션**: React Navigation v7 (Stack + Bottom Tabs)
- **백엔드**: Firebase (Firestore, Auth, Functions, Cloud Messaging)
- **지도**: 카카오 지도 JavaScript SDK (WebView 통합)
- **인증**: Firebase Auth + Google Sign-In + Apple Sign-In
- **알림**: Expo Notifications + Firebase Cloud Messaging

### 주요 디렉토리 구조
```
src/
├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── KakaoMapView.tsx          # 카카오 지도 WebView 컴포넌트
│   ├── AuthProvider.tsx          # 인증 상태 관리
│   ├── Header.tsx                # 공통 헤더
│   └── VehicleSearchModal.tsx    # 차량 검색 모달
├── screens/            # 화면 컴포넌트
│   ├── HomeScreen.tsx            # 홈 화면 (예약 상태 표시)
│   ├── LoginScreen.tsx           # 로그인 화면
│   ├── ReservationScreen.tsx     # 통합 예약 화면
│   └── DiagnosisReservationScreen.tsx  # 진단 예약 화면
├── services/           # 비즈니스 로직 및 API 서비스
│   ├── firebaseService.ts        # 메인 Firebase 서비스 계층
│   ├── authPersistenceService.ts # 인증 지속성 관리
│   ├── googleLoginService.ts     # Google 로그인 통합
│   ├── appleLoginService.ts      # Apple 로그인 통합
│   └── notificationService.ts    # 푸시/인앱 알림 관리
├── store/             # Redux 스토어 및 슬라이스
│   ├── index.ts                  # 스토어 설정
│   └── slices/authSlice.ts       # 인증 상태 슬라이스
├── navigation/         # 네비게이션 설정
│   └── RootNavigator.tsx         # 루트 네비게이터
├── firebase/          # Firebase 설정
│   └── config.ts                 # Firebase 서비스 프록시
└── utils/             # 유틸리티 함수
    └── devLog.ts                 # 개발용 로깅
```

## 개발 명령어

### 필수 명령어
```bash
# 의존성 설치 (프로젝트는 yarn 사용)
yarn install

# 개발 서버 시작
yarn start
# 또는 캐시 클리어와 함께
npx expo start --clear

# 플랫폼별 실행
yarn ios
yarn android  
yarn web

# 타입 체크 (커밋 전 필수)
yarn typecheck
# 또는
npx tsc --noEmit

# 린팅
yarn lint
yarn lint:fix

# 테스트
yarn test
```

### 빌드 명령어
```bash
# 프로덕션 빌드 (모든 플랫폼)
yarn build:all

# 플랫폼별 빌드
yarn build:android
yarn build:ios

# EAS 빌드
eas build --platform android --profile production
eas build --platform ios --profile production
```

## 핵심 패턴 및 컨벤션

### Firebase 통합 패턴
- **초기화**: `App.tsx`에서 React 컴포넌트 로드 전 Firebase 초기화
- **서비스 접근**: `src/firebase/config.ts`의 프록시 패턴 사용
- **인증 지속성**: React Native 환경에서 AsyncStorage를 통한 수동 관리
- **에러 처리**: Firebase 초기화 타이밍 문제 대응

### 컴포넌트 구조 규칙
- 모든 컴포넌트에서 TypeScript 사용 필수
- React Navigation v7 타이핑 패턴 준수 (`RootStackParamList`, `MainTabParamList`)
- Redux Toolkit으로 상태 관리
- 적절한 에러 바운더리와 로딩 상태 구현

### 인증 플로우 아키텍처
앱은 다중 공급자 인증 시스템을 사용합니다:
1. **Firebase Auth**: 기본 인증 시스템
2. **Google Sign-In**: Android 및 웹용
3. **Apple Sign-In**: iOS용  
4. **커스텀 지속성 계층**: 토큰 관리 및 세션 복원

### 카카오 지도 통합
- **WebView 기반**: `KakaoMapView.tsx`에서 JavaScript SDK를 WebView로 통합
- **양방향 통신**: JavaScript-React Native 메시지 패싱
- **에러 처리**: 지도 로딩 실패, 재시도 로직, 네트워크 오류 대응
- **한국 특화**: 카카오 REST API와 JavaScript API 모두 활용

## 환경 설정

### 필수 환경 변수
`app.config.js`의 `extra` 섹션에서 설정:
- `KAKAO_REST_API_KEY`: 카카오 지도 REST API용
- `KAKAO_JAVASCRIPT_KEY`: 카카오 지도 WebView용
- `CLOUD_FUNCTION_URL`: Firebase Functions 엔드포인트
- `GOOGLE_WEB_CLIENT_ID`: Google Sign-In용

### 플랫폼별 설정
- **iOS**: Info.plist 권한 (위치, 카메라, 알림, 사진 라이브러리)
- **Android**: 매니페스트 권한 및 인텐트 필터
- **딥 링킹**: `charzing.kr` 도메인용 설정

## 주요 개발 작업들

### 새 화면 추가 방법
1. `src/screens/`에 화면 컴포넌트 생성
2. `RootNavigator.tsx`의 `RootStackParamList`에 라우트 타입 추가
3. 네비게이션 스택에 화면 등록
4. 적절한 TypeScript props 타이핑 구현

### Firebase 작업 규칙
1. 모든 Firestore 작업은 `firebaseService.ts` 사용
2. Redux에서 인증 상태 처리
3. 네트워크 작업에 적절한 에러 처리 구현
4. 데이터 보호를 위한 Firebase Security Rules 활용

### 카카오 지도 작업
- `KakaoMapView.tsx`에서 WebView를 통한 지도 통합
- 지도 이벤트를 위한 JavaScript-React Native 통신 처리
- 지도 로딩 실패에 대한 적절한 에러 처리 구현

### 알림 시스템 관리
- `App.tsx`에서 적절한 라이프사이클 관리로 초기화
- 푸시 알림과 인앱 알림 모두 처리
- 사용자 권한 요청 및 에러 처리 구현

## 코드 품질 및 테스트

### 타입 체크
변경사항 커밋 전 반드시 `npx tsc --noEmit` 실행하여 TypeScript 호환성 확인

### 플랫폼 테스트
- iOS와 Android 모두에서 인증 플로우 테스트
- 적절한 API 키로 지도 기능 검증
- 실제 기기에서 푸시 알림 테스트
- 딥 링킹 기능 검증

### 빌드 프로세스
- 프로덕션 빌드용 EAS Build 설정
- 프로덕션 환경에서 환경 변수 적절히 설정
- 릴리스 전 양쪽 플랫폼에서 빌드 테스트

## 중요 참고사항

### Firebase 설정 주의사항
- Firebase는 React 컴포넌트보다 먼저 `App.tsx`에서 초기화
- 안전한 서비스 접근을 위해 `firebase/config.ts`의 프록시 패턴 사용
- React Native 제한으로 인한 수동 인증 지속성 처리

### 성능 고려사항
- 구형 기기에서 WebView 지도 통합으로 인한 성능 영향 가능
- 필수 데이터만을 위한 Redux persist 설정 최적화
- 애플리케이션 전반에 적절한 로딩 상태 구현

### 보안 고려사항
- API 키는 환경별로 분리
- 사용자별 데이터 접근 제한을 위한 Firebase Security Rules
- AsyncStorage를 통한 인증 토큰 안전 저장

### 한국 특화 기능
- **카카오 지도**: 한국 지역에 최적화된 지도 서비스
- **주소 시스템**: 한국 주소 체계 (도로명주소, 지번주소) 지원
- **지오코딩**: 카카오 REST API를 통한 좌표-주소 변환
- **차량 데이터**: 한국 전기차 모델 (현대, 기아, 테슬라 등) 지원

### 예약 시스템 아키텍처
- **3단계 플로우**: 위치 선택 → 날짜/시간 선택 → 예약 확인
- **실시간 상태 추적**: `pending` → `confirmed` → `in_progress` → `completed`
- **Firebase Functions**: 백엔드 로직 및 알림 처리
- **관리자 시스템**: Firebase Console을 통한 예약 관리

### 차량 관리 시스템
- **사용자 차량 등록**: 제조사, 모델, 연식, 배터리 용량 등
- **차량 검색**: 한국 전기차 데이터베이스 통합
- **활성 차량**: 사용자별 메인 차량 설정
- **진단 연동**: 차량 정보와 진단 예약 연결

## 디버깅 및 로깅

### 개발용 로깅
- `devLog.ts`: 개발 환경에서만 활성화되는 로깅 시스템
- Firebase, 인증, 지도 관련 상세 로그
- 프로덕션에서는 자동으로 비활성화

### 일반적인 문제 해결
1. **카카오 지도 로딩 실패**: API 키 확인, 네트워크 연결 확인
2. **Firebase 인증 오류**: Token 만료, AsyncStorage 초기화 필요
3. **Apple 로그인 세션 만료**: 토큰 갱신 또는 재로그인 필요
4. **권한 문제**: iOS/Android 권한 설정 확인

이 가이드를 통해 CharzingApp-Expo 프로젝트의 구조와 패턴을 이해하고, 효율적으로 개발할 수 있습니다.