import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InspectionImageItem } from '../../../services/firebaseService';
import { convertToLineSeedFont } from '../../../styles/fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface InspectionImagesSectionProps {
  data?: InspectionImageItem[];
  additionalInfo?: string;
}

// 심각도별 색상
const getSeverityColor = (severity: string): string => {
  const normalizedSeverity = severity.toLowerCase();
  if (normalizedSeverity.includes('정상') || normalizedSeverity.includes('양호')) {
    return '#06B6D4'; // 초록
  }
  if (normalizedSeverity.includes('주의') || normalizedSeverity.includes('확인')) {
    return '#F59E0B'; // 주황
  }
  if (normalizedSeverity.includes('경고') || normalizedSeverity.includes('위험')) {
    return '#EF4444'; // 빨강
  }
  return '#6B7280'; // 회색 (기본)
};

export const InspectionImagesSection: React.FC<InspectionImagesSectionProps> = ({
  data,
  additionalInfo,
}) => {
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenImages, setFullscreenImages] = useState<string[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  if ((!data || data.length === 0) && !additionalInfo) {
    return null;
  }

  const handleImagePress = (imageUrl: string) => {
    setFullscreenImages([imageUrl]);
    setFullscreenIndex(0);
    setFullscreenVisible(true);
  };

  const closeFullscreen = () => {
    setFullscreenVisible(false);
  };

  return (
    <View style={styles.section}>
      {/* 섹션 제목 */}
      <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
        종합 차량 검사
      </Text>

      {/* 검사 이미지 목록 */}
      {data && data.length > 0 && (
        <View style={styles.imagesList}>
          {data.map((item) => (
            <View key={item.id} style={styles.imageCard}>
              {/* 이미지 */}
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={() => handleImagePress(item.imageUrl)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
                {/* 확대 아이콘 오버레이 */}
                <View style={styles.imageOverlay}>
                  <Ionicons name="expand" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* 이미지 정보 */}
              <View style={styles.imageInfo}>
                {/* 제목 및 심각도 */}
                <View style={styles.imageHeader}>
                  <Text style={[styles.imageTitle, convertToLineSeedFont(styles.imageTitle)]}>
                    {item.title || item.category}
                  </Text>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
                    <Text style={[styles.severityText, convertToLineSeedFont(styles.severityText)]}>
                      {item.severity}
                    </Text>
                  </View>
                </View>

                {/* 카테고리 및 위치 */}
                <View style={styles.metadataRow}>
                  {item.category && (
                    <View style={styles.metadata}>
                      <Ionicons name="folder-outline" size={14} color="#6B7280" />
                      <Text style={[styles.metadataText, convertToLineSeedFont(styles.metadataText)]}>
                        {item.category}
                      </Text>
                    </View>
                  )}
                  {item.location && (
                    <View style={styles.metadata}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={[styles.metadataText, convertToLineSeedFont(styles.metadataText)]}>
                        {item.location}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 설명 */}
                {item.description ? (
                  <Text style={[styles.description, convertToLineSeedFont(styles.description)]}>
                    {item.description}
                  </Text>
                ) : null}

                {/* 권장사항 */}
                {item.recommendations && item.recommendations.length > 0 && (
                  <View style={styles.recommendations}>
                    <Text style={[styles.recommendationsTitle, convertToLineSeedFont(styles.recommendationsTitle)]}>
                      권장사항
                    </Text>
                    {item.recommendations.map((rec, index) => (
                      <Text key={index} style={[styles.recommendationItem, convertToLineSeedFont(styles.recommendationItem)]}>
                        • {rec}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 추가 정보 */}
      {additionalInfo && (
        <View style={styles.additionalInfoContainer}>
          <Text style={[styles.additionalInfoTitle, convertToLineSeedFont(styles.additionalInfoTitle)]}>
            추가 정보
          </Text>
          <Text style={[styles.additionalInfoText, convertToLineSeedFont(styles.additionalInfoText)]}>
            {additionalInfo}
          </Text>
        </View>
      )}

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 전체화면 이미지 뷰어 (커스텀 오버레이) */}
      {fullscreenVisible && (
        <View style={styles.fullscreenOverlay}>
          {/* 배경 (터치 시 닫기) */}
          <Pressable style={styles.fullscreenBackdrop} onPress={closeFullscreen} />

          {/* 닫기 버튼 */}
          <TouchableOpacity style={styles.fullscreenCloseButton} onPress={closeFullscreen}>
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          {/* 이미지 */}
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  imagesList: {
    gap: 20,
  },
  imageCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 240,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageInfo: {
    padding: 16,
    gap: 12,
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 13,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  recommendations: {
    gap: 6,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  recommendationItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  additionalInfoContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 16,
  },
  additionalInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  additionalInfoText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 24,
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
