# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 필요한 가이드입니다.

## 📱 CharzingApp - 한국 전기차 배터리 진단 전문 서비스

### 프로젝트 개요
- **버전**: 1.1.1
- **플랫폼**: iOS, Android (React Native + Expo)
- **주요 기능**: 전기차 배터리 진단 예약 및 실시간 진단 리포트 작성

---

## 🔧 개발 환경

### 필수 도구
```bash
npm start          # Expo 개발 서버 시작
npm run android    # Android 에뮬레이터 실행
npm run ios        # iOS 시뮬레이터 실행
npx tsc --noEmit   # TypeScript 타입 체크
```

### 기술 스택
- **프레임워크**: React Native 0.76.5, Expo SDK 52
- **언어**: TypeScript
- **상태관리**: Redux Toolkit
- **내비게이션**: React Navigation 7
- **백엔드**: Firebase (Firestore, Storage, Auth)
- **지도**: 카카오맵 (WebView)
- **폰트**: LINE Seed Sans KR

---

## 🗂️ 핵심 디렉토리 구조

```
src/
├── components/              # 재사용 컴포넌트
│   ├── VehicleAccordionSelector.tsx  # 차량 선택 (아코디언 방식)
│   └── BatteryCellGridModal.tsx      # 배터리 셀 그리드
├── screens/                # 화면 컴포넌트
│   ├── HomeScreen.tsx
│   ├── ReservationScreen.tsx
│   └── VehicleInspectionScreen.tsx
├── services/               # 비즈니스 로직
│   ├── firebaseService.ts  # Firebase 통합 (3,500+ 줄)
│   └── auth/              # 인증 서비스
└── navigation/
    └── RootNavigator.tsx   # Stack + Bottom Tabs
```

---

## 🔥 Firebase 데이터 구조

### Firestore Collections
```
users/                  # 사용자 프로필
diagnosisReservations/ # 예약 정보
vehicleDiagnosisReports/ # 진단 리포트

vehicles/              # 차량 데이터베이스 (9개 브랜드, 47개 모델)
└── {brandId}/
    └── models/
        └── {modelId}/
            ├── trims           # 트림 정보 (배열)
            └── yearTemplates/  # 연도별 템플릿 (서브컬렉션)
```

### 차량 데이터 조회 우선순위

**YearTemplate 있을 때**:
1. `yearTemplates/{templateId}/variants[0].supplier` - 배터리 제조사
2. `yearTemplates/{templateId}/variants[0].range` - 주행거리
3. `yearTemplates/{templateId}/images.main` - 이미지 (우선)

**YearTemplate 없을 때**:
1. `models/{modelId}/trims.variants` 중 연도 매칭
2. 없으면 `trims.variants[0]` (첫 번째)
3. 최종 `defaultBattery` (모델 기본값)

---

## 🚗 차량 선택 시스템

### VehicleAccordionSelector
**위치**: `/src/components/VehicleAccordionSelector.tsx`

**동작 방식**:
1. 브랜드 선택 → Firebase `vehicles/` 컬렉션 조회
2. 모델 확장 → `vehicles/{brandId}/models/` 서브컬렉션 조회
3. 트림 확장 → 모델 문서의 `trims` 배열 표시
4. 연식 선택 → Alert로 2019-2025년 선택

**반환 타입**:
```typescript
interface CompletedVehicle {
  make: string;        // "현대"
  model: string;       // "아이오닉 5"
  trim: string;        // "Exclusive"
  year: number;        // 2024
  brandId: string;     // "hyundai"
  modelId: string;     // "IONIQ-5"
  trimId: string;      // "exclusive"
  imageUrl?: string;
}
```

---

## 🔄 최근 완료 작업 (2025-12-08)

### ✅ YearTemplate 데이터 우선순위 로직 통합

#### 1. **이미지 404 에러 해결**
**파일**: `/src/services/firebaseService.ts` (Line 3492-3533)

**변경**:
```typescript
// ✅ template.images.main을 최우선 (모든 연도 공통)
imageUrl = templateImage ||
          templateVariant?.imageUrl ||
          trim.imageUrl ||
          vehicleData.imageUrl ||
          generateVehicleImageUrl({...});
```

#### 2. **YearTemplate 없는 연도의 정확한 데이터 조회**
**파일**: `/src/services/firebaseService.ts` (Line 3433-3486)

