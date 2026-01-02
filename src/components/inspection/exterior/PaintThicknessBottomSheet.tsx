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
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { PaintThicknessInspection } from '../../../services/firebaseService';
import MultipleImagePicker from '../../MultipleImagePicker';
import StatusButtons from '../common/StatusButtons';

interface PaintThicknessBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: PaintThicknessInspection[]) => void;
  initialData?: PaintThicknessInspection[];
}

// 외판 수리/교체 확인 및 도막 측정 부위
const PAINT_LOCATIONS = [
  {
    key: 'hood',
    label: '후드(보닛)',
    recommended: '① 좌측 상단 (엠블럼 쪽 모서리에서 5~8cm 안쪽)\n② 우측 상단\n③ 중앙\n④ 좌측 하단 (휠하우스 쪽 8~10cm 위)\n⑤ 우측 하단',
    avoid: '모서리 2cm 이내, 본넷 끝단 라인, 엠블럼/몰딩/PPF 위'
  },
  {
    key: 'driver_front_fender',
    label: '운전석 프론트펜더',
    recommended: '① 휠 아치 위 5~8cm\n② 중앙 평면\n③ 헤드램프 쪽 8~12cm 뒤',
    avoid: '휠 아치 바로 모서리, 실리콘/언더코팅 가까운 하단'
  },
  {
    key: 'driver_front_door',
    label: '운전석 앞도어',
    recommended: '① 창문 아래 수평 라인 근처 (상부)\n② 손잡이 아래 평평한 면 (중부)\n③ 휠 방향 하단 8~12cm 위 (하부)',
    avoid: '손잡이 바로 주위, 도어 라인 바로 위/아래, 웨더스트립 가까운 상단'
  },
  {
    key: 'driver_side_sill_panel',
    label: '운전석 사이드실패널',
    recommended: '사이드실 중앙 평면부',
    avoid: '가장자리, 하단부 언더코팅 부분'
  },
  {
    key: 'driver_roof_panel',
    label: '운전석 루프패널',
    recommended: '① 중앙\n② 전면 쪽\n③ 후면 쪽\n\n※ 가장자리에서 6~10cm 안쪽',
    avoid: '선루프 유리 부분, 루프몰딩 바로 위, 루프랙 설치 자리'
  },
  {
    key: 'driver_rear_door',
    label: '운전석 뒷도어',
    recommended: '① 창문 아래 수평 라인 근처 (상부)\n② 손잡이 아래 평평한 면 (중부)\n③ 휠 방향 하단 8~12cm 위 (하부)',
    avoid: '손잡이 바로 주위, 도어 라인 바로 위/아래, 웨더스트립 가까운 상단'
  },
  {
    key: 'driver_rear_fender',
    label: '운전석 리어펜더',
    recommended: '① C필러 옆 평면\n② 휠 아치 상단 6~10cm 위\n③ 테일램프 옆 평면',
    avoid: '휠 아치 바로 모서리, 테일램프/유리 고무 몰딩 근처, 스폿 용접 자리'
  },
  {
    key: 'driver_a_pillar',
    label: '운전석 A필러',
    recommended: '앞유리 옆 필러 중앙 평면부 1점',
    avoid: '고무/도어 몰딩 위, 필러 엣지/곡면'
  },
  {
    key: 'driver_b_pillar',
    label: '운전석 B필러',
    recommended: '앞/뒷문 사이 필러 중앙 평면부 1점',
    avoid: '고무/도어 몰딩 위, 필러 엣지/곡면'
  },
  {
    key: 'driver_c_pillar',
    label: '운전석 C필러',
    recommended: '뒤유리 옆 필러 중앙 평면부 1점',
    avoid: '고무/도어 몰딩 위, 필러 엣지/곡면'
  },
  {
    key: 'trunk_lid',
    label: '트렁크 리드',
    recommended: '① 중앙\n② 좌측 상단\n③ 우측 상단\n④ 좌측 하단\n⑤ 우측 하단',
    avoid: '엣지 1~2cm, 엠블럼·스포일러 바로 아래, 테일램프 플라스틱 접합부'
  },
  {
    key: 'passenger_rear_fender',
    label: '동승석 리어펜더',
    recommended: '① C필러 옆 평면\n② 휠 아치 상단 6~10cm 위\n③ 테일램프 옆 평면',
    avoid: '휠 아치 바로 모서리, 테일램프/유리 고무 몰딩 근처, 스폿 용접 자리'
  },
  {
    key: 'passenger_rear_door',
    label: '동승석 뒷도어',
    recommended: '① 창문 아래 수평 라인 근처 (상부)\n② 손잡이 아래 평평한 면 (중부)\n③ 휠 방향 하단 8~12cm 위 (하부)',
    avoid: '손잡이 바로 주위, 도어 라인 바로 위/아래, 웨더스트립 가까운 상단'
  },
  {
    key: 'passenger_roof_panel',
    label: '동승석 루프패널',
    recommended: '① 중앙\n② 전면 쪽\n③ 후면 쪽\n\n※ 가장자리에서 6~10cm 안쪽',
    avoid: '선루프 유리 부분, 루프몰딩 바로 위, 루프랙 설치 자리'
  },
  {
    key: 'passenger_side_sill_panel',
    label: '동승석 사이드실패널',
    recommended: '사이드실 중앙 평면부',
    avoid: '가장자리, 하단부 언더코팅 부분'
  },
  {
    key: 'passenger_front_door',
    label: '동승석 앞도어',
    recommended: '① 창문 아래 수평 라인 근처 (상부)\n② 손잡이 아래 평평한 면 (중부)\n③ 휠 방향 하단 8~12cm 위 (하부)',
    avoid: '손잡이 바로 주위, 도어 라인 바로 위/아래, 웨더스트립 가까운 상단'
  },
  {
    key: 'passenger_a_pillar',
    label: '동승석 A필러',
    recommended: '앞유리 옆 필러 중앙 평면부 1점',
    avoid: '고무/도어 몰딩 위, 필러 엣지/곡면'
  },
  {
    key: 'passenger_b_pillar',
    label: '동승석 B필러',
    recommended: '앞/뒷문 사이 필러 중앙 평면부 1점',
    avoid: '고무/도어 몰딩 위, 필러 엣지/곡면'
  },
  {
    key: 'passenger_c_pillar',
    label: '동승석 C필러',
    recommended: '뒤유리 옆 필러 중앙 평면부 1점',
    avoid: '고무/도어 몰딩 위, 필러 엣지/곡면'
  },
  {
    key: 'passenger_front_fender',
    label: '동승석 프론트펜더',
    recommended: '① 휠 아치 위 5~8cm\n② 중앙 평면\n③ 헤드램프 쪽 8~12cm 뒤',
    avoid: '휠 아치 바로 모서리, 실리콘/언더코팅 가까운 하단'
  },
];

