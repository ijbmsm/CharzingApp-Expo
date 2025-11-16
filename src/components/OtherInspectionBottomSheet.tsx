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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MultipleImagePicker from './MultipleImagePicker';

interface OtherInspectionItem {
  id: string;
  category: string;
  description: string;
  imageUris: string[];
}

interface OtherInspectionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: OtherInspectionItem) => void;
  initialData?: OtherInspectionItem | null;
}

const OtherInspectionBottomSheet: React.FC<OtherInspectionBottomSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  initialData = null,
}) => {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setCategory(initialData.category || '');
        setDescription(initialData.description || '');
        setImageUris(initialData.imageUris || []);
      } else {
        setCategory('');
        setDescription('');
        setImageUris([]);
      }
    }
  }, [visible, initialData]);

  const handleConfirm = () => {
    const data: OtherInspectionItem = {
      id: initialData?.id || Date.now().toString(),
      category: category.trim(),
      description: description.trim(),
      imageUris,
    };

    onConfirm(data);
    onClose();
  };

  const handleImagesAdded = (uris: string[]) => {
    setImageUris((prev) => [...prev, ...uris]);
  };

  const handleImageRemoved = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>기타 항목 추가</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content}>
            {/* 카테고리 입력 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>카테고리</Text>
              <TextInput
                style={styles.textInput}
                placeholder="예: 차량 외관, 실내 상태 등"
                placeholderTextColor="#9CA3AF"
                value={category}
                onChangeText={setCategory}
              />
            </View>

            {/* 설명 입력 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>설명</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="상세 내용을 입력하세요"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* 이미지 추가 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                이미지 {imageUris.length > 0 && `(${imageUris.length}장)`}
              </Text>
              <MultipleImagePicker
                imageUris={imageUris}
                onImagesAdded={handleImagesAdded}
                onImageRemoved={handleImageRemoved}
                maxImages={10}
              />
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default OtherInspectionBottomSheet;
