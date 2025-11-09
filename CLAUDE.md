# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 필요한 종합 가이드입니다.

## 📱 CharzingApp - 한국 전기차 배터리 진단 전문 서비스

### 프로젝트 개요

**버전**: 1.1.0
**설명**: 한국 전기차 소유자를 위한 배터리 진단 예약 및 실시간 진단 리포트 작성 앱
**플랫폼**: iOS, Android (React Native + Expo)

**핵심 기능**:
- 🔋 전기차 배터리 정보 조회 (브랜드/모델별 실제 데이터)
- 📅 배터리 진단 예약 (3단계 플로우: 위치 → 날짜/시간 → 차량 선택)
- 📊 차량 진단 리포트 작성 (정비사/관리자 전용, 배터리 셀 관리 포함)
- 📱 실시간 예약 관리 (정비사 할당, 상태 추적)
- 🔐 소셜 로그인 (카카오, Google, Apple)
- 🔔 푸시 알림 (예약 상태 변경, 진단 완료)

---

## 🏗️ 프로젝트 구조

### 디렉토리 구조

```
src/
├── assets/                          # 정적 리소스
│   ├── charzingLogo/               # 앱 로고
│   ├── images/                     # 일반 이미지
│   └── kakao/                      # 카카오 로그인 이미지
│
├── components/                      # 재사용 가능한 UI (27개)
│   ├── VehicleSearchModal/         # 차량 선택 모달 (구조화됨)
│   │   ├── components/             # 단계별 선택 컴포넌트
│   │   ├── hooks/                  # 커스텀 훅 (데이터, 캐싱, 선택)
│   │   └── utils/                  # 유틸 (브랜드 매핑, 변환)
│   ├── skeleton/                   # 로딩 스켈레톤 UI
│   ├── BatteryCellGridModal.tsx    # 배터리 셀 그리드 모달 ⭐ 신규
│   ├── BatteryCellDetailModal.tsx  # 개별 셀 상세 편집 ⭐ 신규
│   ├── DiagnosisDetailCard.tsx     # 진단 항목 카드 ⭐ 신규
│   ├── InspectionImageCard.tsx     # 검사 이미지 카드 ⭐ 신규
│   ├── VehicleAccordionSelector.tsx # 차량 선택 아코디언
│   ├── KakaoMapView.tsx            # 카카오 지도 WebView
│   ├── Header.tsx                  # 공통 헤더
│   └── LoadingSpinner.tsx          # 로딩 스피너
│
├── screens/                         # 화면 컴포넌트 (22개)
│   ├── VehicleInspectionScreen.tsx      # 진단 리포트 작성 (1,970줄) ⭐ 핵심
│   ├── VehicleDiagnosisReportScreen.tsx # 진단 리포트 조회 (2,500줄)
│   ├── HomeScreen.tsx                   # 홈 화면 (2,414줄)
│   ├── ReservationScreen.tsx            # 예약 플로우 (2,243줄)
│   ├── BatteryInfoScreen.tsx            # 배터리 정보 (1,106줄)
│   ├── ReservationApprovalScreen.tsx    # 예약 승인 ⭐ 신규
│   ├── ReservationsManagementScreen.tsx # 예약 관리 ⭐ 신규
│   ├── MyPageScreen.tsx                 # 마이페이지
│   ├── LoginScreen.tsx                  # 로그인
│   └── ... (13개 추가 화면)
│
├── services/                        # 비즈니스 로직 (15개 파일)
│   ├── firebaseService.ts          # Firebase 통합 (3,399줄) ⭐ 핵심
│   ├── auth/                       # 인증 관련
│   │   ├── SmartAuthService.ts     # 스마트 인증
│   │   ├── TokenManager.ts         # 토큰 관리
│   │   ├── UserProfileManager.ts   # 프로필 관리
│   │   └── AuthRecoveryService.ts  # 인증 복구
│   ├── kakaoLoginService.ts        # 카카오 로그인 (416줄)
│   ├── googleLoginService.ts       # Google 로그인 (232줄)
│   ├── appleLoginService.ts        # Apple 로그인 (222줄)
│   ├── notificationService.ts      # 푸시 알림 (588줄)
│   └── errorHandler.ts             # 에러 핸들링 (310줄)
│
├── navigation/
│   └── RootNavigator.tsx           # 네비게이션 (Stack + Tabs)
│
├── store/                          # Redux 상태 관리
│   ├── index.ts                    # Store 설정
│   └── slices/
│       ├── authSlice.ts            # 인증 상태
│       └── notificationSlice.ts    # 알림 상태
│
├── firebase/
│   └── config.ts                   # Firebase 설정
│
├── constants/
│   ├── vehicles.ts                 # 차량 상수
│   └── ev-battery-database.ts     # 배터리 DB
│
├── contexts/
│   └── LoadingContext.tsx          # 로딩 상태
│
├── styles/
│   └── fonts.ts                    # LINE Seed Sans KR
│
├── types/
│   └── signup.ts                   # 회원가입 타입
│
└── utils/
    ├── devLog.ts                   # 개발 로그
    ├── sentryLogger.ts             # Sentry 로거
    └── signupValidation.ts         # 검증 로직
```

