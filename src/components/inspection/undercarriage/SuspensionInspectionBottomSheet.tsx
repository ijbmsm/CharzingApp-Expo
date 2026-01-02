/**
 * SuspensionInspectionBottomSheet - 서스펜션 검사 (v2)
 * 4개 항목 (spring, stabilizer, lowerArm, shockAbsorber)
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
  SuspensionKey,
  SUSPENSION_KEYS,
  SUSPENSION_LABELS,
  BaseInspectionItem,
} from '../../../types/inspection';

interface SuspensionInspectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<SuspensionKey, BaseInspectionItem>) => void;
  initialData?: Record<SuspensionKey, BaseInspectionItem>;
}

const SuspensionInspectionBottomSheet: React.FC<SuspensionInspectionBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  initialData = {},
}) => {
  const insets = useSafeAreaInsets();
  const [suspensionData, setSuspensionData] = useState<Record<string, BaseInspectionItem>>({});

  useEffect(() => {
    if (visible) {
      const dataMap: Record<string, BaseInspectionItem> = {};
      SUSPENSION_KEYS.forEach((key) => {
        dataMap[key] = initialData[key] || {};
      });
      setSuspensionData(dataMap);
    }
  }, [visible, initialData]);

  const handleStatusChange = (key: SuspensionKey, status: 'good' | 'problem' | undefined) => {
    setSuspensionData((prev) => ({
      ...prev,
      [key]: { ...prev[key], status },
    }));
  };

  const handleDescriptionChange = (key: SuspensionKey, description: string) => {
    setSuspensionData((prev) => ({
      ...prev,
      [key]: { ...prev[key], issueDescription: description },
    }));
  };

  const handleImagesAdded = (key: SuspensionKey, newUris: string[]) => {
    setSuspensionData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: [...(prev[key]?.issueImageUris || []), ...newUris],
      },
    }));
  };

  const handleImageRemoved = (key: SuspensionKey, index: number) => {
    setSuspensionData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: (prev[key]?.issueImageUris || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = () => {
    const result: Record<SuspensionKey, BaseInspectionItem> = {} as Record<SuspensionKey, BaseInspectionItem>;
    SUSPENSION_KEYS.forEach((key) => {
      const item = suspensionData[key];
      if (item?.status) {
        result[key] = {
          status: item.status,
          issueDescription: item.issueDescription,
          issueImageUris: item.issueImageUris,
        };
      }
    });
    onSave(result);
    onClose();
  };

  const completedCount = Object.values(suspensionData).filter((item) => item?.status).length;
  const isComplete = completedCount >= 2;

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
            <Text style={styles.headerTitle}>서스펜션 검사</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <Text style={styles.progressText}>
              {completedCount} / {SUSPENSION_KEYS.length} 완료
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {SUSPENSION_KEYS.map((key) => {
              const item = suspensionData[key] || {};
              const label = SUSPENSION_LABELS[key];

              return (
                <View key={key} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>{label}</Text>

                  {/* 상태 선택 */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>상태 *</Text>
                    <StatusButtons
                      status={item.status}
                      onStatusChange={(status) => handleStatusChange(key, status)}
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

export default SuspensionInspectionBottomSheet;
