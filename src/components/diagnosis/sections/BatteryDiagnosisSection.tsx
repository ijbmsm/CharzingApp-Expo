import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  // 배터리 데이터가 아직 입력되지 않은 경우 (앱에서 체크만 하고 admin에서 입력 예정)
  const hasBatteryData = report.sohPercentage != null && report.cellCount != null;

  if (!hasBatteryData) {
    return (
      <View style={styles.section}>
        <View style={styles.pendingContainer}>
          <Ionicons name="hourglass-outline" size={32} color="#9CA3AF" />
          <Text style={[styles.pendingText, convertToLineSeedFont(styles.pendingText)]}>
            배터리 상세 정보가 아직 입력되지 않았습니다
          </Text>
          <Text style={[styles.pendingSubText, convertToLineSeedFont(styles.pendingSubText)]}>
            관리자가 OBD 데이터를 입력하면 표시됩니다
          </Text>
        </View>
        <View style={styles.divider} />
      </View>
    );
  }

  const soh = report.sohPercentage ?? 0;
  const cellCount = report.cellCount ?? 0;
  const defectiveCellCount = report.defectiveCellCount ?? 0;
  const normalChargeCount = report.normalChargeCount ?? 0;
  const fastChargeCount = report.fastChargeCount ?? 0;
  const maxVoltage = report.maxVoltage ?? null;
  const minVoltage = report.minVoltage ?? null;

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
              { color: getHealthColor(soh) },
              convertToLineSeedFont(styles.sohValue),
            ]}
          >
            {soh}
          </Text>
          <Text style={[styles.sohUnit, convertToLineSeedFont(styles.sohUnit)]}>%</Text>
        </View>
      </View>

      {/* 배터리 상세 정보 */}
      <View style={styles.infoList}>
        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>총 셀 개수</Text>
          <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
            {cellCount}개
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>불량 셀</Text>
          <Text
            style={[
              styles.value,
              defectiveCellCount > 0 && styles.valueDanger,
              convertToLineSeedFont(styles.value),
            ]}
          >
            {defectiveCellCount}개
          </Text>
        </View>

        {maxVoltage != null && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>최대 전압</Text>
            <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
              {maxVoltage.toFixed(2)}V
            </Text>
          </View>
        )}

        {minVoltage != null && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>최소 전압</Text>
            <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
              {minVoltage.toFixed(2)}V
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>일반 충전</Text>
          <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
            {normalChargeCount}회
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>급속 충전</Text>
          <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
            {fastChargeCount}회
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
        defectiveCellCount={defectiveCellCount}
        maxCellVoltage={maxVoltage ?? 0}
        minCellVoltage={minVoltage ?? 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  pendingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  pendingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  pendingSubText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
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
