import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale } from 'react-native-size-matters';
import { InspectionFormData } from '../types';
import VehicleModelBottomSheet from '../../../components/VehicleModelBottomSheet';
import DashboardInfoBottomSheet from '../../../components/DashboardInfoBottomSheet';
import VinCheckBottomSheet from '../../../components/VinCheckBottomSheet';
import InputButton from '../../../components/InputButton';

export const VehicleInfoSection: React.FC = () => {
  const { control, setValue, watch } = useFormContext<InspectionFormData>();
  const [isVehicleModelModalVisible, setIsVehicleModelModalVisible] = useState(false);
  const [isDashboardInfoModalVisible, setIsDashboardInfoModalVisible] = useState(false);
  const [isVinCheckModalVisible, setIsVinCheckModalVisible] = useState(false);

  const vehicleBrand = watch('vehicleInfo.vehicleBrand');
  const vehicleName = watch('vehicleInfo.vehicleName');
  const vehicleGrade = watch('vehicleInfo.vehicleGrade');
  const vehicleYear = watch('vehicleInfo.vehicleYear');
  const mileage = watch('vehicleInfo.mileage');
  const dashboardImageUris = watch('vehicleInfo.dashboardImageUris');
  const dashboardStatus = watch('vehicleInfo.dashboardStatus');
  const vehicleVinImageUris = watch('vehicleInfo.vehicleVinImageUris');
  const carKeyCount = watch('vehicleInfo.carKeyCount');

  const handleVehicleSelect = (data: {
    brand: string;
    name: string;
    grade?: string;
    year: string;
    mileage: string;
  }) => {
    setValue('vehicleInfo.vehicleBrand', data.brand, { shouldValidate: true });
    setValue('vehicleInfo.vehicleName', data.name, { shouldValidate: true });
    setValue('vehicleInfo.vehicleGrade', data.grade || '', { shouldValidate: true });
    setValue('vehicleInfo.vehicleYear', data.year, { shouldValidate: true });
    setValue('vehicleInfo.mileage', data.mileage, { shouldValidate: true });
    setIsVehicleModelModalVisible(false);
  };

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

  const handleVinCheckSave = (data: {
    vehicleVinImageUris: string[];
    isVinVerified: boolean;
    hasNoIllegalModification: boolean;
    hasNoFloodDamage: boolean;
    vinIssue?: string;
    modificationIssue?: string;
    floodIssue?: string;
  }) => {
    setValue('vehicleInfo.vehicleVinImageUris', data.vehicleVinImageUris, { shouldValidate: true });
    setValue('vinCheck.isVinVerified', data.isVinVerified, { shouldValidate: true });
    setValue('vinCheck.hasNoIllegalModification', data.hasNoIllegalModification, { shouldValidate: true });
    setValue('vinCheck.hasNoFloodDamage', data.hasNoFloodDamage, { shouldValidate: true });
    setValue('vinCheck.vinIssue', data.vinIssue || '', { shouldValidate: true });
    setValue('vinCheck.modificationIssue', data.modificationIssue || '', { shouldValidate: true });
    setValue('vinCheck.floodIssue', data.floodIssue || '', { shouldValidate: true });
    setIsVinCheckModalVisible(false);
  };

  const getVehicleDisplayText = () => {
    if (!vehicleBrand || !vehicleName) return '';
    let text = `${vehicleBrand} ${vehicleName}`;
    if (vehicleGrade) text += ` ${vehicleGrade}`;
    if (vehicleYear) text += ` (${vehicleYear})`;
    return text;
  };

  const isVehicleInfoCompleted = () => {
    return !!(vehicleBrand && vehicleName && vehicleYear && mileage);
  };

  const isDashboardInfoCompleted = () => {
    return !!(dashboardImageUris && dashboardImageUris.length > 0 && dashboardStatus);
  };

  const isVinCheckCompleted = () => {
    return !!(vehicleVinImageUris && vehicleVinImageUris.length > 0);
  };

  return (
    <View style={styles.container}>

      {/* 차량 모델 선택 */}
      <InputButton
        label="차량 모델"
        isCompleted={isVehicleInfoCompleted()}
        value={getVehicleDisplayText()}
        onPress={() => setIsVehicleModelModalVisible(true)}
      />

      {/* 차량 키 개수 */}
      <Controller
        control={control}
        name="vehicleInfo.carKeyCount"
        rules={{ required: true }}
        render={({ field: { value, onChange } }) => (
          <View style={[
            styles.carKeyCountContainer,
            value && parseInt(value) > 0 && styles.carKeyCountContainerCompleted
          ]}>
            <Text style={[
              styles.carKeyCountLabel,
              value && parseInt(value) > 0 && styles.carKeyCountLabelCompleted
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
        )}
      />

      {/* 계기판 정보 */}
      <InputButton
        label="계기판 정보"
        isCompleted={isDashboardInfoCompleted()}
        value={dashboardImageUris && dashboardImageUris.length > 0 ? `${dashboardImageUris.length}장` : undefined}
        onPress={() => setIsDashboardInfoModalVisible(true)}
      />

      {/* 차대번호 및 상태 확인 */}
      <InputButton
        label="차대번호 및 상태 확인"
        isCompleted={isVinCheckCompleted()}
        value={vehicleVinImageUris && vehicleVinImageUris.length > 0 ? `${vehicleVinImageUris.length}장` : undefined}
        onPress={() => setIsVinCheckModalVisible(true)}
      />

      <VehicleModelBottomSheet
        visible={isVehicleModelModalVisible}
        onClose={() => setIsVehicleModelModalVisible(false)}
        onConfirm={(brand, model, grade, year, mileage) => {
          handleVehicleSelect({ brand, name: model, grade, year, mileage });
        }}
        initialBrand={vehicleBrand}
        initialModel={vehicleName}
        initialGrade={vehicleGrade}
        initialYear={vehicleYear}
        initialMileage={mileage}
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
        onConfirm={(imageUris, isVinVerified, hasNoIllegalModification, hasNoFloodDamage, issues) => {
          handleVinCheckSave({
            vehicleVinImageUris: imageUris,
            isVinVerified,
            hasNoIllegalModification,
            hasNoFloodDamage,
            vinIssue: issues.vinIssue,
            modificationIssue: issues.modificationIssue,
            floodIssue: issues.floodIssue,
          });
        }}
        initialImageUris={vehicleVinImageUris || []}
        initialIsVinVerified={watch('vinCheck.isVinVerified')}
        initialHasNoIllegalModification={watch('vinCheck.hasNoIllegalModification')}
        initialHasNoFloodDamage={watch('vinCheck.hasNoFloodDamage')}
        initialVinIssue={watch('vinCheck.vinIssue')}
        initialModificationIssue={watch('vinCheck.modificationIssue')}
        initialFloodIssue={watch('vinCheck.floodIssue')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: scale(16),
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
  },
  carKeyCountContainerCompleted: {
    backgroundColor: '#E0F2FE',
  },
  carKeyCountLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
  },
  carKeyCountLabelCompleted: {
    color: '#06B6D4',
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
