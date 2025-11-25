import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  TextInput,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MultipleImagePicker from './MultipleImagePicker';

interface MajorDeviceItem {
  key: string;
  label: string;
}

interface ItemData {
  imageUris?: string[];
  status?: 'good' | 'problem';
  issueDescription?: string;
}

interface MajorDeviceBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: MajorDeviceItem[];
  onConfirm: (data: Record<string, import('../../adminWeb/index').MajorDeviceItem>) => void;
  initialData?: Record<string, import('../../adminWeb/index').MajorDeviceItem>;
}

const MajorDeviceBottomSheet: React.FC<MajorDeviceBottomSheetProps> = ({
  visible,
  onClose,
  title,
  items,
  onConfirm,
  initialData,
}) => {
  const insets = useSafeAreaInsets();

  // Initialize state with empty objects for each item
  const [data, setData] = useState<Record<string, ItemData>>(() => {
    const initialState: Record<string, ItemData> = {};
    items.forEach((item) => {
      initialState[item.key] = {};
    });
    return initialState;
  });

  // Animation refs for each item's issue description
  const animationRefs = useRef<Record<string, Animated.Value>>({});

  // Initialize animation values
  useEffect(() => {
    items.forEach((item) => {
      if (!animationRefs.current[item.key]) {
        animationRefs.current[item.key] = new Animated.Value(0);
      }
    });
  }, [items]);

  // Update state when initialData changes
  useEffect(() => {
    if (visible && initialData) {
      const newData: Record<string, ItemData> = {};
      items.forEach((item) => {
        const initialItem = initialData[item.key];
        if (initialItem) {
          newData[item.key] = {
            imageUris: initialItem.imageUris || [],
            status: initialItem.status,
            issueDescription: initialItem.issueDescription,
          };
        } else {
          newData[item.key] = {};
        }
      });
      setData(newData);
    }
  }, [visible, initialData, items]);

  // Animate issue description based on status
  useEffect(() => {
    items.forEach((item) => {
      const itemData = data[item.key];
      const animation = animationRefs.current[item.key];
      if (animation) {
        Animated.timing(animation, {
          toValue: itemData?.status === 'problem' ? 1 : 0,
          duration: itemData?.status === 'problem' ? 300 : 200,
          useNativeDriver: false,
        }).start();
      }
    });
  }, [data, items]);

  const handleImagesAdded = (itemKey: string, newUris: string[]) => {
    setData((prev) => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        imageUris: [...(prev[itemKey]?.imageUris || []), ...newUris]
      },
    }));
  };

  const handleStatusChange = (itemKey: string, status: 'good' | 'problem') => {
    setData((prev) => ({
      ...prev,
      [itemKey]: { ...prev[itemKey], status },
    }));
  };

  const handleIssueChange = (itemKey: string, text: string) => {
    setData((prev) => ({
      ...prev,
      [itemKey]: { ...prev[itemKey], issueDescription: text },
    }));
  };

  const handleRemoveImage = (itemKey: string, imageIndex: number) => {
    setData((prev) => {
      const currentImages = prev[itemKey]?.imageUris || [];
      const updatedImages = currentImages.filter((_, index) => index !== imageIndex);
      return {
        ...prev,
        [itemKey]: { ...prev[itemKey], imageUris: updatedImages },
      };
    });
  };

  const handleImageEdited = (itemKey: string, imageIndex: number, newUri: string) => {
    setData((prev) => {
      const currentImages = prev[itemKey]?.imageUris || [];
      const updatedImages = currentImages.map((uri, index) => index === imageIndex ? newUri : uri);
      return {
        ...prev,
        [itemKey]: { ...prev[itemKey], imageUris: updatedImages },
      };
    });
  };

  const handleConfirm = () => {
    // Convert to MajorDeviceItem format with name field
    const dataWithNames: Record<string, import('../../adminWeb/index').MajorDeviceItem> = {};

    items.forEach((item) => {
      const itemData = data[item.key];
      if (itemData && Object.keys(itemData).length > 0) {
        dataWithNames[item.key] = {
          name: item.label,
          imageUris: itemData.imageUris,
          status: itemData.status,
          issueDescription: itemData.issueDescription,
        };
      }
    });

    onConfirm(dataWithNames);
    onClose();
  };

  const renderStatusButtons = (
    itemKey: string,
    currentStatus: 'good' | 'problem' | undefined
  ) => {
    return (
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => handleStatusChange(itemKey, 'good')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.pillButton,
              currentStatus === 'good' && styles.pillButtonGoodSelected,
            ]}
          >
            <Text
              style={[
                styles.pillButtonText,
                currentStatus === 'good' && styles.pillButtonTextSelected,
              ]}
            >
              양호
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => handleStatusChange(itemKey, 'problem')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.pillButton,
              currentStatus === 'problem' && styles.pillButtonProblemSelected,
            ]}
          >
            <Text
              style={[
                styles.pillButtonText,
                currentStatus === 'problem' && styles.pillButtonTextSelected,
              ]}
            >
              문제 있음
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderIssueInput = (itemKey: string, value: string) => {
    const animation = animationRefs.current[itemKey];
    if (!animation) return null;

    return (
      <Animated.View
        style={[
          styles.issueContainer,
          {
            maxHeight: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200],
            }),
            opacity: animation,
            marginTop: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 12],
            }),
          },
        ]}
      >
        <TextInput
          style={[styles.textInput, { minHeight: 80 }]}
          placeholder="문제 내용을 입력하세요"
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={(text) => handleIssueChange(itemKey, text)}
          multiline
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={Keyboard.dismiss}
        />
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {items.map((item) => {
              const itemData = data[item.key] || {};
              return (
                <View key={item.key} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{item.label}</Text>

                  {/* Image Section */}
                  <MultipleImagePicker
                    imageUris={itemData.imageUris || []}
                    onImagesAdded={(newUris) => handleImagesAdded(item.key, newUris)}
                    onImageRemoved={(index) => handleRemoveImage(item.key, index)}
                    onImageEdited={(index, newUri) => handleImageEdited(item.key, index, newUri)}
                  />

                  {/* Status Selection */}
                  <View style={styles.statusSection}>
                    {renderStatusButtons(item.key, itemData.status)}
                  </View>

                  {/* Issue Description (shown when status is 'problem') */}
                  {itemData.status === 'problem' && renderIssueInput(item.key, itemData.issueDescription || '')}
                </View>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>저장</Text>
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
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusSection: {
    marginBottom: 0,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
  },
  pillButton: {
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonGoodSelected: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  pillButtonProblemSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  pillButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  pillButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  issueContainer: {
    overflow: 'hidden',
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

export default MajorDeviceBottomSheet;
