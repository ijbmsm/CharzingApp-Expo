/**
 * TireInspectionBottomSheet - 타이어 검사 (v2)
 * 4개 위치 (FL, FR, RL, RR) 각각 사진 + 트레드 깊이 + 상태
 * VinCheckBottomSheet 디자인 통일
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MultipleImagePicker from '../../MultipleImagePicker';
import StatusButtons from '../common/StatusButtons';
import {
  PositionKey,
  POSITION_KEYS,
  POSITION_LABELS,
  TireInspectionItem,
} from '../../../types/inspection';

interface TireInspectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<PositionKey, TireInspectionItem>) => void;
  initialData?: Record<PositionKey, TireInspectionItem>;
}

const TireInspectionBottomSheet: React.FC<TireInspectionBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  initialData = {},
}) => {
  const insets = useSafeAreaInsets();
  const [tireData, setTireData] = useState<Record<string, TireInspectionItem & { basePhotoArr?: string[] }>>({});

  useEffect(() => {
    if (visible) {
      const dataMap: Record<string, TireInspectionItem & { basePhotoArr?: string[] }> = {};
      POSITION_KEYS.forEach((key) => {
        const item = initialData[key] || {};
        dataMap[key] = {
          ...item,
          basePhotoArr: item.basePhoto ? [item.basePhoto] : [],
        };
      });
      setTireData(dataMap);
    }
  }, [visible, initialData]);

  const handleBasePhotoAdded = (key: PositionKey, uris: string[]) => {
    setTireData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: [...(prev[key]?.basePhotoArr || []), ...uris].slice(0, 1),
        basePhoto: uris[0] || prev[key]?.basePhoto,
      },
    }));
  };

  const handleBasePhotoRemoved = (key: PositionKey, index: number) => {
    setTireData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: (prev[key]?.basePhotoArr || []).filter((_, i) => i !== index),
        basePhoto: undefined,
      },
    }));
  };

  const handleBasePhotoEdited = (key: PositionKey, index: number, newUri: string) => {
    setTireData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: (prev[key]?.basePhotoArr || []).map((uri, i) => (i === index ? newUri : uri)),
        basePhoto: newUri,
      },
    }));
  };

  const handleStatusChange = (key: PositionKey, status: 'good' | 'problem' | undefined) => {
    setTireData((prev) => ({
      ...prev,
      [key]: { ...prev[key], status },
    }));
  };

  const handleTreadDepthChange = (key: PositionKey, depth: string) => {
    const numValue = depth ? parseFloat(depth) : undefined;
    setTireData((prev) => ({
      ...prev,
      [key]: { ...prev[key], treadDepth: numValue },
    }));
  };

  const handleDescriptionChange = (key: PositionKey, description: string) => {
    setTireData((prev) => ({
      ...prev,
      [key]: { ...prev[key], issueDescription: description },
    }));
  };

  const handleImagesAdded = (key: PositionKey, newUris: string[]) => {
    setTireData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: [...(prev[key]?.issueImageUris || []), ...newUris],
      },
    }));
  };

  const handleImageRemoved = (key: PositionKey, index: number) => {
    setTireData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: (prev[key]?.issueImageUris || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = () => {
    const result: Record<PositionKey, TireInspectionItem> = {} as Record<PositionKey, TireInspectionItem>;
    POSITION_KEYS.forEach((key) => {
      const item = tireData[key];
      if (item?.status || item?.basePhoto || item?.basePhotoArr?.[0]) {
        result[key] = {
          status: item.status,
          basePhoto: item.basePhotoArr?.[0] || item.basePhoto,
          treadDepth: item.treadDepth,
          issueDescription: item.issueDescription,
          issueImageUris: item.issueImageUris,
        };
      }
    });
    onSave(result);
    onClose();
  };

  const completedCount = Object.values(tireData).filter((item) => item?.status).length;
  const basePhotoCount = POSITION_KEYS.filter(
    (key) => tireData[key]?.basePhotoArr && tireData[key].basePhotoArr!.length > 0
  ).length;
  const isComplete = completedCount >= 2 && basePhotoCount >= 2; // 상태 2개 + 사진 2개 이상

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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>타이어 검사</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <Text style={styles.progressText}>
              상태 {completedCount} / {POSITION_KEYS.length} | 사진 {basePhotoCount} / {POSITION_KEYS.length}
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {POSITION_KEYS.map((key) => {
              const item = tireData[key] || {};
              const label = POSITION_LABELS[key];

              return (
                <View key={key} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>타이어 {label}</Text>

                  {/* 기본 사진 */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>기본 사진 <Text style={styles.requiredMark}>*</Text></Text>
                    <MultipleImagePicker
                      imageUris={item.basePhotoArr || []}
                      onImagesAdded={(uris) => handleBasePhotoAdded(key, uris)}
                      onImageRemoved={(index) => handleBasePhotoRemoved(key, index)}
                      onImageEdited={(index, uri) => handleBasePhotoEdited(key, index, uri)}
                      label={`타이어 ${label}`}
                      maxImages={1}
                    />
                  </View>

                  {/* 트레드 깊이 */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>트레드 깊이</Text>
                    <View style={styles.treadRow}>
                      <TextInput
                        style={[styles.textInput, styles.treadInput]}
                        placeholder="0.0"
                        placeholderTextColor="#9CA3AF"
                        value={item.treadDepth?.toString() || ''}
                        onChangeText={(text) => handleTreadDepthChange(key, text)}
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.unit}>mm</Text>
                    </View>
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
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>문제 사진</Text>
                        <MultipleImagePicker
                          imageUris={item.issueImageUris || []}
                          onImagesAdded={(uris) => handleImagesAdded(key, uris)}
                          onImageRemoved={(index) => handleImageRemoved(key, index)}
                          onImageEdited={() => {}}
                          label="문제 부위 사진"
                        />
                      </View>

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
                          returnKeyType="done"
                          blurOnSubmit={true}
                          onSubmitEditing={Keyboard.dismiss}
                        />
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </ScrollView>

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
        </KeyboardAvoidingView>
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
  treadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  treadInput: {
    flex: 1,
  },
  unit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
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

export default TireInspectionBottomSheet;
