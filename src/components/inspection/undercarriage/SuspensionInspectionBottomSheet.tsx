/**
 * SuspensionInspectionBottomSheet - 서스펜션 검사 (v2)
 * 4개 위치 (FL, FR, RL, RR) 각각 기본 사진 + 상태
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
  BaseInspectionItem,
} from '../../../types/inspection';

interface SuspensionPositionItem extends BaseInspectionItem {
  basePhotos?: string[];
}

interface SuspensionInspectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<PositionKey, SuspensionPositionItem>, basePhotos: Record<string, string[]>) => void;
  initialData?: Record<PositionKey, SuspensionPositionItem>;
  initialBasePhotos?: Record<string, string[]>;
}

const SuspensionInspectionBottomSheet: React.FC<SuspensionInspectionBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  initialData = {},
  initialBasePhotos = {},
}) => {
  const insets = useSafeAreaInsets();
  const [suspensionData, setSuspensionData] = useState<Record<string, SuspensionPositionItem>>({});

  useEffect(() => {
    if (visible) {
      const dataMap: Record<string, SuspensionPositionItem> = {};
      POSITION_KEYS.forEach((key) => {
        dataMap[key] = {
          ...initialData[key],
          basePhotos: initialBasePhotos[key] || initialData[key]?.basePhotos || [],
        };
      });
      setSuspensionData(dataMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // 기본 사진 핸들러
  const handleBasePhotoAdded = (key: PositionKey, uris: string[]) => {
    setSuspensionData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotos: [...(prev[key]?.basePhotos || []), ...uris].slice(0, 10),
      },
    }));
  };

  const handleBasePhotoRemoved = (key: PositionKey, index: number) => {
    setSuspensionData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotos: (prev[key]?.basePhotos || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleBasePhotoEdited = (key: PositionKey, index: number, newUri: string) => {
    setSuspensionData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotos: (prev[key]?.basePhotos || []).map((uri, i) => (i === index ? newUri : uri)),
      },
    }));
  };

  const handleStatusChange = (key: PositionKey, status: 'good' | 'problem' | undefined) => {
    setSuspensionData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
        // 양호로 변경 시 문제 관련 필드 초기화
        ...(status === 'good' ? { issueDescription: undefined, issueImageUris: undefined } : {}),
      },
    }));
  };

  const handleDescriptionChange = (key: PositionKey, description: string) => {
    setSuspensionData((prev) => ({
      ...prev,
      [key]: { ...prev[key], issueDescription: description },
    }));
  };

  const handleSave = () => {
    const result: Record<PositionKey, SuspensionPositionItem> = {} as Record<PositionKey, SuspensionPositionItem>;
    const basePhotosResult: Record<string, string[]> = {};

    POSITION_KEYS.forEach((key) => {
      const item = suspensionData[key];
      if (item?.status || (item?.basePhotos && item.basePhotos.length > 0)) {
        result[key] = {
          status: item.status,
          issueDescription: item.status === 'problem' ? item.issueDescription : undefined,
        };
        basePhotosResult[key] = item.basePhotos || [];
      }
    });

    onSave(result, basePhotosResult);
    onClose();
  };

  const completedCount = Object.values(suspensionData).filter((item) => item?.status).length;
  const basePhotoCount = POSITION_KEYS.filter((key) => (suspensionData[key]?.basePhotos?.length || 0) > 0).length;
  const isComplete = completedCount >= 4 && basePhotoCount >= 4; // 모든 위치 상태 + 사진 필수

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
          <Text style={styles.headerTitle}>서스펜션 검사</Text>
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
          {/* 안내 문구 */}
          <View style={styles.guideCard}>
            <Ionicons name="information-circle" size={20} color="#06B6D4" />
            <Text style={styles.guideText}>
              스프링, 스테빌라이저, 로어 암, 쇼크 업소버 등의 상태를 확인해주세요
            </Text>
          </View>

          {/* 각 위치별 검사 */}
          {POSITION_KEYS.map((key) => {
            const item = suspensionData[key] || {};
            const label = POSITION_LABELS[key];

            return (
              <View key={key} style={styles.itemCard}>
                <Text style={styles.itemTitle}>서스펜션 ({label})</Text>

                {/* 기본 사진 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>기본 사진 <Text style={styles.requiredMark}>*</Text></Text>
                  <MultipleImagePicker
                    imageUris={item.basePhotos || []}
                    onImagesAdded={(uris) => handleBasePhotoAdded(key, uris)}
                    onImageRemoved={(index) => handleBasePhotoRemoved(key, index)}
                    onImageEdited={(index, uri) => handleBasePhotoEdited(key, index, uri)}
                    label={`서스펜션 ${label}`}
                    maxImages={10}
                  />
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

                {/* 문제일 때 설명만 입력 (기본 사진이 있으므로 문제 사진 불필요) */}
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
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFEFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  guideText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0891B2',
    lineHeight: 20,
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

export default SuspensionInspectionBottomSheet;
