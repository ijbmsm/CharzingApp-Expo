import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DiagnosisDetail } from '../../../services/firebaseService';
import { convertToLineSeedFont } from '../../../styles/fonts';

interface DiagnosisDetailsSectionProps {
  data?: DiagnosisDetail[];
}

export const DiagnosisDetailsSection: React.FC<DiagnosisDetailsSectionProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      {/* 섹션 제목 */}
      <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
        진단 세부 결과
      </Text>

      {/* 진단 항목 목록 */}
      <View style={styles.detailsList}>
        {data.map((item, index) => (
          <View key={index} style={styles.detailCard}>
            {/* 카테고리 */}
            <Text style={[styles.category, convertToLineSeedFont(styles.category)]}>
              {item.category}
            </Text>

            {/* 세부 정보 */}
            <View style={styles.detailContent}>
              {/* 측정값 */}
              {item.measuredValue && (
                <View style={styles.detailRow}>
                  <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>
                    측정값
                  </Text>
                  <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
                    {item.measuredValue}
                  </Text>
                </View>
              )}

              {/* 해석 */}
              {item.interpretation && (
                <View style={styles.detailRow}>
                  <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>
                    해석
                  </Text>
                  <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
                    {item.interpretation}
                  </Text>
                </View>
              )}

              {/* 상태 */}
              {item.status && (
                <View style={styles.detailRow}>
                  <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>
                    상태
                  </Text>
                  <Text style={[styles.value, convertToLineSeedFont(styles.value)]}>
                    {item.status}
                  </Text>
                </View>
              )}

              {/* 설명 */}
              {item.description ? (
                <View style={styles.descriptionContainer}>
                  <Text style={[styles.label, convertToLineSeedFont(styles.label)]}>
                    설명
                  </Text>
                  <Text style={[styles.description, convertToLineSeedFont(styles.description)]}>
                    {item.description}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
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
  detailsList: {
    gap: 16,
  },
  detailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  category: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailContent: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    width: 60,
    flexShrink: 0,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  descriptionContainer: {
    gap: 4,
  },
  description: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 24,
  },
});
