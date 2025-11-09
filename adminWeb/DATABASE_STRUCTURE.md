# 📊 VehicleDiagnosisReport 데이터베이스 구조 문서

## 🔥 Firestore Collection: `vehicleDiagnosisReports`

### 📋 데이터 스키마

```typescript
interface VehicleDiagnosisReport {
  // ═══════════════════════════════════════════════════════════════
  // 📋 기본 메타데이터
  // ═══════════════════════════════════════════════════════════════
  id: string;                    // "rNMjtuWWnbqqQH5z06AG"
  createdAt: Timestamp;          // 생성일시
  updatedAt: Timestamp;          // 수정일시
  status: "draft" | "completed"; // 리포트 상태
  
  // ═══════════════════════════════════════════════════════════════
  // 👤 사용자 및 예약 정보
  // ═══════════════════════════════════════════════════════════════
  userId: string;                // "web_010-7477-1455"
  reservationId: string | null;  // "tCmIVsgwMMeyGA0Ew15D" (연결된 예약 ID)
  
  // ═══════════════════════════════════════════════════════════════
  // 🚗 차량 기본 정보
  // ═══════════════════════════════════════════════════════════════
  vehicleBrand?: string;         // "현대" | "기아" | "테슬라" 등
  vehicleName: string;           // "아이오닉 5" | "EV6" 등
  vehicleYear: string;           // "2024"
  vehicleVIN?: string;           // 차대번호 (선택사항)
  diagnosisDate: Timestamp;      // 진단 수행 날짜
  
  // ═══════════════════════════════════════════════════════════════
  // 🔋 배터리 진단 정보
  // ═══════════════════════════════════════════════════════════════
  cellCount: number;             // 7 (배터리 셀 개수)
  defectiveCellCount: number;    // 0 (불량 셀 개수)
  normalChargeCount: number;     // 10 (일반 충전 횟수)
  fastChargeCount: number;       // 10 (급속 충전 횟수)
  sohPercentage: number;         // 100 (SOH 백분율)
  realDrivableDistance: string;  // "" (실제 주행가능거리)
  
  // ═══════════════════════════════════════════════════════════════
  // ⚡ 전압 정보
  // ═══════════════════════════════════════════════════════════════
  totalVoltage: number;          // 25.9 (총 전압)
  maxVoltage: number;            // 3.7 (최대 전압)
  minVoltage: number;            // 3.7 (최소 전압)
  
  // ═══════════════════════════════════════════════════════════════
  // 🔬 개별 셀 데이터
  // ═══════════════════════════════════════════════════════════════
  cellsData: BatteryCell[];      // 개별 셀 정보 배열
  
  // ═══════════════════════════════════════════════════════════════
  // 📊 진단 세부 결과
  // ═══════════════════════════════════════════════════════════════
  diagnosisDetails: DiagnosisDetail[];
  
  // ═══════════════════════════════════════════════════════════════
  // 📁 업로드된 파일들
  // ═══════════════════════════════════════════════════════════════
  uploadedFiles?: UploadedFile[];
  
  // ═══════════════════════════════════════════════════════════════
  // 🔍 종합 차량 검사 (확장 기능)
  // ═══════════════════════════════════════════════════════════════
  comprehensiveInspection?: ComprehensiveVehicleInspection;
}
```

### 📋 관련 인터페이스

#### 🔋 배터리 셀 정보
```typescript
interface BatteryCell {
  id: number;                    // 1, 2, 3... (셀 번호)
  voltage?: number;              // 3.7 (셀 전압) - 옵셔널
  isDefective: boolean;          // false (불량 여부)
  cellNumber?: number;           // 셀 번호 (다른 표현) - 옵셔널
  temperature?: number;          // 온도 (옵셔널)
  status?: string;               // 상태 (옵셔널)
}
```

#### 📊 진단 세부 결과
```typescript
interface DiagnosisDetail {
  category: string;              // "SOH" | "셀 불량 여부" | "총 충전 횟수" 등
  measuredValue: string;         // "100" | "0개 셀 불량" | "20회" 등
  interpretation: string;        // 해석 (선택사항)
}
```

