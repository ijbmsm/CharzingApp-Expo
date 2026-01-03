import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { InspectionFormData } from '../types';
import {
  POSITION_KEYS,
  PositionKey,
  TireInspectionItem,
  WheelInspectionItem,
} from '../../../types/inspection';
import InputButton from '../../../components/InputButton';
import TireInspectionBottomSheet from '../../../components/inspection/tirewheel/TireInspectionBottomSheet';
import WheelInspectionBottomSheet from '../../../components/inspection/tirewheel/WheelInspectionBottomSheet';

interface TireAndWheelSectionProps {
  showValidationErrors?: boolean;
}

export const TireAndWheelSection: React.FC<TireAndWheelSectionProps> = ({ showValidationErrors = false }) => {
  const { watch, setValue } = useFormContext<InspectionFormData>();

  // BottomSheet 상태
  const [isTireVisible, setIsTireVisible] = useState(false);
  const [isWheelVisible, setIsWheelVisible] = useState(false);

  const tireAndWheel = watch('tireAndWheel');

  // ========== 타이어 ==========
  const tire = tireAndWheel?.tire || {};
  const tireStatusCount = Object.values(tire).filter((item) => item?.status).length;

  // ========== 휠 ==========
  const wheel = tireAndWheel?.wheel || {};
  const wheelStatusCount = Object.values(wheel).filter((item) => item?.status).length;
  const wheelPhotoCount = POSITION_KEYS.filter((key) => wheel[key]?.basePhoto).length;

  // ========== 핸들러 ==========
  const handleTireSave = (data: Record<PositionKey, TireInspectionItem>) => {
    setValue('tireAndWheel.tire', data, { shouldValidate: true });
  };

  const handleWheelSave = (data: Record<PositionKey, WheelInspectionItem>) => {
    setValue('tireAndWheel.wheel', data, { shouldValidate: true });
  };

  return (
    <View style={styles.container}>
      {/* 섹션 설명 */}
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>
          타이어: 트레드 깊이 + 상태 | 휠: 사진 + 상태
        </Text>
      </View>

      {/* 타이어 (4개) - 상태만 필수, 문제 시에만 사진 */}
      <InputButton
        label="타이어 검사"
        isCompleted={tireStatusCount >= 4}
        value={
          tireStatusCount > 0
            ? `상태 ${tireStatusCount}/4`
            : '4개 위치 검사'
        }
        onPress={() => setIsTireVisible(true)}
        showError={showValidationErrors}
      />

      {/* 휠 (4개) */}
      <InputButton
        label="휠 검사"
        isCompleted={wheelStatusCount >= 2 && wheelPhotoCount >= 2}
        value={
          wheelStatusCount > 0 || wheelPhotoCount > 0
            ? `상태 ${wheelStatusCount}/4 | 사진 ${wheelPhotoCount}/4`
            : '4개 위치 검사'
        }
        onPress={() => setIsWheelVisible(true)}
        showError={showValidationErrors}
      />

      {/* BottomSheet 컴포넌트들 */}
      <TireInspectionBottomSheet
        visible={isTireVisible}
        onClose={() => setIsTireVisible(false)}
        onSave={handleTireSave}
        initialData={tire as Record<PositionKey, TireInspectionItem>}
      />

      <WheelInspectionBottomSheet
        visible={isWheelVisible}
        onClose={() => setIsWheelVisible(false)}
        onSave={handleWheelSave}
        initialData={wheel as Record<PositionKey, WheelInspectionItem>}
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
