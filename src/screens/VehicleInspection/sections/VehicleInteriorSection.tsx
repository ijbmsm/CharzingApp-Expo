import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { InspectionFormData, MajorDeviceItem } from '../types';
import { InteriorConditionBottomSheet } from '../../../components/inspection/interior/InteriorConditionBottomSheet';
import { AirconMotorBottomSheet } from '../../../components/inspection/interior/AirconMotorBottomSheet';
import { OptionsBottomSheet } from '../../../components/inspection/interior/OptionsBottomSheet';
import { LightingBottomSheet } from '../../../components/inspection/interior/LightingBottomSheet';
import { GlassBottomSheet } from '../../../components/inspection/interior/GlassBottomSheet';
import InputButton from '../../../components/InputButton';

export const VehicleInteriorSection: React.FC = () => {
  const { setValue, watch } = useFormContext<InspectionFormData>();
  const [isInteriorModalVisible, setIsInteriorModalVisible] = useState(false);
  const [isAirconMotorModalVisible, setIsAirconMotorModalVisible] = useState(false);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isLightingModalVisible, setIsLightingModalVisible] = useState(false);
  const [isGlassModalVisible, setIsGlassModalVisible] = useState(false);

  const interiorData = watch('vehicleInterior.interior');
  const airconMotorData = watch('vehicleInterior.airconMotor');
  const optionsData = watch('vehicleInterior.options');
  const lightingData = watch('vehicleInterior.lighting');
  const glassData = watch('vehicleInterior.glass');

  const getCompletionStatus = (data: { [key: string]: MajorDeviceItem | undefined }) => {
    return Object.values(data).filter((item) => item && item.status).length > 0;
  };

  return (
    <View style={styles.container}>
      <InputButton
        label="내장재 상태"
        isCompleted={getCompletionStatus(interiorData)}
        onPress={() => setIsInteriorModalVisible(true)}
      />

      <InputButton
        label="에어컨 및 모터"
        isCompleted={getCompletionStatus(airconMotorData)}
        onPress={() => setIsAirconMotorModalVisible(true)}
      />

      <InputButton
        label="옵션 및 기능"
        isCompleted={getCompletionStatus(optionsData)}
        onPress={() => setIsOptionsModalVisible(true)}
      />

      <InputButton
        label="등화장치"
        isCompleted={getCompletionStatus(lightingData)}
        onPress={() => setIsLightingModalVisible(true)}
      />

      <InputButton
        label="유리"
        isCompleted={getCompletionStatus(glassData)}
        onPress={() => setIsGlassModalVisible(true)}
      />

      <InteriorConditionBottomSheet
        visible={isInteriorModalVisible}
        onClose={() => setIsInteriorModalVisible(false)}
        onSave={(data) => {
          setValue('vehicleInterior.interior', data, { shouldValidate: true });
          setIsInteriorModalVisible(false);
        }}
        initialData={interiorData}
      />

      <AirconMotorBottomSheet
        visible={isAirconMotorModalVisible}
        onClose={() => setIsAirconMotorModalVisible(false)}
        onSave={(data) => {
          setValue('vehicleInterior.airconMotor', data, { shouldValidate: true });
          setIsAirconMotorModalVisible(false);
        }}
        initialData={airconMotorData}
      />

      <OptionsBottomSheet
        visible={isOptionsModalVisible}
        onClose={() => setIsOptionsModalVisible(false)}
        onSave={(data) => {
          setValue('vehicleInterior.options', data, { shouldValidate: true });
          setIsOptionsModalVisible(false);
        }}
        initialData={optionsData}
      />

      <LightingBottomSheet
        visible={isLightingModalVisible}
        onClose={() => setIsLightingModalVisible(false)}
        onSave={(data) => {
          setValue('vehicleInterior.lighting', data, { shouldValidate: true });
          setIsLightingModalVisible(false);
        }}
        initialData={lightingData}
      />

      <GlassBottomSheet
        visible={isGlassModalVisible}
        onClose={() => setIsGlassModalVisible(false)}
        onSave={(data) => {
          setValue('vehicleInterior.glass', data, { shouldValidate: true });
          setIsGlassModalVisible(false);
        }}
        initialData={glassData}
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
