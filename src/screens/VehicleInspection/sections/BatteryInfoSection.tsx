import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { InspectionFormData } from '../types';
import BatteryCellGridModal from '../../../components/BatteryCellGridModal';
import { BatteryCell } from '../../../services/firebaseService';

export const BatteryInfoSection: React.FC = () => {
  const { control, setValue, watch } = useFormContext<InspectionFormData>();
  const [isCellModalVisible, setIsCellModalVisible] = useState(false);

  // Input refs for focus management
  const cellCountRef = useRef<TextInput>(null);
  const normalChargeRef = useRef<TextInput>(null);
  const fastChargeRef = useRef<TextInput>(null);

  const batterySOH = watch('batteryInfo.batterySOH');
  const batteryCellCount = watch('batteryInfo.batteryCellCount');
  const batteryCells = watch('batteryInfo.batteryCells');
  const normalChargeCount = watch('batteryInfo.normalChargeCount');
  const fastChargeCount = watch('batteryInfo.fastChargeCount');
  const defaultCellVoltage = watch('batteryInfo.defaultCellVoltage');

  // 배터리 셀 개수가 변경되면 배터리 셀 배열 자동 생성
  useEffect(() => {
    if (batteryCellCount > 0 && batteryCells.length !== batteryCellCount) {
      const newCells: BatteryCell[] = Array.from({ length: batteryCellCount }, (_, index) => ({
        id: index + 1,
        voltage: defaultCellVoltage || 3.7,
        isDefective: false,
      }));
      setValue('batteryInfo.batteryCells', newCells, { shouldValidate: true });
    }
  }, [batteryCellCount]);

  // 자동 계산 값들 (useMemo 사용)
  const maxCellVoltage = useMemo(() => {
    if (!batteryCells || batteryCells.length === 0) return 0;
    const voltages = batteryCells.map((c) => Number(c.voltage)).filter(v => !isNaN(v));
    return voltages.length > 0 ? Math.max(...voltages) : 0;
  }, [batteryCells]);

  const minCellVoltage = useMemo(() => {
    if (!batteryCells || batteryCells.length === 0) return 0;
    const voltages = batteryCells.map((c) => Number(c.voltage)).filter(v => !isNaN(v));
    return voltages.length > 0 ? Math.min(...voltages) : 0;
  }, [batteryCells]);

  const defectiveCellCount = useMemo(() => {
    if (!batteryCells) return 0;
    return batteryCells.filter((c) => c.isDefective).length;
  }, [batteryCells]);

  // 셀 데이터만 업데이트 (모달은 닫지 않음)
  const handleCellsUpdate = (cells: BatteryCell[]) => {
    setValue('batteryInfo.batteryCells', cells, { shouldValidate: true });
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsCellModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>배터리 정보</Text>

      {/* SOH (%) */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>SOH (%)</Text>
        <Controller
          control={control}
          name="batteryInfo.batterySOH"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <TextInput
              style={styles.textInput}
              placeholder="배터리 SOH를 입력하세요"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => cellCountRef.current?.focus()}
            />
          )}
        />
      </View>

      {/* 셀 개수 */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>셀 개수</Text>
        <Controller
          control={control}
          name="batteryInfo.batteryCellCount"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <TextInput
              ref={cellCountRef}
              style={styles.textInput}
              placeholder="배터리 셀 개수를 입력하세요"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(parseInt(text) || 0)}
              keyboardType="number-pad"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => normalChargeRef.current?.focus()}
            />
          )}
        />
      </View>

      {/* 배터리 셀 관리 버튼 */}
      {batteryCellCount > 0 && (
        <TouchableOpacity style={styles.cellManageButton} onPress={() => setIsCellModalVisible(true)}>
          <View style={styles.cellManageContent}>
            <Ionicons name="grid-outline" size={24} color="#007AFF" />
            <Text style={styles.cellManageText}>배터리 셀 관리</Text>
            {defectiveCellCount > 0 && <Text style={styles.defectiveBadge}>{defectiveCellCount}개 불량</Text>}
          </View>
        </TouchableOpacity>
      )}

      {/* 자동 계산 값들 (읽기 전용) */}
      {batteryCells && batteryCells.length > 0 && (
        <>
          <View style={styles.readOnlyRow}>
            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>최대 전압</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{maxCellVoltage.toFixed(2)}V</Text>
              </View>
            </View>
            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>최소 전압</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{minCellVoltage.toFixed(2)}V</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.readOnlyLabel}>불량 셀 개수 (자동 계산)</Text>
            <View style={styles.readOnlyInput}>
              <Text style={[styles.readOnlyText, defectiveCellCount > 0 && styles.readOnlyTextDanger]}>
                {defectiveCellCount}개
              </Text>
            </View>
          </View>
        </>
      )}

      {/* 일반 충전 횟수 */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>일반 충전 횟수</Text>
        <Controller
          control={control}
          name="batteryInfo.normalChargeCount"
          render={({ field: { value, onChange } }) => (
            <TextInput
              ref={normalChargeRef}
              style={styles.textInput}
              placeholder="일반 충전 횟수를 입력하세요"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(parseInt(text) || 0)}
              keyboardType="number-pad"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => fastChargeRef.current?.focus()}
            />
          )}
        />
      </View>

      {/* 급속 충전 횟수 */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>급속 충전 횟수</Text>
        <Controller
          control={control}
          name="batteryInfo.fastChargeCount"
          render={({ field: { value, onChange } }) => (
            <TextInput
              ref={fastChargeRef}
              style={styles.textInput}
              placeholder="급속 충전 횟수를 입력하세요"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(parseInt(text) || 0)}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          )}
        />
      </View>

      <BatteryCellGridModal
        visible={isCellModalVisible}
        cells={batteryCells || []}
        defaultVoltage={defaultCellVoltage}
        defectiveCellCount={defectiveCellCount}
        maxCellVoltage={maxCellVoltage}
        minCellVoltage={minCellVoltage}
        onClose={handleCloseModal}
        onCellsUpdate={handleCellsUpdate}
        onDefaultVoltageChange={(voltage) => {
          setValue('batteryInfo.defaultCellVoltage', parseFloat(voltage) || 3.7, { shouldValidate: true });
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  cellManageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: verticalScale(14),
    gap: scale(8),
    marginBottom: 16,
  },
  cellManageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  cellManageText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  defectiveBadge: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  readOnlyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  readOnlyItem: {
    flex: 1,
  },
  readOnlyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  readOnlyTextDanger: {
    color: '#f44336',
  },
});