---

## 📱 주요 화면 상세

### 핵심 화면 (라인 수 순)

| 화면 | 라인 수 | 주요 기능 |
|------|---------|----------|
| **firebaseService.ts** | 3,399 | Firebase 통합 서비스 (50+ 메서드) |
| **VehicleDiagnosisReportScreen** | 2,500 | 완성된 진단 리포트 조회 |
| **HomeScreen** | 2,414 | 메인 홈 (예약 현황, 내 차량, 빠른 예약) |
| **ReservationScreen** | 2,243 | 3단계 예약 플로우 |
| **VehicleInspectionScreen** | 1,970 | ⭐ 진단 리포트 작성 (아코디언 UI) |
| **BatteryInfoScreen** | 1,106 | 배터리 정보 조회 (실제 Firebase 데이터) |

### VehicleInspectionScreen - 차량 진단 리포트 작성 시스템 ⭐

**역할**: 정비사/관리자가 차량 진단 리포트를 작성하는 핵심 화면

**아코디언 구조 (5개 섹션)**:

#### 1. 차량 기본 정보 (`vehicleInfo`)
- 브랜드, 차량명, 연식, 차대번호
- 진단 날짜, 주행거리, 계기판 상태

#### 2. 차대번호 및 상태 확인 (`vinCheck`)
- ✅ 차대번호 동일성 확인
- ✅ 불법 구조변경 없음
- ✅ 침수 이력 없음

#### 3. 배터리 정보 (`batteryInfo`) ⭐ **핵심 기능**

**입력 필드**:
- SOH (%) - 필수
- 셀 개수 - 필수
- 일반 충전 횟수
- 급속 충전 횟수

**자동 계산 필드** (읽기 전용):
- 최대 전압 - `useMemo`로 자동 계산
- 최소 전압 - `useMemo`로 자동 계산
- 불량 셀 개수 - `useMemo`로 자동 계산

**배터리 셀 관리 시스템**:
```
1. 셀 개수 입력 (예: 100)
   ↓
2. useEffect → batteryCells 배열 자동 생성
   ↓
3. "배터리 셀 관리" 버튼 표시
   ↓
4. 버튼 클릭 → BatteryCellGridModal 열림
   - 기본 전압 일괄 설정
   - 100개 셀 그리드로 표시
   ↓
5. 셀 클릭 → BatteryCellDetailModal 열림
   - 불량 셀 체크박스
   - 개별 전압 입력
   ↓
6. 자동 계산 (useMemo)
   - maxCellVoltage: max(cells[].voltage)
   - minCellVoltage: min(cells[].voltage)
   - defectiveCellCount: count(cells[].isDefective)
```

