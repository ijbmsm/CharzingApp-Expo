import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { InspectionFormData, MajorDeviceItem } from '../types';
import { ElectricalBottomSheet } from '../../../components/inspection/majorDevices/ElectricalBottomSheet';
import InputButton from '../../../components/InputButton';

export const MajorDevicesSection: React.FC = () => {
  const { setValue, watch } = useFormContext<InspectionFormData>();
  const [isElectricalModalVisible, setIsElectricalModalVisible] = useState(false);

  const electricalData = watch('majorDevices.electrical');

  const handleElectricalSave = (data: { [key: string]: MajorDeviceItem }) => {
    setValue('majorDevices.electrical', data, { shouldValidate: true });
    setIsElectricalModalVisible(false);
  };

  const getCompletionStatus = (data: { [key: string]: MajorDeviceItem | undefined } | undefined) => {
    if (!data) return false;
    const items = Object.values(data).filter((item) => item && item.status);
    return items.length > 0;
  };

  return (
    <View style={styles.container}>
      <InputButton
        label="전기"
        isCompleted={getCompletionStatus(electricalData)}
        onPress={() => setIsElectricalModalVisible(true)}
      />

      <ElectricalBottomSheet
        visible={isElectricalModalVisible}
        onClose={() => setIsElectricalModalVisible(false)}
        onSave={handleElectricalSave}
        initialData={electricalData || {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: scale(16),
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(16),
  },
});
