import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccidentRepairHistory, RepairType } from '../../../services/firebaseService';
import { convertToLineSeedFont } from '../../../styles/fonts';

interface AccidentRepairDetailModalProps {
  visible: boolean;
  onClose: () => void;
  data?: AccidentRepairHistory;
}

// 날짜 포맷 함수
const formatDate = (date: any): string => {
  if (!date) return '-';

  try {
    let dateObj: Date;

    // Firestore Timestamp 객체인 경우
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // Date 객체인 경우
    else if (date instanceof Date) {
      dateObj = date;
    }
    // 문자열인 경우
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    else {
      return '-';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}.${month}.${day}`;
  } catch (error) {
    return '-';
  }
};

// 금액 포맷 함수
const formatCurrency = (amount?: number): string => {
  if (!amount || amount === 0) return '-';
  return `${amount.toLocaleString('ko-KR')}원`;
};

// 수리 유형별 색상
const getRepairTypeColor = (type: RepairType): string => {
  switch (type) {
    case '교환':
      return '#EF4444'; // 빨강
    case '판금':
      return '#F59E0B'; // 주황
    case '도장':
      return '#3B82F6'; // 파랑
    case '탈착':
      return '#8B5CF6'; // 보라
    case '수리':
      return '#06B6D4'; // 초록
    default:
      return '#6B7280'; // 회색
  }
};

export const AccidentRepairDetailModal: React.FC<AccidentRepairDetailModalProps> = ({
  visible,
  onClose,
  data,
}) => {
  const records = data?.records || [];
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header - iOS pageSheet은 SafeArea 아래부터 시작하므로 여백 불필요 */}
        <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'android' ? insets.top + 12 : 12 }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, convertToLineSeedFont(styles.modalTitle)]}>
            사고/수리 이력 상세
          </Text>
          <View style={styles.modalPlaceholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {records.length > 0 ? (
            records.map((record, index) => {
              // 총 비용 계산
              const myCarTotal = (record.myCarPartsCost || 0) + (record.myCarLaborCost || 0) + (record.myCarPaintingCost || 0);
              const otherCarTotal = (record.otherCarPartsCost || 0) + (record.otherCarLaborCost || 0) + (record.otherCarPaintingCost || 0);

              // 수리 유형별로 부위 그룹핑
              const repairsByType: Record<RepairType, string[]> = {
                '도장': [],
                '탈착': [],
                '교환': [],
                '판금': [],
                '수리': [],
                '기타': [],
              };

              record.repairParts?.forEach(part => {
                // 방어적 코드: part와 repairTypes가 유효한지 확인
                if (part && part.repairTypes && Array.isArray(part.repairTypes)) {
                  part.repairTypes.forEach(type => {
                    // repairsByType에 해당 type이 있고 partName이 유효할 때만 추가
                    if (type && repairsByType[type] && part.partName) {
                      repairsByType[type].push(String(part.partName));
                    }
                  });
                }
              });

              return (
                <View key={index} style={styles.accidentCard}>
                  {/* 사고 헤더 */}
                  <View style={styles.accidentHeader}>
                    <Text style={[styles.accidentDate, convertToLineSeedFont(styles.accidentDate)]}>
                      {formatDate(record.accidentDate)}
                    </Text>
                  </View>

                  {/* 비용 상세 (맨 위로 이동) */}
                  {(myCarTotal > 0 || otherCarTotal > 0) ? (
                    <View style={styles.costSection}>
                      {/* 내 차 비용 */}
                      {myCarTotal > 0 ? (
                        <>
                          <Text style={[styles.costGroupTitle, convertToLineSeedFont(styles.costGroupTitle)]}>
                            내 차 수리 비용
                          </Text>
                          {record.myCarPartsCost && record.myCarPartsCost > 0 ? (
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
                                부품비
                              </Text>
                              <Text style={[styles.infoValue, convertToLineSeedFont(styles.infoValue)]}>
                                {formatCurrency(record.myCarPartsCost)}
                              </Text>
                            </View>
                          ) : null}
                          {record.myCarLaborCost && record.myCarLaborCost > 0 ? (
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
                                공임비
                              </Text>
                              <Text style={[styles.infoValue, convertToLineSeedFont(styles.infoValue)]}>
                                {formatCurrency(record.myCarLaborCost)}
                              </Text>
                            </View>
                          ) : null}
                          {record.myCarPaintingCost && record.myCarPaintingCost > 0 ? (
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
                                도장비
                              </Text>
                              <Text style={[styles.infoValue, convertToLineSeedFont(styles.infoValue)]}>
                                {formatCurrency(record.myCarPaintingCost)}
                              </Text>
                            </View>
                          ) : null}

                          {/* 내 차 총 합계 */}
                          <View style={[styles.infoRow, styles.myCarTotalRow]}>
                            <Text style={[styles.myCarTotalLabel, convertToLineSeedFont(styles.myCarTotalLabel)]}>
                              내 차 수리 총 합계
                            </Text>
                            <Text style={[styles.myCarTotalValue, convertToLineSeedFont(styles.myCarTotalValue)]}>
                              {formatCurrency(myCarTotal)}
                            </Text>
                          </View>
                        </>
                      ) : null}

                      {/* 상대 차 비용 */}
                      {otherCarTotal > 0 ? (
                        <>
                          <Text style={[styles.costGroupTitle, convertToLineSeedFont(styles.costGroupTitle), styles.costGroupTitleMargin]}>
                            상대 차 수리 비용
                          </Text>
                          {record.otherCarPartsCost && record.otherCarPartsCost > 0 ? (
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
                                부품비
                              </Text>
                              <Text style={[styles.infoValue, convertToLineSeedFont(styles.infoValue)]}>
                                {formatCurrency(record.otherCarPartsCost)}
                              </Text>
                            </View>
                          ) : null}
                          {record.otherCarLaborCost && record.otherCarLaborCost > 0 ? (
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
                                공임비
                              </Text>
                              <Text style={[styles.infoValue, convertToLineSeedFont(styles.infoValue)]}>
                                {formatCurrency(record.otherCarLaborCost)}
                              </Text>
                            </View>
                          ) : null}
                          {record.otherCarPaintingCost && record.otherCarPaintingCost > 0 ? (
                            <View style={styles.infoRow}>
                              <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
                                도장비
                              </Text>
                              <Text style={[styles.infoValue, convertToLineSeedFont(styles.infoValue)]}>
                                {formatCurrency(record.otherCarPaintingCost)}
                              </Text>
                            </View>
                          ) : null}

                          {/* 상대 차 총 합계 */}
                          <View style={[styles.infoRow, styles.otherCarTotalRow]}>
                            <Text style={[styles.otherCarTotalLabel, convertToLineSeedFont(styles.otherCarTotalLabel)]}>
                              상대 차 수리 총 합계
                            </Text>
                            <Text style={[styles.otherCarTotalValue, convertToLineSeedFont(styles.otherCarTotalValue)]}>
                              {formatCurrency(otherCarTotal)}
                            </Text>
                          </View>
                        </>
                      ) : null}
                    </View>
                  ) : null}

                  {/* 수리 부위 (유형별로 그룹핑) */}
                  {record.repairParts && record.repairParts.length > 0 ? (
                    <View style={styles.repairSection}>
                      {(Object.keys(repairsByType) as RepairType[]).map(type => {
                        const parts = repairsByType[type];
                        if (parts.length === 0) return null;

                        return (
                          <View key={type}>
                            <Text style={[styles.repairTypeTitle, convertToLineSeedFont(styles.repairTypeTitle)]}>
                              {type}
                            </Text>
                            {parts.map((partName, idx) => {
                              // partName이 유효하지 않으면 렌더링하지 않음
                              if (!partName) return null;
                              return (
                                <View key={idx} style={styles.infoRow}>
                                  <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
                                    {String(partName)}
                                  </Text>
                                  <View
                                    style={[
                                      styles.repairTypeBadge,
                                      { backgroundColor: getRepairTypeColor(type) },
                                    ]}
                                  >
                                    <Text style={[styles.repairTypeText, convertToLineSeedFont(styles.repairTypeText)]}>
                                      {type}
                                    </Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                  ) : null}

                  {/* 수리 요약 */}
                  {record.summary ? (
                    <View style={styles.summarySection}>
                      <Text style={[styles.summarySectionTitle, convertToLineSeedFont(styles.summarySectionTitle)]}>
                        수리 내역 요약
                      </Text>
                      <Text style={[styles.summaryText, convertToLineSeedFont(styles.summaryText)]}>
                        {record.summary}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#D1D5DB" />
              <Text style={[styles.emptyText, convertToLineSeedFont(styles.emptyText)]}>
                사고/수리 이력이 없습니다
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  accidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accidentHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  accidentDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  // 비용 섹션
  costSection: {
    marginBottom: 16,
  },
  costGroupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  costGroupTitleMargin: {
    marginTop: 12,
  },
  // 수리 부위 섹션 (2-column 레이아웃)
  repairSection: {
    marginBottom: 16,
  },
  repairTypeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 8,
  },
  // 공통 2-column 레이아웃
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  // 수리 유형 뱃지
  repairTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  repairTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // 수리 요약
  summarySection: {
    marginTop: 4,
  },
  summarySectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // 내 차 총 합계
  myCarTotalRow: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  myCarTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  myCarTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  // 상대 차 총 합계
  otherCarTotalRow: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  otherCarTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  otherCarTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
