import { useState } from 'react';
import { type BrandData, type ModelData, type VehicleTrim } from '../types';

export const useVehicleCache = () => {
  const [brandCache, setBrandCache] = useState<BrandData[]>([]);
  const [modelCache, setModelCache] = useState<Map<string, ModelData[]>>(new Map());
  const [trimCache, setTrimCache] = useState<Map<string, VehicleTrim[]>>(new Map());

  const updateBrandCache = (brands: BrandData[]) => {
    setBrandCache(brands);
  };

  const updateModelCache = (brandId: string, models: ModelData[]) => {
    setModelCache(prev => new Map(prev.set(brandId, models)));
  };

  const updateTrimCache = (modelKey: string, trims: VehicleTrim[]) => {
    setTrimCache(prev => new Map(prev.set(modelKey, trims)));
  };

  const getModelCacheKey = (brandId: string) => brandId;
  const getTrimCacheKey = (brandId: string, modelId: string) => `${brandId}_${modelId}`;

  return {
    brandCache,
    modelCache,
    trimCache,
    updateBrandCache,
    updateModelCache,
    updateTrimCache,
    getModelCacheKey,
    getTrimCacheKey,
  };
};