#### 4. 진단 세부사항 (`diagnosis`)
- `DiagnosisDetailCard` 컴포넌트 사용
- 카테고리, 측정값, 해석 입력
- 항목 추가/삭제 (2개 이상일 때)

#### 5. 검사 이미지 (`images`)
- `InspectionImageCard` 컴포넌트 사용
- 카메라 촬영 / 갤러리 선택
- 카테고리, 상태 입력
- Firebase Storage 업로드

**구현 패턴**:

```typescript
// ✅ 자동 계산 값 (useMemo 사용)
const defectiveCellCount = useMemo(() => {
  return batteryCells.filter(cell => cell.isDefective).length;
}, [batteryCells]);

// ✅ 읽기 전용 입력 필드
<View style={styles.readOnlyInput}>
  <Text style={styles.readOnlyText}>{defectiveCellCount}개</Text>
</View>

// ✅ 조건부 렌더링
{batteryCellCount > 0 && (
  <TouchableOpacity onPress={handleOpenCellModal}>
    <Text>배터리 셀 관리</Text>
  </TouchableOpacity>
)}
```

### ReservationsManagementScreen - 정비사 예약 관리 ⭐

**탭 구성**:
- **대기 중**: 아직 할당되지 않은 예약
- **내 담당**: 내가 맡은 예약

**주요 기능**:
- 예약 할당/해제 (`assignReservationToMechanic`)
- 상태 변경 (confirmed → in_progress → completed)
- 진단 리포트 작성 화면으로 이동

---

## 🔥 Firebase 아키텍처

### Firestore Database 구조

```
Firestore
├── users/{uid}
│   ├── email, displayName, realName, phoneNumber
│   ├── kakaoId, googleId, appleId
│   ├── provider: 'kakao' | 'google' | 'apple'
│   ├── role: 'user' | 'admin' | 'mechanic'
│   ├── isRegistrationComplete: boolean
│   ├── pushToken: string
│   ├── createdAt, updatedAt, lastLoginAt
│   └── subcollections:
│       ├── inAppNotifications/  # 인앱 알림
│       └── notificationSettings/ # 알림 설정
│
├── vehicles/{brandId}  # HYUNDAI, KIA, TESLA, BMW, AUDI...
│   ├── name: "현대"
│   ├── englishName: "HYUNDAI"
│   ├── logoUrl: string
│   └── models/{modelId}  # ioniq-5, ev6, model-s...
│       ├── name: "아이오닉 5"
│       ├── englishName: "IONIQ-5"
│       ├── imageUrl: string
│       ├── defaultBattery: {
│       │     capacity: number | string  # ⚠️ 브랜드별 다름
│       │     supplier: "SK온" | "LG에너지솔루션"
│       │     type: "NCM" | "LFP"
│       │     voltage: number
│       │     range: number
│       │   }
│       └── trims: [
│             {
│               trimId: string
│               name: string
│               driveType: "2WD" | "AWD" | "4WD"
│               yearRange: { start: number, end: number }
│               variants: [
│                 {
│                   years: string[]
│                   batteryCapacity: number
│                   range: number
│                   supplier: string
│                   specifications: {
│                     motor, power, torque,
│                     acceleration, chargingSpeed, efficiency
│                   }
│                 }
│               ]
│             }
│           ]
│
├── diagnosisReservations/{reservationId}
│   ├── userId, userName, userPhone
│   ├── address, detailAddress, latitude, longitude
│   ├── vehicleBrand, vehicleModel, vehicleYear
│   ├── status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
│   ├── requestedDate: Timestamp
│   ├── mechanicId: string ⭐ 정비사 할당
│   ├── mechanicName: string ⭐
│   ├── adminNotes: string
│   └── createdAt, updatedAt: Timestamp
│
├── vehicleDiagnosisReports/{reportId} ⭐ 신규 (진단 리포트)
│   ├── reservationId: string
│   ├── userId, userName, userPhone
│   ├── vehicleBrand, vehicleName, vehicleYear, vehicleVIN
│   ├── diagnosisDate: Timestamp
│   ├── mileage: number
│   ├── dashboardCondition: string
│   ├── isVinVerified: boolean
│   ├── hasNoIllegalModification: boolean
│   ├── hasNoFloodDamage: boolean
│   ├── cellCount: number
│   ├── defectiveCellCount: number  # 자동 계산
│   ├── sohPercentage: number
│   ├── maxVoltage: number  # 자동 계산
│   ├── minVoltage: number  # 자동 계산
│   ├── normalChargeCount: number
│   ├── fastChargeCount: number
│   ├── cellsData: BatteryCell[]  # 셀 정보 배열
│   ├── diagnosisDetails: DiagnosisDetail[]
│   ├── comprehensiveInspection: {
│   │     inspectionImages: InspectionImageItem[]
│   │     additionalInfo: string
│   │     pdfReports: string[]
│   │   }
│   ├── status: 'draft' | 'completed'
│   └── createdAt, updatedAt
│
└── settings/{settingId}
    └── schedule: ScheduleSettings
```

