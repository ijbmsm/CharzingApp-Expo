import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VehicleUndercarriageInspection, MajorDeviceItem } from '../../../services/firebaseService';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { ImageSliderModal, ImageSliderModalData } from '../ImageSliderModal';

interface VehicleUndercarriageSectionProps {
  data?: VehicleUndercarriageInspection;
}

// 위치 매핑
const suspensionLocationMap: Record<string, string> = {
  driverFrontWheel: '운전석 앞 바퀴',
  driverRearWheel: '운전석 뒤 바퀴',
  passengerRearWheel: '동승석 뒤 바퀴',
  passengerFrontWheel: '동승석 앞 바퀴',
};

const batteryPackLocationMap: Record<string, string> = {
  front: '앞',
  leftSide: '좌측 (운전석)',
  rear: '뒤',
  rightSide: '우측 (동승석)',
};

// 조향/제동 항목명 매핑
const steeringItemNameMap: Record<string, string> = {
  powerSteeringOilLeak: '동력조향 작동 오일 누유',
  steeringGear: '스티어링 기어',
  steeringPump: '스티어링 펌프',
  tierodEndBallJoint: '타이로드엔드 및 볼 조인트',
};

const brakingItemNameMap: Record<string, string> = {
  brakeOilLevel: '브레이크 오일 유량 상태',
  brakeOilLeak: '브레이크 오일 누유',
  boosterCondition: '배력장치 상태',
};

export const VehicleUndercarriageSection: React.FC<VehicleUndercarriageSectionProps> = ({ data }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<ImageSliderModalData | null>(null);

  if (!data || (!data.suspensionArms && !data.underBatteryPack && !data.steering && !data.braking)) {
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

  // 이미지 항목 렌더링 (서스펜션, 배터리팩)
  const renderImageItem = (key: string, imageUri: string | undefined, locationMap: Record<string, string>) => {
    if (!imageUri) return null;

    const displayName = locationMap[key] || key;

    return (
      <View key={key} style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemLabel, convertToLineSeedFont(styles.itemLabel)]}>
            {displayName}
          </Text>
          <TouchableOpacity
            style={styles.viewImageButton}
            onPress={() => openDetailModal({
              title: displayName,
              imageUris: [imageUri],
            })}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewImageButtonText, convertToLineSeedFont(styles.viewImageButtonText)]}>
              자세히 보기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // MajorDeviceItem 렌더링 (조향, 제동)
  const renderDeviceItem = (key: string, item: MajorDeviceItem, itemNameMap: Record<string, string>) => {
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
    renderContent: () => React.ReactNode
  ) => {
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
            {renderContent()}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      {/* 섹션 제목 */}
      <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
        차량 하부 점검
      </Text>

      {/* 서스펜션 암 및 링크 구조물 */}
      {data.suspensionArms && Object.values(data.suspensionArms).some(Boolean) && renderSubSection(
        '서스펜션 암 및 링크 구조물',
        'suspensionArms',
        () => Object.entries(data.suspensionArms!).map(([key, imageUri]) =>
          renderImageItem(key, imageUri, suspensionLocationMap)
        )
      )}

      {/* 하부 배터리 팩 상태 */}
      {data.underBatteryPack && Object.values(data.underBatteryPack).some(Boolean) && renderSubSection(
        '하부 배터리 팩 상태',
        'underBatteryPack',
        () => Object.entries(data.underBatteryPack!).map(([key, imageUri]) =>
          renderImageItem(key, imageUri, batteryPackLocationMap)
        )
      )}

      {/* 조향 장치 */}
      {data.steering && Object.keys(data.steering).length > 0 && renderSubSection(
        '조향 장치',
        'steering',
        () => Object.entries(data.steering!).map(([key, item]) =>
          item ? renderDeviceItem(key, item, steeringItemNameMap) : null
        )
      )}

      {/* 제동 장치 */}
      {data.braking && Object.keys(data.braking).length > 0 && renderSubSection(
        '제동 장치',
        'braking',
        () => Object.entries(data.braking!).map(([key, item]) =>
          item ? renderDeviceItem(key, item, brakingItemNameMap) : null
        )
      )}

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
  itemLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
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
  viewImageButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  viewImageButtonText: {
    fontSize: 12,
    color: '#6B7280',
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
