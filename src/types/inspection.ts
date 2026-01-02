/**
 * 검사 리포트 v2 타입 정의 (Expo App)
 * @see /Users/sungmin/Desktop/project/react/charzing/docs/INSPECTION_REPORT_REDESIGN_SPEC.md
 */

// ============================================
// 공통 타입
// ============================================

export interface BaseInspectionItem {
  status?: 'good' | 'problem';
  issueDescription?: string;
  issueImageUris?: string[];
}

export interface PaintInspectionItem extends BaseInspectionItem {
  basePhoto?: string;  // 기본 사진 (6개 항목 필수: hood, doorFL-RR, trunkLid)
  thickness?: number;  // μm
}

export interface TireInspectionItem extends BaseInspectionItem {
  basePhoto?: string;
  treadDepth?: number;  // mm
}

export interface WheelInspectionItem extends BaseInspectionItem {
  basePhoto?: string;
}

export interface BatteryPackInspectionItem extends BaseInspectionItem {
  basePhoto?: string;
}

export interface OtherInspectionItemV2 {
  id: string;
  category: string;
  description: string;
  imageUris: string[];
}

// ============================================
// 1. 외부 검사 (ExteriorInspection)
// ============================================

export type BodyPanelKey =
  | 'hood' | 'radiatorSupport'
  | 'frontFenderL' | 'frontFenderR'
  | 'doorFL' | 'doorFR' | 'doorRL' | 'doorRR'
  | 'sideSillPanelL' | 'sideSillPanelR'
  | 'pillarPanelA' | 'pillarPanelB' | 'pillarPanelC'
  | 'roofPanel' | 'rearFenderL' | 'rearFenderR'
  | 'trunkLid' | 'sideMirrorL' | 'sideMirrorR';

export type FrameKey =
  | 'frontPanel' | 'insidePanelL' | 'insidePanelR'
  | 'sideMemberFL' | 'sideMemberFR' | 'sideMemberRL' | 'sideMemberRR'
  | 'wheelHouseFL' | 'wheelHouseFR' | 'wheelHouseRL' | 'wheelHouseRR'
  | 'crossMember' | 'dashPanel' | 'floorPanel' | 'packageTray'
  | 'pillarA' | 'pillarB' | 'pillarC' | 'rearPanel' | 'trunkFloor';

export type GlassKey =
  | 'front' | 'doorFL' | 'doorFR' | 'doorRL' | 'doorRR' | 'rear' | 'sunroof';

export type LampKey =
  | 'head' | 'fog' | 'sideRepeater' | 'rear' | 'licensePlate';

export interface ExteriorInspection {
  basePhotos?: {
    hood?: string;
    doorFL?: string;
    doorFR?: string;
    doorRL?: string;
    doorRR?: string;
    trunkLid?: string;
  };
  bodyPanel?: { [K in BodyPanelKey]?: PaintInspectionItem };
  frame?: { [K in FrameKey]?: BaseInspectionItem };
  glass?: { [K in GlassKey]?: BaseInspectionItem };
  lamp?: { [K in LampKey]?: BaseInspectionItem };
}

// ============================================
// 2. 내부 검사 (InteriorInspection)
// ============================================

// 내장재: 사진 필요한 항목 6개 + 상태만 필요한 항목 2개 = 8개
export type InteriorMaterialsKey =
  | 'driverSeat' | 'rearSeat'
  | 'doorFL' | 'doorFR' | 'doorRL' | 'doorRR'
  | 'ceiling' | 'smell';

// 기존 타입 유지 (하위 호환성)
export type MaterialsKey = 'door' | 'ceiling' | 'seat' | 'smell';

export interface InteriorMaterialsItem extends BaseInspectionItem {
  basePhoto?: string;
}

export type FunctionsKey =
  | 'airconHeater' | 'ventilationHeatedSeat' | 'window' | 'audio'
  | 'wiper' | 'touchscreen' | 'seatAdjustment';

export interface InteriorInspection {
  // v2: materials가 InteriorMaterialsKey를 사용하고 각 항목에 basePhoto 포함
  // basePhotos는 더 이상 사용하지 않음 (하위 호환성 유지)
  basePhotos?: {
    driverSeat?: string;
    rearSeat?: string;
    doorFL?: string;
    doorFR?: string;
    doorRL?: string;
    doorRR?: string;
  };
  materials?: { [K in InteriorMaterialsKey]?: InteriorMaterialsItem };
  functions?: { [K in FunctionsKey]?: BaseInspectionItem };
}

