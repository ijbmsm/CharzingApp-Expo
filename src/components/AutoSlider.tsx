import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

interface SlideData {
  id: number;
  title: string;
  description: string;
  backgroundImage: any;
}

const slides: SlideData[] = [
  {
    id: 1,
    title: 'Charzing 서비스 소개',
    description: '전기차 배터리 진단 전문 서비스',
    backgroundImage: require('../assets/images/etc/253552_415010_1843.jpg'),
  },
  {
    id: 2,
    title: '전문가 진단',
    description: '인증받은 전문가의 정확한 배터리 진단',
    backgroundImage: require('../assets/images/etc/muscular-car-service-worker-repairing-vehicle_146671-19605.jpg'),
  },
  {
    id: 3,
    title: '상세한 리포트',
    description: '진단 후 상세한 배터리 상태 리포트 제공',
    backgroundImage: require('../assets/images/etc/images.jpeg'),
  },
];

const { width: screenWidth } = Dimensions.get('window');
const SLIDE_WIDTH = screenWidth; // 전체 너비 사용

const AutoSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      setCurrentIndex(nextIndex);
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: nextIndex * SLIDE_WIDTH,
          animated: true,
        });
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SLIDE_WIDTH);
    setCurrentIndex(index);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * SLIDE_WIDTH,
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {slides.map((slide, _index) => (
          <ImageBackground
            key={slide.id}
            source={slide.backgroundImage}
            style={styles.slide}
            imageStyle={styles.slideImage}
          >
            <View style={styles.overlay}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>

      {/* 인디케이터 */}
      <View style={styles.indicatorContainer}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.indicator,
              index === currentIndex ? styles.activeIndicator : styles.inactiveIndicator,
            ]}
            onPress={() => goToSlide(index)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 4/3, // 4:3 비율
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    width: SLIDE_WIDTH,
    height: SLIDE_WIDTH * (3/4), // 4:3 비율에 맞는 높이 명시
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 0,
  },
  slideImage: {
    borderRadius: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 반투명 어두운 오버레이
    paddingHorizontal: 20,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.2 }],
  },
  inactiveIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ scale: 1 }],
  },
});

export default AutoSlider;