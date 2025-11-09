import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { DiagnosisDetail } from '../../adminWeb/index';

interface DiagnosisDetailCardProps {
  detail: DiagnosisDetail;
  index: number;
  isRecentErrorCode: boolean; // 최근 오류 코드 여부 (측정값 입력 가능)
  onUpdateMeasuredValue?: (text: string) => void; // 최근 오류 코드만 사용
  onUpdateInterpretation: (index: number, text: string) => void;
}

const DiagnosisDetailCard: React.FC<DiagnosisDetailCardProps> = ({
  detail,
  index,
  isRecentErrorCode,
  onUpdateMeasuredValue,
  onUpdateInterpretation,
}) => {
  return (
    <View style={styles.itemContainer}>
      {/* 카테고리 & 측정값 한 줄로 */}
      <View style={styles.topRow}>
        <View style={styles.categoryBox}>
          <Text style={styles.categoryText}>{detail.category}</Text>
        </View>
        <View style={styles.measuredValueBox}>
          {isRecentErrorCode ? (
            <TextInput
              style={styles.textInput}
              placeholder="오류 코드 입력 (예: P0A0F)"
              placeholderTextColor="#9CA3AF"
              value={detail.measuredValue || ''}
              onChangeText={onUpdateMeasuredValue}
            />
          ) : (
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>
                {detail.measuredValue || '-'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 해석 입력 */}
      <TextInput
        style={[styles.textInput, styles.textInputMultiline]}
        placeholder="해석"
        placeholderTextColor="#9CA3AF"
        value={detail.interpretation || ''}
        onChangeText={(text) => onUpdateInterpretation(index, text)}
        multiline
      />
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    gap: scale(12),
  },
  categoryBox: {
    width: '35%',
  },
  categoryText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#1F2937',
  },
  measuredValueBox: {
    flex: 1,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    fontSize: moderateScale(14),
    color: '#1F2937',
  },
  textInputMultiline: {
    minHeight: verticalScale(38),
    textAlignVertical: 'top',
  },
  readOnlyBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    minHeight: verticalScale(38),
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: moderateScale(14),
    color: '#374151',
    fontWeight: '600',
  },
});

export default DiagnosisDetailCard;
