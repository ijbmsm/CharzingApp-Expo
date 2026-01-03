// 🔥 React Native polyfill for crypto.getRandomValues (uuid 사용을 위해 필수)
import 'react-native-get-random-values';

// Firebase 웹 SDK (Expo 호환)
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  getDocs,
  runTransaction,
  writeBatch,
  serverTimestamp,
  Timestamp,
  FieldValue,
  orderBy,
  deleteField
} from 'firebase/firestore';
import { getAuth, signOut, signInWithCustomToken } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import axios from 'axios';
import Constants from 'expo-constants';
import { v4 as uuidv4 } from 'uuid';
import {
  generateVehicleImageUrl as generateImageUrl,
  normalizeBrandId,
  type BrandId
} from '@charzing/vehicle-utils';
import { getDb, getAuthInstance, getStorageInstance, getFunctionsInstance } from '../firebase/config';
import logger from './logService';
import devLog from '../utils/devLog';
import sentryLogger from '../utils/sentryLogger'; // ⭐ Sentry 로거 추가
import { handleFirebaseError, handleNetworkError, handleError } from './errorHandler';

// 차량 이미지 URL 생성 유틸리티
// Firebase Storage에 실제 존재하는 차량 이미지 구조 (실제 데이터 기반)
// 하드코딩된 vehicleImageDatabase 제거됨
// @charzing/vehicle-utils 패키지의 동적 URL 생성 함수 사용

// @charzing/vehicle-utils 패키지의 generateVehicleImageUrl 사용
const generateVehicleImageUrl = (make: string, model: string, year: number, trim?: string): string => {
  try {
    devLog.log('🔍 이미지 URL 생성 시작 (패키지 함수):', { make, model, year, trim });

    // 패키지 함수 호출
    const imageUrl = generateImageUrl({
      brandId: make,
      modelId: model,
      year: year,
      trim: trim
    });

    devLog.log('✅ 최종 이미지 URL:', { make, model, year, trim, imageUrl });

    return imageUrl;
  } catch (error) {
    devLog.error('❌ 차량 이미지 URL 생성 실패:', error);
    return '';
  }
};

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  realName?: string; // 실명 추가
  photoURL?: string;
  provider: 'kakao' | 'email' | 'apple' | 'google';
  kakaoId?: string;
  appleId?: string;
  googleId?: string;
  phoneNumber?: string;
  phoneNumberNormalized?: string; // ✅ 검색 최적화용 (숫자만)
  isGuest?: boolean;               // ✅ Guest user 구분
  mergedInto?: string;             // ✅ Guest → 회원 연결 시 회원 UID
  address?: string;
  role?: 'user' | 'admin'; // 사용자 권한 (기본값: user)
  referralCode?: string;           // ✅ 추천인 코드 (CHZ-XXXX 형식)
  isRegistrationComplete: boolean;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

// ✅ UserVehicle - 참조만 저장 (vehicles 컬렉션과 JOIN)
export interface UserVehicle {
  id: string;
  userId: string;

  // Firestore vehicles 컬렉션 참조 (필수)
  brandId: string;    // 예: "tesla", "hyundai", "kia"
  modelId: string;    // 예: "MODEL-3", "IONIQ-5", "EV6"
  year: number;       // 예: 2024
  trimId: string;     // 예: "rwd", "long-range", "exclusive"

  // 사용자 커스텀 정보
  nickname?: string;  // 차량 별명 (예: "내 차")
  isActive: boolean;  // 활성 차량 여부 (메인 차량)

  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

// ✅ EnrichedUserVehicle - JOIN 결과 (vehicles 데이터 포함)
export interface EnrichedUserVehicle extends UserVehicle {
  // vehicles 컬렉션에서 JOIN된 실제 데이터
  vehicleData: VehicleDetails;
}

// Firebase에서 조회한 차량 상세 정보
export interface VehicleDetails {
  modelName: string; // 실제 Firebase 모델명
  imageUrl: string; // Firebase Storage 이미지 URL
  battery: {
    capacity: number; // 배터리 용량 (kWh)
    manufacturer: string; // 배터리 제조사
    cellType: string; // 셀 타입
    voltage: number; // 전압
  };
  performance: {
    range: number; // 주행거리 (km)
    topSpeed: number; // 최고속도 (km/h)
    power: number; // 마력 (hp) 또는 출력 (kW)
    torque: number; // 토크 (Nm)
    efficiency: number; // 연비 (km/kWh)
    acceleration: number; // 0-100km/h 가속 (초)
    driveType: string; // 구동방식
    chargingSpeed?: string; // 충전 성능
    chargingConnector?: string; // 충전 커넥터 규격
  };
}

// Firebase Firestore 트림 구조
export interface FirebaseTrim {
  trimId: string;
  name: string;
  driveType: string;
  yearRange: {
    start: number;
    end: number;
  };
  variants: FirebaseVariant[];
}

// 배터리 옵션 (복수 배터리 제조사 지원)
export interface BatteryOption {
  supplier: string;     // 배터리 제조사
  condition?: string;   // VIN 패턴, 생산 시기 등 조건
}

// Firebase Firestore 변형 구조
export interface FirebaseVariant {
  years?: string[];
  batteryCapacity?: number;
  range?: number;
  trimId?: string;
  trimName?: string;
  supplier?: string;              // 단일 배터리 제조사 (기존 호환)
  batteryOptions?: BatteryOption[]; // 복수 배터리 제조사 (optional, supplier와 상호 배타적)
  cellType?: string;              // "NCM"

  // 직접 필드 (일부 브랜드)
  acceleration?: string | number;  // "5.4초 (0-100km/h)" 또는 숫자
  power?: string;           // "401마력" 형태
  torque?: string;          // "586Nm" 형태
  efficiency?: string;      // "15.8kWh/100km" 형태
  powerMax?: string;        // "350HP" 형태 (다른 브랜드용)
  topSpeed?: number;
  driveType?: string;
  motor?: string;
  chargingSpeed?: string;
  imageUrl?: string;        // variant 이미지

  // specifications 객체 (현대/기아 등)
  specifications?: {
    acceleration?: string;   // "8.5초 (0-100km/h)"
    power?: string;         // "125kW"
    torque?: string;        // "350Nm"
    efficiency?: string;    // "21.2kWh/100km"
    motor?: string;         // "단일 후륜 모터"
    chargingSpeed?: string; // "11kW (AC), 233kW (DC)"
    chargingConnector?: string; // "CCS2"
  };
}

// ✅ Firebase YearTemplate 구조 (연도별 트림 템플릿)
// 위치: /vehicles/{brandId}/models/{modelId}/yearTemplates/{templateId}
export interface YearTemplate {
  trimId: string;           // 트림 ID (예: "standard", "long-range")
  trimName: string;         // 트림명 (예: "스탠다드", "롱 레인지")
  name: string;             // 템플릿 이름 (예: "standard_2022_2023")
  years: number[];          // 해당 연도들 (예: [2022, 2023])

  // 이미지
  images?: {
    main?: string;          // 메인 이미지 URL
  };

  // 배터리 스펙 (YearTemplate 우선)
  specs?: {
    supplier?: string;      // 배터리 제조사 (예: "SK온", "SVOLT")
    type?: string;          // 배터리 타입 (예: "NCM", "LFP")
    voltage?: number;       // 전압 (예: 400)
  };

  // 연도별 variants
  variants?: Array<{
    years?: number[];       // 해당 연도들
    batteryCapacity?: number; // 배터리 용량
    range?: number;         // 주행거리
    supplier?: string;      // 배터리 제조사 (단일, 기존 호환)
    batteryOptions?: BatteryOption[]; // 복수 배터리 제조사 (optional)
    cellType?: string;      // 셀 타입
    imageUrl?: string;      // 이미지 URL
    specifications?: {
      motor?: string;
      power?: string;
      torque?: string;
      acceleration?: string;
      topSpeed?: string;
      efficiency?: string;
      chargingSpeed?: string;
      chargingConnector?: string;
    };
  }>;

  createdAt?: Date | FieldValue;
  updatedAt?: Date | FieldValue;
}

export interface DiagnosisReservation {
  id: string;
  userId?: string;              // Optional for web compatibility (웹은 자동생성 사용자 ID)
  userName: string;             // Required (웹과 동일)
  userPhone: string;            // Required (웹과 동일)
  address: string;
  detailAddress?: string;
  latitude: number;
  longitude: number;
  vehicleBrand: string;         // Required (웹과 동일)
  vehicleModel: string;         // Required (웹과 동일)
  vehicleYear: string;          // Required (웹과 동일)
  serviceType: string;          // Required (웹과 동일)
  servicePrice: number;         // Required (웹과 동일)
  status: 'pending' | 'pending_payment' | 'confirmed' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled';
  requestedDate: Date | FieldValue;
  notes?: string;
  adminNotes?: string;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
  source?: 'web' | 'app';       // 예약 출처 구분 (웹과 동일)

  // 정비사 할당 정보
  assignedTo?: string;          // 정비사 UID
  assignedToName?: string;      // 정비사 이름 (표시용)
  assignedAt?: Date | FieldValue; // 할당된 시간
  confirmedBy?: string;         // 예약을 확정한 사람 UID (assignedTo와 동일할 수도 있음)

  // 진단 리포트 연결 (2025-11-20 추가)
  reportId?: string | null;     // 제출된 진단 리포트 ID

  // 결제 정보 (2025-11-28 업데이트)
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;           // Firestore payments 문서 ID
  paymentKey?: string;          // Toss Payments paymentKey
  orderId?: string;             // Toss Payments orderId (CHZ_xxx)
  paidAmount?: number;          // 실제 결제 금액
  paidAt?: Date | FieldValue;   // 결제 완료 시간
  paymentMethod?: string;       // 결제 수단 (카드, 가상계좌 등)

  // 카드 결제 정보 (2025-11-30 추가)
  cardCompany?: string;         // 카드사 (예: "신한", "국민")
  cardNumber?: string;          // 카드번호 마스킹 (예: "1234-****-****-5678")
  cardType?: string;            // 카드 타입 (신용/체크/기프트)
  installmentPlanMonths?: number; // 할부 개월 (0이면 일시불)
}

export interface DiagnosisReportFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface DiagnosisReport {
  id: string;
  userId: string;
  title: string;
  description?: string;
  files: DiagnosisReportFile[];
  status: 'uploaded' | 'processing' | 'completed';
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

// 차량 진단 리포트 세부 항목
export interface DiagnosisDetail {
  category: string; // 구분 (SOH, 셀 불량 여부 등)
  measuredValue?: string; // 측정값
  interpretation?: string; // 해석
  status?: string; // 상태
  description?: string; // 설명
}

// 배터리 셀 정보
export interface BatteryCell {
  id: number; // 셀 번호
  isDefective: boolean; // 불량 여부
  voltage?: number | string; // 전압 (입력 중에는 string, 저장 시 number)
  temperature?: number; // 온도 (옵션)
}

// 주요 장치 검사 항목
export interface MajorDeviceItem {
  name: string; // 항목명
  status?: 'good' | 'problem'; // 상태 (양호/문제 있음)
  issueDescription?: string; // 문제 내용
  imageUris?: string[]; // 이미지 URI 배열 (MultipleImagePicker 사용)
}

// 주요 장치 검사 (조향, 제동, 전기)
export interface MajorDevicesInspection {
  steering?: {
    powerSteeringOilLeak?: MajorDeviceItem; // 동력조향 작동 오일 누유
    steeringGear?: MajorDeviceItem; // 스티어링 기어
    steeringPump?: MajorDeviceItem; // 스티어링 펌프
    tierodEndBallJoint?: MajorDeviceItem; // 타이로드엔드 및 볼 조인트
  };
  braking?: {
    brakeOilLevel?: MajorDeviceItem; // 브레이크 오일 유량 상태
    brakeOilLeak?: MajorDeviceItem; // 브레이크 오일 누유
    boosterCondition?: MajorDeviceItem; // 배력장치 상태
  };
}

// 차량 외부 점검 (Vehicle Exterior Inspection)
export interface VehicleExteriorInspection {
  // 차량 외부 촬영
  vehicleExterior: {
    front?: string; // 차량 앞
    leftSide?: string; // 차량 좌측(운전석)
    rear?: string; // 차량 뒤
    rightSide?: string; // 차량 우측(동승석)
  };

  // 외판 수리/교체 확인 및 도막 측정 (PaintThicknessInspection 배열로 사용)
  bodyPanel: PaintThicknessInspection[];

  // 타이어 및 휠
  tiresAndWheels: {
    driverFront?: TireAndWheelItem; // 운전석 앞
    driverRear?: TireAndWheelItem; // 운전석 뒤
    passengerRear?: TireAndWheelItem; // 동승석 뒤
    passengerFront?: TireAndWheelItem; // 동승석 앞
  };
}

// 타이어 및 휠 항목
export interface TireAndWheelItem {
  treadDepth?: number; // 트레드 깊이 (mm)
  wheelStatus?: 'good' | 'problem'; // 휠 상태
  wheelIssueDescription?: string; // 휠 문제 내용
  imageUris?: string[]; // 문제 사진
}

// 차량 하부 점검 (Vehicle Undercarriage Inspection)
export interface VehicleUndercarriageInspection {
  // 서스펜션 암 및 링크 구조물 촬영
  suspensionArms: {
    driverFrontWheel?: string; // 운전석 앞 바퀴
    driverRearWheel?: string; // 운전석 뒤 바퀴
    passengerRearWheel?: string; // 동승석 뒤 바퀴
    passengerFrontWheel?: string; // 동승석 앞 바퀴
  };

  // 하부 배터리 팩 상태 촬영
  underBatteryPack: {
    front?: string; // 앞
    leftSide?: string; // 좌측(운전석)
    rear?: string; // 뒤
    rightSide?: string; // 우측(동승석)
  };

  // 조향 장치 검사
  steering: {
    powerSteeringOilLeak?: MajorDeviceItem; // 동력조향 작동 오일 누유
    steeringGear?: MajorDeviceItem; // 스티어링 기어
    steeringPump?: MajorDeviceItem; // 스티어링 펌프
    tierodEndBallJoint?: MajorDeviceItem; // 타이로드엔드 및 볼 조인트
  };

  // 제동 장치 검사
  braking: {
    brakeOilLevel?: MajorDeviceItem; // 브레이크 오일 유량 상태
    brakeOilLeak?: MajorDeviceItem; // 브레이크 오일 누유
    boosterCondition?: MajorDeviceItem; // 배력장치 상태
  };
}

// 차량 실내 점검 (Vehicle Interior Inspection) - 신규
export interface VehicleInteriorInspection {
  // 내장재 상태
  interior: {
    driverSeat?: MajorDeviceItem; // 운전석
    passengerSeat?: MajorDeviceItem; // 동승석
    driverRearSeat?: MajorDeviceItem; // 운전석 뒷자리
    passengerRearSeat?: MajorDeviceItem; // 동승석 뒷자리
    ceiling?: MajorDeviceItem; // 천장
    interiorSmell?: MajorDeviceItem; // 실내 냄새
  };

  // 에어컨 및 모터
  airconMotor: {
    airconStatus?: MajorDeviceItem; // 에어컨 작동 상태 및 냄새
    wiperMotor?: MajorDeviceItem; // 와이퍼 모터
    driverWindowMotor?: MajorDeviceItem; // 운전석 윈도우 모터
    driverRearWindowMotor?: MajorDeviceItem; // 운전석 뒷자리 윈도우 모터
    passengerRearWindowMotor?: MajorDeviceItem; // 동승석 뒷자리 윈도우 모터
    passengerWindowMotor?: MajorDeviceItem; // 동승석 윈도우 모터
  };

  // 옵션 및 기능
  options: {
    optionMatch?: MajorDeviceItem; // 옵션 내역 일치 여부
  };

  // 등화장치
  lighting: {
    driverHeadlamp?: MajorDeviceItem; // 운전석 헤드램프/안개등
    passengerHeadlamp?: MajorDeviceItem; // 동승석 헤드램프/안개등
    driverTaillamp?: MajorDeviceItem; // 운전석 테일램프
    passengerTaillamp?: MajorDeviceItem; // 동승석 테일램프
    licensePlateLamp?: MajorDeviceItem; // 번호판등
    interiorLamp?: MajorDeviceItem; // 실내등 앞/뒤
    vanityMirrorLamp?: MajorDeviceItem; // 화장등
  };

  // 유리
  glass: {
    front?: MajorDeviceItem; // 전면
    driverFront?: MajorDeviceItem; // 운전석 앞
    driverRear?: MajorDeviceItem; // 운전석 뒤
    rear?: MajorDeviceItem; // 후면
    passengerRear?: MajorDeviceItem; // 동승석 뒤
    passengerFront?: MajorDeviceItem; // 동승석 앞
  };
}

// 새로운 차량 진단 리포트 구조
// Vehicle trim interfaces (matching Firebase Functions)
export interface VehicleBattery {
  manufacturers: string[];
  capacity: string;
  warranty: string;
  cellType: string;
  variant: string;
}

export interface VehicleSpecs {
  range: string;
  powerMax: string;
  torqueMax: string;
  acceleration?: string;
  topSpeed: string;
  driveType: string;
  efficiency: string;
  seats: number;
}

export interface VehicleTrimData {
  startYear: number;
  endYear?: number;
  battery: VehicleBattery;
  specs: VehicleSpecs;
}

export interface VehicleTrim {
  // 기본 식별 정보
  trimId: string;
  trimName: string;
  brandId: string;
  modelId: string;
  modelName: string;
  driveType: string;

  // ✅ 배터리 정보 (charzing 웹과 동일)
  batteryCapacity: number | string;
  batteryManufacturer?: string;
  batteryType?: string;
  batteryWarranty?: string;
  range?: number | string;

  // ✅ 성능 정보 (charzing 웹과 동일)
  powerMax?: string;
  torqueMax?: string;
  acceleration?: string;
  topSpeed?: string;
  efficiency?: string;

  // ✅ 이미지 및 연도
  imageUrl?: string;
  years: string[];

