import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { BatteryCell } from '../services/firebaseService';

interface BatteryCellViewModalProps {
  visible: boolean;
  onClose: () => void;
  cells: BatteryCell[];
  defectiveCellCount: number;
  maxCellVoltage: number;
  minCellVoltage: number;
}

const BatteryCellViewModal: React.FC<BatteryCellViewModalProps> = ({
  visible,
  onClose,
  cells,
  defectiveCellCount,
  maxCellVoltage,
  minCellVoltage,
}) => {
  const insets = useSafeAreaInsets();

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>배터리 셀 조회</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Cell Grid */}
        <ScrollView
          style={styles.cellGridScroll}
          contentContainerStyle={[
            styles.cellGridContent,
            { paddingBottom: 140 + insets.bottom }
          ]}
          showsVerticalScrollIndicator={true}
        >
          {cells.length > 0 ? (
            <View style={styles.cellGrid}>
              {cells.map((cell) => (
                <View
                  key={cell.id}
                  style={[styles.cellItem, cell.isDefective && styles.cellItemDefective]}
                >
                  <Text style={[styles.cellNumber, cell.isDefective && styles.cellNumberDefective]}>
                    {cell.id}
                  </Text>
                  <Text style={[styles.cellVoltage, cell.isDefective && styles.cellVoltageDefective]}>
                    {cell.voltage ? `${typeof cell.voltage === 'number' ? cell.voltage.toFixed(2) : parseFloat(cell.voltage || '0').toFixed(2)}V` : '0.00V'}
                  </Text>
                  {cell.isDefective && (
                    <View style={styles.cellDefectiveBadge}>
                      <Ionicons name="warning" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCellsMessage}>
              <Ionicons name="battery-dead-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyCellsText}>셀 데이터가 없습니다</Text>
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
            <Text style={styles.summaryValue}>{maxCellVoltage.toFixed(2)}V</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>최소 전압:</Text>
            <Text style={styles.summaryValue}>{minCellVoltage.toFixed(2)}V</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  cellGridScroll: {
    flex: 1,
  },
  cellGridContent: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
  },
  cellGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    justifyContent: 'flex-start',
  },
  cellItem: {
    width: '10%', // 한 줄에 10개
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(4),
    position: 'relative',
    minHeight: 40,
  },
  cellItemDefective: {
    backgroundColor: '#FEE2E2',
  },
  cellNumber: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: verticalScale(1),
  },
  cellNumberDefective: {
    color: '#EF4444',
  },
  cellVoltage: {
    fontSize: moderateScale(8),
    fontWeight: '400',
    color: '#9CA3AF',
  },
  cellVoltageDefective: {
    color: '#DC2626',
  },
  cellDefectiveBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
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

export default BatteryCellViewModal;
