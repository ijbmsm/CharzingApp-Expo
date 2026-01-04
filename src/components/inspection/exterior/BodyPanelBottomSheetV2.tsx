/**
 * BodyPanelBottomSheetV2 - 외판 검사 (v2)
 * 19개 항목의 상태(양호/문제) + 도막두께(μm) 선택
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
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import MultipleImagePicker from '../../MultipleImagePicker';
import StatusButtons from '../common/StatusButtons';
import {
  BodyPanelKey,
  BODY_PANEL_KEYS,
  BODY_PANEL_LABELS,
  PaintInspectionItem,
} from '../../../types/inspection';

// 기본 사진이 필수인 항목 (6개)
const REQUIRED_BASE_PHOTO_KEYS: BodyPanelKey[] = [
  'hood', 'doorFL', 'doorFR', 'doorRL', 'doorRR', 'trunkLid',
];

interface BodyPanelBottomSheetV2Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<BodyPanelKey, PaintInspectionItem>) => void;
  initialData?: Record<BodyPanelKey, PaintInspectionItem>;
}

const BodyPanelBottomSheetV2: React.FC<BodyPanelBottomSheetV2Props> = ({
  visible,
  onClose,
  onSave,
  initialData = {},
}) => {
  const insets = useSafeAreaInsets();
  const [bodyPanelData, setBodyPanelData] = useState<Record<string, PaintInspectionItem & { basePhotoArr?: string[] }>>({});
  const [thicknessStrings, setThicknessStrings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      const dataMap: Record<string, PaintInspectionItem & { basePhotoArr?: string[] }> = {};
      const thicknessMap: Record<string, string> = {};
      BODY_PANEL_KEYS.forEach((key) => {
        const item = initialData[key] || {};
        dataMap[key] = {
          ...item,
          basePhotoArr: item.basePhoto ? [item.basePhoto] : [],
        };
        thicknessMap[key] = item.thickness?.toString() || '';
      });
      setBodyPanelData(dataMap);
      setThicknessStrings(thicknessMap);
    }
  }, [visible, initialData]);

  const handleStatusChange = (key: BodyPanelKey, status: 'good' | 'problem' | undefined) => {
    setBodyPanelData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
      },
    }));
  };

  // 기본 사진 핸들러
  const handleBasePhotoAdded = (key: BodyPanelKey, uris: string[]) => {
    setBodyPanelData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: [...(prev[key]?.basePhotoArr || []), ...uris].slice(0, 10),
        basePhoto: uris[0] || prev[key]?.basePhoto,
      },
    }));
  };

  const handleBasePhotoRemoved = (key: BodyPanelKey, index: number) => {
    setBodyPanelData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: (prev[key]?.basePhotoArr || []).filter((_, i) => i !== index),
        basePhoto: undefined,
      },
    }));
  };

  const handleBasePhotoEdited = (key: BodyPanelKey, index: number, newUri: string) => {
    setBodyPanelData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        basePhotoArr: (prev[key]?.basePhotoArr || []).map((uri, i) => (i === index ? newUri : uri)),
        basePhoto: newUri,
      },
    }));
  };

  const handleThicknessChange = (key: BodyPanelKey, thickness: string) => {
    // 숫자와 소수점만 허용
    const sanitized = thickness.replace(/[^0-9.]/g, '');
    setThicknessStrings((prev) => ({
      ...prev,
      [key]: sanitized,
    }));
  };

  const handleDescriptionChange = (key: BodyPanelKey, description: string) => {
    setBodyPanelData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueDescription: description,
      },
    }));
  };

  const handleImagesAdded = (key: BodyPanelKey, newUris: string[]) => {
    setBodyPanelData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: [...(prev[key]?.issueImageUris || []), ...newUris],
      },
    }));
  };

  const handleImageRemoved = (key: BodyPanelKey, index: number) => {
    setBodyPanelData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: (prev[key]?.issueImageUris || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleImageEdited = (key: BodyPanelKey, index: number, newUri: string) => {
    setBodyPanelData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: (prev[key]?.issueImageUris || []).map((uri, i) =>
          i === index ? newUri : uri
        ),
      },
    }));
  };

  const handleSave = () => {
    const result: Record<BodyPanelKey, PaintInspectionItem> = {} as Record<BodyPanelKey, PaintInspectionItem>;
    BODY_PANEL_KEYS.forEach((key) => {
      const item = bodyPanelData[key];
      const thicknessStr = thicknessStrings[key];
      const thicknessNum = thicknessStr ? parseFloat(thicknessStr) : undefined;
      if (item?.status || item?.basePhoto || item?.basePhotoArr?.[0] || thicknessNum) {
        result[key] = {
          status: item?.status,
          basePhoto: item?.basePhotoArr?.[0] || item?.basePhoto,
          thickness: thicknessNum,
          issueDescription: item?.issueDescription,
          issueImageUris: item?.issueImageUris,
        };
      }
    });
    onSave(result);
    onClose();
  };

  const completedCount = Object.values(bodyPanelData).filter((item) => item?.status).length;
  const basePhotoCount = REQUIRED_BASE_PHOTO_KEYS.filter(
    (key) => bodyPanelData[key]?.basePhotoArr && bodyPanelData[key].basePhotoArr!.length > 0
  ).length;
  const isComplete = completedCount >= 10 && basePhotoCount >= 3; // 상태 10개 + 기본사진 3개 이상

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
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>외판 검사</Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
            <Text style={styles.saveButton}>저장</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressBar}>
          <Text style={styles.progressText}>
            상태 {completedCount} / {BODY_PANEL_KEYS.length} | 사진 {basePhotoCount} / {REQUIRED_BASE_PHOTO_KEYS.length}
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
          {BODY_PANEL_KEYS.map((key) => {
            const item = bodyPanelData[key] || {};
            const label = BODY_PANEL_LABELS[key];
            const requiresBasePhoto = REQUIRED_BASE_PHOTO_KEYS.includes(key);

            return (
              <View key={key} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{label}</Text>

                {/* 기본 사진 (6개 항목 필수) */}
                {requiresBasePhoto && (
                  <View style={styles.basePhotoSection}>
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
                <StatusButtons
                  status={item.status}
                  onStatusChange={(status) => handleStatusChange(key, status)}
                />

                {/* 문제일 때 추가 입력 */}
                {item.status === 'problem' && (
                  <>
                    {/* 도막 두께 */}
                    <View style={styles.thicknessSection}>
                      <Text style={styles.inputLabel}>도막 두께</Text>
                      <View style={styles.thicknessRow}>
                        <TextInput
                          style={[styles.textInput, styles.thicknessInput]}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          value={thicknessStrings[key] || ''}
                          onChangeText={(text) => handleThicknessChange(key, text)}
                          keyboardType="decimal-pad"
                        />
                        <Text style={styles.unit}>μm</Text>
                      </View>
                    </View>

                    {/* 문제 사진 - 기본 사진이 없는 항목만 표시 */}
                    {!requiresBasePhoto && (
                      <View style={styles.issueSection}>
                        <Text style={styles.inputLabel}>사진</Text>
                        <MultipleImagePicker
                          imageUris={item.issueImageUris || []}
                          onImagesAdded={(uris) => handleImagesAdded(key, uris)}
                          onImageRemoved={(index) => handleImageRemoved(key, index)}
                          onImageEdited={(index, uri) => handleImageEdited(key, index, uri)}
                          label="문제 부위 사진"
                        />
                      </View>
                    )}

                    {/* 문제 설명 */}
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
                  </>
                )}
              </View>
            );
          })}
        </KeyboardAwareScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(8),
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#06B6D4',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#374151',
  },
  content: {
    flex: 1,
    padding: scale(16),
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: scale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: verticalScale(12),
  },
  basePhotoSection: {
    marginBottom: verticalScale(16),
  },
  requiredMark: {
    color: '#EF4444',
    fontWeight: '700',
  },
  thicknessSection: {
    marginTop: verticalScale(12),
  },
  thicknessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  thicknessInput: {
    flex: 1,
  },
  unit: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#6B7280',
  },
  issueSection: {
    marginTop: verticalScale(12),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: verticalScale(8),
    marginTop: verticalScale(12),
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(15),
    color: '#1F2937',
  },
  notesInput: {
    minHeight: verticalScale(60),
  },
});

export default BodyPanelBottomSheetV2;
