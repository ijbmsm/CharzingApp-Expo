import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { convertToLineSeedFont } from '../../../styles/fonts';
import ImageViewing from 'react-native-image-viewing';

interface StatusItem {
  label: string;
  value: string;
  isGood: boolean;
}

interface VehicleStatusDetailModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  images: string[];
  imageLabel: string;
  statusItems: StatusItem[];
  issueDescription?: string;
}

export const VehicleStatusDetailModal: React.FC<VehicleStatusDetailModalProps> = ({
  visible,
  onClose,
  title,
  images,
  imageLabel,
  statusItems,
  issueDescription,
}) => {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImagePress = (index: number) => {
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, convertToLineSeedFont(styles.modalTitle)]}>
            {title}
          </Text>
          <View style={styles.modalPlaceholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* 이미지들 */}
          {images.length > 0 && (
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, convertToLineSeedFont(styles.modalSectionTitle)]}>
                {imageLabel}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
                {images.map((uri, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleImagePress(index)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri }} style={styles.modalImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 상태 정보 */}
          {statusItems.length > 0 && (
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, convertToLineSeedFont(styles.modalSectionTitle)]}>
                {statusItems.length === 1 ? '상태' : '확인 항목'}
              </Text>

              {statusItems.map((item, index) => (
                <View key={index} style={styles.modalInfoRow}>
                  <View style={styles.modalInfoLabel}>
                    <Ionicons
                      name={item.isGood ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={item.isGood ? '#06B6D4' : '#EF4444'}
                    />
                    <Text style={[styles.modalInfoText, convertToLineSeedFont(styles.modalInfoText)]}>
                      {item.label}
                    </Text>
                  </View>
                  <Text style={[styles.modalInfoValue, convertToLineSeedFont(styles.modalInfoValue)]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* 전체화면 이미지 뷰어 */}
      <ImageViewing
        images={images.map(uri => ({ uri }))}
        imageIndex={currentImageIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 28,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  imageScrollView: {
    marginHorizontal: -4,
  },
  modalImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#E5E7EB',
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalInfoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalInfoText: {
    fontSize: 15,
    color: '#374151',
  },
  modalInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalDescriptionText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    marginTop: 12,
  },
});
