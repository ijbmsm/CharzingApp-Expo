import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VehiclePhotoInspection } from '../../adminWeb/index';
import FullScreenImageViewer from './FullScreenImageViewer';

interface VehiclePhotoBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: VehiclePhotoInspection) => void;
  initialData?: VehiclePhotoInspection;
}

const VehiclePhotoBottomSheet: React.FC<VehiclePhotoBottomSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  initialData,
}) => {
  const insets = useSafeAreaInsets();
  const [photoData, setPhotoData] = useState<VehiclePhotoInspection>({
    overallPhotos: {
      front: undefined,
      leftSide: undefined,
      rear: undefined,
      rightSide: undefined,
    },
    suspensionStructure: {
      driverFrontWheel: undefined,
      driverRearWheel: undefined,
      passengerRearWheel: undefined,
      passengerFrontWheel: undefined,
    },
    undercarriageBattery: {
      front: undefined,
      leftSide: undefined,
      rear: undefined,
      rightSide: undefined,
    },
  });

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageSection, setSelectedImageSection] = useState<'overallPhotos' | 'suspensionStructure' | 'undercarriageBattery' | null>(null);
  const [selectedImageField, setSelectedImageField] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      // visible이 true가 될 때마다 initialData 로드
      if (initialData) {
        setPhotoData(initialData);
      } else {
        // initialData가 없으면 빈 구조로 초기화
        setPhotoData({
          overallPhotos: {
            front: undefined,
            leftSide: undefined,
            rear: undefined,
            rightSide: undefined,
          },
          suspensionStructure: {
            driverFrontWheel: undefined,
            driverRearWheel: undefined,
            passengerRearWheel: undefined,
            passengerFrontWheel: undefined,
          },
          undercarriageBattery: {
            front: undefined,
            leftSide: undefined,
            rear: undefined,
            rightSide: undefined,
          },
        });
      }
    }
  }, [visible]);

  const handleImageSelect = async (
    section: 'overallPhotos' | 'suspensionStructure' | 'undercarriageBattery',
    field: string
  ) => {
    try {
      // 미디어 라이브러리 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      // 바로 갤러리에서 선택 (편집 없이 원본 그대로)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // 크롭 없이 원본 그대로
        quality: 1, // 최고 품질
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setPhotoData((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [field]: asset.uri,
          },
        }));
      }
    } catch (error) {
      console.error('이미지 선택 에러:', error);
      Alert.alert('오류', '이미지를 선택하는 중 문제가 발생했습니다.');
    }
  };

  const handleRemoveImage = (
    section: 'overallPhotos' | 'suspensionStructure' | 'undercarriageBattery',
    field: string
  ) => {
    setPhotoData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: undefined,
      },
    }));
  };

  // Open image viewer
  const handleImagePress = (
    section: 'overallPhotos' | 'suspensionStructure' | 'undercarriageBattery',
    field: string,
    imageUri: string
  ) => {
    setSelectedImageUri(imageUri);
    setSelectedImageSection(section);
    setSelectedImageField(field);
    setImageViewerVisible(true);
  };

  // Close image viewer
  const handleCloseImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageUri(null);
    setSelectedImageSection(null);
    setSelectedImageField(null);
  };

  // Save edited image
  const handleSaveEditedImage = (editedUri: string) => {
    if (selectedImageSection && selectedImageField) {
      setPhotoData((prev) => ({
        ...prev,
        [selectedImageSection]: {
          ...prev[selectedImageSection],
          [selectedImageField]: editedUri,
        },
      }));
    }
  };

  const handleConfirm = () => {
    onConfirm(photoData);
    onClose();
  };

  const renderPhotoItem = (
    section: 'overallPhotos' | 'suspensionStructure' | 'undercarriageBattery',
    field: string,
    label: string
  ) => {
    const imageUri = photoData[section][field as keyof typeof photoData[typeof section]];

    return (
      <View key={`${section}-${field}`} style={styles.photoItem}>
        <Text style={styles.photoLabel}>{label}</Text>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <TouchableOpacity
              onPress={() => handleImagePress(section, field, imageUri)}
              activeOpacity={0.9}
              style={styles.imageTouchable}
            >
              <Image source={{ uri: imageUri }} style={styles.image} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveImage(section, field)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={() => handleImageSelect(section, field)}
          >
            <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
            <Text style={styles.addPhotoText}>사진 추가</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === 'ios' ? 0 : insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>전체 사진 촬영</Text>
            <TouchableOpacity onPress={handleConfirm} activeOpacity={0.7}>
              <Text style={styles.saveButton}>저장</Text>
            </TouchableOpacity>
          </View>

          {/* 콘텐츠 */}
          <ScrollView style={styles.content}>
            {/* 1. 전체 사진 촬영 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="car-outline" size={20} color="#374151" />
                <Text style={styles.sectionTitle}>전체 사진 촬영</Text>
              </View>
              {renderPhotoItem('overallPhotos', 'front', '차량 앞')}
              {renderPhotoItem('overallPhotos', 'leftSide', '차량 좌측(운전석)')}
              {renderPhotoItem('overallPhotos', 'rear', '차량 뒤')}
              {renderPhotoItem('overallPhotos', 'rightSide', '차량 우측(동승석)')}
            </View>

            {/* 2. 차량 하부 - 서스펜션 암 및 링크 구조물 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="construct-outline" size={20} color="#374151" />
                <Text style={styles.sectionTitle}>차량 하부 - 서스펜션 암 및 링크 구조물</Text>
              </View>
              {renderPhotoItem('suspensionStructure', 'driverFrontWheel', '운전석 앞 바퀴')}
              {renderPhotoItem('suspensionStructure', 'driverRearWheel', '운전석 뒤 바퀴')}
              {renderPhotoItem('suspensionStructure', 'passengerRearWheel', '동승석 뒤 바퀴')}
              {renderPhotoItem('suspensionStructure', 'passengerFrontWheel', '동승석 앞 바퀴')}
            </View>

            {/* 3. 차량 하부 - 하부 배터리 팩 상태 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="battery-charging-outline" size={20} color="#374151" />
                <Text style={styles.sectionTitle}>차량 하부 - 하부 배터리 팩 상태</Text>
              </View>
              {renderPhotoItem('undercarriageBattery', 'front', '앞')}
              {renderPhotoItem('undercarriageBattery', 'leftSide', '좌측(운전석)')}
              {renderPhotoItem('undercarriageBattery', 'rear', '뒤')}
              {renderPhotoItem('undercarriageBattery', 'rightSide', '우측(동승석)')}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        visible={imageViewerVisible}
        imageUri={selectedImageUri}
        onClose={handleCloseImageViewer}
        onSave={handleSaveEditedImage}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06B6D4',
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  photoItem: {
    marginBottom: 16,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  imageTouchable: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});

export default VehiclePhotoBottomSheet;
