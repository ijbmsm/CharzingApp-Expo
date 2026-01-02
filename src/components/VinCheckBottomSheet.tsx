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

export interface VinCheckData {
  registrationImageUris: string[];  // 자동차 등록증 사진 (선택)
  vinImageUris: string[];           // 차대번호 사진 (필수)
  isVinVerified: boolean;           // 자동차 등록증 확인 체크
  hasNoIllegalModification: boolean;
  hasNoFloodDamage: boolean;
  vinIssue: string;
  modificationIssue: string;
  floodIssue: string;
}

interface VinCheckBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: VinCheckData) => void;
  initialData?: Partial<VinCheckData>;
}

const VinCheckBottomSheet: React.FC<VinCheckBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  initialData = {},
}) => {
  const insets = useSafeAreaInsets();

  // 사진 (배열)
  const [registrationImageUris, setRegistrationImageUris] = useState<string[]>(initialData.registrationImageUris || []);
  const [vinImageUris, setVinImageUris] = useState<string[]>(initialData.vinImageUris || []);

  // 상태
  const [vinStatus, setVinStatus] = useState<'good' | 'problem' | undefined>(
    initialData.isVinVerified === true ? 'good' : initialData.isVinVerified === false ? 'problem' : undefined
  );
  const [modificationStatus, setModificationStatus] = useState<'good' | 'problem' | undefined>(
    initialData.hasNoIllegalModification === true ? 'good' : initialData.hasNoIllegalModification === false ? 'problem' : undefined
  );
  const [floodStatus, setFloodStatus] = useState<'good' | 'problem' | undefined>(
    initialData.hasNoFloodDamage === true ? 'good' : initialData.hasNoFloodDamage === false ? 'problem' : undefined
  );

  // 문제 설명
  const [vinIssue, setVinIssue] = useState(initialData.vinIssue || '');
  const [modificationIssue, setModificationIssue] = useState(initialData.modificationIssue || '');
  const [floodIssue, setFloodIssue] = useState(initialData.floodIssue || '');

  // 애니메이션 값
  const vinAnimation = useRef(new Animated.Value(0)).current;
  const modificationAnimation = useRef(new Animated.Value(0)).current;
  const floodAnimation = useRef(new Animated.Value(0)).current;

  // 모달이 열릴 때마다 초기값 설정
  useEffect(() => {
    if (visible) {
      setRegistrationImageUris(initialData.registrationImageUris || []);
      setVinImageUris(initialData.vinImageUris || []);
      setVinStatus(initialData.isVinVerified === true ? 'good' : initialData.isVinVerified === false ? 'problem' : undefined);
      setModificationStatus(initialData.hasNoIllegalModification === true ? 'good' : initialData.hasNoIllegalModification === false ? 'problem' : undefined);
      setFloodStatus(initialData.hasNoFloodDamage === true ? 'good' : initialData.hasNoFloodDamage === false ? 'problem' : undefined);
      setVinIssue(initialData.vinIssue || '');
      setModificationIssue(initialData.modificationIssue || '');
      setFloodIssue(initialData.floodIssue || '');
    }
  }, [visible, initialData]);

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

  const handleSave = () => {
    if (vinImageUris.length > 0 && vinStatus && modificationStatus && floodStatus) {
      onSave({
        registrationImageUris,
        vinImageUris,
        isVinVerified: vinStatus === 'good',
        hasNoIllegalModification: modificationStatus === 'good',
        hasNoFloodDamage: floodStatus === 'good',
        vinIssue: vinStatus === 'problem' ? vinIssue : '',
        modificationIssue: modificationStatus === 'problem' ? modificationIssue : '',
        floodIssue: floodStatus === 'problem' ? floodIssue : '',
      });
      onClose();
    }
  };

  // 필수: 차대번호 사진 + 3개 상태 모두 선택
  const isComplete = vinImageUris.length > 0 && vinStatus && modificationStatus && floodStatus;

  const renderStatusButtons = (
    label: string,
    currentStatus: 'good' | 'problem' | undefined,
    onStatusChange: (status: 'good' | 'problem') => void,
    animation: Animated.Value,
    issueValue: string,
    onIssueChange: (text: string) => void
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label} *</Text>

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

      {currentStatus === 'problem' && (
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
            value={issueValue}
            onChangeText={onIssueChange}
            multiline
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={Keyboard.dismiss}
          />
        </Animated.View>
      )}
    </View>
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
              <Ionicons name="close" size={24} color="#1F2937" />
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
            {/* 자동차 등록증 사진 (선택) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>자동차 등록증 사진 (선택)</Text>
              <MultipleImagePicker
                imageUris={registrationImageUris}
                onImagesAdded={(uris) => setRegistrationImageUris((prev) => [...prev, ...uris])}
                onImageRemoved={(index) => setRegistrationImageUris((prev) => prev.filter((_, i) => i !== index))}
                onImageEdited={(index, uri) => setRegistrationImageUris((prev) => prev.map((u, i) => i === index ? uri : u))}
                label="자동차 등록증"
              />
            </View>

            {/* 차대번호 사진 (필수) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>차대번호 사진 *</Text>
              <MultipleImagePicker
                imageUris={vinImageUris}
                onImagesAdded={(uris) => setVinImageUris((prev) => [...prev, ...uris])}
                onImageRemoved={(index) => setVinImageUris((prev) => prev.filter((_, i) => i !== index))}
                onImageEdited={(index, uri) => setVinImageUris((prev) => prev.map((u, i) => i === index ? uri : u))}
                label="차대번호 사진"
              />
            </View>

            {/* 자동차 등록증 확인 */}
            {renderStatusButtons(
              '자동차 등록증',
              vinStatus,
              setVinStatus,
              vinAnimation,
              vinIssue,
              setVinIssue
            )}

            {/* 불법 구조변경 없음 */}
            {renderStatusButtons(
              '불법 구조변경 없음',
              modificationStatus,
              setModificationStatus,
              modificationAnimation,
              modificationIssue,
              setModificationIssue
            )}

            {/* 침수 이력 없음 */}
            {renderStatusButtons(
              '침수 이력 없음',
              floodStatus,
              setFloodStatus,
              floodAnimation,
              floodIssue,
              setFloodIssue
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: 8 + insets.bottom }]}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !isComplete && styles.confirmButtonDisabled,
              ]}
              onPress={handleSave}
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
