import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import MultipleImagePicker from '../../MultipleImagePicker';
import { TireAndWheelItem as FirebaseTireAndWheelItem } from '../../../services/firebaseService';

interface TireAndWheelItem {
  treadDepth?: string; // 🔥 number → string (소수점 입력 문제 해결)
  wheelStatus?: 'good' | 'problem';
  wheelIssueDescription?: string;
  imageUris?: string[];
}

interface TiresAndWheelsData {
  driverFront?: TireAndWheelItem;
  driverRear?: TireAndWheelItem;
  passengerRear?: TireAndWheelItem;
  passengerFront?: TireAndWheelItem;
}

interface FirebaseTiresAndWheelsData {
  driverFront?: FirebaseTireAndWheelItem;
  driverRear?: FirebaseTireAndWheelItem;
  passengerRear?: FirebaseTireAndWheelItem;
  passengerFront?: FirebaseTireAndWheelItem;
}

interface TiresAndWheelsBottomSheetProps {
  visible: boolean;
  data: TiresAndWheelsData;
  onClose: () => void;
  onUpdate: (data: FirebaseTiresAndWheelsData) => void;
}

const TiresAndWheelsBottomSheet: React.FC<TiresAndWheelsBottomSheetProps> = ({
  visible,
  data,
  onClose,
  onUpdate,
}) => {
  const insets = useSafeAreaInsets();
  const [localData, setLocalData] = useState<TiresAndWheelsData>(data);

  React.useEffect(() => {
    if (visible) {
      setLocalData(data);
    }
  }, [visible, data]);

  const positions: Array<{ key: keyof TiresAndWheelsData; label: string }> = [
    { key: 'driverFront', label: '운전석 앞 타이어' },
    { key: 'driverRear', label: '운전석 뒤 타이어' },
    { key: 'passengerRear', label: '조수석 뒤 타이어' },
    { key: 'passengerFront', label: '조수석 앞 타이어' },
  ];

  const handleTreadDepthChange = (key: keyof TiresAndWheelsData, text: string) => {
    // 숫자와 소수점만 허용
    const filtered = text.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    const validText = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filtered;

    setLocalData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        treadDepth: validText === '' ? undefined : validText, // 🔥 string으로 유지 (소수점 입력 문제 해결)
      },
    }));
  };

  const handleWheelStatusChange = (key: keyof TiresAndWheelsData, status: 'good' | 'problem') => {
    setLocalData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        wheelStatus: status,
        // Clear issue description and images if status is 'good'
        wheelIssueDescription: status === 'good' ? undefined : prev[key]?.wheelIssueDescription,
        imageUris: status === 'good' ? undefined : prev[key]?.imageUris,
      },
    }));
  };

  const handleImagesAdded = (key: keyof TiresAndWheelsData, newUris: string[]) => {
    setLocalData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        wheelStatus: prev[key]?.wheelStatus || 'problem',
        imageUris: [...(prev[key]?.imageUris || []), ...newUris],
      },
    }));
  };

  const handleImageRemoved = (key: keyof TiresAndWheelsData, index: number) => {
    setLocalData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        imageUris: prev[key]?.imageUris?.filter((_, i) => i !== index),
      },
    }));
  };

  const handleImageEdited = (key: keyof TiresAndWheelsData, index: number, newUri: string) => {
    setLocalData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        imageUris: prev[key]?.imageUris?.map((uri, i) => (i === index ? newUri : uri)),
      },
    }));
  };

  const handleWheelIssueDescriptionChange = (key: keyof TiresAndWheelsData, text: string) => {
    setLocalData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        wheelStatus: prev[key]?.wheelStatus || 'problem',
        wheelIssueDescription: text,
      },
    }));
  };

  const handleSave = () => {
    // Convert string treadDepth to number for Firebase
    const convertedData: FirebaseTiresAndWheelsData = {};
    const keys: Array<keyof TiresAndWheelsData> = ['driverFront', 'driverRear', 'passengerRear', 'passengerFront'];

    keys.forEach(key => {
      const item = localData[key];
      if (item) {
        convertedData[key] = {
          ...item,
          treadDepth: item.treadDepth ? parseFloat(item.treadDepth) : undefined,
        };
      }
    });

    onUpdate(convertedData);
    onClose();
  };

  const handleCancel = () => {
    setLocalData(data);
    onClose();
  };

  const completedCount = positions.filter(p => {
    const item = localData[p.key];
    return item?.treadDepth !== undefined || item?.wheelStatus !== undefined;
  }).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: Platform.OS === 'ios' ? 0 : insets.top,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>타이어 및 휠 검사</Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
            <Text style={styles.saveButton}>저장</Text>
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>
            각 타이어의 마모도와 휠 상태를 검사하세요
          </Text>
          <Text style={styles.itemCount}>
            {completedCount}/{positions.length} 완료
          </Text>
        </View>

        {/* Tire/Wheel List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          contentInsetAdjustmentBehavior="automatic"
        >
          {positions.map(({ key, label }) => {
            const item = localData[key];

            return (
              <View key={key} style={styles.tireItem}>
                <Text style={styles.tireLabel}>{label}</Text>

                {/* Tread Depth Input */}
                <View style={styles.treadDepthContainer}>
                  <Text style={styles.treadDepthLabel}>트레드 깊이 (mm)</Text>
                  <TextInput
                    style={styles.treadDepthInput}
                    placeholder="예: 5.5"
                    placeholderTextColor="#9CA3AF"
                    value={item?.treadDepth !== undefined ? item.treadDepth.toString() : ''}
                    onChangeText={(text) => handleTreadDepthChange(key, text)}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Wheel Status Selection */}
                <View style={styles.wheelStatusSection}>
                  <Text style={styles.wheelStatusLabel}>휠 상태</Text>
                  <View style={styles.statusContainer}>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        item?.wheelStatus === 'good' && styles.statusButtonActive,
                      ]}
                      onPress={() => handleWheelStatusChange(key, 'good')}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item?.wheelStatus === 'good' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                        size={20}
                        color={item?.wheelStatus === 'good' ? '#10B981' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.statusButtonText,
                          item?.wheelStatus === 'good' && styles.statusButtonTextActive,
                        ]}
                      >
                        양호
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        item?.wheelStatus === 'problem' && styles.statusButtonActiveProblem,
                      ]}
                      onPress={() => handleWheelStatusChange(key, 'problem')}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item?.wheelStatus === 'problem' ? 'close-circle' : 'close-circle-outline'}
                        size={20}
                        color={item?.wheelStatus === 'problem' ? '#EF4444' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.statusButtonText,
                          item?.wheelStatus === 'problem' && styles.statusButtonTextActiveProblem,
                        ]}
                      >
                        문제 있음
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Image and Issue Description (shown when status is 'problem') */}
                {item?.wheelStatus === 'problem' && (
                  <>
                    <View style={styles.imageSection}>
                      <Text style={styles.imageSectionLabel}>사진</Text>
                      <MultipleImagePicker
                        imageUris={item?.imageUris || []}
                        onImagesAdded={(newUris) => handleImagesAdded(key, newUris)}
                        onImageRemoved={(index) => handleImageRemoved(key, index)}
                        onImageEdited={(index, newUri) => handleImageEdited(key, index, newUri)}
                        label={`${label} 사진`}
                      />
                    </View>

                    <Text style={styles.issueInputLabel}>특이사항</Text>
                    <TextInput
                      style={styles.issueInput}
                      placeholder="문제 내용 입력 (예: 휠 스크래치, 변형 등)"
                      placeholderTextColor="#9CA3AF"
                      value={item?.wheelIssueDescription || ''}
                      onChangeText={(text) => handleWheelIssueDescriptionChange(key, text)}
                      multiline
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(8),
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#06B6D4',
  },
  subtitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subtitle: {
    flex: 1,
    fontSize: moderateScale(13),
    color: '#6B7280',
  },
  itemCount: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#06B6D4',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(20),
    gap: verticalScale(20),
  },
  tireItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: scale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tireLabel: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#374151',
    marginBottom: verticalScale(12),
  },
  treadDepthContainer: {
    marginBottom: verticalScale(16),
  },
  treadDepthLabel: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: verticalScale(8),
  },
  treadDepthInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(14),
    color: '#1F2937',
  },
  wheelStatusSection: {
    marginBottom: verticalScale(12),
  },
  wheelStatusLabel: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: verticalScale(8),
  },
  statusContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: scale(6),
  },
  statusButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  statusButtonActiveProblem: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  statusButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  statusButtonTextActiveProblem: {
    color: '#EF4444',
    fontWeight: '600',
  },
  imageSection: {
    marginTop: verticalScale(12),
  },
  imageSectionLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#374151',
    marginBottom: verticalScale(8),
  },
  issueInputLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#374151',
    marginBottom: verticalScale(8),
    marginTop: verticalScale(12),
  },
  issueInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(14),
    color: '#1F2937',
    minHeight: verticalScale(70),
    textAlignVertical: 'top',
  },
});

export default TiresAndWheelsBottomSheet;