// ============================================
// 3. 타이어 & 휠 검사 (TireAndWheelInspection)
// ============================================

export type PositionKey = 'fl' | 'fr' | 'rl' | 'rr';

export interface TireAndWheelInspection {
  tire?: { [K in PositionKey]?: TireInspectionItem };
  wheel?: { [K in PositionKey]?: WheelInspectionItem };
}

// ============================================
// 4. 하체 검사 (UndercarriageInspection)
// ============================================

export type BatteryPackDirectionKey = 'front' | 'left' | 'rear' | 'right';
export type SuspensionKey = 'spring' | 'stabilizer' | 'lowerArm' | 'shockAbsorber';
export type BrakeKey = 'brakeOil' | 'padF' | 'padR' | 'discF' | 'discR';

export interface UndercarriageInspection {
  batteryPack?: { [K in BatteryPackDirectionKey]?: BatteryPackInspectionItem };
  suspensionBasePhotos?: { [K in PositionKey]?: string };
  suspension?: { [K in SuspensionKey]?: BaseInspectionItem };
  brakeBasePhotos?: { discF?: string; discR?: string };
  brake?: { [K in BrakeKey]?: BaseInspectionItem };
}

// ============================================
// 5. 기타 사항 (OtherInspection)
// ============================================

export interface OtherInspection {
  items: OtherInspectionItemV2[];
}

// ============================================
// 라벨 매핑
// ============================================

export const BODY_PANEL_LABELS: Record<BodyPanelKey, string> = {
  hood: '후드',
  radiatorSupport: '라디에이터 서포트',
  frontFenderL: '프론트 펜더(L)',
  frontFenderR: '프론트 펜더(R)',
  doorFL: '도어(FL)',
  doorFR: '도어(FR)',
  doorRL: '도어(RL)',
  doorRR: '도어(RR)',
  sideSillPanelL: '사이드실 패널(L)',
  sideSillPanelR: '사이드실 패널(R)',
  pillarPanelA: '필러 패널(A)',
  pillarPanelB: '필러 패널(B)',
  pillarPanelC: '필러 패널(C)',
  roofPanel: '루프 패널',
  rearFenderL: '리어 펜더(L)',
  rearFenderR: '리어 펜더(R)',
  trunkLid: '트렁크 리드',
  sideMirrorL: '사이드 미러(L)',
  sideMirrorR: '사이드 미러(R)',
};

export const FRAME_LABELS: Record<FrameKey, string> = {
  frontPanel: '프론트 패널',
  insidePanelL: '인사이드 패널(L)',
  insidePanelR: '인사이드 패널(R)',
  sideMemberFL: '사이드멤버(FL)',
  sideMemberFR: '사이드멤버(FR)',
  sideMemberRL: '사이드멤버(RL)',
  sideMemberRR: '사이드멤버(RR)',
  wheelHouseFL: '휠하우스(FL)',
  wheelHouseFR: '휠하우스(FR)',
  wheelHouseRL: '휠하우스(RL)',
  wheelHouseRR: '휠하우스(RR)',
  crossMember: '크로스 멤버',
  dashPanel: '대쉬 패널',
  floorPanel: '플로어 패널',
  packageTray: '패키지 트레이',
  pillarA: 'A필러',
  pillarB: 'B필러',
  pillarC: 'C필러',
  rearPanel: '리어 패널',
  trunkFloor: '트렁크 플로어',
};

export const GLASS_LABELS: Record<GlassKey, string> = {
  front: '전면',
  doorFL: '도어(FL)',
  doorFR: '도어(FR)',
  doorRL: '도어(RL)',
  doorRR: '도어(RR)',
  rear: '후면',
  sunroof: '선루프',
};

export const LAMP_LABELS: Record<LampKey, string> = {
  head: '헤드',
  fog: '안개등',
  sideRepeater: '사이드리피터',
  rear: '리어',
  licensePlate: '번호판',
};

export const MATERIALS_LABELS: Record<MaterialsKey, string> = {
  door: '도어',
  ceiling: '천장',
  seat: '시트',
  smell: '냄새',
};

