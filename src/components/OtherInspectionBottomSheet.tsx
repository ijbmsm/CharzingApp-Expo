import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import MultipleImagePicker from './MultipleImagePicker';
import type { OtherInspectionItem } from '../services/firebaseService';

interface OtherInspectionBottomSheetProps {
  visible: boolean;
  items: OtherInspectionItem[];
  onClose: () => void;
  onUpdate: (items: OtherInspectionItem[]) => void;
}

const OtherInspectionBottomSheet: React.FC<OtherInspectionBottomSheetProps> = ({
  visible,
  items,
  onClose,
  onUpdate,
}) => {
  const insets = useSafeAreaInsets();
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<OtherInspectionItem | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);

  // Input ref for focus management
  const descriptionRef = useRef<TextInput>(null);

  const handleAddNew = () => {
    setCategory('');
    setDescription('');
    setImageUris([]);
    setEditingItem(null);
    setIsAdding(true);
  };

  const handleEdit = (item: OtherInspectionItem) => {
    setCategory(item.category || '');
    setDescription(item.description || '');
    setImageUris(item.imageUris || []);
    setEditingItem(item);
    setIsAdding(true);
  };

  const handleDelete = (itemId: string) => {
    Alert.alert(
      '항목 삭제',
      '이 항목을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            const updatedItems = items.filter(item => item.id !== itemId);
            onUpdate(updatedItems);
          },
        },
      ]
    );
  };

  const handleSave = () => {
    if (!category.trim()) {
      Alert.alert('알림', '카테고리를 입력해주세요.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('알림', '설명을 입력해주세요.');
      return;
    }

    const newItem: OtherInspectionItem = {
      id: editingItem?.id || Date.now().toString(),
      category: category.trim(),
      description: description.trim(),
      imageUris,
    };

    let updatedItems: OtherInspectionItem[];
    if (editingItem) {
      // 수정
      updatedItems = items.map(item =>
        item.id === editingItem.id ? newItem : item
      );
    } else {
      // 추가
      updatedItems = [...items, newItem];
    }

    onUpdate(updatedItems);
    setIsAdding(false);
    setCategory('');
    setDescription('');
    setImageUris([]);
    setEditingItem(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setCategory('');
    setDescription('');
    setImageUris([]);
    setEditingItem(null);
  };

  const handleImagesAdded = (uris: string[]) => {
    setImageUris(prev => [...prev, ...uris]);
  };

  const handleImageRemoved = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageEdited = (index: number, newUri: string) => {
    setImageUris(prev => prev.map((uri, i) => i === index ? newUri : uri));
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={isAdding ? handleCancel : onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>기타 점검</Text>
          {isAdding ? (
            <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
              <Text style={styles.saveButton}>저장</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>

        {/* 항목 추가/수정 모드 */}
        {isAdding ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>카테고리 *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="예: 차량 외관, 실내 상태 등"
                placeholderTextColor="#9CA3AF"
                value={category}
                onChangeText={setCategory}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => descriptionRef.current?.focus()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>설명 *</Text>
              <TextInput
                ref={descriptionRef}
                style={[styles.textInput, styles.textArea]}
                placeholder="상세 내용을 입력하세요"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                이미지 {imageUris.length > 0 && `(${imageUris.length}장)`}
              </Text>
              <MultipleImagePicker
                imageUris={imageUris}
                onImagesAdded={handleImagesAdded}
                onImageRemoved={handleImageRemoved}
                onImageEdited={handleImageEdited}
                maxImages={10}
              />
            </View>
          </ScrollView>
        ) : (
          /* 항목 목록 모드 */
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>기타 점검 항목이 없습니다</Text>
                <Text style={styles.emptyDescription}>
                  추가 버튼을 눌러 항목을 등록하세요
                </Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemNumber}>#{index + 1}</Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(item)}
                        style={styles.actionButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={20} color="#06B6D4" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        style={styles.actionButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  {item.imageUris && item.imageUris.length > 0 && (
                    <View style={styles.imageCount}>
                      <Ionicons name="images-outline" size={16} color="#6B7280" />
                      <Text style={styles.imageCountText}>
                        {item.imageUris.length}장
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Footer */}
        {!isAdding && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + scale(16) }]}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddNew}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.addButtonText}>항목 추가</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#06B6D4',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(20),
  },
  inputGroup: {
    marginBottom: verticalScale(20),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: verticalScale(8),
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(15),
    color: '#1F2937',
  },
  textArea: {
    minHeight: verticalScale(100),
    textAlignVertical: 'top',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(80),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#6B7280',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  emptyDescription: {
    fontSize: moderateScale(14),
    color: '#9CA3AF',
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: scale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  itemNumber: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#06B6D4',
  },
  itemActions: {
    flexDirection: 'row',
    gap: scale(8),
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCategory: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: verticalScale(6),
  },
  itemDescription: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    lineHeight: 20,
  },
  imageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginTop: verticalScale(8),
  },
  imageCountText: {
    fontSize: moderateScale(12),
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: verticalScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  addButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default OtherInspectionBottomSheet;
