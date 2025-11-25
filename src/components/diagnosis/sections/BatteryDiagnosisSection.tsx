import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VehicleDiagnosisReport } from '../../../services/firebaseService';
import { convertToLineSeedFont } from '../../../styles/fonts';
import BatteryCellViewModal from '../../BatteryCellViewModal';

interface BatteryDiagnosisSectionProps {
  report: VehicleDiagnosisReport;
}

// SOH 기반 색상 결정
const getHealthColor = (soh: number): string => {
  if (soh >= 90) return '#06B6D4'; // 초록
  if (soh >= 80) return '#F59E0B'; // 주황
  return '#EF4444'; // 빨강
};

export const BatteryDiagnosisSection: React.FC<BatteryDiagnosisSectionProps> = ({ report }) => {
  const [cellMapVisible, setCellMapVisible] = useState(false);

  return (
    <View style={styles.section}>
      {/* SOH - 강조 표시 */}
      <View style={styles.sohContainer}>
        <View style={styles.sohLabelContainer}>
          <Text style={[styles.sohLabel, convertToLineSeedFont(styles.sohLabel)]}>
            배터리 성능
          </Text>
          <Text style={[styles.sohSubLabel, convertToLineSeedFont(styles.sohSubLabel)]}>
            State of Health
          </Text>
        </View>
        <View style={styles.sohValueContainer}>
          <Text
            style={[
              styles.sohValue,
              { color: getHealthColor(report.sohPercentage) },
              convertToLineSeedFont(styles.sohValue),
            ]}
          >
            {report.sohPercentage}
          </Text>
          <Text style={[styles.sohUnit, convertToLineSeedFont(styles.sohUnit)]}>%</Text>
        </View>
      </View>

      {/* 배터리 상세 정보 */}
      <View style={styles.infoList}>
        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>총 셀 개수</Text>
          <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
            {report.cellCount}개
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>불량 셀</Text>
          <Text
            style={[
              styles.value,
              report.defectiveCellCount > 0 && styles.valueDanger,
              convertToLineSeedFont(styles.value),
            ]}
          >
            {report.defectiveCellCount}개
          </Text>
        </View>

        {report.maxVoltage !== undefined && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>최대 전압</Text>
            <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
              {report.maxVoltage.toFixed(2)}V
            </Text>
          </View>
        )}

        {report.minVoltage !== undefined && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>최소 전압</Text>
            <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
              {report.minVoltage.toFixed(2)}V
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>일반 충전</Text>
          <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
            {report.normalChargeCount}회
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>급속 충전</Text>
          <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
            {report.fastChargeCount}회
          </Text>
        </View>

        {report.realDrivableDistance && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>
              실 주행가능거리
            </Text>
            <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
              {report.realDrivableDistance}km
            </Text>
          </View>
        )}
      </View>

      {/* 자세히 보기 버튼 */}
      {report.cellsData && report.cellsData.length > 0 && (
        <TouchableOpacity
          style={styles.viewDetailButton}
          onPress={() => setCellMapVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewDetailButtonText, convertToLineSeedFont(styles.viewDetailButtonText)]}>
            배터리 셀 자세히 보기
          </Text>
        </TouchableOpacity>
      )}

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 배터리 셀 맵 모달 */}
      <BatteryCellViewModal
        visible={cellMapVisible}
        onClose={() => setCellMapVisible(false)}
        cells={report.cellsData || []}
        defectiveCellCount={report.defectiveCellCount}
        maxCellVoltage={report.maxVoltage || 0}
        minCellVoltage={report.minVoltage || 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  viewDetailButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sohContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 20,
    paddingHorizontal: 0,
    borderRadius: 12,
    marginBottom: 16,
  },
  sohLabelContainer: {
    flex: 1,
  },
  sohLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  sohSubLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sohValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sohValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  sohUnit: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
  },
  valueDanger: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
  },
});