const PaintThicknessBottomSheet: React.FC<PaintThicknessBottomSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  initialData = [],
}) => {
  const insets = useSafeAreaInsets();
  const [paintData, setPaintData] = useState<Record<string, {
    thickness: string;
    status: 'good' | 'problem' | undefined;
    imageUris: string[];
    notes: string;
  }>>({});

  // 측정 위치 설명 모달 상태
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ label: string; recommended: string; avoid: string } | null>(null);

  useEffect(() => {
    if (visible) {
      const dataMap: Record<string, {
        thickness: string;
        status: 'good' | 'problem' | undefined;
        imageUris: string[];
        notes: string;
      }> = {};
      initialData.forEach((item) => {
        const location = PAINT_LOCATIONS.find(loc => loc.label === item.location);
        if (location) {
          dataMap[location.key] = {
            thickness: item.thickness?.toString() || '',
            status: item.status,
            imageUris: item.imageUris || [],
            notes: item.notes || '',
          };
        }
      });
      setPaintData(dataMap);
    }
  }, [visible, initialData]);

  const handleThicknessChange = (key: string, value: string) => {
    setPaintData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        thickness: value,
        status: prev[key]?.status,
        imageUris: prev[key]?.imageUris || [],
        notes: prev[key]?.notes || '',
      },
    }));
  };

  const handleStatusChange = (key: string, status: 'good' | 'problem' | undefined) => {
    setPaintData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        thickness: prev[key]?.thickness || '',
        status,
        imageUris: prev[key]?.imageUris || [],
        notes: prev[key]?.notes || '',
      },
    }));
  };

  const handleImagesAdded = (key: string, newUris: string[]) => {
    setPaintData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        thickness: prev[key]?.thickness || '',
        status: prev[key]?.status,
        imageUris: [...(prev[key]?.imageUris || []), ...newUris],
        notes: prev[key]?.notes || '',
      },
    }));
  };

  const handleImageRemoved = (key: string, index: number) => {
    setPaintData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        thickness: prev[key]?.thickness || '',
        status: prev[key]?.status,
        imageUris: (prev[key]?.imageUris || []).filter((_, i) => i !== index),
        notes: prev[key]?.notes || '',
      },
    }));
  };

  const handleImageEdited = (key: string, index: number, newUri: string) => {
    setPaintData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        thickness: prev[key]?.thickness || '',
        status: prev[key]?.status,
        imageUris: (prev[key]?.imageUris || []).map((uri, i) => i === index ? newUri : uri),
        notes: prev[key]?.notes || '',
      },
    }));
  };

  const handleNotesChange = (key: string, value: string) => {
    setPaintData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        thickness: prev[key]?.thickness || '',
        status: prev[key]?.status,
        imageUris: prev[key]?.imageUris || [],
        notes: value,
      },
    }));
  };

  const handleConfirm = () => {
    const result: PaintThicknessInspection[] = PAINT_LOCATIONS
      .filter(loc => {
        const data = paintData[loc.key];
        return data && (data.thickness || data.status || data.imageUris.length > 0);
      })
      .map(loc => {
        const data = paintData[loc.key];
        if (!data) {
          return {
            location: loc.label,
            thickness: undefined,
            status: undefined,
            imageUris: undefined,
            notes: undefined,
          };
        }
        return {
          location: loc.label,
          thickness: data.thickness ? parseFloat(data.thickness) : undefined,
          status: data.status,
          imageUris: data.imageUris.length > 0 ? data.imageUris : undefined,
          notes: data.notes || undefined,
        };
      });

    onConfirm(result);
    onClose();
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
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>외판 수리/교체 확인 및 도막 측정</Text>
            <TouchableOpacity onPress={handleConfirm} activeOpacity={0.7}>
              <Text style={styles.saveButton}>저장</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {PAINT_LOCATIONS.map((location) => {
              const data = paintData[location.key] || { thickness: '', status: undefined, imageUris: [], notes: '' };

              return (
                <View key={location.key} style={styles.paintCard}>
                  <View style={styles.paintTitleRow}>
                    <Text style={styles.paintTitle}>{location.label}</Text>
                    <TouchableOpacity
                      style={styles.tooltipButton}
                      onPress={() => {
                        setSelectedLocation({
                          label: location.label,
                          recommended: location.recommended,
                          avoid: location.avoid
                        });
                        setShowDescriptionModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  {/* 상태 선택 */}
                  <StatusButtons
                    status={data.status}
                    onStatusChange={(status) => handleStatusChange(location.key, status)}
                    problemLabel="문제 있음"
                  />

                  {/* 문제 있음일 때만 표시 */}
                  {data.status === 'problem' && (
                    <>
                      {/* 이미지 */}
                      <View style={styles.imageSection}>
                        <Text style={styles.inputLabel}>사진</Text>
                        <MultipleImagePicker
                          imageUris={data.imageUris}
                          onImagesAdded={(newUris) => handleImagesAdded(location.key, newUris)}
                          onImageRemoved={(index) => handleImageRemoved(location.key, index)}
                          onImageEdited={(index, newUri) => handleImageEdited(location.key, index, newUri)}
                          label="외판 사진"
                        />
                      </View>

                      {/* 도막 두께 */}
                      <Text style={styles.inputLabel}>도막 두께</Text>
                      <View style={styles.thicknessRow}>
                        <TextInput
                          style={[styles.textInput, styles.thicknessInput]}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          value={data.thickness}
                          onChangeText={(text) => handleThicknessChange(location.key, text)}
                          keyboardType="decimal-pad"
                        />
                        <Text style={styles.unit}>μm</Text>
                      </View>

                      {/* 특이사항 */}
                      <Text style={styles.inputLabel}>특이사항</Text>
                      <TextInput
                        style={[styles.textInput, styles.notesInput]}
                        placeholder="특이사항을 입력하세요"
                        placeholderTextColor="#9CA3AF"
                        value={data.notes}
                        onChangeText={(text) => handleNotesChange(location.key, text)}
                        multiline
                        textAlignVertical="top"
                        returnKeyType="done"
                        blurOnSubmit={true}
                        onSubmitEditing={Keyboard.dismiss}
                      />
                    </>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* 측정 위치 설명 모달 */}
      <Modal
        visible={showDescriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.descriptionModalOverlay}>
          <View style={styles.descriptionModalContent}>
            <View style={styles.descriptionModalHeader}>
              <Text style={styles.descriptionModalTitle}>
                {selectedLocation?.label || '측정 위치'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowDescriptionModal(false)}
                style={styles.descriptionModalCloseButton}
              >
                <Ionicons name="close" size={28} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.descriptionModalBody}>
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionSectionTitle}>추천 위치</Text>
                <Text style={styles.descriptionSectionText}>
                  {selectedLocation?.recommended}
                </Text>
              </View>

              <View style={styles.descriptionDivider} />

              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionSectionTitle}>피해야 할 곳</Text>
                <Text style={styles.descriptionSectionText}>
                  {selectedLocation?.avoid}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: 16,
  },
  paintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paintTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paintTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  tooltipButton: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 12,
  },
  thicknessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  thicknessInput: {
    flex: 1,
  },
  unit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  imageSection: {
    marginTop: 12,
  },
  notesInput: {
    minHeight: 60,
  },
  // 측정 위치 설명 모달 스타일
  descriptionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  descriptionModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  descriptionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  descriptionModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  descriptionModalCloseButton: {
    padding: 4,
  },
  descriptionModalBody: {
    padding: 20,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  descriptionSectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  descriptionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
});

export default PaintThicknessBottomSheet;
