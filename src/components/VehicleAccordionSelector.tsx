import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { convertToLineSeedFont } from '../styles/fonts';
import firebaseService from '../services/firebaseService';
import { handleFirebaseError, showUserError } from '../services/errorHandler';
import { SkeletonText, SkeletonImage } from './skeleton';
import ShimmerView from './skeleton/ShimmerView';

interface VehicleAccordionSelectorProps {
  visible: boolean;
  onComplete: (vehicle: CompletedVehicle) => void;
  onClose: () => void;
  editMode?: boolean; // 편집 모드 여부
}

export interface CompletedVehicle {
  // 표시용 이름 (기존 호환성)
  make: string;
  model: string;
  trim: string;
  year: number;
  batteryCapacity?: number | string;
  imageUrl?: string;
  
  // Firestore 조회용 ID (새로 추가)
  brandId: string;     // "audi"
  modelId: string;     // "q8-e-tron"  
  trimId: string;      // "55-quattro"
}

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

interface Model {
  id: string;
  name: string;
  imageUrl?: string;
}

interface Trim {
  trimId: string;
  trimName: string;
  batteryCapacity?: number | string;
  driveType?: string;
  years: (number | string)[];
}

const VehicleAccordionSelector: React.FC<VehicleAccordionSelectorProps> = ({
  visible,
  onComplete,
  onClose,
  editMode = false,
}) => {
  
  // Selection states
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedTrim, setSelectedTrim] = useState<Trim | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Data states
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [trims, setTrims] = useState<Trim[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  
  // 중복 호출 방지 및 안정성 상태
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isMountedRef = useRef(true);
  
  // Current active tab
  const [activeTab, setActiveTab] = useState<'brand' | 'model' | 'trim' | 'year'>('brand');
  
  // Breadcrumb scroll ref
  const breadcrumbScrollRef = useRef<ScrollView>(null);
  
  // Auto scroll breadcrumb when tab changes
  useEffect(() => {
    if (breadcrumbScrollRef.current) {
      const steps = getNavigationSteps();
      const activeIndex = steps.findIndex(step => step.key === activeTab);
      
      if (activeIndex > 0) {
        // 활성 탭이 가운데 오도록 스크롤
        const scrollX = Math.max(0, (activeIndex - 1) * 108); // 100px(버튼) + 8px(margin)
        breadcrumbScrollRef.current.scrollTo({ x: scrollX, animated: true });
      } else {
        // 첫 번째 탭이면 처음으로
        breadcrumbScrollRef.current.scrollTo({ x: 0, animated: true });
      }
    }
  }, [activeTab]);

  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load brands on mount
  useEffect(() => {
    if (visible && !hasError) {
      try {
        setHasError(false);
        loadBrands();
      } catch (error) {
        console.error('❌ VehicleAccordionSelector 초기화 오류:', error);
        setHasError(true);
      }
    }
  }, [visible, hasError]);

  const loadBrands = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setLoadingStep('브랜드 목록 로딩 중...');
      // console.log('🔄 브랜드 목록 로딩 시작');
      
      const brandsData = await firebaseService.getBrands();
      // console.log('✅ 브랜드 목록 로딩 완료:', brandsData.length);
      
      if (isMountedRef.current) {
        setBrands(brandsData);
      }
    } catch (error) {
      console.error('❌ 브랜드 로딩 오류:', error);
      if (isMountedRef.current) {
        setHasError(true);
        const errorMessage = handleFirebaseError(error, {
          actionName: 'load_brands'
        });
        Alert.alert('오류', errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setLoadingStep('');
      }
    }
  };

  const loadModels = async (brand: Brand) => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setLoadingStep(`${brand.name} 모델 로딩 중...`);
      // console.log(`🔄 모델 목록 로딩 시작: ${brand.name} (${brand.id})`);
      
      const modelsData = await firebaseService.getModels(brand.id);
      // console.log(`✅ 모델 목록 로딩 완료: ${modelsData.length}개`);
      
      if (isMountedRef.current) {
        setModels(modelsData);
      }
    } catch (error) {
      console.error('❌ 모델 로딩 오류:', error);
      if (isMountedRef.current) {
        const errorMessage = handleFirebaseError(error, {
          actionName: 'load_models',
          additionalData: { brandId: brand.id }
        });
        Alert.alert('오류', `${brand.name} ${errorMessage}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setLoadingStep('');
      }
    }
  };

  const loadTrims = async (brand: Brand, model: Model) => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      setLoadingStep(`${model.name} 트림 로딩 중...`);
      // console.log(`🔄 트림 목록 로딩 시작: ${brand.name} ${model.name}`);
      
      const trimsData = await firebaseService.getVehicleTrims(brand.id, model.id);
      // console.log(`✅ 트림 목록 로딩 완료: ${trimsData.length}개`);
      
      if (isMountedRef.current) {
        setTrims(trimsData);
      }
    } catch (error) {
      console.error('❌ 트림 로딩 오류:', error);
      if (isMountedRef.current) {
        const errorMessage = handleFirebaseError(error, {
          actionName: 'load_trims',
          additionalData: { brandId: selectedBrand?.id, modelId: model.id }
        });
        Alert.alert('오류', `${model.name} ${errorMessage}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setLoadingStep('');
      }
    }
  };

  // Selection handlers
  const handleBrandSelect = (brand: Brand) => {
    // console.log('🎯 브랜드 선택:', brand.name);
    setSelectedBrand(brand);
    setSelectedModel(null);
    setSelectedTrim(null);
    setSelectedYear(null);
    setModels([]);
    setTrims([]);
    loadModels(brand);
    setActiveTab('model');
  };

  const handleModelSelect = (model: Model) => {
    // console.log('🎯 모델 선택:', model.name);
    setSelectedModel(model);
    setSelectedTrim(null);
    setSelectedYear(null);
    setTrims([]);
    if (selectedBrand) {
      loadTrims(selectedBrand, model);
    }
    setActiveTab('trim');
  };

  const handleTrimSelect = (trim: Trim) => {
    // console.log('🎯 트림 선택:', trim.trimName);
    setSelectedTrim(trim);
    setSelectedYear(null);
    setActiveTab('year');
  };

  const handleYearSelect = (year: number) => {
    // console.log('🎯 연식 선택:', year);
    setSelectedYear(year);
  };

  const handleComplete = () => {
    if (isCompleting) {
      // console.log('⚠️ 이미 완료 처리 중, 중복 호출 방지');
      return;
    }

    if (!selectedBrand || !selectedModel || !selectedTrim || !selectedYear) {
      Alert.alert('알림', '모든 항목을 선택해주세요.');
      return;
    }

    try {
      setIsCompleting(true);
      // console.log('🎯 차량 선택 완료 처리 시작');

      const completedVehicle: CompletedVehicle = {
        make: selectedBrand.name,
        model: selectedModel.name,
        trim: selectedTrim.trimName,
        year: selectedYear,
        batteryCapacity: selectedTrim.batteryCapacity,
        imageUrl: selectedModel.imageUrl,
        brandId: selectedBrand.id,
        modelId: selectedModel.id,
        trimId: selectedTrim.trimId,
      };

      // console.log('✅ 차량 선택 완료:', completedVehicle);
      onComplete(completedVehicle);
    } catch (error) {
      console.error('❌ 차량 선택 완료 처리 오류:', error);
      Alert.alert('오류', '차량 선택 완료 중 오류가 발생했습니다.');
    } finally {
      // 1초 후 중복 방지 해제 (onComplete에서 모달이 닫힐 수 있으므로)
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsCompleting(false);
        }
      }, 1000);
    }
  };

  const handleReset = () => {
    // console.log('🔄 VehicleAccordionSelector 상태 리셋');
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedTrim(null);
    setSelectedYear(null);
    setModels([]);
    setTrims([]);
    setActiveTab('brand');
    setLoading(false);
    setLoadingStep('');
    setIsCompleting(false);
    setHasError(false);
  };

  useEffect(() => {
    if (visible) {
      // console.log('👁️ VehicleAccordionSelector visible 변경: true - 상태 리셋');
      handleReset();
    } else {
      // console.log('👁️ VehicleAccordionSelector visible 변경: false');
    }
  }, [visible]);

  // Navigation system
  const getNavigationSteps = () => {
    const steps = [
      { 
        key: 'brand', 
        title: '브랜드', 
        selected: selectedBrand?.name, 
        placeholder: '-',
        available: true 
      }
    ];
    if (selectedBrand) {
      steps.push({ 
        key: 'model', 
        title: '모델', 
        selected: selectedModel?.name,
        placeholder: '-',
        available: true 
      });
    }
    if (selectedModel) {
      steps.push({ 
        key: 'trim', 
        title: '트림', 
        selected: selectedTrim?.trimName,
        placeholder: '-',
        available: true 
      });
    }
    if (selectedTrim) {
      steps.push({ 
        key: 'year', 
        title: '연식', 
        selected: selectedYear ? `${selectedYear}` : undefined,
        placeholder: '-',
        available: true 
      });
    }
    return steps;
  };

  const renderBreadcrumbNavigation = () => {
    const steps = getNavigationSteps();
    
    return (
      <View style={styles.breadcrumbContainer}>
        <ScrollView 
          ref={breadcrumbScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.breadcrumbContent}
          style={styles.breadcrumbScroll}
          decelerationRate="fast"
        >
          {steps.map((step, index) => (
            <View key={step.key} style={styles.breadcrumbItem}>
              <TouchableOpacity
                style={[
                  styles.breadcrumbButton,
                  activeTab === step.key && styles.activeBreadcrumbButton,
                  step.selected && styles.completedBreadcrumbButton
                ]}
                onPress={() => setActiveTab(step.key as any)}
                activeOpacity={0.7}
              >
                <View style={styles.breadcrumbButtonContent}>
                  <Text style={[
                    styles.breadcrumbTitle,
                    convertToLineSeedFont(styles.breadcrumbTitle),
                    activeTab === step.key && styles.activeBreadcrumbTitle,
                    step.selected && styles.completedBreadcrumbTitle
                  ]}>
                    {step.title}
                  </Text>
                  <Text 
                    style={[
                      styles.breadcrumbSelected,
                      convertToLineSeedFont(styles.breadcrumbSelected),
                      !step.selected && styles.breadcrumbPlaceholder
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {step.selected || step.placeholder}
                  </Text>
                </View>
              </TouchableOpacity>
              {index < steps.length - 1 && (
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color="#D1D5DB" 
                  style={styles.breadcrumbArrow}
                />
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render current tab content
  const renderCurrentTabContent = () => {
    // 에러 상태일 때 에러 UI 표시
    if (hasError) {
      return renderErrorState();
    }
    
    // 로딩 중일 때 스켈레톤 표시
    if (loading) {
      return renderSkeletonList();
    }
    
    switch (activeTab) {
      case 'brand':
        return renderBrandList();
      case 'model':
        return renderModelList();
      case 'trim':
        return renderTrimList();
      case 'year':
        return renderYearList();
      default:
        return null;
    }
  };

  // 에러 상태 UI
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color="#EF4444" />
      <Text style={[styles.errorTitle, convertToLineSeedFont(styles.errorTitle)]}>
        데이터 로딩 오류
      </Text>
      <Text style={[styles.errorMessage, convertToLineSeedFont(styles.errorMessage)]}>
        차량 정보를 불러오는 중 오류가 발생했습니다.
      </Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => {
          setHasError(false);
          handleReset();
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh" size={20} color="#FFFFFF" />
        <Text style={[styles.retryButtonText, convertToLineSeedFont(styles.retryButtonText)]}>
          다시 시도
        </Text>
      </TouchableOpacity>
    </View>
  );


  // 스켈레톤 리스트 렌더링
  const renderSkeletonList = () => (
    <View style={styles.listContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={index}
          style={styles.listItem}
        >
          <SkeletonText width="100%" height={16} />
          <SkeletonImage width={16} height={16} borderRadius={8} />
        </View>
      ))}
    </View>
  );

  // Render components
  const renderBrandList = () => (
    <View style={styles.listContainer}>
      {brands.map((brand, index) => (
        <Animatable.View
          key={brand.id}
          animation="fadeInLeft"
          duration={200}
          delay={index * 30}
        >
          <TouchableOpacity
            style={[
              styles.listItem,
              selectedBrand?.id === brand.id && styles.selectedListItem
            ]}
            onPress={() => handleBrandSelect(brand)}
            activeOpacity={0.8}
          >
            <Text style={[styles.listItemText, convertToLineSeedFont(styles.listItemText)]}>
              {brand.name}
            </Text>
            <Ionicons 
              name={selectedBrand?.id === brand.id ? "checkmark" : "chevron-forward"} 
              size={16} 
              color={selectedBrand?.id === brand.id ? "#06B6D4" : "#9CA3AF"} 
            />
          </TouchableOpacity>
        </Animatable.View>
      ))}
    </View>
  );

  const renderModelList = () => (
    <View style={styles.listContainer}>
      {models.map((model, index) => (
        <Animatable.View
          key={model.id}
          animation="fadeInLeft"
          duration={200}
          delay={index * 30}
        >
          <TouchableOpacity
            style={[
              styles.listItem,
              selectedModel?.id === model.id && styles.selectedListItem
            ]}
            onPress={() => handleModelSelect(model)}
            activeOpacity={0.8}
          >
            <Text style={[styles.listItemText, convertToLineSeedFont(styles.listItemText)]}>
              {model.name}
            </Text>
            <Ionicons 
              name={selectedModel?.id === model.id ? "checkmark" : "chevron-forward"} 
              size={16} 
              color={selectedModel?.id === model.id ? "#06B6D4" : "#9CA3AF"} 
            />
          </TouchableOpacity>
        </Animatable.View>
      ))}
    </View>
  );

  const renderTrimList = () => {
    // console.log('🔍 트림 리스트 디버깅 - trims 배열:', trims);
    
    return (
      <View style={styles.listContainer}>
        {trims.map((trim, index) => {
          // console.log(`🔍 트림 [${index}] 디버깅:`, trim);
          // console.log(`🔍 트림명: ${trim.trimName}, trimId: ${trim.trimId}`);
          
          return (
        <Animatable.View
          key={`${trim.trimId}-${trim.years?.join('-') || index}`}
          animation="fadeInLeft"
          duration={200}
          delay={index * 30}
        >
          <TouchableOpacity
            style={[
              styles.listItem,
              selectedTrim?.trimId === trim.trimId && styles.selectedListItem
            ]}
            onPress={() => handleTrimSelect(trim)}
            activeOpacity={0.8}
          >
            <View style={styles.trimInfo}>
              <Text style={[styles.listItemText, convertToLineSeedFont(styles.listItemText)]}>
                {trim.trimName}
              </Text>
              {trim.batteryCapacity && (
                <Text style={[styles.trimSpec, convertToLineSeedFont(styles.trimSpec)]}>
                  {trim.batteryCapacity}kWh
                </Text>
              )}
            </View>
            <Ionicons 
              name={selectedTrim?.trimId === trim.trimId ? "checkmark" : "chevron-forward"} 
              size={16} 
              color={selectedTrim?.trimId === trim.trimId ? "#06B6D4" : "#9CA3AF"} 
            />
          </TouchableOpacity>
        </Animatable.View>
          );
        })}
      </View>
    );
  };

  const renderYearList = () => {
    // console.log('🔍 연식 디버깅 - selectedTrim:', selectedTrim);
    // console.log('🔍 연식 디버깅 - years 배열:', selectedTrim?.years);
    
    if (!selectedTrim || !selectedTrim.years) {
      // console.log('❌ selectedTrim 또는 years가 없음');
      return <Text>연식 데이터가 없습니다.</Text>;
    }
    
    const sortedYears = [...selectedTrim.years].sort((a, b) => Number(b) - Number(a));
    // console.log('🔍 연식 디버깅 - sortedYears:', sortedYears);

    return (
      <View style={styles.yearContainer}>
        <View style={styles.yearGrid}>
          {sortedYears.map((year, index) => {
            const yearNumber = typeof year === 'string' ? parseInt(year) : year;
            
            return (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearCard,
                  selectedYear === yearNumber && styles.selectedYearCard
                ]}
                onPress={() => handleYearSelect(yearNumber)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#374151', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                  {yearNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Inline Complete Button */}
        {selectedYear && (
          <Animatable.View
            animation="zoomIn"
            duration={400}
            style={styles.inlineCompleteContainer}
          >
            <TouchableOpacity
              style={styles.inlineCompleteButton}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#06B6D4', '#0891B2']}
                style={styles.inlineCompleteGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={[
                  styles.inlineCompleteText,
                  convertToLineSeedFont(styles.inlineCompleteText)
                ]}>
                  {selectedBrand?.name} {selectedModel?.name} {selectedYear} 추가
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        )}
      </View>
    );
  };

  const isCompleteReady = selectedBrand && selectedModel && selectedTrim && selectedYear;

  // Navigation helpers
  const getNextStep = () => {
    if (activeTab === 'brand' && selectedBrand) return 'model';
    if (activeTab === 'model' && selectedModel) return 'trim';
    if (activeTab === 'trim' && selectedTrim) return 'year';
    return null;
  };

  const getPrevStep = () => {
    if (activeTab === 'year') return 'trim';
    if (activeTab === 'trim') return 'model';
    if (activeTab === 'model') return 'brand';
    return null;
  };

  const canGoNext = () => {
    return getNextStep() !== null;
  };

  const canGoPrev = () => {
    return getPrevStep() !== null;
  };

  const handleNextStep = () => {
    const next = getNextStep();
    if (next) {
      setActiveTab(next as any);
    }
  };

  const handlePrevStep = () => {
    const prev = getPrevStep();
    if (prev) {
      setActiveTab(prev as any);
    }
  };

  const renderFloatingNavigation = () => {
    if (activeTab === 'brand' && !canGoNext() && !canGoPrev()) return null;
    
    return (
      <Animatable.View
        animation="fadeInUp"
        duration={300}
        style={styles.floatingNav}
      >
        {canGoPrev() && (
          <TouchableOpacity
            style={styles.floatingNavButton}
            onPress={handlePrevStep}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
            <Text style={[styles.floatingNavText, convertToLineSeedFont(styles.floatingNavText)]}>
              이전
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.floatingNavSpacer} />
        
        {canGoNext() && (
          <TouchableOpacity
            style={[styles.floatingNavButton, styles.floatingNavButtonNext]}
            onPress={handleNextStep}
            activeOpacity={0.7}
          >
            <Text style={[styles.floatingNavTextNext, convertToLineSeedFont(styles.floatingNavTextNext)]}>
              다음
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </Animatable.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, convertToLineSeedFont(styles.headerTitle)]}>
            {editMode ? '차량 변경' : '차량 추가'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>


        {/* Breadcrumb Navigation */}
        {renderBreadcrumbNavigation()}

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {/* Current Tab Content */}
          {renderCurrentTabContent()}


          {/* Floating Navigation */}
          {renderFloatingNavigation()}
        </ScrollView>

      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  breadcrumbContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  breadcrumbScroll: {
    paddingHorizontal: 28, // 56의 절반
  },
  breadcrumbContent: {
    alignItems: 'center',
    paddingRight: 20, // 오른쪽 끝까지 스크롤할 수 있도록
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: 120,
    minWidth: 90,
  },
  activeBreadcrumbButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#202632',
  },
  completedBreadcrumbButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#202632',
  },
  breadcrumbButtonContent: {
    flex: 1,
    alignItems: 'center',
  },
  breadcrumbTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#202632',
    textAlign: 'center',
  },
  activeBreadcrumbTitle: {
    color: '#202632',
  },
  completedBreadcrumbTitle: {
    color: '#202632',
  },
  breadcrumbSelected: {
    fontSize: 10,
    color: '#202632',
    marginTop: 2,
    textAlign: 'center',
  },
  breadcrumbPlaceholder: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  breadcrumbCheck: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  breadcrumbArrow: {
    marginHorizontal: 4,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  listContainer: {
    marginTop: 8,
    overflow: 'hidden',
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedListItem: {
    backgroundColor: '#EEF2FF',
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  trimInfo: {
    flex: 1,
  },
  trimSpec: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  yearContainer: {
    marginBottom: 20,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  yearCard: {
    width: '22%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '2.67%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 50,
  },
  selectedYearCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#06B6D4',
  },
  yearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  selectedYearText: {
    color: '#06B6D4',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  floatingNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  floatingNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingNavButtonNext: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  floatingNavText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  floatingNavTextNext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
  floatingNavSpacer: {
    flex: 1,
  },
  inlineCompleteContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  inlineCompleteButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  inlineCompleteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  inlineCompleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default VehicleAccordionSelector;