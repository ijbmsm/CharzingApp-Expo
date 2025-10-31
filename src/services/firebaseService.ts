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
  serverTimestamp,
  Timestamp,
  FieldValue,
  orderBy
} from 'firebase/firestore';
import { getAuth, signOut, signInWithCustomToken } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { getFunctions, httpsCallable } from 'firebase/functions'; // Not supported in React Native
import axios from 'axios';
import Constants from 'expo-constants';
import { getDb, getAuthInstance, getStorageInstance } from '../firebase/config';
import logger from './logService';
import devLog from '../utils/devLog';
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
  address?: string;
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
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  requestedDate: Date | FieldValue;
  notes?: string;
  adminNotes?: string;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
  source?: 'web' | 'app';       // 예약 출처 구분 (웹과 동일)
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
  measuredValue: string; // 측정값
  interpretation: string; // 해석
}

// 배터리 셀 정보
export interface BatteryCell {
  id: number; // 셀 번호
  isDefective: boolean; // 불량 여부
  voltage?: number; // 전압 (옵션)
  temperature?: number; // 온도 (옵션)
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
  category: 'paint' | 'tire' | 'component' | 'battery' | 'other'; // 검사 카테고리
  severity: 'normal' | 'attention' | 'warning' | 'critical'; // 심각도
  
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
  title: string; // 검사 제목
  content: string; // 검사 내용 설명
  category: 'paint' | 'tire' | 'component' | 'battery' | 'other';
  severity: 'normal' | 'attention' | 'warning' | 'critical';
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
  uploadDate: Date;
}

// 종합 차량 검사 (새로운 구조)
export interface ComprehensiveVehicleInspection {
  // 새로운 이미지 기반 검사 구조
  inspectionImages?: InspectionImageItem[]; // 검사 이미지
  additionalInfo?: AdditionalInspectionInfo[]; // 추가 검사 정보
  pdfReports?: PDFInspectionReport[]; // PDF 검사 리포트
  
  // 기존 검사 구조 (하위 호환성)
  paintThickness?: PaintThicknessInspection[];
  tireTread?: TireTreadInspection[];
  componentReplacement?: ComponentReplacementInspection[];
}

// 기존 검사 인터페이스들 (하위 호환성)
export interface PaintThicknessInspection {
  location: string;
  thickness: number;
  isWithinRange: boolean;
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

export interface VehicleDiagnosisReport {
  id: string;
  reservationId?: string | null; // 예약과 연결 (선택사항)
  userId: string;
  
  // 차량 기본 정보
  vehicleBrand?: string; // 차량 브랜드
  vehicleName: string; // 차량명
  vehicleYear: string; // 차량 년식
  vehicleVIN?: string; // 차대번호 (선택사항)
  diagnosisDate: Date | FieldValue; // 진단 날짜
  
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
  cellsData: BatteryCell[]; // 개별 셀 상태 데이터
  
  // 진단 세부 결과
  diagnosisDetails: DiagnosisDetail[];
  
  // 업로드된 파일들
  uploadedFiles?: UploadedFile[];
  
  // 종합 차량 검사 (새로운 구조)
  comprehensiveInspection?: ComprehensiveVehicleInspection;
  
  // 메타 정보
  status: 'draft' | 'completed';
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
      address: string;
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

      // 새 사용자 문서 생성 (setDoc 사용)
      await setDoc(userDocRef, {
        uid,
        email: registrationData.email || '',
        displayName: registrationData.displayName,
        realName: registrationData.realName,
        phoneNumber: registrationData.phoneNumber,
        address: registrationData.address,
        provider: registrationData.provider,
        photoURL: registrationData.photoURL || '',
        kakaoId: registrationData.kakaoId,
        googleId: registrationData.googleId,
        appleId: registrationData.appleId,
        agreedToTerms: registrationData.agreedToTerms,
        agreedToPrivacy: registrationData.agreedToPrivacy,
        agreedAt: registrationData.agreedAt,
        isRegistrationComplete: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      devLog.log('✅ 회원가입 완료 - 사용자 문서 생성:', uid);
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
        ? (reservation.requestedDate as any).toDate()
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
   * 사용자 푸시 토큰 저장 (Firebase Functions 사용)
   */
  async saveUserPushToken(userId: string, pushToken: string): Promise<void> {
    try {
      // Firebase 초기화 완료 대기
      await this.waitForFirebaseReady();
      
      // 현재 사용자 확인 및 토큰 갱신
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        devLog.log('⚠️ 인증된 사용자가 없어 푸시 토큰 저장 건너뜀');
        return;
      }
      
      // ID 토큰 갱신 (Functions 호출 전 필수)
      try {
        await currentUser.getIdToken(true);
        devLog.log('✅ 푸시 토큰 저장을 위한 ID Token 갱신 완료');
      } catch (tokenError) {
        devLog.log('⚠️ ID Token 갱신 실패, 기존 토큰으로 시도:', tokenError);
      }
      
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/savePushToken`,
        { pushToken },
        {
          headers: {
            'Authorization': `Bearer ${await currentUser.getIdToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      if (response.data.success) {
        devLog.log('✅ 사용자 푸시 토큰 저장 완료:', userId);
      } else {
        throw new Error(response.data.error || '푸시 토큰 저장 실패');
      }
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