**변경**:
```typescript
// ✅ 사용자가 선택한 연도에 맞는 variant 검색
const variantForYear = trim.variants?.find(
  (v: any) => Array.isArray(v.years) && v.years.includes(userVehicle.year)
);
const selectedVariant = variantForYear || firstVariant;

// 배터리 제조사, 주행거리 등 연도별 정확한 데이터 사용
batteryManufacturer = selectedVariant.supplier || ...;
range = selectedVariant.range || ...;
```

**Before**: 항상 `trims.variants[0]` 사용 (2024년 선택해도 2020년 데이터 표시)
**After**: 연도 매칭된 variant 사용 (2024년 → 2024년 variant 데이터)

---

## 🔐 인증 시스템

### 지원 로그인
- 카카오 (KakaoLoginService)
- Google (GoogleLoginService)
- Apple (AppleLoginService)

### 토큰 관리
- **TokenManager**: Firebase Auth + AsyncStorage
- **SmartAuthService**: 자동 재로그인 (앱 시작 시)
- **AuthRecoveryService**: 세션 복구

---

## 📱 푸시 알림

### Expo Notifications
- **예약 상태 변경**: pending → confirmed → in_progress → completed
- **진단 완료**: 리포트 작성 완료 시 사용자에게 알림
- **토큰 관리**: Firestore `users/{uid}/notificationToken` 저장

---

## 🎨 UI/UX 가이드

### 폰트
- **LINE Seed Sans KR**: Regular, Bold
- **적용**: `convertToLineSeedFont()` 유틸 함수

### 색상 테마
- **Primary**: `#3b82f6` (파란색)
- **Success**: `#10b981` (초록색)
- **Warning**: `#f59e0b` (주황색)
- **Error**: `#ef4444` (빨간색)

### 반응형
- 스크린 크기별 조건부 렌더링
- iOS/Android 플랫폼별 디자인 분기

---

## 🐛 디버깅

### devLog 시스템
**파일**: `/src/utils/devLog.ts`

- 개발 환경에서만 로그 출력
- 프로덕션에서는 자동 비활성화
- Firebase, 인증, 지도 관련 상세 로그

---

## ⚠️ 주의사항

1. **Firebase Storage URL**: `charzing-d1600.firebasestorage.app` (`.appspot.com` ❌)
2. **브랜드 ID 대소문자**: `BMW`, `MINI`, `PORSCHE`는 대문자
3. **연도 타입**: Firestore에서 `number` (문자열 ❌)
4. **이미지 경로**: `/vehicle-images/{BRAND}/{MODEL}/{YEAR}/`
5. **YearTemplate 우선**: 연도별 데이터는 항상 YearTemplate 먼저 확인

---

## 🔗 관련 프로젝트

Charzing 서비스는 4개의 프로젝트로 구성되어 있습니다:

### 1. **CharzingApp-Expo** (현재 프로젝트)
- **위치**: `/Users/sungmin/CharzingApp-Expo`
- **역할**: 모바일 앱 (React Native + Expo)
- **주요 기능**: 차량 등록, 진단 예약, 배터리 정보 조회

### 2. **charzing-admin**
- **위치**: `/Users/sungmin/charzing-admin`
- **역할**: 관리자 대시보드 (Next.js 15)
- **주요 기능**: 사용자/예약/리포트 관리, 차량 데이터 CRUD
- **문서**: `/Users/sungmin/charzing-admin/CLAUDE.md`

### 3. **charzing** (웹 앱)
- **위치**: `/Users/sungmin/Desktop/project/react/charzing`
- **역할**: 사용자 웹 앱 (Next.js) + Firebase Functions
- **주요 기능**: 웹 진단 예약, 리포트 조회
- **문서**: `/Users/sungmin/Desktop/project/react/charzing/CLAUDE.md`
- **Firebase Functions**: 차량 데이터 조회 API

### 4. **charzing-vehicle-utils**
- **위치**: `/Users/sungmin/charzing-vehicle-utils`
- **역할**: 공유 유틸리티 라이브러리
- **주요 기능**: 차량 데이터 변환, 동적 Firestore 매핑
- **문서**: `/Users/sungmin/charzing-vehicle-utils/README.md`

---

**마지막 업데이트**: 2025-12-12
**버전**: 1.1.11
**작성**: Claude Code