  // ✅ variants 배열 (연도별 데이터)
  variants?: Array<{
    years: number[];
    capacity: number;
    range: number;
    imageUrl?: string;
    note?: string;
  }>;
}

// Firebase Functions 응답 타입 정의
export interface FirebaseTrimsResponse {
  success: boolean;
  trims?: VehicleTrim[];
  message?: string;
}

// 모델 데이터 타입 (최적화된 버전)
export interface ModelData {
  id: string;
  name: string;
  brandId: string;
  trimsCount?: number;
  startYear?: number;
  endYear?: number;
  // imageUrl 제거 - 클라이언트에서 사용하지 않음
}

// 새로운 이미지 기반 검사 인터페이스
export interface InspectionImageItem {
  id: string; // 고유 ID
  imageUrl: string; // Firebase Storage 이미지 URL
  category: string; // 검사 카테고리 (자유 입력: 정면, 우측, 후면, 좌측 등)
  severity: string; // 심각도 (자유 입력: 정상, 주의, 경고 등)

  // 선택적 메타데이터
  title?: string; // 이미지 제목
  description?: string; // 이미지 설명
  location?: string; // 차량 위치
  recommendations?: string[]; // 권장사항
  estimatedCost?: number; // 예상 수리비용
  notes?: string; // 특이사항
}

// 추가 검사 정보 (텍스트 기반)
export interface AdditionalInspectionInfo {
  category: string; // 자유 입력
  title: string;
  content: string;
  severity: string; // 자유 입력
}

// PDF 검사 리포트
export interface PDFInspectionReport {
  fileName: string; // 파일명
  fileUrl: string; // Firebase Storage URL
  reportType: 'battery_analysis' | 'safety_inspection' | 'performance_test' | 'manufacturer_recall' | 'other';
  issuedBy: string; // 발행기관/업체
  issuedDate: Date | string; // 발행일
  keyFindings: string[]; // 주요 발견사항
  recommendations: string[]; // 권장사항
}

// 업로드된 파일
export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadDate: Date | FieldValue;
}

// 차량 사진 검사 항목 (구조화된 형태)
export interface VehiclePhotoInspection {
  // 전체 사진 촬영
  overallPhotos: {
    front?: string; // 차량 앞
    leftSide?: string; // 차량 좌측(운전석)
    rear?: string; // 차량 뒤
    rightSide?: string; // 차량 우측(동승석)
  };

  // 차량 하부 - 서스펜션 암 및 링크 구조물
  suspensionStructure: {
    driverFrontWheel?: string; // 운전석 앞 바퀴
    driverRearWheel?: string; // 운전석 뒤 바퀴
    passengerRearWheel?: string; // 동승석 뒤 바퀴
    passengerFrontWheel?: string; // 동승석 앞 바퀴
  };

  // 차량 하부 - 하부 배터리 팩 상태
  undercarriageBattery: {
    front?: string; // 앞
    leftSide?: string; // 좌측(운전석)
    rear?: string; // 뒤
    rightSide?: string; // 우측(동승석)
  };
}

// 종합 차량 검사 (새로운 구조)
export interface OtherInspectionItem {
  id: string;
  category: string;
  description: string;
  imageUris: string[];
}

export interface ComprehensiveVehicleInspection {
  // 새로운 이미지 기반 검사 구조
  inspectionImages?: InspectionImageItem[]; // 검사 이미지
  additionalInfo?: AdditionalInspectionInfo[]; // 추가 검사 정보
  pdfReports?: PDFInspectionReport[]; // PDF 검사 리포트
  otherInspection?: OtherInspectionItem[]; // 기타 검사 항목

  // 기존 검사 구조 (하위 호환성)
  paintThickness?: PaintThicknessInspection[];
  tireTread?: TireTreadInspection[];
  vehiclePhotos?: VehiclePhotoInspection; // 차량 사진 (전체 사진 + 차량 하부) - 구조화됨
  componentReplacement?: ComponentReplacementInspection[];
}

// 기존 검사 인터페이스들 (하위 호환성)
export interface PaintThicknessInspection {
  location: string;
  thickness?: number;
  status?: 'good' | 'problem';
  imageUris?: string[];
  notes?: string;
}

export interface TireTreadInspection {
  position: 'front_left' | 'front_right' | 'rear_left' | 'rear_right';
  treadDepth: number;
  wearPattern: 'normal' | 'uneven' | 'excessive' | 'inner_wear' | 'outer_wear';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'replace_needed';
  brand?: string;
  size?: string;
  notes?: string;
}

export interface ComponentReplacementInspection {
  componentType: 'brake_pads' | 'brake_discs' | 'air_filter' | 'cabin_filter' | 'wiper_blades' | 'coolant' | 'brake_fluid' | 'other';
  componentName: string;
  currentCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'replace_needed';
  lastReplacedDate?: Date | string;
  recommendedAction: 'monitor' | 'replace_soon' | 'replace_immediate' | 'no_action';
  notes?: string;
}

// ============================================
// 차량 이력 정보 (2025-11-23 추가)
// ============================================

// 차량번호 변경 이력
export interface VehicleNumberChangeHistory {
  changeDate: Date | FieldValue; // 변경 등록일
  reason: string; // 변경 사유 (예: "최초 등록", "번호 변경", "이전 등록")
  vehicleUsage: string; // 차량용도 (예: "개인용", "영업용", "관용", "렌트")
}

// 소유자 변경 이력
export interface OwnerChangeHistory {
  changeDate: Date | FieldValue; // 변경 등록일
  vehicleUsage: string; // 차량용도
}

// 차량 이력 정보
export interface VehicleHistoryInfo {
  vehicleNumberChangeHistory: VehicleNumberChangeHistory[]; // 차량번호 변경 이력 배열
  ownerChangeHistory: OwnerChangeHistory[]; // 소유자 변경 이력 배열
}

// ============================================
// 사고/수리 이력 (2025-11-23 추가)
// ============================================

// 수리 유형
export type RepairType = '도장' | '탈착' | '교환' | '판금' | '수리' | '기타';

// 수리 부위 항목
export interface RepairPartItem {
  partName: string; // 부위 이름 (예: "앞범퍼", "보닛")
  repairTypes: RepairType[]; // 해당 부위의 수리 유형들
}

// 사고/수리 기록
export interface AccidentRepairRecord {
  accidentDate: Date | FieldValue; // 사고 날짜
  repairParts: RepairPartItem[]; // 수리된 부위 목록
  summary?: string; // 수리 내역 요약
  // 내 차 사고 비용
  myCarPartsCost?: number; // 부품비
  myCarLaborCost?: number; // 공임비
  myCarPaintingCost?: number; // 도장비
  // 상대 차 사고 비용
  otherCarPartsCost?: number; // 부품비
  otherCarLaborCost?: number; // 공임비
  otherCarPaintingCost?: number; // 도장비
}

// 사고/수리 이력
export interface AccidentRepairHistory {
  records: AccidentRepairRecord[]; // 사고 이력 배열
}

// 상태 변경 이력 (감사 추적)
export interface StatusChangeLog {
  from: string; // 이전 상태
  to: string; // 변경된 상태
  changedBy: string; // 변경한 사람 UID (관리자)
  changedByName?: string; // 변경한 사람 이름
  changedAt: Date | FieldValue; // 변경 시간
  reason?: string; // 변경 사유 (반려 시 필수)
}

export interface VehicleDiagnosisReport {
  id: string;
  reservationId?: string | null; // 예약과 연결 (예약으로부터 작성된 경우 필수)
  userId: string;

  // 정비사 정보 (2025-11-20 추가)
  mechanicId?: string; // 작성한 정비사 ID (userId와 다를 수 있음)
  mechanicName?: string; // 작성한 정비사 이름
  submittedAt?: Date | FieldValue; // 제출 시간 (createdAt과 다를 수 있음)

  // 재할당 정보 (2025-11-20 추가 - 안전장치)
  reassignedAt?: Date | FieldValue; // 재할당 시간
  reassignedBy?: string; // 재할당한 관리자 UID
  reassignedReason?: string; // 재할당 사유 (선택)

  // 사용자 정보 (점검시 기록)
  userName?: string; // 사용자 이름
  userPhone?: string; // 사용자 전화번호
  userPhoneNormalized?: string; // ✅ 검색 최적화용 (숫자만)
  isGuest?: boolean; // ✅ Guest user 리포트 여부

  // 차량 기본 정보
  vehicleBrand: string; // 차량 브랜드 (필수)
  vehicleName: string; // 차량명
  vehicleGrade?: string; // 등급/트림 (선택사항)
  vehicleYear: string; // 차량 년식
  vehicleVIN?: string; // 차대번호 (Vehicle Identification Number)
  vehicleVinImageUris?: string[]; // 차대번호 사진 URIs (복수)
  diagnosisDate: Date | FieldValue; // 진단 날짜

  // 차량 상태 정보
  mileage?: number; // 주행거리 (km)
  dashboardImageUris?: string[]; // 계기판 사진 URIs (복수)
  dashboardStatus?: 'good' | 'problem'; // 계기판 상태 (양호/문제있음)
  dashboardIssueDescription?: string; // 계기판 문제 설명
  isVinVerified?: boolean; // 차대번호 동일성 확인
  hasNoIllegalModification?: boolean; // 불법 구조변경 없음
  hasNoFloodDamage?: boolean; // 침수 이력 없음
  carKeyCount: number; // 차키 개수 (필수)

  // 배터리 정보 확인 (v2: 상세 데이터는 admin에서 입력)
  batteryInfoChecked?: boolean; // OBD로 배터리 정보 확인 완료 여부

  // 배터리 진단 정보 (admin에서 입력, 앱에서는 null)
  cellCount?: number | null; // 셀 개수
  defectiveCellCount?: number | null; // 불량 개수
  normalChargeCount?: number | null; // 일반 충전 횟수
  fastChargeCount?: number | null; // 급속 충전 횟수
  sohPercentage?: number | null; // SOH(%)
  realDrivableDistance?: string | null; // 실 주행 가능 거리
  
  // 전압 정보 (admin에서 입력)
  totalVoltage?: number | null; // 총 전압
  maxVoltage?: number | null; // 최대 전압
  minVoltage?: number | null; // 최소 전압

  // 셀 정보 (admin에서 입력)
  cellsData?: BatteryCell[] | null; // 개별 셀 상태 데이터

  // 진단 세부 결과
  diagnosisDetails?: DiagnosisDetail[];
  
  // 업로드된 파일들
  uploadedFiles?: UploadedFile[];
  
  // 종합 차량 검사 (새로운 구조)
  comprehensiveInspection?: ComprehensiveVehicleInspection;

  // 주요 장치 검사 (조향, 제동, 전기)
  majorDevicesInspection?: MajorDevicesInspection;

  // 차량 외부 점검 (신규)
  vehicleExteriorInspection?: VehicleExteriorInspection;

  // 차량 하부 점검 (신규)
  vehicleUndercarriageInspection?: VehicleUndercarriageInspection;

  // 차량 실내 점검 (신규)
  vehicleInteriorInspection?: VehicleInteriorInspection;

  // 차량 이력 정보 (신규 2025-11-23)
  vehicleHistoryInfo?: VehicleHistoryInfo;

  // 사고/수리 이력 (신규 2025-11-23)
  accidentRepairHistory?: AccidentRepairHistory;

  // 진단사 수행 확인 (신규)
  diagnosticianConfirmation?: {
    confirmed: boolean;
    diagnosticianName: string;
    signatureDataUrl: string;
    confirmedAt: string;
  };

  // 메타 정보
  status: 'draft' | 'pending_review' | 'published' | 'rejected'; // ⭐ approved 제거
  statusHistory?: StatusChangeLog[]; // ⭐ 상태 변경 이력 (감사 추적)
  rejectionReason?: string; // ⭐ 반려 사유 (rejected 시)
  reviewComment?: string; // 검수 의견 (rejected 시 사유) - 하위 호환
  reviewedBy?: string; // 검수자 UID (admin)
  reviewedAt?: Date | FieldValue; // 검수 일시
  publishedBy?: string; // ⭐ 발행자 UID (admin)
  publishedAt?: Date | FieldValue; // ⭐ 발행 일시
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
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

/**
 * 전화번호 정규화 (숫자만 추출)
 * 예: "010-1234-5678" → "01012345678"
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/[^0-9]/g, '');
};

class FirebaseService {
  private readonly CLOUD_FUNCTION_URL: string;

  // Firebase 인스턴스들을 getter로 지연 로딩
  private get db() {
    return getDb();
  }

  private get auth() {
    return getAuthInstance();
  }

  private get storage() {
    return getStorageInstance();
  }

  private get functions() {
    return getFunctionsInstance();
  }

  // 컬렉션 참조들도 getter로 변경
  private get usersCollectionRef() {
    return collection(this.db, 'users');
  }

  private get diagnosisReservationsRef() {
    return collection(this.db, 'diagnosisReservations');
  }

  private get diagnosisReportsRef() {
    return collection(this.db, 'diagnosisReports');
  }

  private get vehicleDiagnosisReportsRef() {
    return collection(this.db, 'vehicleDiagnosisReports');
  }

  private get settingsRef() {
    return collection(this.db, 'settings');
  }

  constructor() {
    this.CLOUD_FUNCTION_URL = Constants.expoConfig?.extra?.CLOUD_FUNCTION_URL || 
      'https://asia-northeast3-charzing-d1600.cloudfunctions.net';
  }

  /**
   * Firebase 초기화 완료까지 대기
   * 서비스 호출 전에 Firebase가 완전히 준비될 때까지 기다림
   */
  private async waitForFirebaseReady(): Promise<void> {
    try {
      // 동적 import로 순환 참조 방지
      const { firebaseFacade } = await import('../firebase/config');
      
      if (!firebaseFacade) {
        throw new Error('Firebase Facade를 찾을 수 없습니다.');
      }
      
      // 최대 10초까지 기다림
      const maxWaitTime = 10000;
      const checkInterval = 100;
      let waited = 0;

      while (!firebaseFacade.isReady() && waited < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }

      if (!firebaseFacade.isReady()) {
        throw new Error('Firebase가 초기화 중입니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (error) {
      handleFirebaseError(error, {
        actionName: 'check_firebase_readiness'
      });
    }
  }
  
  // 스케줄 설정 캐시
  private scheduleSettingsCache: ScheduleSettings | null = null;
  private scheduleSettingsCacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

  /**
   * Firebase Auth ID Token 가져오기
   */
  private async getIdToken(): Promise<string> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('로그인이 필요합니다');
    }
    return await currentUser.getIdToken();
  }

  /**
   * Cloud Function 직접 HTTP 호출 (Firebase Functions SDK 없이)
   */
  async callCloudFunction(functionName: string, data: unknown = {}): Promise<unknown> {
    try {
      devLog.log(`🌩️ Cloud Function 호출 (Callable): ${functionName}`);

      // httpsCallable을 사용하여 Callable Function 호출
      const callable = httpsCallable(this.functions, functionName);
      const result = await callable(data);

      devLog.log(`✅ Cloud Function 호출 성공: ${functionName}`);
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      devLog.error(`❌ Cloud Function 호출 실패 (${functionName}):`, errorMessage);
      throw error;
    }
  }

  /**
   * 인증 없이 Cloud Function 호출 (로그인 전용)
   */
  async callCloudFunctionWithoutAuth(functionName: string, data: any = {}): Promise<any> {
    try {
      devLog.log(`🌩️ Cloud Function 직접 호출 (인증 없음): ${functionName}`);
      
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/${functionName}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      devLog.log(`✅ Cloud Function 호출 성공 (인증 없음): ${functionName}`);
      return response.data;
    } catch (error: any) {
      devLog.error(`❌ Cloud Function 호출 실패 (${functionName}):`, error);
      throw error;
    }
  }

  /**
   * Note: 카카오 로그인은 이제 Cloud Functions에서 처리하므로 이 메서드는 사용하지 않음
   * kakaoLoginService를 대신 사용하세요
   */
  async signInWithKakao() {
    throw new Error('이 메서드는 더 이상 사용되지 않습니다. kakaoLoginService를 사용하세요.');
  }

  /**
   * Note: Custom Token 생성은 이제 Cloud Functions에서 처리
   */
  private async createCustomTokenForKakao(): Promise<string> {
    throw new Error('이 메서드는 더 이상 사용되지 않습니다. Cloud Functions를 사용하세요.');
  }

  /**
   * 사용자 프로필 저장/업데이트 (merge 옵션 사용)
   */
  async createOrUpdateUser(userProfile: Partial<UserProfile>): Promise<void> {
    return this.saveUserProfile(userProfile as any);
  }

