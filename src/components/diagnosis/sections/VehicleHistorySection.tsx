import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VehicleHistoryInfo } from '../../../services/firebaseService';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { VehicleHistoryDetailModal } from '../modals/VehicleHistoryDetailModal';

interface VehicleHistorySectionProps {
  data?: VehicleHistoryInfo;
}

export const VehicleHistorySection: React.FC<VehicleHistorySectionProps> = ({ data }) => {
  const [modalVisible, setModalVisible] = useState(false);

  // 데이터가 없으면 기본값으로 "없음" 표시
  const ownerChangeCount = data?.ownerChangeHistory?.length || 0;
  const vehicleNumberChangeCount = data?.vehicleNumberChangeHistory?.length || 0;
  const hasHistory = ownerChangeCount > 0 || vehicleNumberChangeCount > 0;

  return (
    <View style={styles.section}>
      {/* 섹션 제목 */}
      <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
        차량 이력 정보
      </Text>

      {/* 소유자 변경 */}
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
          소유자 변경
        </Text>
        <Text
          style={[
            styles.infoValue,
            ownerChangeCount > 0 ? styles.infoNormal : styles.infoGood,
            convertToLineSeedFont(styles.infoValue),
          ]}
        >
          {ownerChangeCount > 0 ? `${ownerChangeCount}회` : '없음'}
        </Text>
      </View>

      {/* 차량번호 변경 */}
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
          차량번호 변경
        </Text>
        <Text
          style={[
            styles.infoValue,
            vehicleNumberChangeCount > 0 ? styles.infoNormal : styles.infoGood,
            convertToLineSeedFont(styles.infoValue),
          ]}
        >
          {vehicleNumberChangeCount > 0 ? `${vehicleNumberChangeCount}회` : '없음'}
        </Text>
      </View>

      {/* 자세히 보기 버튼 */}
      {hasHistory && (
        <TouchableOpacity
          style={styles.viewDetailButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewDetailButtonText, convertToLineSeedFont(styles.viewDetailButtonText)]}>
            자세히 보기
          </Text>
        </TouchableOpacity>
      )}

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 상세 모달 */}
      <VehicleHistoryDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        data={data}
      />
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
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoGood: {
    color: '#06B6D4', // 초록색 (없음)
  },
  infoNormal: {
    color: '#1F2937', // 검정색 (횟수)
  },
  viewDetailButton: {
    marginTop: 12,
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
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
  },
});
