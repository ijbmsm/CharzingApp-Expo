import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { InspectionFormData } from '../types';
import {
  BodyPanelKey,
  FrameKey,
  GlassKey,
  LampKey,
  PaintInspectionItem,
  BaseInspectionItem,
} from '../../../types/inspection';
import InputButton from '../../../components/InputButton';
import BodyPanelBottomSheetV2 from '../../../components/inspection/exterior/BodyPanelBottomSheetV2';
import FrameInspectionBottomSheet from '../../../components/inspection/exterior/FrameInspectionBottomSheet';
import GlassInspectionBottomSheet from '../../../components/inspection/exterior/GlassInspectionBottomSheet';
import LampInspectionBottomSheet from '../../../components/inspection/exterior/LampInspectionBottomSheet';

// 기본 사진이 필수인 외판 항목 (6개)
const REQUIRED_BASE_PHOTO_KEYS: BodyPanelKey[] = [
  'hood', 'doorFL', 'doorFR', 'doorRL', 'doorRR', 'trunkLid',
];

interface ExteriorSectionProps {
  showValidationErrors?: boolean;
}

export const ExteriorSection: React.FC<ExteriorSectionProps> = ({ showValidationErrors = false }) => {
  const { watch, setValue } = useFormContext<InspectionFormData>();

  // BottomSheet 상태
  const [isBodyPanelVisible, setIsBodyPanelVisible] = useState(false);
  const [isFrameVisible, setIsFrameVisible] = useState(false);
  const [isGlassVisible, setIsGlassVisible] = useState(false);
  const [isLampVisible, setIsLampVisible] = useState(false);

  const exterior = watch('exterior');

  // ========== 외판 (기본사진 포함) ==========
  const bodyPanel = exterior?.bodyPanel || {};
  const bodyPanelCompleted = Object.values(bodyPanel).filter((item) => item?.status).length;
  const bodyPanelBasePhotoCount = REQUIRED_BASE_PHOTO_KEYS.filter(
    (key) => bodyPanel[key]?.basePhotos?.length || bodyPanel[key]?.basePhoto
  ).length;

  // ========== 프레임 ==========
  const frame = exterior?.frame || {};
  const frameCompleted = Object.values(frame).filter((item) => item?.status).length;

  // ========== 유리 ==========
  const glass = exterior?.glass || {};
  const glassCompleted = Object.values(glass).filter((item) => item?.status).length;

  // ========== 램프 ==========
  const lamp = exterior?.lamp || {};
  const lampCompleted = Object.values(lamp).filter((item) => item?.status).length;

  // ========== 핸들러 ==========
  const handleBodyPanelSave = (data: Record<BodyPanelKey, PaintInspectionItem>) => {
    setValue('exterior.bodyPanel', data, { shouldValidate: true });
  };

  const handleFrameSave = (data: Record<FrameKey, BaseInspectionItem>) => {
    setValue('exterior.frame', data, { shouldValidate: true });
  };

  const handleGlassSave = (data: Record<GlassKey, BaseInspectionItem>) => {
    setValue('exterior.glass', data, { shouldValidate: true });
  };

  const handleLampSave = (data: Record<LampKey, BaseInspectionItem>) => {
    setValue('exterior.lamp', data, { shouldValidate: true });
  };

  return (
    <View style={styles.container}>
      {/* 섹션 설명 */}
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>
          외부 검사: 외판 19개, 프레임 20개, 유리 7개, 램프 5개
        </Text>
      </View>

      {/* 외판 (19개) - 기본 사진 포함 */}
      <InputButton
        label="외판 검사"
        isCompleted={bodyPanelCompleted >= 19 && bodyPanelBasePhotoCount >= 6}
        value={
          bodyPanelCompleted > 0 || bodyPanelBasePhotoCount > 0
            ? `상태 ${bodyPanelCompleted}/19 | 사진 ${bodyPanelBasePhotoCount}/6`
            : '19개 항목 + 기본사진 6컷'
        }
        onPress={() => setIsBodyPanelVisible(true)}
        showError={showValidationErrors}
      />

      {/* 프레임 (20개) */}
      <InputButton
        label="프레임 검사"
        isCompleted={frameCompleted >= 20}
        value={frameCompleted > 0 ? `${frameCompleted}/20 완료` : '20개 항목 검사'}
        onPress={() => setIsFrameVisible(true)}
        showError={showValidationErrors}
      />

      {/* 유리 (7개) */}
      <InputButton
        label="유리 검사"
        isCompleted={glassCompleted >= 7}
        value={glassCompleted > 0 ? `${glassCompleted}/7 완료` : '7개 항목 검사'}
        onPress={() => setIsGlassVisible(true)}
        showError={showValidationErrors}
      />

      {/* 램프 (5개) */}
      <InputButton
        label="램프 검사"
        isCompleted={lampCompleted >= 5}
        value={lampCompleted > 0 ? `${lampCompleted}/5 완료` : '5개 항목 검사'}
        onPress={() => setIsLampVisible(true)}
        showError={showValidationErrors}
      />

      {/* BottomSheet 컴포넌트들 */}
      <BodyPanelBottomSheetV2
        visible={isBodyPanelVisible}
        onClose={() => setIsBodyPanelVisible(false)}
        onSave={handleBodyPanelSave}
        initialData={bodyPanel as Record<BodyPanelKey, PaintInspectionItem>}
      />

      <FrameInspectionBottomSheet
        visible={isFrameVisible}
        onClose={() => setIsFrameVisible(false)}
        onSave={handleFrameSave}
        initialData={frame as Record<FrameKey, BaseInspectionItem>}
      />

      <GlassInspectionBottomSheet
        visible={isGlassVisible}
        onClose={() => setIsGlassVisible(false)}
        onSave={handleGlassSave}
        initialData={glass as Record<GlassKey, BaseInspectionItem>}
      />

      <LampInspectionBottomSheet
        visible={isLampVisible}
        onClose={() => setIsLampVisible(false)}
        onSave={handleLampSave}
        initialData={lamp as Record<LampKey, BaseInspectionItem>}
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
