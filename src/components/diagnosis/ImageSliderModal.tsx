import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { convertToLineSeedFont } from '../../styles/fonts';
import ImageViewing from 'react-native-image-viewing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ImageSliderModalData {
  title: string;
  issueDescription?: string;
  imageUris?: string[];
}

interface ImageSliderModalProps {
  visible: boolean;
  data: ImageSliderModalData | null;
  onClose: () => void;
  children?: React.ReactNode; // 추가 콘텐츠 (측정 정보 등)
}

/**
 * 이미지 슬라이더가 있는 모달 컴포넌트
 *
 * 기능:
 * - 이미지 슬라이더 (FlatList horizontal)
 * - Pagination dots
 * - 스켈레톤 로딩
 * - 전체화면 이미지 뷰어
 * - 문제 설명 표시
 */
export const ImageSliderModal: React.FC<ImageSliderModalProps> = ({
  visible,
  data,
  onClose,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<{ [key: number]: boolean }>({});
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentSlideIndex(index);
  };

  const handleImagePress = (index: number) => {
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  // 모달이 열릴 때마다 상태 초기화
  React.useEffect(() => {
    if (visible) {
      setCurrentSlideIndex(0);
      setImageLoaded({});
    }
  }, [visible]);

  return (
    <>
      {/* 메인 모달 */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={onClose}
        presentationStyle="fullScreen"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, convertToLineSeedFont(styles.modalTitle)]}>
              {data?.title}
            </Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* 이미지 슬라이더 */}
            {data?.imageUris && data.imageUris.length > 0 && (
              <View style={styles.imageSliderContainer}>
                <FlatList
                  ref={flatListRef}
                  data={data.imageUris}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  keyExtractor={(item, index) => `image-${index}`}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleImagePress(index)}
                      style={styles.imageWrapper}
                    >
                      {!imageLoaded[index] && (
                        <View style={styles.imageSkeleton} />
                      )}
                      <Image
                        source={{ uri: item }}
                        style={styles.sliderImage}
                        resizeMode="cover"
                        onLoad={() => {
                          setImageLoaded(prev => ({ ...prev, [index]: true }));
                        }}
                      />
                    </TouchableOpacity>
                  )}
                />
                {data.imageUris.length > 1 && (
                  <View style={styles.pagination}>
                    {data.imageUris.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.paginationDot,
                          index === currentSlideIndex && styles.paginationDotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* 추가 콘텐츠 (children) */}
            {children}

            {/* 문제 설명 */}
            {data?.issueDescription && (
              <Text style={[styles.modalDescriptionText, convertToLineSeedFont(styles.modalDescriptionText)]}>
                {data.issueDescription}
              </Text>
            )}
          </ScrollView>
        </View>

        {/* 전체화면 이미지 뷰어 */}
        <ImageViewing
          images={data?.imageUris?.map(uri => ({ uri })) || []}
          imageIndex={currentImageIndex}
          visible={imageViewerVisible}
          onRequestClose={() => setImageViewerVisible(false)}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  imageSliderContainer: {
    marginBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
  },
  sliderImage: {
    width: SCREEN_WIDTH - 32,
    height: 300,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  imageSkeleton: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    height: 300,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    zIndex: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  paginationDotActive: {
    backgroundColor: '#6B7280',
    width: 24,
  },
  modalDescriptionText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
});
