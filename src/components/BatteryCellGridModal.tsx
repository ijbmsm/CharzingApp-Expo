import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { BatteryCell } from '../services/firebaseService';
import BatteryCellDetailModal from './BatteryCellDetailModal';

interface BatteryCellGridModalProps {
  visible: boolean;
  cells: BatteryCell[];
  defaultVoltage: number;
  defectiveCellCount: number;
  maxCellVoltage: number;
  minCellVoltage: number;
  onClose: () => void;
  onCellsUpdate: (cells: BatteryCell[]) => void;
  onDefaultVoltageChange: (text: string) => void;
}

const BatteryCellGridModal: React.FC<BatteryCellGridModalProps> = ({
  visible,
  cells,
  defaultVoltage,
  defectiveCellCount,
  maxCellVoltage,
  minCellVoltage,
  onClose,
  onCellsUpdate,
  onDefaultVoltageChange,
}) => {
  const insets = useSafeAreaInsets();

  // Detail Modal State
  const [selectedCellForEdit, setSelectedCellForEdit] = useState<BatteryCell | null>(null);
  const [isCellDetailModalVisible, setIsCellDetailModalVisible] = useState(false);

  // Local state for default voltage input (입력 중 상태 유지)
  const [localDefaultVoltage, setLocalDefaultVoltage] = useState('');

  // Sync local state with prop
  useEffect(() => {
    setLocalDefaultVoltage(defaultVoltage === 0 ? '' : defaultVoltage.toString());
  }, [defaultVoltage]);

  const handleCellPress = (cell: BatteryCell) => {
    setSelectedCellForEdit(cell);
    setIsCellDetailModalVisible(true);
  };

  const handleCloseCellDetailModal = () => {
    setIsCellDetailModalVisible(false);
    setSelectedCellForEdit(null);
  };

  const handleToggleCellDefective = () => {
    if (!selectedCellForEdit) return;

    const updatedCell = { ...selectedCellForEdit, isDefective: !selectedCellForEdit.isDefective };
    const updatedCells = cells.map(cell =>
      cell.id === selectedCellForEdit.id ? updatedCell : cell
    );
    onCellsUpdate(updatedCells);
    setSelectedCellForEdit(updatedCell);
  };

  const handleUpdateCellVoltage = (text: string) => {
    if (!selectedCellForEdit) return;

    // 빈 문자열이면 빈 문자열로 유지
    if (text === '') {
      const updatedCell = { ...selectedCellForEdit, voltage: '' };
      const updatedCells = cells.map(cell =>
        cell.id === selectedCellForEdit.id ? updatedCell : cell
      );
      onCellsUpdate(updatedCells);
      setSelectedCellForEdit(updatedCell);
      return;
    }

    // 숫자와 소수점만 허용
    const filtered = text.replace(/[^0-9.]/g, '');

    // 소수점이 여러 개면 첫 번째만 유지
    const parts = filtered.split('.');
    const validText = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filtered;

    // validText를 그대로 저장 (소수점 입력 중에도 유지)
    const updatedCell = { ...selectedCellForEdit, voltage: validText };
    const updatedCells = cells.map(cell =>
      cell.id === selectedCellForEdit.id ? updatedCell : cell
    );
    onCellsUpdate(updatedCells);
    setSelectedCellForEdit(updatedCell);
  };

  // 모든 셀에 기본 전압 적용
  const handleApplyToAllCells = () => {
    if (!localDefaultVoltage || cells.length === 0) return;

    const voltage = parseFloat(localDefaultVoltage);
    if (isNaN(voltage)) return;

    const updatedCells = cells.map(cell => ({
      ...cell,
      voltage: voltage,
    }));
    onCellsUpdate(updatedCells);
  };

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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.title}>배터리 셀 관리</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Default Voltage Setting */}
          <View style={styles.defaultVoltageContainer}>
            <Text style={styles.defaultVoltageLabel}>기본 전압 (V)</Text>
            <View style={styles.defaultVoltageRow}>
              <TextInput
                style={[styles.defaultVoltageInput, { flex: 1 }]}
                value={localDefaultVoltage}
                onChangeText={(text) => {
                  // 숫자와 소수점만 허용
                  const filtered = text.replace(/[^0-9.]/g, '');

                  // 소수점이 여러 개면 첫 번째만 유지
                  const parts = filtered.split('.');
                  const validText = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filtered;

                  setLocalDefaultVoltage(validText);
                }}
                onBlur={() => {
                  // blur 시 부모에게 전달
                  onDefaultVoltageChange(localDefaultVoltage);
                }}
                keyboardType="decimal-pad"
                placeholder="3.7"
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyToAllCells}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>모든 셀에 적용</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.defaultVoltageHint}>* 버튼을 눌러 모든 셀에 적용하세요</Text>
          </View>

          {/* Cell Grid */}
          <ScrollView
            style={styles.cellGridScroll}
            contentContainerStyle={[
              styles.cellGridContent,
              { paddingBottom: 160 + insets.bottom } // Summary 높이 + 여유
            ]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {cells.length > 0 ? (
              <View style={styles.cellGrid}>
                {cells.map((cell) => (
                  <TouchableOpacity
                    key={cell.id}
                    style={[styles.cellItem, cell.isDefective && styles.cellItemDefective]}
                    onPress={() => handleCellPress(cell)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cellNumber, cell.isDefective && styles.cellNumberDefective]}>
                      {cell.id}
                    </Text>
                    <Text style={[styles.cellVoltage, cell.isDefective && styles.cellVoltageDefective]}>
                      {cell.voltage ? `${typeof cell.voltage === 'string' ? cell.voltage : cell.voltage}V` : '0V'}
                    </Text>
                    {cell.isDefective && (
                      <View style={styles.cellDefectiveBadge}>
                        <Ionicons name="warning" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCellsMessage}>
                <Ionicons name="battery-dead-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyCellsText}>셀 데이터가 없습니다</Text>
                <Text style={styles.emptyCellsSubtext}>셀 개수를 입력하고 다시 시도해주세요</Text>
              </View>
            )}
          </ScrollView>

          {/* Summary - Absolute 고정 */}
          <View style={[styles.summaryContainer, { paddingBottom: insets.bottom }]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>총 셀 개수:</Text>
              <Text style={styles.summaryValue}>{cells.length}개</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>불량 셀:</Text>
              <Text style={[styles.summaryValue, styles.summaryDefective]}>{defectiveCellCount}개</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>최대 전압:</Text>
              <Text style={styles.summaryValue}>{maxCellVoltage.toFixed(3)}V</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>최소 전압:</Text>
              <Text style={styles.summaryValue}>{minCellVoltage.toFixed(3)}V</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Battery Cell Detail Modal */}
      <BatteryCellDetailModal
        visible={isCellDetailModalVisible}
        cell={selectedCellForEdit}
        onClose={handleCloseCellDetailModal}
        onToggleDefective={handleToggleCellDefective}
        onUpdateVoltage={handleUpdateCellVoltage}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(8),
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#6B7280',
  },
  defaultVoltageContainer: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  defaultVoltageLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: verticalScale(8),
  },
  defaultVoltageRow: {
    flexDirection: 'row',
    gap: scale(8),
    alignItems: 'center',
  },
  defaultVoltageInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(16),
    color: '#1F2937',
  },
  applyButton: {
    backgroundColor: '#06B6D4',
    borderRadius: 8,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  applyButtonText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  defaultVoltageHint: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginTop: verticalScale(4),
  },
  cellGridScroll: {
    flex: 1,
  },
  cellGridContent: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
  },
  cellGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    justifyContent: 'flex-start',
  },
  cellItem: {
    width: '17.6%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(6),
    position: 'relative',
    marginBottom: scale(4),
    minHeight: 60,
  },
  emptyCellsMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyCellsText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#6B7280',
    marginTop: verticalScale(16),
  },
  emptyCellsSubtext: {
    fontSize: moderateScale(13),
    color: '#9CA3AF',
    marginTop: verticalScale(6),
  },
  cellItemDefective: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  cellNumber: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#06B6D4',
    marginBottom: verticalScale(2),
  },
  cellNumberDefective: {
    color: '#EF4444',
  },
  cellVoltage: {
    fontSize: moderateScale(10),
    fontWeight: '500',
    color: '#6B7280',
  },
  cellVoltageDefective: {
    color: '#DC2626',
  },
  cellDefectiveBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: verticalScale(8),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryDefective: {
    color: '#EF4444',
  },
});

export default BatteryCellGridModal;
