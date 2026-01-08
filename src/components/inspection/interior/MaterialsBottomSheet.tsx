/**
 * MaterialsBottomSheet - 내장재 검사 (v2)
 * 8개 항목: 사진 필요 6개(driverSeat, rearSeat, doorFL-RR) + 상태만 2개(ceiling, smell)
 * BodyPanelBottomSheetV2 디자인 통일
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
  InteriorMaterialsKey,
  INTERIOR_MATERIALS_KEYS,
  INTERIOR_MATERIALS_LABELS,
  INTERIOR_MATERIALS_PHOTO_KEYS,
  InteriorMaterialsItem,
} from '../../../types/inspection';

interface MaterialsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<InteriorMaterialsKey, InteriorMaterialsItem>) => void;
  initialData?: Record<InteriorMaterialsKey, InteriorMaterialsItem>;
}

const MaterialsBottomSheet: React.FC<MaterialsBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  initialData = {},
}) => {
  const insets = useSafeAreaInsets();
  const [materialsData, setMaterialsData] = useState<Record<string, InteriorMaterialsItem & { basePhotoArr?: string[] }>>({});

  useEffect(() => {
    if (visible) {
      const dataMap: Record<string, InteriorMaterialsItem & { basePhotoArr?: string[] }> = {};
      INTERIOR_MATERIALS_KEYS.forEach((key) => {
        const item = initialData[key] || {};
        dataMap[key] = {
          ...item,
          basePhotoArr: item.basePhoto ? [item.basePhoto] : [],
        };
      });
      setMaterialsData(dataMap);
    }
  }, [visible, initialData]);

  // 기본 사진 핸들러
  const handleBasePhotoAdded = (key: InteriorMaterialsKey, uris: string[]) => {
    setMaterialsData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: [...(prev[key]?.basePhotoArr || []), ...uris].slice(0, 10),
        basePhoto: uris[0] || prev[key]?.basePhoto,
      },
    }));
  };

  const handleBasePhotoRemoved = (key: InteriorMaterialsKey, index: number) => {
    setMaterialsData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: (prev[key]?.basePhotoArr || []).filter((_, i) => i !== index),
        basePhoto: undefined,
      },
    }));
  };

  const handleBasePhotoEdited = (key: InteriorMaterialsKey, index: number, newUri: string) => {
    setMaterialsData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: (prev[key]?.basePhotoArr || []).map((uri, i) => (i === index ? newUri : uri)),
        basePhoto: newUri,
      },
    }));
  };

  const handleStatusChange = (key: InteriorMaterialsKey, status: 'good' | 'problem' | undefined) => {
    setMaterialsData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
      },
    }));
  };

  const handleDescriptionChange = (key: InteriorMaterialsKey, description: string) => {
    setMaterialsData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueDescription: description,
      },
    }));
  };

  const handleImagesAdded = (key: InteriorMaterialsKey, newUris: string[]) => {
    setMaterialsData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: [...(prev[key]?.issueImageUris || []), ...newUris],
      },
    }));
  };

  const handleImageRemoved = (key: InteriorMaterialsKey, index: number) => {
    setMaterialsData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: (prev[key]?.issueImageUris || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = () => {
    const result: Record<InteriorMaterialsKey, InteriorMaterialsItem> = {} as Record<InteriorMaterialsKey, InteriorMaterialsItem>;
    INTERIOR_MATERIALS_KEYS.forEach((key) => {
      const item = materialsData[key];
      const photos = item?.basePhotoArr?.length ? item.basePhotoArr : (item?.basePhoto ? [item.basePhoto] : []);
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

  const completedCount = Object.values(materialsData).filter((item) => item?.status).length;
  const basePhotoCount = INTERIOR_MATERIALS_PHOTO_KEYS.filter(
    (key) => materialsData[key]?.basePhotoArr && materialsData[key].basePhotoArr!.length > 0
  ).length;
  const isComplete = basePhotoCount >= 6; // 기본사진 6개 필수 (운전석, 뒷좌석, 문 4개)

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
            <Text style={styles.headerTitle}>내장재 검사</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <Text style={styles.progressText}>
              상태 {completedCount} / {INTERIOR_MATERIALS_KEYS.length} | 사진 {basePhotoCount} / {INTERIOR_MATERIALS_PHOTO_KEYS.length}
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
            {INTERIOR_MATERIALS_KEYS.map((key) => {
              const item = materialsData[key] || {};
              const label = INTERIOR_MATERIALS_LABELS[key];
              const requiresBasePhoto = INTERIOR_MATERIALS_PHOTO_KEYS.includes(key);

              return (
                <View key={key} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>{label}</Text>

                  {/* 기본 사진 (6개 항목만 필수) */}
                  {requiresBasePhoto && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        기본 사진 <Text style={styles.requiredMark}>*</Text>
                      </Text>
                      <MultipleImagePicker
                        imageUris={item.basePhotoArr || []}
                        onImagesAdded={(uris) => handleBasePhotoAdded(key, uris)}
                        onImageRemoved={(index) => handleBasePhotoRemoved(key, index)}
                        onImageEdited={(index, uri) => handleBasePhotoEdited(key, index, uri)}
                        label={label}
                        maxImages={10}
                      />
                    </View>
                  )}

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
                      {/* 문제 사진 - 기본 사진이 없는 항목만 표시 */}
                      {!requiresBasePhoto && (
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
                      )}

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

export default MaterialsBottomSheet;
