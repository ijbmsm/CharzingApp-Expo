import { BatteryCell, OtherInspectionItem } from '../../../services/firebaseService';
import {
  ExteriorInspection,
  InteriorInspection,
  TireAndWheelInspection,
  UndercarriageInspection,
  OtherInspection,
} from '../../../types/inspection';

// Re-export inspection types for convenience
export * from '../../../types/inspection';

// ============================================
// 전체 검사 폼 데이터 (v2)
// ============================================

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
    registrationImageUris: string[];  // 자동차 등록증 사진 (선택)
    vinImageUris: string[];           // 차대번호 사진 (필수)
    isVinVerified: boolean;           // 자동차 등록증 확인 체크
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
    batteryCells: BatteryCell[];
    defaultCellVoltage: number;
  };

  // ========== 검사 v2 구조 ==========

  // 4. 외부 검사 (외판, 프레임, 유리, 램프)
  exterior: ExteriorInspection;

  // 5. 내부 검사 (내장재, 기능)
  interior: InteriorInspection;

  // 6. 타이어 & 휠
  tireAndWheel: TireAndWheelInspection;

  // 7. 하체 검사 (배터리 팩, 서스펜션, 브레이크)
  undercarriage: UndercarriageInspection;

  // 8. 기타 사항
  other: OtherInspection;

  // 9. 진단사 수행 확인
  diagnosticianConfirmation: {
    confirmed: boolean;
    diagnosticianName: string;
    signatureDataUrl: string;
    confirmedAt: string;
  };
}

// ============================================
// 섹션 관련 타입
// ============================================

export interface SectionCompletion {
  completed: number;
  total: number;
  isAllRequiredComplete: boolean;
}

export type InspectionSection =
  | 'vehicleInfo'
  | 'batteryInfo'
  | 'exterior'
  | 'interior'
  | 'tireAndWheel'
  | 'undercarriage'
  | 'other';

export interface ExpandedSectionsState {
  vehicleInfo: boolean;
  batteryInfo: boolean;
  exterior: boolean;
  interior: boolean;
  tireAndWheel: boolean;
  undercarriage: boolean;
  other: boolean;
}

// ============================================
// 기존 타입 호환용 (deprecated)
// ============================================

/** @deprecated Use BaseInspectionItem from inspection.ts */
export interface MajorDeviceItem {
  name: string;
  status?: 'good' | 'problem';
  issueDescription?: string;
  imageUri?: string;
}
