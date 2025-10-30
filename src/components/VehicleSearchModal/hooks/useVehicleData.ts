import { useState } from 'react';
import { firebaseService } from '../../../services/firebaseService';
import { type BrandData, type ModelData, type VehicleGroup, type VehicleTrim } from '../types';
import { updateVehicleGroupWithTrims } from '../utils/vehicleDataTransform';

export const useVehicleData = () => {
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [filteredVehicleGroups, setFilteredVehicleGroups] = useState<VehicleGroup[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 브랜드 목록 로드
  const loadBrands = async () => {
    setFirestoreLoading(true);
    try {
      // console.log('🔄 Firestore에서 브랜드 목록 로딩 중...');
      const brandsData = await firebaseService.getBrands();
      // console.log('✅ 브랜드 목록 로딩 완료:', brandsData.length);
      setBrands(brandsData);
      return brandsData;
    } catch (error) {
      console.error('❌ 브랜드 목록 로딩 실패:', error);
      return [];
    } finally {
      setFirestoreLoading(false);
    }
  };

  // 브랜드별 모델 목록 로드
  const loadModels = async (brandName: string) => {
    setIsLoading(true);
    try {
      const brandData = brands.find(brand => brand.name === brandName);
      if (!brandData) return [];

      // console.log(`🔄 Firestore에서 모델 목록 로딩 중: ${brandName} (${brandData.id})`);
      const models = await firebaseService.getModels(brandData.id);
      // console.log(`✅ 모델 목록 로딩 완료: ${models.length}개`);

      // 모델을 차량 그룹으로 변환
      const vehicleGroups: VehicleGroup[] = models.map((model: ModelData) => ({
        id: model.id,
        make: brandName,
        brandName: brandName,
        brandId: brandData.id,
        baseModel: model.name || model.id.toUpperCase(),
        variants: [{
          id: `${model.id}-ready`,
          variantName: '트림 확인',
          fullModel: model.name || model.id.toUpperCase(),
          batteryCapacity: undefined,
          range: undefined,
          availableYears: [],
          hasTrims: true,
          trims: undefined
        }]
      }));

      setFilteredVehicleGroups(vehicleGroups);
      return models;
    } catch (error) {
      console.error('❌ 모델 목록 로딩 실패:', error);
      setFilteredVehicleGroups([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // 모델별 트림 목록 로드
  const loadTrims = async (brandId: string, modelId: string) => {
    try {
      // console.log(`🔄 Loading trims for ${brandId}/${modelId}`);
      const trims = await firebaseService.getVehicleTrims(brandId, modelId);
      
      if (trims && trims.length > 0) {
        // console.log(`✅ 트림 목록 조회 완료: ${trims.length}개`);
        // 트림을 차량 그룹에 동적으로 추가
        setFilteredVehicleGroups(prevGroups => 
          updateVehicleGroupWithTrims(prevGroups, brandId, modelId, trims)
        );
      } else {
        // console.log(`⚠️ 트림 정보 없음: ${modelId}`);
      }
      
      return trims;
    } catch (error) {
      console.error(`❌ 트림 로딩 실패 for ${brandId}/${modelId}:`, error);
      return [];
    }
  };

  return {
    brands,
    setBrands,
    filteredVehicleGroups,
    setFilteredVehicleGroups,
    firestoreLoading,
    isLoading,
    loadBrands,
    loadModels,
    loadTrims,
  };
};