#### 📁 업로드된 파일
```typescript
interface UploadedFile {
  fileName: string;              // "EV진단사 자격검정(샘플문제).pdf"
  fileUrl: string;               // Firebase Storage 다운로드 URL
  fileSize: number;              // 259255 (바이트)
  fileType: string;              // "application/pdf"
  uploadDate: Date;              // 업로드 일시
}
```

#### 🔍 종합 차량 검사
```typescript
interface ComprehensiveVehicleInspection {
  // ═══════════════════════════════════════════════════════════════
  // 🆕 새로운 이미지 기반 검사 구조 (2025.10.29 추가)
  // ═══════════════════════════════════════════════════════════════
  inspectionImages: InspectionImageItem[];       // 검사 이미지 (사진 중심)
  additionalInfo: AdditionalInspectionInfo[];    // 추가 검사 정보 (텍스트 중심)
  pdfReports: PDFInspectionReport[];             // PDF 검사 리포트
  
  // ═══════════════════════════════════════════════════════════════
  // 📋 기존 검사 구조 (하위 호환성 유지)
  // ═══════════════════════════════════════════════════════════════
  paintThickness?: PaintThicknessInspection[];     // 도막 두께 검사 (레거시)
  tireTread?: TireTreadInspection[];               // 타이어 트레드 검사 (레거시)
  componentReplacement?: ComponentReplacementInspection[]; // 교환 부위 검사 (레거시)
}

// ═══════════════════════════════════════════════════════════════
// 🆕 새로운 이미지 기반 검사 인터페이스 (2025.10.29 추가, 2025.11.07 수정)
// ═══════════════════════════════════════════════════════════════
// 📝 2025.11.07 변경: category와 severity를 자유 입력으로 변경
//    - 기존: 리터럴 타입 ('paint' | 'tire' | ...)
//    - 변경: string 타입 (사용자가 직접 한글/영어로 입력 가능)
// ═══════════════════════════════════════════════════════════════

// 검사 이미지 항목 (사진 중심 검사)
interface InspectionImageItem {
  id: string;                        // "img_1698123456789" (고유 ID)
  imageUrl: string;                  // Firebase Storage 이미지 URL
  category: string;                  // 검사 카테고리 (자유 입력: "도막", "타이어", "부품", "배터리" 등)
  severity: string;                  // 심각도 (자유 입력: "정상", "주의", "경고", "심각" 등)

  // 📋 선택적 메타데이터 (미래 확장용)
  title?: string;                    // 이미지 제목
  description?: string;              // 이미지 설명
  location?: string;                 // 차량 위치 (예: "앞범퍼", "좌측 전륜")
  recommendations?: string[];        // 권장사항
  estimatedCost?: number;            // 예상 수리비용 (원)
  notes?: string;                    // 특이사항
}

// 추가 검사 정보 (텍스트 기반 검사)
interface AdditionalInspectionInfo {
  title: string;                     // "브레이크 패드 점검" 등
  content: string;                   // 검사 내용 설명
  category: string;                  // 검사 카테고리 (자유 입력: "도막", "타이어", "부품", "배터리" 등)
  severity: string;                  // 심각도 (자유 입력: "정상", "주의", "경고", "심각" 등)
}

// ═══════════════════════════════════════════════════════════════
// 📋 기존 검사 인터페이스 (하위 호환성)
// ═══════════════════════════════════════════════════════════════

// 도막 두께 검사
interface PaintThicknessInspection {
  location: string;              // "front_door_right" 등
  thickness: number;             // 15 (μm)
  isWithinRange: boolean;        // true
  notes?: string;                // 특이사항
}

// 타이어 트레드 검사
interface TireTreadInspection {
  position: 'front_left' | 'front_right' | 'rear_left' | 'rear_right';
  treadDepth: number;            // 0.9 (mm)
  wearPattern: 'normal' | 'uneven' | 'excessive' | 'inner_wear' | 'outer_wear';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'replace_needed';
  brand?: string;                // 타이어 브랜드
  size?: string;                 // 타이어 사이즈
  notes?: string;                // 특이사항
}

// 교환 부위 검사
interface ComponentReplacementInspection {
  componentType: 'brake_pads' | 'brake_discs' | 'air_filter' | 'cabin_filter' | 'wiper_blades' | 'coolant' | 'brake_fluid' | 'other';
  componentName: string;         // "22"
  currentCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'replace_needed';
  lastReplacedDate?: Date | string; // "2025-10-09"
  recommendedAction: 'monitor' | 'replace_soon' | 'replace_immediate' | 'no_action';
  notes?: string;                // 특이사항
}

// PDF 검사 리포트
interface PDFInspectionReport {
  fileName: string;              // 파일명
  fileUrl: string;               // Firebase Storage URL
  reportType: 'battery_analysis' | 'safety_inspection' | 'performance_test' | 'manufacturer_recall' | 'other';
  issuedBy: string;              // 발행기관/업체
  issuedDate: Date | string;     // 발행일
  keyFindings: string[];         // 주요 발견사항
  recommendations: string[];     // 권장사항
}
```

