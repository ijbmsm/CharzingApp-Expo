import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { InspectionFormData } from '../types';
import {
  InteriorMaterialsKey,
  FunctionsKey,
  BaseInspectionItem,
  InteriorMaterialsItem,
  INTERIOR_MATERIALS_PHOTO_KEYS,
} from '../../../types/inspection';
import InputButton from '../../../components/InputButton';
import MaterialsBottomSheet from '../../../components/inspection/interior/MaterialsBottomSheet';
import FunctionsBottomSheet from '../../../components/inspection/interior/FunctionsBottomSheet';

export const InteriorSection: React.FC = () => {
  const { watch, setValue } = useFormContext<InspectionFormData>();

  // BottomSheet 상태
  const [isMaterialsVisible, setIsMaterialsVisible] = useState(false);
  const [isFunctionsVisible, setIsFunctionsVisible] = useState(false);

  const interior = watch('interior');

  // ========== 내장재 (사진 6개 필수) ==========
  const materials = interior?.materials || {};
  const basePhotoCount = INTERIOR_MATERIALS_PHOTO_KEYS.filter(
    (key) => materials[key as keyof typeof materials]?.basePhoto
  ).length;

  // ========== 기능 ==========
  const functions = interior?.functions || {};
  const functionsCompleted = Object.values(functions).filter((item) => item?.status).length;

  // ========== 핸들러 ==========
  const handleMaterialsSave = (data: Record<InteriorMaterialsKey, InteriorMaterialsItem>) => {
    setValue('interior.materials', data, { shouldValidate: true });
  };

  const handleFunctionsSave = (data: Record<FunctionsKey, BaseInspectionItem>) => {
    setValue('interior.functions', data, { shouldValidate: true });
  };

  return (
    <View style={styles.container}>
      {/* 섹션 설명 */}
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>
          내부 검사: 내장재 8개, 기능 7개
        </Text>
      </View>

      {/* 내장재 (8개) - 사진 6개 필수 + 상태 선택 */}
      <InputButton
        label="내장재 검사"
        isCompleted={basePhotoCount >= 6}
        value={
          basePhotoCount > 0
            ? `사진 ${basePhotoCount}/6 완료`
            : '6개 사진 촬영'
        }
        onPress={() => setIsMaterialsVisible(true)}
      />

      {/* 기능 (7개) - 전부 필수 */}
      <InputButton
        label="기능 검사"
        isCompleted={functionsCompleted >= 7}
        value={functionsCompleted > 0 ? `${functionsCompleted}/7 완료` : '7개 항목 검사'}
        onPress={() => setIsFunctionsVisible(true)}
      />

      {/* BottomSheet 컴포넌트들 */}
      <MaterialsBottomSheet
        visible={isMaterialsVisible}
        onClose={() => setIsMaterialsVisible(false)}
        onSave={handleMaterialsSave}
        initialData={materials as Record<InteriorMaterialsKey, InteriorMaterialsItem>}
      />

      <FunctionsBottomSheet
        visible={isFunctionsVisible}
        onClose={() => setIsFunctionsVisible(false)}
        onSave={handleFunctionsSave}
        initialData={functions as Record<FunctionsKey, BaseInspectionItem>}
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
    marginBottom: verticalScale(16),
  },
  descriptionText: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    textAlign: 'center',
  },
});
