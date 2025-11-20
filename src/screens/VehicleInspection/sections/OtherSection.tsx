import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { scale, verticalScale } from 'react-native-size-matters';
import { InspectionFormData } from '../types';
import OtherInspectionBottomSheet from '../../../components/OtherInspectionBottomSheet';
import { OtherInspectionItem } from '../../../services/firebaseService';
import InputButton from '../../../components/InputButton';

export const OtherSection: React.FC = () => {
  const { setValue, watch } = useFormContext<InspectionFormData>();
  const [isOtherModalVisible, setIsOtherModalVisible] = useState(false);

  const otherItems = watch('other.items') || [];

  const handleOtherUpdate = (items: OtherInspectionItem[]) => {
    setValue('other.items', items, { shouldValidate: true });
  };

  const getOtherDisplayText = () => {
    if (!otherItems || otherItems.length === 0) {
      return '기타 점검 사항을 추가하세요';
    }
    return `${otherItems.length}개 항목`;
  };

  const isOtherCompleted = () => {
    return otherItems && otherItems.length > 0;
  };

  return (
    <View style={styles.container}>
      <InputButton
        label="기타 점검"
        isCompleted={isOtherCompleted()}
        value={getOtherDisplayText()}
        onPress={() => setIsOtherModalVisible(true)}
      />

      <OtherInspectionBottomSheet
        visible={isOtherModalVisible}
        items={otherItems}
        onClose={() => setIsOtherModalVisible(false)}
        onUpdate={handleOtherUpdate}
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
});
