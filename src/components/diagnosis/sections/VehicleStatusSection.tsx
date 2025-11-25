import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { VehicleStatusDetailModal } from '../modals/VehicleStatusDetailModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VehicleStatusSectionProps {
  isVinVerified?: boolean; // 차대번호 동일성 확인
  hasNoIllegalModification?: boolean; // 불법 구조변경 없음
  hasNoFloodDamage?: boolean; // 침수 이력 없음
  dashboardStatus?: 'good' | 'problem'; // 계기판 상태 (양호/문제있음)
  dashboardIssueDescription?: string; // 계기판 문제 설명
  vehicleVinImageUris?: string[]; // 차대번호 사진
  dashboardImageUris?: string[]; // 계기판 사진
}

export const VehicleStatusSection: React.FC<VehicleStatusSectionProps> = ({
  isVinVerified,
  hasNoIllegalModification,
  hasNoFloodDamage,
  dashboardStatus,
  dashboardIssueDescription,
  vehicleVinImageUris,
  dashboardImageUris,
}) => {
  const [vinDetailVisible, setVinDetailVisible] = useState(false);
  const [dashboardDetailVisible, setDashboardDetailVisible] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenImages, setFullscreenImages] = useState<string[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  // 모든 필드가 undefined인 경우 null 반환
  if (
    isVinVerified === undefined &&
    hasNoIllegalModification === undefined &&
    hasNoFloodDamage === undefined &&
    !dashboardStatus &&
    !dashboardIssueDescription &&
    (!vehicleVinImageUris || vehicleVinImageUris.length === 0) &&
    (!dashboardImageUris || dashboardImageUris.length === 0)
  ) {
    return null;
  }

  const handleImagePress = (images: string[], index: number) => {
    setFullscreenImages(images);
    setFullscreenIndex(index);
    setFullscreenVisible(true);
  };

  const closeFullscreen = () => {
    setFullscreenVisible(false);
  };

  return (
    <View style={styles.section}>
      {/* 섹션 제목 */}
      <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
        차량 상태 확인
      </Text>

      {/* 확인 항목들 */}
      <View style={styles.checkList}>
        {/* 차대번호 동일성 확인 */}
        {isVinVerified !== undefined && (
          <View style={styles.checkItem}>
            <Text style={[styles.checkLabel, convertToLineSeedFont(styles.checkLabel)]}>
              차대번호 동일성 확인
            </Text>
            <View style={styles.checkItemRight}>
              {vehicleVinImageUris && vehicleVinImageUris.length > 0 && (
                <TouchableOpacity
                  style={styles.viewImageButton}
                  onPress={() => setVinDetailVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.viewImageButtonText, convertToLineSeedFont(styles.viewImageButtonText)]}>
                    자세히 보기
                  </Text>
                </TouchableOpacity>
              )}
              <Ionicons
                name={isVinVerified ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={isVinVerified ? '#06B6D4' : '#EF4444'}
              />
            </View>
          </View>
        )}

        {/* 불법 구조변경 없음 */}
        {hasNoIllegalModification !== undefined && (
          <View style={styles.checkItem}>
            <Text style={[styles.checkLabel, convertToLineSeedFont(styles.checkLabel)]}>
              불법 구조변경 없음
            </Text>
            <Ionicons
              name={hasNoIllegalModification ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={hasNoIllegalModification ? '#06B6D4' : '#EF4444'}
            />
          </View>
        )}

        {/* 침수 이력 없음 */}
        {hasNoFloodDamage !== undefined && (
          <View style={styles.checkItem}>
            <Text style={[styles.checkLabel, convertToLineSeedFont(styles.checkLabel)]}>
              침수 이력 없음
            </Text>
            <Ionicons
              name={hasNoFloodDamage ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={hasNoFloodDamage ? '#06B6D4' : '#EF4444'}
            />
          </View>
        )}
      </View>

      {/* 계기판 상태 */}
      {(dashboardStatus || (dashboardImageUris && dashboardImageUris.length > 0)) && (
        <View style={styles.dashboardSection}>
          <View style={styles.checkItem}>
            <Text style={[styles.checkLabel, convertToLineSeedFont(styles.checkLabel)]}>
              계기판 상태
            </Text>
            <View style={styles.checkItemRight}>
              {dashboardImageUris && dashboardImageUris.length > 0 && (
                <TouchableOpacity
                  style={styles.viewImageButton}
                  onPress={() => setDashboardDetailVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.viewImageButtonText, convertToLineSeedFont(styles.viewImageButtonText)]}>
                    자세히 보기
                  </Text>
                </TouchableOpacity>
              )}
              {dashboardStatus && (
                <Ionicons
                  name={dashboardStatus === 'good' ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={dashboardStatus === 'good' ? '#06B6D4' : '#EF4444'}
                />
              )}
            </View>
          </View>
        </View>
      )}

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 차대번호 상세 모달 */}
      <VehicleStatusDetailModal
        visible={vinDetailVisible}
        onClose={() => setVinDetailVisible(false)}
        title="차대번호 및 상태 확인"
        images={vehicleVinImageUris || []}
        imageLabel="차대번호 사진"
        statusItems={[
          ...(isVinVerified !== undefined ? [{
            label: '차대번호 동일성 확인',
            value: isVinVerified ? '확인' : '불일치',
            isGood: isVinVerified,
          }] : []),
          ...(hasNoIllegalModification !== undefined ? [{
            label: '불법 구조변경',
            value: hasNoIllegalModification ? '없음' : '발견',
            isGood: hasNoIllegalModification,
          }] : []),
          ...(hasNoFloodDamage !== undefined ? [{
            label: '침수 이력',
            value: hasNoFloodDamage ? '없음' : '발견',
            isGood: hasNoFloodDamage,
          }] : []),
        ]}
      />

      {/* 계기판 상세 모달 */}
      <VehicleStatusDetailModal
        visible={dashboardDetailVisible}
        onClose={() => setDashboardDetailVisible(false)}
        title="계기판 상태"
        images={dashboardImageUris || []}
        imageLabel="계기판 사진"
        statusItems={dashboardStatus ? [{
          label: '계기판 상태',
          value: dashboardStatus === 'good' ? '양호' : '문제 있음',
          isGood: dashboardStatus === 'good',
        }] : []}
      />

      {/* 전체화면 이미지 뷰어 (커스텀 오버레이) */}
      {fullscreenVisible && (
        <View style={styles.fullscreenOverlay}>
          {/* 배경 (터치 시 닫기) */}
          <Pressable style={styles.fullscreenBackdrop} onPress={closeFullscreen} />

          {/* 닫기 버튼 */}
          <TouchableOpacity style={styles.fullscreenCloseButton} onPress={closeFullscreen}>
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          {/* 이미지 슬라이더 */}
          {fullscreenImages.length > 0 && (
            <FlatList
              data={fullscreenImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={fullscreenIndex < fullscreenImages.length ? fullscreenIndex : 0}
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              keyExtractor={(item, index) => `fullscreen-${index}`}
              renderItem={({ item }) => (
                <View style={styles.fullscreenImageContainer}>
                  <Image source={{ uri: item }} style={styles.fullscreenImage} resizeMode="contain" />
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  checkList: {
    gap: 12,
  },
  checkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkLabel: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  checkItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  dashboardSection: {
    marginTop: 12,
  },
  dashboardIssue: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    marginLeft: 0,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
  },
  // 커스텀 전체화면 오버레이
  fullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100000,
    padding: 8,
  },
  fullscreenImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
