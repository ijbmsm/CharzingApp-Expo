import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  provider: 'kakao' | 'email';
  kakaoId?: string;
  phoneNumber?: string;
  address?: string;
  isRegistrationComplete: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface DiagnosisReservation {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  address: string;
  detailAddress?: string;
  latitude: number;
  longitude: number;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  serviceType?: string;
  servicePrice?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  requestedDate: Date | Timestamp;
  adminNotes?: string;
  notes?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface DiagnosisReportFile {
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface DiagnosisReport {
  id: string;
  userId: string;
  title: string;
  description?: string;
  files: DiagnosisReportFile[];
  status: 'uploaded' | 'processing' | 'completed';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// 차량 진단 리포트 세부 항목
export interface DiagnosisDetail {
  category: string; // 구분 (SOH, 셀 불량 여부 등)
  measuredValue?: string; // 측정값
  interpretation?: string; // 해석
  status?: string; // 상태
  description?: string; // 설명
}

// 도막 두께 검사 항목
export interface PaintThicknessInspection {
  location: string; // 측정 위치 (루프, 보닛, 도어 등)
  thickness: number; // 도막 두께 (μm)
  isWithinRange: boolean; // 정상 범위 여부
  notes?: string; // 특이사항
}

// 타이어 트레드 검사 항목
export interface TireTreadInspection {
  position: 'front_left' | 'front_right' | 'rear_left' | 'rear_right'; // 타이어 위치
  treadDepth: number; // 트레드 깊이 (mm)
  wearPattern: 'normal' | 'uneven' | 'excessive' | 'inner_wear' | 'outer_wear'; // 마모 패턴
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'replace_needed'; // 상태
  brand?: string; // 타이어 브랜드
  model?: string; // 타이어 모델
  size?: string; // 타이어 사이즈
  notes?: string; // 특이사항
}

// 교환 부위 검사 항목
export interface ComponentReplacementInspection {
  componentType: 'brake_pads' | 'brake_discs' | 'air_filter' | 'cabin_filter' | 'wiper_blades' | 'coolant' | 'brake_fluid' | 'other'; // 부품 유형
  componentName: string; // 부품명
  currentCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'replace_needed'; // 현재 상태
  lastReplacedDate?: Date | string; // 마지막 교환일
  nextReplacementDate?: Date | string; // 다음 교환 예정일
  mileageAtReplacement?: number; // 교환 시 주행거리
  recommendedAction: 'monitor' | 'replace_soon' | 'replace_immediate' | 'no_action'; // 권장 조치
  estimatedCost?: number; // 예상 비용
  notes?: string; // 특이사항
}

// PDF 검사 리포트 (외부 진단 결과)
export interface PDFInspectionReport {
  fileName: string; // 파일명
  fileUrl: string; // Firebase Storage URL
  reportType: 'battery_analysis' | 'safety_inspection' | 'performance_test' | 'manufacturer_recall' | 'other'; // 리포트 유형
  issuedBy: string; // 발행기관/업체
  issuedDate: Date | string; // 발행일
  summary?: string; // 요약
  keyFindings: string[]; // 주요 발견사항
  recommendations: string[]; // 권장사항
}

// 이미지 기반 검사 항목
export interface InspectionImageItem {
  id: string; // 고유 ID
  imageUrl: string; // Firebase Storage URL
  category: string; // 검사 카테고리 (자유 입력)
  title?: string; // 제목 (예: "보닛 도막 손상", "앞왼쪽 타이어 마모") - 옵셔널
  description?: string; // 상세 설명
  severity: string; // 심각도 (자유 입력)
  location?: string; // 위치 (예: "앞범퍼", "운전석 도어")
  recommendations?: string[]; // 권장 조치사항
  estimatedCost?: number; // 예상 수리 비용
  notes?: string; // 추가 메모
}

// 텍스트 기반 추가 검사 정보
export interface AdditionalInspectionInfo {
  category: string; // 자유 입력
  title: string;
  content: string;
  severity: string; // 자유 입력
}

// 종합 차량 검사 결과 (새로운 구조 + 하위 호환성)
export interface ComprehensiveVehicleInspection {
  // 새로운 구조
  inspectionImages?: InspectionImageItem[]; // 이미지 기반 검사 항목들
  additionalInfo?: AdditionalInspectionInfo[]; // 추가 텍스트 정보
  pdfReports?: PDFInspectionReport[]; // PDF 검사 리포트 - 옵셔널
  
  // 기존 구조 (하위 호환성)
  paintThickness?: PaintThicknessInspection[]; // 도막 두께 검사
  tireTread?: TireTreadInspection[]; // 타이어 트레드 검사
  componentReplacement?: ComponentReplacementInspection[]; // 교환 부위 검사
}

// 기존 구조 (하위 호환성)
export interface LegacyComprehensiveVehicleInspection {
  paintThickness: PaintThicknessInspection[]; // 도막 두께 검사
  tireTread: TireTreadInspection[]; // 타이어 트레드 검사
  componentReplacement: ComponentReplacementInspection[]; // 교환 부위 검사
  pdfReports: PDFInspectionReport[]; // PDF 검사 리포트
}

// 배터리 셀 정보
export interface BatteryCell {
  id: number; // 셀 번호
  cellNumber?: number; // 셀 번호 (다른 표현)
  isDefective: boolean; // 불량 여부
  voltage?: number; // 전압 (옵션)
  temperature?: number; // 온도 (옵션)
  status?: string; // 상태
}

// 새로운 차량 진단 리포트 구조
export interface VehicleDiagnosisReport {
  id: string;
  reservationId: string | null; // 예약과 연결 (null 가능 - 직접 작성된 리포트의 경우)
  userId: string;

  // 사용자 정보 (점검시 기록)
  userName?: string; // 사용자 이름
  userPhone?: string; // 사용자 전화번호

  // 상단 기본 정보
  vehicleBrand?: string; // 차량 브랜드 (예: 현대, 기아, 테슬라) - 옵셔널
  vehicleName: string; // 차량명
  vehicleYear: string; // 차량 년식
  vehicleVIN?: string; // 차대번호 (Vehicle Identification Number) - 옵셔널
  diagnosisDate: Date | Timestamp; // 진단 날짜

  // 차량 상태 정보
  mileage?: number; // 주행거리 (km)
  dashboardCondition?: string; // 계기판 상태
  isVinVerified?: boolean; // 차대번호 동일성 확인
  hasNoIllegalModification?: boolean; // 불법 구조변경 없음
  hasNoFloodDamage?: boolean; // 침수 이력 없음
  
  // 배터리 진단 정보
  cellCount: number; // 셀 개수
  defectiveCellCount: number; // 불량 개수
  normalChargeCount: number; // 일반 충전 횟수
  fastChargeCount: number; // 급속 충전 횟수
  sohPercentage: number; // SOH(%)
  realDrivableDistance?: string; // 실 주행 가능 거리 (옵셔널)
  
  // 전압 정보
  totalVoltage?: number; // 총 전압 (V)
  maxVoltage?: number; // 최대 전압 (V)
  minVoltage?: number; // 최소 전압 (V)
  
  // 셀 정보
  cellsData?: BatteryCell[]; // 개별 셀 상태 데이터
  
  // 배터리 세부 진단 결과
  diagnosisDetails: DiagnosisDetail[];
  
  // 종합 차량 검사 (새로 추가)
  comprehensiveInspection?: ComprehensiveVehicleInspection;
  
  // 업로드된 파일들
  uploadedFiles?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    uploadDate: Date | Timestamp;
  }[];
  
  // 메타 정보
  status: 'draft' | 'completed';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface ScheduleSettings {
  workingDays: number[]; // 0=일요일, 1=월요일, ...
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  unavailableSlots: {
    date: string; // YYYY-MM-DD
    timeSlots: string[]; // ["09:00", "10:00"]
  }[];
}

// 차량 브랜드 정보
export interface Vehicle {
  id: string;
  name: string; // 브랜드명 (한국어: BMW, 미니, 포르쉐 등)
  englishName: string; // 브랜드명 (영어: BMW, MINI, PORSCHE 등)
  logoUrl?: string; // 브랜드 로고 URL
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// 차량 모델 정보
export interface VehicleModel {
  id: string;
  name: string; // 모델명 (한국어)
  englishName: string; // 모델명 (영어)
  imageUrl?: string; // 모델 이미지 URL
  defaultBattery?: {
    capacity: number;
    voltage: number;
    type: string;
    supplier: string;
    range: number;
  };
  trims: VehicleTrim[];
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// 차량 트림 정보
export interface VehicleTrim {
  trimId: string;
  name: string; // 트림명
  driveType: string; // 구동방식 (FWD, RWD, AWD)
  yearRange: {
    start: number;
    end: number;
  };
  variants: VehicleVariant[];
}

// 차량 변형 정보 (연식별 상세 정보)
export interface VehicleVariant {
  years: string[];
  batteryCapacity: number;
  range: number;
  supplier: string;
  cellType?: string; // 배터리 구성 (예: NCM, LFP, NCA)
  imageUrl?: string; // 변형별 이미지 (선택사항, 없으면 모델 이미지 사용)
  specifications: {
    power: string;
    torque: string;
    acceleration: string;
    motor: string;
    chargingSpeed: string;
    chargingConnector?: string; // 충전 커넥터 규격 (예: CCS1, CCS2, CHAdeMO, Tesla Supercharger 등)
    topSpeed?: string; // 최고속도 (예: "185km/h", "250km/h")
    efficiency: string;
  };
}