## 🗃️ 데이터베이스 쿼리 패턴

### 1. 기본 조회
```javascript
// 특정 리포트 조회
const report = await getDoc(doc(db, 'vehicleDiagnosisReports', reportId));

// 사용자별 리포트 목록
const userReports = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
);

// 최근 리포트 목록 (전체)
const recentReports = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    orderBy('createdAt', 'desc'),
    limit(10)
  )
);
```

### 2. 파일 관련 조회
```javascript
// 파일이 있는 리포트만 조회
const reportsWithFiles = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('uploadedFiles', '!=', null)
  )
);

// 특정 파일 타입이 있는 리포트
const pdfReports = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('uploadedFiles', 'array-contains-any', ['application/pdf'])
  )
);
```

### 3. 배터리 상태별 조회
```javascript
// SOH 90% 이상인 리포트
const healthyBatteries = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('sohPercentage', '>=', 90)
  )
);

// 불량 셀이 있는 리포트
const defectiveCells = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('defectiveCellCount', '>', 0)
  )
);

// 급속 충전 횟수가 많은 리포트 (50회 이상)
const frequentFastCharging = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('fastChargeCount', '>=', 50)
  )
);
```

### 4. 차량별 조회
```javascript
// 특정 브랜드 리포트
const hyundaiReports = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('vehicleBrand', '==', '현대')
  )
);

// 특정 모델 리포트
const ioniq5Reports = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('vehicleName', '==', '아이오닉 5')
  )
);

// 연식별 조회
const recentCars = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('vehicleYear', '>=', '2023')
  )
);
```

### 5. 예약 연결 조회
```javascript
// 특정 예약과 연결된 리포트
const reservationReport = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('reservationId', '==', reservationId)
  )
);

// 예약 없이 직접 생성된 리포트
const directReports = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('reservationId', '==', null)
  )
);
```

### 6. 종합 검사 조회
```javascript
// 종합 검사가 포함된 리포트
const comprehensiveReports = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('comprehensiveInspection', '!=', null)
  )
);

// 이미지 기반 검사가 있는 리포트 (2025.10.29 추가)
const inspectionImageReports = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('comprehensiveInspection.inspectionImages', '!=', null)
  )
);

// 특정 카테고리 검사 이미지가 있는 리포트
const paintInspectionReports = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('comprehensiveInspection.inspectionImages', 'array-contains-any', 
      [{ category: 'paint' }])
  )
);

// 심각도별 검사 결과 조회
const criticalInspections = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('comprehensiveInspection.inspectionImages', 'array-contains-any',
      [{ severity: 'critical' }])
  )
);
```

## 📊 Firebase Storage 파일 구조

```
gs://charzing-d1600.firebasestorage.app/vehicle-reports/
├── {reportId}/                           # 리포트별 폴더
│   ├── files/                           # 📁 일반 업로드 파일들
│   │   ├── EV진단사 자격검정(샘플문제).pdf
│   │   ├── ALL-ELECTRIC-MINI-ACEMAN-Specification.pdf
│   │   └── ... (기타 업로드 파일들)
│   └── inspection-images/               # 🖼️ 검사 이미지들 (2025.10.29 추가)
│       ├── img_1698123456789_paint.jpg      # 도막 검사 이미지
│       ├── img_1698123456790_tire.jpg       # 타이어 검사 이미지
│       ├── img_1698123456791_component.jpg  # 부품 검사 이미지
│       └── img_1698123456792_battery.jpg    # 배터리 검사 이미지
```