### 브랜드별 데이터 구조 차이 ⚠️

#### 현대/기아 구조
```typescript
{
  name: "아이오닉 6",
  defaultBattery: {
    capacity: 77.4,        // ✅ number
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
      variants: [ ... ]
    }
  ]
}
```

#### 아우디 구조
```typescript
{
  name: "e-트론",
  defaultBattery: {
    capacity: "71kWh",     // ⚠️ string (불일치)
    cellType: "NCM",
    manufacturer: "LG Energy Solution",
    warranty: "8년/16만km"
  },
  trims: [
    {
      variants: [
        {
          trimId: "50",
          trimName: "50 quattro",  // ⚠️ trimName (현대/기아는 name)
          batteryCapacity: 71,
          years: ["2020", "2023"],
          driveType: "QUATTRO",
          powerMax: "350HP"
        }
      ]
    }
  ]
}
```

**해결책**: `firebaseService.ts`에서 브랜드별 분기 처리

### Firebase Storage 구조

```
gs://charzing-d1600.firebasestorage.app/
├── vehicle-images/
│   ├── AUDI/
│   ├── BMW/
│   ├── HYUNDAI/
│   ├── KIA/
│   ├── MERCEDES-BENZ/  # ⚠️ 데이터는 MERCEDES-BENZ, Storage는 BENZ
│   ├── MINI/
│   ├── PORSCHE/
│   └── TESLA/
│
├── inspection-images/  ⭐ 신규 (검사 이미지)
│   └── {userId}/
│       └── {timestamp}_{uuid}.jpg
│
└── diagnosis-reports/
    └── {reportId}/
```

### Firebase Functions (Cloud Functions)

**주요 함수 (Sentry 통합 완료)**:

1. **kakaoLoginHttp** (HTTP)
   - 카카오 REST API 로그인
   - 서버에서 직접 카카오 API 호출 (보안 강화)
   - Custom Token 생성
   - Sentry 로깅 (성공/실패)

2. **googleLogin** (Callable)
   - Google ID Token 검증
   - Custom Token 생성
   - Sentry 로깅

3. **createCustomTokenFromApple** (HTTP)
   - Apple 로그인
   - Sentry 로깅

4. **createDiagnosisReservation** (HTTP)
   - 예약 생성 (서버 검증)
   - 시간대 충돌 방지
   - Sentry 로깅

5. **sendReservationStatusNotification** (Firestore Trigger)
   - 예약 상태 변경 시 자동 알림
   - 푸시 알림 + 인앱 알림
   - Sentry 로깅

**설정**:
- Region: `us-central1`
- Memory: 512MB
- Timeout: 60초
- Min Instances: 1 (Cold start 제거)
- **Sentry DSN**: `.env` 파일 설정

