import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MultipleImagePicker from './MultipleImagePicker';

interface DashboardInfoBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (
    mileage: string,
    imageUris: string[],
    status: 'good' | 'problem',
    issueDescription?: string
  ) => void;
  initialMileage?: string;
  initialImageUris?: string[];
  initialStatus?: 'good' | 'problem';
  initialIssueDescription?: string;
}

const DashboardInfoBottomSheet: React.FC<DashboardInfoBottomSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  initialMileage = '',
  initialImageUris = [],
  initialStatus,
  initialIssueDescription = '',
}) => {
  const insets = useSafeAreaInsets();
  const [mileage, setMileage] = useState(initialMileage);
  const [imageUris, setImageUris] = useState<string[]>(initialImageUris);
  const [status, setStatus] = useState<'good' | 'problem' | undefined>(initialStatus);
  const [issueDescription, setIssueDescription] = useState(initialIssueDescription);

  // 애니메이션 값
  const issueAnimation = useRef(new Animated.Value(0)).current;

  // 모달이 열릴 때마다 초기값 설정
  useEffect(() => {
    if (visible) {
      setMileage(initialMileage);
      setImageUris(initialImageUris);
      setStatus(initialStatus);
      setIssueDescription(initialIssueDescription);
    }
  }, [visible, initialMileage, initialImageUris, initialStatus, initialIssueDescription]);

  // 문제 있음 선택 시 애니메이션
  useEffect(() => {
    const toValue = status === 'problem' ? 1 : 0;
    const duration = status === 'problem' ? 300 : 200;

    Animated.timing(issueAnimation, {
      toValue,
      duration,
      useNativeDriver: false,
    }).start();
  }, [status]);

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
    if (mileage.trim() && imageUris.length > 0 && status) {
      onConfirm(
        mileage.trim(),
        imageUris,
        status,
        status === 'problem' ? issueDescription : undefined
      );
      onClose();
    }
  };

  const isComplete = mileage.trim() && imageUris.length > 0 && status;

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
            <Text style={styles.headerTitle}>계기판 정보</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 주행거리 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>주행거리 (km) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="15000"
                placeholderTextColor="#9CA3AF"
                value={mileage}
                onChangeText={setMileage}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            {/* 계기판 사진 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>계기판 사진 *</Text>
              <MultipleImagePicker
                imageUris={imageUris}
                onImagesAdded={handleImagesAdded}
                onImageRemoved={handleImageRemoved}
                onImageEdited={handleImageEdited}
                label="계기판 사진"
              />
            </View>

            {/* 계기판 상태 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>계기판 상태 *</Text>

              <View style={styles.statusRow}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === 'good' && styles.statusButtonSelected,
                  ]}
                  onPress={() => setStatus('good')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={status === 'good' ? '#06B6D4' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.statusButtonText,
                      status === 'good' && styles.statusButtonTextSelected,
                    ]}
                  >
                    양호
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === 'problem' && styles.statusButtonSelected,
                  ]}
                  onPress={() => setStatus('problem')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={status === 'problem' ? '#06B6D4' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.statusButtonText,
                      status === 'problem' && styles.statusButtonTextSelected,
                    ]}
                  >
                    문제 있음
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 문제 설명 입력창 */}
              {status === 'problem' && (
                <Animated.View
                  style={[
                    styles.issueContainer,
                    {
                      maxHeight: issueAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                      opacity: issueAnimation,
                      marginTop: issueAnimation.interpolate({
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
                    value={issueDescription}
                    onChangeText={setIssueDescription}
                    multiline
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit={true}
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </Animated.View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: 8 + insets.bottom }]}>
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

export default DashboardInfoBottomSheet;
