import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VEHICLE_BRANDS, VEHICLE_MODELS, getBrandById, getModelsByBrand } from '../constants/vehicles';

const { height: screenHeight } = Dimensions.get('window');

export interface Vehicle {
  id: string;
  make: string; // 제조사 (현대, 기아, 테슬라 등)
  model: string; // 모델명 (아이오닉 5, EV6 등)
  year: number; // 대표 연식 (최신)
  availableYears?: number[]; // 사용 가능한 모든 연식
  batteryCapacity?: string; // 배터리 용량
  range?: string; // 주행거리
  image?: string; // 차량 이미지 URL
}

interface VehicleSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  editMode?: boolean;
  existingVehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    batteryCapacity?: string;
    range?: string;
  };
}

// 차량 데이터를 그룹화된 형태로 변환하는 함수
const generateGroupedVehicleData = (): Vehicle[] => {
  const groupedVehicles: Vehicle[] = [];
  let id = 1;
  
  VEHICLE_BRANDS.forEach(brand => {
    const models = getModelsByBrand(brand.id);
    models.forEach(model => {
      // 각 모델당 하나의 항목만 생성 (연식은 배열로 저장)
      groupedVehicles.push({
        id: String(id++),
        make: brand.name,
        model: model.name,
        year: parseInt(model.years[model.years.length - 1] || '2024'), // 최신 연식을 대표로 표시
        availableYears: model.years.map(year => parseInt(year)), // 사용 가능한 모든 연식
      });
    });
  });
  
  return groupedVehicles;
};

// 모든 차량 데이터 생성 (그룹화된 형태)
const ALL_VEHICLES: Vehicle[] = generateGroupedVehicleData();

const VehicleSearchModal: React.FC<VehicleSearchModalProps> = ({
  visible,
  onClose,
  onSelectVehicle,
  editMode = false,
  existingVehicle,
}) => {
  const [searchQuery, setSearchQuery] = useState(editMode && existingVehicle ? `${existingVehicle.make} ${existingVehicle.model}` : '');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(ALL_VEHICLES);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showYearSelection, setShowYearSelection] = useState(false);

  // 검색 필터링
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVehicles(ALL_VEHICLES);
    } else {
      const filtered = ALL_VEHICLES.filter(vehicle =>
        vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVehicles(filtered);
    }
  }, [searchQuery]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    // 여러 연식이 있으면 연식 선택 화면으로 이동
    if (vehicle.availableYears && vehicle.availableYears.length > 1) {
      setSelectedVehicle(vehicle);
      setShowYearSelection(true);
      return;
    }
    
    // 연식이 하나만 있으면 바로 선택
    const finalVehicle = {
      ...vehicle,
      year: vehicle.availableYears?.[0] || vehicle.year
    };
    
    confirmVehicleSelection(finalVehicle);
  };

  const handleSelectYear = (year: number) => {
    if (!selectedVehicle) return;
    
    const finalVehicle = {
      ...selectedVehicle,
      year: year
    };
    
    setShowYearSelection(false);
    confirmVehicleSelection(finalVehicle);
  };

  const confirmVehicleSelection = (vehicle: Vehicle) => {
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
            onSelectVehicle(vehicle);
            onClose();
            setSearchQuery('');
          },
        },
      ]
    );
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => {
    const getYearText = () => {
      if (!item.availableYears || item.availableYears.length <= 1) {
        return `${item.year}년형`;
      }
      
      const sortedYears = item.availableYears.sort((a, b) => b - a);
      const minYear = sortedYears[sortedYears.length - 1];
      const maxYear = sortedYears[0];
      
      if (minYear === maxYear) {
        return `${minYear}년형`;
      }
      
      return `${minYear}-${maxYear}년 (${sortedYears.length}개 연식)`;
    };

    return (
      <TouchableOpacity
        style={styles.vehicleItem}
        onPress={() => handleSelectVehicle(item)}
        activeOpacity={0.7}
      >
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleIcon}>
            <Ionicons name="car" size={24} color="#4495E8" />
          </View>
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleName}>{item.make} {item.model}</Text>
            <Text style={styles.vehicleYear}>{getYearText()}</Text>
            {item.batteryCapacity && item.range && (
              <Text style={styles.vehicleSpecs}>
                {item.batteryCapacity} • {item.range}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>{editMode ? '차량 변경' : '차량 선택'}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 검색 입력 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="차량 제조사 또는 모델명 검색"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 차량 목록 */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4495E8" />
              <Text style={styles.loadingText}>차량 정보를 불러오는 중...</Text>
            </View>
          ) : filteredVehicles.length > 0 ? (
            <FlatList
              data={filteredVehicles}
              renderItem={renderVehicleItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="car-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noResultsTitle}>검색 결과가 없습니다</Text>
              <Text style={styles.noResultsSubtitle}>
                다른 차량명으로 검색해보세요
              </Text>
            </View>
          )}
        </View>

        {/* 안내 텍스트 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            찾으시는 차량이 없으신가요? 고객센터로 문의주시면 도움드리겠습니다.
          </Text>
        </View>
      </SafeAreaView>

      {/* 연식 선택 모달 */}
      <Modal
        visible={showYearSelection}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowYearSelection(false)}
      >
        <View style={styles.yearModalOverlay}>
          <View style={styles.yearModalContainer}>
            <View style={styles.yearModalHeader}>
              <Text style={styles.yearModalTitle}>
                {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : ''}
              </Text>
              <Text style={styles.yearModalSubtitle}>연식을 선택해주세요</Text>
            </View>
            
            <ScrollView 
              style={styles.yearListContainer}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {selectedVehicle?.availableYears?.sort((a, b) => b - a).map((year) => (
                <TouchableOpacity
                  key={year}
                  style={styles.yearItem}
                  onPress={() => handleSelectYear(year)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.yearText}>{year}년형</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.yearModalCloseButton}
              onPress={() => setShowYearSelection(false)}
            >
              <Text style={styles.yearModalCloseText}>취소</Text>
            </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F0F8FF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  vehicleYear: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  vehicleSpecs: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  // 연식 선택 모달 스타일
  yearModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  yearModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 340,
    maxHeight: '60%',
    minHeight: 200,
  },
  yearModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  yearModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  yearModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  yearListContainer: {
    maxHeight: 250,
    flexGrow: 0,
  },
  yearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  yearText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  yearModalCloseButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  yearModalCloseText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default VehicleSearchModal;