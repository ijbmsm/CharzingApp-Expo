import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { convertToLineSeedFont } from '../../../styles/fonts';

interface DiagnosticianSignatureSectionProps {
  mechanicId?: string;
  mechanicName?: string;
  diagnosisDate?: Date | any; // Firebase Timestamp 지원
  createdAt?: Date | any;
}

// 날짜 포맷팅
const formatDate = (date: Date | any): string => {
  if (!date) return '-';

  try {
    // Firebase Timestamp인 경우
    if (date.toDate && typeof date.toDate === 'function') {
      const d = date.toDate();
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    }

    // Date 객체인 경우
    if (date instanceof Date) {
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    }

    return '-';
  } catch (error) {
    return '-';
  }
};

export const DiagnosticianSignatureSection: React.FC<DiagnosticianSignatureSectionProps> = ({
  mechanicId,
  mechanicName,
  diagnosisDate,
  createdAt,
}) => {
  // 모든 필드가 없으면 렌더링하지 않음
  if (!mechanicId && !mechanicName && !diagnosisDate && !createdAt) {
    return null;
  }

  const displayDate = diagnosisDate || createdAt;

  return (
    <View style={styles.section}>
      {/* 섹션 제목 */}
      <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
        진단사 정보
      </Text>

      {/* 서명 카드 */}
      <View style={styles.signatureCard}>
        {/* 진단사 아이콘 */}
        <View style={styles.iconContainer}>
          <Ionicons name="person-circle-outline" size={48} color="#6B7280" />
        </View>

        {/* 진단사 정보 */}
        <View style={styles.infoContainer}>
          {mechanicName && (
            <Text style={[styles.mechanicName, convertToLineSeedFont(styles.mechanicName)]}>
              {mechanicName}
            </Text>
          )}

          <View style={styles.metadataRow}>
            {displayDate && (
              <View style={styles.metadata}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={[styles.metadataText, convertToLineSeedFont(styles.metadataText)]}>
                  {formatDate(displayDate)}
                </Text>
              </View>
            )}
            {mechanicId && (
              <View style={styles.metadata}>
                <Ionicons name="key-outline" size={14} color="#6B7280" />
                <Text style={[styles.metadataText, convertToLineSeedFont(styles.metadataText)]}>
                  ID: {mechanicId.substring(0, 8)}...
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 인증 배지 */}
        <View style={styles.certifiedBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#06B6D4" />
        </View>
      </View>

      {/* 안내 메시지 */}
      <View style={styles.noteContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        <Text style={[styles.noteText, convertToLineSeedFont(styles.noteText)]}>
          이 진단 리포트는 전문 진단사에 의해 작성되었습니다
        </Text>
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
  signatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
  },
  infoContainer: {
    flex: 1,
    gap: 6,
  },
  mechanicName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 13,
    color: '#6B7280',
  },
  certifiedBadge: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 24,
  },
});