### 파일 URL 패턴
```
https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-reports%2F{reportId}%2F{fileName}?alt=media&token={token}
```

## 🔗 데이터 연결 관계

```
Users (users) 
  └── UserProfile.uid → VehicleDiagnosisReport.userId

DiagnosisReservations (diagnosisReservations)
  └── DiagnosisReservation.id → VehicleDiagnosisReport.reservationId

Firebase Storage (vehicle-reports/)
  └── {reportId}/ → VehicleDiagnosisReport.uploadedFiles[].fileUrl
```

## 📈 통계 및 분석 쿼리

### 배터리 상태 통계
```javascript
// SOH 분포 분석
const sohDistribution = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('sohPercentage', '>=', 0)
  )
);

// 브랜드별 평균 SOH
const brandSOHStats = {};
sohDistribution.forEach(doc => {
  const data = doc.data();
  if (!brandSOHStats[data.vehicleBrand]) {
    brandSOHStats[data.vehicleBrand] = [];
  }
  brandSOHStats[data.vehicleBrand].push(data.sohPercentage);
});
```

### 충전 패턴 분석
```javascript
// 급속 충전 비율 높은 차량
const highFastChargingRatio = await getDocs(
  query(
    collection(db, 'vehicleDiagnosisReports'),
    where('fastChargeCount', '>', 0)
  )
);
```

## 🔧 인덱스 권장사항

Firestore 성능 최적화를 위한 복합 인덱스 설정:

```javascript
// 1. 사용자별 최신 리포트 조회용
{
  collection: 'vehicleDiagnosisReports',
  fields: [
    { fieldPath: 'userId', order: 'ASCENDING' },
    { fieldPath: 'createdAt', order: 'DESCENDING' }
  ]
}

// 2. 차량 브랜드별 SOH 성능 분석용
{
  collection: 'vehicleDiagnosisReports',
  fields: [
    { fieldPath: 'vehicleBrand', order: 'ASCENDING' },
    { fieldPath: 'sohPercentage', order: 'DESCENDING' }
  ]
}

// 3. 검사 카테고리별 심각도 분석용 (2025.10.29 추가)
{
  collection: 'vehicleDiagnosisReports',
  fields: [
    { fieldPath: 'comprehensiveInspection.inspectionImages.category', order: 'ASCENDING' },
    { fieldPath: 'comprehensiveInspection.inspectionImages.severity', order: 'ASCENDING' }
  ]
}

// 4. 배터리 상태별 통계용
{
  collection: 'vehicleDiagnosisReports',
  fields: [
    { fieldPath: 'defectiveCellCount', order: 'ASCENDING' },
    { fieldPath: 'sohPercentage', order: 'DESCENDING' }
  ]
}
```

## 📝 업데이트 히스토리

- **2025-11-07**: 검사 카테고리 및 심각도 자유 입력 기능 추가
  - `InspectionImageItem.category`: 리터럴 타입 → `string` (자유 입력)
  - `InspectionImageItem.severity`: 리터럴 타입 → `string` (자유 입력)
  - `AdditionalInspectionInfo.category`: 리터럴 타입 → `string` (자유 입력)
  - `AdditionalInspectionInfo.severity`: 리터럴 타입 → `string` (자유 입력)
  - `BatteryCell.voltage`: 필수 → 옵셔널로 변경
  - `BatteryCell`: 추가 옵셔널 필드 추가 (cellNumber, temperature, status)
- **2025-10-29**: 이미지 기반 종합 검사 시스템 추가
  - `InspectionImageItem` 인터페이스 추가 (카테고리, 심각도 중심)
  - `AdditionalInspectionInfo` 인터페이스 추가 (텍스트 기반 검사)
  - Firebase Storage 구조에 `inspection-images/` 폴더 추가
  - 새로운 검사 시스템 관련 쿼리 패턴 추가
  - 하위 호환성을 위한 레거시 구조 유지
- **2025-10-28**: 업로드된 파일 기능 추가
- **2025-10-28**: 종합 차량 검사 기능 확장
- **2025-10-28**: 서버타임스탬프 배열 이슈 해결