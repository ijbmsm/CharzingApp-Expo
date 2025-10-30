# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 필요한 가이드를 제공합니다.

## CharzingApp - 한국 전기차 배터리 진단 앱

### 🎯 앱 개요
한국 전기차 소유자를 위한 배터리 진단 예약 및 정보 제공 앱입니다.

**주요 기능:**
- 🏠 **HomeScreen**: 예약 현황, 내 차량 정보, 빠른 예약 버튼
- 🔋 **BatteryInfoScreen**: 전기차 배터리 정보 조회 (제조사, 용량, 성능 등)
- 📅 **ReservationScreen**: 상세 진단 예약 플로우 (위치 → 날짜/시간 → 차량 선택)
- 👤 **MyPageScreen**: 내 정보, 예약 내역, 설정

### 🔹 실제 Firebase 데이터 구조

**브랜드별로 다른 데이터 구조를 지원:**

```js
// 🇰🇷 현대/기아 구조: vehicles/{BRANDID}/models/{modelId}
{
  name: "아이오닉 6",
  englishName: "IONIQ-6",
  defaultBattery: {
    capacity: 77.4,      // number
    supplier: "SK온", 
    type: "NCM",
    voltage: 800,
    range: 519
  },
  trims: [
    {
      trimId: "ioniq-6-long-range-awd",
      name: "Long Range AWD",
      driveType: "AWD",
      yearRange: { start: 2022, end: 2024 },
      variants: [
        {
          years: ["2022", "2023", "2024"],
          batteryCapacity: 77.4,
          range: 481,
          supplier: "SK온",
          specifications: {
            motor: "듀얼 모터",
            power: "239kW",
            torque: "605Nm",
            acceleration: "5.1초 (0-100km/h)",
            chargingSpeed: "11kW (AC), 233kW (DC)",
            efficiency: "16.1kWh/100km"
          }
        }
      ]
    }
  ]
}

// 🇩🇪 아우디 구조: 트림이 variants 안에 있음
{
  name: "e-트론",
  englishName: "E-TRON", 
  defaultBattery: {
    capacity: "71kWh",     // string
    cellType: "NCM",
    manufacturer: "LG Energy Solution",
    warranty: "8년/16만km"
  },
  trims: [
    {
      variants: [
        {
          trimId: "50",
          trimName: "50 quattro",
          batteryCapacity: 71,
          range: 400,
          acceleration: 5.5,
          years: ["2020", "2023"],
          driveType: "QUATTRO",
          powerMax: "350HP",
          topSpeed: 200
        }
      ]
    }
  ]
}
```

## 기술 스택 및 아키텍처

### 핵심 기술
- **프론트엔드**: React Native (Expo SDK 54) + TypeScript
- **상태 관리**: Redux Toolkit + Redux Persist (AsyncStorage)
- **네비게이션**: React Navigation v7 (Stack + Bottom Tabs)
- **백엔드**: Firebase (Firestore, Auth, Functions, Cloud Messaging)
- **지도**: 카카오 지도 JavaScript SDK (WebView 통합)
- **인증**: Firebase Auth + Google Sign-In + Apple Sign-In
- **알림**: Expo Notifications + Firebase Cloud Messaging

### 🏗️ 주요 컴포넌트

#### **화면 컴포넌트 (src/screens/)**
- `HomeScreen.tsx` - 메인 홈 화면 (예약 현황, 내 차량, 빠른 예약)
- `BatteryInfoScreen.tsx` - 배터리 정보 조회 (실제 Firebase 데이터 사용)
- `ReservationScreen.tsx` - 상세 예약 플로우 (위치 → 날짜/시간 → 차량)
- `MyPageScreen.tsx` - 마이페이지 (내 정보, 예약 내역)
- `LoginScreen.tsx` - 로그인 (Google, Apple 지원)

#### **핵심 컴포넌트 (src/components/)**
- `VehicleAccordionSelector.tsx` - 🎯 **신규 차량 선택 모달** (브랜드 → 모델 → 트림 → 연식)
- `KakaoMapView.tsx` - 카카오 지도 WebView 통합
- `Header.tsx` - 공통 헤더 컴포넌트
- `LoadingSpinner.tsx` - 로딩 상태 표시

