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
import { VehicleHistoryInfo } from '../../../services/firebaseService';
import { convertToLineSeedFont } from '../../../styles/fonts';

interface VehicleHistoryDetailModalProps {
  visible: boolean;
  onClose: () => void;
  data?: VehicleHistoryInfo;
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

export const VehicleHistoryDetailModal: React.FC<VehicleHistoryDetailModalProps> = ({
  visible,
  onClose,
  data,
}) => {
  const vehicleNumberChanges = data?.vehicleNumberChangeHistory || [];
  const ownerChanges = data?.ownerChangeHistory || [];
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
            차량 이력 상세
          </Text>
          <View style={styles.modalPlaceholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 차량번호 변경 이력 */}
          <View style={styles.modalSection}>
            <Text style={[styles.modalSectionTitle, convertToLineSeedFont(styles.modalSectionTitle)]}>
              차량번호 변경 이력 ({vehicleNumberChanges.length}회)
            </Text>

            {vehicleNumberChanges.length > 0 ? (
              vehicleNumberChanges.map((history, index) => (
                <View key={index} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={[styles.historyDate, convertToLineSeedFont(styles.historyDate)]}>
                      {formatDate(history.changeDate)}
                    </Text>
                  </View>

                  <View style={styles.historyContent}>
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
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={48} color="#D1D5DB" />
                <Text style={[styles.emptyText, convertToLineSeedFont(styles.emptyText)]}>
                  차량번호 변경 이력이 없습니다
                </Text>
              </View>
            )}
          </View>

          {/* 소유자 변경 이력 */}
          <View style={styles.modalSection}>
            <Text style={[styles.modalSectionTitle, convertToLineSeedFont(styles.modalSectionTitle)]}>
              소유자 변경 이력 ({ownerChanges.length}회)
            </Text>

            {ownerChanges.length > 0 ? (
              ownerChanges.map((history, index) => (
                <View key={index} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={[styles.historyDate, convertToLineSeedFont(styles.historyDate)]}>
                      {formatDate(history.changeDate)}
                    </Text>
                  </View>

                  <View style={styles.historyContent}>
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
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={48} color="#D1D5DB" />
                <Text style={[styles.emptyText, convertToLineSeedFont(styles.emptyText)]}>
                  소유자 변경 이력이 없습니다
                </Text>
              </View>
            )}
          </View>
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
  modalSection: {
    marginBottom: 28,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  historyContent: {
    gap: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  historyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
