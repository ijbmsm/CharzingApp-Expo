import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as ImageManipulator from 'expo-image-manipulator';

interface FullScreenImageViewerProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onSave?: (editedUri: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  visible,
  imageUri,
  onClose,
  onSave,
}) => {
  const [currentUri, setCurrentUri] = useState(imageUri);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pinch zoom values - using React Native Animated API
  const scale = useRef(new Animated.Value(1)).current;
  const savedScaleRef = useRef(1);

  // Reset when modal opens
  React.useEffect(() => {
    if (visible && imageUri) {
      setCurrentUri(imageUri);
      scale.setValue(1);
      savedScaleRef.current = 1;
    }
  }, [visible, imageUri]);

  // Pinch gesture handler
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScaleRef.current * event.scale;
      scale.setValue(newScale);
    })
    .onEnd(() => {
      // Get current scale value
      scale.stopAnimation((value) => {
        savedScaleRef.current = value;

        // Limit zoom range
        if (value < 1) {
          Animated.timing(scale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
          savedScaleRef.current = 1;
        } else if (value > 5) {
          Animated.timing(scale, {
            toValue: 5,
            duration: 200,
            useNativeDriver: true,
          }).start();
          savedScaleRef.current = 5;
        }
      });
    });

  const animatedStyle = {
    transform: [{ scale }],
  };

  // Rotate image
  const handleRotate = async (direction: 'left' | 'right') => {
    if (!currentUri) return;

    try {
      setIsProcessing(true);

      const manipResult = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ rotate: direction === 'left' ? -90 : 90 }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCurrentUri(manipResult.uri);
      setIsProcessing(false);
    } catch (error) {
      console.error('회전 에러:', error);
      Alert.alert('오류', '이미지 회전에 실패했습니다.');
      setIsProcessing(false);
    }
  };

  // Flip image
  const handleFlip = async (direction: 'horizontal' | 'vertical') => {
    if (!currentUri) return;

    try {
      setIsProcessing(true);

      const manipResult = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ flip: direction === 'horizontal' ? ImageManipulator.FlipType.Horizontal : ImageManipulator.FlipType.Vertical }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCurrentUri(manipResult.uri);
      setIsProcessing(false);
    } catch (error) {
      console.error('반전 에러:', error);
      Alert.alert('오류', '이미지 반전에 실패했습니다.');
      setIsProcessing(false);
    }
  };

  // Crop image (center crop to 80%)
  const handleCrop = async () => {
    if (!currentUri) return;

    try {
      setIsProcessing(true);

      // Get image info first
      const result = await ImageManipulator.manipulateAsync(currentUri, [], {});

      const cropWidth = result.width * 0.8;
      const cropHeight = result.height * 0.8;
      const originX = result.width * 0.1;
      const originY = result.height * 0.1;

      const manipResult = await ImageManipulator.manipulateAsync(
        currentUri,
        [
          {
            crop: {
              originX: originX,
              originY: originY,
              width: cropWidth,
              height: cropHeight,
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCurrentUri(manipResult.uri);
      setIsProcessing(false);
    } catch (error) {
      console.error('크롭 에러:', error);
      Alert.alert('오류', '이미지 자르기에 실패했습니다.');
      setIsProcessing(false);
    }
  };

  // Reset zoom
  const handleResetZoom = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    savedScaleRef.current = 1;
  };

  // Save edited image
  const handleSave = () => {
    if (onSave && currentUri) {
      onSave(currentUri);
    }
    onClose();
  };

  if (!imageUri) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.gestureContainer}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>이미지 편집</Text>
            {onSave ? (
              <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerButton} />
            )}
          </View>

          {/* Image viewer with pinch zoom */}
          <View style={styles.imageContainer}>
            {currentUri && (
              <GestureDetector gesture={pinchGesture}>
                <Animated.View style={animatedStyle}>
                  <Image
                    source={{ uri: currentUri }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </Animated.View>
              </GestureDetector>
            )}
          </View>

          {/* Bottom toolbar */}
          <View style={styles.toolbar}>
            {/* Rotate left */}
            <TouchableOpacity
              onPress={() => handleRotate('left')}
              style={styles.toolButton}
              disabled={isProcessing}
            >
              <Ionicons name="arrow-undo-outline" size={24} color="#FFFFFF" />
              <Text style={styles.toolButtonText}>좌회전</Text>
            </TouchableOpacity>

            {/* Rotate right */}
            <TouchableOpacity
              onPress={() => handleRotate('right')}
              style={styles.toolButton}
              disabled={isProcessing}
            >
              <Ionicons name="arrow-redo-outline" size={24} color="#FFFFFF" />
              <Text style={styles.toolButtonText}>우회전</Text>
            </TouchableOpacity>

            {/* Flip horizontal */}
            <TouchableOpacity
              onPress={() => handleFlip('horizontal')}
              style={styles.toolButton}
              disabled={isProcessing}
            >
              <Ionicons name="swap-horizontal-outline" size={24} color="#FFFFFF" />
              <Text style={styles.toolButtonText}>좌우반전</Text>
            </TouchableOpacity>

            {/* Crop */}
            <TouchableOpacity
              onPress={handleCrop}
              style={styles.toolButton}
              disabled={isProcessing}
            >
              <Ionicons name="crop-outline" size={24} color="#FFFFFF" />
              <Text style={styles.toolButtonText}>자르기</Text>
            </TouchableOpacity>

            {/* Reset zoom */}
            <TouchableOpacity
              onPress={handleResetZoom}
              style={styles.toolButton}
              disabled={isProcessing}
            >
              <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
              <Text style={styles.toolButtonText}>확대 초기화</Text>
            </TouchableOpacity>
          </View>

          {/* Loading overlay */}
          {isProcessing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>처리 중...</Text>
            </View>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  gestureContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minWidth: 60,
  },
  toolButtonText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
  },
});

export default FullScreenImageViewer;
