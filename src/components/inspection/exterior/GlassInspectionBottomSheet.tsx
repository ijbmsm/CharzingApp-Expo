/**
 * GlassInspectionBottomSheet - 유리 검사 (v2)
 * 7개 항목의 상태(양호/문제) 선택
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import MultipleImagePicker from '../../MultipleImagePicker';
import StatusButtons from '../common/StatusButtons';
import {
  GlassKey,
  GLASS_KEYS,
  GLASS_LABELS,
  BaseInspectionItem,
} from '../../../types/inspection';

interface GlassInspectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<GlassKey, BaseInspectionItem>) => void;
  initialData?: Record<GlassKey, BaseInspectionItem>;
}

const GlassInspectionBottomSheet: React.FC<GlassInspectionBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  initialData = {},
}) => {
  const insets = useSafeAreaInsets();
  const [glassData, setGlassData] = useState<Record<string, BaseInspectionItem>>({});

  useEffect(() => {
    if (visible) {
      const dataMap: Record<string, BaseInspectionItem> = {};
      GLASS_KEYS.forEach((key) => {
        dataMap[key] = initialData[key] || {};
      });
      setGlassData(dataMap);
    }
  }, [visible, initialData]);

  const handleStatusChange = (key: GlassKey, status: 'good' | 'problem' | undefined) => {
    setGlassData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
      },
    }));
  };

  const handleDescriptionChange = (key: GlassKey, description: string) => {
    setGlassData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueDescription: description,
      },
    }));
  };

  const handleImagesAdded = (key: GlassKey, newUris: string[]) => {
    setGlassData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: [...(prev[key]?.issueImageUris || []), ...newUris],
      },
    }));
  };

  const handleImageRemoved = (key: GlassKey, index: number) => {
    setGlassData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        issueImageUris: (prev[key]?.issueImageUris || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleImageEdited = (key: GlassKey, index: number, newUri: string) => {
    setGlassData((prev) => ({
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
    const result: Record<GlassKey, BaseInspectionItem> = {} as Record<GlassKey, BaseInspectionItem>;
    GLASS_KEYS.forEach((key) => {
      const item = glassData[key];
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

  const completedCount = Object.values(glassData).filter((item) => item?.status).length;

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
          <Text style={styles.headerTitle}>유리 검사</Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
            <Text style={styles.saveButton}>저장</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressBar}>
          <Text style={styles.progressText}>
            {completedCount} / {GLASS_KEYS.length} 완료
          </Text>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {GLASS_KEYS.map((key) => {
            const item = glassData[key] || {};
            const label = GLASS_LABELS[key];

            return (
              <View key={key} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{label}</Text>

                {/* 상태 선택 */}
                <StatusButtons
                  status={item.status}
                  onStatusChange={(status) => handleStatusChange(key, status)}
                />

                {/* 문제일 때 추가 입력 */}
                {item.status === 'problem' && (
                  <>
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

                    <Text style={styles.inputLabel}>문제 설명</Text>
                    <TextInput
                      style={styles.textInput}
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
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
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
    minHeight: verticalScale(60),
  },
});

export default GlassInspectionBottomSheet;
