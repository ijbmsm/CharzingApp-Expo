import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale } from 'react-native-size-matters';
import { InspectionFormData } from '../types';

interface BatteryInfoSectionProps {
  showValidationErrors?: boolean;
}

export const BatteryInfoSection: React.FC<BatteryInfoSectionProps> = ({ showValidationErrors = false }) => {
  const { setValue, watch } = useFormContext<InspectionFormData>();

  const batteryInfoChecked = watch('batteryInfo.checked');
  const hasError = showValidationErrors && !batteryInfoChecked;

  const handleToggle = () => {
    setValue('batteryInfo.checked', !batteryInfoChecked, { shouldValidate: true });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.checkCard,
          batteryInfoChecked && styles.checkCardChecked,
          hasError && styles.checkCardError,
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.checkContent}>
          <View style={styles.textContainer}>
            <Text style={[
              styles.title,
              batteryInfoChecked && styles.titleChecked,
              hasError && styles.titleError,
            ]}>
              배터리 정보 확인
            </Text>
            <Text style={[styles.description, hasError && styles.descriptionError]}>
              배터리 정보를 확인했습니다
            </Text>
          </View>

          <View style={[
            styles.checkbox,
            batteryInfoChecked && styles.checkboxChecked,
            hasError && styles.checkboxError,
          ]}>
            {batteryInfoChecked ? (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            ) : hasError ? (
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {hasError && (
        <Text style={styles.errorText}>입력이 필요합니다</Text>
      )}

      {batteryInfoChecked && (
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={styles.infoText}>
            상세 배터리 데이터는 관리자 페이지에서 입력됩니다
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(16),
    gap: verticalScale(12),
  },
  checkCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  checkCardChecked: {
    backgroundColor: '#ECFEFF',
    borderColor: '#06B6D4',
  },
  checkCardError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  checkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  titleChecked: {
    color: '#0891B2',
  },
  titleError: {
    color: '#EF4444',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
  },
  descriptionError: {
    color: '#EF4444',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  checkboxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
});
