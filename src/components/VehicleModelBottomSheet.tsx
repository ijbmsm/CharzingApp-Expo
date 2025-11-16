import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VehicleModelBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (brand: string, model: string, grade: string, year: string) => void;
  initialBrand?: string;
  initialModel?: string;
  initialGrade?: string;
  initialYear?: string;
}

const VehicleModelBottomSheet: React.FC<VehicleModelBottomSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  initialBrand = '',
  initialModel = '',
  initialGrade = '',
  initialYear = '',
}) => {
  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [grade, setGrade] = useState(initialGrade);
  const [year, setYear] = useState(initialYear);

  // 모달이 열릴 때마다 초기값 설정
  useEffect(() => {
    if (visible) {
      setBrand(initialBrand);
      setModel(initialModel);
      setGrade(initialGrade);
      setYear(initialYear);
    }
  }, [visible, initialBrand, initialModel, initialGrade, initialYear]);

  const handleConfirm = () => {
    if (brand.trim() && model.trim() && year.trim()) {
      onConfirm(brand.trim(), model.trim(), grade.trim(), year.trim());
      onClose();
    }
  };

  const isComplete = brand.trim() && model.trim() && year.trim();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>차량 모델</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* 브랜드 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>브랜드 *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="현대, 기아, 테슬라 등"
                placeholderTextColor="#9CA3AF"
                value={brand}
                onChangeText={setBrand}
                autoCapitalize="none"
              />
            </View>

            {/* 차량명 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>차량명 *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="아이오닉 5, EV6 등"
                placeholderTextColor="#9CA3AF"
                value={model}
                onChangeText={setModel}
                autoCapitalize="none"
              />
            </View>

            {/* 등급/트림 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>등급/트림 (선택사항)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Long Range AWD, GT-Line 등"
                placeholderTextColor="#9CA3AF"
                value={grade}
                onChangeText={setGrade}
                autoCapitalize="none"
              />
            </View>

            {/* 년식 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>년식 *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2024"
                placeholderTextColor="#9CA3AF"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !isComplete && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!isComplete}
            >
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default VehicleModelBottomSheet;
