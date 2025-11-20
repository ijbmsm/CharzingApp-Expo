import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { type Vehicle, type VehicleVariant, type VehicleGroup } from '../types';

const { height: screenHeight } = Dimensions.get('window');

interface YearSelectionModalProps {
  visible: boolean;
  selectedVariant: VehicleVariant | null;
  selectedGroup: VehicleGroup | null;
  yearSpecs: {[year: number]: string};
  editMode?: boolean;
  onClose: () => void;
  onYearSelect: (vehicle: Vehicle) => void;
  onBackFromYearSelection?: () => void;
}

const YearSelectionModal: React.FC<YearSelectionModalProps> = ({
  visible,
  selectedVariant,
  selectedGroup,
  yearSpecs,
  editMode = false,
  onClose,
  onYearSelect,
  onBackFromYearSelection,
}) => {
  const handleSelectVehicle = (year: number) => {
    if (!selectedVariant || !selectedGroup) return;

    const vehicle: Vehicle = {
      id: `${selectedGroup.id}-${selectedVariant.id}-${year}`,
      make: selectedGroup.make,
      model: selectedGroup.baseModel,
      year: year,
      batteryCapacity: selectedVariant.batteryCapacity,
      range: selectedVariant.range,
      trim: selectedVariant.variantName,
      trimId: selectedVariant.id,
      availableYears: selectedVariant.availableYears,
    };

    const title = editMode ? '차량 변경' : '차량 선택';
    const message = editMode 
      ? `차량 정보를 ${vehicle.make} ${vehicle.model} (${vehicle.year})로 변경하시겠습니까?`
      : `${vehicle.make} ${vehicle.model} (${vehicle.year})을(를) 내 차량으로 추가하시겠습니까?`;
    const confirmText = editMode ? '변경' : '추가';
    
    Alert.alert(
      title,
      message,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: confirmText,
          onPress: () => {
            onYearSelect(vehicle);
          },
        },
      ]
    );
  };

  if (!selectedVariant || !selectedGroup) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          {onBackFromYearSelection ? (
            <TouchableOpacity onPress={onBackFromYearSelection} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          )}
          
          <Text style={[styles.title, convertToLineSeedFont(styles.title)]}>
            연식 선택
          </Text>
          
          <View style={styles.placeholder} />
        </View>

        {/* 선택된 차량 정보 */}
        <View style={styles.selectedVehicleInfo}>
          <Text style={[styles.vehicleTitle, convertToLineSeedFont(styles.vehicleTitle)]}>
            {selectedGroup.baseModel} {selectedVariant.variantName}
          </Text>
          <Text style={[styles.vehicleSubtitle, convertToLineSeedFont(styles.vehicleSubtitle)]}>
            {selectedGroup.make}
          </Text>
        </View>

        {/* 연식 목록 */}
        <ScrollView 
          style={styles.yearList}
          contentContainerStyle={styles.yearListContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedVariant.availableYears?.map((year) => (
            <Animatable.View
              key={year}
      animation="fadeIn"
      >
              <TouchableOpacity
                style={styles.yearItem}
                onPress={() => handleSelectVehicle(year)}
                activeOpacity={0.7}
              >
                <View style={styles.yearItemContent}>
                  <Text style={[styles.yearText, convertToLineSeedFont(styles.yearText)]}>
                    {year}년형
                  </Text>
                  {yearSpecs[year] && (
                    <Text style={[styles.yearSpecs, convertToLineSeedFont(styles.yearSpecs)]}>
                      {yearSpecs[year]}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </ScrollView>

        {/* 취소 버튼 */}
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={[styles.cancelButtonText, convertToLineSeedFont(styles.cancelButtonText)]}>
            취소
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  selectedVehicleInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  vehicleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  vehicleSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  yearList: {
    flex: 1,
  },
  yearListContent: {
    padding: 16,
  },
  yearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  yearItemContent: {
    flex: 1,
  },
  yearText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  yearSpecs: {
    fontSize: 12,
    color: '#6B7280',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default YearSelectionModal;