#### **서비스 레이어 (src/services/)**
- `firebaseService.ts` - **메인 Firebase 통합 서비스**
  - `getModelData()` - 모델별 배터리/성능 데이터 조회
  - `getVehicleTrims()` - 브랜드별 트림 목록 조회
  - 브랜드별 다른 데이터 구조 지원 (현대/아우디 등)

## Firebase 데이터베이스 아키텍처

### Firestore Database 구조
```
vehicles/ (collection)
├── {brandId}/ (document: HYUNDAI, KIA, TESLA, MERCEDES-BENZ, BMW, AUDI, PORSCHE, MINI)
│   ├── name: "현대" 
│   ├── englishName: "HYUNDAI"
│   ├── logoUrl: "https://..."
│   └── models/ (subcollection)
│       ├── {modelId}/ (document: ioniq-5, model-s, i4, etc.)
│       │   ├── name: "아이오닉 5"
│       │   ├── englishName: "IONIQ-5"
│       │   ├── imageUrl: "https://firebasestorage.googleapis.com/.../vehicle-images%2FHYUNDAI%2FIONIQ-5%2F2024%2F..."
│       │   ├── defaultBattery: { capacity, supplier, type, voltage, range }
│       │   ├── trims: [...]
│       │   ├── createdAt: {...}
│       │   └── updatedAt: {...}
│       └── ...
└── ...
```

### Firebase Storage 구조 (차량 이미지)
```
gs://charzing-d1600.firebasestorage.app/vehicle-images/
├── AUDI/
├── BMW/
├── HYUNDAI/
├── KIA/
├── MERCEDES-BENZ/
├── MINI/
├── PORSCHE/
└── TESLA/
```

## 중요 개발 규칙

### 🚫 절대 금지 사항
- **any 타입 사용 금지**: 모든 타입은 명시적으로 정의
- **더미 데이터 사용 금지**: 모든 데이터는 실제 Firebase에서 조회
- **하드코딩 금지**: 설정값은 환경변수나 Firebase에서 관리
- **폴백 데이터 금지**: 데이터가 없으면 명확한 에러 표시

### ✅ 권장 사항
- **TypeScript 엄격 모드**: `npx tsc --noEmit`로 타입 체크 필수
- **실제 Firebase 데이터 사용**: 모든 배터리/차량 정보는 Firestore에서 조회
- **브랜드별 구조 지원**: 현대/기아와 아우디의 다른 데이터 구조 모두 지원
- **에러 처리**: 네트워크 오류, 데이터 없음 등 명확한 에러 메시지

### 📋 일반적인 개발 작업들

#### 새 화면 추가 방법
1. `src/screens/`에 화면 컴포넌트 생성
2. `RootNavigator.tsx`의 `RootStackParamList`에 라우트 타입 추가
3. 네비게이션 스택에 화면 등록
4. 적절한 TypeScript props 타이핑 구현

#### Firebase 작업 규칙
1. 모든 Firestore 작업은 `firebaseService.ts` 사용
2. Redux에서 인증 상태 처리
3. 네트워크 작업에 적절한 에러 처리 구현
4. 데이터 보호를 위한 Firebase Security Rules 활용

### 🧪 테스트 및 빌드

#### 타입 체크
변경사항 커밋 전 반드시 `npx tsc --noEmit` 실행하여 TypeScript 호환성 확인

#### EAS 빌드
```bash
# Android
eas build --platform android --profile production

# iOS  
eas build --platform ios --profile production
```

## 한국 특화 기능

### 카카오 지도 통합
- `KakaoMapView.tsx`에서 WebView를 통한 지도 통합
- 지도 이벤트를 위한 JavaScript-React Native 통신 처리
- 지도 로딩 실패에 대한 적절한 에러 처리 구현

### 차량 데이터
- **한국 전기차 모델**: 현대, 기아, 테슬라 등 한국 시장 모델 지원
- **배터리 정보**: SK온, LG에너지솔루션 등 한국 배터리 제조사 정보

### 예약 시스템
- **3단계 플로우**: 위치 선택 → 날짜/시간 선택 → 예약 확인
- **실시간 상태 추적**: `pending` → `confirmed` → `in_progress` → `completed`
- **Firebase 직접 접근**: 클라이언트에서 직접 Firestore 접근
- **관리자 시스템**: Firebase Console을 통한 예약 관리

이 가이드를 통해 CharzingApp-Expo 프로젝트의 구조와 패턴을 이해하고, 효율적으로 개발할 수 있습니다.