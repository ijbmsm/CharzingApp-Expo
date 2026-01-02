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
 * 데이터 내 모든 이미지 URI 처리 (v2 구조)
 * - 로컬 이미지 → FileSystem에 복사
 * - Firebase URL → 그대로 유지
 */
async function saveImagesInData(data: any, userId: string): Promise<void> {
  // ========== 1. VehicleInfo 이미지 ==========
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

  // ========== 2. VinCheck 이미지 ==========
  if (data.vinCheck?.registrationImageUris?.length > 0) {
    data.vinCheck.registrationImageUris = await imageStorage.saveImages(
      userId,
      data.vinCheck.registrationImageUris,
      'registration'
    );
  }
  if (data.vinCheck?.vinImageUris?.length > 0) {
    data.vinCheck.vinImageUris = await imageStorage.saveImages(
      userId,
      data.vinCheck.vinImageUris,
      'vinCheck'
    );
  }

  // ========== 3. Exterior (v2 구조) ==========
  if (data.exterior) {
    // 외판 기본 사진
    if (data.exterior.basePhotos) {
      await saveBasePhotos(data.exterior.basePhotos, userId, 'ext_base');
    }
    // bodyPanel (각 항목에 issueImageUris 포함)
    if (data.exterior.bodyPanel) {
      await saveInspectionItems(data.exterior.bodyPanel, userId, 'bodyPanel');
    }
    // frame
    if (data.exterior.frame) {
      await saveInspectionItems(data.exterior.frame, userId, 'frame');
    }
    // glass
    if (data.exterior.glass) {
      await saveInspectionItems(data.exterior.glass, userId, 'glass');
    }
    // lamp
    if (data.exterior.lamp) {
      await saveInspectionItems(data.exterior.lamp, userId, 'lamp');
    }
  }

  // ========== 4. Interior (v2 구조) ==========
  if (data.interior) {
    // 내장재 (materials: basePhoto + issueImageUris)
    if (data.interior.materials) {
      await saveInspectionItemsWithBasePhoto(data.interior.materials, userId, 'materials');
    }
    // 기능 (functions: issueImageUris만)
    if (data.interior.functions) {
      await saveInspectionItems(data.interior.functions, userId, 'functions');
    }
  }

  // ========== 5. TireAndWheel (v2 구조) ==========
  if (data.tireAndWheel) {
    // 타이어 (tire: basePhoto + issueImageUris)
    if (data.tireAndWheel.tire) {
      await saveInspectionItemsWithBasePhoto(data.tireAndWheel.tire, userId, 'tire');
    }
    // 휠 (wheel: basePhoto + issueImageUris)
    if (data.tireAndWheel.wheel) {
      await saveInspectionItemsWithBasePhoto(data.tireAndWheel.wheel, userId, 'wheel');
    }
  }

  // ========== 6. Undercarriage (v2 구조) ==========
  if (data.undercarriage) {
    // 배터리 팩 (batteryPack: basePhoto + issueImageUris)
    if (data.undercarriage.batteryPack) {
      await saveInspectionItemsWithBasePhoto(data.undercarriage.batteryPack, userId, 'batteryPack');
    }
    // 서스펜션 (suspension: issueImageUris만)
    if (data.undercarriage.suspension) {
      await saveInspectionItems(data.undercarriage.suspension, userId, 'suspension');
    }
    // 브레이크 (brake: issueImageUris만)
    if (data.undercarriage.brake) {
      await saveInspectionItems(data.undercarriage.brake, userId, 'brake');
    }
  }

  // ========== 7. Other 이미지 ==========
  if (data.other?.items) {
    for (let i = 0; i < data.other.items.length; i++) {
      const item = data.other.items[i];
      if (item.imageUris?.length > 0) {
        item.imageUris = await imageStorage.saveImages(userId, item.imageUris, `other_${i}`);
      }
    }
  }

  // ========== 8. 진단사 서명 ==========
  if (data.diagnosticianConfirmation?.signatureDataUrl) {
    // base64 서명은 그대로 유지 (별도 처리 필요 없음)
  }
}

/**
 * 기본 사진 객체 저장 (exterior.basePhotos 등)
 */
