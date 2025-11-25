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
// import { getFunctions, httpsCallable } from 'firebase/functions'; // Not supported in React Native
import axios from 'axios';
import Constants from 'expo-constants';
import { v4 as uuidv4 } from 'uuid';
import { getDb, getAuthInstance, getStorageInstance } from '../firebase/config';
import logger from './logService';
import devLog from '../utils/devLog';
import sentryLogger from '../utils/sentryLogger'; // ⭐ Sentry 로거 추가
import { handleFirebaseError, handleNetworkError, handleError } from './errorHandler';

// 차량 이미지 URL 생성 유틸리티
// Firebase Storage에 실제 존재하는 차량 이미지 구조 (실제 데이터 기반)
const vehicleImageDatabase: Record<string, Record<string, { years: number[]; trims: string[]; fallbackYear: number; }>> = {
  'HYUNDAI': {
    'IONIQ-5': { 
      years: [2021, 2022, 2023, 2025], 
      trims: ['e', 'standard'],
      fallbackYear: 2025 
    },
    'IONIQ-6': { 
      years: [2023, 2024, 2025], 
      trims: ['e', 'standard'],
      fallbackYear: 2025 
    },
    'KONA-ELECTRIC': { 
      years: [2018, 2020, 2022, 2023], 
      trims: ['e'],
      fallbackYear: 2023 
    }
  },
  'KIA': {
    'EV6': { 
      years: [2022, 2025], 
      trims: ['e'],
      fallbackYear: 2025 
    },
    'EV9': { 
      years: [2024], 
      trims: ['e'],
      fallbackYear: 2024 
    },
    'NIRO-EV': { 
      years: [2018, 2022], 
      trims: ['e'],
      fallbackYear: 2022 
    }
  },
  'TESLA': {
    'MODEL-S': { 
      years: [2017, 2018, 2020, 2022, 2024, 2025], 
      trims: ['e'],
      fallbackYear: 2025 
    },
    'MODEL-3': { 
      years: [2020, 2023, 2025], 
      trims: ['e'],
      fallbackYear: 2025 
    },
    'MODEL-X': { 
      years: [2018, 2020, 2023, 2025], 
      trims: ['e'],
      fallbackYear: 2025 
    },
    'MODEL-Y': { 
      years: [2024, 2025], 
      trims: ['e'],
      fallbackYear: 2025 
    }
  },
  'BMW': {
    'i4': { 
      years: [2024, 2025], 
      trims: ['e'],
      fallbackYear: 2025 
    },
    'iX': { 
      years: [2025, 2026], 
      trims: ['e'],
      fallbackYear: 2026 
    }
  }
};

