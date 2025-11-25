import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MajorDeviceItem } from '../../../services/firebaseService';
import { colors, commonStyles } from '../../../screens/VehicleInspection/styles/commonStyles';
import { InspectionItem } from '../InspectionItem';

interface InteriorConditionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { [key: string]: MajorDeviceItem }) => void;
  initialData: { [key: string]: MajorDeviceItem | undefined };
}

const ITEMS = [
  { key: 'driverSeat', label: '운전석' },
  { key: 'passengerSeat', label: '동승석' },
  { key: 'driverRearSeat', label: '운전석 뒷자리' },
  { key: 'passengerRearSeat', label: '동승석 뒷자리' },
  { key: 'ceiling', label: '천장' },
  { key: 'interiorSmell', label: '실내 냄새' },
];

export const InteriorConditionBottomSheet: React.FC<InteriorConditionBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
}) => {
  const [data, setData] = useState<{ [key: string]: MajorDeviceItem }>(
    ITEMS.reduce((acc, item) => {
      acc[item.key] = initialData[item.key] || { name: item.label };
      return acc;
    }, {} as { [key: string]: MajorDeviceItem })
  );

  useEffect(() => {
    if (visible) {
      setData(
        ITEMS.reduce((acc, item) => {
          acc[item.key] = initialData[item.key] || { name: item.label };
          return acc;
        }, {} as { [key: string]: MajorDeviceItem })
      );
    }
  }, [visible, initialData]);

  const handleStatusChange = (key: string, status: 'good' | 'problem') => {
    setData((prev) => ({
      ...prev,
      [key]: {
        name: prev[key]?.name || ITEMS.find(i => i.key === key)?.label || '',
        ...prev[key],
        status,
        issueDescription: status === 'good' ? undefined : prev[key]?.issueDescription,
      },
    }));
  };

  const handleImagesAdded = (key: string, uris: string[]) => {
    setData((prev) => ({
      ...prev,
      [key]: {
        name: prev[key]?.name || ITEMS.find(i => i.key === key)?.label || '',
        ...prev[key],
        imageUris: [...(prev[key]?.imageUris || []), ...uris],
      },
    }));
  };

  const handleImageRemoved = (key: string, index: number) => {
    setData((prev) => ({
      ...prev,
      [key]: {
        name: prev[key]?.name || ITEMS.find(i => i.key === key)?.label || '',
        ...prev[key],
        imageUris: (prev[key]?.imageUris || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleIssueDescriptionChange = (key: string, description: string) => {
    setData((prev) => ({
      ...prev,
      [key]: {
        name: prev[key]?.name || ITEMS.find(i => i.key === key)?.label || '',
        ...prev[key],
        issueDescription: description,
      },
    }));
  };

  const handleSave = () => {
    onSave(data);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined} onRequestClose={onClose}>
      <SafeAreaView style={commonStyles.modalContainer} edges={['top', 'bottom']}>
        <View style={commonStyles.header}>
          <TouchableOpacity style={commonStyles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>내장재 상태</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>저장</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={commonStyles.content} contentContainerStyle={commonStyles.scrollContent}>
          {ITEMS.map((item) => {
            const itemData = data[item.key];
            return (
              <InspectionItem
                key={item.key}
                label={item.label}
                status={itemData?.status}
                imageUris={itemData?.imageUris || []}
                issueDescription={itemData?.issueDescription}
                onStatusChange={(status) => handleStatusChange(item.key, status)}
                onImagesAdded={(uris) => handleImagesAdded(item.key, uris)}
                onImageRemoved={(index) => handleImageRemoved(item.key, index)}
                onIssueDescriptionChange={(text) => handleIssueDescriptionChange(item.key, text)}
              />
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
});
