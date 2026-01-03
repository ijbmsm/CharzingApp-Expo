import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { InspectionFormData } from '../types';
import firebaseService, { VehicleDiagnosisReport, normalizePhoneNumber } from '../../../services/firebaseService';
import sentryLogger from '../../../utils/sentryLogger';

// 🔥 이미지 압축 설정
const IMAGE_COMPRESSION_CONFIG = {
  maxWidth: 1080,      // 최대 너비 (차량 사진에 충분)
  quality: 0.7,        // 70% 품질 (5MB → ~600KB)
};

// 🔥 병렬 업로드 청크 크기
const UPLOAD_CHUNK_SIZE = 6;

export const useInspectionSubmit = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * 🔥 이미지 압축 함수
   * 5MB → ~600KB (10배 감소)
   */
  const compressImage = async (uri: string): Promise<string> => {
    try {
      // base64 이미지는 압축 스킵
      if (uri.startsWith('data:image')) {
        return uri;
      }

      // 이미 http URL이면 스킵 (이미 업로드된 이미지)
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
      }

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: IMAGE_COMPRESSION_CONFIG.maxWidth } }],
        {
          compress: IMAGE_COMPRESSION_CONFIG.quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log(`🗜️ 이미지 압축 완료: ${uri.slice(-30)} → ${result.uri.slice(-30)}`);
      return result.uri;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ 이미지 압축 실패: ${uri.slice(-50)}, 에러: ${errorMsg}`);
      sentryLogger.log(`⚠️ 이미지 압축 실패 (원본 사용)`, { uri: uri.slice(-100), error: errorMsg });
      return uri; // 압축 실패 시 원본 사용
    }
  };

  /**
   * 🔥 청크 단위 병렬 업로드
   * 6개씩 동시에 업로드 → 네트워크 과부하 방지 + 속도 향상
   */
  const uploadInChunks = async <T>(
    items: T[],
    uploadFn: (item: T, index: number) => Promise<any>
  ): Promise<any[]> => {
    const results: any[] = [];

    for (let i = 0; i < items.length; i += UPLOAD_CHUNK_SIZE) {
      const chunk = items.slice(i, i + UPLOAD_CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map((item, chunkIndex) => uploadFn(item, i + chunkIndex))
      );
      results.push(...chunkResults);
      console.log(`📦 청크 업로드 완료: ${i + chunk.length}/${items.length}`);
    }

    return results;
  };

  /**
   * 🔥 단일 이미지 압축 + 업로드
   */
  const compressAndUploadImage = async (
    uri: string,
    reportId: string,
    imageName: string
  ): Promise<string> => {
    try {
      // 0. 파일 존재 여부 확인 (file:// 경로만)
      if (uri.startsWith('file://')) {
        const file = new File(uri);
        if (!file.exists) {
          const errorMsg = `파일이 존재하지 않습니다: ${uri.slice(-50)}`;
          console.error(`❌ ${errorMsg}`);
          sentryLogger.logError(`파일 없음: ${imageName}`, new Error(errorMsg), {
            reportId,
            imageName,
            originalPath: uri,
          });
          throw new Error(errorMsg);
        }
      }

      // 1. 압축
      const compressedUri = await compressImage(uri);

      // 2. 업로드
      console.log(`📸 이미지 업로드 시작: ${imageName}`);
      const uploadedUrl = await firebaseService.uploadReportImage(compressedUri, reportId, imageName);
      console.log(`✅ 이미지 업로드 완료: ${imageName}`);

      return uploadedUrl;
    } catch (error) {
      sentryLogger.logError(`❌ 이미지 업로드 실패: ${imageName}`, error as Error, {
        reportId,
        imageName,
        originalPath: uri,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  /**
   * 🔥 로컬 이미지 URI인지 확인 (file://, content://, ph:// 지원)
   */
  const isLocalImageUri = (uri: string): boolean => {
    return (
      uri.startsWith('file://') ||
      uri.startsWith('content://') ||
      uri.startsWith('ph://') ||
      uri.startsWith('assets-library://')
    );
  };

  /**
   * 🔥 데이터에서 모든 이미지 경로 수집
   * { path: 'vehicleInfo_dashboardImageUris_0', uri: 'file://...' }
   * 지원하는 URI 스키마: file://, content://, ph://, assets-library://
   */
  const collectAllImages = (
    obj: any,
    path: string = ''
  ): Array<{ path: string; uri: string; type: 'file' | 'base64' }> => {
    const images: Array<{ path: string; uri: string; type: 'file' | 'base64' }> = [];

    if (!obj || typeof obj !== 'object') {
      return images;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const currentPath = `${path}_${index}`;
        if (typeof item === 'string' && isLocalImageUri(item)) {
          images.push({ path: currentPath, uri: item, type: 'file' });
        } else if (typeof item === 'object') {
          images.push(...collectAllImages(item, currentPath));
        }
      });
      return images;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}_${key}` : key;

      if (key === 'signatureDataUrl' && typeof value === 'string' && value.startsWith('data:image')) {
        images.push({ path: currentPath, uri: value, type: 'base64' });
      } else if (typeof value === 'string' && isLocalImageUri(value)) {
        images.push({ path: currentPath, uri: value, type: 'file' });
      } else if (typeof value === 'object' && value !== null) {
        images.push(...collectAllImages(value, currentPath));
      }
    }

    return images;
  };

  /**
   * 🔥 데이터 구조에서 이미지 경로를 URL로 대체
   * 지원하는 URI 스키마: file://, content://, ph://, assets-library://
   */
  const replaceImageUris = (
    obj: any,
    urlMap: Map<string, string>,
    path: string = ''
  ): any => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => {
        const currentPath = `${path}_${index}`;
        if (typeof item === 'string' && isLocalImageUri(item)) {
          return urlMap.get(currentPath) || item;
        }
        return replaceImageUris(item, urlMap, currentPath);
      });
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}_${key}` : key;

      if (key === 'signatureDataUrl' && typeof value === 'string' && value.startsWith('data:image')) {
        result[key] = urlMap.get(currentPath) || value;
      } else if (typeof value === 'string' && isLocalImageUri(value)) {
        result[key] = urlMap.get(currentPath) || value;
      } else if (typeof value === 'object' && value !== null) {
        result[key] = replaceImageUris(value, urlMap, currentPath);
      } else {
        result[key] = value;
      }
    }

    return result;
  };

  /**
   * 🔥 최적화된 이미지 업로드 (압축 + 청크 병렬)
   * 기존 대비 약 10~15배 빠름
   */
  const uploadAllImagesOptimized = async (
    data: any,
    reportId: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<any> => {
    // 1️⃣ 모든 이미지 경로 수집
    const allImages = collectAllImages(data);
    const totalImages = allImages.length;

    sentryLogger.log('📸 이미지 업로드 시작', {
      reportId,
      totalImages,
      imageTypes: {
        file: allImages.filter(i => i.type === 'file').length,
        base64: allImages.filter(i => i.type === 'base64').length,
      },
    });

    if (totalImages === 0) {
      console.log('📸 업로드할 이미지 없음');
      return data;
    }

    console.log(`📸 총 ${totalImages}개 이미지 업로드 시작 (청크: ${UPLOAD_CHUNK_SIZE}개씩)`);

    // 2️⃣ 청크 단위로 압축 + 업로드
    let uploadedCount = 0;
    const urlMap = new Map<string, string>();

    const uploadResults = await uploadInChunks(allImages, async (image, index) => {
      try {
        let uploadedUrl: string;

        if (image.type === 'base64') {
          // Base64 서명은 압축 없이 바로 업로드
          uploadedUrl = await firebaseService.uploadBase64Image(image.uri, reportId, image.path);
        } else {
          // 파일 이미지는 압축 후 업로드
          uploadedUrl = await compressAndUploadImage(image.uri, reportId, image.path);
        }

        uploadedCount++;
        onProgress?.(uploadedCount, totalImages);

        return { path: image.path, url: uploadedUrl };
      } catch (error) {
        sentryLogger.logError(`❌ 이미지 업로드 실패: ${image.path}`, error as Error, {
          reportId,
          imagePath: image.path,
          imageType: image.type,
        });
        throw error;
      }
    });

    // 3️⃣ URL 맵 생성
    uploadResults.forEach(({ path, url }) => {
      urlMap.set(path, url);
    });

    // 4️⃣ 원본 데이터에서 이미지 경로를 URL로 대체
    const updatedData = replaceImageUris(data, urlMap);

    sentryLogger.log('✅ 이미지 업로드 완료', {
      reportId,
      totalImages,
      successCount: uploadedCount,
    });

    return updatedData;
  };

  const submitInspection = async (
    data: InspectionFormData,
    selectedUserId: string,
    selectedUserName: string,
    selectedUserPhone: string,
    reservationId?: string | null, // ⭐ 예약 ID (예약으로부터 작성된 경우)
    mechanicId?: string,           // ⭐ 작성한 정비사 ID
    mechanicName?: string          // ⭐ 작성한 정비사 이름
  ) => {
    // 🔥 현재 단계 추적용 변수
    let currentStep = 'INIT';
    let reportId = '';
    let uploadedData: any = null;
    let reportData: any = null;

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      // ========================================
      // 🔥 STEP 0: 입력 데이터 검증
      // ========================================
      currentStep = 'STEP_0_VALIDATE_INPUT';
      sentryLogger.log(`🚀 [${currentStep}] 진단 리포트 제출 시작`, {
        userId: selectedUserId,
        userName: selectedUserName,
        reservationId: reservationId || 'N/A',
        mechanicId: mechanicId || 'N/A',
        mechanicName: mechanicName || 'N/A',
        vehicleBrand: data.vehicleInfo?.vehicleBrand || 'MISSING',
        vehicleName: data.vehicleInfo?.vehicleName || 'MISSING',
        vehicleYear: data.vehicleInfo?.vehicleYear || 'MISSING',
        batteryInfoChecked: data.batteryInfo?.checked || false,
        hasVehicleInfo: !!data.vehicleInfo,
        hasBatteryInfo: !!data.batteryInfo,
        hasVinCheck: !!data.vinCheck,
        hasExterior: !!data.exterior,
        hasInterior: !!data.interior,
        hasTireAndWheel: !!data.tireAndWheel,
        hasUndercarriage: !!data.undercarriage,
        hasOther: !!data.other,
        hasDiagnosticianConfirmation: !!data.diagnosticianConfirmation,
      });
      console.log(`✅ [${currentStep}] 완료`);

      setUploadProgress(5);

      // ========================================
      // 🔥 STEP 1: reportId 생성
      // ========================================
      currentStep = 'STEP_1_GENERATE_REPORT_ID';
      try {
        reportId = `report_${Date.now()}_${selectedUserId}`;
        sentryLogger.log(`📝 [${currentStep}] 리포트 ID 생성`, { reportId });
        console.log(`✅ [${currentStep}] 완료: ${reportId}`);
      } catch (stepError) {
        sentryLogger.logError(`❌ [${currentStep}] 실패`, stepError as Error, { selectedUserId });
        throw stepError;
      }

      // ========================================
      // 🔥 STEP 2: 이미지 업로드 (최적화: 압축 + 청크 병렬)
      // ========================================
      currentStep = 'STEP_2_UPLOAD_IMAGES';
      try {
        // 업로드할 이미지 수 미리 계산
        const allImages = collectAllImages(data);
        sentryLogger.log(`📸 [${currentStep}] 이미지 업로드 시작 (최적화)`, {
          reportId,
          totalImages: allImages.length,
          dashboardImageCount: data.vehicleInfo?.dashboardImageUris?.length || 0,
          vinImageCount: data.vehicleInfo?.vehicleVinImageUris?.length || 0,
          chunkSize: UPLOAD_CHUNK_SIZE,
          compressionEnabled: true,
          compressionWidth: IMAGE_COMPRESSION_CONFIG.maxWidth,
          compressionQuality: IMAGE_COMPRESSION_CONFIG.quality,
        });
        console.log(`🔄 [${currentStep}] 진행 중... (${allImages.length}개 이미지, ${UPLOAD_CHUNK_SIZE}개씩 병렬)`);

        // 🔥 최적화된 업로드 사용 (압축 + 청크 병렬)
        uploadedData = await uploadAllImagesOptimized(data, reportId, (current, total) => {
          // 이미지 업로드 진행률 (5% ~ 80% 구간) - 가장 오래 걸리는 작업
          const imageProgress = 5 + Math.round((current / total) * 75);
          setUploadProgress(imageProgress);
        });

        sentryLogger.log(`✅ [${currentStep}] 이미지 업로드 완료`, {
          reportId,
          uploadedDataKeys: Object.keys(uploadedData || {}),
        });
        console.log(`✅ [${currentStep}] 완료`);
      } catch (stepError) {
        sentryLogger.logError(`❌ [${currentStep}] 실패`, stepError as Error, {
          reportId,
          errorMessage: stepError instanceof Error ? stepError.message : String(stepError),
        });
        throw stepError;
      }

      setUploadProgress(80);

      // ========================================
      // 🔥 STEP 3: 배터리 확인 상태 검증 (실제 데이터는 admin에서 입력)
      // ========================================
      currentStep = 'STEP_3_VALIDATE_BATTERY_CHECK';
      try {
        const batteryInfoChecked = uploadedData?.batteryInfo?.checked || false;
        sentryLogger.log(`🔋 [${currentStep}] 배터리 확인 상태`, {
          reportId,
          batteryInfoChecked,
        });
        console.log(`✅ [${currentStep}] 완료: checked=${batteryInfoChecked}`);
      } catch (stepError) {
        sentryLogger.logError(`❌ [${currentStep}] 실패`, stepError as Error, { reportId });
        throw stepError;
      }

      setUploadProgress(85);

      // ========================================
      // 🔥 STEP 4: Report 데이터 생성
      // ========================================
      currentStep = 'STEP_4_BUILD_REPORT_DATA';
      try {
        sentryLogger.log(`🔧 [${currentStep}] 리포트 데이터 생성 시작`, { reportId });

        // 각 필드 안전하게 접근
        const vehicleInfo = uploadedData?.vehicleInfo || {};
        const batteryInfo = uploadedData?.batteryInfo || {};
        const vinCheck = uploadedData?.vinCheck || {};

        reportData = {
          reservationId: reservationId || null,
          userId: selectedUserId,
          userName: selectedUserName,
          userPhone: selectedUserPhone,
          userPhoneNormalized: normalizePhoneNumber(selectedUserPhone),
          isGuest: selectedUserId.startsWith('guest_'),
          mechanicId: mechanicId || null,
          mechanicName: mechanicName || null,
          submittedAt: new Date(),
          vehicleBrand: vehicleInfo.vehicleBrand || '',
          vehicleName: vehicleInfo.vehicleName || '',
          vehicleGrade: vehicleInfo.vehicleGrade || null,
          vehicleYear: vehicleInfo.vehicleYear || '',
          vehicleVinImageUris: vehicleInfo.vehicleVinImageUris || [],
          mileage: parseInt(vehicleInfo.mileage) || 0,
          dashboardImageUris: vehicleInfo.dashboardImageUris || [],
          dashboardStatus: vehicleInfo.dashboardStatus === '' ? null : vehicleInfo.dashboardStatus,
          dashboardIssueDescription: vehicleInfo.dashboardStatus === 'problem' ? vehicleInfo.dashboardIssueDescription : null,
          isVinVerified: vinCheck.isVinVerified || false,
          hasNoIllegalModification: vinCheck.hasNoIllegalModification || false,
          hasNoFloodDamage: vinCheck.hasNoFloodDamage || false,
          // vinCheck 이미지 (v2)
          registrationImageUris: vinCheck.registrationImageUris || [],
          vinCheckImageUris: vinCheck.vinImageUris || [],
          // vinCheck 문제 설명 (v2)
          vinIssue: vinCheck.vinIssue || null,
          modificationIssue: vinCheck.modificationIssue || null,
          floodIssue: vinCheck.floodIssue || null,
          carKeyCount: parseInt(vehicleInfo.carKeyCount) || 2,
          diagnosisDate: new Date(),
          // 배터리 정보 확인 여부 (상세 데이터는 admin에서 입력)
          batteryInfoChecked: batteryInfo.checked || false,
          // 배터리 상세 데이터는 admin에서 입력하므로 null로 설정
          cellCount: null,
          defectiveCellCount: null,
          normalChargeCount: null,
          fastChargeCount: null,
          sohPercentage: null,
          maxVoltage: null,
          minVoltage: null,
          cellsData: null,
          diagnosisDetails: [],
          comprehensiveInspection: {
            otherInspection: (uploadedData?.other?.items?.length || 0) > 0 ? uploadedData.other.items : null,
          },
          // ========== 검사 v2 구조 (기존 필드명 사용) ==========
          vehicleExteriorInspection: {
            ...uploadedData?.exterior,
            tiresAndWheels: uploadedData?.tireAndWheel || null,
          },
          vehicleInteriorInspection: uploadedData?.interior || null,
          vehicleUndercarriageInspection: uploadedData?.undercarriage || null,
          diagnosticianConfirmation: uploadedData?.diagnosticianConfirmation || null,
          status: 'pending_review',
        } as Omit<VehicleDiagnosisReport, 'id' | 'createdAt' | 'updatedAt'>;

        const dataSize = JSON.stringify(reportData).length;
        sentryLogger.log(`✅ [${currentStep}] 리포트 데이터 생성 완료`, {
          reportId,
          dataSize,
          dataSizeKB: (dataSize / 1024).toFixed(2) + 'KB',
          dataSizeMB: (dataSize / (1024 * 1024)).toFixed(4) + 'MB',
          fieldCount: Object.keys(reportData).length,
        });
        console.log(`✅ [${currentStep}] 완료: ${(dataSize / 1024).toFixed(2)}KB`);

        // 🔥 1MB 경고 (Firestore 문서 제한)
        if (dataSize > 900000) {
          sentryLogger.log(`⚠️ [${currentStep}] 경고: 데이터 크기가 1MB에 근접`, {
            reportId,
            dataSize,
            limit: 1048576,
          });
        }
      } catch (stepError) {
        sentryLogger.logError(`❌ [${currentStep}] 실패`, stepError as Error, {
          reportId,
          uploadedDataKeys: Object.keys(uploadedData || {}),
        });
        throw stepError;
      }

      setUploadProgress(90);

      // ========================================
      // 🔥 STEP 5: Firebase에 저장
      // ========================================
      currentStep = 'STEP_5_SAVE_TO_FIREBASE';
      try {
        sentryLogger.log(`💾 [${currentStep}] Firebase 저장 시작`, {
          reportId,
          userId: selectedUserId,
          dataSize: JSON.stringify(reportData).length,
        });
        console.log(`🔄 [${currentStep}] 진행 중...`);

        const result = await firebaseService.createVehicleDiagnosisReport(reportId, reportData);

        sentryLogger.log(`✅ [${currentStep}] Firebase 저장 완료`, {
          reportId,
          result,
        });
        console.log(`✅ [${currentStep}] 완료`);
      } catch (stepError) {
        sentryLogger.logError(`❌ [${currentStep}] Firebase 저장 실패`, stepError as Error, {
          reportId,
          errorMessage: stepError instanceof Error ? stepError.message : String(stepError),
          errorCode: (stepError as any)?.code || 'UNKNOWN',
          dataSize: JSON.stringify(reportData).length,
        });
        throw stepError;
      }

      setUploadProgress(100);

      // 성공 로그 (상세 정보 포함)
      sentryLogger.log('✅ 진단 리포트 제출 성공', {
        reportId,
        reservationId: reservationId || 'N/A',
        mechanicId: mechanicId || 'N/A',
        mechanicName: mechanicName || 'N/A',
        userId: selectedUserId,
        userName: selectedUserName,
        vehicleBrand: reportData.vehicleBrand,
        vehicleName: reportData.vehicleName,
        vehicleYear: reportData.vehicleYear,
        vehicleGrade: reportData.vehicleGrade,
        mileage: reportData.mileage,
        batteryInfoChecked: reportData.batteryInfoChecked,
        dashboardStatus: reportData.dashboardStatus,
        isVinVerified: reportData.isVinVerified,
        hasNoIllegalModification: reportData.hasNoIllegalModification,
        hasNoFloodDamage: reportData.hasNoFloodDamage,
        hasExterior: !!reportData.vehicleExteriorInspection,
        hasInterior: !!reportData.vehicleInteriorInspection,
        hasTireAndWheel: !!reportData.vehicleExteriorInspection?.tiresAndWheels,
        hasUndercarriage: !!reportData.vehicleUndercarriageInspection,
        otherItemsCount: reportData.comprehensiveInspection?.otherInspection?.length || 0,
        status: reportData.status,
        timestamp: new Date().toISOString(),
      });

      // ⭐ Step 6: 예약에 리포트 ID 연결 (예약으로부터 작성된 경우에만)
      if (reservationId) {
        try {
          await firebaseService.updateReservationReportId(reservationId, reportId);
          sentryLogger.log('✅ 예약에 리포트 ID 연결 완료', {
            reservationId,
            reportId,
          });
        } catch (error) {
          // 연결 실패는 치명적이지 않으므로 로그만 남기고 계속 진행
          sentryLogger.logError('⚠️ 예약에 리포트 ID 연결 실패', error as Error, {
            reservationId,
            reportId,
          });
        }
      }

      Alert.alert('성공', '진단 리포트가 성공적으로 제출되었습니다.');

      return true;
    } catch (error) {
      // 🔥 에러 로그 (단계 정보 포함!)
      sentryLogger.logError(`❌ 진단 리포트 제출 실패 [${currentStep}]`, error as Error, {
        // 🔥 핵심: 어느 단계에서 실패했는지
        failedAtStep: currentStep,
        reportId: reportId || 'NOT_GENERATED',
        hasUploadedData: !!uploadedData,
        hasReportData: !!reportData,

        // 사용자 정보
        userId: selectedUserId,
        userName: selectedUserName,
        userPhone: selectedUserPhone,

        // 차량 정보 (안전하게)
        vehicleBrand: data?.vehicleInfo?.vehicleBrand || 'N/A',
        vehicleName: data?.vehicleInfo?.vehicleName || 'N/A',
        vehicleGrade: data?.vehicleInfo?.vehicleGrade || 'N/A',
        vehicleYear: data?.vehicleInfo?.vehicleYear || 'N/A',
        mileage: data?.vehicleInfo?.mileage || 'N/A',
        carKeyCount: data?.vehicleInfo?.carKeyCount || 'N/A',
        dashboardStatus: data?.vehicleInfo?.dashboardStatus || 'N/A',
        dashboardImageCount: data?.vehicleInfo?.dashboardImageUris?.length || 0,
        vinImageCount: data?.vehicleInfo?.vehicleVinImageUris?.length || 0,

        // VIN 체크
        isVinVerified: data?.vinCheck?.isVinVerified || false,
        hasNoIllegalModification: data?.vinCheck?.hasNoIllegalModification || false,
        hasNoFloodDamage: data?.vinCheck?.hasNoFloodDamage || false,

        // 배터리 정보 확인
        batteryInfoChecked: data?.batteryInfo?.checked || false,

        // 섹션 존재 여부 (v2 구조)
        hasExterior: !!data?.exterior,
        hasExteriorBodyPanel: !!data?.exterior?.bodyPanel,
        hasExteriorFrame: !!data?.exterior?.frame,
        hasExteriorGlass: !!data?.exterior?.glass,
        hasExteriorLamp: !!data?.exterior?.lamp,
        hasInterior: !!data?.interior,
        hasInteriorMaterials: !!data?.interior?.materials,
        hasInteriorFunctions: !!data?.interior?.functions,
        hasTireAndWheel: !!data?.tireAndWheel,
        hasUndercarriage: !!data?.undercarriage,
        hasBatteryPack: !!data?.undercarriage?.batteryPack,
        hasSuspension: !!data?.undercarriage?.suspension,
        hasBrake: !!data?.undercarriage?.brake,
        otherItemsCount: data?.other?.items?.length || 0,

        // 에러 상세
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCode: (error as any)?.code || 'UNKNOWN',
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      console.error(`❌ [${currentStep}] 진단 리포트 제출 실패:`, error);
      Alert.alert(
        '오류',
        `진단 리포트 제출에 실패했습니다.\n\n[단계: ${currentStep}]\n${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
      return false;
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return {
    isSubmitting,
    uploadProgress,
    submitInspection,
  };
};
