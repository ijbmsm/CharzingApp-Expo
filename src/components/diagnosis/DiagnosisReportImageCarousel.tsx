import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { convertToLineSeedFont } from '../../styles/fonts';
import { VehicleDiagnosisReport } from '../../services/firebaseService';
import { getAllImagesInOrder, ImageItem } from './utils/imageCollector';

interface DiagnosisReportImageCarouselProps {
  report: VehicleDiagnosisReport;
  animationDelay?: number;
  onBackPress?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = 400; // 고정 높이

export const DiagnosisReportImageCarousel: React.FC<DiagnosisReportImageCarouselProps> = ({
  report,
  animationDelay = 0,
  onBackPress,
}) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // 모든 이미지 수집
  const images = getAllImagesInOrder(report);

  // 이미지가 없으면 렌더링하지 않음
  if (images.length === 0) return null;

  // 스크롤 이벤트 핸들러
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  // 이미지 터치 핸들러
  const handleImagePress = (image: ImageItem) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  // 이미지 렌더링
  const renderImage = ({ item }: { item: ImageItem }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => handleImagePress(item)}
      activeOpacity={0.95}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.carouselImage}
        resizeMode="cover"
      />

      {/* 라벨 오버레이 (이미지 하단) */}
      <View style={styles.labelOverlay}>
        <View style={styles.labelContent}>
          <Text style={[styles.imageLabel, convertToLineSeedFont(styles.imageLabel)]}>
            {item.label}
          </Text>
          {item.problemDescription && (
            <Text
              style={[styles.problemDescription, convertToLineSeedFont(styles.problemDescription)]}
              numberOfLines={2}
            >
              {item.problemDescription}
            </Text>
          )}
        </View>

        {/* 우측 인디케이터 영역 */}
        <View style={styles.rightIndicators}>
          {/* 페이지 인디케이터 */}
          <Text style={[styles.pageText, convertToLineSeedFont(styles.pageText)]}>
            {currentIndex + 1} / {images.length}
          </Text>

          {/* 문제 배지 */}
          {item.hasProblem && (
            <View style={styles.problemBadgeSmall}>
              <Ionicons name="warning" size={12} color="#FFFFFF" />
              <Text style={[styles.problemBadgeTextSmall, convertToLineSeedFont(styles.problemBadgeTextSmall)]}>
                문제
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Animatable.View
        animation="fadeIn"
        duration={400}
        delay={animationDelay}
        style={styles.container}
      >
        {/* 뒤로가기 버튼 */}
        {onBackPress && (
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 8 }]}
            onPress={onBackPress}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* 이미지 슬라이더 */}
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImage}
          keyExtractor={(item, index) => `${item.uri}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={SCREEN_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
          getItemLayout={(data, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          contentContainerStyle={styles.flatListContent}
        />
      </Animatable.View>

      {/* 전체화면 이미지 뷰어 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={closeModal}
            activeOpacity={1}
          />

          <View style={styles.modalContent}>
            {/* 닫기 버튼 */}
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close-circle" size={40} color="#FFFFFF" />
            </TouchableOpacity>

            {/* 이미지 */}
            {selectedImage && (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  flatListContent: {
    // 여백 없음
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#000000',
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 라벨 오버레이 (이미지 하단)
  labelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContent: {
    flex: 1,
    marginRight: 12,
  },
  imageLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  problemDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  rightIndicators: {
    alignItems: 'flex-end',
    gap: 6,
  },
  pageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  problemBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  problemBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '70%',
  },
});
