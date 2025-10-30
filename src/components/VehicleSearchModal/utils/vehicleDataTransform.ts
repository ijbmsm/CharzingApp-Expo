import { firebaseService, type VehicleTrim } from '../../../services/firebaseService';
import { type VehicleGroup, type VehicleVariant, type VehicleTrimInfo } from '../types';

// Firebase Function을 통해 배터리 히스토리 가져오기 (새로운 getVehicleTrims 사용)
export const getVehicleBatteryHistoryAsync = async (brandId: string, modelId: string) => {
  try {
    // console.log(`🔄 Getting battery history for ${brandId}/${modelId} (Firebase Function priority)`);
    
    // 새로운 Firebase Function 사용 (Admin SDK의 listCollections 사용)
    const trims = await firebaseService.getVehicleTrims(brandId, modelId);
    
    if (trims.length > 0) {
      // console.log(`✅ Found ${trims.length} Firebase Function trims for ${brandId}/${modelId}`);
      
      // Firebase Function 결과를 기존 형식으로 변환
      const batteryHistory = trims.map(trim => {
        // VehicleTrim에서 년도 정보 추출
        const years = trim.years.map(y => parseInt(y, 10));
        const startYear = Math.min(...years);
        const endYear = Math.max(...years);
        
        return {
          startYear,
          endYear,
          battery: { capacity: trim.batteryCapacity },
          specs: { range: undefined }, // VehicleTrim에 range 정보가 없음
          trims: [{
            trimId: trim.trimId,
            trimName: trim.trimName,
            wheels: [],
            efficiency: {}
          }]
        };
      });
      
      // console.log(`🔄 Transformed to battery history: ${batteryHistory.length} entries`);
      return batteryHistory;
    } else {
      // console.log(`⚠️ No trims found for ${brandId}/${modelId}`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error getting battery history for ${brandId}/${modelId}:`, error);
    return [];
  }
};

// 차량 그룹에 트림 정보 동적 추가 (트림별 그룹화)
export const updateVehicleGroupWithTrims = (
  vehicleGroups: VehicleGroup[],
  brandId: string,
  modelId: string,
  trims: VehicleTrim[]
): VehicleGroup[] => {
  return vehicleGroups.map(group => {
    if (group.id === modelId) {
      // 트림을 trimName 기준으로 그룹화
      const trimGroups = new Map<string, VehicleTrim[]>();
      trims.forEach(trim => {
        if (!trimGroups.has(trim.trimName)) {
          trimGroups.set(trim.trimName, []);
        }
        trimGroups.get(trim.trimName)!.push(trim);
      });

      // 각 트림 그룹을 VehicleVariant로 변환
      const newVariants: VehicleVariant[] = Array.from(trimGroups.entries()).map(([trimName, trimList]) => {
        // 해당 트림의 모든 연식 수집
        const allYears = trimList.flatMap(trim => 
          trim.years.map(year => parseInt(year, 10))
        ).sort((a, b) => a - b);

        // 트림 정보 변환
        const trimInfos: VehicleTrimInfo[] = trimList.map(trim => ({
          id: trim.trimId,
          trimId: trim.trimId,
          trimName: trim.trimName,
          fullModel: `${group.baseModel} ${trim.trimName}`,
          batteryCapacity: trim.batteryCapacity?.toString(),
          range: undefined, // VehicleTrim에서는 range 정보 없음
          availableYears: trim.years.map(y => parseInt(y, 10)),
          wheels: [],
          efficiency: {},
          variantName: trim.trimName
        }));

        return {
          id: `${modelId}-${trimName.toLowerCase().replace(/\s+/g, '-')}`,
          variantName: trimName,
          fullModel: `${group.baseModel} ${trimName}`,
          batteryCapacity: trimList[0]?.batteryCapacity?.toString(),
          range: undefined,
          availableYears: allYears,
          hasTrims: trimList.length > 1,
          trims: trimInfos,
          wheels: [],
          efficiency: {}
        };
      });

      return {
        ...group,
        variants: newVariants
      };
    }
    return group;
  });
};