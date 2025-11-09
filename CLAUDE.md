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
- `VehicleInspectionScreen.tsx` - **차량 진단 리포트 작성** (아코디언 구조, 1900+ 라인)

#### **핵심 컴포넌트 (src/components/)**

##### 차량 선택 및 지도
- `VehicleAccordionSelector.tsx` - 🎯 **신규 차량 선택 모달** (브랜드 → 모델 → 트림 → 연식)
- `KakaoMapView.tsx` - 카카오 지도 WebView 통합

##### 배터리 셀 관리 (VehicleInspectionScreen 전용)
- `BatteryCellGridModal.tsx` - **배터리 셀 그리드 모달** (셀 목록 표시, 기본 전압 설정)
  - 하단 슬라이드 모달 형태
  - 셀 개수만큼 그리드로 표시 (예: 100개 셀)
  - 각 셀별 전압 표시 및 불량 셀 표시
  - 기본 전압 설정 (모든 셀에 일괄 적용)
  - 셀 클릭 시 상세 편집 모달 열기
- `BatteryCellDetailModal.tsx` - **개별 셀 상세 편집 모달** (중앙 모달)
  - 불량 셀 체크박스
  - 개별 셀 전압 입력
  - 깔끔한 중앙 모달 UI

##### 진단 리포트 카드 (VehicleInspectionScreen 전용)
- `DiagnosisDetailCard.tsx` - **진단 항목 카드 컴포넌트**
  - 카테고리, 측정값, 해석 입력 필드
  - 삭제 버튼 (2개 이상일 때만 표시)
  - 재사용 가능한 카드 형태
- `InspectionImageCard.tsx` - **검사 이미지 카드 컴포넌트**
  - 이미지 미리보기
  - 카테고리, 상태 입력 필드
  - 이미지 삭제 버튼
  - 그리드 레이아웃 지원 (2열)

##### 공통 컴포넌트
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

## VehicleInspectionScreen 상세 가이드

### 📋 화면 구조
차량 진단 리포트를 작성하는 핵심 화면으로, 아코디언 형태의 5개 섹션으로 구성됩니다.

#### 섹션 구조
1. **차량 기본 정보** (`vehicleInfo`)
   - 브랜드, 차량명, 연식, 차대번호, 진단 날짜
   - 주행거리, 계기판 상태

2. **차대번호 및 상태 확인** (`vinCheck`)
   - 차대번호 동일성 확인 체크박스
   - 불법 구조변경 없음 체크박스
   - 침수 이력 없음 체크박스

3. **배터리 정보** (`batteryInfo`) ⭐ **핵심 기능**
   - SOH (%) - 필수 입력
   - 최대/최소 전압 - **자동 계산** (읽기 전용)
   - 셀 개수 - 필수 입력
   - **배터리 셀 관리 버튼** (셀 개수 > 0일 때 표시)
     - 클릭 시 `BatteryCellGridModal` 열림
     - 각 셀별 전압 설정 가능
     - 불량 셀 체크 가능
   - 불량 셀 개수 - **자동 계산** (읽기 전용)
   - 일반 충전 횟수
   - 급속 충전 횟수

4. **진단 세부사항** (`diagnosis`)
   - 항목별 카테고리, 측정값, 해석 입력
   - `DiagnosisDetailCard` 컴포넌트 사용
   - 항목 추가/삭제 가능

5. **검사 이미지** (`images`)
   - 사진 촬영 / 갤러리에서 선택
   - `InspectionImageCard` 컴포넌트 사용
   - 이미지별 카테고리, 상태 입력

### 🔄 배터리 셀 관리 플로우

```
1. 사용자가 "셀 개수" 입력 (예: 100)
   ↓
2. useEffect가 batteryCells 배열 자동 생성
   - 각 셀: { id, cellNumber, isDefective: false, voltage: defaultCellVoltage }
   ↓
3. "배터리 셀 관리" 버튼 표시
   ↓
4. 버튼 클릭 → BatteryCellGridModal 열림
   - 기본 전압 설정 가능 (모든 셀에 적용)
   - 100개 셀 그리드로 표시
   ↓
5. 셀 클릭 (예: 6번 셀)
   ↓
6. BatteryCellDetailModal 열림
   - 불량 셀 체크박스 ON/OFF
   - 개별 전압 입력
   ↓
7. 자동 계산 (useMemo)
   - defectiveCellCount: 불량 셀 개수 카운트
   - maxCellVoltage: 최대 전압 계산
   - minCellVoltage: 최소 전압 계산
```

### 💡 주요 구현 패턴

#### 1. 자동 계산 값 (useMemo 사용)
```typescript
// ❌ 잘못된 방법 - 사용자가 직접 입력
const [defectiveCellCount, setDefectiveCellCount] = useState(0);

// ✅ 올바른 방법 - 자동 계산
const defectiveCellCount = useMemo(() => {
  return batteryCells.filter(cell => cell.isDefective).length;
}, [batteryCells]);
```

#### 2. 읽기 전용 입력 필드 스타일
```typescript
<View style={styles.readOnlyInput}>
  <Text style={styles.readOnlyText}>{defectiveCellCount}개</Text>
</View>
```

#### 3. 조건부 버튼 표시
```typescript
{batteryCellCount > 0 && (
  <TouchableOpacity
    style={styles.cellManagementButton}
    onPress={handleOpenCellModal}
  >
    <Text>배터리 셀 관리</Text>
  </TouchableOpacity>
)}
```

### 🎨 컴포넌트 분리 원칙

**VehicleInspectionScreen에서 컴포넌트로 분리한 이유:**
- 파일 크기 관리 (1900+ 라인)
- 재사용 가능성 (다른 화면에서도 사용 가능)
- 유지보수성 향상 (각 컴포넌트의 책임 분리)
- 테스트 용이성

**컴포넌트 분리 체크리스트:**
- ✅ 반복되는 UI 패턴 (map으로 렌더링되는 항목)
- ✅ 독립적인 기능 단위 (모달, 카드 등)
- ✅ 50줄 이상의 render 로직
- ❌ 한 번만 사용되고 10줄 미만인 간단한 UI

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