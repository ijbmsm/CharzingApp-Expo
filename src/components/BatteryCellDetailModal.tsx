import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { BatteryCell } from '../services/firebaseService';

interface BatteryCellDetailModalProps {
  visible: boolean;
  cell: BatteryCell | null;
  onClose: () => void;
  onToggleDefective: () => void;
  onUpdateVoltage: (text: string) => void;
}

const BatteryCellDetailModal: React.FC<BatteryCellDetailModalProps> = ({
  visible,
  cell,
  onClose,
  onToggleDefective,
  onUpdateVoltage,
}) => {
  const insets = useSafeAreaInsets();

  if (!cell) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: Platform.OS === 'ios' ? 0 : insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.title}>셀 #{cell.id}</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Defective Checkbox */}
          <TouchableOpacity
            style={[styles.defectiveRow, cell.isDefective && styles.defectiveRowActive]}
            onPress={onToggleDefective}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, cell.isDefective && styles.checkboxChecked]}>
              {cell.isDefective && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.defectiveLabel, cell.isDefective && styles.defectiveLabelActive]}>
                불량 셀로 표시
              </Text>
              {cell.isDefective && (
                <Text style={styles.defectiveHint}>이 셀은 불량으로 표시됩니다</Text>
              )}
            </View>
            {cell.isDefective && <Ionicons name="warning" size={20} color="#EF4444" />}
          </TouchableOpacity>

          {/* Voltage Input */}
          <View style={styles.voltageGroup}>
            <Text style={styles.voltageLabel}>전압 (V)</Text>
            <TextInput
              style={styles.voltageInput}
              value={cell.voltage === 0 || cell.voltage === undefined || cell.voltage === '' ? '' : typeof cell.voltage === 'string' ? cell.voltage : cell.voltage.toString()}
              onChangeText={onUpdateVoltage}
              keyboardType="default"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmButtonText}>확인</Text>
          </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: scale(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#6B7280',
  },
  defectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(12),
    marginBottom: verticalScale(16),
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  defectiveRowActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  checkboxChecked: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  defectiveLabel: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#374151',
  },
  defectiveLabelActive: {
    color: '#DC2626',
  },
  defectiveHint: {
    fontSize: moderateScale(12),
    color: '#DC2626',
    marginTop: verticalScale(4),
  },
  voltageGroup: {
    marginBottom: verticalScale(20),
  },
  voltageLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: verticalScale(8),
  },
  voltageInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(16),
    color: '#1F2937',
  },
  confirmButton: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default BatteryCellDetailModal;
