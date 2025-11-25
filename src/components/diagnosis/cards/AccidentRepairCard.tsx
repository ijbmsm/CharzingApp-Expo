import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { AccidentRepairHistory } from '../../../services/firebaseService';

interface AccidentRepairCardProps {
  data?: AccidentRepairHistory;
  animationDelay?: number;
}

export const AccidentRepairCard: React.FC<AccidentRepairCardProps> = ({
  data,
  animationDelay = 0,
}) => {
  // 데이터가 없으면 렌더링하지 않음
  if (!data || !data.records || data.records.length === 0) return null;

  // 날짜 포맷 헬퍼
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '-';

    try {
      let date: Date;

      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return '-';
      }

      return date.toLocaleDateString('ko-KR');
    } catch (error) {
      return '-';
    }
  };

  // 비용 포맷 헬퍼
  const formatCost = (cost?: number): string => {
    if (!cost || cost === 0) return '-';
    return `${cost.toLocaleString()}원`;
  };

  // 수리 유형 배지 색상
  const getRepairTypeBadgeColor = (type: string): string => {
    switch (type) {
      case '교환':
        return '#EF4444';
      case '판금':
        return '#F59E0B';
      case '도장':
        return '#3B82F6';
      case '탈착':
        return '#06B6D4';
      case '수리':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={400}
      delay={animationDelay}
      style={styles.container}
    >
      <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.card}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="warning-outline" size={24} color="#F59E0B" />
            <Text
              style={[
                styles.headerTitle,
                convertToLineSeedFont(styles.headerTitle),
              ]}
            >
              사고/수리 이력
            </Text>
          </View>
          <View style={styles.recordCountBadge}>
            <Text
              style={[
                styles.recordCountText,
                convertToLineSeedFont(styles.recordCountText),
              ]}
            >
              {data.records.length}건
            </Text>
          </View>
        </View>

        {/* 사고 이력 목록 */}
        <View style={styles.recordsList}>
          {data.records.map((record, index) => (
            <View key={index} style={styles.recordItem}>
              {/* 사고 날짜 */}
              <View style={styles.recordHeader}>
                <View style={styles.recordDateContainer}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text
                    style={[
                      styles.recordDate,
                      convertToLineSeedFont(styles.recordDate),
                    ]}
                  >
                    {formatDate(record.accidentDate)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.recordIndex,
                    convertToLineSeedFont(styles.recordIndex),
                  ]}
                >
                  사고 {index + 1}
                </Text>
              </View>

              {/* 수리 부위 */}
              {record.repairParts && record.repairParts.length > 0 && (
                <View style={styles.repairPartsSection}>
                  <Text
                    style={[
                      styles.sectionLabel,
                      convertToLineSeedFont(styles.sectionLabel),
                    ]}
                  >
                    수리 부위
                  </Text>
                  <View style={styles.repairPartsList}>
                    {record.repairParts.map((part, partIndex) => (
                      <View key={partIndex} style={styles.repairPartItem}>
                        <Text
                          style={[
                            styles.partName,
                            convertToLineSeedFont(styles.partName),
                          ]}
                        >
                          {part.partName}
                        </Text>
                        <View style={styles.repairTypesList}>
                          {part.repairTypes.map((type, typeIndex) => (
                            <View
                              key={typeIndex}
                              style={[
                                styles.repairTypeBadge,
                                {
                                  backgroundColor: getRepairTypeBadgeColor(
                                    type
                                  ),
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.repairTypeText,
                                  convertToLineSeedFont(
                                    styles.repairTypeText
                                  ),
                                ]}
                              >
                                {type}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 수리 내역 요약 */}
              {record.summary ? (
                <View style={styles.summarySection}>
                  <Text
                    style={[
                      styles.sectionLabel,
                      convertToLineSeedFont(styles.sectionLabel),
                    ]}
                  >
                    수리 내역 요약
                  </Text>
                  <Text
                    style={[
                      styles.summaryText,
                      convertToLineSeedFont(styles.summaryText),
                    ]}
                  >
                    {record.summary}
                  </Text>
                </View>
              ) : null}

              {/* 비용 정보 */}
              {(record.myCarPartsCost ||
                record.myCarLaborCost ||
                record.myCarPaintingCost ||
                record.otherCarPartsCost ||
                record.otherCarLaborCost ||
                record.otherCarPaintingCost) && (
                <View style={styles.costSection}>
                  <Text
                    style={[
                      styles.sectionLabel,
                      convertToLineSeedFont(styles.sectionLabel),
                    ]}
                  >
                    사고 비용
                  </Text>

                  {/* 내 차 비용 */}
                  {(record.myCarPartsCost ||
                    record.myCarLaborCost ||
                    record.myCarPaintingCost) && (
                    <View style={styles.costGroup}>
                      <Text
                        style={[
                          styles.costGroupTitle,
                          convertToLineSeedFont(styles.costGroupTitle),
                        ]}
                      >
                        내 차
                      </Text>
                      {record.myCarPartsCost && (
                        <View style={styles.costRow}>
                          <Text
                            style={[
                              styles.costLabel,
                              convertToLineSeedFont(styles.costLabel),
                            ]}
                          >
                            부품비
                          </Text>
                          <Text
                            style={[
                              styles.costValue,
                              convertToLineSeedFont(styles.costValue),
                            ]}
                          >
                            {formatCost(record.myCarPartsCost)}
                          </Text>
                        </View>
                      )}
                      {record.myCarLaborCost && (
                        <View style={styles.costRow}>
                          <Text
                            style={[
                              styles.costLabel,
                              convertToLineSeedFont(styles.costLabel),
                            ]}
                          >
                            공임비
                          </Text>
                          <Text
                            style={[
                              styles.costValue,
                              convertToLineSeedFont(styles.costValue),
                            ]}
                          >
                            {formatCost(record.myCarLaborCost)}
                          </Text>
                        </View>
                      )}
                      {record.myCarPaintingCost && (
                        <View style={styles.costRow}>
                          <Text
                            style={[
                              styles.costLabel,
                              convertToLineSeedFont(styles.costLabel),
                            ]}
                          >
                            도장비
                          </Text>
                          <Text
                            style={[
                              styles.costValue,
                              convertToLineSeedFont(styles.costValue),
                            ]}
                          >
                            {formatCost(record.myCarPaintingCost)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* 상대 차 비용 */}
                  {(record.otherCarPartsCost ||
                    record.otherCarLaborCost ||
                    record.otherCarPaintingCost) && (
                    <View style={styles.costGroup}>
                      <Text
                        style={[
                          styles.costGroupTitle,
                          convertToLineSeedFont(styles.costGroupTitle),
                        ]}
                      >
                        상대 차
                      </Text>
                      {record.otherCarPartsCost && (
                        <View style={styles.costRow}>
                          <Text
                            style={[
                              styles.costLabel,
                              convertToLineSeedFont(styles.costLabel),
                            ]}
                          >
                            부품비
                          </Text>
                          <Text
                            style={[
                              styles.costValue,
                              convertToLineSeedFont(styles.costValue),
                            ]}
                          >
                            {formatCost(record.otherCarPartsCost)}
                          </Text>
                        </View>
                      )}
                      {record.otherCarLaborCost && (
                        <View style={styles.costRow}>
                          <Text
                            style={[
                              styles.costLabel,
                              convertToLineSeedFont(styles.costLabel),
                            ]}
                          >
                            공임비
                          </Text>
                          <Text
                            style={[
                              styles.costValue,
                              convertToLineSeedFont(styles.costValue),
                            ]}
                          >
                            {formatCost(record.otherCarLaborCost)}
                          </Text>
                        </View>
                      )}
                      {record.otherCarPaintingCost && (
                        <View style={styles.costRow}>
                          <Text
                            style={[
                              styles.costLabel,
                              convertToLineSeedFont(styles.costLabel),
                            ]}
                          >
                            도장비
                          </Text>
                          <Text
                            style={[
                              styles.costValue,
                              convertToLineSeedFont(styles.costValue),
                            ]}
                          >
                            {formatCost(record.otherCarPaintingCost)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  recordCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  recordsList: {
    gap: 16,
  },
  recordItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 6,
  },
  recordIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  repairPartsSection: {
    marginBottom: 12,
  },
  repairPartsList: {
    gap: 8,
  },
  repairPartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  partName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  repairTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  repairTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  repairTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  summarySection: {
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  costSection: {
    marginTop: 4,
  },
  costGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  costGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  costLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  costValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
});
