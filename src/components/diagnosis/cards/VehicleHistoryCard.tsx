import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { VehicleHistoryInfo } from '../../../services/firebaseService';

interface VehicleHistoryCardProps {
  data?: VehicleHistoryInfo;
  animationDelay?: number;
}

export const VehicleHistoryCard: React.FC<VehicleHistoryCardProps> = ({
  data,
  animationDelay = 0,
}) => {
  // 데이터가 없으면 렌더링하지 않음
  if (!data) return null;

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

  const hasVehicleNumberHistory = data.vehicleNumberChangeHistory && data.vehicleNumberChangeHistory.length > 0;
  const hasOwnerHistory = data.ownerChangeHistory && data.ownerChangeHistory.length > 0;

  // 둘 다 없으면 렌더링하지 않음
  if (!hasVehicleNumberHistory && !hasOwnerHistory) return null;

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={400}
      delay={animationDelay}
      style={styles.container}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.card}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="time-outline" size={24} color="#06B6D4" />
            <Text style={[styles.headerTitle, convertToLineSeedFont(styles.headerTitle)]}>
              차량 이력 정보
            </Text>
          </View>
        </View>

        {/* 차량번호 변경 이력 */}
        {hasVehicleNumberHistory && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car-outline" size={18} color="#3B82F6" />
              <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
                차량번호 변경 이력
              </Text>
            </View>

            {/* 변경 횟수 */}
            <View style={styles.countRow}>
              <Text style={[styles.countLabel, convertToLineSeedFont(styles.countLabel)]}>
                변경 횟수
              </Text>
              <Text style={[styles.countValue, convertToLineSeedFont(styles.countValue)]}>
                {data.vehicleNumberChangeHistory.length}회
              </Text>
            </View>

            {/* 변경 이력 목록 */}
            <View style={styles.historyList}>
              {data.vehicleNumberChangeHistory.map((history, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyItemHeader}>
                    <Text style={[styles.historyItemIndex, convertToLineSeedFont(styles.historyItemIndex)]}>
                      변경 {index + 1}
                    </Text>
                  </View>

                  <View style={styles.historyItemContent}>
                    <View style={styles.historyRow}>
                      <Text style={[styles.historyLabel, convertToLineSeedFont(styles.historyLabel)]}>
                        변경 등록일
                      </Text>
                      <Text style={[styles.historyValue, convertToLineSeedFont(styles.historyValue)]}>
                        {formatDate(history.changeDate)}
                      </Text>
                    </View>

                    <View style={styles.historyRow}>
                      <Text style={[styles.historyLabel, convertToLineSeedFont(styles.historyLabel)]}>
                        변경 사유
                      </Text>
                      <Text style={[styles.historyValue, convertToLineSeedFont(styles.historyValue)]}>
                        {history.reason || '-'}
                      </Text>
                    </View>

                    <View style={styles.historyRow}>
                      <Text style={[styles.historyLabel, convertToLineSeedFont(styles.historyLabel)]}>
                        차량용도
                      </Text>
                      <Text style={[styles.historyValue, convertToLineSeedFont(styles.historyValue)]}>
                        {history.vehicleUsage || '-'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 소유자 변경 이력 */}
        {hasOwnerHistory && (
          <View style={[styles.section, hasVehicleNumberHistory && styles.sectionWithBorder]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={18} color="#06B6D4" />
              <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
                소유자 변경 이력
              </Text>
            </View>

            {/* 변경 횟수 */}
            <View style={styles.countRow}>
              <Text style={[styles.countLabel, convertToLineSeedFont(styles.countLabel)]}>
                변경 횟수
              </Text>
              <Text style={[styles.countValue, convertToLineSeedFont(styles.countValue)]}>
                {data.ownerChangeHistory.length}회
              </Text>
            </View>

            {/* 변경 이력 목록 */}
            <View style={styles.historyList}>
              {data.ownerChangeHistory.map((history, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyItemHeader}>
                    <Text style={[styles.historyItemIndex, convertToLineSeedFont(styles.historyItemIndex)]}>
                      변경 {index + 1}
                    </Text>
                  </View>

                  <View style={styles.historyItemContent}>
                    <View style={styles.historyRow}>
                      <Text style={[styles.historyLabel, convertToLineSeedFont(styles.historyLabel)]}>
                        변경 등록일
                      </Text>
                      <Text style={[styles.historyValue, convertToLineSeedFont(styles.historyValue)]}>
                        {formatDate(history.changeDate)}
                      </Text>
                    </View>

                    <View style={styles.historyRow}>
                      <Text style={[styles.historyLabel, convertToLineSeedFont(styles.historyLabel)]}>
                        차량용도
                      </Text>
                      <Text style={[styles.historyValue, convertToLineSeedFont(styles.historyValue)]}>
                        {history.vehicleUsage || '-'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
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
  section: {
    marginBottom: 16,
  },
  sectionWithBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
  },
  countLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  countValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyItemHeader: {
    marginBottom: 8,
  },
  historyItemIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  historyItemContent: {
    gap: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  historyValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
});