---

## 🎨 컴포넌트 아키텍처

### VehicleInspectionScreen 전용 컴포넌트

#### **BatteryCellGridModal.tsx**
- **역할**: 배터리 셀 그리드 모달 (하단 슬라이드)
- **기능**:
  - 기본 전압 일괄 설정
  - 셀 개수만큼 그리드 표시 (100개+)
  - 각 셀별 전압 표시
  - 불량 셀 시각적 표시 (빨간색)
  - 셀 클릭 → `BatteryCellDetailModal` 열기

#### **BatteryCellDetailModal.tsx**
- **역할**: 개별 셀 상세 편집 모달 (중앙)
- **기능**:
  - 불량 셀 체크박스
  - 개별 전압 입력
  - 저장/취소

#### **DiagnosisDetailCard.tsx**
- **역할**: 진단 항목 카드
- **Props**: `item`, `onUpdate`, `onRemove`, `showDeleteButton`
- **기능**: 카테고리, 측정값, 해석 입력

#### **InspectionImageCard.tsx**
- **역할**: 검사 이미지 카드
- **Props**: `item`, `onUpdate`, `onRemove`
- **기능**: 이미지 표시, 카테고리/상태 입력

### 컴포넌트 분리 원칙

**분리해야 하는 경우** ✅:
- 반복되는 UI 패턴 (map으로 렌더링)
- 독립적인 기능 단위 (모달, 카드)
- 50줄 이상의 render 로직
- 재사용 가능성

**분리하지 말아야 하는 경우** ❌:
- 한 번만 사용되는 10줄 미만 UI
- 부모 컴포넌트의 많은 state에 강하게 의존
- 독립적으로 테스트할 필요 없음

---

## 🧩 서비스 레이어

### firebaseService.ts (3,399줄) - 핵심 서비스

**주요 인터페이스** (25개+):
```typescript
UserProfile, UserVehicle, VehicleDetails
DiagnosisReservation, DiagnosisReport
VehicleDiagnosisReport, BatteryCell
InspectionImageItem, DiagnosisDetail
ModelData, ScheduleSettings
PaintThicknessInspection, TireTreadInspection
ComponentReplacementInspection, PDFInspectionReport
```

**주요 메서드** (50개+):

**사용자 관리**:
- `getUserProfile(uid)`: 프로필 조회
- `createOrUpdateUser(userProfile)`: 생성/업데이트
- `saveUserProfile(profile)`: 프로필 저장
- `completeRegistration()`: 회원가입 완료
- `deleteUserAccount(uid)`: 계정 삭제

**예약 관리**:
- `createDiagnosisReservation(data)`: 예약 생성
- `getUserDiagnosisReservations(userId)`: 사용자 예약 목록
- `getPendingReservations()`: 대기 중 예약 ⭐
- `getAllConfirmedReservations()`: 확정 예약 ⭐
- `getMechanicAssignedReservations(mechanicId)`: 정비사 담당 ⭐
- `assignReservationToMechanic(reservationId, mechanicId, mechanicName)`: 할당 ⭐
- `updateDiagnosisReservationStatus(id, status)`: 상태 변경
- `cancelDiagnosisReservation(id)`: 취소
- `isTimeSlotAvailable(date)`: 시간대 확인
- `getAvailableTimeSlots(date)`: 가능 시간대 조회

**진단 리포트**:
- `createVehicleDiagnosisReport(data)`: 리포트 생성 ⭐
- `getVehicleDiagnosisReport(reportId)`: 리포트 조회
- `getUserVehicleDiagnosisReports(userId)`: 사용자 리포트 목록
- `getReservationVehicleDiagnosisReport(reservationId)`: 예약 연결 리포트
- `uploadVehicleInspectionImage(uri, userId)`: 검사 이미지 업로드 ⭐