async function saveBasePhotos(basePhotos: Record<string, string | undefined>, userId: string, prefix: string): Promise<void> {
  for (const [key, uri] of Object.entries(basePhotos)) {
    if (uri && typeof uri === 'string' && uri.startsWith('file://')) {
      const saved = await imageStorage.saveImages(userId, [uri], `${prefix}_${key}`);
      if (saved[0]) {
        basePhotos[key] = saved[0];
      }
    }
  }
}

/**
 * 검사 항목 이미지 저장 (issueImageUris만 있는 경우)
 */
async function saveInspectionItems(items: Record<string, any>, userId: string, prefix: string): Promise<void> {
  for (const [key, item] of Object.entries(items)) {
    if (item?.issueImageUris?.length > 0) {
      item.issueImageUris = await imageStorage.saveImages(userId, item.issueImageUris, `${prefix}_${key}_issue`);
    }
  }
}

/**
 * 검사 항목 이미지 저장 (basePhoto + issueImageUris 있는 경우)
 */
async function saveInspectionItemsWithBasePhoto(items: Record<string, any>, userId: string, prefix: string): Promise<void> {
  for (const [key, item] of Object.entries(items)) {
    // basePhoto 저장
    if (item?.basePhoto && typeof item.basePhoto === 'string' && item.basePhoto.startsWith('file://')) {
      const saved = await imageStorage.saveImages(userId, [item.basePhoto], `${prefix}_${key}_base`);
      item.basePhoto = saved[0];
    }
    // issueImageUris 저장
    if (item?.issueImageUris?.length > 0) {
      item.issueImageUris = await imageStorage.saveImages(userId, item.issueImageUris, `${prefix}_${key}_issue`);
    }
  }
}

/**
 * 🔥 Draft 내 이미지 개수 추적 (v2 구조)
 */
function countImagesInDraft(draft: any): Record<string, number> {
  const counts: Record<string, number> = {};

  // VehicleInfo
  counts.dashboard = draft.vehicleInfo?.dashboardImageUris?.length || 0;
  counts.vin = draft.vehicleInfo?.vehicleVinImageUris?.length || 0;

  // VinCheck
  counts.registration = draft.vinCheck?.registrationImageUris?.length || 0;
  counts.vinCheck = draft.vinCheck?.vinImageUris?.length || 0;

  // Exterior (v2)
  counts.exteriorBase = draft.exterior?.basePhotos ? Object.values(draft.exterior.basePhotos).filter(Boolean).length : 0;
  counts.bodyPanel = countInspectionImages(draft.exterior?.bodyPanel);
  counts.frame = countInspectionImages(draft.exterior?.frame);
  counts.glass = countInspectionImages(draft.exterior?.glass);
  counts.lamp = countInspectionImages(draft.exterior?.lamp);

  // Interior (v2)
  counts.materials = countInspectionImagesWithBase(draft.interior?.materials);
  counts.functions = countInspectionImages(draft.interior?.functions);

  // TireAndWheel (v2)
  counts.tire = countInspectionImagesWithBase(draft.tireAndWheel?.tire);
  counts.wheel = countInspectionImagesWithBase(draft.tireAndWheel?.wheel);

  // Undercarriage (v2)
  counts.batteryPack = countInspectionImagesWithBase(draft.undercarriage?.batteryPack);
  counts.suspension = countInspectionImages(draft.undercarriage?.suspension);
  counts.brake = countInspectionImages(draft.undercarriage?.brake);

  // Other
  counts.other = draft.other?.items?.reduce(
    (sum: number, item: any) => sum + (item.imageUris?.length || 0),
    0
  ) || 0;

  return counts;
}

/**
 * issueImageUris만 있는 검사 항목의 이미지 카운트
 */
function countInspectionImages(items: Record<string, any> | undefined): number {
  if (!items) return 0;
  return Object.values(items).reduce((sum: number, item: any) => {
    return sum + (item?.issueImageUris?.length || 0);
  }, 0);
}

/**
 * basePhoto + issueImageUris 있는 검사 항목의 이미지 카운트
 */
function countInspectionImagesWithBase(items: Record<string, any> | undefined): number {
  if (!items) return 0;
  return Object.values(items).reduce((sum: number, item: any) => {
    const baseCount = item?.basePhoto ? 1 : 0;
    const issueCount = item?.issueImageUris?.length || 0;
    return sum + baseCount + issueCount;
  }, 0);
}
