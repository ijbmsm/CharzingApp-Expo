import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FullScreenImageViewer from './FullScreenImageViewer';

interface MultipleImagePickerProps {
  imageUris: string[];
  onImagesAdded: (uris: string[]) => void;
  onImageRemoved: (index: number) => void;
  onImageEdited?: (index: number, newUri: string) => void;
  label?: string;
  maxImages?: number;
}

const MultipleImagePicker: React.FC<MultipleImagePickerProps> = ({
  imageUris,
  onImagesAdded,
  onImageRemoved,
  onImageEdited,
  label,
  maxImages = 10,
}) => {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const openImageViewer = (uri: string, index: number) => {
    setSelectedImageUri(uri);
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageUri(null);
    setSelectedImageIndex(null);
  };

  const handleSaveEditedImage = (editedUri: string) => {
    if (onImageEdited && selectedImageIndex !== null) {
      onImageEdited(selectedImageIndex, editedUri);
    }
  };
  const handleAddImage = () => {
    if (imageUris.length >= maxImages) {
      Alert.alert('알림', `최대 ${maxImages}장까지 추가할 수 있습니다.`);
      return;
    }

    Alert.alert(
      label ? `${label} 추가` : "사진 추가",
      "사진을 추가할 방법을 선택하세요.",
      [
        {
          text: "갤러리에서 선택",
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
                allowsEditing: false,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const newUris = result.assets.map(asset => asset.uri);
                const remainingSlots = maxImages - imageUris.length;
                const urisToAdd = newUris.slice(0, remainingSlots);

                if (newUris.length > remainingSlots) {
                  Alert.alert('알림', `최대 ${maxImages}장까지 추가할 수 있어 ${remainingSlots}장만 추가되었습니다.`);
                }

                onImagesAdded(urisToAdd);
              }
            } catch (error) {
              console.error("이미지 선택 실패:", error);
              Alert.alert("오류", "이미지를 선택하는데 실패했습니다.");
            }
          },
        },
        {
          text: "사진 촬영",
          onPress: async () => {
            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                allowsEditing: false,
              });

              if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
                onImagesAdded([result.assets[0].uri]);
              }
            } catch (error) {
              console.error("사진 촬영 실패:", error);
              Alert.alert("오류", "사진을 촬영하는데 실패했습니다.");
            }
          },
        },
        {
          text: "취소",
          style: "cancel",
        },
      ]
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      {/* 사진 추가 버튼 (항상 맨 왼쪽) */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddImage}
        activeOpacity={0.7}
      >
        <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
        <Text style={styles.addButtonText}>추가</Text>
      </TouchableOpacity>

      {/* 선택된 이미지들 */}
      {imageUris.map((uri, index) => (
        <View key={index} style={styles.imageItem}>
          <TouchableOpacity
            onPress={() => openImageViewer(uri, index)}
            activeOpacity={0.9}
            style={styles.imageTouchable}
          >
            <Image
              source={{ uri }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onImageRemoved(index)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}

      {/* 전체화면 이미지 뷰어 */}
      <FullScreenImageViewer
        visible={imageViewerVisible}
        imageUri={selectedImageUri}
        onClose={closeImageViewer}
        onSave={handleSaveEditedImage}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    marginBottom: 12,
  },
  scrollContent: {
    gap: 12,
  },
  addButton: {
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    marginTop: 6,
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  imageItem: {
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imageTouchable: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default MultipleImagePicker;