**차량 데이터**:
- `getVehicleTrims(brandId, modelId)`: 트림 목록
- `getModelData(brandId, modelId)`: 모델 데이터 (브랜드별 분기 처리)
- `getUserVehicles(userId)`: 사용자 차량 목록
- `addUserVehicle(data)`: 차량 추가

**Cloud Functions**:
- `callCloudFunction(name, data)`: 인증 필요
- `callCloudFunctionWithoutAuth(name, data)`: 인증 불필요

**알림**:
- `saveUserPushToken(uid, token)`: 푸시 토큰 저장
- `sendPushNotification(userIds, title, body)`: 푸시 전송

---

## 🗺️ 네비게이션

### RootStackParamList

```typescript
{
  Main: undefined  // Bottom Tab Navigator
  Login: { showBackButton?, message? }

  // 예약
  Reservation: { editMode?, existingReservation? }
  ModifyReservation: { reservation }
  ReservationDetail: { reservation }
  MyReservations: undefined

  // 진단 리포트
  DiagnosisReport: { reportId? }
  VehicleDiagnosisReport: { reportId }
  DiagnosisReportList: undefined

  // 관리자/정비사 ⭐
  ReservationApproval: undefined
  ReservationsManagement: undefined
  VehicleInspection: undefined

  // 설정
  Settings: undefined
  PolicyList: undefined
  PolicyDetail: { title, content }
  SignupComplete: { kakaoUser?, googleUser?, appleUser? }
}
```

### MainTabParamList (Bottom Tabs)

```typescript
{
  Home: undefined           # 홈
  BatteryInfo: undefined    # 배터리 정보
  MyPage: undefined         # 마이페이지
}
```

**특징**:
- 커스텀 TabBar (둥근 모서리, 그림자, SafeArea 처리)
- Ionicons 아이콘
- 3개 탭 (진단 예약은 홈으로 통합)

**애니메이션**:
- 기본: 슬라이드 (iOS 스타일)
- Login/Settings: 아래에서 올라오는 모달
- Main: Fade 애니메이션

---

## 📦 상태 관리 (Redux)

### Store 구조

```typescript
RootState {
  auth: AuthState
  notification: NotificationState
}
```

### authSlice.ts

```typescript
AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  autoLoginEnabled: boolean
}

User {
  uid: string
  email?: string
  displayName?: string
  realName?: string
  phoneNumber?: string
  photoURL?: string
  kakaoId?: string
  googleId?: string
  appleId?: string
  provider?: 'kakao' | 'google' | 'apple'
  role?: 'user' | 'admin' | 'mechanic'  # 역할 기반 접근 제어
}
```

**Actions**:
- `setUser(user)`, `setLoading(boolean)`, `setAutoLoginEnabled(boolean)`
- `updateUserProfile(partial)`, `logout()`

**Redux Persist**: AsyncStorage 사용

### notificationSlice.ts

```typescript
InAppNotification {
  id: string
  title: string
  body: string
  category: 'reservation' | 'report' | 'announcement' | 'marketing'
  isRead: boolean
  createdAt: Date
  data?: { reservationId?, reportId?, status?, type? }
}
```

**Actions**:
- `addNotification()`, `markAsRead(id)`, `markAllAsRead()`
- `removeNotification(id)`, `clearAllNotifications()`

---

## 🛠️ 기술 스택

### Core
- **React Native**: 0.81.5
- **Expo SDK**: 54
- **TypeScript**: 5.1.3
- **React**: 19.1.0

### 상태 관리
- **Redux Toolkit**: 2.9.0
- **Redux Persist**: 6.0.0

### 네비게이션
- **React Navigation v7**: Stack + Bottom Tabs
- **Gesture Handler**: 2.28.0

### Backend
- **Firebase JS SDK**: 12.3.0
- **Firebase Admin**: 13.5.0 (Functions)
- **Firebase Functions**: 6.6.0

