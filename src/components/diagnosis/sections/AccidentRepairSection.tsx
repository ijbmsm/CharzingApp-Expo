import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AccidentRepairHistory } from '../../../services/firebaseService';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { AccidentRepairDetailModal } from '../modals/AccidentRepairDetailModal';

interface AccidentRepairSectionProps {
  data?: AccidentRepairHistory;
}

export const AccidentRepairSection: React.FC<AccidentRepairSectionProps> = ({ data }) => {
  const [modalVisible, setModalVisible] = useState(false);

  // 사고 이력 개수 계산
  const accidentCount = data?.records?.length || 0;
  const hasAccidents = accidentCount > 0;

  return (
    <View style={styles.section}>
      {/* 섹션 제목 */}
      <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
        사고/수리 이력
      </Text>

      {/* 사고 이력 */}
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
          사고 이력
        </Text>
        <Text
          style={[
            styles.infoValue,
            accidentCount > 0 ? styles.infoNormal : styles.infoGood,
            convertToLineSeedFont(styles.infoValue),
          ]}
        >
          {accidentCount > 0 ? `${accidentCount}회` : '없음'}
        </Text>
      </View>

      {/* 자세히 보기 버튼 */}
      {hasAccidents && (
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
      <AccidentRepairDetailModal
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
