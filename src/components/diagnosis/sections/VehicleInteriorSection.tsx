import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VehicleInteriorInspection, MajorDeviceItem } from '../../../services/firebaseService';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { ImageSliderModal, ImageSliderModalData } from '../ImageSliderModal';

interface VehicleInteriorSectionProps {
  data?: VehicleInteriorInspection;
}

// 항목명 매핑
const interiorItemNameMap: Record<string, string> = {
  driverSeat: '운전석',
  passengerSeat: '동승석',
  driverRearSeat: '운전석 뒷자리',
  passengerRearSeat: '동승석 뒷자리',
  ceiling: '천장',
  interiorSmell: '실내 냄새',
};

const airconMotorItemNameMap: Record<string, string> = {
  airconStatus: '에어컨 작동 상태 및 냄새',
  wiperMotor: '와이퍼 모터',
  driverWindowMotor: '운전석 윈도우 모터',
  driverRearWindowMotor: '운전석 뒷자리 윈도우 모터',
  passengerRearWindowMotor: '동승석 뒷자리 윈도우 모터',
  passengerWindowMotor: '동승석 윈도우 모터',
};

const optionsItemNameMap: Record<string, string> = {
  optionMatch: '옵션 내역 일치 여부',
};

const lightingItemNameMap: Record<string, string> = {
  driverHeadlamp: '운전석 헤드램프/안개등',
  passengerHeadlamp: '동승석 헤드램프/안개등',
  driverTaillamp: '운전석 테일램프',
  passengerTaillamp: '동승석 테일램프',
  licensePlateLamp: '번호판등',
  interiorLamp: '실내등 앞/뒤',
  vanityMirrorLamp: '화장등',
};

const glassItemNameMap: Record<string, string> = {
  front: '전면',
  driverFront: '운전석 앞',
  driverRear: '운전석 뒤',
  rear: '후면',
  passengerRear: '동승석 뒤',
  passengerFront: '동승석 앞',
};

export const VehicleInteriorSection: React.FC<VehicleInteriorSectionProps> = ({ data }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<ImageSliderModalData | null>(null);

  if (!data || (!data.interior && !data.airconMotor && !data.options && !data.lighting && !data.glass)) {
    return null;
  }

  const openDetailModal = (data: ImageSliderModalData) => {
    setModalData(data);
    setModalVisible(true);
  };

  const closeDetailModal = () => {
    setModalVisible(false);
    setModalData(null);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderItem = (key: string, item: MajorDeviceItem, itemNameMap: Record<string, string>) => {
    const displayName = itemNameMap[key] || item.name;
    const isGood = item.status === 'good';
    const hasProblem = item.status === 'problem';

    return (
      <View key={key} style={styles.itemContainer}>
        {/* 항목명 및 상태 */}
        <View style={styles.itemHeader}>
          <View style={styles.itemLabelContainer}>
            <Text style={[styles.itemLabel, convertToLineSeedFont(styles.itemLabel)]}>
              {displayName}
            </Text>
            {hasProblem && item.imageUris && item.imageUris.length > 0 && (
              <TouchableOpacity
                style={styles.detailButton}
                onPress={() => openDetailModal({
                  title: displayName,
                  issueDescription: item.issueDescription,
                  imageUris: item.imageUris,
                })}
                activeOpacity={0.7}
              >
                <Text style={[styles.detailButtonText, convertToLineSeedFont(styles.detailButtonText)]}>
                  자세히 보기
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text
            style={[
              styles.itemStatus,
              isGood && styles.statusGood,
              hasProblem && styles.statusProblem,
              convertToLineSeedFont(styles.itemStatus),
            ]}
          >
            {isGood ? '양호' : hasProblem ? '문제 있음' : '-'}
          </Text>
        </View>
      </View>
    );
  };

  const renderSubSection = (
    title: string,
    sectionId: string,
    items?: Record<string, MajorDeviceItem>,
    itemNameMap?: Record<string, string>
  ) => {
    if (!items || Object.keys(items).length === 0 || !itemNameMap) {
      return null;
    }

    const isExpanded = expandedSections.has(sectionId);

    return (
      <View style={[styles.subSection, isExpanded && styles.subSectionExpanded]}>
        <TouchableOpacity
          style={styles.subSectionHeader}
          onPress={() => toggleSection(sectionId)}
          activeOpacity={0.7}
        >
          <Text style={[styles.subSectionTitle, convertToLineSeedFont(styles.subSectionTitle)]}>
            {title}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.itemsList}>
            {Object.entries(items).map(([key, item]) =>
              item ? renderItem(key, item, itemNameMap) : null
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      {/* 섹션 제목 */}
      <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
        차량 실내 점검
      </Text>

      {/* 내장재 상태 */}
      {renderSubSection('내장재 상태', 'interior', data.interior, interiorItemNameMap)}

      {/* 에어컨 및 모터 */}
      {renderSubSection('에어컨 및 모터', 'airconMotor', data.airconMotor, airconMotorItemNameMap)}

      {/* 옵션 및 기능 */}
      {renderSubSection('옵션 및 기능', 'options', data.options, optionsItemNameMap)}

      {/* 등화장치 */}
      {renderSubSection('등화장치', 'lighting', data.lighting, lightingItemNameMap)}

      {/* 유리 */}
      {renderSubSection('유리', 'glass', data.glass, glassItemNameMap)}

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 이미지 슬라이더 모달 */}
      <ImageSliderModal
        visible={modalVisible}
        data={modalData}
        onClose={closeDetailModal}
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
    marginBottom: 16,
  },
  subSection: {
    marginBottom: 8,
  },
  subSectionExpanded: {
    marginBottom: 20,
  },
  subSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  itemsList: {
    gap: 16,
    paddingTop: 12,
  },
  itemContainer: {
    gap: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
  },
  itemStatus: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    marginLeft: 12,
  },
  statusGood: {
    color: '#06B6D4', // 초록
  },
  statusProblem: {
    color: '#EF4444', // 빨강
  },
  itemLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  detailButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  detailButtonText: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 24,
  },
});
