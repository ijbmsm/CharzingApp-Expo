import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { InspectionFormData } from '../types';
import {
  BATTERY_PACK_KEYS,
  BRAKE_KEYS,
  POSITION_KEYS,
  BatteryPackDirectionKey,
  BrakeKey,
  PositionKey,
  BatteryPackInspectionItem,
  BaseInspectionItem,
  SuspensionPositionItem,
} from '../../../types/inspection';
import InputButton from '../../../components/InputButton';
import BatteryPackInspectionBottomSheet from '../../../components/inspection/undercarriage/BatteryPackInspectionBottomSheet';
import SuspensionInspectionBottomSheet from '../../../components/inspection/undercarriage/SuspensionInspectionBottomSheet';
import BrakeInspectionBottomSheet from '../../../components/inspection/undercarriage/BrakeInspectionBottomSheet';

interface UndercarriageSectionProps {
  showValidationErrors?: boolean;
}

export const UndercarriageSection: React.FC<UndercarriageSectionProps> = ({ showValidationErrors = false }) => {
  const { watch, setValue } = useFormContext<InspectionFormData>();

  // BottomSheet 상태
  const [isBatteryPackVisible, setIsBatteryPackVisible] = useState(false);
  const [isSuspensionVisible, setIsSuspensionVisible] = useState(false);
  const [isBrakeVisible, setIsBrakeVisible] = useState(false);

  const undercarriage = watch('undercarriage');

  // ========== 배터리 팩 ==========
  const batteryPack = undercarriage?.batteryPack || {};
  const batteryPackStatusCount = Object.values(batteryPack).filter((item) => item?.status).length;
  const batteryPackPhotoCount = BATTERY_PACK_KEYS.filter((key) =>
    batteryPack[key]?.basePhotos?.length || batteryPack[key]?.basePhoto
  ).length;

  // ========== 서스펜션 ==========
  const suspension = undercarriage?.suspension || {};
  const suspensionCompleted = Object.values(suspension).filter((item) => item?.status).length;
  const suspensionPhotoCount = POSITION_KEYS.filter((key) => suspension[key]?.basePhotos?.length).length;

  // ========== 브레이크 ==========
  const brake = undercarriage?.brake || {};
  const brakeCompleted = Object.values(brake).filter((item) => item?.status).length;

  // ========== 핸들러 ==========
  const handleBatteryPackSave = (data: Record<BatteryPackDirectionKey, BatteryPackInspectionItem>) => {
    setValue('undercarriage.batteryPack', data, { shouldValidate: true });
  };

  const handleSuspensionSave = (
    data: Record<PositionKey, SuspensionPositionItem>,
    basePhotos: Record<string, string[]>
  ) => {
    // 위치별 데이터에 basePhotos 포함
    const suspensionData: Record<string, SuspensionPositionItem> = {};
    POSITION_KEYS.forEach((key) => {
      suspensionData[key] = {
        ...data[key],
        basePhotos: basePhotos[key] || [],
      };
    });
    setValue('undercarriage.suspension', suspensionData, { shouldValidate: true });
  };

  const handleBrakeSave = (data: Record<BrakeKey, BaseInspectionItem>) => {
    setValue('undercarriage.brake', data, { shouldValidate: true });
  };

  return (
    <View style={styles.container}>
      {/* 섹션 설명 */}
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>
          하체 검사: 배터리 팩 4방향, 서스펜션 4위치, 브레이크 5개
        </Text>
      </View>

      {/* 배터리 팩 (4방향) */}
      <InputButton
        label="배터리 팩 검사"
        isCompleted={batteryPackStatusCount >= 2 && batteryPackPhotoCount >= 2}
        value={
          batteryPackStatusCount > 0 || batteryPackPhotoCount > 0
            ? `상태 ${batteryPackStatusCount}/4 | 사진 ${batteryPackPhotoCount}/4`
            : '4방향 검사'
        }
        onPress={() => setIsBatteryPackVisible(true)}
        showError={showValidationErrors}
      />

      {/* 서스펜션 (4위치) */}
      <InputButton
        label="서스펜션 검사"
        isCompleted={suspensionCompleted >= 4 && suspensionPhotoCount >= 4}
        value={
          suspensionCompleted > 0 || suspensionPhotoCount > 0
            ? `상태 ${suspensionCompleted}/4 | 사진 ${suspensionPhotoCount}/4`
            : '4개 위치 검사'
        }
        onPress={() => setIsSuspensionVisible(true)}
        showError={showValidationErrors}
      />

      {/* 브레이크 (5개) */}
      <InputButton
        label="브레이크 검사"
        isCompleted={brakeCompleted >= 3}
        value={brakeCompleted > 0 ? `${brakeCompleted}/5 완료` : '5개 항목 검사'}
        onPress={() => setIsBrakeVisible(true)}
        showError={showValidationErrors}
      />

      {/* BottomSheet 컴포넌트들 */}
      <BatteryPackInspectionBottomSheet
        visible={isBatteryPackVisible}
        onClose={() => setIsBatteryPackVisible(false)}
        onSave={handleBatteryPackSave}
        initialData={batteryPack as Record<BatteryPackDirectionKey, BatteryPackInspectionItem>}
      />

      <SuspensionInspectionBottomSheet
        visible={isSuspensionVisible}
        onClose={() => setIsSuspensionVisible(false)}
        onSave={handleSuspensionSave}
        initialData={suspension as Record<PositionKey, SuspensionPositionItem>}
      />

      <BrakeInspectionBottomSheet
        visible={isBrakeVisible}
        onClose={() => setIsBrakeVisible(false)}
        onSave={handleBrakeSave}
        initialData={brake as Record<BrakeKey, BaseInspectionItem>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(16),
  },
  descriptionBox: {
    backgroundColor: '#F3F4F6',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    textAlign: 'center',
  },
});
