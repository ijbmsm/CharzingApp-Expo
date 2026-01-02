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

interface SteeringBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { [key: string]: MajorDeviceItem }) => void;
  initialData: { [key: string]: MajorDeviceItem | undefined };
}

const ITEMS = [
  { key: 'powerSteeringOilLeak', label: '동력조향 작동 오일 누유' },
  { key: 'steeringGear', label: '스티어링 기어' },
  { key: 'steeringPump', label: '스티어링 펌프' },
  { key: 'tierodEndBallJoint', label: '타이로드엔드 및 볼 조인트' },
];

export const SteeringBottomSheet: React.FC<SteeringBottomSheetProps> = ({
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

  const handleStatusChange = (key: string, status: 'good' | 'problem' | undefined) => {
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
          <Text style={commonStyles.headerTitle}>조향</Text>
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