### 인증
- **Kakao Login**: `@react-native-seoul/kakao-login` 5.4.2
- **Google Sign-In**: `@react-native-google-signin/google-signin` 13.1.0
- **Apple Auth**: `expo-apple-authentication` 8.0.7

### UI/UX
- **Icons**: `@expo/vector-icons` 15.0.3 (Ionicons)
- **Animations**: `react-native-animatable` 1.4.0
- **Size Matters**: `react-native-size-matters` 0.4.2
- **Linear Gradient**: `expo-linear-gradient` 15.0.7
- **Fonts**: LINE Seed Sans KR

### 지도/위치
- **Kakao Map**: WebView 기반
- **Location**: `expo-location` 19.0.7

### 이미지/파일
- **Image Picker**: `expo-image-picker` 17.0.8
- **Blob Util**: `react-native-blob-util` 0.23.1

### 알림
- **Expo Notifications**: 0.32.11
- **FCM**: Firebase Cloud Messaging

### 에러 추적
- **Sentry**: `@sentry/react-native` 7.5.0

### 유틸리티
- **Axios**: 1.12.2
- **Lodash**: 4.17.21

---

## 🚫 개발 규칙

### 절대 금지 사항 ❌

1. **any 타입 사용 금지**
   ```typescript
   // ❌ 금지
   const data: any = response.data;

   // ✅ 올바른 방법
   const data: DiagnosisReport = response.data;
   ```

2. **더미 데이터 사용 금지**
   - 모든 데이터는 실제 Firebase에서 조회
   - 테스트용 하드코딩 금지

3. **하드코딩 금지**
   - 환경변수 (`.env`) 또는 Firebase에서 관리

4. **폴백 데이터 금지**
   - 데이터 없음 → 명확한 에러 표시
   - 기본값 대신 에러 UI

5. **`as any` 타입 단언 금지**
   ```typescript
   // ❌ 금지
   await firebaseService.saveUserProfile({
     uid: user.uid,
     ...data
   } as any);

   // ✅ 올바른 방법
   await firebaseService.saveUserProfile({
     uid: user.uid,
     email: user.email || undefined,
     isRegistrationComplete: true,
     ...data
   });
   ```

### 권장 사항 ✅

1. **TypeScript 엄격 모드**
   ```bash
   # 커밋 전 필수
   npx tsc --noEmit
   ```

2. **실제 Firebase 데이터 사용**
   - Firestore 직접 조회
   - `firebaseService.ts` 메서드 사용

3. **브랜드별 구조 지원**
   ```typescript
   // 현대/기아: capacity는 number
   // 아우디: capacity는 string
   // → 헬퍼 함수로 타입 안전 처리
   ```

4. **에러 처리**
   ```typescript
   try {
     const data = await firebaseService.getData();
   } catch (error) {
     // 명확한 에러 메시지
     Alert.alert('오류', '데이터를 불러올 수 없습니다.');
   }
   ```

5. **자동 계산 값은 useMemo 사용**
   ```typescript
   // ✅ 읽기 전용 계산 값
   const maxVoltage = useMemo(() => {
     return Math.max(...cells.map(c => c.voltage));
   }, [cells]);
   ```

6. **컴포넌트 분리**
   - 50줄 이상 반복 UI → 컴포넌트화
   - 재사용 가능성 고려

---

## 📋 일반 작업 가이드

### 새 화면 추가

1. `src/screens/NewScreen.tsx` 생성
2. `RootNavigator.tsx`에 타입 추가:
   ```typescript
   export type RootStackParamList = {
     ...
     NewScreen: { param1: string }
   }
   ```
3. Stack에 화면 등록:
   ```typescript
   <Stack.Screen name="NewScreen" component={NewScreen} />
   ```

### Firebase 작업

1. **모든 Firestore 작업**은 `firebaseService.ts` 사용
2. **인증 상태**는 Redux (`authSlice`) 사용
3. **네트워크 에러 처리** 필수
4. **Security Rules** 확인

