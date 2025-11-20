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
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TireTreadInspection } from '../../adminWeb/index';
import MultipleImagePicker from './MultipleImagePicker';

interface TireTreadBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: TireTreadInspection[]) => void;
  initialData?: TireTreadInspection[];
}

type TirePosition = 'front_left' | 'front_right' | 'rear_left' | 'rear_right';
type TireCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'replace_needed';

const TIRE_POSITIONS: { key: TirePosition; label: string }[] = [
  { key: 'front_left', label: '앞 좌측' },
  { key: 'front_right', label: '앞 우측' },
  { key: 'rear_left', label: '뒤 좌측' },
  { key: 'rear_right', label: '뒤 우측' },
];

const TIRE_CONDITIONS: { value: TireCondition; label: string; color: string; range: string }[] = [
  { value: 'excellent', label: '최상', color: '#10B981', range: '8~9mm' },
  { value: 'good', label: '양호', color: '#06B6D4', range: '5.5~8mm' },
  { value: 'fair', label: '보통', color: '#F59E0B', range: '4~5.5mm' },
  { value: 'poor', label: '나쁨', color: '#F97316', range: '3~4mm' },
  { value: 'replace_needed', label: '교체 권장', color: '#EF4444', range: '3mm 이하' },
];

const TireTreadBottomSheet: React.FC<TireTreadBottomSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  initialData = [],
}) => {
  const insets = useSafeAreaInsets();
  const [tireData, setTireData] = useState<Record<TirePosition, {
    treadDepth: string;
    notes: string;
    imageUris: string[];
  }>>({
    front_left: { treadDepth: '', notes: '', imageUris: [] },
    front_right: { treadDepth: '', notes: '', imageUris: [] },
    rear_left: { treadDepth: '', notes: '', imageUris: [] },
    rear_right: { treadDepth: '', notes: '', imageUris: [] },
  });

  useEffect(() => {
    if (visible && initialData.length > 0) {
      const newData = { ...tireData };
      initialData.forEach((item) => {
        newData[item.position] = {
          treadDepth: item.treadDepth.toString(),
          notes: item.notes || '',
          imageUris: item.imageUris || [],
        };
      });
      setTireData(newData);
    }
  }, [visible, initialData]);

  // 트레드 깊이에 따라 자동으로 상태 계산
  const getConditionFromDepth = (depth: string): TireCondition => {
    if (!depth) return 'good';
    const value = parseFloat(depth);
    if (isNaN(value)) return 'good';
    if (value >= 8) return 'excellent';
    if (value >= 5.5) return 'good';
    if (value >= 4) return 'fair';
    if (value >= 3) return 'poor';
    return 'replace_needed';
  };

  // 상태에 따른 라벨 반환
  const getConditionLabel = (condition: TireCondition): string => {
    const found = TIRE_CONDITIONS.find(c => c.value === condition);
    return found ? `${found.label} (${found.range})` : '';
  };

  // 상태에 따른 색상 반환
  const getConditionColor = (condition: TireCondition): string => {
    const found = TIRE_CONDITIONS.find(c => c.value === condition);
    return found ? found.color : '#6B7280';
  };

  const handleTreadDepthChange = (position: TirePosition, value: string) => {
    setTireData(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        treadDepth: value,
      },
    }));
  };

  const handleNotesChange = (position: TirePosition, value: string) => {
    setTireData(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        notes: value,
      },
    }));
  };

  const handleImagesAdded = (position: TirePosition, newUris: string[]) => {
    setTireData(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        imageUris: [...prev[position].imageUris, ...newUris],
      },
    }));
  };

  const handleImageRemoved = (position: TirePosition, index: number) => {
    setTireData(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        imageUris: prev[position].imageUris.filter((_, i) => i !== index),
      },
    }));
  };

  const handleImageEdited = (position: TirePosition, index: number, newUri: string) => {
    setTireData(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        imageUris: prev[position].imageUris.map((uri, i) => i === index ? newUri : uri),
      },
    }));
  };

  const handleConfirm = () => {
    const result: TireTreadInspection[] = TIRE_POSITIONS
      .filter(pos => tireData[pos.key].treadDepth)
      .map(pos => {
        const depth = tireData[pos.key].treadDepth;
        const data = tireData[pos.key];
        return {
          position: pos.key,
          treadDepth: parseFloat(depth),
          wearPattern: 'normal',
          condition: getConditionFromDepth(depth),
          imageUris: data.imageUris.length > 0 ? data.imageUris : undefined,
          notes: data.notes || undefined,
        };
      });

    onConfirm(result);
    onClose();
  };

  const getTreadDepthColor = (depth: string) => {
    if (!depth) return '#E5E7EB';
    const value = parseFloat(depth);
    if (isNaN(value)) return '#E5E7EB';
    if (value >= 8) return '#10B981'; // 최상
    if (value >= 5.5) return '#06B6D4'; // 양호
    if (value >= 4) return '#F59E0B'; // 보통
    if (value >= 3) return '#F97316'; // 나쁨
    return '#EF4444'; // 교체 권장
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>타이어 트레드 깊이 측정</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 안내 문구 */}
            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>※ 운전석에 앉은 사람 기준</Text>
            </View>

            {TIRE_POSITIONS.map((position) => {
              const data = tireData[position.key];

              return (
                <View key={position.key} style={styles.tireCard}>
                  <Text style={styles.tireTitle}>{position.label}</Text>

                  {/* 트레드 깊이 */}
                  <Text style={styles.inputLabel}>트레드 깊이 *</Text>
                  <View style={styles.depthRow}>
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.depthInput,
                        { borderColor: getTreadDepthColor(data.treadDepth) },
                      ]}
                      placeholder="0.0"
                      placeholderTextColor="#9CA3AF"
                      value={data.treadDepth}
                      onChangeText={(text) => handleTreadDepthChange(position.key, text)}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                    <Text style={styles.unit}>mm</Text>
                  </View>

                  {/* 자동 계산된 상태 */}
                  {data.treadDepth && (
                    <View style={styles.statusDisplay}>
                      <Text style={styles.inputLabel}>상태</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getConditionColor(getConditionFromDepth(data.treadDepth)) },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {getConditionLabel(getConditionFromDepth(data.treadDepth))}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 타이어 이미지 */}
                  <View style={styles.imageSection}>
                    <Text style={styles.inputLabel}>타이어 사진 (선택)</Text>
                    <MultipleImagePicker
                      imageUris={data.imageUris}
                      onImagesAdded={(newUris) => handleImagesAdded(position.key, newUris)}
                      onImageRemoved={(index) => handleImageRemoved(position.key, index)}
                      onImageEdited={(index, newUri) => handleImageEdited(position.key, index, newUri)}
                      label="타이어 사진"
                    />
                  </View>

                  {/* 특이사항 */}
                  <Text style={styles.inputLabel}>특이사항 (선택)</Text>
                  <TextInput
                    style={[styles.textInput, styles.notesInput]}
                    placeholder="특이사항을 입력하세요"
                    placeholderTextColor="#9CA3AF"
                    value={data.notes}
                    onChangeText={(text) => handleNotesChange(position.key, text)}
                    multiline
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit={true}
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
              );
            })}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: 8 + insets.bottom }]}>
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
  infoNote: {
    marginBottom: 16,
  },
  infoNoteText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  tireCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tireTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 12,
  },
  depthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  depthInput: {
    flex: 1,
  },
  unit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusDisplay: {
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  imageSection: {
    marginTop: 12,
  },
  notesInput: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default TireTreadBottomSheet;
