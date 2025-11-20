import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { InspectionFormData, MajorDeviceItem } from '../types';
import VehicleExteriorPhotoBottomSheet from '../../../components/inspection/exterior/VehicleExteriorPhotoBottomSheet';
import { BodyPanelBottomSheet } from '../../../components/inspection/exterior/BodyPanelBottomSheet';
import TiresAndWheelsBottomSheet from '../../../components/inspection/exterior/TiresAndWheelsBottomSheet';
import { PaintThicknessInspection, TireAndWheelItem } from '../../../services/firebaseService';
import InputButton from '../../../components/InputButton';

export const VehicleExteriorSection: React.FC = () => {
  const { setValue, watch } = useFormContext<InspectionFormData>();
  const [isExteriorPhotoModalVisible, setIsExteriorPhotoModalVisible] = useState(false);
  const [isBodyPanelModalVisible, setIsBodyPanelModalVisible] = useState(false);
  const [isTiresWheelsModalVisible, setIsTiresWheelsModalVisible] = useState(false);

  const vehicleExteriorData = watch('vehicleExterior.vehicleExterior');
  const bodyPanelData = watch('vehicleExterior.bodyPanel');
  const tiresWheelsData = watch('vehicleExterior.tiresAndWheels');

  const getCompletionStatus = (data: unknown): boolean => {
    if (!data) return false;

    if (Array.isArray(data)) {
      return data.length > 0;
    }

    if (typeof data === 'object') {
      const values = Object.values(data);

      // Check if it's a photo object (string values like front, leftSide, rear, rightSide)
      const hasPhotos = values.some(item => typeof item === 'string' && item.length > 0);
      if (hasPhotos) return true;

      // Check if it's a MajorDeviceItem object (with status field) or TireAndWheelItem (with wheelStatus)
      const hasStatusItems = values.some(item => {
        if (!item || typeof item !== 'object') return false;
        return 'status' in item || 'wheelStatus' in item;
      });
      if (hasStatusItems) return true;
    }

    return false;
  };

  return (
    <View style={styles.container}>
      <InputButton
        label="외관 사진"
        isCompleted={getCompletionStatus(vehicleExteriorData)}
        onPress={() => setIsExteriorPhotoModalVisible(true)}
      />

      <InputButton
        label="외판 수리/교체 확인 및 도막 측정"
        isCompleted={getCompletionStatus(bodyPanelData)}
        onPress={() => setIsBodyPanelModalVisible(true)}
      />

      <InputButton
        label="타이어 및 휠"
        isCompleted={getCompletionStatus(tiresWheelsData)}
        onPress={() => setIsTiresWheelsModalVisible(true)}
      />

      <VehicleExteriorPhotoBottomSheet
        visible={isExteriorPhotoModalVisible}
        photos={vehicleExteriorData || { front: '', leftSide: '', rear: '', rightSide: '' }}
        onClose={() => setIsExteriorPhotoModalVisible(false)}
        onUpdate={(photos: { front?: string; leftSide?: string; rear?: string; rightSide?: string }) => {
          setValue('vehicleExterior.vehicleExterior', photos, { shouldValidate: true });
          setIsExteriorPhotoModalVisible(false);
        }}
      />

      <BodyPanelBottomSheet
        visible={isBodyPanelModalVisible}
        onClose={() => setIsBodyPanelModalVisible(false)}
        onSave={(data) => {
          setValue('vehicleExterior.bodyPanel', data, { shouldValidate: true });
          setIsBodyPanelModalVisible(false);
        }}
        initialData={bodyPanelData}
      />

      <TiresAndWheelsBottomSheet
        visible={isTiresWheelsModalVisible}
        data={tiresWheelsData || { driverFront: undefined, driverRear: undefined, passengerRear: undefined, passengerFront: undefined }}
        onClose={() => setIsTiresWheelsModalVisible(false)}
        onUpdate={(data: { driverFront?: TireAndWheelItem; driverRear?: TireAndWheelItem; passengerRear?: TireAndWheelItem; passengerFront?: TireAndWheelItem }) => {
          setValue('vehicleExterior.tiresAndWheels', data, { shouldValidate: true });
          setIsTiresWheelsModalVisible(false);
        }}
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
