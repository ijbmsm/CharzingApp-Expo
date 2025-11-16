import React, { useState } from 'react';
import { View, Image, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { InspectionImageItem } from '../../adminWeb/index';
import FullScreenImageViewer from './FullScreenImageViewer';

interface InspectionImageCardProps {
  image: InspectionImageItem;
  onRemove: (id: string) => void;
  onUpdateCategory: (id: string, text: string) => void;
  onUpdateSeverity: (id: string, text: string) => void;
  onImageEdit?: (id: string, newImageUrl: string) => void;
}

const InspectionImageCard: React.FC<InspectionImageCardProps> = ({
  image,
  onRemove,
  onUpdateCategory,
  onUpdateSeverity,
  onImageEdit,
}) => {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const handleImagePress = () => {
    setImageViewerVisible(true);
  };

  const handleCloseImageViewer = () => {
    setImageViewerVisible(false);
  };

  const handleSaveEditedImage = (editedUri: string) => {
    if (onImageEdit) {
      onImageEdit(image.id, editedUri);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={handleImagePress}
        activeOpacity={0.9}
        style={styles.imageTouchable}
      >
        <Image source={{ uri: image.imageUrl }} style={styles.preview} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(image.id)}
        activeOpacity={0.7}
      >
        <Ionicons name="close-circle" size={24} color="#EF4444" />
      </TouchableOpacity>

      <View style={styles.metaInputs}>
        <TextInput
          style={styles.metaInput}
          placeholder="카테고리"
          placeholderTextColor="#9CA3AF"
          value={image.category || ''}
          onChangeText={(text) => onUpdateCategory(image.id, text)}
        />
        <TextInput
          style={styles.metaInput}
          placeholder="상태"
          placeholderTextColor="#9CA3AF"
          value={image.severity || ''}
          onChangeText={(text) => onUpdateSeverity(image.id, text)}
        />
      </View>

      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        visible={imageViewerVisible}
        imageUri={image.imageUrl}
        onClose={handleCloseImageViewer}
        onSave={handleSaveEditedImage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    marginBottom: verticalScale(12),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  imageTouchable: {
    width: '100%',
    height: verticalScale(150),
  },
  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaInputs: {
    padding: scale(8),
    gap: verticalScale(6),
  },
  metaInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(6),
    fontSize: moderateScale(12),
    color: '#1F2937',
  },
});

export default InspectionImageCard;
