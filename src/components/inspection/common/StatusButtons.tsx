/**
 * StatusButtons - 검사 상태 선택 공통 컴포넌트
 * 양호/문제 버튼 UI 통일
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface StatusButtonsProps {
  status?: 'good' | 'problem';
  onStatusChange: (status: 'good' | 'problem' | undefined) => void;
  goodLabel?: string;
  problemLabel?: string;
}

const StatusButtons: React.FC<StatusButtonsProps> = ({
  status,
  onStatusChange,
  goodLabel = '양호',
  problemLabel = '문제',
}) => {
  const handlePress = (selectedStatus: 'good' | 'problem') => {
    // 같은 버튼을 다시 누르면 선택 해제 (토글)
    if (status === selectedStatus) {
      onStatusChange(undefined);
    } else {
      onStatusChange(selectedStatus);
    }
  };

  return (
    <View style={styles.statusRow}>
      <TouchableOpacity
        style={[
          styles.statusButton,
          status === 'good' && styles.statusButtonSelected,
        ]}
        onPress={() => handlePress('good')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={status === 'good' ? '#06B6D4' : '#9CA3AF'}
        />
        <Text
          style={[
            styles.statusButtonText,
            status === 'good' && styles.statusButtonTextSelected,
          ]}
        >
          {goodLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.statusButton,
          status === 'problem' && styles.statusButtonSelected,
        ]}
        onPress={() => handlePress('problem')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="alert-circle"
          size={20}
          color={status === 'problem' ? '#06B6D4' : '#9CA3AF'}
        />
        <Text
          style={[
            styles.statusButtonText,
            status === 'problem' && styles.statusButtonTextSelected,
          ]}
        >
          {problemLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  statusButton: {
    flex: 1,
    height: verticalScale(44),
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  statusButtonSelected: {
    borderColor: '#06B6D4',
    backgroundColor: '#F0FDFF',
  },
  statusButtonText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#6B7280',
  },
  statusButtonTextSelected: {
    color: '#06B6D4',
  },
});

export default StatusButtons;