  /**
   * Guest user 생성 (UUID 기반)
   * 수동 검사 시 비회원 사용자를 위한 임시 계정 생성
   */
  async createGuestUser(displayName: string, phoneNumber: string): Promise<{ uid: string; user: UserProfile }> {
    try {
      // 🔥 1. UUID 기반 guest UID 생성
      const guestUid = `guest_${uuidv4()}`;
      const cleanPhone = normalizePhoneNumber(phoneNumber);

      devLog.log(`👤 Guest 계정 생성 시작: ${guestUid}`, { displayName, phoneNumber: cleanPhone });

      // 🔥 2. Guest user 프로필 생성
      const guestUserProfile: UserProfile = {
        uid: guestUid,
        displayName,
        phoneNumber: cleanPhone,
        phoneNumberNormalized: cleanPhone, // ✅ 검색 최적화용
        email: '',                         // ✅ Cloud Functions와 동일 (빈 문자열)
        isGuest: true,                     // ✅ Guest 구분 필드
        provider: 'email',                 // ✅ Guest는 email provider로 표시
        isRegistrationComplete: false,     // Guest는 미완료 상태
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 🔥 3. Firestore users 컬렉션에 저장
      const userDocRef = doc(this.db, 'users', guestUid);
      await setDoc(userDocRef, {
        ...guestUserProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      devLog.log(`✅ Guest 계정 생성 완료: ${guestUid}`);
      logger.firebaseOperation('create_guest_user', 'users', true, undefined, guestUid);

      return { uid: guestUid, user: guestUserProfile };
    } catch (error) {
      devLog.error('❌ Guest 계정 생성 실패:', error);
      logger.firebaseOperation('create_guest_user', 'users', false, error);
      throw error;
    }
  }

  /**
   * Guest user → 회원 연결 (리포트 데이터 이전)
   * 회원가입 후 전화번호로 기존 guest를 찾아서 모든 데이터를 회원 계정으로 연결
   */
  async linkGuestToMember(guestUid: string, memberUid: string): Promise<void> {
    try {
      devLog.log(`🔗 Guest → 회원 연결 시작:`, { guestUid, memberUid });

      // 🔥 1. Guest user 존재 확인
      const guestRef = doc(this.db, 'users', guestUid);
      const guestSnap = await getDoc(guestRef);

      if (!guestSnap.exists()) {
        throw new Error(`Guest user not found: ${guestUid}`);
      }

      const guestData = guestSnap.data();
      if (!guestData.isGuest) {
        throw new Error(`User is not a guest: ${guestUid}`);
      }

      // 🔥 2. Guest가 가진 모든 리포트 조회
      const reportsQuery = query(
        collection(this.db, 'vehicleDiagnosisReports'),
        where('userId', '==', guestUid)
      );
      const reportsSnap = await getDocs(reportsQuery);

      devLog.log(`📋 발견된 리포트: ${reportsSnap.size}개`);

      // 🔥 3. Batch로 한 번에 업데이트
      const batch = writeBatch(this.db);

      // 3-1) 리포트 userId 변경
      reportsSnap.forEach((reportDoc) => {
        batch.update(reportDoc.ref, {
          userId: memberUid,
          isGuest: false, // 회원으로 전환
          updatedAt: serverTimestamp(),
        });
      });

      // 3-2) Guest user 문서에 mergedInto 기록
      batch.update(guestRef, {
        mergedInto: memberUid,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      devLog.log(`✅ Guest → 회원 연결 완료: ${reportsSnap.size}개 리포트 이전`);
      logger.firebaseOperation('link_guest_to_member', 'users', true, undefined, guestUid);
    } catch (error) {
      devLog.error('❌ Guest → 회원 연결 실패:', error);
      logger.firebaseOperation('link_guest_to_member', 'users', false, error);
      throw error;
    }
  }

  /**
   * 전화번호로 Guest 찾기 및 회원 연결 (자동 연결용)
   * 회원가입 직후 전화번호로 기존 guest를 찾아서 자동으로 연결
   */
  async linkGuestsByPhoneNumber(memberUid: string, phoneNumber: string): Promise<number> {
    try {
      const normalized = normalizePhoneNumber(phoneNumber);
      devLog.log(`🔍 전화번호로 Guest 찾기:`, { memberUid, phoneNumber: normalized });

      // 🔥 1. 같은 전화번호의 모든 guest 찾기
      const guestsQuery = query(
        collection(this.db, 'users'),
        where('phoneNumberNormalized', '==', normalized),
        where('isGuest', '==', true)
      );
      const guestsSnap = await getDocs(guestsQuery);

      devLog.log(`👥 발견된 Guest: ${guestsSnap.size}명`);

      if (guestsSnap.empty) {
        return 0;
      }

      // 🔥 2. 각 guest를 member에 연결 (이미 연결된 것은 건너뛰기)
      let linkedCount = 0;
      let skippedCount = 0;
      for (const guestDoc of guestsSnap.docs) {
        const guestData = guestDoc.data();

        // ✅ 이미 다른 계정에 연결된 Guest는 건너뛰기
        if (guestData.mergedInto) {
          devLog.log(`⏭️ 이미 연결된 Guest 건너뛰기: ${guestDoc.id} → ${guestData.mergedInto}`);
          skippedCount++;
          continue;
        }

        try {
          await this.linkGuestToMember(guestDoc.id, memberUid);
          linkedCount++;
        } catch (error) {
          devLog.error(`❌ Guest 연결 실패: ${guestDoc.id}`, error);
          // 하나 실패해도 계속 진행
        }
      }

      devLog.log(`✅ 전화번호 기반 Guest 연결 완료: ${linkedCount}개 연결, ${skippedCount}개 건너뜀`);
      return linkedCount;
    } catch (error) {
      devLog.error('❌ 전화번호 기반 Guest 연결 실패:', error);
      throw error;
    }
  }

  async saveUserProfile(userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const now = serverTimestamp();
      const userDocRef = doc(this.db, 'users', userProfile.uid);
      
      // undefined 값을 제거한 깨끗한 객체 생성
      const cleanProfile: Partial<UserProfile> & { updatedAt: FieldValue } = {
        updatedAt: now,
      };
      
      // undefined가 아닌 값들만 추가
      if (userProfile.uid !== undefined) cleanProfile.uid = userProfile.uid;
      if (userProfile.email !== undefined) cleanProfile.email = userProfile.email;
      if (userProfile.displayName !== undefined) cleanProfile.displayName = userProfile.displayName;
      if (userProfile.realName !== undefined) cleanProfile.realName = userProfile.realName;
      if (userProfile.photoURL !== undefined) cleanProfile.photoURL = userProfile.photoURL;
      if (userProfile.provider !== undefined) cleanProfile.provider = userProfile.provider;
      if (userProfile.kakaoId !== undefined) cleanProfile.kakaoId = userProfile.kakaoId;
      if (userProfile.appleId !== undefined) cleanProfile.appleId = userProfile.appleId;
      if (userProfile.googleId !== undefined) cleanProfile.googleId = userProfile.googleId;
      if (userProfile.phoneNumber !== undefined) cleanProfile.phoneNumber = userProfile.phoneNumber;
      if (userProfile.address !== undefined) cleanProfile.address = userProfile.address;
      if (userProfile.isRegistrationComplete !== undefined) cleanProfile.isRegistrationComplete = userProfile.isRegistrationComplete;
      
      // merge: true 옵션을 사용해서 기존 데이터와 병합
      await setDoc(userDocRef, cleanProfile, { merge: true });
      
      logger.firebaseOperation('save_user_profile', 'users', true, undefined, userProfile.uid);
    } catch (error) {
      logger.firebaseOperation('save_user_profile', 'users', false, error, userProfile.uid);
      throw error;
    }
  }

  /**
   * 카카오 사용자 프로필을 Firestore에 저장 (Transaction 사용)
   */
  async saveKakaoUserProfile(uid: string, kakaoProfile: any): Promise<{ isNewUser: boolean; user: UserProfile }> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      
      return await runTransaction(this.db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        const now = serverTimestamp();
        
        if (userDoc.exists()) {
          // 기존 사용자 - 로그인 시간만 업데이트
          const existingData = userDoc.data() as UserProfile;
          const updateData: Partial<UserProfile> = {
            updatedAt: now,
            // 카카오 프로필 정보가 변경되었을 수 있으므로 업데이트
            displayName: kakaoProfile.nickname || existingData.displayName,
          };
          
          // 프로필 이미지가 있는 경우에만 업데이트
          if (kakaoProfile.profileImageUrl) {
            updateData.photoURL = kakaoProfile.profileImageUrl;
          }
          
          transaction.update(userDocRef, updateData);
          
          logger.auth('login', 'kakao', true, undefined, uid);
          return { 
            isNewUser: false, 
            user: { 
              ...existingData, 
              updatedAt: new Date(),
              displayName: kakaoProfile.nickname || existingData.displayName,
              photoURL: kakaoProfile.profileImageUrl || existingData.photoURL,
            } 
          };
        } else {
          // 신규 사용자 - 기본 프로필 생성 (회원가입 미완료 상태)
          // 카카오에서는 닉네임만 확실하게 받아올 수 있음
          const newUserProfile: UserProfile = {
            uid,
            displayName: kakaoProfile.nickname || '카카오 사용자',
            provider: 'kakao',
            kakaoId: kakaoProfile.id,
            isRegistrationComplete: false, // 추가 정보 입력 필요
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // 선택적으로 이메일과 프로필 이미지 추가 (undefined가 아닌 경우에만)
          if (kakaoProfile.email) {
            newUserProfile.email = kakaoProfile.email;
          }
          if (kakaoProfile.profileImageUrl) {
            newUserProfile.photoURL = kakaoProfile.profileImageUrl;
          }
          
          transaction.set(userDocRef, newUserProfile);
          logger.auth('signup', 'kakao', true, undefined, uid);
          return { isNewUser: true, user: newUserProfile };
        }
      });
    } catch (error) {
      logger.firebaseOperation('save_kakao_user_profile', 'users', false, error);
      throw error;
    }
  }

  /**
   * 사용자 문서 존재 여부 확인
   */
  async checkUserDocumentExists(uid: string): Promise<boolean> {
    try {
      // Firebase 초기화 완료 대기
      await this.waitForFirebaseReady();
      
      const userDocRef = doc(this.db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists();
    } catch (error) {
      logger.firebaseOperation('check_user_document_exists', 'users', false, error, uid);
      return false;
    }
  }

  /**
   * 기본 사용자 문서 생성 (Apple/Google용)
   */
  async createUserDocument(uid: string, userInfo: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    provider: 'apple' | 'google' | 'kakao';
    appleId?: string;
    googleId?: string;
    kakaoId?: string;
  }): Promise<void> {
    try {
      // Firebase 초기화 완료 대기
      await this.waitForFirebaseReady();
      
      const userDocRef = doc(this.db, 'users', uid);
      
      const userData = {
        uid,
        email: userInfo.email,
        displayName: userInfo.displayName,
        photoURL: userInfo.photoURL,
        provider: userInfo.provider,
        ...(userInfo.appleId && { appleId: userInfo.appleId }),
        ...(userInfo.googleId && { googleId: userInfo.googleId }),
        ...(userInfo.kakaoId && { kakaoId: userInfo.kakaoId }),
        isRegistrationComplete: false, // 추가 정보 입력 필요
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData);
      logger.firebaseOperation('create_user_document', 'users', true, undefined, uid);
    } catch (error) {
      logger.firebaseOperation('create_user_document', 'users', false, error, uid);
      throw error;
    }
  }

  /**
   * 사용자 문서 생성 또는 업데이트 (upsert)
   */
  async upsertUserDocument(uid: string, userInfo: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    provider: 'apple' | 'google' | 'kakao';
    appleId?: string;
    googleId?: string;
    kakaoId?: string;
  }): Promise<void> {
    try {
      // Firebase 초기화 완료 대기
      await this.waitForFirebaseReady();
      
      const exists = await this.checkUserDocumentExists(uid);
      
      if (!exists) {
        await this.createUserDocument(uid, userInfo);
      } else {
        // 기존 문서가 있으면 기본 정보만 업데이트
        // undefined 값들을 제거하여 Firebase 에러 방지
        const updateData: any = {
          updatedAt: serverTimestamp(),
        };
        
        if (userInfo.email !== undefined) updateData.email = userInfo.email;
        if (userInfo.displayName !== undefined) updateData.displayName = userInfo.displayName;
        if (userInfo.photoURL !== undefined) updateData.photoURL = userInfo.photoURL;
        
        const userDocRef = doc(this.db, 'users', uid);
        await updateDoc(userDocRef, updateData);
        devLog.log('✅ 기존 사용자 문서 업데이트 완료:', uid);
      }
    } catch (error) {
      devLog.error('❌ 사용자 문서 upsert 실패:', error);
      throw error;
    }
  }

  /**
   * 회원가입 완료 처리 (사용자 문서 최초 생성)
   */
  async completeRegistration(
    uid: string,
    registrationData: {
      email?: string;
      displayName: string;
      realName: string;
      phoneNumber: string;
      provider: 'kakao' | 'google' | 'apple';
      photoURL?: string;
      kakaoId?: string;
      googleId?: string;
      appleId?: string;
      agreedToTerms: boolean;
      agreedToPrivacy: boolean;
      agreedAt: Date;
    }
  ): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);

