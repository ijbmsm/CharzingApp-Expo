import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale } from 'react-native-size-matters';
import MultipleImagePicker from '../MultipleImagePicker';

interface InspectionItemProps {
  label: string;
  status?: 'good' | 'problem';
  imageUris?: string[];
  issueDescription?: string;
  onStatusChange: (status: 'good' | 'problem') => void;
  onImagesAdded: (uris: string[]) => void;
  onImageRemoved: (index: number) => void;
  onImageEdited?: (index: number, newUri: string) => void;
  onIssueDescriptionChange: (text: string) => void;
}

/**
 * 공통 검사 항목 컴포넌트
 *
 * PaintThicknessBottomSheet 디자인 스타일 적용:
 * - 상태 버튼: 높이 60, borderWidth 2, borderRadius 8
 * - MultipleImagePicker 사용
 * - 카드 스타일 통일
 *
 * 패턴:
 * 1. 양호/문제있음 버튼
 * 2. 문제있음 선택 시:
 *    - 사진 업로드 (MultipleImagePicker)
 *    - 특이사항 입력
 */
export const InspectionItem: React.FC<InspectionItemProps> = ({
  label,
  status,
  imageUris = [],
  issueDescription,
  onStatusChange,
  onImagesAdded,
  onImageRemoved,
  onImageEdited,
  onIssueDescriptionChange,
}) => {
  return (
    <View style={styles.itemCard}>
      <Text style={styles.itemLabel}>{label}</Text>

      {/* 양호/문제있음 버튼 */}
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            status === 'good' && styles.statusButtonGoodSelected,
          ]}
          onPress={() => onStatusChange('good')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.statusButtonText,
              status === 'good' && styles.statusButtonTextSelected,
            ]}
          >
            양호
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusButton,
            status === 'problem' && styles.statusButtonProblemSelected,
          ]}
          onPress={() => onStatusChange('problem')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.statusButtonText,
              status === 'problem' && styles.statusButtonTextSelected,
            ]}
          >
            문제 있음
          </Text>
        </TouchableOpacity>
      </View>

      {/* 문제있음 선택 시에만 표시 */}
      {status === 'problem' && (
        <>
          {/* 이미지 업로드 */}
          <View style={styles.imageSection}>
            <Text style={styles.inputLabel}>사진</Text>
            <MultipleImagePicker
              imageUris={imageUris}
              onImagesAdded={onImagesAdded}
              onImageRemoved={onImageRemoved}
              onImageEdited={onImageEdited}
              label={`${label} 사진`}
            />
          </View>

          {/* 특이사항 입력 */}
          <Text style={styles.inputLabel}>특이사항</Text>
          <TextInput
            style={styles.textInput}
            placeholder="특이사항을 입력하세요"
            placeholderTextColor="#9CA3AF"
            value={issueDescription || ''}
            onChangeText={onIssueDescriptionChange}
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
};

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: scale(16),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: scale(12),
  },
  statusRow: {
    flexDirection: 'row',
    gap: scale(12),
  },
  statusButton: {
    flex: 1,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonGoodSelected: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  statusButtonProblemSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  imageSection: {
    marginTop: scale(12),
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: scale(8),
    marginTop: scale(12),
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: scale(12),
    paddingVertical: scale(12),
    fontSize: 15,
    color: '#1F2937',
    minHeight: 60,
  },
});
