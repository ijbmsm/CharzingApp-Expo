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

interface VinCheckBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (
    imageUris: string[],
    isVinVerified: boolean,
    hasNoIllegalModification: boolean,
    hasNoFloodDamage: boolean,
    issues: {
      vinIssue?: string;
      modificationIssue?: string;
      floodIssue?: string;
    }
  ) => void;
  initialImageUris?: string[];
  initialIsVinVerified?: boolean;
  initialHasNoIllegalModification?: boolean;
  initialHasNoFloodDamage?: boolean;
  initialVinIssue?: string;
  initialModificationIssue?: string;
  initialFloodIssue?: string;
}

const VinCheckBottomSheet: React.FC<VinCheckBottomSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  initialImageUris = [],
  initialIsVinVerified,
  initialHasNoIllegalModification,
  initialHasNoFloodDamage,
  initialVinIssue = '',
  initialModificationIssue = '',
  initialFloodIssue = '',
}) => {
  const insets = useSafeAreaInsets();
  const [imageUris, setImageUris] = useState<string[]>(initialImageUris);
  const [vinStatus, setVinStatus] = useState<'good' | 'problem' | undefined>(
    initialIsVinVerified === true ? 'good' : initialIsVinVerified === false ? 'problem' : undefined
  );
  const [modificationStatus, setModificationStatus] = useState<'good' | 'problem' | undefined>(
    initialHasNoIllegalModification === true ? 'good' : initialHasNoIllegalModification === false ? 'problem' : undefined
  );
  const [floodStatus, setFloodStatus] = useState<'good' | 'problem' | undefined>(
    initialHasNoFloodDamage === true ? 'good' : initialHasNoFloodDamage === false ? 'problem' : undefined
  );
  const [vinIssue, setVinIssue] = useState(initialVinIssue);
  const [modificationIssue, setModificationIssue] = useState(initialModificationIssue);
  const [floodIssue, setFloodIssue] = useState(initialFloodIssue);

  // 애니메이션 값
  const vinAnimation = useRef(new Animated.Value(0)).current;
  const modificationAnimation = useRef(new Animated.Value(0)).current;
  const floodAnimation = useRef(new Animated.Value(0)).current;

  // 모달이 열릴 때마다 초기값 설정
  useEffect(() => {
    if (visible) {
      setImageUris(initialImageUris);
      setVinStatus(initialIsVinVerified === true ? 'good' : initialIsVinVerified === false ? 'problem' : undefined);
      setModificationStatus(initialHasNoIllegalModification === true ? 'good' : initialHasNoIllegalModification === false ? 'problem' : undefined);
      setFloodStatus(initialHasNoFloodDamage === true ? 'good' : initialHasNoFloodDamage === false ? 'problem' : undefined);
      setVinIssue(initialVinIssue);
      setModificationIssue(initialModificationIssue);
      setFloodIssue(initialFloodIssue);
    }
  }, [visible, initialImageUris, initialIsVinVerified, initialHasNoIllegalModification, initialHasNoFloodDamage, initialVinIssue, initialModificationIssue, initialFloodIssue]);

  // 애니메이션 효과
  useEffect(() => {
    Animated.timing(vinAnimation, {
      toValue: vinStatus === 'problem' ? 1 : 0,
      duration: vinStatus === 'problem' ? 300 : 200,
      useNativeDriver: false,
    }).start();
  }, [vinStatus]);

  useEffect(() => {
    Animated.timing(modificationAnimation, {
      toValue: modificationStatus === 'problem' ? 1 : 0,
      duration: modificationStatus === 'problem' ? 300 : 200,
      useNativeDriver: false,
    }).start();
  }, [modificationStatus]);

  useEffect(() => {
    Animated.timing(floodAnimation, {
      toValue: floodStatus === 'problem' ? 1 : 0,
      duration: floodStatus === 'problem' ? 300 : 200,
      useNativeDriver: false,
    }).start();
  }, [floodStatus]);

  const handleImagesAdded = (newUris: string[]) => {
    setImageUris((prev) => [...prev, ...newUris]);
  };

  const handleImageRemoved = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageEdited = (index: number, newUri: string) => {
    setImageUris((prev) => prev.map((uri, i) => i === index ? newUri : uri));
  };

  const handleConfirm = () => {
    if (imageUris.length > 0 && vinStatus && modificationStatus && floodStatus) {
      onConfirm(
        imageUris,
        vinStatus === 'good',
        modificationStatus === 'good',
        floodStatus === 'good',
        {
          vinIssue: vinStatus === 'problem' ? vinIssue : undefined,
          modificationIssue: modificationStatus === 'problem' ? modificationIssue : undefined,
          floodIssue: floodStatus === 'problem' ? floodIssue : undefined,
        }
      );
      onClose();
    }
  };

  const isComplete = imageUris.length > 0 && vinStatus && modificationStatus && floodStatus;

  const renderStatusButtons = (
    currentStatus: 'good' | 'problem' | undefined,
    onStatusChange: (status: 'good' | 'problem') => void
  ) => (
    <View style={styles.statusRow}>
      <TouchableOpacity
        style={[
          styles.statusButton,
          currentStatus === 'good' && styles.statusButtonSelected,
        ]}
        onPress={() => onStatusChange('good')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={currentStatus === 'good' ? '#06B6D4' : '#9CA3AF'}
        />
        <Text
          style={[
            styles.statusButtonText,
            currentStatus === 'good' && styles.statusButtonTextSelected,
          ]}
        >
          양호
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.statusButton,
          currentStatus === 'problem' && styles.statusButtonSelected,
        ]}
        onPress={() => onStatusChange('problem')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="alert-circle"
          size={20}
          color={currentStatus === 'problem' ? '#06B6D4' : '#9CA3AF'}
        />
        <Text
          style={[
            styles.statusButtonText,
            currentStatus === 'problem' && styles.statusButtonTextSelected,
          ]}
        >
          문제 있음
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderIssueInput = (
    animation: Animated.Value,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string
  ) => (
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
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="top"
        returnKeyType="done"
        blurOnSubmit={true}
        onSubmitEditing={Keyboard.dismiss}
      />
    </Animated.View>
  );

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
            <Text style={styles.headerTitle}>차대번호 및 상태 확인</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 차대번호 사진 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>차대번호 사진 *</Text>
              <MultipleImagePicker
                imageUris={imageUris}
                onImagesAdded={handleImagesAdded}
                onImageRemoved={handleImageRemoved}
                onImageEdited={handleImageEdited}
                label="차대번호 사진"
              />
            </View>

            {/* 차대번호 동일성 확인 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>차대번호 동일성 확인 *</Text>
              {renderStatusButtons(vinStatus, setVinStatus)}
              {vinStatus === 'problem' && renderIssueInput(
                vinAnimation,
                vinIssue,
                setVinIssue,
                "문제 내용을 입력하세요"
              )}
            </View>

            {/* 불법 구조변경 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>불법 구조변경 없음 *</Text>
              {renderStatusButtons(modificationStatus, setModificationStatus)}
              {modificationStatus === 'problem' && renderIssueInput(
                modificationAnimation,
                modificationIssue,
                setModificationIssue,
                "문제 내용을 입력하세요"
              )}
            </View>

            {/* 침수 이력 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>침수 이력 없음 *</Text>
              {renderStatusButtons(floodStatus, setFloodStatus)}
              {floodStatus === 'problem' && renderIssueInput(
                floodAnimation,
                floodIssue,
                setFloodIssue,
                "문제 내용을 입력하세요"
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !isComplete && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!isComplete}
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
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    height: 70,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusButtonSelected: {
    borderColor: '#06B6D4',
    backgroundColor: '#F0FDFF',
  },
  statusButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusButtonTextSelected: {
    color: '#06B6D4',
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default VinCheckBottomSheet;
