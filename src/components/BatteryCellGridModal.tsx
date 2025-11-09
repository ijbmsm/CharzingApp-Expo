import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { BatteryCell } from '../../adminWeb/index';
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
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  // Detail Modal State
  const [selectedCellForEdit, setSelectedCellForEdit] = useState<BatteryCell | null>(null);
  const [isCellDetailModalVisible, setIsCellDetailModalVisible] = useState(false);

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

    // 빈 문자열이면 0
    if (text === '') {
      const updatedCell = { ...selectedCellForEdit, voltage: 0 };
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

    // 유효한 숫자로 변환
    const numValue = parseFloat(validText);
    const voltage = isNaN(numValue) ? 0 : numValue;

    const updatedCell = { ...selectedCellForEdit, voltage };
    const updatedCells = cells.map(cell =>
      cell.id === selectedCellForEdit.id ? updatedCell : cell
    );
    onCellsUpdate(updatedCells);
    setSelectedCellForEdit(updatedCell);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { height: screenHeight * 0.92 }]}>
          {/* Handle Bar */}
          <View style={styles.handleBarContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>배터리 셀 관리</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Default Voltage Setting */}
          <View style={styles.defaultVoltageContainer}>
            <Text style={styles.defaultVoltageLabel}>기본 전압 (V)</Text>
            <TextInput
              style={styles.defaultVoltageInput}
              value={defaultVoltage === 0 ? '' : defaultVoltage.toString()}
              onChangeText={onDefaultVoltageChange}
              keyboardType="decimal-pad"
              placeholder="3.7"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.defaultVoltageHint}>* 모든 셀에 적용됩니다</Text>
          </View>

          {/* Cell Grid */}
          <ScrollView
            style={styles.cellGridScroll}
            contentContainerStyle={styles.cellGridContent}
            showsVerticalScrollIndicator={true}
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
                      {cell.cellNumber}
                    </Text>
                    <Text style={[styles.cellVoltage, cell.isDefective && styles.cellVoltageDefective]}>
                      {cell.voltage ? `${cell.voltage.toFixed(2)}V` : '0.00V'}
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

          {/* Summary */}
          <View style={styles.summaryContainer}>
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
              <Text style={styles.summaryValue}>{maxCellVoltage.toFixed(2)}V</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>최소 전압:</Text>
              <Text style={styles.summaryValue}>{minCellVoltage.toFixed(2)}V</Text>
            </View>
          </View>
        </View>

        {/* Battery Cell Detail Modal */}
        <BatteryCellDetailModal
          visible={isCellDetailModalVisible}
          cell={selectedCellForEdit}
          onClose={handleCloseCellDetailModal}
          onToggleDefective={handleToggleCellDefective}
          onUpdateVoltage={handleUpdateCellVoltage}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: verticalScale(20),
  },
  handleBarContainer: {
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(4),
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#1F2937',
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
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: '#F9FAFB',
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