      // 새 사용자 문서 생성 (setDoc 사용) + 기본 알림 설정
      const userData: any = {
        uid,
        email: registrationData.email || '',
        displayName: registrationData.displayName,
        realName: registrationData.realName,
        phoneNumber: registrationData.phoneNumber,
        provider: registrationData.provider,
        photoURL: registrationData.photoURL || '',
        agreedToTerms: registrationData.agreedToTerms,
        agreedToPrivacy: registrationData.agreedToPrivacy,
        agreedAt: registrationData.agreedAt,
        isRegistrationComplete: true,
        // 기본 알림 설정
        notificationSettings: {
          enabled: true,
          reservation: true,
          report: true,
          announcement: true,
          marketing: false,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };

      // undefined가 아닌 경우에만 ID 필드 추가 (Firestore는 undefined 허용 안 함)
      if (registrationData.kakaoId !== undefined) {
        userData.kakaoId = registrationData.kakaoId;
      }
      if (registrationData.googleId !== undefined) {
        userData.googleId = registrationData.googleId;
      }
      if (registrationData.appleId !== undefined) {
        userData.appleId = registrationData.appleId;
      }

      await setDoc(userDocRef, userData);

      devLog.log('✅ 회원가입 완료 - 사용자 문서 + 기본 알림 설정 생성:', uid);
    } catch (error) {
      devLog.error('❌ 회원가입 완료 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 프로필 조회
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      // Firebase 초기화 완료 대기
      await this.waitForFirebaseReady();
      
      const userDocRef = doc(this.db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid,
          email: data?.email,
          displayName: data?.displayName,
          realName: data?.realName,
          photoURL: data?.photoURL,
          provider: data?.provider,
          kakaoId: data?.kakaoId,
          appleId: data?.appleId,
          googleId: data?.googleId,
          phoneNumber: data?.phoneNumber,
          address: data?.address,
          role: data?.role || 'user', // role이 없으면 기본값 'user'
          isRegistrationComplete: data?.isRegistrationComplete ?? false,
          createdAt: data?.createdAt?.toDate(),
          updatedAt: data?.updatedAt?.toDate(),
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      devLog.error('사용자 프로필 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 마지막 로그인 시간 업데이트
   */
  async updateUserLastLogin(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      devLog.log('✅ 마지막 로그인 시간 업데이트:', uid);
    } catch (error) {
      devLog.error('❌ 마지막 로그인 시간 업데이트 실패:', error);
    }
  }

  /**
   * 카카오 ID로 사용자 검색
   */
  async getUserByKakaoId(kakaoId: string): Promise<UserProfile | null> {
    try {
      const q = query(
        this.usersCollectionRef, 
        where('kakaoId', '==', kakaoId), 
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        if (!doc) return null;
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          provider: data.provider,
          kakaoId: data.kakaoId,
          createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt 
            ? (data.createdAt as any).toDate() 
            : data.createdAt instanceof Date 
              ? data.createdAt 
              : new Date(),
          updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt 
            ? (data.updatedAt as any).toDate() 
            : data.updatedAt instanceof Date 
              ? data.updatedAt 
              : new Date(),
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      devLog.error('카카오 ID로 사용자 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 프로필 삭제
   */
  async deleteUserProfile(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      await deleteDoc(userDocRef);
      devLog.log('사용자 프로필 삭제 완료:', uid);
    } catch (error) {
      devLog.error('사용자 프로필 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * Firebase Authentication에 커스텀 토큰으로 로그인
   */
  async signInWithCustomToken(token: string): Promise<void> {
    try {
      await signInWithCustomToken(this.auth, token);
      devLog.log('Firebase 커스텀 토큰 로그인 완료');
    } catch (error) {
      devLog.error('Firebase 커스텀 토큰 로그인 실패:', error);
      throw error;
    }
  }

  /**
   * Firebase Authentication 로그아웃 (현재 사용자가 있는 경우에만)
   */
  async signOut(): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        const userId = currentUser.uid;
        await signOut(this.auth);
        sentryLogger.logLogout(userId);
        devLog.log('Firebase 로그아웃 완료');
      } else {
        devLog.log('Firebase에 로그인된 사용자가 없음 - 로그아웃 스킵');
      }
    } catch (error) {
      devLog.error('Firebase 로그아웃 실패:', error);
      // Firebase 로그아웃 실패해도 앱 상태는 로그아웃으로 처리
      devLog.log('Firebase 로그아웃 실패했지만 앱 로그아웃은 계속 진행');
    }
  }

  /**
   * 현재 Firebase Authentication 사용자 조회
   */
  getCurrentFirebaseUser() {
    return this.auth.currentUser;
  }

  /**
   * 사용자 계정 완전 삭제 (탈퇴)
   */
  async deleteUserAccount(uid: string): Promise<void> {
    try {
      devLog.log('사용자 계정 삭제 시작:', uid);
      
      // 1. Firestore에서 사용자 문서 삭제
      const userDocRef = doc(this.db, 'users', uid);
      await deleteDoc(userDocRef);
      devLog.log('Firestore 사용자 문서 삭제 완료:', uid);
      
      // 2. Firebase Auth에서 사용자 삭제 (로그인되어 있는 경우)
      const currentUser = this.auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        await currentUser.delete();
        devLog.log('Firebase Auth 사용자 삭제 완료:', uid);
      }
      
      devLog.log('✅ 사용자 계정 삭제 완료:', uid);
    } catch (error) {
      devLog.error('❌ 사용자 계정 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 인증 상태 테스트 (디버깅용)
   */
  async testAuth(): Promise<any> {
    try {
      devLog.log('🧪 인증 상태 테스트 시작...');
      
      // 인증 상태 확인
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('사용자가 로그인되지 않았습니다.');
      }
      
      devLog.log('👤 현재 인증된 사용자:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      });
      
      // 토큰 강제 갱신
      devLog.log('🔄 인증 토큰 강제 갱신...');
      const idToken = await currentUser.getIdToken(true);
      devLog.log('✅ 갱신된 토큰 길이:', idToken.length);
      
      if (!idToken) {
        throw new Error('인증 토큰 갱신에 실패했습니다. 다시 로그인해주세요.');
      }
      
      // HTTP 직접 호출로 변경
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/testAuth`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      const result = response.data;
      devLog.log('✅ 인증 테스트 결과:', result);
      return result;
    } catch (error: any) {
      devLog.error('❌ 인증 테스트 실패:', error);
      throw error;
    }
  }

  /**
   * 진단 예약 생성 (강화된 Custom Token으로 Firebase Functions 사용)
   */
  async createDiagnosisReservation(reservationData: Omit<DiagnosisReservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      devLog.log('🌩️ 강화된 Custom Token으로 Firebase Functions 호출:', reservationData);
      
      // 인증 상태 확인
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('사용자가 로그인되지 않았습니다.');
      }
      
      devLog.log('👤 현재 인증된 사용자:', {
        uid: currentUser.uid,
        email: currentUser.email,
        isAnonymous: currentUser.isAnonymous,
        providerId: currentUser.providerId
      });
      
      // 인증 토큰 새로고침 및 검증
      try {
        const idToken = await currentUser.getIdToken(true);
        devLog.log('🔑 강화된 인증 토큰 새로고침 완료, 토큰 길이:', idToken.length);
        
        // 토큰을 디코딩해서 claims 확인 (디버깅용)
        try {
          const tokenPayload = JSON.parse(atob(idToken?.split('.')[1] || ''));
          devLog.log('🔍 토큰 Claims 확인:', {
            provider: tokenPayload.provider || 'N/A',
            kakaoId: tokenPayload.kakaoId || 'N/A',
            canCreateReservation: tokenPayload.canCreateReservation || 'N/A',
            role: tokenPayload.role || 'N/A'
          });
        } catch (decodeError) {
          devLog.log('⚠️ 토큰 디코딩 실패 (정상적일 수 있음)');
        }
        
        if (!idToken || idToken.length < 100) {
          throw new Error('유효하지 않은 인증 토큰');
        }
      } catch (tokenError: any) {
        devLog.error('❌ 인증 토큰 새로고침 실패:', tokenError.message);
        throw new Error('인증 토큰 갱신에 실패했습니다. 다시 로그인해주세요.');
      }
      
      // HTTP 함수로 직접 요청
      const idToken = await currentUser.getIdToken(true);
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/createDiagnosisReservation`,
        reservationData,
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15초 타임아웃
        }
      );
      
      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || '진단 예약 생성 실패');
      }

      logger.reservation('create', data.reservationId, 'pending', currentUser.uid);
      return data.reservationId;
    } catch (error: any) {
      logger.reservation('create_failed', undefined, 'error', this.auth.currentUser?.uid, { error: error.message });
      devLog.error('🔍 에러 상세 정보:', {
        code: error.code,
        message: error.message,
        details: error.details,
        customData: error.customData,
        name: error.name
      });
      
      // 인증 오류 시 재시도 또는 폴백
      if (error.code === 'functions/unauthenticated') {
        devLog.error('🚨 강화된 토큰에도 인증 오류 발생 - 로그 확인 필요');
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
      
      throw error;
    }
  }

  /**
   * 사용자의 진단 예약 목록 조회 (클라이언트 측 직접 접근)
   */
  async getUserDiagnosisReservations(userId: string): Promise<DiagnosisReservation[]> {
    try {
      devLog.log('📱 클라이언트에서 사용자 진단 예약 목록 조회:', userId);
      
      // 현재 로그인한 사용자만 자신의 예약을 조회할 수 있도록 체크
      if (!this.auth.currentUser || this.auth.currentUser.uid !== userId) {
        throw new Error('접근 권한이 없습니다.');
      }

      const reservationsRef = collection(this.db, 'diagnosisReservations');
      const q = query(
        reservationsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const reservations = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          requestedDate: data.requestedDate?.toDate?.()?.toISOString(),
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
        } as DiagnosisReservation;
      });

      logger.firebaseOperation('get_user_reservations', 'diagnosisReservations', true, undefined, userId);
      return reservations;
    } catch (error: any) {
      logger.firebaseOperation('get_user_reservations', 'diagnosisReservations', false, error, userId);
      throw error;
    }
  }

  /**
   * 단일 진단 예약 조회 (ID로)
   */
  async getDiagnosisReservation(reservationId: string): Promise<DiagnosisReservation | null> {
    try {
      devLog.log('📱 진단 예약 조회:', reservationId);

      const reservationRef = doc(this.db, 'diagnosisReservations', reservationId);
      const reservationSnap = await getDoc(reservationRef);

      if (!reservationSnap.exists()) {
        devLog.warn('⚠️  예약을 찾을 수 없습니다:', reservationId);
        return null;
      }

      const data = reservationSnap.data();
      const reservation: DiagnosisReservation = {
        id: reservationSnap.id,
        userId: data.userId,
        userName: data.userName,
        userPhone: data.userPhone,
        vehicleBrand: data.vehicleBrand,
        vehicleModel: data.vehicleModel,
        vehicleYear: data.vehicleYear,
        serviceType: data.serviceType,
        servicePrice: data.servicePrice,
        status: data.status,
        requestedDate: data.requestedDate?.toDate() || new Date(),
        address: data.address,
        detailAddress: data.detailAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        notes: data.notes,
        adminNotes: data.adminNotes,
        assignedTo: data.assignedTo,
        assignedToName: data.assignedToName,
        assignedAt: data.assignedAt?.toDate(),
        confirmedBy: data.confirmedBy,
        reportId: data.reportId,
        paymentStatus: data.paymentStatus,
        paymentId: data.paymentId,
        paymentKey: data.paymentKey,
        orderId: data.orderId,
        paidAmount: data.paidAmount,
        paidAt: data.paidAt?.toDate(),
        paymentMethod: data.paymentMethod,
        cardCompany: data.cardCompany,
        cardNumber: data.cardNumber,
        cardType: data.cardType,
        installmentPlanMonths: data.installmentPlanMonths,
        source: data.source,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };

      devLog.log('✅ 예약 조회 완료:', reservation.id);
      return reservation;
    } catch (error) {
      devLog.error('❌ 예약 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 진단 예약 상태 업데이트
   */
  async updateDiagnosisReservationStatus(reservationId: string, status: DiagnosisReservation['status'], adminNotes?: string): Promise<void> {
    try {
      devLog.log('진단 예약 상태 업데이트:', reservationId, status);

      const reservationRef = doc(this.db, 'diagnosisReservations', reservationId);
      
      const updateData: Partial<DiagnosisReservation> = {
        status,
        updatedAt: serverTimestamp(),
      };
      
      if (adminNotes) {
        updateData.adminNotes = adminNotes;
      }
      
      await updateDoc(reservationRef, updateData);
      
      devLog.log('✅ 진단 예약 상태 업데이트 완료:', reservationId, status);
    } catch (error) {
      devLog.error('❌ 진단 예약 상태 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 진단 예약 취소
   */
  async cancelDiagnosisReservation(reservationId: string, reason?: string): Promise<void> {
    try {
      devLog.log('진단 예약 취소:', reservationId);

      await this.updateDiagnosisReservationStatus(reservationId, 'cancelled', reason);

      devLog.log('✅ 진단 예약 취소 완료:', reservationId);
    } catch (error) {
      devLog.error('❌ 진단 예약 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 예약에 진단 리포트 ID 연결
   * @param reservationId 예약 ID
   * @param reportId 진단 리포트 ID
   * @description 진단 리포트 제출 시 예약 문서에 reportId 저장
   */
  async updateReservationReportId(reservationId: string, reportId: string): Promise<void> {
    try {
      devLog.log('예약에 리포트 ID 연결 및 상태 업데이트:', reservationId, reportId);

      const reservationRef = doc(this.db, 'diagnosisReservations', reservationId);

      await updateDoc(reservationRef, {
        reportId,
        status: 'pending_review',  // ⭐ 리포트 제출 시 예약 상태도 '검수 대기'로 변경
        updatedAt: serverTimestamp(),
      });

      devLog.log('✅ 예약에 리포트 ID 연결 및 상태(pending_review) 업데이트 완료:', reservationId, reportId);
    } catch (error) {
      devLog.error('❌ 예약에 리포트 ID 연결 및 상태 업데이트 실패:', error);
      throw error;
    }
  }

  // ============================================================================
  // 🔒 시간 충돌 검증 헬퍼 (SOLID - Single Responsibility Principle)
  // ============================================================================

  /**
   * 예약에서 시간대 추출
   * @param reservation 진단 예약
   * @param durationHours 예약 소요 시간 (기본 2시간)
   * @returns 시간대 객체
   * @description SRP - 예약 데이터에서 시간대 정보만 추출하는 단일 책임
   */
  private getReservationTimeSlot(
    reservation: DiagnosisReservation,
    durationHours: number = 2
  ): { startTime: Date; endTime: Date } {
    // requestedDate를 Date로 변환
    const startTime = reservation.requestedDate instanceof Timestamp
      ? reservation.requestedDate.toDate()
      : reservation.requestedDate as Date;

    // 종료 시간 계산 (시작 시간 + 소요 시간)
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    return { startTime, endTime };
  }

  /**
   * 두 시간대의 겹침 여부 확인
   * @param slot1 첫 번째 시간대
   * @param slot2 두 번째 시간대
   * @returns 겹침 여부
   * @description SRP - 시간대 겹침 검증만 담당
   *
   * 겹침 조건: slot1.start < slot2.end AND slot2.start < slot1.end
   * 예시:
   *   slot1: 09:00 ~ 11:00
   *   slot2: 10:00 ~ 12:00
   *   → 겹침 (09:00 < 12:00 AND 10:00 < 11:00)
   */
  private hasTimeOverlap(
    slot1: { startTime: Date; endTime: Date },
    slot2: { startTime: Date; endTime: Date }
  ): boolean {
    return slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime;
  }

  /**
   * 정비사의 시간 충돌 예약 확인
   * @param mechanicUid 정비사 UID
   * @param newReservationTime 새 예약 시간대
   * @returns 충돌하는 예약 (없으면 null)
   * @description SRP - 특정 정비사의 시간 충돌만 검증
   */
  private async findConflictingReservation(
    mechanicUid: string,
    newReservationTime: { startTime: Date; endTime: Date }
  ): Promise<DiagnosisReservation | null> {
    try {
      // 해당 정비사의 활성 예약 조회 (confirmed, in_progress)
      const reservationsRef = collection(this.db, 'diagnosisReservations');
      const q = query(
        reservationsRef,
        where('assignedTo', '==', mechanicUid),
        where('status', 'in', ['confirmed', 'in_progress'])
      );

      const querySnapshot = await getDocs(q);

      // 각 예약과 시간 충돌 확인
      for (const docSnapshot of querySnapshot.docs) {
        const existingReservation = docSnapshot.data() as DiagnosisReservation;
        const existingTimeSlot = this.getReservationTimeSlot(existingReservation);

        if (this.hasTimeOverlap(existingTimeSlot, newReservationTime)) {
          return existingReservation;
        }
      }

      return null;
    } catch (error) {
      devLog.error('❌ 시간 충돌 확인 실패:', error);
      throw error;
    }
  }

  // ============================================================================
  // 🔧 정비사 할당 메인 로직
  // ============================================================================

  /**
   * 예약을 정비사에게 할당 (Transaction 사용으로 동시성 제어)
   * @param reservationId 예약 ID
   * @param mechanicUid 정비사 UID
   * @param mechanicName 정비사 이름
   * @returns 할당 성공 여부
   * @throws 이미 할당된 예약인 경우 에러
   * @throws 시간 충돌이 있는 경우 에러
   *
   * @description
   * - Transaction 내에서 할당 중복 방지 (동시성 제어)
   * - 시간 충돌 검증으로 동일 정비사의 중복 예약 방지
   * - SOLID 원칙 준수: 검증 로직은 별도 헬퍼 함수로 분리
   */
  async assignReservationToMechanic(
    reservationId: string,
    mechanicUid: string,
    mechanicName: string
  ): Promise<void> {
    try {
      devLog.log('예약 할당 시도:', { reservationId, mechanicUid, mechanicName });

      const reservationRef = doc(this.db, 'diagnosisReservations', reservationId);

      // Transaction을 사용하여 동시성 문제 방지
      await runTransaction(this.db, async (transaction) => {
        const reservationDoc = await transaction.get(reservationRef);

        if (!reservationDoc.exists()) {
          throw new Error('예약을 찾을 수 없습니다.');
        }

        const reservationData = reservationDoc.data() as DiagnosisReservation;

        // 1️⃣ 이미 할당된 예약인지 확인
        if (reservationData.assignedTo) {
          throw new Error(
            `이미 ${reservationData.assignedToName || '다른 정비사'}에게 할당된 예약입니다.`
          );
        }

        // 2️⃣ 예약 상태가 pending이 아닌 경우 체크
        if (reservationData.status !== 'pending') {
          throw new Error('대기 중인 예약만 할당할 수 있습니다.');
        }

        // 3️⃣ 시간 충돌 확인 (동일 정비사의 다른 예약과 겹치는지)
        const newReservationTime = this.getReservationTimeSlot(reservationData);
        const conflictingReservation = await this.findConflictingReservation(
          mechanicUid,
          newReservationTime
        );

        if (conflictingReservation) {
          // 충돌하는 예약의 시간 정보 포맷팅
          const conflictTime = conflictingReservation.requestedDate instanceof Timestamp
            ? conflictingReservation.requestedDate.toDate()
            : conflictingReservation.requestedDate as Date;

          const timeStr = conflictTime.toLocaleString('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          throw new Error(
            `이미 ${timeStr}에 다른 예약(${conflictingReservation.userName})이 있습니다. 시간이 겹치는 예약은 받을 수 없습니다.`
          );
        }

        // 4️⃣ 모든 검증 통과 - 할당 정보 업데이트
        transaction.update(reservationRef, {
          assignedTo: mechanicUid,
          assignedToName: mechanicName,
          assignedAt: serverTimestamp(),
          confirmedBy: mechanicUid,
          status: 'confirmed',
          updatedAt: serverTimestamp(),
        } as Partial<DiagnosisReservation>);
      });

      devLog.log('✅ 예약 할당 완료:', reservationId);
    } catch (error) {
      devLog.error('❌ 예약 할당 실패:', error);
      throw error;
    }
  }

  /**
   * 예약 담당 해제 (정비사 할당 취소)
   * @description
   * 정비사가 맡은 예약을 다시 대기 상태로 되돌립니다.
   * - 상태를 'confirmed' → 'pending'으로 변경
   * - 할당 정보 제거 (assignedTo, assignedToName, assignedAt, confirmedBy)
   * - Transaction으로 동시성 제어
   */
  async unassignReservationFromMechanic(reservationId: string): Promise<void> {
    try {
      devLog.log('예약 담당 해제 시도:', { reservationId });

      const reservationRef = doc(this.db, 'diagnosisReservations', reservationId);

      // Transaction을 사용하여 동시성 문제 방지
      await runTransaction(this.db, async (transaction) => {
        const reservationDoc = await transaction.get(reservationRef);

        if (!reservationDoc.exists()) {
          throw new Error('예약을 찾을 수 없습니다.');
        }

        const reservationData = reservationDoc.data() as DiagnosisReservation;

        // 할당되지 않은 예약인 경우
        if (!reservationData.assignedTo) {
          throw new Error('담당자가 없는 예약입니다.');
        }

        // 완료/취소된 예약은 담당 해제 불가
        if (reservationData.status === 'completed' || reservationData.status === 'cancelled') {
          throw new Error('완료 또는 취소된 예약은 담당 해제할 수 없습니다.');
        }

        // 할당 정보 제거 및 상태를 pending으로 변경
        transaction.update(reservationRef, {
          assignedTo: deleteField(),
          assignedToName: deleteField(),
          assignedAt: deleteField(),
          confirmedBy: deleteField(),
          status: 'pending',
          updatedAt: serverTimestamp(),
        });
      });

      devLog.log('✅ 예약 담당 해제 완료:', reservationId);
    } catch (error) {
      devLog.error('❌ 예약 담당 해제 실패:', error);
      throw error;
    }
  }

  /**
   * 정비사에게 할당된 예약 목록 조회
   * @param mechanicUid 정비사 UID
   * @param status 조회할 예약 상태 (선택사항)
   * @returns 할당된 예약 목록
   */
  async getMechanicAssignedReservations(
    mechanicUid: string,
    status?: DiagnosisReservation['status']
  ): Promise<DiagnosisReservation[]> {
    try {
      devLog.log('정비사 할당 예약 조회:', { mechanicUid, status });

      const reservationsRef = collection(this.db, 'diagnosisReservations');

      // 쿼리 빌더 패턴 사용 (SOLID의 단일 책임 원칙)
      let q = query(
        reservationsRef,
        where('assignedTo', '==', mechanicUid),
        orderBy('requestedDate', 'desc')
      );

      // 상태 필터가 있으면 추가
      if (status) {
        q = query(q, where('status', '==', status));
      }

      const snapshot = await getDocs(q);

      const reservations: DiagnosisReservation[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as DiagnosisReservation));

      devLog.log('✅ 정비사 할당 예약 조회 완료:', reservations.length);
      return reservations;
    } catch (error) {
      devLog.error('❌ 정비사 할당 예약 조회 실패:', error);
      throw error;
    }
  }

  /**
   * pending 상태의 예약 목록 조회 (모든 정비사가 볼 수 있음)
   * @returns pending 예약 목록
   */
  async getPendingReservations(): Promise<DiagnosisReservation[]> {
    try {
      devLog.log('대기 중인 예약 목록 조회');

      const reservationsRef = collection(this.db, 'diagnosisReservations');
      const q = query(
        reservationsRef,
        where('status', '==', 'pending'),
        orderBy('requestedDate', 'asc')
      );

      const snapshot = await getDocs(q);

      const reservations: DiagnosisReservation[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as DiagnosisReservation));

      devLog.log('✅ 대기 중인 예약 목록 조회 완료:', reservations.length);
      return reservations;
    } catch (error) {
      devLog.error('❌ 대기 중인 예약 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * confirmed 상태의 모든 예약 조회 (할당 정보 포함)
   * @returns confirmed 예약 목록
   */
  async getAllConfirmedReservations(): Promise<DiagnosisReservation[]> {
    try {
      devLog.log('확정된 예약 목록 조회');

      const reservationsRef = collection(this.db, 'diagnosisReservations');
      const q = query(
        reservationsRef,
        where('status', '==', 'confirmed'),
        orderBy('requestedDate', 'asc')
      );

      const snapshot = await getDocs(q);

      const reservations: DiagnosisReservation[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as DiagnosisReservation));

      devLog.log('✅ 확정된 예약 목록 조회 완료:', reservations.length);
      return reservations;
    } catch (error) {
      devLog.error('❌ 확정된 예약 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 예약 수정/취소 가능 여부 확인
   */
  canModifyReservation(reservation: DiagnosisReservation): {
    canModify: boolean;
    canCancel: boolean;
    reason?: string;
  } {
    const now = new Date();
    const reservationDate = reservation.requestedDate instanceof Date
      ? reservation.requestedDate
      : reservation.requestedDate && typeof reservation.requestedDate === 'object' && 'toDate' in reservation.requestedDate
        ? (reservation.requestedDate as Timestamp).toDate()
        : new Date();
    
    // 예약 시간 2시간 전 계산
    const twoHoursBefore = new Date(reservationDate.getTime() - 2 * 60 * 60 * 1000);
    const isPastDeadline = now >= twoHoursBefore;
    
    switch (reservation.status) {
      case 'pending':
        return { canModify: true, canCancel: true };

      case 'pending_payment':
        // 결제 대기 중인 예약은 언제든 취소 가능 (잘못 예약한 경우)
        return { canModify: true, canCancel: true };

      case 'confirmed':
        if (isPastDeadline) {
          return {
            canModify: false,
            canCancel: false,
            reason: '예약 시간 2시간 전까지만 수정/취소 가능합니다.'
          };
        }
        return { canModify: true, canCancel: true };

      case 'in_progress':
        return { 
          canModify: false, 
          canCancel: false, 
          reason: '진행 중인 예약은 수정/취소할 수 없습니다.' 
        };
        
      case 'completed':
        return { 
          canModify: false, 
          canCancel: false, 
          reason: '완료된 예약은 수정/취소할 수 없습니다.' 
        };
        
      case 'cancelled':
        return { 
          canModify: false, 
          canCancel: false, 
          reason: '이미 취소된 예약입니다.' 
        };
        
      default:
        return { canModify: false, canCancel: false };
    }
  }

  /**
   * 예약 정보 수정
   */
  async updateDiagnosisReservation(
    reservationId: string, 
    updateData: Partial<Pick<DiagnosisReservation, 
      'address' | 'detailAddress' | 'latitude' | 'longitude' | 'requestedDate' | 'notes' |
      'vehicleBrand' | 'vehicleModel' | 'vehicleYear' | 'serviceType' | 'servicePrice' |
      'userName' | 'userPhone'
    >>
  ): Promise<void> {
    try {
      devLog.log('🔧 진단 예약 수정 시작:', reservationId);
      devLog.log('📝 수정 데이터:', JSON.stringify(updateData, null, 2));
      
      // requestedDate 로깅 강화
      if (updateData.requestedDate) {
        devLog.log('🕐 수정할 날짜/시간:');
        devLog.log('  - 원본 값:', updateData.requestedDate);
        devLog.log('  - 타입:', typeof updateData.requestedDate);
        devLog.log('  - Date 객체 여부:', updateData.requestedDate instanceof Date);
        devLog.log('  - ISO 문자열:', updateData.requestedDate instanceof Date ? updateData.requestedDate.toISOString() : 'N/A');
        devLog.log('  - 로컬 문자열:', updateData.requestedDate instanceof Date ? updateData.requestedDate.toLocaleString('ko-KR') : 'N/A');
      }
      
      const reservationRef = doc(this.diagnosisReservationsRef, reservationId);
      
      // undefined 값들을 제거하여 Firebase 에러 방지
      const cleanedUpdateData: any = {};
      Object.keys(updateData).forEach(key => {
        const value = updateData[key as keyof typeof updateData];
        if (value !== undefined) {
          cleanedUpdateData[key] = value;
        }
      });
      
      const finalUpdateData = {
        ...cleanedUpdateData,
        updatedAt: serverTimestamp(),
      };
      
      devLog.log('🚀 Firebase로 전송할 최종 데이터:', JSON.stringify(finalUpdateData, null, 2));
      
      await updateDoc(reservationRef, finalUpdateData);
      
      devLog.log('✅ 진단 예약 수정 완료:', reservationId);
    } catch (error) {
      devLog.error('❌ 진단 예약 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 진단 리포트 업로드 (파일과 함께)
   */
  async uploadDiagnosisReport(reportData: {
    userId: string;
    title: string;
    description?: string;
    files: Array<{
      uri: string;
      name: string;
      type: string;
      size: number;
    }>;
    status: 'uploaded' | 'processing' | 'completed';
    createdAt: Date;
  }): Promise<string> {
    try {
      devLog.log('📄 진단 리포트 업로드 시작:', reportData.title);
      
      const reportId = doc(this.diagnosisReportsRef).id;
      
      // 파일들을 Firebase Storage에 업로드
      const uploadedFiles: DiagnosisReportFile[] = [];
      
      for (const file of reportData.files) {
        try {
          // 파일을 Blob으로 변환
          const response = await fetch(file.uri);
          const blob = await response.blob();
          
          // Storage 경로 생성
          const fileName = `${Date.now()}_${file.name}`;
          const storageRef = ref(this.storage, `diagnosisReports/${reportData.userId}/${reportId}/${fileName}`);
          
          // 파일 업로드
          await uploadBytes(storageRef, blob);
          
          // 다운로드 URL 가져오기
          const downloadURL = await getDownloadURL(storageRef);
          
          uploadedFiles.push({
            name: file.name,
            url: downloadURL,
            type: file.type,
            size: file.size,
          });
          
          devLog.log('✅ 파일 업로드 완료:', file.name);
        } catch (fileError) {
          devLog.error('❌ 파일 업로드 실패:', file.name, fileError);
          throw new Error(`파일 업로드 실패: ${file.name}`);
        }
      }
      
      // Firestore에 리포트 정보 저장
      const now = serverTimestamp();
      const reportDocRef = doc(this.diagnosisReportsRef, reportId);
      
      await setDoc(reportDocRef, {
        id: reportId,
        userId: reportData.userId,
        title: reportData.title,
        description: reportData.description || '',
        files: uploadedFiles,
        status: reportData.status,
        createdAt: now,
        updatedAt: now,
      });
      
      devLog.log('✅ 진단 리포트 업로드 완료:', reportId);
      return reportId;
    } catch (error) {
      devLog.error('❌ 진단 리포트 업로드 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 진단 리포트 목록 조회
   */
  async getUserDiagnosisReports(userId: string): Promise<DiagnosisReport[]> {
    try {
      devLog.log('📄 사용자 진단 리포트 목록 조회:', userId);
      
      const q = query(
        this.diagnosisReportsRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const reports: DiagnosisReport[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          description: data.description,
          files: data.files,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      
      // 최신순 정렬
      reports.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
        return dateB.getTime() - dateA.getTime();
      });
      
      devLog.log('✅ 진단 리포트 목록 조회 완료:', reports.length, '개');
      return reports;
    } catch (error) {
      devLog.error('❌ 진단 리포트 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 진단 리포트 상세 조회
   */
  async getDiagnosisReport(reportId: string): Promise<DiagnosisReport | null> {
    try {
      devLog.log('📄 진단 리포트 상세 조회:', reportId);
      
      const reportDocRef = doc(this.diagnosisReportsRef, reportId);
      const reportDoc = await getDoc(reportDocRef);
      
      if (!reportDoc.exists()) {
        devLog.log('진단 리포트를 찾을 수 없음:', reportId);
        return null;
      }
      
      const data = reportDoc.data();
      const report: DiagnosisReport = {
        id: reportDoc.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        files: data.files,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
      
      devLog.log('✅ 진단 리포트 상세 조회 완료:', report.title);
      return report;
    } catch (error) {
      devLog.error('❌ 진단 리포트 상세 조회 실패:', error);
      throw error;
    }
  }

  // 스케줄 설정 관련 메서드들
  async getScheduleSettings(): Promise<ScheduleSettings> {
    try {
      // 캐시 확인
      const now = Date.now();
      if (
        this.scheduleSettingsCache && 
        (now - this.scheduleSettingsCacheTime) < this.CACHE_DURATION
      ) {
        return this.scheduleSettingsCache;
      }
      
      devLog.log('📅 스케줄 설정 조회 중...');
      
      const docSnap = await getDoc(doc(this.settingsRef, 'schedule'));
      
      let settings: ScheduleSettings;
      
      if (docSnap.exists()) {
        settings = docSnap.data() as ScheduleSettings;
        devLog.log('✅ 스케줄 설정 조회 완료');
      } else {
        // 기본 스케줄 설정
        settings = {
          workingDays: [1, 2, 3, 4, 5], // 월-금
          workingHours: {
            start: '09:00',
            end: '18:00',
          },
          unavailableSlots: [],
        };
        devLog.log('📅 기본 스케줄 설정 반환');
      }
      
      // 캐시에 저장
      this.scheduleSettingsCache = settings;
      this.scheduleSettingsCacheTime = now;
      
      return settings;
    } catch (error) {
      devLog.error('❌ 스케줄 설정 조회 실패:', error);
      throw error;
    }
  }

  async isTimeSlotAvailable(date: Date, timeSlot: string, excludeReservationId?: string): Promise<boolean> {
    try {
      const settings = await this.getScheduleSettings();
      
      // 운영 요일 확인
      const dayOfWeek = date.getDay();
      if (!settings.workingDays.includes(dayOfWeek)) {
        return false;
      }
      
      // 운영 시간 확인
      const hourParts = timeSlot.split(':').map(Number);
      const startHourParts = settings.workingHours.start.split(':').map(Number);
      const endHourParts = settings.workingHours.end.split(':').map(Number);
      
      const hour = hourParts[0];
      const startHour = startHourParts[0];
      const endHour = endHourParts[0];
      
      if (!hour || !startHour || !endHour || hour < startHour || hour >= endHour) {
        return false;
      }
      
      // 예약 불가 시간 확인
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const unavailableSlot = settings.unavailableSlots.find(slot => slot.date === dateString);
      
      if (unavailableSlot && unavailableSlot.timeSlots.includes(timeSlot)) {
        return false;
      }
      
      // 실제 예약된 시간 슬롯 확인
      const targetDateTime = new Date(date);
      if (typeof hour === 'number') {
        targetDateTime.setHours(hour, 0, 0, 0);
      }
      
      // 해당 시간에 예약된 건이 있는지 확인
      const reservationsRef = collection(this.db, 'diagnosisReservations');
      const reservationQuery = query(
        reservationsRef,
        where('requestedDate', '==', Timestamp.fromDate(targetDateTime)),
        where('status', 'in', ['pending', 'confirmed'])
      );
      
      const querySnapshot = await getDocs(reservationQuery);
      
      // 수정 중인 예약 제외하고 확인
      const conflictingReservations = querySnapshot.docs.filter(doc => {
        if (excludeReservationId && doc.id === excludeReservationId) {
          return false; // 현재 수정 중인 예약은 제외
        }
        return true;
      });
      
      // 예약이 있으면 사용 불가
      if (conflictingReservations.length > 0) {
        devLog.log(`🚫 시간 슬롯 ${timeSlot} 이미 예약됨:`, conflictingReservations.length, '건');
        return false;
      }
      
      return true;
    } catch (error) {
      devLog.error('❌ 시간 슬롯 가용성 확인 실패:', error);
      return false;
    }
  }

  async getAvailableTimeSlots(date: Date): Promise<string[]> {
    try {
      const settings = await this.getScheduleSettings();
      
      // 운영 요일 확인
      const dayOfWeek = date.getDay();
      if (!settings.workingDays.includes(dayOfWeek)) {
        return [];
      }
      
      // 운영 시간 내 모든 시간 슬롯 생성
      const startHourParts = settings.workingHours.start.split(':').map(Number);
      const endHourParts = settings.workingHours.end.split(':').map(Number);
      
      const startHour = startHourParts[0];
      const endHour = endHourParts[0];
      
      if (typeof startHour !== 'number' || typeof endHour !== 'number') {
        return [];
      }
      
      const allSlots: string[] = [];
      for (let hour = startHour; hour < endHour; hour++) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      }
      
      // 예약 불가 시간 제외
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const unavailableSlot = settings.unavailableSlots.find(slot => slot.date === dateString);
      
      if (unavailableSlot) {
        return allSlots.filter(slot => !unavailableSlot.timeSlots.includes(slot));
      }
      
      return allSlots;
    } catch (error) {
      devLog.error('❌ 가용 시간 슬롯 조회 실패:', error);
      return [];
    }
  }

  // Vehicle Diagnosis Reports
  async getVehicleDiagnosisReport(reportId: string): Promise<VehicleDiagnosisReport | null> {
    try {
      const docSnap = await getDoc(doc(this.vehicleDiagnosisReportsRef, reportId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          diagnosisDate: data.diagnosisDate && typeof data.diagnosisDate === 'object' && 'toDate' in data.diagnosisDate 
            ? (data.diagnosisDate as any).toDate() 
            : data.diagnosisDate instanceof Date 
              ? data.diagnosisDate 
              : new Date(),
          createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt 
            ? (data.createdAt as any).toDate() 
            : data.createdAt instanceof Date 
              ? data.createdAt 
              : new Date(),
          updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt 
            ? (data.updatedAt as any).toDate() 
            : data.updatedAt instanceof Date 
              ? data.updatedAt 
              : new Date(),
        } as VehicleDiagnosisReport;
      }
      return null;
    } catch (error) {
      devLog.error('❌ 차량 진단 리포트 조회 실패:', error);
      throw error;
    }
  }

  async getUserVehicleDiagnosisReports(userId: string): Promise<VehicleDiagnosisReport[]> {
    try {
      const q = query(
        this.vehicleDiagnosisReportsRef,
        where('userId', '==', userId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          diagnosisDate: data.diagnosisDate && typeof data.diagnosisDate === 'object' && 'toDate' in data.diagnosisDate 
            ? (data.diagnosisDate as any).toDate() 
            : data.diagnosisDate instanceof Date 
              ? data.diagnosisDate 
              : new Date(),
          createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt 
            ? (data.createdAt as any).toDate() 
            : data.createdAt instanceof Date 
              ? data.createdAt 
              : new Date(),
          updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt 
            ? (data.updatedAt as any).toDate() 
            : data.updatedAt instanceof Date 
              ? data.updatedAt 
              : new Date(),
        } as VehicleDiagnosisReport;
      });
    } catch (error) {
      devLog.error('❌ 사용자 차량 진단 리포트 조회 실패:', error);
      throw error;
    }
  }

  async getReservationVehicleDiagnosisReport(reservationId: string): Promise<VehicleDiagnosisReport | null> {
    try {
      const q = query(
        this.vehicleDiagnosisReportsRef,
        where('reservationId', '==', reservationId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        if (!docData) return null;
        const data = docData.data();
        return {
          id: docData.id,
          ...data,
          diagnosisDate: data.diagnosisDate && typeof data.diagnosisDate === 'object' && 'toDate' in data.diagnosisDate 
            ? (data.diagnosisDate as any).toDate() 
            : data.diagnosisDate instanceof Date 
              ? data.diagnosisDate 
              : new Date(),
          createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt 
            ? (data.createdAt as any).toDate() 
            : data.createdAt instanceof Date 
              ? data.createdAt 
              : new Date(),
          updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt 
            ? (data.updatedAt as any).toDate() 
            : data.updatedAt instanceof Date 
              ? data.updatedAt 
              : new Date(),
        } as VehicleDiagnosisReport;
      }
      return null;
    } catch (error) {
      devLog.error('❌ 예약별 차량 진단 리포트 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 차량 점검 이미지 업로드
   */
  async uploadVehicleInspectionImage(imageUri: string, userId: string): Promise<string> {
    try {
      devLog.log('📸 차량 점검 이미지 업로드 시작:', imageUri);

      // 이미지를 Blob으로 변환
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Storage 경로 생성
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(this.storage, `vehicleInspections/${userId}/${fileName}`);

      // 이미지 업로드
      await uploadBytes(storageRef, blob);

      // 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(storageRef);

      devLog.log('✅ 차량 점검 이미지 업로드 완료:', downloadURL);
      return downloadURL;
    } catch (error) {
      devLog.error('❌ 차량 점검 이미지 업로드 실패:', error);
      throw new Error('이미지 업로드에 실패했습니다.');
    }
  }

  /**
   * 리포트 전용 이미지 업로드 (reportId 기반 경로)
   */
  async uploadReportImage(imageUri: string, reportId: string, imageName: string): Promise<string> {
    try {
      devLog.log(`📸 리포트 이미지 업로드 시작: ${imageName}`, imageUri);

      // 이미지를 Blob으로 변환
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Storage 경로 생성: reports/{reportId}/{imageName}.jpg
      const storageRef = ref(this.storage, `reports/${reportId}/${imageName}.jpg`);

      // 이미지 업로드
      await uploadBytes(storageRef, blob);

      // 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(storageRef);

      devLog.log(`✅ 리포트 이미지 업로드 완료: ${imageName}`, downloadURL);
      return downloadURL;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      devLog.error(`❌ 리포트 이미지 업로드 실패: ${imageName}`, { error, imageUri });
      throw new Error(`${imageName} 업로드 실패: ${errorMessage}`);
    }
  }

  /**
   * Base64 이미지를 Firebase Storage에 업로드
   */
  async uploadBase64Image(base64Data: string, reportId: string, imageName: string): Promise<string> {
    try {
      devLog.log(`✍️ Base64 이미지 업로드 시작: ${imageName}`);

      // base64 데이터를 Blob으로 변환
      const response = await fetch(base64Data);
      const blob = await response.blob();

      // Storage 경로 생성: reports/{reportId}/{imageName}.png
      const storageRef = ref(this.storage, `reports/${reportId}/${imageName}.png`);

      // 이미지 업로드
      await uploadBytes(storageRef, blob);

      // 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(storageRef);

      devLog.log(`✅ Base64 이미지 업로드 완료: ${imageName}`, downloadURL);
      return downloadURL;
    } catch (error) {
      devLog.error(`❌ Base64 이미지 업로드 실패: ${imageName}`, error);
      throw new Error(`${imageName} 이미지 업로드에 실패했습니다.`);
    }
  }

  /**
   * 리포트 ID 생성 (이미지 업로드용)
   */
  generateReportId(): string {
    return doc(collection(this.db, 'vehicleDiagnosisReports')).id;
  }

  /**
   * 차량 진단 리포트 생성 (이미 생성된 ID 사용)
   */
  async createVehicleDiagnosisReport(
    reportId: string,
    reportData: Omit<VehicleDiagnosisReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      devLog.log('📝 차량 진단 리포트 생성 시작:', reportId);

      // 현재 시각
      const now = serverTimestamp();

      // 🔥 undefined 값 제거 (Firestore에서 undefined 허용 안함)
      const cleanData = this.removeUndefinedValues({
        ...reportData,
        id: reportId,
        createdAt: now,
        updatedAt: now,
      });

      devLog.log('📝 정리된 데이터 크기:', JSON.stringify(cleanData).length);

      // Firestore에 저장
      await setDoc(doc(this.db, 'vehicleDiagnosisReports', reportId), cleanData);

      devLog.log('✅ 차량 진단 리포트 생성 완료:', reportId);
      return reportId;
    } catch (error) {
      // 🔥 실제 에러 메시지 로깅 (디버깅용)
      devLog.error('❌ 차량 진단 리포트 생성 실패:', error);
      devLog.error('❌ 에러 상세:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        name: error instanceof Error ? error.name : undefined,
      });

      // 원본 에러 메시지 포함하여 throw
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new Error(`진단 리포트 생성에 실패했습니다: ${errorMessage}`);
    }
  }

  /**
   * 객체에서 undefined 값을 재귀적으로 제거
   */
  private removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item)).filter(item => item !== undefined);
    }

    if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedValues(value);
        }
      }
      return cleaned;
    }

    return obj;
  }

  /**
   * 진단 리포트 수동 재할당 (관리자 전용)
   * @description 자동 매칭 실패 시 관리자가 수동으로 리포트 소유자를 변경하는 안전장치
   * @param reportId 재할당할 리포트 ID
   * @param newUserId 새 소유자 UID
   * @param newUserName 새 소유자 이름
   * @param newUserPhone 새 소유자 전화번호
   * @param adminUid 재할당하는 관리자 UID
   * @param reason 재할당 사유 (선택)
   */
  async reassignDiagnosisReport(
    reportId: string,
    newUserId: string,
    newUserName: string,
    newUserPhone: string,
    adminUid: string,
    reason?: string
  ): Promise<void> {
    try {
      devLog.log('🔄 리포트 재할당 시작:', { reportId, newUserId, adminUid });

      // 1️⃣ 관리자 권한 체크
      const adminProfile = await this.getUserProfile(adminUid);
      if (!adminProfile || adminProfile.role !== 'admin') {
        throw new Error('관리자만 리포트를 재할당할 수 있습니다.');
      }

      // 2️⃣ 기존 리포트 조회
      const reportDoc = await getDoc(doc(this.db, 'vehicleDiagnosisReports', reportId));
      if (!reportDoc.exists()) {
        throw new Error('리포트를 찾을 수 없습니다.');
      }

      const oldReport = reportDoc.data() as VehicleDiagnosisReport;
      const oldUserId = oldReport.userId;

      // 3️⃣ 리포트 소유자 업데이트
      await updateDoc(doc(this.db, 'vehicleDiagnosisReports', reportId), {
        userId: newUserId,
        userName: newUserName,
        userPhone: newUserPhone,
        userPhoneNormalized: normalizePhoneNumber(newUserPhone),
        isGuest: newUserId.startsWith('guest_'),
        reassignedAt: serverTimestamp(),
        reassignedBy: adminUid,
        reassignedReason: reason || undefined,
        updatedAt: serverTimestamp(),
      });

      devLog.log('✅ 리포트 소유자 업데이트 완료');

      // 4️⃣ 연결된 예약도 업데이트 (있으면)
      if (oldReport.reservationId) {
        try {
          await updateDoc(doc(this.db, 'diagnosisReservations', oldReport.reservationId), {
            userId: newUserId,
            userName: newUserName,
            userPhone: newUserPhone,
            updatedAt: serverTimestamp(),
          });
          devLog.log('✅ 연결된 예약 업데이트 완료:', oldReport.reservationId);
        } catch (error) {
          // 예약 업데이트 실패는 치명적이지 않으므로 로그만 남김
          devLog.error('⚠️ 예약 업데이트 실패 (계속 진행):', error);
        }
      }

      // 5️⃣ Sentry 로그
      sentryLogger.log('✅ 리포트 재할당 완료', {
        reportId,
        oldUserId,
        newUserId,
        newUserName,
        newUserPhone,
        adminUid,
        adminName: adminProfile.displayName || adminProfile.email,
        reason: reason || 'N/A',
        reservationId: oldReport.reservationId || 'N/A',
        timestamp: new Date().toISOString(),
      });

      devLog.log('✅ 리포트 재할당 완료:', reportId);
    } catch (error) {
      devLog.error('❌ 리포트 재할당 실패:', error);
      sentryLogger.logError('❌ 리포트 재할당 실패', error as Error, {
        reportId,
        newUserId,
        adminUid,
      });
      throw error;
    }
  }

  /**
   * 사용자 푸시 토큰 저장 (Firebase Functions 사용)
   */
  async saveUserPushToken(userId: string, pushToken: string): Promise<void> {
    try {
      // Firebase 초기화 완료 대기
      await this.waitForFirebaseReady();

      // 현재 사용자 확인
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        devLog.log('⚠️ 인증된 사용자가 없어 푸시 토큰 저장 건너뜀');
        return;
      }

      // Firestore에 직접 저장 (Functions 호출 대신)
      const db = getDb();
      const userRef = doc(db, 'users', userId);

      devLog.log('📝 푸시 토큰 저장 시도:', { userId, pushToken: pushToken.substring(0, 20) + '...' });

      await updateDoc(userRef, {
        pushToken,
        pushTokenUpdatedAt: serverTimestamp(),
      });

      devLog.log('✅ 사용자 푸시 토큰 저장 완료:', userId);
    } catch (error) {
      devLog.error('❌ 사용자 푸시 토큰 저장 실패:', error);
      // 에러를 throw하지 않고 로그만 남김 (앱 중단 방지)
      // throw error;
    }
  }

  /**
   * 수동 푸시 알림 전송 (관리자용)
   */
  async sendPushNotification(userIds: string[], title: string, body: string, data?: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/sendPushNotification`,
        {
          userIds,
          title,
          body,
          data: data || {}
        },
        {
          headers: {
            'Authorization': `Bearer ${await this.getIdToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      if (response.data.success) {
        devLog.log('✅ 푸시 알림 전송 완료:', response.data.message);
        return response.data;
      } else {
        throw new Error(response.data.error || '푸시 알림 전송 실패');
      }
    } catch (error) {
      devLog.error('❌ 푸시 알림 전송 실패:', error);
      throw error;
    }
  }

  /**
   * 푸시 토큰이 있는 사용자 목록 조회 (관리자용)
   */
  async getUsersWithPushTokens(): Promise<any> {
    try {
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/getUsersWithPushTokens`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${await this.getIdToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      if (response.data.success) {
        devLog.log('✅ 사용자 목록 조회 완료:', response.data.message);
        return response.data;
      } else {
        throw new Error(response.data.error || '사용자 목록 조회 실패');
      }
    } catch (error) {
      devLog.error('❌ 사용자 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 알림 설정 저장
   */
  async saveUserNotificationSettings(userId: string, settings: any): Promise<void> {
    try {
      // Firebase 초기화 완료 대기
      await this.waitForFirebaseReady();
      
      const userDoc = doc(this.usersCollectionRef, userId);
      // setDoc with merge를 사용해서 문서가 없어도 생성되도록
      await setDoc(userDoc, {
        notificationSettings: settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      devLog.log('✅ 사용자 알림 설정 저장 완료:', userId);
    } catch (error) {
      devLog.error('❌ 사용자 알림 설정 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 알림 설정 조회
   */
  async getUserNotificationSettings(userId: string): Promise<any | null> {
    try {
      // Firebase 초기화 완료 대기
      await this.waitForFirebaseReady();
      
      const userDoc = doc(this.usersCollectionRef, userId);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.notificationSettings || null;
      }
      return null;
    } catch (error) {
      devLog.error('❌ 사용자 알림 설정 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 푸시 토큰 조회
   */
  async getUserPushToken(userId: string): Promise<string | null> {
    try {
      const userDoc = doc(this.usersCollectionRef, userId);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.pushToken || null;
      }
      return null;
    } catch (error) {
      devLog.error('❌ 사용자 푸시 토큰 조회 실패:', error);
      throw error;
    }
  }

  // === 사용자 차량 관리 메서드들 ===

  /**
   * 사용자 차량 추가 (클라이언트 측 직접 접근)
   */
  async addUserVehicle(vehicleData: Omit<UserVehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      devLog.log('📱 사용자 차량 추가 (참조만 저장):', vehicleData);

      // 현재 로그인한 사용자만 차량을 추가할 수 있도록 체크
      if (!this.auth.currentUser || this.auth.currentUser.uid !== vehicleData.userId) {
        throw new Error('접근 권한이 없습니다.');
      }

      // ✅ 필수 참조 필드 검증
      if (!vehicleData.brandId || !vehicleData.modelId || !vehicleData.trimId) {
        throw new Error('brandId, modelId, trimId는 필수입니다. 차량 선택 시 Firestore ID가 전달되어야 합니다.');
      }

      const now = serverTimestamp();
      const vehicleRef = doc(collection(this.db, 'userVehicles'));

      // ✅ 참조만 저장 (vehicles 컬렉션과 JOIN 방식)
      const completeVehicleData = {
        userId: vehicleData.userId,
        brandId: vehicleData.brandId,
        modelId: vehicleData.modelId,
        year: vehicleData.year,
        trimId: vehicleData.trimId,
        nickname: vehicleData.nickname || '', // ✅ undefined 방지
        isActive: vehicleData.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(vehicleRef, completeVehicleData);

      devLog.log('✅ 사용자 차량 추가 완료 (참조):', {
        id: vehicleRef.id,
        brandId: vehicleData.brandId,
        modelId: vehicleData.modelId,
        year: vehicleData.year,
        trimId: vehicleData.trimId
      });

      logger.vehicle('add', {
        brandId: vehicleData.brandId,
        modelId: vehicleData.modelId,
        year: vehicleData.year
      }, vehicleData.userId);

      return vehicleRef.id;
    } catch (error: any) {
      devLog.error('❌ 사용자 차량 추가 실패:', error);
      logger.vehicle('add_failed', {
        brandId: vehicleData.brandId,
        modelId: vehicleData.modelId
      }, vehicleData.userId, { error: error.message });
      throw error;
    }
  }


  /**
   * 사용자의 차량 목록 조회 (클라이언트 측 직접 접근)
   */
  async getUserVehicles(userId: string): Promise<UserVehicle[]> {
    try {
      // Firebase 초기화 완료 대기
      await this.waitForFirebaseReady();
      
      devLog.log('📱 클라이언트에서 사용자 차량 목록 조회 시작:', userId);
      
      // 현재 로그인한 사용자만 자신의 차량을 조회할 수 있도록 체크
      if (!this.auth.currentUser || this.auth.currentUser.uid !== userId) {
        devLog.log('❌ 접근 권한 없음. currentUser:', this.auth.currentUser?.uid, 'requestedUserId:', userId);
        throw new Error('접근 권한이 없습니다.');
      }

      devLog.log('🔍 Firestore 쿼리 생성 중...');
      const vehiclesRef = collection(this.db, 'userVehicles');
      const q = query(
        vehiclesRef, 
        where('userId', '==', userId)
      );
      
      devLog.log('📤 Firestore 쿼리 실행 중...');
      const querySnapshot = await getDocs(q);
      devLog.log('📥 Firestore 쿼리 결과:', querySnapshot.size, '개 문서');
      
      const vehicles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
        } as UserVehicle;
      });

      logger.firebaseOperation('get_user_vehicles', 'userVehicles', true, undefined, userId);
      return vehicles;
    } catch (error: any) {
      logger.firebaseOperation('get_user_vehicles', 'userVehicles', false, error, userId);
      throw error;
    }
  }

  /**
   * 이미지 URL 정규화 (토큰 제거하고 alt=media 사용)
   * ✅ 이중 인코딩 방지: 이미 올바르게 인코딩된 경로는 그대로 사용
   */
  private normalizeImageUrl(url: string | undefined): string {
    if (!url) return '';

    try {
      // Firebase Storage URL 패턴 확인
      if (!url.includes('firebasestorage.googleapis.com')) {
        return url; // Firebase Storage URL이 아니면 그대로 반환
      }

      const urlObj = new URL(url);

      // 버킷 이름 추출
      const bucketMatch = urlObj.pathname.match(/\/v0\/b\/([^\/]+)\/o\//);
      if (!bucketMatch || !bucketMatch[1]) return url;
      const bucket = bucketMatch[1];

      // 경로에서 /o/ 이후의 경로 추출 (이미 인코딩된 상태)
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
      if (!pathMatch || !pathMatch[1]) return url;

      // ✅ 이미 올바르게 인코딩된 경로는 그대로 사용 (재인코딩 금지)
      const encodedPath = pathMatch[1];

      // ✅ 토큰 제거하고 alt=media만 사용
      const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;

      devLog.log('🔄 URL 정규화:', {
        original: url.substring(0, 100) + '...',
        normalized: newUrl.substring(0, 100) + '...'
      });

      return newUrl;
    } catch (error) {
      devLog.error('❌ URL 정규화 실패:', error);
      return url; // 파싱 실패 시 원본 반환
    }
  }

  /**
   * ✅ Application-level JOIN: userVehicles + vehicles
   * 사용자 차량 참조를 vehicles 컬렉션과 JOIN하여 전체 데이터 반환
   */
  async getUserVehiclesEnriched(userId: string): Promise<EnrichedUserVehicle[]> {
    try {
      devLog.log('🔗 Application-level JOIN 시작:', userId);

      // Step 1: userVehicles 참조 조회
      const userVehicles = await this.getUserVehicles(userId);

      if (userVehicles.length === 0) {
        devLog.log('📭 사용자 차량 없음');
        return [];
      }

      // Step 2: 각 차량 참조를 vehicles 컬렉션과 JOIN
      const enrichedVehicles = await Promise.all(
        userVehicles.map(async (userVehicle) => {
          try {
            // ✅ 필수 참조 필드 검증
            if (!userVehicle.brandId || !userVehicle.modelId || !userVehicle.trimId) {
              throw new Error(
                `❌ 손상된 차량 데이터 (필수 필드 누락): ` +
                `brandId=${userVehicle.brandId}, modelId=${userVehicle.modelId}, trimId=${userVehicle.trimId}. ` +
                `이 차량 문서를 삭제하거나 수정해주세요: ${userVehicle.id}`
              );
            }

            devLog.log('🔍 차량 데이터 조회 중:', {
              brandId: userVehicle.brandId,
              modelId: userVehicle.modelId,
              year: userVehicle.year,
              trimId: userVehicle.trimId
            });

            // ✅ vehicles 컬렉션에서 직접 조회 (brandId 그대로 사용)
            const modelDocRef = doc(
              this.db,
              'vehicles',
              userVehicle.brandId,
              'models',
              userVehicle.modelId
            );
            const modelDoc = await getDoc(modelDocRef);

            if (!modelDoc.exists()) {
              throw new Error(`Vehicle not found: ${userVehicle.brandId}/${userVehicle.modelId}`);
            }

            const vehicleData = modelDoc.data();

            // ✅ YearTemplates 조회 (getVehicleTrims와 동일한 로직)
            const yearTemplatesRef = collection(modelDocRef, 'yearTemplates');
            const yearTemplatesSnapshot = await getDocs(yearTemplatesRef);

            const yearTemplatesByTrim = new Map<string, YearTemplate[]>();
            yearTemplatesSnapshot.forEach((templateDoc) => {
              const templateData = templateDoc.data() as YearTemplate;
              const trimId = templateData.trimId;
              if (trimId) {
                if (!yearTemplatesByTrim.has(trimId)) {
                  yearTemplatesByTrim.set(trimId, []);
                }
                yearTemplatesByTrim.get(trimId)!.push(templateData);
              }
            });

            // 트림 찾기
            const trim = vehicleData.trims?.find(
              (t: any) => t.trimId === userVehicle.trimId
            );

            if (!trim) {
              throw new Error(`Trim not found: ${userVehicle.trimId}`);
            }

            // ✅ YearTemplate 데이터로 enrichment (연도별 매칭)
            const trimTemplates = yearTemplatesByTrim.get(trim.trimId) || [];

            // ✅ 사용자가 선택한 연도에 맞는 YearTemplate 찾기
            const templateForYear = trimTemplates.find((template) =>
              template.years && template.years.includes(userVehicle.year)
            );

            const defaultBattery = vehicleData.defaultBattery || {};

            // ✅ 사용자가 선택한 연도에 맞는 Model variant 찾기
            const variantForYear = trim.variants?.find(
              (v: any) => Array.isArray(v.years) && v.years.includes(userVehicle.year)
            );
            const firstVariant = trim.variants?.[0] || {};

            // ✅ 연도에 맞는 YearTemplate이 있으면 사용, 없으면 Model 데이터 사용
            let batteryManufacturer: string;
            let batteryType: string;
            let batteryVoltage: number;
            let batteryCapacity: number;
            let range: number;
            let chargingSpeed: string | undefined;
            let chargingConnector: string | undefined;

            if (templateForYear) {
              // YearTemplate 존재 - YearTemplate 데이터 사용
              const templateSpecs = templateForYear.specs || {};
              const templateVariant = templateForYear.variants?.[0] || {};

              // ✅ 복수 배터리 제조사 처리
              if (templateVariant.batteryOptions && Array.isArray(templateVariant.batteryOptions)) {
                batteryManufacturer = templateVariant.batteryOptions
                  .map((opt) => opt.supplier)
                  .filter(Boolean)
                  .join(', ') || '미제공';
              } else {
                batteryManufacturer = templateVariant.supplier || templateSpecs.supplier || '미제공';
              }

              batteryType = templateVariant.cellType || templateSpecs.type || '미제공';
              batteryVoltage = templateSpecs.voltage || 400;
              batteryCapacity = templateVariant.batteryCapacity || 0;
              range = templateVariant.range || 0;
              chargingSpeed = templateVariant.specifications?.chargingSpeed;
              chargingConnector = templateVariant.specifications?.chargingConnector;

              devLog.log(`✅ [JOIN] YearTemplate 사용 (${userVehicle.year}년):`, {
                trimId: trim.trimId,
                templateName: templateForYear.name,
                supplier: batteryManufacturer,
                hasBatteryOptions: !!templateVariant.batteryOptions,
                range: range
              });
            } else {
              // YearTemplate 없음 - Model variant 데이터 사용 (연도 매칭)
              const selectedVariant = variantForYear || firstVariant;

              // ✅ 복수 배터리 제조사 처리
              if (selectedVariant.batteryOptions && Array.isArray(selectedVariant.batteryOptions)) {
                batteryManufacturer = selectedVariant.batteryOptions
                  .map((opt: any) => opt.supplier)
                  .filter(Boolean)
                  .join(', ') || '미제공';
              } else {
                batteryManufacturer = selectedVariant.supplier || defaultBattery.supplier || '미제공';
              }

              batteryType = selectedVariant.cellType || defaultBattery.type || '미제공';
              batteryVoltage = selectedVariant.specifications?.voltage || defaultBattery.voltage || 400;
              batteryCapacity = selectedVariant.batteryCapacity || defaultBattery.capacity || 0;
              range = selectedVariant.range || defaultBattery.range || 0;
              chargingSpeed = selectedVariant.specifications?.chargingSpeed;
              chargingConnector = selectedVariant.specifications?.chargingConnector;

              devLog.log(`📋 [JOIN] Model 데이터 사용 (${userVehicle.year}년):`, {
                trimId: trim.trimId,
                reason: 'YearTemplate 없음',
                variantMatched: !!variantForYear,
                supplier: batteryManufacturer,
                hasBatteryOptions: !!selectedVariant.batteryOptions,
                range: range
              });
            }

            // ✅ 이미지 URL (YearTemplate 우선, 웹과 동일한 로직)
            const { generateVehicleImageUrl } = require('@charzing/vehicle-utils');

            let imageUrl: string;

            if (templateForYear) {
              // YearTemplate 있음 - YearTemplate 이미지 우선
              const templateVariant = templateForYear.variants?.[0];
              const templateImage = templateForYear.images?.main;

              // ✅ 웹과 동일: templateImage를 variant.imageUrl보다 우선
              // (variant.imageUrl은 연도별로 다를 수 있지만, template.images.main은 모든 연도에 공통)
              imageUrl = templateImage ||
                        templateVariant?.imageUrl ||
                        trim.imageUrl ||
                        vehicleData.imageUrl ||
                        generateVehicleImageUrl({
                          brandId: userVehicle.brandId,
                          modelId: userVehicle.modelId,
                          year: userVehicle.year
                        });

              devLog.log(`🖼️ [JOIN] YearTemplate 이미지 소스 (${userVehicle.year}년):`, {
                templateImage: templateImage || '없음',
                variantImageUrl: templateVariant?.imageUrl || '없음',
                trimImageUrl: trim.imageUrl || '없음',
                selectedImageUrl: imageUrl
              });
            } else {
              // YearTemplate 없음 - trim 이미지 사용 (연도 매칭)
              const generatedUrl = generateVehicleImageUrl({
                brandId: userVehicle.brandId,
                modelId: userVehicle.modelId,
                year: userVehicle.year
              });

              devLog.log(`🖼️ [JOIN] Model 이미지 소스 확인 (${userVehicle.year}년):`, {
                trimId: trim.trimId,
                variantImageUrl: variantForYear?.imageUrl || '없음',
                trimImageUrl: trim.imageUrl || '없음',
                modelImageUrl: vehicleData.imageUrl || '없음',
                generatedUrl: generatedUrl
              });

              imageUrl = variantForYear?.imageUrl ||
                        trim.imageUrl ||
                        vehicleData.imageUrl ||
                        generatedUrl;

              devLog.log(`🖼️ [JOIN] 최종 선택된 이미지 URL:`, imageUrl);
            }

            // VehicleDetails 구성
            const vehicleDetails: VehicleDetails = {
              modelName: vehicleData.name || userVehicle.modelId,
              imageUrl: this.normalizeImageUrl(imageUrl),
              battery: {
                capacity: batteryCapacity,
                manufacturer: batteryManufacturer,
                cellType: batteryType,
                voltage: batteryVoltage
              },
              performance: {
                range: range,
                power: parseFloat(trim.powerMax || '0') || 0,
                torque: parseFloat(trim.torqueMax || '0') || 0,
                acceleration: parseFloat(trim.acceleration || '0') || 0,
                topSpeed: parseFloat(trim.topSpeed || '0') || 0,
                driveType: trim.driveType || '',
                efficiency: parseFloat(trim.efficiency || '0') || 0,
                chargingSpeed: chargingSpeed || '',
                chargingConnector: chargingConnector
              }
            };

            devLog.log('✅ JOIN 성공:', userVehicle.id);

            return {
              ...userVehicle,
              vehicleData: vehicleDetails
            } as EnrichedUserVehicle;

          } catch (error) {
            devLog.error(`❌ JOIN 실패 (${userVehicle.id}):`, {
              error,
              userVehicle: {
                brandId: userVehicle.brandId,
                modelId: userVehicle.modelId,
                year: userVehicle.year,
                trimId: userVehicle.trimId
              },
              path: `vehicles/${userVehicle.brandId}/models/${userVehicle.modelId}`
            });
            // JOIN 실패 시 null 반환 (필터링됨)
            return null;
          }
        })
      );

      // null 제거
      const validVehicles = enrichedVehicles.filter((v): v is EnrichedUserVehicle => v !== null);

      devLog.log('🎉 Application-level JOIN 완료:', {
        total: userVehicles.length,
        success: validVehicles.length,
        failed: userVehicles.length - validVehicles.length
      });

      return validVehicles;

    } catch (error: any) {
      devLog.error('❌ getUserVehiclesEnriched 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 활성 차량 조회 (Cloud Function 사용)
   */
  async getUserActiveVehicle(userId: string): Promise<UserVehicle | null> {
    try {
      devLog.log('🌩️ Cloud Function으로 사용자 활성 차량 조회:', userId);
      
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/getUserActiveVehicle`,
        { userId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getIdToken()}`,
          },
          timeout: 15000,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || '사용자 활성 차량 조회 실패');
      }

      devLog.log('✅ Cloud Function 사용자 활성 차량 조회 완료');
      return response.data.activeVehicle;
    } catch (error: any) {
      devLog.error('❌ Cloud Function 사용자 활성 차량 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 모든 차량 비활성화
   */
  async deactivateUserVehicles(userId: string): Promise<void> {
    try {
      const q = query(
        collection(this.db, 'userVehicles'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map(doc =>
        updateDoc(doc.ref, { isActive: false, updatedAt: serverTimestamp() })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      devLog.error('❌ 차량 비활성화 실패:', error);
      throw error;
    }
  }

  /**
   * 차량 정보 업데이트
   */
  async updateUserVehicle(
    vehicleId: string,
    updateData: Partial<Pick<UserVehicle, 'nickname' | 'isActive' | 'year' | 'brandId' | 'modelId' | 'trimId'>>
  ): Promise<void> {
    try {
      devLog.log('🚗 차량 정보 업데이트:', vehicleId, updateData);
      
      // 활성 차량으로 설정하는 경우, 기존 활성 차량 비활성화
      if (updateData.isActive === true) {
        const vehicleDoc = await getDoc(doc(this.db, 'userVehicles', vehicleId));
        if (vehicleDoc.exists()) {
          const vehicleData = vehicleDoc.data() as UserVehicle;
          await this.deactivateUserVehicles(vehicleData.userId);
        }
      }
      
      // undefined 값들을 제거하여 Firebase 에러 방지
      const cleanUpdateData: any = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanUpdateData[key] = value;
        }
      });

      const vehicleRef = doc(this.db, 'userVehicles', vehicleId);
      await updateDoc(vehicleRef, {
        ...cleanUpdateData,
        updatedAt: serverTimestamp(),
      });
      
      devLog.log('✅ 차량 정보 업데이트 완료:', vehicleId);
    } catch (error) {
      devLog.error('❌ 차량 정보 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 차량 삭제
   */
  async deleteUserVehicle(vehicleId: string): Promise<void> {
    try {
      devLog.log('🚗 사용자 차량 삭제:', vehicleId);
      
      const vehicleRef = doc(this.db, 'userVehicles', vehicleId);
      await deleteDoc(vehicleRef);
      
      devLog.log('✅ 사용자 차량 삭제 완료:', vehicleId);
    } catch (error) {
      devLog.error('❌ 사용자 차량 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 직접 Firestore에서 브랜드 목록 조회 (성능 개선)
   * 구조: /vehicles/{brandId}
   */
  async getBrands(): Promise<Array<{
    id: string;
    name: string;
    logoUrl?: string;
    modelsCount?: number;
  }>> {
    try {
      devLog.log('🏢 직접 Firestore에서 브랜드 목록 조회');
      
      // vehicles 컬렉션의 모든 브랜드 문서 조회
      const vehiclesSnapshot = await getDocs(collection(this.db, 'vehicles'));
      devLog.log(`🔍 발견된 브랜드 수: ${vehiclesSnapshot.size}`);
      
      const brands: Array<{
        id: string;
        name: string;
        logoUrl?: string;
        modelsCount?: number;
      }> = [];
      
      // 각 브랜드에 대해 정보 수집
      for (const brandDoc of vehiclesSnapshot.docs) {
        const brandId = brandDoc.id;
        const brandData = brandDoc.data();
        
        
        try {
          // 각 브랜드의 models 서브컬렉션에서 모델 수 카운트
          const modelsSnapshot = await getDocs(collection(brandDoc.ref, 'models'));
          
          brands.push({
            id: brandId,
            name: brandData.name || brandId,
            logoUrl: brandData.logoUrl,
            modelsCount: modelsSnapshot.size
          });
          
          devLog.log(`✅ 브랜드 처리 완료: ${brandId} (모델 ${modelsSnapshot.size}개)`);
        } catch (modelError) {
          devLog.error(`⚠️ 브랜드 ${brandId}의 모델 조회 실패:`, modelError);
          // 모델 조회 실패해도 브랜드는 추가
          brands.push({
            id: brandId,
            name: brandData.brandName || brandId,
            logoUrl: brandData.logoUrl,
            modelsCount: 0
          });
        }
      }
      
      devLog.log(`✅ 브랜드 목록 조회 완료: ${brands.length}개`, brands);
      return brands;
      
    } catch (error) {
      devLog.error('❌ 브랜드 목록 조회 실패:', error);
      throw new Error('브랜드 목록 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 직접 Firestore에서 모델 목록 조회 (성능 개선)
   * 구조: /vehicles/{brandId}/models/{modelId}
   */
  async getModels(brandId: string): Promise<ModelData[]> {
    try {
      devLog.log('🚗 직접 Firestore에서 모델 목록 조회:', { brandId });
      
      // 브랜드의 models 서브컬렉션 조회
      const modelsRef = collection(this.db, 'vehicles', brandId, 'models');
      const modelsSnapshot = await getDocs(modelsRef);
      
      devLog.log(`🔍 발견된 모델 수: ${modelsSnapshot.size}`);
      
      const models: ModelData[] = [];
      
      for (const modelDoc of modelsSnapshot.docs) {
        const modelId = modelDoc.id;
        const modelData = modelDoc.data();
        
        
        try {
          // 각 모델의 trims 서브컬렉션에서 트림 수 카운트 (옵셔널)
          const trimsRef = collection(modelDoc.ref, 'trims');
          const trimsSnapshot = await getDocs(trimsRef);
          
          models.push({
            id: modelId,
            name: modelData.name || modelId,
            brandId: brandId,
            trimsCount: trimsSnapshot.size,
            startYear: modelData.startYear,
            endYear: modelData.endYear
          });
          
          devLog.log(`✅ 모델 처리 완료: ${modelId} (트림 ${trimsSnapshot.size}개)`);
        } catch (trimError) {
          devLog.error(`⚠️ 모델 ${modelId}의 트림 조회 실패:`, trimError);
          // 트림 조회 실패해도 모델은 추가
          models.push({
            id: modelId,
            name: modelData.name || modelId,
            brandId: brandId,
            trimsCount: 0,
            startYear: modelData.startYear,
            endYear: modelData.endYear
          });
        }
      }
      
      devLog.log(`✅ 모델 목록 조회 완료: ${models.length}개`, models);
      return models;
      
    } catch (error) {
      devLog.error('❌ 모델 목록 조회 실패:', error);
      throw new Error('모델 목록 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 직접 Firestore에서 차량 트림 조회
   *
   * ✅ Phase 5.1.5-5.4: YearTemplate 우선 조회 로직
   * - YearTemplate의 specs (supplier, type, voltage) 우선 사용
   * - YearTemplate의 variants[0].range 우선 사용
   * - 없으면 Model의 trims/defaultBattery에서 가져오기
   */
  async getVehicleTrims(brandId: string, modelId: string): Promise<VehicleTrim[]> {
    try {
      devLog.log('🚗 차량 트림 조회 시작 (YearTemplate 우선):', { brandId, modelId });

      // 1. 모델 문서 조회: /vehicles/{brandId}/models/{modelId}
      const modelDocRef = doc(this.db, 'vehicles', brandId, 'models', modelId);
      const modelDoc = await getDoc(modelDocRef);

      if (!modelDoc.exists()) {
        devLog.log('⚠️ 모델 문서가 존재하지 않습니다:', { brandId, modelId });
        return [];
      }

      const modelData = modelDoc.data();
      const trims = modelData.trims || [];

      if (!Array.isArray(trims) || trims.length === 0) {
        devLog.log('⚠️ 트림 데이터가 없습니다:', { brandId, modelId });
        return [];
      }

      // 2. YearTemplate 조회: /vehicles/{brandId}/models/{modelId}/yearTemplates
      const yearTemplatesRef = collection(this.db, 'vehicles', brandId, 'models', modelId, 'yearTemplates');
      const yearTemplatesSnapshot = await getDocs(yearTemplatesRef);

      // trimId별로 YearTemplate 배열을 저장 (연도별로 여러 템플릿이 있을 수 있음)
      const yearTemplatesByTrim = new Map<string, YearTemplate[]>();
      yearTemplatesSnapshot.forEach((templateDoc) => {
        const templateData = templateDoc.data() as YearTemplate;
        const trimId = templateData.trimId;
        if (trimId) {
          if (!yearTemplatesByTrim.has(trimId)) {
            yearTemplatesByTrim.set(trimId, []);
          }
          yearTemplatesByTrim.get(trimId)!.push(templateData);
        }
      });

      devLog.log(`📋 YearTemplate 조회 완료: ${yearTemplatesSnapshot.size}개 (트림별 ${yearTemplatesByTrim.size}개)`);

      const vehicleTrims: VehicleTrim[] = [];

      trims.forEach((trim: any) => {
        // 한국 브랜드 구조 (HYUNDAI, KIA, TESLA 등)
        if (trim.trimId && trim.name && trim.variants) {
          const variants = Array.isArray(trim.variants) ? trim.variants : [];

          // ✅ yearRange 추출
          let startYear: number;
          let endYear: number | undefined;

          if (trim.yearRange && trim.yearRange.start) {
            startYear = trim.yearRange.start;
            endYear = trim.yearRange.end || undefined;
            devLog.log(`✅ [${trim.name}] yearRange: ${startYear} - ${endYear || '현재'}`);
          } else {
            // Fallback: variant.years에서 계산
            const allYears = variants.flatMap((variant: any) => {
              if (Array.isArray(variant.years)) {
                return variant.years.map((year: string | number) => parseInt(String(year), 10));
              }
              return [];
            }).filter((year: number) => !isNaN(year)).sort((a: number, b: number) => a - b);

            startYear = allYears.length > 0 ? allYears[0] : new Date().getFullYear();
            endYear = allYears.length > 0 ? allYears[allYears.length - 1] : undefined;
            devLog.log(`⚠️ [${trim.name}] variant.years에서 yearRange 계산: ${startYear} - ${endYear || '현재'}`);
          }

          // ✅ 이 트림의 YearTemplate 목록 가져오기
          const trimTemplates = yearTemplatesByTrim.get(trim.trimId) || [];

          // Fallback 데이터
          const firstVariant = variants[0] || {};
          const defaultBattery = modelData.defaultBattery || {};

          // ✅ 대표 배터리 정보 (첫 번째 템플릿 우선, 없으면 variant/defaultBattery)
          const firstTemplate = trimTemplates[0];
          const templateSpecs = firstTemplate?.specs || {};
          const templateVariant = firstTemplate?.variants?.[0] || {};

          const batteryManufacturer = templateSpecs.supplier || templateVariant.supplier || firstVariant.supplier || defaultBattery.supplier || '미제공';
          const batteryType = templateSpecs.type || templateVariant.cellType || firstVariant.cellType || defaultBattery.type || '미제공';
          const range = templateVariant.range || firstVariant.range || defaultBattery.range || 0;

          vehicleTrims.push({
            // 기본 식별 정보
            trimId: trim.trimId,
            trimName: trim.name,
            brandId: brandId,
            modelId: modelId,
            modelName: modelData.name || modelId,
            driveType: trim.driveType || firstVariant.driveType || 'Unknown',

            // ✅ 배터리 정보 (YearTemplate 우선)
            batteryCapacity: firstVariant.batteryCapacity || defaultBattery.capacity || 0,
            batteryManufacturer: batteryManufacturer,
            batteryType: batteryType,
            batteryWarranty: defaultBattery.warranty || '미제공',
            range: range,

            // ✅ 성능 정보
            powerMax: firstVariant.specifications?.power || trim.powerMax || '미제공',
            torqueMax: firstVariant.specifications?.torque || trim.torqueMax || '미제공',
            acceleration: firstVariant.specifications?.acceleration || trim.acceleration || '미제공',
            topSpeed: trim.topSpeed || '미제공',
            efficiency: firstVariant.specifications?.efficiency || trim.efficiency || '미제공',

            // ✅ 이미지 URL (YearTemplate 우선)
            imageUrl: firstTemplate?.images?.main || modelData.imageUrl || undefined,

            // ✅ 연도 범위
            years: (() => {
              const yearList: string[] = [];
              for (let year = startYear; year <= (endYear || new Date().getFullYear()); year++) {
                yearList.push(year.toString());
              }
              return yearList;
            })(),

            // ✅ variants 배열 (연도별 데이터 - YearTemplate 우선)
            variants: (() => {
              const allYears: number[] = [];
              for (let year = startYear; year <= (endYear || new Date().getFullYear()); year++) {
                allYears.push(year);
              }

              const generatedVariants = allYears.map((year) => {
                // 이 연도에 해당하는 YearTemplate 찾기
                const templateForYear = trimTemplates.find((template) =>
                  template.years && template.years.includes(year)
                );

                if (templateForYear) {
                  // YearTemplate 있으면 우선 사용
                  const templateVar = templateForYear.variants?.[0];
                  return {
                    years: [year],
                    capacity: templateVar?.batteryCapacity || defaultBattery.capacity || 0,
                    range: templateVar?.range || defaultBattery.range || 0,
                    imageUrl: templateForYear.images?.main || templateVar?.imageUrl,
                    note: `YearTemplate: ${templateForYear.name}`
                  };
                } else {
                  // YearTemplate 없으면 Model variant 사용
                  const modelVariant = variants.find((v: any) =>
                    Array.isArray(v.years) && v.years.includes(year) || v.years.includes(String(year))
                  ) || firstVariant;

                  return {
                    years: [year],
                    capacity: modelVariant.batteryCapacity || defaultBattery.capacity || 0,
                    range: modelVariant.range || defaultBattery.range || 0,
                    imageUrl: modelVariant.imageUrl,
                    note: modelVariant.note
                  };
                }
              });

              devLog.log(`📊 [${trim.name}] variants 생성: ${generatedVariants.length}개 연도`);
              return generatedVariants;
            })()
          });

          devLog.log(`✅ [${trim.name}] 트림 데이터 추가 완료:`, {
            batteryManufacturer,
            batteryType,
            range,
            yearTemplatesFound: trimTemplates.length
          });
        }
      });

      devLog.log(`✅ 차량 트림 조회 완료: ${vehicleTrims.length}개`, vehicleTrims);
      return vehicleTrims;

    } catch (error) {
      devLog.error('❌ 차량 트림 조회 실패:', error);
      throw new Error('차량 트림 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 특정 차량의 상세 정보 조회 (배터리, 성능 데이터 포함)
   */
  async getVehicleDetails(make: string, model: string, year: number, trim?: string): Promise<VehicleDetails | null> {
    try {
      await this.waitForFirebaseReady();

      // ⭐ 동적 브랜드 매핑 사용 (@charzing/vehicle-utils)
      const { getDynamicBrandMapping } = await import('@charzing/vehicle-utils');
      const brandMapping = getDynamicBrandMapping(make);

      if (!brandMapping) {
        devLog.warn(`❌ 브랜드 매핑 실패: "${make}"`);
        return null;
      }

      const brandId = brandMapping.firestoreId;
      
      // ⭐ 동적 모델 매핑 사용 (@charzing/vehicle-utils)
      const { getDynamicModelMapping } = await import('@charzing/vehicle-utils');
      const modelMapping = getDynamicModelMapping(brandId, model);

      if (!modelMapping) {
        devLog.warn(`❌ 모델 매핑 실패: "${model}" in ${brandId}`);
        return null;
      }

      const modelId = modelMapping.firestoreId;
      devLog.log(`✅ 동적 매핑 성공: "${model}" → "${modelId}"`);
      
      devLog.log(`🔍 차량 조회 시작:`, {
        original: { make, model, year, trim },
        mapped: { brandId, modelId },
        firestorePath: `vehicles/${brandId}/models/${modelId}`
      });

      // Firestore에서 차량 데이터 조회
      const vehicleDocRef = doc(this.db, 'vehicles', brandId, 'models', modelId!);
      const vehicleDoc = await getDoc(vehicleDocRef);

      if (!vehicleDoc.exists()) {
        devLog.warn(`❌ 차량 데이터 없음: ${brandId}/${modelId} (원본: ${make}/${model})`);
        return null;
      }

      const vehicleData = vehicleDoc.data();
      devLog.log(`✅ 차량 데이터 조회: ${brandId}/${modelId}`, vehicleData);

      // ✅ YearTemplate 조회 (우선순위 1)
      const yearTemplatesRef = collection(this.db, 'vehicles', brandId, 'models', modelId!, 'yearTemplates');
      const yearTemplatesSnapshot = await getDocs(yearTemplatesRef);

      const yearTemplatesByTrimAndYear = new Map<string, YearTemplate>();
      yearTemplatesSnapshot.forEach((templateDoc) => {
        const templateData = templateDoc.data() as YearTemplate;
        const trimId = templateData.trimId;
        const years = templateData.years || [];

        if (trimId && years) {
          // 각 연도에 대해 매핑 (연도별 빠른 조회를 위해)
          years.forEach(templateYear => {
            const key = `${trimId}_${templateYear}`;
            yearTemplatesByTrimAndYear.set(key, templateData);
          });
        }
      });

      devLog.log(`📋 YearTemplate 조회 완료: ${yearTemplatesSnapshot.size}개 템플릿, ${yearTemplatesByTrimAndYear.size}개 매핑`);

      // 기본 배터리 정보
      const defaultBattery = vehicleData.defaultBattery || {};

      // 연도 매칭 헬퍼 함수 - years 배열의 두 가지 형식 모두 지원
      // 1. ["2022", "2023", "2024"] - 정상
      // 2. ["2018 2019 2020 2021"] - 하나의 문자열에 여러 연도 (잘못된 데이터)
      const isYearMatch = (years: any, targetYear: number): boolean => {
        if (!years || !Array.isArray(years)) return false;
        const yearStr = targetYear.toString();

        return years.some((y: any) => {
          if (typeof y === 'string') {
            // 정확히 일치하거나, 공백으로 구분된 문자열 안에 포함된 경우
            return y === yearStr || y.split(' ').includes(yearStr);
          } else if (typeof y === 'number') {
            return y === targetYear;
          }
          return false;
        });
      };

      // ✅ 표준 구조: trims에 trimId, name, driveType, yearRange, variants 있음
      let matchedTrim = null;
      let matchedVariant = null;
      let matchedFromYearTemplate = false;

      if (vehicleData.trims && Array.isArray(vehicleData.trims)) {
        // 트림 매칭
        for (const t of vehicleData.trims) {
          if (t.trimId && t.name && t.variants) {
            // 트림명 매칭 (trim 파라미터 없으면 첫 번째 트림 사용)
            if (!trim || t.name?.toLowerCase() === trim.toLowerCase() || t.trimId === trim) {
              matchedTrim = t;

              // ✅ 우선순위 1: YearTemplate에서 먼저 찾기
              const templateKey = `${t.trimId}_${year}`;
              const yearTemplate = yearTemplatesByTrimAndYear.get(templateKey);

              if (yearTemplate && yearTemplate.variants && yearTemplate.variants.length > 0) {
                devLog.log(`✅ YearTemplate에서 variant 발견: ${templateKey}`);
                matchedVariant = yearTemplate.variants[0];
                matchedFromYearTemplate = true;
              } else {
                // ✅ 우선순위 2: 트림의 variants에서 연도 매칭
                devLog.log(`⚠️ YearTemplate 없음, 트림 variants 조회: ${t.trimId}`);
                if (t.variants && Array.isArray(t.variants)) {
                  matchedVariant = t.variants.find((v: FirebaseVariant) => {
                    return isYearMatch(v.years, year);
                  });

                  // 연도 매칭 실패 시 첫 번째 variant 사용
                  if (!matchedVariant) {
                    matchedVariant = t.variants[0];
                  }
                }
              }
              break;
            }
          }
        }

        // Fallback: 트림을 못 찾았으면 첫 번째 트림 사용
        if (!matchedVariant && vehicleData.trims.length > 0) {
          const firstTrim = vehicleData.trims[0];
          if (firstTrim.variants && firstTrim.variants.length > 0) {
            matchedTrim = firstTrim;
            matchedVariant = firstTrim.variants[0];
            devLog.log(`⚠️ Fallback: 첫 번째 트림 사용 (${firstTrim.name})`);
          }
        }
      }

      // 이미지 URL 정규화 (토큰 제거하고 alt=media 사용)
      const normalizeImageUrl = (url: string | undefined): string => {
        if (!url) return '';

        try {
          // Firebase Storage URL 패턴 확인
          if (!url.includes('firebasestorage.googleapis.com')) {
            return url; // Firebase Storage URL이 아니면 그대로 반환
          }

          const urlObj = new URL(url);

          // 버킷 이름 추출 (URL path에서 /v0/b/{bucket}/o/ 패턴)
          const bucketMatch = urlObj.pathname.match(/\/v0\/b\/([^\/]+)\/o\//);
          if (!bucketMatch || !bucketMatch[1]) return url;
          const bucket = bucketMatch[1];

          // 경로에서 /o/ 이후의 인코딩된 파일 경로 추출
          const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
          if (!pathMatch || !pathMatch[1]) return url;

          // 이미 인코딩된 경로를 한번 디코딩
          let filePath = decodeURIComponent(pathMatch[1]);

          // 다시 인코딩 (정확한 인코딩 보장)
          const encodedPath = encodeURIComponent(filePath);

          // 새 URL 구성
          const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;

          devLog.log('🔄 URL 정규화:', { original: url, normalized: newUrl });
          return newUrl;
        } catch (error) {
          devLog.error('❌ URL 정규화 실패:', error);
          return url; // 파싱 실패 시 원본 반환
        }
      };

      // 상세 정보 구성
      const details: VehicleDetails = {
        modelName: vehicleData.name || model, // 실제 Firebase 모델명 사용
        imageUrl: this.normalizeImageUrl(matchedVariant?.imageUrl || vehicleData.imageUrl), // variant 이미지 우선, 없으면 기본 이미지
        battery: {
          capacity: matchedVariant?.batteryCapacity ||
                   (typeof defaultBattery.capacity === 'string' ? parseInt(defaultBattery.capacity.replace('kWh', '')) : defaultBattery.capacity) || 0,
          manufacturer: matchedVariant?.batteryOptions?.map((opt: BatteryOption) => opt.supplier).join(', ') ||
                       matchedVariant?.supplier ||
                       defaultBattery.manufacturer ||
                       defaultBattery.supplier || '알 수 없음',
          cellType: defaultBattery.cellType ||
                   defaultBattery.type || '알 수 없음',
          voltage: defaultBattery.voltage || 0
        },
        performance: {
          range: matchedVariant?.range || defaultBattery.range || 0,
          topSpeed: matchedVariant?.specifications?.topSpeed ?
                   (typeof matchedVariant.specifications.topSpeed === 'string' ?
                    parseInt(matchedVariant.specifications.topSpeed) : matchedVariant.specifications.topSpeed) :
                   matchedVariant?.topSpeed || 0,
          power: matchedVariant?.specifications?.power ? parseInt(matchedVariant.specifications.power.replace(/마력|HP|kW/g, '')) :
                matchedVariant?.power ? parseInt(matchedVariant.power.replace(/마력|HP|kW/g, '')) :
                matchedVariant?.powerMax ? parseInt(matchedVariant.powerMax.replace(/마력|HP|kW/g, '')) :
                (defaultBattery.powerMax && typeof defaultBattery.powerMax !== 'undefined') ? parseInt(String(defaultBattery.powerMax).replace(/마력|HP|kW/g, '')) :
                (defaultBattery.power && typeof defaultBattery.power !== 'undefined') ? parseInt(String(defaultBattery.power)) : 0,
          torque: matchedVariant?.specifications?.torque ? parseInt(matchedVariant.specifications.torque.replace('Nm', '')) :
                 matchedVariant?.torque ? parseInt(matchedVariant.torque.replace('Nm', '')) :
                 (defaultBattery.torqueMax && typeof defaultBattery.torqueMax !== 'undefined') ? parseInt(String(defaultBattery.torqueMax).replace('Nm', '')) :
                 (defaultBattery.torque && typeof defaultBattery.torque !== 'undefined') ? parseInt(String(defaultBattery.torque)) : 0,
          efficiency: matchedVariant?.specifications?.efficiency ? parseFloat(matchedVariant.specifications.efficiency.replace('kWh/100km', '')) :
                     matchedVariant?.efficiency ? parseFloat(matchedVariant.efficiency.replace('kWh/100km', '')) :
                     (defaultBattery.efficiency && typeof defaultBattery.efficiency !== 'undefined') ? parseFloat(String(defaultBattery.efficiency)) : 0,
          acceleration: matchedVariant?.specifications?.acceleration ? parseFloat(matchedVariant.specifications.acceleration.replace('초 (0-100km/h)', '')) :
                       typeof matchedVariant?.acceleration === 'number' ? matchedVariant.acceleration :
                       typeof matchedVariant?.acceleration === 'string' ?
                       parseFloat(matchedVariant.acceleration.replace('초 (0-100km/h)', '')) :
                       (defaultBattery.acceleration && typeof defaultBattery.acceleration !== 'undefined') ? parseFloat(String(defaultBattery.acceleration)) : 0,
          driveType: matchedVariant?.driveType || matchedTrim?.driveType || defaultBattery.driveType || '알 수 없음',
          chargingSpeed: matchedVariant?.specifications?.chargingSpeed ||
                        matchedVariant?.chargingSpeed ||
                        defaultBattery.chargingSpeed || undefined,
          chargingConnector: matchedVariant?.specifications?.chargingConnector ||
                            matchedVariant?.chargingConnector ||
                            defaultBattery.chargingConnector || undefined
        }
      };

      devLog.log(`🔍 매칭된 트림:`, matchedTrim?.name);
      devLog.log(`🔍 매칭된 variant:`, matchedVariant);
      devLog.log(`🖼️ 이미지 URL 정보:`, {
        variantImageUrl: matchedVariant?.imageUrl,
        modelImageUrl: vehicleData.imageUrl,
        finalImageUrl: details.imageUrl
      });
      devLog.log(`🔍 variant에 torque 있나?:`, matchedVariant?.torque);
      devLog.log(`🔍 variant에 efficiency 있나?:`, matchedVariant?.efficiency);
      devLog.log(`🔍 variant의 모든 키:`, matchedVariant ? Object.keys(matchedVariant) : 'variant 없음');
      devLog.log(`🔍 defaultBattery:`, defaultBattery);
      devLog.log(`✅ 차량 상세 정보 구성 완료:`, details);
      return details;

    } catch (error) {
      devLog.error('❌ 차량 상세 정보 조회 실패:', error);
      return null;
    }
  }

  // 실제 Firebase 구조에 맞는 모델 데이터 조회 메서드
  async getModelData(brandId: string, modelId: string): Promise<{
    name: string;
    englishName: string;
    imageUrl: string;
    defaultBattery: {
      capacity: string; // "71kWh" 형태
      cellType: string; // "NCM"
      manufacturer: string; // "LG Energy Solution"
      warranty: string; // "8년/16만km"
      supplier?: string; // "SK온", "CATL" 등
    };
    trims: Array<{
      trimId?: string;
      name?: string;
      driveType?: string;
      yearRange?: { start: number; end: number };
      variants: Array<{
        trimId: string;
        trimName: string;
        batteryCapacity: number;
        range: number;
        acceleration: number;
        years: string[];
        driveType: string;
        powerMax: string;
        topSpeed: number;
        supplier?: string; // 배터리 제조사
      }>;
    }>;
    yearTemplates?: Array<{
      templateId: string;
      years: number[];
      trimId: string;
      trimName: string;
      images: {
        main?: string;
        front?: string;
        side?: string;
        rear?: string;
      };
      variants: Array<{
        batteryCapacity: number;
        range: number;
        supplier: string;
        cellType?: string;
        specifications?: {
          motor?: string;
          power?: string;
          torque?: string;
          acceleration?: string;
          chargingSpeed?: string;
          topSpeed?: string;
          efficiency?: string;
        };
      }>;
    }>;
    createdAt?: any;
    updatedAt?: any;
  } | null> {
    try {
      devLog.log(`🔍 [getModelData] 모델 데이터 조회: vehicles/${brandId}/models/${modelId}`);

      // 1. vehicles/{brandId}/models/{modelId} 문서 조회
      const modelDocRef = doc(this.db, 'vehicles', brandId, 'models', modelId);
      const modelDoc = await getDoc(modelDocRef);

      if (!modelDoc.exists()) {
        devLog.log(`❌ [getModelData] 모델 데이터를 찾을 수 없습니다: ${brandId}/${modelId}`);
        return null;
      }

      const modelData = modelDoc.data();
      devLog.log(`✅ [getModelData] 모델 문서 조회 성공`);

      // 2. YearTemplate 서브컬렉션 조회 (Phase 5.1.5)
      const yearTemplatesRef = collection(this.db, 'vehicles', brandId, 'models', modelId, 'yearTemplates');
      const yearTemplatesSnapshot = await getDocs(yearTemplatesRef);

      const yearTemplates: Array<{
        templateId: string;
        years: number[];
        trimId: string;
        trimName: string;
        images: {
          main?: string;
          front?: string;
          side?: string;
          rear?: string;
        };
        variants: Array<any>;
      }> = [];

      yearTemplatesSnapshot.forEach((templateDoc) => {
        const templateData = templateDoc.data();
        yearTemplates.push({
          templateId: templateDoc.id,
          years: templateData.years || [],
          trimId: templateData.trimId || '',
          trimName: templateData.trimName || '',
          images: templateData.images || {},
          variants: templateData.variants || [],
        });
      });

      devLog.log(`📋 [getModelData] YearTemplate 조회 완료: ${yearTemplates.length}개`);

      // 실제 Firebase 구조로 타입 검증
      const requiredFields = ['name', 'englishName', 'imageUrl', 'defaultBattery', 'trims'];
      for (const field of requiredFields) {
        if (!modelData[field]) {
          devLog.log(`⚠️ [getModelData] 필수 필드 누락: ${field}`);
          return null;
        }
      }

      return {
        ...modelData,
        yearTemplates, // ⭐ YearTemplate 추가
      } as {
        name: string;
        englishName: string;
        imageUrl: string;
        defaultBattery: {
          capacity: string;
          cellType: string;
          manufacturer: string;
          warranty: string;
          supplier?: string;
        };
        trims: Array<{
          trimId?: string;
          name?: string;
          driveType?: string;
          yearRange?: { start: number; end: number };
          variants: Array<{
            trimId: string;
            trimName: string;
            batteryCapacity: number;
            range: number;
            acceleration: number;
            years: string[];
            driveType: string;
            powerMax: string;
            topSpeed: number;
            supplier?: string;
          }>;
        }>;
        yearTemplates?: Array<{
          templateId: string;
          years: number[];
          trimId: string;
          trimName: string;
          images: {
            main?: string;
            front?: string;
            side?: string;
            rear?: string;
          };
          variants: Array<any>;
        }>;
        createdAt?: any;
        updatedAt?: any;
      };

    } catch (error) {
      devLog.error(`❌ [getModelData] 모델 데이터 조회 실패: ${brandId}/${modelId}`, error);
      return null;
    }
  }

}

// 싱글톤 인스턴스 생성
export const firebaseService = new FirebaseService();
export default firebaseService;