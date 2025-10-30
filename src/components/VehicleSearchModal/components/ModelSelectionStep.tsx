import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { type VehicleGroup, type VehicleVariant } from '../types';

const { height: screenHeight } = Dimensions.get('window');

interface ModelSelectionStepProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredVehicleGroups: VehicleGroup[];
  expandedGroups: Set<string>;
  isLoading: boolean;
  onToggleGroup: (groupId: string) => void;
  onVariantSelect: (variant: VehicleVariant, group: VehicleGroup) => void;
}

const ModelSelectionStep: React.FC<ModelSelectionStepProps> = ({
  searchQuery,
  onSearchChange,
  filteredVehicleGroups,
  expandedGroups,
  isLoading,
  onToggleGroup,
  onVariantSelect,
}) => {
  const currentVehicleGroupsRef = useRef<VehicleGroup[]>([]);

  // 검색 필터링
  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      // 검색어가 없으면 전체 그룹 표시
      return;
    }
    
    const filtered = currentVehicleGroupsRef.current.filter(group =>
      group.baseModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.make.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // 여기서는 상위 컴포넌트에서 처리하도록 콜백 필요
  }, [searchQuery]);

  const renderVehicleItem = (variant: VehicleVariant, group: VehicleGroup) => (
    <TouchableOpacity
      key={variant.id}
      style={styles.vehicleItem}
      onPress={() => onVariantSelect(variant, group)}
      activeOpacity={0.7}
    >
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleImageContainer}>
          {group.imageUrl ? (
            <Image 
              source={{ uri: group.imageUrl }} 
              style={styles.vehicleImage}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="car-outline" size={40} color="#9CA3AF" />
          )}
        </View>
        
        <View style={styles.vehicleDetails}>
          <Text style={[styles.vehicleModel, convertToLineSeedFont(styles.vehicleModel)]}>
            {variant.fullModel}
          </Text>
          
          {variant.batteryCapacity && (
            <Text style={[styles.vehicleSpecs, convertToLineSeedFont(styles.vehicleSpecs)]}>
              배터리: {variant.batteryCapacity}
            </Text>
          )}
          
          {variant.range && (
            <Text style={[styles.vehicleSpecs, convertToLineSeedFont(styles.vehicleSpecs)]}>
              주행거리: {variant.range}
            </Text>
          )}
          
          {variant.availableYears && variant.availableYears.length > 0 && (
            <Text style={[styles.vehicleYears, convertToLineSeedFont(styles.vehicleYears)]}>
              {Math.min(...variant.availableYears)}-{Math.max(...variant.availableYears)}년형
            </Text>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderVehicleGroup = (group: VehicleGroup) => {
    const isExpanded = expandedGroups.has(group.id);
    const isLoadingTrims = group.variants.length === 1 && 
                          group.variants[0]?.variantName === '트림 로딩 중...';

    return (
      <MotiView
        key={group.id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.groupContainer}
      >
        {/* 그룹 헤더 */}
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => onToggleGroup(group.id)}
          activeOpacity={0.7}
        >
          <View style={styles.groupInfo}>
            <View style={styles.groupImageContainer}>
              {group.imageUrl ? (
                <Image 
                  source={{ uri: group.imageUrl }} 
                  style={styles.groupImage}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="car-outline" size={32} color="#9CA3AF" />
              )}
            </View>
            
            <View style={styles.groupDetails}>
              <Text style={[styles.groupTitle, convertToLineSeedFont(styles.groupTitle)]}>
                {group.baseModel}
              </Text>
              <Text style={[styles.groupSubtitle, convertToLineSeedFont(styles.groupSubtitle)]}>
                {group.make}
              </Text>
            </View>
          </View>
          
          <View style={styles.groupActions}>
            {isLoadingTrims ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#9CA3AF" 
              />
            )}
          </View>
        </TouchableOpacity>

        {/* 확장된 트림 목록 */}
        <AnimatePresence>
          {isExpanded && !isLoadingTrims && (
            <MotiView
              from={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.expandedContent}
            >
              {group.variants.map(variant => renderVehicleItem(variant, group))}
            </MotiView>
          )}
        </AnimatePresence>
      </MotiView>
    );
  };

  return (
    <MotiView
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.container}
    >
      {/* 검색 입력 */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 100 }}
        style={styles.searchContainer}
      >
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="모델명 검색"
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </MotiView>

      {/* 차량 목록 */}
      <ScrollView 
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={[styles.loadingText, convertToLineSeedFont(styles.loadingText)]}>
              모델 목록을 불러오는 중...
            </Text>
          </View>
        ) : filteredVehicleGroups.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="car-outline" size={64} color="#9CA3AF" />
            <Text style={[styles.noResultsTitle, convertToLineSeedFont(styles.noResultsTitle)]}>
              {searchQuery ? '검색 결과가 없습니다' : '모델이 없습니다'}
            </Text>
            <Text style={[styles.noResultsSubtitle, convertToLineSeedFont(styles.noResultsSubtitle)]}>
              {searchQuery ? '다른 검색어를 시도해보세요' : '다른 브랜드를 선택해보세요'}
            </Text>
          </View>
        ) : (
          filteredVehicleGroups.map(group => renderVehicleGroup(group))
        )}
      </ScrollView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  groupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupImageContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupImage: {
    width: 40,
    height: 40,
  },
  groupDetails: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  groupSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  groupActions: {
    marginLeft: 12,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleImageContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleImage: {
    width: 32,
    height: 32,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  vehicleSpecs: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  vehicleYears: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default ModelSelectionStep;