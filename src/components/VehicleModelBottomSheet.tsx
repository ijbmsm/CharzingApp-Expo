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
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface VehicleModelBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (brand: string, model: string, grade: string, year: string, mileage: string) => void;
  initialBrand?: string;
  initialModel?: string;
  initialGrade?: string;
  initialYear?: string;
  initialMileage?: string;
}

const VehicleModelBottomSheet: React.FC<VehicleModelBottomSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  initialBrand = '',
  initialModel = '',
  initialGrade = '',
  initialYear = '',
  initialMileage = '',
}) => {
  const insets = useSafeAreaInsets();
  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [grade, setGrade] = useState(initialGrade);
  const [year, setYear] = useState(initialYear);
  const [mileage, setMileage] = useState(initialMileage);

  // Input refs for focus management
  const modelRef = useRef<TextInput>(null);
  const gradeRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const mileageRef = useRef<TextInput>(null);

  // 모달이 열릴 때마다 초기값 설정
  useEffect(() => {
    if (visible) {
      setBrand(initialBrand);
      setModel(initialModel);
      setGrade(initialGrade);
      setYear(initialYear);
      setMileage(initialMileage);
    }
  }, [visible, initialBrand, initialModel, initialGrade, initialYear, initialMileage]);

  const handleConfirm = () => {
    if (brand.trim() && model.trim() && year.trim() && mileage.trim()) {
      onConfirm(brand.trim(), model.trim(), grade.trim(), year.trim(), mileage.trim());
      onClose();
    }
  };

  const isComplete = brand.trim() && model.trim() && year.trim() && mileage.trim();

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
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 100 + insets.bottom } // Footer 높이 + 여유
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => modelRef.current?.focus()}
              />
            </View>

            {/* 차량명 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>차량명 *</Text>
              <TextInput
                ref={modelRef}
                style={styles.textInput}
                placeholder="아이오닉 5, EV6 등"
                placeholderTextColor="#9CA3AF"
                value={model}
                onChangeText={setModel}
                autoCapitalize="none"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => gradeRef.current?.focus()}
              />
            </View>

            {/* 등급/트림 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>등급/트림 (선택사항)</Text>
              <TextInput
                ref={gradeRef}
                style={styles.textInput}
                placeholder="Long Range AWD, GT-Line 등"
                placeholderTextColor="#9CA3AF"
                value={grade}
                onChangeText={setGrade}
                autoCapitalize="none"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => yearRef.current?.focus()}
              />
            </View>

            {/* 년식 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>년식 *</Text>
              <TextInput
                ref={yearRef}
                style={styles.textInput}
                placeholder="2024"
                placeholderTextColor="#9CA3AF"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => mileageRef.current?.focus()}
              />
            </View>

            {/* 주행거리 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>주행거리 (km) *</Text>
              <TextInput
                ref={mileageRef}
                style={styles.textInput}
                placeholder="50000"
                placeholderTextColor="#9CA3AF"
                value={mileage}
                onChangeText={setMileage}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
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
  },
  scrollContent: {
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

export default VehicleModelBottomSheet;
