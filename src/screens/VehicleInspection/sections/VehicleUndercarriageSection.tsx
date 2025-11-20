import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { InspectionFormData, MajorDeviceItem } from '../types';
import SuspensionBottomSheet from '../../../components/inspection/undercarriage/SuspensionBottomSheet';
import BatteryPackBottomSheet from '../../../components/inspection/undercarriage/BatteryPackBottomSheet';
import { SteeringBottomSheet } from '../../../components/inspection/undercarriage/SteeringBottomSheet';
import { BrakingBottomSheet } from '../../../components/inspection/undercarriage/BrakingBottomSheet';
import InputButton from '../../../components/InputButton';

export const VehicleUndercarriageSection: React.FC = () => {
  const { setValue, watch } = useFormContext<InspectionFormData>();
  const [isSuspensionModalVisible, setIsSuspensionModalVisible] = useState(false);
  const [isBatteryPackModalVisible, setIsBatteryPackModalVisible] = useState(false);
  const [isSteeringModalVisible, setIsSteeringModalVisible] = useState(false);
  const [isBrakingModalVisible, setIsBrakingModalVisible] = useState(false);

  const suspensionData = watch('vehicleUndercarriage.suspensionArms');
  const batteryPackData = watch('vehicleUndercarriage.underBatteryPack');
  const steeringData = watch('vehicleUndercarriage.steering');
  const brakingData = watch('vehicleUndercarriage.braking');

  const getImageCompletionStatus = (data: { [key: string]: string | undefined }) => {
    return Object.values(data).filter(Boolean).length > 0;
  };

  const getDeviceCompletionStatus = (data: { [key: string]: MajorDeviceItem | undefined }) => {
    return Object.values(data).filter((item) => item && item.status).length > 0;
  };

  return (
    <View style={styles.container}>
      <InputButton
        label="서스펜션 암 및 링크 구조물"
        isCompleted={getImageCompletionStatus(suspensionData)}
        onPress={() => setIsSuspensionModalVisible(true)}
      />

      <InputButton
        label="하부 배터리 팩 상태"
        isCompleted={getImageCompletionStatus(batteryPackData)}
        onPress={() => setIsBatteryPackModalVisible(true)}
      />

      <InputButton
        label="조향"
        isCompleted={getDeviceCompletionStatus(steeringData)}
        onPress={() => setIsSteeringModalVisible(true)}
      />

      <InputButton
        label="제동"
        isCompleted={getDeviceCompletionStatus(brakingData)}
        onPress={() => setIsBrakingModalVisible(true)}
      />

      <SuspensionBottomSheet
        visible={isSuspensionModalVisible}
        photos={suspensionData || {}}
        onClose={() => setIsSuspensionModalVisible(false)}
        onUpdate={(photos) => {
          setValue('vehicleUndercarriage.suspensionArms', photos, { shouldValidate: true });
          setIsSuspensionModalVisible(false);
        }}
      />

      <BatteryPackBottomSheet
        visible={isBatteryPackModalVisible}
        photos={batteryPackData || {}}
        onClose={() => setIsBatteryPackModalVisible(false)}
        onUpdate={(photos) => {
          setValue('vehicleUndercarriage.underBatteryPack', photos, { shouldValidate: true });
          setIsBatteryPackModalVisible(false);
        }}
      />

      <SteeringBottomSheet
        visible={isSteeringModalVisible}
        onClose={() => setIsSteeringModalVisible(false)}
        onSave={(data) => {
          setValue('vehicleUndercarriage.steering', data, { shouldValidate: true });
          setIsSteeringModalVisible(false);
        }}
        initialData={steeringData}
      />

      <BrakingBottomSheet
        visible={isBrakingModalVisible}
        onClose={() => setIsBrakingModalVisible(false)}
        onSave={(data) => {
          setValue('vehicleUndercarriage.braking', data, { shouldValidate: true });
          setIsBrakingModalVisible(false);
        }}
        initialData={brakingData}
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
