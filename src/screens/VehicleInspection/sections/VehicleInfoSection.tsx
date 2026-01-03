import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import { scale, verticalScale } from 'react-native-size-matters';
import { InspectionFormData } from '../types';
import DashboardInfoBottomSheet from '../../../components/DashboardInfoBottomSheet';
import VinCheckBottomSheet, { VinCheckData } from '../../../components/VinCheckBottomSheet';
import InputButton from '../../../components/InputButton';

interface VehicleInfoSectionProps {
  showValidationErrors?: boolean;
}

export const VehicleInfoSection: React.FC<VehicleInfoSectionProps> = ({ showValidationErrors = false }) => {
  const { control, setValue, watch } = useFormContext<InspectionFormData>();
  const [isDashboardInfoModalVisible, setIsDashboardInfoModalVisible] = useState(false);
  const [isVinCheckModalVisible, setIsVinCheckModalVisible] = useState(false);

  const mileage = watch('vehicleInfo.mileage');
  const dashboardImageUris = watch('vehicleInfo.dashboardImageUris');
  const dashboardStatus = watch('vehicleInfo.dashboardStatus');
  const carKeyCount = watch('vehicleInfo.carKeyCount');
  const vinCheck = watch('vinCheck');

  const handleDashboardSave = (data: {
    imageUris: string[];
    status: 'good' | 'problem' | '';
    issueDescription?: string;
  }) => {
    setValue('vehicleInfo.dashboardImageUris', data.imageUris, { shouldValidate: true });
    setValue('vehicleInfo.dashboardStatus', data.status, { shouldValidate: true });
    setValue('vehicleInfo.dashboardIssueDescription', data.issueDescription || '', { shouldValidate: true });
    setIsDashboardInfoModalVisible(false);
  };

  const isDashboardInfoCompleted = () => {
    return !!(dashboardImageUris && dashboardImageUris.length > 0 && dashboardStatus);
  };

  const handleVinCheckSave = (data: VinCheckData) => {
    setValue('vinCheck.registrationImageUris', data.registrationImageUris, { shouldValidate: true });
    setValue('vinCheck.vinImageUris', data.vinImageUris, { shouldValidate: true });
    setValue('vinCheck.isVinVerified', data.isVinVerified, { shouldValidate: true });
    setValue('vinCheck.hasNoIllegalModification', data.hasNoIllegalModification, { shouldValidate: true });
    setValue('vinCheck.hasNoFloodDamage', data.hasNoFloodDamage, { shouldValidate: true });
    setValue('vinCheck.vinIssue', data.vinIssue, { shouldValidate: true });
    setValue('vinCheck.modificationIssue', data.modificationIssue, { shouldValidate: true });
    setValue('vinCheck.floodIssue', data.floodIssue, { shouldValidate: true });
    setIsVinCheckModalVisible(false);
  };

  const isVinCheckCompleted = () => {
    // 등록증 사진 + 차대번호 사진 필수 + 3개 상태 모두 선택
    const hasRegistrationPhoto = vinCheck?.registrationImageUris && vinCheck.registrationImageUris.length > 0;
    const hasVinPhoto = vinCheck?.vinImageUris && vinCheck.vinImageUris.length > 0;
    const completedCount = [
      vinCheck?.isVinVerified !== undefined,
      vinCheck?.hasNoIllegalModification !== undefined,
      vinCheck?.hasNoFloodDamage !== undefined,
    ].filter(Boolean).length;
    return hasRegistrationPhoto && hasVinPhoto && completedCount === 3;
  };

  const getVinCheckDisplayText = () => {
    if (!vinCheck?.vinImageUris || vinCheck.vinImageUris.length === 0) return undefined;
    const parts: string[] = [];
    if (vinCheck.vinImageUris.length > 0) parts.push(`차대번호 ${vinCheck.vinImageUris.length}장`);
    if (vinCheck.registrationImageUris && vinCheck.registrationImageUris.length > 0) parts.push(`등록증 ${vinCheck.registrationImageUris.length}장`);
    const completedCount = [
      vinCheck?.isVinVerified !== undefined,
      vinCheck?.hasNoIllegalModification !== undefined,
      vinCheck?.hasNoFloodDamage !== undefined,
    ].filter(Boolean).length;
    if (completedCount > 0) parts.push(`${completedCount}/3 확인`);
    return parts.join(', ');
  };

  return (
    <View style={styles.container}>

      {/* 차량 키 개수 */}
      <Controller
        control={control}
        name="vehicleInfo.carKeyCount"
        rules={{ required: true }}
        render={({ field: { value, onChange } }) => {
          const isCompleted = value && parseInt(value) > 0;
          const hasError = showValidationErrors && !isCompleted;
          return (
            <View>
              <View style={[
                styles.carKeyCountContainer,
                isCompleted && styles.carKeyCountContainerCompleted,
                hasError && styles.carKeyCountContainerError,
              ]}>
                <Text style={[
                  styles.carKeyCountLabel,
                  isCompleted && styles.carKeyCountLabelCompleted,
                  hasError && styles.carKeyCountLabelError,
                ]}>
                  차키 수
                </Text>
                <View style={styles.carKeyCountInputRow}>
                  <Text style={styles.carKeyCountText}>총</Text>
                  <TouchableOpacity
                    style={styles.carKeyCountButton}
                    onPress={() => {
                      const currentValue = parseInt(value || '0');
                      if (currentValue > 0) {
                        onChange((currentValue - 1).toString());
                      }
                    }}
                  >
                    <Text style={styles.carKeyCountButtonText}>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.carKeyCountInput}
                    value={value}
                    onChangeText={(text) => {
                      const numericValue = text.replace(/[^0-9]/g, '');
                      onChange(numericValue);
                    }}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    style={styles.carKeyCountButton}
                    onPress={() => {
                      const currentValue = parseInt(value || '0');
                      onChange((currentValue + 1).toString());
                    }}
                  >
                    <Text style={styles.carKeyCountButtonText}>+</Text>
                  </TouchableOpacity>
                  <Text style={styles.carKeyCountText}>개</Text>
                </View>
              </View>
              {hasError && (
                <Text style={styles.errorText}>입력이 필요합니다</Text>
              )}
            </View>
          );
        }}
      />

      {/* 계기판 정보 */}
      <InputButton
        label="계기판 정보"
        isCompleted={isDashboardInfoCompleted()}
        value={dashboardImageUris && dashboardImageUris.length > 0 ? `${dashboardImageUris.length}장` : undefined}
        onPress={() => setIsDashboardInfoModalVisible(true)}
        showError={showValidationErrors}
      />

      {/* 차대번호 및 상태 확인 */}
      <InputButton
        label="차대번호 및 상태 확인"
        isCompleted={isVinCheckCompleted()}
        value={getVinCheckDisplayText()}
        onPress={() => setIsVinCheckModalVisible(true)}
        showError={showValidationErrors}
      />

      <DashboardInfoBottomSheet
        visible={isDashboardInfoModalVisible}
        onClose={() => setIsDashboardInfoModalVisible(false)}
        onConfirm={(mileage, imageUris, status, issueDescription) => {
          handleDashboardSave({ imageUris, status, issueDescription });
        }}
        initialMileage={mileage}
        initialImageUris={dashboardImageUris || []}
        initialStatus={dashboardStatus === '' ? undefined : dashboardStatus}
        initialIssueDescription={watch('vehicleInfo.dashboardIssueDescription')}
      />

      <VinCheckBottomSheet
        visible={isVinCheckModalVisible}
        onClose={() => setIsVinCheckModalVisible(false)}
        onSave={handleVinCheckSave}
        initialData={{
          registrationImageUris: vinCheck?.registrationImageUris || [],
          vinImageUris: vinCheck?.vinImageUris || [],
          isVinVerified: vinCheck?.isVinVerified,
          hasNoIllegalModification: vinCheck?.hasNoIllegalModification,
          hasNoFloodDamage: vinCheck?.hasNoFloodDamage,
          vinIssue: vinCheck?.vinIssue,
          modificationIssue: vinCheck?.modificationIssue,
          floodIssue: vinCheck?.floodIssue,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(16),
  },
  carKeyCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 18,
    height: 80,
    marginBottom: 12,
  },
  carKeyCountContainerCompleted: {
    backgroundColor: '#E0F2FE',
  },
  carKeyCountContainerError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  carKeyCountLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
  },
  carKeyCountLabelCompleted: {
    color: '#06B6D4',
  },
  carKeyCountLabelError: {
    color: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  carKeyCountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carKeyCountText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  carKeyCountButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carKeyCountButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  carKeyCountInput: {
    width: 50,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#1F2937',
    textAlign: 'center',
  },
});
