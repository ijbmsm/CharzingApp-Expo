import { type VehicleTrim, type ModelData } from '../../services/firebaseService';

export interface Vehicle {
  id: string;
  make: string; // 제조사 (현대, 기아, 테슬라 등)
  model: string; // 모델명 (아이오닉 5, EV6 등)
  year: number; // 대표 연식 (최신)
  availableYears?: number[]; // 사용 가능한 모든 연식
  batteryCapacity?: string; // 배터리 용량
  range?: string; // 주행거리
  image?: string; // 차량 이미지 URL
  trim?: string; // 트림 (Air, Earth, GT-Line 등)
  trimId?: string; // 트림 ID
}

export interface VehicleTrimInfo {
  id: string;
  trimId: string;
  trimName: string;
  fullModel: string; // EV3 Standard Air 등
  batteryCapacity?: string;
  range?: string;
  availableYears?: number[];
  wheels?: string[];
  efficiency?: { [wheel: string]: string };
  variantName: string; // Standard, Long Range 등
}

export interface VehicleVariant {
  id: string;
  variantName: string; // Standard, Long Range 등  
  fullModel: string; // EV3 Standard Air 등
  batteryCapacity?: string;
  range?: string;
  availableYears?: number[];
  hasTrims: boolean;
  trims?: VehicleTrimInfo[];
  wheels?: string[];
  efficiency?: { [wheel: string]: string };
}

export interface VehicleGroup {
  id: string; // 모델 ID (예: ev3)
  make: string; // 제조사 (기아)
  brandName: string; // 브랜드명
  brandId: string;
  baseModel: string; // 기본 모델명 (EV3)
  variants: VehicleVariant[]; // Standard, Long Range 등
  image?: string;
  imageUrl?: string | null; // Firebase Storage 이미지 URL
}

export interface VehicleSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  editMode?: boolean;
  existingVehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    batteryCapacity?: string;
    range?: string;
  };
}

export interface BrandData {
  id: string;
  name: string;
  logoUrl?: string;
  modelsCount?: number;
}

export { type VehicleTrim, type ModelData };