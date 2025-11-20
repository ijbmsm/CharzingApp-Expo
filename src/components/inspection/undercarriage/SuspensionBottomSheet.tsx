import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import FullScreenImageViewer from '../../FullScreenImageViewer';

interface SuspensionPhotos {
  driverFrontWheel?: string;
  driverRearWheel?: string;
  passengerRearWheel?: string;
  passengerFrontWheel?: string;
}

interface SuspensionBottomSheetProps {
  visible: boolean;
  photos: SuspensionPhotos;
  onClose: () => void;
  onUpdate: (photos: SuspensionPhotos) => void;
}

const SuspensionBottomSheet: React.FC<SuspensionBottomSheetProps> = ({
  visible,
  photos,
  onClose,
  onUpdate,
}) => {
  const insets = useSafeAreaInsets();
  const [localPhotos, setLocalPhotos] = useState<SuspensionPhotos>(photos);

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<keyof SuspensionPhotos | null>(null);

  React.useEffect(() => {
    if (visible) {
      setLocalPhotos(photos);
    }
  }, [visible, photos]);

  const photoPositions: Array<{ key: keyof SuspensionPhotos; label: string }> = [
    { key: 'driverFrontWheel', label: '운전석 앞 휠' },
    { key: 'driverRearWheel', label: '운전석 뒤 휠' },
    { key: 'passengerRearWheel', label: '조수석 뒤 휠' },
    { key: 'passengerFrontWheel', label: '조수석 앞 휠' },
  ];

  const handleSelectImage = async (position: keyof SuspensionPhotos) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setLocalPhotos(prev => ({
        ...prev,
        [position]: asset.uri,
      }));
    }
  };

  const handleTakePhoto = async (position: keyof SuspensionPhotos) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setLocalPhotos(prev => ({
        ...prev,
        [position]: asset.uri,
      }));
    }
  };

  const handleRemovePhoto = (position: keyof SuspensionPhotos) => {
    setLocalPhotos(prev => ({
      ...prev,
      [position]: undefined,
    }));
  };

  // Open image viewer for editing
  const handleImagePress = (position: keyof SuspensionPhotos, imageUri: string) => {
    setSelectedImageUri(imageUri);
    setSelectedPosition(position);
    setImageViewerVisible(true);
  };

  // Close image viewer
  const handleCloseImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageUri(null);
    setSelectedPosition(null);
  };

  // Save edited image
  const handleSaveEditedImage = (editedUri: string) => {
    if (selectedPosition) {
      setLocalPhotos(prev => ({
        ...prev,
        [selectedPosition]: editedUri,
      }));
    }
  };

  const showImageOptions = (position: keyof SuspensionPhotos) => {
    Alert.alert(
      '사진 선택',
      '사진을 어떻게 추가하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '카메라', onPress: () => handleTakePhoto(position) },
        { text: '갤러리', onPress: () => handleSelectImage(position) },
      ]
    );
  };

  const handleSave = () => {
    onUpdate(localPhotos);
    onClose();
  };

  const handleCancel = () => {
    setLocalPhotos(photos);
    onClose();
  };

  const photoCount = photoPositions.filter(p => localPhotos[p.key]).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>서스펜션 검사</Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
            <Text style={styles.saveButton}>저장</Text>
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>
            각 휠의 서스펜션 사진을 촬영하세요
          </Text>
          <Text style={styles.photoCount}>
            {photoCount}/4 완료
          </Text>
        </View>

        {/* Photo Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {photoPositions.map(({ key, label }) => {
            const photoUri = localPhotos[key];

            return (
              <View key={key} style={styles.photoItem}>
                <Text style={styles.photoLabel}>{label}</Text>

                {photoUri ? (
                  <View style={styles.photoContainer}>
                    <TouchableOpacity
                      style={styles.photoPreview}
                      onPress={() => handleImagePress(key, photoUri)}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: photoUri }} style={styles.photo} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.replaceButton}
                      onPress={() => showImageOptions(key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemovePhoto(key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.emptyPhotoContainer}
                    onPress={() => showImageOptions(key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyPhotoText}>사진 추가</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(8),
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#06B6D4',
  },
  subtitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subtitle: {
    flex: 1,
    fontSize: moderateScale(13),
    color: '#6B7280',
  },
  photoCount: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#06B6D4',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(20),
    gap: verticalScale(20),
  },
  photoItem: {
    marginBottom: verticalScale(4),
  },
  photoLabel: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#374151',
    marginBottom: verticalScale(8),
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  replaceButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyPhotoContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPhotoText: {
    fontSize: moderateScale(14),
    color: '#9CA3AF',
    marginTop: verticalScale(8),
  },
});

export default SuspensionBottomSheet;
