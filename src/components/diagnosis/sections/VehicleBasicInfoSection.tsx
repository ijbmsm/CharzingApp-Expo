import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VehicleDiagnosisReport } from '../../../services/firebaseService';
import { convertToLineSeedFont } from '../../../styles/fonts';

interface VehicleBasicInfoSectionProps {
  report: VehicleDiagnosisReport;
}

const formatDate = (date: any): string => {
  if (!date) return '-';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const VehicleBasicInfoSection: React.FC<VehicleBasicInfoSectionProps> = ({ report }) => {
  return (
    <View style={styles.section}>
      {/* 섹션 제목 */}
      <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
        차량 기본 정보
      </Text>

      {/* 정보 리스트 */}
      <View style={styles.infoList}>
        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>브랜드</Text>
          <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
            {report.vehicleBrand}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>차량명</Text>
          <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
            {report.vehicleName}
          </Text>
        </View>

        {report.vehicleGrade && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>등급/트림</Text>
            <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
              {report.vehicleGrade}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>연식</Text>
          <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
            {report.vehicleYear}년형
          </Text>
        </View>

        {report.vehicleVIN && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>차대번호</Text>
            <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
              {report.vehicleVIN}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>진단 날짜</Text>
          <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
            {formatDate(report.diagnosisDate)}
          </Text>
        </View>

        {report.mileage !== undefined && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>주행거리</Text>
            <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
              {report.mileage.toLocaleString()}km
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>차키 개수</Text>
          <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
            {report.carKeyCount}개
          </Text>
        </View>
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
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
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 24,
  },
});
