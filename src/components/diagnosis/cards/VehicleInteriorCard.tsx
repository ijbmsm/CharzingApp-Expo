import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { VehicleInteriorInspection, MajorDeviceItem } from '../../../services/firebaseService';

interface VehicleInteriorCardProps {
  data?: VehicleInteriorInspection;
  animationDelay?: number;
}

interface SubsectionConfig {
  key: keyof VehicleInteriorInspection;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  items: { key: string; label: string }[];
}

export const VehicleInteriorCard: React.FC<VehicleInteriorCardProps> = ({
  data,
  animationDelay = 0,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 데이터가 없으면 렌더링하지 않음
  if (!data) return null;

  // Subsection 설정
  const subsections: SubsectionConfig[] = [
    {
      key: 'interior',
      title: '내장재 상태',
      icon: 'car-sport-outline',
      iconColor: '#3B82F6',
      items: [
        { key: 'driverSeat', label: '운전석' },
        { key: 'passengerSeat', label: '동승석' },
        { key: 'driverRearSeat', label: '운전석 뒷자리' },
        { key: 'passengerRearSeat', label: '동승석 뒷자리' },
        { key: 'ceiling', label: '천장' },
        { key: 'interiorSmell', label: '실내 냄새' },
      ],
    },
    {
      key: 'airconMotor',
      title: '에어컨 및 모터',
      icon: 'snow-outline',
      iconColor: '#06B6D4',
      items: [
        { key: 'airconStatus', label: '에어컨 작동 상태 및 냄새' },
        { key: 'wiperMotor', label: '와이퍼 모터' },
        { key: 'driverWindowMotor', label: '운전석 윈도우 모터' },
        { key: 'driverRearWindowMotor', label: '운전석 뒷자리 윈도우 모터' },
        { key: 'passengerRearWindowMotor', label: '동승석 뒷자리 윈도우 모터' },
        { key: 'passengerWindowMotor', label: '동승석 윈도우 모터' },
      ],
    },
    {
      key: 'options',
      title: '옵션 및 기능',
      icon: 'settings-outline',
      iconColor: '#8B5CF6',
      items: [{ key: 'optionMatch', label: '옵션 내역 일치 여부' }],
    },
    {
      key: 'lighting',
      title: '등화장치',
      icon: 'bulb-outline',
      iconColor: '#F59E0B',
      items: [
        { key: 'driverHeadlamp', label: '운전석 헤드램프/안개등' },
        { key: 'passengerHeadlamp', label: '동승석 헤드램프/안개등' },
        { key: 'driverTaillamp', label: '운전석 테일램프' },
        { key: 'passengerTaillamp', label: '동승석 테일램프' },
        { key: 'licensePlateLamp', label: '번호판등' },
        { key: 'interiorLamp', label: '실내등 앞/뒤' },
        { key: 'vanityMirrorLamp', label: '화장등' },
      ],
    },
    {
      key: 'glass',
      title: '유리',
      icon: 'square-outline',
      iconColor: '#06B6D4',
      items: [
        { key: 'front', label: '전면' },
        { key: 'driverFront', label: '운전석 앞' },
        { key: 'driverRear', label: '운전석 뒤' },
        { key: 'rear', label: '후면' },
        { key: 'passengerRear', label: '동승석 뒤' },
        { key: 'passengerFront', label: '동승석 앞' },
      ],
    },
  ];

  // 상태 배지 색상
  const getStatusColor = (status?: 'good' | 'problem'): string => {
    if (!status) return '#9CA3AF';
    return status === 'good' ? '#06B6D4' : '#EF4444';
  };

  // 이미지 열기
  const openImageViewer = (imageUri: string) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  // 이미지 닫기
  const closeImageViewer = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  // 문제 있는 항목 수 계산
  const getProblemCount = () => {
    let count = 0;
    subsections.forEach((subsection) => {
      const subsectionData = data[subsection.key] as Record<string, MajorDeviceItem>;
      if (subsectionData) {
        subsection.items.forEach((item) => {
          const itemData = subsectionData[item.key];
          if (itemData && itemData.status === 'problem') {
            count++;
          }
        });
      }
    });
    return count;
  };

  const problemCount = getProblemCount();

  return (
    <>
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
              <Ionicons name="home-outline" size={24} color="#06B6D4" />
              <Text style={[styles.headerTitle, convertToLineSeedFont(styles.headerTitle)]}>
                차량 내부 검사
              </Text>
            </View>
            {problemCount > 0 && (
              <View style={styles.problemBadge}>
                <Text style={[styles.problemBadgeText, convertToLineSeedFont(styles.problemBadgeText)]}>
                  문제 {problemCount}건
                </Text>
              </View>
            )}
          </View>

          {/* Subsections */}
          {subsections.map((subsection, sectionIndex) => {
            const subsectionData = data[subsection.key] as Record<string, MajorDeviceItem>;
            if (!subsectionData) return null;

            return (
              <View
                key={subsection.key}
                style={[styles.subsection, sectionIndex > 0 && styles.subsectionWithBorder]}
              >
                {/* Subsection 헤더 */}
                <View style={styles.subsectionHeader}>
                  <Ionicons name={subsection.icon} size={18} color={subsection.iconColor} />
                  <Text style={[styles.subsectionTitle, convertToLineSeedFont(styles.subsectionTitle)]}>
                    {subsection.title}
                  </Text>
                </View>

                {/* 항목 목록 */}
                <View style={styles.itemsList}>
                  {subsection.items.map((item) => {
                    const itemData = subsectionData[item.key];
                    if (!itemData) return null;

                    return (
                      <View key={item.key} style={styles.inspectionItem}>
                        {/* 항목 정보 */}
                        <View style={styles.itemHeader}>
                          <Text style={[styles.itemLabel, convertToLineSeedFont(styles.itemLabel)]}>
                            {item.label}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(itemData.status) },
                            ]}
                          >
                            <Text
                              style={[styles.statusBadgeText, convertToLineSeedFont(styles.statusBadgeText)]}
                            >
                              {itemData.status === 'good' ? '양호' : itemData.status === 'problem' ? '문제' : '미검사'}
                            </Text>
                          </View>
                        </View>

                        {/* 문제 내용 */}
                        {itemData.issueDescription && (
                          <Text
                            style={[styles.issueDescription, convertToLineSeedFont(styles.issueDescription)]}
                          >
                            {itemData.issueDescription}
                          </Text>
                        )}

                        {/* 이미지 */}
                        {itemData.imageUris && itemData.imageUris.length > 0 && itemData.imageUris[0] && (
                          <TouchableOpacity
                            style={styles.imageContainer}
                            onPress={() => openImageViewer(itemData.imageUris![0]!)}
                            activeOpacity={0.8}
                          >
                            <Image
                              source={{ uri: itemData.imageUris![0] }}
                              style={styles.itemImage}
                              resizeMode="cover"
                            />
                            <View style={styles.imageOverlay}>
                              <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </LinearGradient>
      </Animatable.View>

      {/* 전체화면 이미지 뷰어 */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeImageViewer}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeImageViewer} activeOpacity={1} />
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeImageViewer}>
              <Ionicons name="close-circle" size={40} color="#FFFFFF" />
            </TouchableOpacity>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
            )}
          </View>
        </View>
      </Modal>
    </>
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
  problemBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  problemBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionWithBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  itemsList: {
    gap: 12,
  },
  inspectionItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  issueDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    zIndex: 10,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
