/**
 * BatteryPackInspectionBottomSheet - 배터리 팩 검사 (v2)
 * 4방향 (front, left, rear, right) 각각 사진 + 상태
 * TireInspectionBottomSheet 디자인 통일
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MultipleImagePicker from '../../MultipleImagePicker';
import StatusButtons from '../common/StatusButtons';
import {
  BatteryPackDirectionKey,
  BATTERY_PACK_KEYS,
  BATTERY_PACK_LABELS,
  BatteryPackInspectionItem,
} from '../../../types/inspection';

interface BatteryPackInspectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<BatteryPackDirectionKey, BatteryPackInspectionItem>) => void;
  initialData?: Record<BatteryPackDirectionKey, BatteryPackInspectionItem>;
}

const BatteryPackInspectionBottomSheet: React.FC<BatteryPackInspectionBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  initialData = {},
}) => {
  const insets = useSafeAreaInsets();
  const [batteryData, setBatteryData] = useState<Record<string, BatteryPackInspectionItem & { basePhotoArr?: string[] }>>({});

  useEffect(() => {
    if (visible) {
      const dataMap: Record<string, BatteryPackInspectionItem & { basePhotoArr?: string[] }> = {};
      BATTERY_PACK_KEYS.forEach((key) => {
        const item = initialData[key] || {};
        // basePhotos 배열 우선, 없으면 basePhoto 단일값 사용 (하위 호환성)
        const photos = item.basePhotos || (item.basePhoto ? [item.basePhoto] : []);
        dataMap[key] = {
          ...item,
          basePhotoArr: photos,
        };
      });
      setBatteryData(dataMap);
    }
  }, [visible, initialData]);

  const handleBasePhotoAdded = (key: BatteryPackDirectionKey, uris: string[]) => {
    setBatteryData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: [...(prev[key]?.basePhotoArr || []), ...uris].slice(0, 10),
      },
    }));
  };

  const handleBasePhotoRemoved = (key: BatteryPackDirectionKey, index: number) => {
    setBatteryData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: (prev[key]?.basePhotoArr || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleBasePhotoEdited = (key: BatteryPackDirectionKey, index: number, newUri: string) => {
    setBatteryData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: (prev[key]?.basePhotoArr || []).map((uri, i) => (i === index ? newUri : uri)),
      },
    }));
  };

  const handleStatusChange = (key: BatteryPackDirectionKey, status: 'good' | 'problem' | undefined) => {
    setBatteryData((prev) => ({
      ...prev,
      [key]: { ...prev[key], status },
    }));
  };

  const handleDescriptionChange = (key: BatteryPackDirectionKey, description: string) => {
    setBatteryData((prev) => ({
      ...prev,
      [key]: { ...prev[key], issueDescription: description },
    }));
  };

  const handleImagesAdded = (key: BatteryPackDirectionKey, newUris: string[]) => {
    setBatteryData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: [...(prev[key]?.issueImageUris || []), ...newUris],
      },
    }));
  };

  const handleImageRemoved = (key: BatteryPackDirectionKey, index: number) => {
    setBatteryData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: (prev[key]?.issueImageUris || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = () => {
    const result: Record<BatteryPackDirectionKey, BatteryPackInspectionItem> = {} as Record<BatteryPackDirectionKey, BatteryPackInspectionItem>;
    BATTERY_PACK_KEYS.forEach((key) => {
      const item = batteryData[key];
      const photos = item?.basePhotoArr || [];
      if (item?.status || photos.length > 0) {
        result[key] = {
          status: item?.status,
          basePhotos: photos,  // v2: 배열로 저장
          basePhoto: photos[0],  // 레거시 호환용
          issueDescription: item?.issueDescription,
          issueImageUris: item?.issueImageUris,
        };
      }
    });
    onSave(result);
    onClose();
  };

  const completedCount = Object.values(batteryData).filter((item) => item?.status).length;
  const basePhotoCount = BATTERY_PACK_KEYS.filter(
    (key) => batteryData[key]?.basePhotoArr && batteryData[key].basePhotoArr!.length > 0
  ).length;
  const isComplete = completedCount >= 4 && basePhotoCount >= 4; // 4개 모두 상태 + 사진 필수

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={onClose}
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>배터리 팩 검사</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <Text style={styles.progressText}>
            상태 {completedCount} / {BATTERY_PACK_KEYS.length} | 사진 {basePhotoCount} / {BATTERY_PACK_KEYS.length}
          </Text>
        </View>

        {/* Content */}
        <KeyboardAwareScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={120}
          enableOnAndroid={true}
        >
            {BATTERY_PACK_KEYS.map((key) => {
              const item = batteryData[key] || {};
              const label = BATTERY_PACK_LABELS[key];

              return (
                <View key={key} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>배터리 팩 ({label})</Text>

                  {/* 기본 사진 */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>기본 사진 <Text style={styles.requiredMark}>*</Text></Text>
                    <MultipleImagePicker
                      imageUris={item.basePhotoArr || []}
                      onImagesAdded={(uris) => handleBasePhotoAdded(key, uris)}
                      onImageRemoved={(index) => handleBasePhotoRemoved(key, index)}
                      onImageEdited={(index, uri) => handleBasePhotoEdited(key, index, uri)}
                      label={`배터리 팩 ${label}`}
                    />
                  </View>

                  {/* 상태 선택 */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>상태 *</Text>
                    <StatusButtons
                      status={item.status}
                      onStatusChange={(status) => handleStatusChange(key, status)}
                      problemLabel="문제 있음"
                    />
                  </View>

                  {/* 문제일 때 추가 입력 */}
                  {item.status === 'problem' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>문제 설명</Text>
                      <TextInput
                        style={[styles.textInput, styles.notesInput]}
                        placeholder="문제 내용을 입력하세요"
                        placeholderTextColor="#9CA3AF"
                        value={item.issueDescription || ''}
                        onChangeText={(text) => handleDescriptionChange(key, text)}
                        multiline
                        textAlignVertical="top"
                      />
                    </View>
                  )}
                </View>
              );
            })}
        </KeyboardAwareScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: 8 + insets.bottom }]}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !isComplete && styles.confirmButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!isComplete}
          >
            <Text style={styles.confirmButtonText}>저장</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  placeholder: {
    width: 40,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  requiredMark: {
    color: '#EF4444',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  notesInput: {
    minHeight: 80,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default BatteryPackInspectionBottomSheet;