const generateVehicleImageUrl = (make: string, model: string, year: number, trim?: string): string => {
  try {
    // 브랜드명 정규화
    const brandMapping: Record<string, string> = {
      '현대': 'HYUNDAI', 'HYUNDAI': 'HYUNDAI', 'Hyundai': 'HYUNDAI',
      '기아': 'KIA', 'KIA': 'KIA', 'Kia': 'KIA',
      '테슬라': 'TESLA', 'TESLA': 'TESLA', 'Tesla': 'TESLA',
      'BMW': 'BMW', 'bmw': 'BMW',
      '메르세데스-벤츠': 'MERCEDES-BENZ', 'Mercedes-Benz': 'MERCEDES-BENZ', 'MERCEDES-BENZ': 'MERCEDES-BENZ',
      '아우디': 'AUDI', 'AUDI': 'AUDI', 'Audi': 'AUDI',
      '포르쉐': 'PORSCHE', 'PORSCHE': 'PORSCHE', 'Porsche': 'PORSCHE',
      'MINI': 'MINI', 'Mini': 'MINI', 'mini': 'MINI'
    };

    // 모델명 정규화
    const modelMapping: Record<string, string> = {
      '아이오닉 5': 'IONIQ-5', 'IONIQ 5': 'IONIQ-5', 'ioniq-5': 'IONIQ-5',
      '아이오닉 6': 'IONIQ-6', 'IONIQ 6': 'IONIQ-6', 'ioniq-6': 'IONIQ-6',
      '코나 일렉트릭': 'KONA-ELECTRIC', 'KONA Electric': 'KONA-ELECTRIC', 'kona-electric': 'KONA-ELECTRIC',
      'EV6': 'EV6', 'ev6': 'EV6',
      'EV9': 'EV9', 'ev9': 'EV9',
      '니로 EV': 'NIRO-EV', 'NIRO EV': 'NIRO-EV', 'niro-ev': 'NIRO-EV',
      'Model S': 'MODEL-S', 'model-s': 'MODEL-S',
      'Model 3': 'MODEL-3', 'model-3': 'MODEL-3',
      'Model X': 'MODEL-X', 'model-x': 'MODEL-X',
      'Model Y': 'MODEL-Y', 'model-y': 'MODEL-Y',
      'i3': 'i3', 'I3': 'i3',
      'i4': 'i4', 'I4': 'i4',
      'iX': 'iX', 'IX': 'iX', 'ix': 'iX'
    };

    const normalizedBrand = brandMapping[make] || make.toUpperCase();
    const normalizedModel = modelMapping[model] || model.toUpperCase().replace(/\s+/g, '-');
    
    devLog.log('🔍 이미지 URL 생성 시작:', { make, model, year, trim, normalizedBrand, normalizedModel });

    // 차량 정보 조회
    const vehicleInfo = vehicleImageDatabase[normalizedBrand]?.[normalizedModel];
    
    let finalYear = year;
    let finalTrim = '';
    
    if (vehicleInfo) {
      // 1. 연도 fallback: 해당 연도가 없으면 가장 가까운 연도 찾기
      if (!vehicleInfo.years.includes(year)) {
        // 가장 가까운 연도 찾기
        const sortedYears = vehicleInfo.years.sort((a: number, b: number) => Math.abs(a - year) - Math.abs(b - year));
        finalYear = sortedYears[0] || vehicleInfo.fallbackYear;
        devLog.log(`⚠️ ${year}년 이미지 없음, ${finalYear}년으로 대체`);
      }
      
      // 2. 트림 fallback
      if (trim) {
        const trimLower = trim.toLowerCase();
        if (vehicleInfo.trims.includes(trimLower)) {
          finalTrim = `_${trimLower}`;
        } else if (vehicleInfo.trims.includes('standard')) {
          finalTrim = '_standard';
          devLog.log(`⚠️ ${trim} 트림 없음, standard로 대체`);
        } else if (vehicleInfo.trims.includes('e')) {
          finalTrim = '_e';
          devLog.log(`⚠️ ${trim} 트림 없음, e로 대체`);
        } else {
          // 트림명 없는 기본 이미지 시도
          finalTrim = '';
          devLog.log(`⚠️ ${trim} 트림 없음, 기본 이미지 사용`);
        }
      } else {
        // 트림 지정 안됨 - 기본 이미지 먼저 시도, 없으면 standard, 그 다음 e
        if (vehicleInfo.trims.includes('standard')) {
          finalTrim = '_standard';
        } else if (vehicleInfo.trims.includes('e')) {
          finalTrim = '_e';
        }
      }
    } else {
      devLog.warn(`⚠️ 차량 정보 없음: ${normalizedBrand}/${normalizedModel}, 기본 URL 생성 시도`);
      // 데이터베이스에 없는 차량은 기본 로직 사용
      if (trim && ['standard', 'e', 'se', 'jcw'].includes(trim.toLowerCase())) {
        finalTrim = `_${trim.toLowerCase()}`;
      }
    }
    
    // Firebase Storage URL 생성
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2F';
    const fileName = `${normalizedBrand.toLowerCase()}_${normalizedModel.toLowerCase().replace(/-/g, '_')}_${finalYear}${finalTrim}.png`;
    const imageUrl = `${baseUrl}${normalizedBrand}%2F${normalizedModel}%2F${finalYear}%2F${fileName}?alt=media`;
    
    devLog.log('✅ 최종 이미지 URL:', {
      originalInput: { make, model, year, trim },
      normalized: { normalizedBrand, normalizedModel },
      final: { finalYear, finalTrim },
      fileName,
      imageUrl
    });
    
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
  isRegistrationComplete: boolean;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

export interface UserVehicle {
  id: string;
  userId: string;
  make: string; // 제조사 (현대, 기아, 테슬라 등)
  model: string; // 모델명 (아이오닉 5, EV6 등)
  year: number; // 연식
  trim?: string; // 트림 (Exclusive, Long Range 등)
  batteryCapacity?: string; // 배터리 용량
  range?: string; // 주행거리
  nickname?: string; // 차량 별명
  imageUrl?: string; // 차량 이미지 URL
  isActive: boolean; // 활성 차량 여부 (메인 차량)
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
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

// Firebase Firestore 변형 구조
export interface FirebaseVariant {
  years?: string[];
  batteryCapacity?: number;
  range?: number;
  trimId?: string;
  trimName?: string;
  supplier?: string;        // "SK온"
  
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
  
  // specifications 객체 (현대/기아 등)
  specifications?: {
    acceleration?: string;   // "8.5초 (0-100km/h)"
    power?: string;         // "125kW"
    torque?: string;        // "350Nm"
    efficiency?: string;    // "21.2kWh/100km"
    motor?: string;         // "단일 후륜 모터"
    chargingSpeed?: string; // "11kW (AC), 233kW (DC)"
  };
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
  status: 'pending' | 'confirmed' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled';
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
  trimId: string;
  trimName: string;
  driveType: string;
  years: string[];
  batteryCapacity: string;
  brandId: string;
  modelId: string;
  modelName: string;
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
  
  // 배터리 진단 정보
  cellCount: number; // 셀 개수
  defectiveCellCount: number; // 불량 개수
  normalChargeCount: number; // 일반 충전 횟수
  fastChargeCount: number; // 급속 충전 횟수
  sohPercentage: number; // SOH(%)
  realDrivableDistance?: string; // 실 주행 가능 거리
  
  // 전압 정보 (새로 추가)
  totalVoltage?: number; // 총 전압
  maxVoltage?: number; // 최대 전압
  minVoltage?: number; // 최소 전압
  
  // 셀 정보
  cellsData?: BatteryCell[]; // 개별 셀 상태 데이터

  // 진단 세부 결과
  diagnosisDetails: DiagnosisDetail[];
  
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
      'https://us-central1-charzing-d1600.cloudfunctions.net';
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
  async callCloudFunction(functionName: string, data: any = {}): Promise<any> {
    try {
      devLog.log(`🌩️ Cloud Function 직접 호출: ${functionName}`);
      
      // 인증된 사용자인지 확인
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('로그인이 필요합니다');
      }

      // ID Token 가져오기
      const idToken = await currentUser.getIdToken(true);
      
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/${functionName}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      devLog.log(`✅ Cloud Function 호출 성공: ${functionName}`);
      return response.data;
    } catch (error: any) {
      devLog.error(`❌ Cloud Function 호출 실패 (${functionName}):`, error);
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
        await signOut(this.auth);
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
      devLog.log('예약에 리포트 ID 연결:', reservationId, reportId);

      const reservationRef = doc(this.db, 'diagnosisReservations', reservationId);

      await updateDoc(reservationRef, {
        reportId,
        updatedAt: serverTimestamp(),
      });

      devLog.log('✅ 예약에 리포트 ID 연결 완료:', reservationId, reportId);
    } catch (error) {
      devLog.error('❌ 예약에 리포트 ID 연결 실패:', error);
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
      devLog.error(`❌ 리포트 이미지 업로드 실패: ${imageName}`, error);
      throw new Error(`${imageName} 이미지 업로드에 실패했습니다.`);
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

      // Firestore에 저장
      await setDoc(doc(this.db, 'vehicleDiagnosisReports', reportId), {
        ...reportData,
        id: reportId,
        createdAt: now,
        updatedAt: now,
      });

      devLog.log('✅ 차량 진단 리포트 생성 완료:', reportId);
      return reportId;
    } catch (error) {
      devLog.error('❌ 차량 진단 리포트 생성 실패:', error);
      throw new Error('진단 리포트 생성에 실패했습니다.');
    }
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
      devLog.log('📱 클라이언트에서 사용자 차량 추가 시작:', vehicleData);
      
      // 현재 로그인한 사용자만 차량을 추가할 수 있도록 체크
      if (!this.auth.currentUser || this.auth.currentUser.uid !== vehicleData.userId) {
        throw new Error('접근 권한이 없습니다.');
      }

      const now = serverTimestamp();
      const vehicleRef = doc(collection(this.db, 'userVehicles'));
      
      // 차량 이미지 URL 자동 생성
      const imageUrl = generateVehicleImageUrl(vehicleData.make, vehicleData.model, vehicleData.year, vehicleData.trim);
      
      // undefined 값들을 제거하여 Firebase 에러 방지
      const cleanVehicleData: any = {};
      Object.entries({ ...vehicleData, imageUrl }).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanVehicleData[key] = value;
        }
      });

      const completeVehicleData = {
        ...cleanVehicleData,
        createdAt: now,
        updatedAt: now,
      };
      
      await setDoc(vehicleRef, completeVehicleData);
      
      logger.vehicle('add', { make: vehicleData.make, model: vehicleData.model, year: vehicleData.year }, vehicleData.userId);
      return vehicleRef.id;
    } catch (error: any) {
      logger.vehicle('add_failed', { make: vehicleData.make, model: vehicleData.model }, vehicleData.userId, { error: error.message });
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
    updateData: Partial<Pick<UserVehicle, 'nickname' | 'isActive' | 'make' | 'model' | 'year' | 'trim' | 'batteryCapacity' | 'range'>>
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
   * 직접 Firestore에서 차량 트림 조회 (성능 개선)
   * 단순 구조: /vehicles/{brandId}/models/{modelId} 문서 내 trims 배열
   */
  async getVehicleTrims(brandId: string, modelId: string): Promise<VehicleTrim[]> {
    try {
      devLog.log('🚗 직접 Firestore에서 차량 트림 조회:', { brandId, modelId });
      
      // 모델 문서 경로: /vehicles/{brandId}/models/{modelId}
      const modelDocRef = doc(this.db, 'vehicles', brandId, 'models', modelId);
      const modelDoc = await getDoc(modelDocRef);
      
      if (!modelDoc.exists()) {
        devLog.log('⚠️ 모델 문서가 존재하지 않습니다:', { brandId, modelId });
        return [];
      }
      
      const modelData = modelDoc.data();
      devLog.log('🔍 모델 문서 데이터:', modelData);
      
      const trims = modelData.trims || [];
      devLog.log('🔍 추출된 트림 데이터:', trims);
      
      if (!Array.isArray(trims) || trims.length === 0) {
        devLog.log('⚠️ 트림 데이터가 없습니다:', { brandId, modelId, modelDataKeys: Object.keys(modelData) });
        return [];
      }
      
      // 실제 데이터 구조에 맞게 트림 데이터 변환
      const vehicleTrims: VehicleTrim[] = [];
      
      trims.forEach((trimGroup: any, groupIndex: number) => {
        // 디버깅: 트림 그룹 데이터 구조 확인
        devLog.log(`🔍 [${brandId}] 트림 그룹 ${groupIndex} 구조:`, {
          hasName: !!trimGroup.name,
          hasTrimName: !!trimGroup.trimName,
          hasVariants: !!trimGroup.variants,
          variantsLength: trimGroup.variants?.length || 0,
          trimGroupKeys: Object.keys(trimGroup),
          name: trimGroup.name,
          trimName: trimGroup.trimName
        });
        
        // 브랜드별 데이터 구조 처리
        // 아우디는 특별한 구조: variants 배열의 각 항목이 개별 트림이고, 상위에 name/trimName이 없음
        if (brandId === 'audi' && trimGroup.variants && Array.isArray(trimGroup.variants) && !trimGroup.name && !trimGroup.trimName) {
          // 아우디는 variants 배열의 각 항목이 개별 트림임
          trimGroup.variants.forEach((variant: any, variantIndex: number) => {
            const trimName = variant.trimName || variant.name || `트림 ${variantIndex + 1}`;
            const driveType = variant.driveType || 'FWD';
            const trimId = variant.trimId || `${modelId}-${variant.trimId || variantIndex}`;
            
            // 연도 정보 추출
            const years: string[] = [];
            if (variant.years && Array.isArray(variant.years)) {
              years.push(...variant.years);
            } else if (variant.year) {
              years.push(variant.year.toString());
            }
            
            // 배터리 용량
            let batteryCapacity = variant.batteryCapacity || modelData.defaultBattery?.capacity || 0;
            
            vehicleTrims.push({
              trimId: trimId,
              trimName: trimName,
              brandId: brandId,
              modelId: modelId,
              modelName: modelData.name || modelId,
              driveType: driveType,
              batteryCapacity: batteryCapacity,
              years: years
            });
          });
        } else {
          // 기존 로직 (현대, 기아 등)
          const trimName = trimGroup.name || trimGroup.trimName || `트림 ${groupIndex + 1}`;
          const driveType = trimGroup.driveType || 'FWD';
          const trimId = trimGroup.trimId || `${modelId}-trim-${groupIndex}`;
          
          // variants에서 연도 정보 추출
          const years: number[] = [];
          let batteryCapacity = modelData.defaultBattery?.capacity || 0;
          
          if (trimGroup.variants && Array.isArray(trimGroup.variants)) {
            trimGroup.variants.forEach((variant: any) => {
              // variant.years 배열에서 연도 추출
              if (variant.years && Array.isArray(variant.years)) {
                variant.years.forEach((year: string) => {
                  const yearNum = parseInt(year, 10);
                  if (!isNaN(yearNum) && !years.includes(yearNum)) {
                    years.push(yearNum);
                  }
                });
              }
              // variant.year (단일 연도)에서도 추출
              if (variant.year) {
                const yearNum = parseInt(variant.year.toString(), 10);
                if (!isNaN(yearNum) && !years.includes(yearNum)) {
                  years.push(yearNum);
                }
              }
              if (variant.batteryCapacity) {
                batteryCapacity = variant.batteryCapacity;
              }
            });
          }
          
          // yearRange에서도 연도 정보 추출
          if (trimGroup.yearRange) {
            const { start, end } = trimGroup.yearRange;
            if (start && end) {
              for (let year = start; year <= end; year++) {
                if (!years.includes(year)) {
                  years.push(year);
                }
              }
            }
          }
          
          // 연도가 없으면 기본값 추가
          if (years.length === 0) {
            const currentYear = new Date().getFullYear();
            years.push(currentYear - 1, currentYear); // 작년, 올해
          }

          vehicleTrims.push({
            trimId: trimId,
            trimName: trimName,
            brandId: brandId,
            modelId: modelId,
            modelName: modelData.name || modelId,
            driveType: driveType,
            batteryCapacity: batteryCapacity,
            years: years.map(y => y.toString())
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
      
      // 브랜드명 정규화
      const brandMapping: Record<string, string> = {
        '현대': 'hyundai',
        'HYUNDAI': 'hyundai',
        'Hyundai': 'hyundai',
        '기아': 'kia', 
        'KIA': 'kia',
        'Kia': 'kia',
        '테슬라': 'tesla',
        'TESLA': 'tesla',
        'Tesla': 'tesla',
        'BMW': 'BMW',
        'bmw': 'BMW',
        '비엠더블유': 'BMW',
        '메르세데스-벤츠': 'mercedes-benz',
        'Mercedes-Benz': 'mercedes-benz',
        'MERCEDES-BENZ': 'mercedes-benz',
        '벤츠': 'mercedes-benz',
        '메르세데스-마이바흐': 'mercedes-maybach',
        'Mercedes-Maybach': 'mercedes-maybach',
        'MERCEDES-MAYBACH': 'mercedes-maybach',
        '마이바흐': 'mercedes-maybach',
        'Maybach': 'mercedes-maybach',
        'MAYBACH': 'mercedes-maybach',
        '아우디': 'audi',
        'AUDI': 'audi',
        'Audi': 'audi',
        '포르쉐': 'PORSCHE',
        'PORSCHE': 'PORSCHE',
        'Porsche': 'PORSCHE',
        'MINI': 'MINI',
        'Mini': 'MINI',
        'mini': 'MINI',
        '미니': 'MINI'
      };

      const brandId = brandMapping[make] || make.toLowerCase();
      
      // 동적 모델 검색: 실제 Firestore에 있는 모델 중에서 가장 유사한 것 찾기
      let modelId: string | null = null;
      
      // 1차 시도: 입력 모델명을 정규화해서 직접 조회
      const normalizedModel = model.toLowerCase().replace(/[\s\-]/g, '-');
      
      // 2차 시도: 해당 브랜드의 모든 모델 목록 가져와서 유사도 매칭
      try {
        const brandDocRef = doc(this.db, 'vehicles', brandId);
        const modelsCollectionRef = collection(brandDocRef, 'models');
        const modelsSnapshot = await getDocs(modelsCollectionRef);
        
        if (!modelsSnapshot.empty) {
          const availableModels = modelsSnapshot.docs.map(doc => doc.id);
          devLog.log(`📋 ${brandId} 브랜드 사용 가능한 모델들:`, availableModels);
          
          // 정확히 일치하는 모델 찾기
          modelId = availableModels.find(availableModel => 
            availableModel.toLowerCase() === normalizedModel ||
            availableModel.toLowerCase().replace(/[\s\-]/g, '-') === normalizedModel
          ) || null;
          
          if (!modelId) {
            // 한국어-영어 모델명 매핑 시도
            const koreanModelMapping: Record<string, string> = {
              // MINI
              '쿠퍼': 'COOPER',
              '컨트리맨': 'COUNTRYMAN', 
              '에이스맨': 'ACEMAN',
              // 현대
              '아이오닉': 'IONIQ',
              '코나': 'KONA',
              '넥소': 'NEXO',
              '캐스퍼': 'CASPER',
              // 기아
              '니로': 'NIRO',
              '레이': 'ray-ev',
              // BMW
              '아이': 'i',
              // 기타 필요시 추가...
            };
            
            // 한국어 매핑 시도
            for (const [korean, english] of Object.entries(koreanModelMapping)) {
              if (model.includes(korean)) {
                // 정확한 매칭 우선 시도
                let matchedModel = availableModels.find(am => am === english);
                // 정확한 매칭이 없으면 포함 관계로 매칭
                if (!matchedModel) {
                  matchedModel = availableModels.find(am => am.includes(english) || english.includes(am));
                }
                if (matchedModel) {
                  modelId = matchedModel;
                  devLog.log(`🌏 한국어 매핑 성공: "${model}" (${korean}) → "${modelId}"`);
                  break;
                }
              }
            }
            
            // 한국어 매핑이 실패하면 기존 유사도 매칭 시도
            if (!modelId) {
              const inputWords = model.toLowerCase().replace(/[\s\-]/g, ' ').split(' ').filter(w => w.length > 0);
              let bestMatch = null;
              let bestScore = 0;
              
              for (const availableModel of availableModels) {
                const modelWords = availableModel.toLowerCase().replace(/[\s\-]/g, ' ').split(' ').filter(w => w.length > 0);
                let score = 0;
                
                // 단어별 매칭 점수 계산
                for (const inputWord of inputWords) {
                  for (const modelWord of modelWords) {
                    if (inputWord === modelWord) {
                      score += 2; // 정확한 단어 매칭
                    } else if (inputWord.includes(modelWord) || modelWord.includes(inputWord)) {
                      score += 1; // 부분 매칭
                    }
                  }
                }
                
                if (score > bestScore) {
                  bestScore = score;
                  bestMatch = availableModel;
                }
              }
              
              if (bestMatch && bestScore > 0) {
                modelId = bestMatch;
                devLog.log(`🎯 유사도 매칭 성공: "${model}" → "${modelId}" (점수: ${bestScore})`);
              }
            }
            
            
            if (!modelId) {
              devLog.warn(`❌ 매칭 실패: "${model}" in ${brandId}, 사용 가능한 모델: ${availableModels.join(', ')}`);
              return null;
            }
          } else {
            devLog.log(`✅ 정확한 매칭: "${model}" → "${modelId}"`);
          }
        } else {
          devLog.warn(`❌ ${brandId} 브랜드에 모델이 없습니다.`);
          return null;
        }
      } catch (modelsError) {
        devLog.error(`❌ 모델 목록 조회 실패:`, modelsError);
        return null;
      }
      
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

      // 트림별 상세 정보 찾기 - 브랜드별 다른 구조 지원
      let matchedTrim = null;
      let matchedVariant = null;

      if (vehicleData.trims && Array.isArray(vehicleData.trims)) {
        // 방법 1: Hyundai/KIA 구조 - trims에 trimId와 name이 있고, variants는 연식별
        for (const t of vehicleData.trims) {
          if (t.trimId && t.name && t.driveType && t.yearRange && t.variants) {
            // Hyundai 스타일 확인됨
            if (!trim || t.name?.toLowerCase() === trim.toLowerCase() || t.trimId === trim) {
              matchedTrim = t;

              // 연도별 variant 매칭
              if (t.variants && Array.isArray(t.variants)) {
                matchedVariant = t.variants.find((v: FirebaseVariant) => {
                  return isYearMatch(v.years, year);
                });

                if (!matchedVariant) {
                  matchedVariant = t.variants[0]; // 연도 매칭 실패 시 첫 번째 variant
                }
              }
              break;
            }
          }
        }

        // 방법 2: Audi/BMW/Mercedes 구조 - trimGroup.variants[]에 trimId와 trimName이 있음
        if (!matchedVariant) {
          for (const trimGroup of vehicleData.trims) {
            if (trimGroup.variants && Array.isArray(trimGroup.variants) && !trimGroup.trimId) {
              // Audi 스타일 확인됨
              for (const v of trimGroup.variants) {
                if (v.trimId && v.trimName) {
                  // 트림 매칭 확인
                  const trimMatches = !trim ||
                                     v.trimName?.toLowerCase() === trim.toLowerCase() ||
                                     v.trimId === trim;

                  // 연도 매칭 확인 (헬퍼 함수 사용)
                  const yearMatches = isYearMatch(v.years, year);

                  if (trimMatches && yearMatches) {
                    matchedVariant = v;
                    break;
                  }
                }
              }

              if (matchedVariant) break;
            }
          }

          // Audi 스타일에서 트림은 매칭되었지만 연도가 안 맞는 경우
          if (!matchedVariant && trim) {
            for (const trimGroup of vehicleData.trims) {
              if (trimGroup.variants && Array.isArray(trimGroup.variants) && !trimGroup.trimId) {
                for (const v of trimGroup.variants) {
                  if (v.trimId && v.trimName) {
                    const trimMatches = v.trimName?.toLowerCase() === trim.toLowerCase() ||
                                       v.trimId === trim;
                    if (trimMatches) {
                      matchedVariant = v; // 트림만 맞으면 사용
                      break;
                    }
                  }
                }
                if (matchedVariant) break;
              }
            }
          }
        }

        // 여전히 못 찾았으면 첫 번째 variant 사용
        if (!matchedVariant) {
          if (vehicleData.trims[0]?.variants && vehicleData.trims[0].variants.length > 0) {
            matchedVariant = vehicleData.trims[0].variants[0];
            matchedTrim = vehicleData.trims[0];
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
        imageUrl: normalizeImageUrl(matchedVariant?.imageUrl || vehicleData.imageUrl), // variant 이미지 우선, 없으면 기본 이미지
        battery: {
          capacity: matchedVariant?.batteryCapacity || 
                   (typeof defaultBattery.capacity === 'string' ? parseInt(defaultBattery.capacity.replace('kWh', '')) : defaultBattery.capacity) || 0,
          manufacturer: matchedVariant?.supplier || 
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
    };
    trims: Array<{
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
      }>;
    }>;
    createdAt?: any;
    updatedAt?: any;
  } | null> {
    try {
      devLog.log(`🔍 모델 데이터 조회: vehicles/${brandId}/models/${modelId}`);
      
      // vehicles/{brandId}/models/{modelId} 문서 조회
      const modelDocRef = doc(this.db, 'vehicles', brandId, 'models', modelId);
      const modelDoc = await getDoc(modelDocRef);
      
      if (!modelDoc.exists()) {
        devLog.log(`❌ 모델 데이터를 찾을 수 없습니다: ${brandId}/${modelId}`);
        return null;
      }
      
      const modelData = modelDoc.data();
      devLog.log(`✅ 모델 데이터 조회 성공:`, modelData);
      
      // 실제 Firebase 구조로 타입 검증
      const requiredFields = ['name', 'englishName', 'imageUrl', 'defaultBattery', 'trims'];
      for (const field of requiredFields) {
        if (!modelData[field]) {
          devLog.log(`⚠️ 필수 필드 누락: ${field}`);
          return null;
        }
      }
      
      return modelData as {
        name: string;
        englishName: string;
        imageUrl: string;
        defaultBattery: {
          capacity: string; // "71kWh" 형태
          cellType: string; // "NCM"
          manufacturer: string; // "LG Energy Solution"
          warranty: string; // "8년/16만km"
        };
        trims: Array<{
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
          }>;
        }>;
        createdAt?: any;
        updatedAt?: any;
      };
      
    } catch (error) {
      devLog.error(`❌ 모델 데이터 조회 실패: ${brandId}/${modelId}`, error);
      return null;
    }
  }
}

// 싱글톤 인스턴스 생성
export const firebaseService = new FirebaseService();
export default firebaseService;