// 내장재 검사 v2: 8개 항목 (사진 6개 + 상태만 2개)
export const INTERIOR_MATERIALS_LABELS: Record<InteriorMaterialsKey, string> = {
  driverSeat: '운전석 시트',
  rearSeat: '뒷좌석',
  doorFL: '도어(FL)',
  doorFR: '도어(FR)',
  doorRL: '도어(RL)',
  doorRR: '도어(RR)',
  ceiling: '천장',
  smell: '냄새',
};

export const FUNCTIONS_LABELS: Record<FunctionsKey, string> = {
  airconHeater: '에어컨, 히터',
  ventilationHeatedSeat: '통풍/열선',
  window: '윈도우',
  audio: '오디오',
  wiper: '와이퍼',
  touchscreen: '터치스크린',
  seatAdjustment: '시트 조절',
};

export const POSITION_LABELS: Record<PositionKey, string> = {
  fl: 'FL',
  fr: 'FR',
  rl: 'RL',
  rr: 'RR',
};

export const BATTERY_PACK_LABELS: Record<BatteryPackDirectionKey, string> = {
  front: '앞',
  left: '좌측',
  rear: '뒤',
  right: '우측',
};

export const SUSPENSION_LABELS: Record<SuspensionKey, string> = {
  spring: '스프링',
  stabilizer: '스테빌라이저',
  lowerArm: '로어 암',
  shockAbsorber: '쇼크 업소버',
};

export const BRAKE_LABELS: Record<BrakeKey, string> = {
  brakeOil: '브레이크 오일',
  padF: '패드(F)',
  padR: '패드(R)',
  discF: '디스크(F)',
  discR: '디스크(R)',
};

// ============================================
// 키 배열
// ============================================

export const BODY_PANEL_KEYS: BodyPanelKey[] = [
  'hood', 'radiatorSupport', 'frontFenderL', 'frontFenderR',
  'doorFL', 'doorFR', 'doorRL', 'doorRR',
  'sideSillPanelL', 'sideSillPanelR',
  'pillarPanelA', 'pillarPanelB', 'pillarPanelC',
  'roofPanel', 'rearFenderL', 'rearFenderR',
  'trunkLid', 'sideMirrorL', 'sideMirrorR',
];

export const FRAME_KEYS: FrameKey[] = [
  'frontPanel', 'insidePanelL', 'insidePanelR',
  'sideMemberFL', 'sideMemberFR', 'sideMemberRL', 'sideMemberRR',
  'wheelHouseFL', 'wheelHouseFR', 'wheelHouseRL', 'wheelHouseRR',
  'crossMember', 'dashPanel', 'floorPanel', 'packageTray',
  'pillarA', 'pillarB', 'pillarC', 'rearPanel', 'trunkFloor',
];

export const GLASS_KEYS: GlassKey[] = [
  'front', 'doorFL', 'doorFR', 'doorRL', 'doorRR', 'rear', 'sunroof',
];

export const LAMP_KEYS: LampKey[] = [
  'head', 'fog', 'sideRepeater', 'rear', 'licensePlate',
];

export const MATERIALS_KEYS: MaterialsKey[] = ['door', 'ceiling', 'seat', 'smell'];

export const FUNCTIONS_KEYS: FunctionsKey[] = [
  'airconHeater', 'ventilationHeatedSeat', 'window', 'audio',
  'wiper', 'touchscreen', 'seatAdjustment',
];

export const POSITION_KEYS: PositionKey[] = ['fl', 'fr', 'rl', 'rr'];

export const BATTERY_PACK_KEYS: BatteryPackDirectionKey[] = ['front', 'left', 'rear', 'right'];

export const SUSPENSION_KEYS: SuspensionKey[] = ['spring', 'stabilizer', 'lowerArm', 'shockAbsorber'];

export const BRAKE_KEYS: BrakeKey[] = ['brakeOil', 'padF', 'padR', 'discF', 'discR'];

// 내장재 v2: 8개 항목 (사진 필요 6개 + 상태만 2개)
export const INTERIOR_MATERIALS_KEYS: InteriorMaterialsKey[] = [
  'driverSeat', 'rearSeat', 'doorFL', 'doorFR', 'doorRL', 'doorRR', 'ceiling', 'smell',
];

// 사진이 필요한 내장재 항목 (6개)
export const INTERIOR_MATERIALS_PHOTO_KEYS: InteriorMaterialsKey[] = [
  'driverSeat', 'rearSeat', 'doorFL', 'doorFR', 'doorRL', 'doorRR',
];
