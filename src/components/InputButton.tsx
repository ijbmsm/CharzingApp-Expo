import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputButtonProps {
  label: string;
  isCompleted: boolean;
  onPress: () => void;
  value?: string; // 입력된 값 표시용 (옵션)
  showError?: boolean; // 에러 표시 여부
}

const InputButton: React.FC<InputButtonProps> = ({
  label,
  isCompleted,
  onPress,
  value,
  showError = false,
}) => {
  // 미완성 + showError일 때만 에러 표시
  const hasError = showError && !isCompleted;

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.container,
          isCompleted && styles.containerCompleted,
          hasError && styles.containerError,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <Text style={[
            styles.label,
            isCompleted && styles.labelCompleted,
            hasError && styles.labelError,
          ]}>
            {label}
          </Text>
          {value && (
            <Text style={[styles.value, hasError && styles.valueError]} numberOfLines={1}>
              {value}
            </Text>
          )}
        </View>

        <View style={styles.iconContainer}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={24} color="#06B6D4" />
          ) : hasError ? (
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
          ) : (
            <Ionicons name="close-outline" size={24} color="#9CA3AF" />
          )}
        </View>
      </TouchableOpacity>

      {/* 미완성 에러 메시지 */}
      {hasError && (
        <Text style={styles.errorText}>입력이 필요합니다</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6', // 회색 배경
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 18,
    height: 80,
    marginBottom: 12,
  },
  containerCompleted: {
    backgroundColor: '#E0F2FE', // 연한 청록색 배경
  },
  containerError: {
    backgroundColor: '#FEF2F2', // 연한 빨간색 배경
    borderWidth: 1.5,
    borderColor: '#EF4444', // 빨간 border
  },
  content: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  label: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
  },
  labelCompleted: {
    color: '#06B6D4', // 앱 버튼 색상
  },
  labelError: {
    color: '#EF4444', // 빨간색
  },
  value: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  valueError: {
    color: '#EF4444',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
});

export default InputButton;
