/**
 * TireInspectionBottomSheet - 타이어 검사 (v2)
 * 4개 위치 (FL, FR, RL, RR) 각각 트레드 깊이 + 상태
 * 문제 시에만 사진 + 설명 입력
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
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
  const [tireData, setTireData] = useState<Record<string, TireInspectionItem>>({});

  useEffect(() => {
    if (visible) {
      const dataMap: Record<string, TireInspectionItem> = {};
      POSITION_KEYS.forEach((key) => {
        dataMap[key] = initialData[key] || {};
      });
      setTireData(dataMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleStatusChange = (key: PositionKey, status: 'good' | 'problem' | undefined) => {
    setTireData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
        // 양호로 변경 시 문제 관련 필드 초기화
        ...(status === 'good' ? { issueDescription: undefined, issueImageUris: undefined } : {}),
      },
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

  const handleImageEdited = (key: PositionKey, index: number, newUri: string) => {
    setTireData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: (prev[key]?.issueImageUris || []).map((uri, i) => (i === index ? newUri : uri)),
      },
    }));
  };

  const handleSave = () => {
    const result: Record<PositionKey, TireInspectionItem> = {} as Record<PositionKey, TireInspectionItem>;
    POSITION_KEYS.forEach((key) => {
      const item = tireData[key];
      if (item?.status || item?.treadDepth) {
        result[key] = {
          status: item.status,
          treadDepth: item.treadDepth,
          issueDescription: item.status === 'problem' ? item.issueDescription : undefined,
          issueImageUris: item.status === 'problem' ? item.issueImageUris : undefined,
        };
      }
    });
    onSave(result);
    onClose();
  };

  const completedCount = Object.values(tireData).filter((item) => item?.status).length;
  const isComplete = completedCount >= 4; // 모든 위치 상태 선택 필수

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
          <Text style={styles.headerTitle}>타이어 검사</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <Text style={styles.progressText}>
            {completedCount} / {POSITION_KEYS.length} 완료
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
          {POSITION_KEYS.map((key) => {
            const item = tireData[key] || {};
            const label = POSITION_LABELS[key];

            return (
              <View key={key} style={styles.itemCard}>
                <Text style={styles.itemTitle}>타이어 {label}</Text>

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
                  <Text style={styles.inputLabel}>상태 <Text style={styles.requiredMark}>*</Text></Text>
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
                        onImageEdited={(index, uri) => handleImageEdited(key, index, uri)}
                        label={`타이어 ${label} 문제`}
                        maxImages={5}
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
                      />
                    </View>
                  </>
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
    justifyContent: 'center',
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
