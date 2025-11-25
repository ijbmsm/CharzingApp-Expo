import { useEffect, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { draftStorage } from '../storage/mmkv';
import { imageStorage } from '../storage/imageStorage';
import sentryLogger from '../utils/sentryLogger';

interface UseAutoSaveOptions {
  methods: UseFormReturn<any>; // 🔥 methods를 직접 받음
  userId: string;
  userInfo: { userName: string; userPhone: string }; // 🔥 사용자 정보 추가
  delay?: number;
  enabled?: boolean;
  onSave?: (savedAt: Date) => void;
  onError?: (error: Error) => void;
}

/**
 * React Hook Form 자동 저장 훅
 * - MMKV에 폼 데이터 저장
 * - 이미지는 FileSystem에 복사
 * - Debounce 적용 (기본 500ms)
 * - 안드로이드/iOS 모두 지원
 */
export function useAutoSave({
  methods,
  userId,
  userInfo,
  delay = 500, // 500ms debounce (기본값)
  enabled = true,
  onSave,
  onError,
}: UseAutoSaveOptions) {
  const values = methods.watch();
  const lastSavedRef = useRef<string>('');
  const prevDataRef = useRef<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 비활성화 또는 userId 없으면 스킵
    if (!enabled || !userId) {
      console.log('🔍 AutoSave 비활성화:', { enabled, userId });
      return;
    }

    // ✅ debounce 전에 변경사항 체크 (핵심 최적화!)
    const currentData = JSON.stringify(values);
    if (currentData === prevDataRef.current) {
      // 변화 없음 → timer 생성하지 않음
      return;
    }
    prevDataRef.current = currentData;

    const timer = setTimeout(async () => {
      const startTime = Date.now(); // 🔥 성능 측정 시작

      try {
        console.log('🔍 AutoSave 트리거 (debounce 후 시작)');
        setIsSaving(true);

        // 마지막 저장과 비교 (중복 저장 방지)
        if (currentData === lastSavedRef.current) {
          console.log('⏭️ 이미 저장됨 - 스킵');
          setIsSaving(false);
          return;
        }

        // 🔥 Flow Tracing: Draft 저장 시작
        sentryLogger.logDraftSaveStart(userId, currentData.length);
        console.log('💾 데이터 저장 중...', { dataSize: currentData.length });

        // 이미지 처리 전 데이터 복사
        const dataToSave = JSON.parse(currentData);

        // 🖼️ 이미지 저장 처리
        await saveImagesInData(dataToSave, userId);

        // 💾 Storage에 저장 (MMKV or AsyncStorage) - 사용자 정보 포함
        const success = await draftStorage.saveDraft(userId, dataToSave, userInfo);

        if (success) {
          lastSavedRef.current = currentData;
          const savedAt = new Date();
          const duration = Date.now() - startTime; // 🔥 성능 측정 완료

          console.log('✅ 임시저장 완료:', savedAt.toISOString(), `(${duration}ms)`);
          onSave?.(savedAt);

          // 🔥 Flow Tracing: Draft 저장 성공 (Breadcrumb만 사용)
          sentryLogger.logDraftSaveSuccess(userId, currentData.length, duration);

          // 🔥 Draft 구조 분석 (이미지 개수 추적)
          const imageCounts = countImagesInDraft(dataToSave);
          const totalImages = Object.values(imageCounts).reduce((sum, count) => sum + count, 0);
          if (totalImages > 0) {
            sentryLogger.logDraftImageCount(userId, totalImages, imageCounts);
          }
        } else {
          console.error('❌ 저장 실패: draftStorage.saveDraft returned false');
        }
      } catch (error) {
        const err = error as Error;
        console.error('❌ 임시저장 에러:', err);
        onError?.(err);
        sentryLogger.logError('❌ 임시저장 실패', err, { userId });
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [values, userId, enabled, delay]);

  return { isSaving };
}

/**
 * 데이터 내 모든 이미지 URI 처리
 * - 로컬 이미지 → FileSystem에 복사
 * - Firebase URL → 그대로 유지
 */
async function saveImagesInData(data: any, userId: string): Promise<void> {
  // VehicleInfo 이미지
  if (data.vehicleInfo?.dashboardImageUris?.length > 0) {
    data.vehicleInfo.dashboardImageUris = await imageStorage.saveImages(
      userId,
      data.vehicleInfo.dashboardImageUris,
      'dashboard'
    );
  }
  if (data.vehicleInfo?.vehicleVinImageUris?.length > 0) {
    data.vehicleInfo.vehicleVinImageUris = await imageStorage.saveImages(
      userId,
      data.vehicleInfo.vehicleVinImageUris,
      'vin'
    );
  }

  // MajorDevices 이미지 (조향, 제동) - 타입 안전하게 처리
  if (data.majorDevices) {
    const devices: any = data.majorDevices;
    if (devices.steering) {
      await saveDeviceImages(devices.steering, userId, 'steering');
    }
    if (devices.braking) {
      await saveDeviceImages(devices.braking, userId, 'braking');
    }
  }

  // VehicleExterior 이미지 - 타입 안전하게 처리
  if (data.vehicleExterior) {
    const exterior: any = data.vehicleExterior;
    if (exterior.paintThickness) {
      for (let i = 0; i < exterior.paintThickness.length; i++) {
        const item = exterior.paintThickness[i];
        if (item.imageUris?.length > 0) {
          item.imageUris = await imageStorage.saveImages(userId, item.imageUris, `paint_${i}`);
        }
      }
    }
    if (exterior.tireTread) {
      for (let i = 0; i < exterior.tireTread.length; i++) {
        const item = exterior.tireTread[i];
        if (item.imageUris?.length > 0) {
          item.imageUris = await imageStorage.saveImages(userId, item.imageUris, `tire_${i}`);
        }
      }
    }
    if (exterior.tiresAndWheels?.imageUris?.length > 0) {
      exterior.tiresAndWheels.imageUris = await imageStorage.saveImages(
        userId,
        exterior.tiresAndWheels.imageUris,
        'tires_wheels'
      );
    }
  }

  // VehicleUndercarriage 이미지 - 타입 안전하게 처리
  if (data.vehicleUndercarriage) {
    const undercarriage: any = data.vehicleUndercarriage;
    if (undercarriage.batteryPack?.imageUris?.length > 0) {
      undercarriage.batteryPack.imageUris = await imageStorage.saveImages(
        userId,
        undercarriage.batteryPack.imageUris,
        'battery_pack'
      );
    }
    if (undercarriage.suspension?.imageUris?.length > 0) {
      undercarriage.suspension.imageUris = await imageStorage.saveImages(
        userId,
        undercarriage.suspension.imageUris,
        'suspension'
      );
    }
  }

  // VehicleInterior 이미지 - 타입 안전하게 처리
  if (data.vehicleInterior) {
    const interior: any = data.vehicleInterior;
    if (interior.interiorCondition?.imageUris?.length > 0) {
      interior.interiorCondition.imageUris = await imageStorage.saveImages(
        userId,
        interior.interiorCondition.imageUris,
        'interior'
      );
    }
    if (interior.airConditioner?.imageUris?.length > 0) {
      interior.airConditioner.imageUris = await imageStorage.saveImages(
        userId,
        interior.airConditioner.imageUris,
        'air_conditioner'
      );
    }
  }

  // Other 이미지
  if (data.other?.items) {
    for (let i = 0; i < data.other.items.length; i++) {
      const item = data.other.items[i];
      if (item.imageUris?.length > 0) {
        item.imageUris = await imageStorage.saveImages(userId, item.imageUris, `other_${i}`);
      }
    }
  }
}

/**
 * 주요 장치 이미지 저장 헬퍼
 */
async function saveDeviceImages(deviceData: any, userId: string, category: string): Promise<void> {
  const keys = Object.keys(deviceData);
  for (const key of keys) {
    const item = deviceData[key];
    if (item?.imageUri) {
      const saved = await imageStorage.saveImages(userId, [item.imageUri], `${category}_${key}`);
      item.imageUri = saved[0];
    }
  }
}

/**
 * 🔥 Draft 내 이미지 개수 추적 (섹션별)
 */
function countImagesInDraft(draft: any): Record<string, number> {
  const counts: Record<string, number> = {};

  // VehicleInfo
  counts.dashboard = draft.vehicleInfo?.dashboardImageUris?.length || 0;
  counts.vin = draft.vehicleInfo?.vehicleVinImageUris?.length || 0;

  // MajorDevices (각 장치별 imageUri 카운트)
  let steeringCount = 0;
  let brakingCount = 0;

  if (draft.majorDevices?.steering) {
    steeringCount = Object.values(draft.majorDevices.steering).filter((item: any) => item?.imageUri).length;
  }
  if (draft.majorDevices?.braking) {
    brakingCount = Object.values(draft.majorDevices.braking).filter((item: any) => item?.imageUri).length;
  }

  counts.steering = steeringCount;
  counts.braking = brakingCount;

  // VehicleExterior
  counts.paintThickness = draft.vehicleExterior?.paintThickness?.reduce(
    (sum: number, item: any) => sum + (item.imageUris?.length || 0),
    0
  ) || 0;
  counts.tireTread = draft.vehicleExterior?.tireTread?.reduce(
    (sum: number, item: any) => sum + (item.imageUris?.length || 0),
    0
  ) || 0;
  counts.tiresWheels = draft.vehicleExterior?.tiresAndWheels?.imageUris?.length || 0;

  // VehicleUndercarriage
  counts.batteryPack = draft.vehicleUndercarriage?.batteryPack?.imageUris?.length || 0;
  counts.suspension = draft.vehicleUndercarriage?.suspension?.imageUris?.length || 0;

  // VehicleInterior
  counts.interior = draft.vehicleInterior?.interiorCondition?.imageUris?.length || 0;
  counts.airConditioner = draft.vehicleInterior?.airConditioner?.imageUris?.length || 0;

  // Other
  counts.other = draft.other?.items?.reduce(
    (sum: number, item: any) => sum + (item.imageUris?.length || 0),
    0
  ) || 0;

  return counts;
}
