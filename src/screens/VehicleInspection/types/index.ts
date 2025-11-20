import {
  VehicleDiagnosisReport,
  MajorDevicesInspection,
  VehicleExteriorInspection,
  VehicleUndercarriageInspection,
  BatteryCell,
  OtherInspectionItem,
} from '../../../services/firebaseService';

// 전체 검사 폼 데이터
export interface InspectionFormData {
  // 1. 차량 기본 정보
  vehicleInfo: {
    vehicleBrand: string;
    vehicleName: string;
    vehicleGrade: string;
    vehicleYear: string;
    vehicleVinImageUris: string[];
    mileage: string;
    dashboardImageUris: string[];
    dashboardStatus: 'good' | 'problem' | '';
    dashboardIssueDescription: string;
    carKeyCount: string;
  };

  // 2. 차대번호 및 상태 확인
  vinCheck: {
    isVinVerified: boolean;
    hasNoIllegalModification: boolean;
    hasNoFloodDamage: boolean;
    vinIssue: string;
    modificationIssue: string;
    floodIssue: string;
  };

  // 3. 배터리 정보
  batteryInfo: {
    batterySOH: string;
    batteryCellCount: number;
    normalChargeCount: number;
    fastChargeCount: number;
    batteryCells: BatteryCell[];
    defaultCellVoltage: number;
  };

  // 4. 주요 장치 (전기만)
  majorDevices: MajorDevicesInspection;

  // 5. 차량 외부 점검
  vehicleExterior: VehicleExteriorInspection;

  // 6. 차량 하부 점검
  vehicleUndercarriage: VehicleUndercarriageInspection;

  // 7. 차량 실내 점검 (신규)
  vehicleInterior: VehicleInteriorInspection;

  // 8. 기타
  other: {
    items: OtherInspectionItem[];
  };

  // 9. 진단사 수행 확인
  diagnosticianConfirmation: {
    confirmed: boolean;
    diagnosticianName: string;
    signatureDataUrl: string;
    confirmedAt: string;
  };
}

// 차량 실내 점검 인터페이스
export interface VehicleInteriorInspection {
  // 내장재 상태
  interior: {
    driverSeat?: MajorDeviceItem;
    passengerSeat?: MajorDeviceItem;
    driverRearSeat?: MajorDeviceItem;
    passengerRearSeat?: MajorDeviceItem;
    ceiling?: MajorDeviceItem;
    interiorSmell?: MajorDeviceItem;
  };

  // 에어컨 및 모터
  airconMotor: {
    airconStatus?: MajorDeviceItem;
    wiperMotor?: MajorDeviceItem;
    driverWindowMotor?: MajorDeviceItem;
    driverRearWindowMotor?: MajorDeviceItem;
    passengerRearWindowMotor?: MajorDeviceItem;
    passengerWindowMotor?: MajorDeviceItem;
  };

  // 옵션 및 기능
  options: {
    optionMatch?: MajorDeviceItem;
  };

  // 등화장치
  lighting: {
    driverHeadlamp?: MajorDeviceItem;
    passengerHeadlamp?: MajorDeviceItem;
    driverTaillamp?: MajorDeviceItem;
    passengerTaillamp?: MajorDeviceItem;
    licensePlateLamp?: MajorDeviceItem;
    interiorLamp?: MajorDeviceItem;
    vanityMirrorLamp?: MajorDeviceItem;
  };

  // 유리
  glass: {
    front?: MajorDeviceItem;
    driverFront?: MajorDeviceItem;
    driverRear?: MajorDeviceItem;
    rear?: MajorDeviceItem;
    passengerRear?: MajorDeviceItem;
    passengerFront?: MajorDeviceItem;
  };
}

// MajorDeviceItem 타입 (재사용)
export interface MajorDeviceItem {
  name: string;
  status?: 'good' | 'problem';
  issueDescription?: string;
  imageUri?: string;
}

// 섹션 완료도
export interface SectionCompletion {
  completed: number;
  total: number;
  isAllRequiredComplete: boolean;
}

// 아코디언 섹션 타입
export type InspectionSection =
  | 'vehicleInfo'
  | 'batteryInfo'
  | 'majorDevices'
  | 'vehicleExterior'
  | 'vehicleUndercarriage'
  | 'vehicleInterior'
  | 'other';

// 확장된 섹션 상태
export interface ExpandedSectionsState {
  vehicleInfo: boolean;
  batteryInfo: boolean;
  majorDevices: boolean;
  vehicleExterior: boolean;
  vehicleUndercarriage: boolean;
  vehicleInterior: boolean;
  other: boolean;
}