### Git Commit

```bash
# 타입 체크
npx tsc --noEmit

# 커밋
git add .
git commit -m "feat: 새 기능 추가

상세 설명

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### EAS 빌드

```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# 모두
npm run build:all
```

---

## 🧪 테스트 및 개발

### 스크립트

```bash
# 개발
npm start              # Expo 개발 서버
npm run android        # Android 실행
npm run ios            # iOS 실행

# 테스트
npm run typecheck      # TypeScript 체크
npm run lint           # ESLint
npm run lint:fix       # ESLint 자동 수정

# 빌드
npm run build:android  # Android 빌드
npm run build:ios      # iOS 빌드
npm run build:all      # 모든 플랫폼

# Firebase
npm run upload:vehicles  # 차량 데이터 업로드
```

### 환경변수 (.env)

```
EXPO_PUBLIC_KAKAO_REST_API_KEY
EXPO_PUBLIC_KAKAO_CLIENT_SECRET
EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_CLOUD_FUNCTION_URL
SENTRY_DSN
```

---

## 🔄 최근 변경사항 (2024년 11월)

### 주요 추가 기능 ⭐

1. **차량 진단 리포트 작성 시스템**
   - VehicleInspectionScreen (1,970줄)
   - 아코디언 UI (5개 섹션)
   - 배터리 셀 관리 (100개+ 셀 지원)
   - 자동 계산 (최대/최소 전압, 불량 셀)
   - 이미지 업로드 (Firebase Storage)

2. **정비사/관리자 시스템**
   - ReservationApprovalScreen (예약 승인)
   - ReservationsManagementScreen (예약 관리)
   - 예약 할당 기능
   - 담당 예약 추적

3. **Sentry 통합**
   - Crashlytics → Sentry 완전 교체
   - Firebase Functions에도 Sentry 추가
   - 에러 추적 + 성공 로깅
   - 통계 및 모니터링 강화

4. **카카오 로그인 보안 강화**
   - 서버 사이드 검증 (Firebase Functions)
   - photoURL null 처리
   - Provider 필드 업데이트 로직

### 컴포넌트 추가

- `BatteryCellGridModal.tsx`
- `BatteryCellDetailModal.tsx`
- `DiagnosisDetailCard.tsx`
- `InspectionImageCard.tsx`

### 알려진 이슈 🐛

1. **차량 이미지 404 오류** (부분 해결)
   - Firebase Storage 버킷명 수정 완료
   - 브랜드 매핑 업데이트 완료
   - `getBaseModel` 함수 로직 수정 진행 중

2. **브랜드별 데이터 구조 불일치**
   - 현대/기아: `capacity` (number)
   - 아우디: `capacity` (string)
   - 해결: 타입 안전 헬퍼 함수 사용 중

---

## 📞 참고 자료

- **Firebase Console**: https://console.firebase.google.com/project/charzing-d1600
- **Sentry**: 에러 추적 대시보드
- **adminWeb/DATABASE_STRUCTURE.md**: Firestore 구조 상세
- **PRODUCTION_SETUP.md**: 프로덕션 배포 가이드

---

## 🎯 다음 단계 (제안)

1. **진단 리포트 PDF 생성**
   - `react-native-pdf` 활용
   - 템플릿 디자인
   - 다운로드 기능

2. **실시간 알림 강화**
   - 예약 상태 변경 시 푸시
   - 진단 완료 알림

3. **관리자 웹 대시보드**
   - adminWeb/ 기반 React 웹
   - 예약 관리, 통계 대시보드

4. **결제 시스템**
   - 아임포트/토스페이먼츠 연동
   - 예약 시 결제/환불

5. **차량 데이터 자동 업데이트**
   - 정기적인 크롤링
   - 자동 업로드

---

**마지막 업데이트**: 2024년 11월 9일
**버전**: 1.1.0
**작성**: Claude Code 분석 기반
