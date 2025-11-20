import { useState } from 'react';
import { Alert } from 'react-native';
import { InspectionFormData } from '../types';
import firebaseService, { VehicleDiagnosisReport, normalizePhoneNumber } from '../../../services/firebaseService';
import sentryLogger from '../../../utils/sentryLogger';

export const useInspectionSubmit = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * 재귀적으로 모든 이미지를 Firebase Storage에 업로드
   */
  const uploadAllImages = async (obj: any, reportId: string, path: string = ''): Promise<any> => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // 배열 처리
    if (Array.isArray(obj)) {
      return await Promise.all(
        obj.map(async (item, index) => {
          // 문자열이면서 로컬 파일 경로인 경우 업로드
          if (typeof item === 'string' && item.startsWith('file://')) {
            const imageName = `${path}_${index}`;
            console.log(`📸 이미지 업로드: ${imageName}`);
            return await firebaseService.uploadReportImage(item, reportId, imageName);
          }
          // 객체인 경우 재귀
          return await uploadAllImages(item, reportId, `${path}_${index}`);
        })
      );
    }

    // 객체 처리
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}_${key}` : key;

      // signatureDataUrl 특별 처리 (base64)
      if (key === 'signatureDataUrl' && typeof value === 'string' && value.startsWith('data:image')) {
        console.log(`✍️ 서명 이미지 업로드: ${currentPath}`);
        result[key] = await firebaseService.uploadBase64Image(value, reportId, currentPath);
      }
      // imageUri, imageUris 필드 특별 처리
      else if ((key === 'imageUri' || key === 'imageUris') && value) {
        if (typeof value === 'string' && value.startsWith('file://')) {
          console.log(`📸 이미지 업로드: ${currentPath}`);
          result[key] = await firebaseService.uploadReportImage(value, reportId, currentPath);
        } else if (Array.isArray(value)) {
          result[key] = await uploadAllImages(value, reportId, currentPath);
        } else {
          result[key] = value;
        }
      }
      // 🔥 일반 문자열도 file://로 시작하면 업로드
      else if (typeof value === 'string' && value.startsWith('file://')) {
        console.log(`📸 이미지 업로드 (일반 필드): ${currentPath}`);
        result[key] = await firebaseService.uploadReportImage(value, reportId, currentPath);
      }
      else if (typeof value === 'object' && value !== null) {
        // 중첩 객체 재귀
        result[key] = await uploadAllImages(value, reportId, currentPath);
      } else {
        result[key] = value;
      }
    }
    return result;
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
    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      // 리포트 제출 시작 로그
      sentryLogger.log('진단 리포트 제출 시작', {
        userId: selectedUserId,
        userName: selectedUserName,
        reservationId: reservationId || 'N/A', // ⭐ 예약 ID 로깅
        mechanicId: mechanicId || 'N/A',       // ⭐ 정비사 ID 로깅
        mechanicName: mechanicName || 'N/A',   // ⭐ 정비사 이름 로깅
        vehicleBrand: data.vehicleInfo.vehicleBrand,
        vehicleName: data.vehicleInfo.vehicleName,
        vehicleYear: data.vehicleInfo.vehicleYear,
        cellCount: data.batteryInfo.batteryCellCount,
        soh: data.batteryInfo.batterySOH,
      });

      setUploadProgress(10);

      // 🔥 Step 1: reportId 먼저 생성
      const reportId = `report_${Date.now()}_${selectedUserId}`;
      console.log('📝 리포트 ID 생성:', reportId);

      setUploadProgress(20);

      // 🔥 Step 2: 모든 이미지를 Firebase Storage에 업로드
      console.log('📸 이미지 업로드 시작...');
      const uploadedData = await uploadAllImages(data, reportId);
      console.log('✅ 모든 이미지 업로드 완료');

      setUploadProgress(50);

      // 🔥 Step 3: 전압 계산 (업로드된 데이터 사용)
      const voltages = uploadedData.batteryInfo.batteryCells.map((c: any) => c.voltage).filter((v: any): v is number => typeof v === 'number');
      const maxVoltage = voltages.length > 0 ? Math.max(...voltages) : 0;
      const minVoltage = voltages.length > 0 ? Math.min(...voltages) : 0;

      setUploadProgress(60);

      // 🔥 Step 4: Report 데이터 생성 (업로드된 이미지 URL 사용)
      const reportData: Omit<VehicleDiagnosisReport, 'id' | 'createdAt' | 'updatedAt'> = {
        reservationId: reservationId || null, // ⭐ 예약 ID (전달된 값 사용)
        userId: selectedUserId,
        userName: selectedUserName,
        userPhone: selectedUserPhone,
        userPhoneNormalized: normalizePhoneNumber(selectedUserPhone), // ✅ 전화번호 정규화
        isGuest: selectedUserId.startsWith('guest_'),                 // ✅ Guest 여부
        mechanicId: mechanicId || undefined,   // ⭐ 작성한 정비사 ID
        mechanicName: mechanicName || undefined, // ⭐ 작성한 정비사 이름
        submittedAt: new Date(),                 // ⭐ 제출 시간
        vehicleBrand: uploadedData.vehicleInfo.vehicleBrand,
        vehicleName: uploadedData.vehicleInfo.vehicleName,
        vehicleGrade: uploadedData.vehicleInfo.vehicleGrade || undefined,
        vehicleYear: uploadedData.vehicleInfo.vehicleYear,
        vehicleVinImageUris: uploadedData.vehicleInfo.vehicleVinImageUris, // ✅ Storage URL
        mileage: parseInt(uploadedData.vehicleInfo.mileage) || 0,
        dashboardImageUris: uploadedData.vehicleInfo.dashboardImageUris, // ✅ Storage URL
        dashboardStatus: uploadedData.vehicleInfo.dashboardStatus === '' ? undefined : uploadedData.vehicleInfo.dashboardStatus,
        dashboardIssueDescription:
          uploadedData.vehicleInfo.dashboardStatus === 'problem'
            ? uploadedData.vehicleInfo.dashboardIssueDescription
            : undefined,
        isVinVerified: uploadedData.vinCheck.isVinVerified,
        hasNoIllegalModification: uploadedData.vinCheck.hasNoIllegalModification,
        hasNoFloodDamage: uploadedData.vinCheck.hasNoFloodDamage,
        carKeyCount: parseInt(uploadedData.vehicleInfo.carKeyCount) || 2,
        diagnosisDate: new Date(),
        cellCount: uploadedData.batteryInfo.batteryCellCount,
        defectiveCellCount: uploadedData.batteryInfo.batteryCells.filter((c: any) => c.isDefective).length,
        normalChargeCount: uploadedData.batteryInfo.normalChargeCount,
        fastChargeCount: uploadedData.batteryInfo.fastChargeCount,
        sohPercentage: uploadedData.batteryInfo.batterySOH !== '' ? parseFloat(uploadedData.batteryInfo.batterySOH) : 0,
        maxVoltage,
        minVoltage,
        cellsData: uploadedData.batteryInfo.batteryCells,
        diagnosisDetails: [],
        comprehensiveInspection: {
          otherInspection: uploadedData.other.items.length > 0 ? uploadedData.other.items : undefined,
        },
        majorDevicesInspection: uploadedData.majorDevices, // ✅ 이미지 URL 포함
        vehicleExteriorInspection: uploadedData.vehicleExterior, // ✅ 이미지 URL 포함
        vehicleUndercarriageInspection: uploadedData.vehicleUndercarriage, // ✅ 이미지 URL 포함
        vehicleInteriorInspection: uploadedData.vehicleInterior, // ✅ 이미지 URL 포함
        diagnosticianConfirmation: uploadedData.diagnosticianConfirmation, // ✅ 서명 이미지 URL 포함
        status: 'pending_review',
      };

      setUploadProgress(80);

      // 🔥 Step 5: Firebase에 저장
      sentryLogger.log('Firebase 리포트 저장 시작', {
        reportId,
        userId: selectedUserId,
        dataSize: JSON.stringify(reportData).length,
      });

      const result = await firebaseService.createVehicleDiagnosisReport(reportId, reportData);

      setUploadProgress(100);

      // 성공 로그 (상세 정보 포함)
      sentryLogger.log('✅ 진단 리포트 제출 성공', {
        reportId,
        reservationId: reservationId || 'N/A',  // ⭐ 예약 ID 로깅
        mechanicId: mechanicId || 'N/A',        // ⭐ 정비사 ID 로깅
        mechanicName: mechanicName || 'N/A',    // ⭐ 정비사 이름 로깅
        userId: selectedUserId,
        userName: selectedUserName,
        vehicleBrand: reportData.vehicleBrand,
        vehicleName: reportData.vehicleName,
        vehicleYear: reportData.vehicleYear,
        vehicleGrade: reportData.vehicleGrade,
        mileage: reportData.mileage,
        cellCount: reportData.cellCount,
        defectiveCellCount: reportData.defectiveCellCount,
        sohPercentage: reportData.sohPercentage,
        maxVoltage: reportData.maxVoltage,
        minVoltage: reportData.minVoltage,
        normalChargeCount: reportData.normalChargeCount,
        fastChargeCount: reportData.fastChargeCount,
        dashboardStatus: reportData.dashboardStatus,
        isVinVerified: reportData.isVinVerified,
        hasNoIllegalModification: reportData.hasNoIllegalModification,
        hasNoFloodDamage: reportData.hasNoFloodDamage,
        hasMajorDevices: !!reportData.majorDevicesInspection,
        hasVehicleExterior: !!reportData.vehicleExteriorInspection,
        hasVehicleUndercarriage: !!reportData.vehicleUndercarriageInspection,
        hasVehicleInterior: !!reportData.vehicleInteriorInspection,
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
      // 에러 로그 (기가막힌 상세 정보)
      sentryLogger.logError('❌ 진단 리포트 제출 실패', error as Error, {
        userId: selectedUserId,
        userName: selectedUserName,
        userPhone: selectedUserPhone,
        vehicleBrand: data.vehicleInfo.vehicleBrand,
        vehicleName: data.vehicleInfo.vehicleName,
        vehicleGrade: data.vehicleInfo.vehicleGrade,
        vehicleYear: data.vehicleInfo.vehicleYear,
        mileage: data.vehicleInfo.mileage,
        carKeyCount: data.vehicleInfo.carKeyCount,
        dashboardStatus: data.vehicleInfo.dashboardStatus,
        dashboardImageCount: data.vehicleInfo.dashboardImageUris.length,
        vinImageCount: data.vehicleInfo.vehicleVinImageUris.length,
        isVinVerified: data.vinCheck.isVinVerified,
        hasNoIllegalModification: data.vinCheck.hasNoIllegalModification,
        hasNoFloodDamage: data.vinCheck.hasNoFloodDamage,
        batteryCellCount: data.batteryInfo.batteryCellCount,
        batterySOH: data.batteryInfo.batterySOH,
        normalChargeCount: data.batteryInfo.normalChargeCount,
        fastChargeCount: data.batteryInfo.fastChargeCount,
        batteryCellsLength: data.batteryInfo.batteryCells.length,
        defectiveCellsCount: data.batteryInfo.batteryCells.filter((c) => c.isDefective).length,
        // 주요 장치 검사
        hasSteering: !!data.majorDevices,
        hasElectrical: !!data.majorDevices?.electrical,
        // 외관 검사
        hasBodyPanel: !!data.vehicleExterior?.bodyPanel,
        bodyPanelCount: data.vehicleExterior?.bodyPanel?.length || 0,
        hasTiresAndWheels: !!data.vehicleExterior?.tiresAndWheels,
        hasVehicleExteriorPhotos: !!data.vehicleExterior?.vehicleExterior,
        // 하부 검사
        hasUnderBatteryPack: !!data.vehicleUndercarriage?.underBatteryPack,
        hasSuspensionArms: !!data.vehicleUndercarriage?.suspensionArms,
        hasSteeringInspection: !!data.vehicleUndercarriage?.steering,
        // 실내 검사
        hasInterior: !!data.vehicleInterior?.interior,
        hasAirconMotor: !!data.vehicleInterior?.airconMotor,
        // 기타 검사
        otherItemsCount: data.other?.items?.length || 0,
        uploadProgress: uploadProgress,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      console.error('진단 리포트 제출 실패:', error);
      Alert.alert('오류', '진단 리포트 제출에 실패했습니다. 다시 시도해주세요.');
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
