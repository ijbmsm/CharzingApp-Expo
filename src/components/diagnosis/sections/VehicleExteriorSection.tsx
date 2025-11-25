import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VehicleExteriorInspection, PaintThicknessInspection, TireAndWheelItem } from '../../../services/firebaseService';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { ImageSliderModal, ImageSliderModalData } from '../ImageSliderModal';

interface VehicleExteriorSectionProps {
  data?: VehicleExteriorInspection;
}

interface DetailModalData {
  title: string;
  thickness?: number;
  treadDepth?: number;
  notes?: string;
  issueDescription?: string;
  imageUris?: string[];
}

// 타이어 위치 매핑
const tirePositionMap: Record<string, string> = {
  driverFront: '운전석 앞',
  driverRear: '운전석 뒤',
  passengerRear: '동승석 뒤',
  passengerFront: '동승석 앞',
};

export const VehicleExteriorSection: React.FC<VehicleExteriorSectionProps> = ({ data }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<DetailModalData | null>(null);

  if (!data || (!data.bodyPanel?.length && !data.tiresAndWheels)) {
    return null;
  }

  const openDetailModal = (data: DetailModalData) => {
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

  const renderBodyPanelItem = (item: PaintThicknessInspection, index: number) => {
    const isGood = item.status === 'good';
    const hasProblem = item.status === 'problem';

    return (
      <View key={index} style={styles.itemContainer}>
        {/* 위치 및 상태 */}
        <View style={styles.itemHeader}>
          <View style={styles.itemLabelContainer}>
            <Text style={[styles.itemLabel, convertToLineSeedFont(styles.itemLabel)]}>
              {item.location}
            </Text>
            {hasProblem && (
              <TouchableOpacity
                style={styles.detailButton}
                onPress={() => openDetailModal({
                  title: item.location,
                  thickness: item.thickness,
                  notes: item.notes,
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
          {item.status && (
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
          )}
        </View>
      </View>
    );
  };

  const renderTireItem = (key: string, item: TireAndWheelItem) => {
    const isGood = item.wheelStatus === 'good';
    const hasProblem = item.wheelStatus === 'problem';
    const displayName = tirePositionMap[key] || key;

    return (
      <View key={key} style={styles.itemContainer}>
        {/* 위치 및 휠 상태 */}
        <View style={styles.itemHeader}>
          <View style={styles.itemLabelContainer}>
            <Text style={[styles.itemLabel, convertToLineSeedFont(styles.itemLabel)]}>
              {displayName}
            </Text>
            {hasProblem && (
              <TouchableOpacity
                style={styles.detailButton}
                onPress={() => openDetailModal({
                  title: displayName,
                  treadDepth: item.treadDepth,
                  issueDescription: item.wheelIssueDescription,
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
          {item.wheelStatus && (
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
          )}
        </View>
      </View>
    );
  };

  // ImageSliderModal용 데이터 변환
  const imageSliderData: ImageSliderModalData | null = modalData ? {
    title: modalData.title,
    issueDescription: modalData.notes || modalData.issueDescription,
    imageUris: modalData.imageUris,
  } : null;

  return (
    <View style={styles.section}>
      {/* 섹션 제목 */}
      <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
        차량 외부 점검
      </Text>

      {/* 외판 수리/교체 확인 및 도막 측정 */}
      {data.bodyPanel && data.bodyPanel.length > 0 && (
        <View style={[styles.subSection, expandedSections.has('bodyPanel') && styles.subSectionExpanded]}>
          <TouchableOpacity
            style={styles.subSectionHeader}
            onPress={() => toggleSection('bodyPanel')}
            activeOpacity={0.7}
          >
            <Text style={[styles.subSectionTitle, convertToLineSeedFont(styles.subSectionTitle)]}>
              외판 수리/교체 확인 및 도막 측정
            </Text>
            <Ionicons
              name={expandedSections.has('bodyPanel') ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
          {expandedSections.has('bodyPanel') && (
            <View style={styles.itemsList}>
              {data.bodyPanel.map((item, index) => renderBodyPanelItem(item, index))}
            </View>
          )}
        </View>
      )}

      {/* 타이어 및 휠 검사 */}
      {data.tiresAndWheels && Object.keys(data.tiresAndWheels).length > 0 && (
        <View style={[styles.subSection, expandedSections.has('tiresAndWheels') && styles.subSectionExpanded]}>
          <TouchableOpacity
            style={styles.subSectionHeader}
            onPress={() => toggleSection('tiresAndWheels')}
            activeOpacity={0.7}
          >
            <Text style={[styles.subSectionTitle, convertToLineSeedFont(styles.subSectionTitle)]}>
              타이어 및 휠 검사
            </Text>
            <Ionicons
              name={expandedSections.has('tiresAndWheels') ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
          {expandedSections.has('tiresAndWheels') && (
            <View style={styles.itemsList}>
              {Object.entries(data.tiresAndWheels).map(([key, item]) =>
                item && (item.treadDepth !== undefined || item.wheelStatus !== undefined)
                  ? renderTireItem(key, item)
                  : null
              )}
            </View>
          )}
        </View>
      )}

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 이미지 슬라이더 모달 */}
      <ImageSliderModal
        visible={modalVisible}
        data={imageSliderData}
        onClose={closeDetailModal}
      >
        {/* 추가 측정 정보 */}
        {modalData?.thickness !== undefined && (
          <Text style={[styles.modalInfoText, convertToLineSeedFont(styles.modalInfoText)]}>
            도막 두께: {modalData.thickness}μm
          </Text>
        )}
        {modalData?.treadDepth !== undefined && (
          <Text style={[styles.modalInfoText, convertToLineSeedFont(styles.modalInfoText)]}>
            트레드 깊이: {modalData.treadDepth}mm
          </Text>
        )}
      </ImageSliderModal>
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
  modalInfoText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 24,
  },
});
