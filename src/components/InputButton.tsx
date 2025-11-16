import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputButtonProps {
  label: string;
  isCompleted: boolean;
  onPress: () => void;
  value?: string; // 입력된 값 표시용 (옵션)
}

const InputButton: React.FC<InputButtonProps> = ({
  label,
  isCompleted,
  onPress,
  value,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCompleted && styles.containerCompleted,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.label, isCompleted && styles.labelCompleted]}>
          {label}
        </Text>
        {value && (
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>

      <View style={styles.iconContainer}>
        {isCompleted ? (
          <Ionicons name="checkmark" size={24} color="#06B6D4" />
        ) : (
          <Ionicons name="close-outline" size={24} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
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
  },
  containerCompleted: {
    backgroundColor: '#E0F2FE', // 연한 청록색 배경
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
  value: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InputButton;
