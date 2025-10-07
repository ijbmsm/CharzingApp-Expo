import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import StepIndicator from 'react-native-step-indicator';
import Header from '../components/Header';
import AddVehicleCard from '../components/AddVehicleCard';
import VehicleSearchModal, { Vehicle } from '../components/VehicleSearchModal';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import firebaseService, { DiagnosisReservation, VehicleDiagnosisReport, UserVehicle } from '../services/firebaseService';
import logger from '../services/logService';
import analyticsService from '../services/analyticsService';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  
  // 메모리 누수 방지를 위한 마운트 상태 추적 (컴포넌트 레벨)
  const isMountedRef = useRef(true);
  
  const [latestReservation, setLatestReservation] = useState<DiagnosisReservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleReport, setVehicleReport] = useState<VehicleDiagnosisReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleModalEditMode, setVehicleModalEditMode] = useState(false);
  const [userVehicles, setUserVehicles] = useState<UserVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // 차량 상세 모달 관련 상태
  const [showVehicleDetail, setShowVehicleDetail] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<UserVehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState(false);
  
  // 모달 애니메이션 상태
  const fadeAnim = useRef(new Animated.Value(0)).current; // 배경 오버레이 페이드
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current; // 모달 슬라이드

  // 컴포넌트 언마운트 시 정리 및 Analytics 화면 추적
  useEffect(() => {
    // 홈 화면 조회 추적
    analyticsService.logScreenView('HomeScreen', 'HomeScreen').catch((error) => {
      console.error('❌ 홈 화면 조회 추적 실패:', error);
    });

    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // 상태에 따른 단계 매핑
  const getStepFromStatus = (status: DiagnosisReservation['status']): number => {
    switch (status) {
      case 'pending':
        return 0; // 접수완료
      case 'confirmed':
        return 1; // 예약됨
      case 'completed':
        return 2; // 완료
      case 'cancelled':
        return -1; // 취소됨 (표시하지 않음)
      default:
        return 0;
    }
  };
  
  // 현재 진행 단계
  const currentStep = latestReservation ? getStepFromStatus(latestReservation.status) : -1;
  
  // 완료된 예약에 대한 진단 리포트 조회 (메모리 누수 방지)
  const loadVehicleReport = async (reservationId: string, isMountedRef: { current: boolean }) => {
    if (!isMountedRef.current) return;
    
    try {
      if (isMountedRef.current) {
        setReportLoading(true);
      }
      
      const report = await firebaseService.getReservationVehicleDiagnosisReport(reservationId);
      
      if (isMountedRef.current) {
        setVehicleReport(report);
      }
    } catch (error) {
      logger.error('DIAGNOSIS_REPORT', 'Failed to load vehicle diagnosis report', { reservationId, error }, user?.uid);
      if (isMountedRef.current) {
        setVehicleReport(null);
      }
    } finally {
      if (isMountedRef.current) {
        setReportLoading(false);
      }
    }
  };

  // 사용자 차량 목록 조회 (메모리 누수 방지)
  const loadUserVehicles = async (isMountedRef: { current: boolean }) => {
    if (!isAuthenticated || !user) {
      if (isMountedRef.current) {
        setUserVehicles([]);
      }
      return;
    }

    if (!isMountedRef.current) return;

    try {
      if (isMountedRef.current) {
        setVehiclesLoading(true);
      }
      
      logger.userAction('load_user_vehicles', user.uid);
      const vehicles = await firebaseService.getUserVehicles(user.uid);
      
      if (isMountedRef.current) {
        setUserVehicles(vehicles);
        logger.debug('VEHICLE', 'User vehicles loaded successfully', { count: vehicles.length }, user.uid);
      }
    } catch (error) {
      logger.error('VEHICLE', 'Failed to load user vehicles', { error }, user?.uid);
      if (isMountedRef.current) {
        setUserVehicles([]);
      }
    } finally {
      if (isMountedRef.current) {
        setVehiclesLoading(false);
      }
    }
  };

  // 사용자의 최신 예약 정보 로드 (메모리 누수 방지 개선)
  useEffect(() => {
    const loadLatestReservation = async () => {
      if (!isAuthenticated || !user) {
        if (isMountedRef.current) {
          setLatestReservation(null);
          setVehicleReport(null);
        }
        return;
      }

      if (isMountedRef.current) {
        setIsLoading(true);
      }
      
      try {
        const reservations = await firebaseService.getUserDiagnosisReservations(user.uid);
        
        if (!isMountedRef.current) return; // 언마운트되면 상태 업데이트 중단
        
        // 취소되지 않은 가장 최신 예약 찾기
        const activeReservation = reservations.find(r => r.status !== 'cancelled');
        setLatestReservation(activeReservation || null);
        
        // 완료된 예약이 있으면 진단 리포트 로드
        if (activeReservation && activeReservation.status === 'completed') {
          loadVehicleReport(activeReservation.id, isMountedRef);
        } else {
          setVehicleReport(null);
        }
        
      } catch (error) {
        if (isMountedRef.current) {
          logger.error('RESERVATION', 'Failed to load reservation info', { error }, user?.uid);
          setLatestReservation(null);
          setVehicleReport(null);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadLatestReservation();
    loadUserVehicles(isMountedRef);
  }, [isAuthenticated, user]);

  // Pull-to-refresh 함수
  const onRefresh = async () => {
    if (!isMountedRef.current) return;
    
    try {
      if (isMountedRef.current) {
        setRefreshing(true);
      }
      
      logger.userAction('refresh_home_screen', user?.uid);
      
      // 모든 데이터를 병렬로 새로고침
      const promises = [];
      
      // 예약 정보 새로고침
      if (isAuthenticated && user) {
        const reservationPromise = (async () => {
          try {
            const reservations = await firebaseService.getUserDiagnosisReservations(user.uid);
            
            if (!isMountedRef.current) return;
            
            // 취소되지 않은 가장 최신 예약 찾기
            const activeReservation = reservations.find(r => r.status !== 'cancelled');
            setLatestReservation(activeReservation || null);
            
            // 완료된 예약이 있으면 진단 리포트 로드
            if (activeReservation && activeReservation.status === 'completed') {
              await loadVehicleReport(activeReservation.id, isMountedRef);
            } else if (isMountedRef.current) {
              setVehicleReport(null);
            }
          } catch (error) {
            logger.error('RESERVATION', 'Failed to refresh reservation info', { error }, user?.uid);
          }
        })();
        
        // 차량 목록 새로고침
        const vehiclesPromise = loadUserVehicles(isMountedRef);
        
        promises.push(reservationPromise, vehiclesPromise);
      }
      
      await Promise.all(promises);
      
      logger.debug('UI', 'Home screen refresh completed', undefined, user?.uid);
      
    } catch (error) {
      logger.error('UI', 'Home screen refresh failed', { error }, user?.uid);
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  };

  // 차량 클릭 시 상세 모달 열기
  const openVehicleDetail = (vehicle: UserVehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleDetail(true);
    
    // 애니메이션 시작
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 차량 상세 모달 닫기
  const closeVehicleDetail = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowVehicleDetail(false);
      setSelectedVehicle(null);
    });
  };

  // 차량 수정 (VehicleSearchModal 재사용)
  const editVehicle = () => {
    setShowVehicleDetail(false);
    setVehicleModalEditMode(true);
    setShowVehicleModal(true);
  };

  // 차량 삭제
  const deleteVehicle = async () => {
    if (!selectedVehicle || !user) return;

    Alert.alert(
      '차량 삭제',
      `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}을(를) 삭제하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingVehicle(true);
              
              await firebaseService.deleteUserVehicle(selectedVehicle.id);
              
              // 차량 목록 새로고침
              await loadUserVehicles(isMountedRef);
              
              setShowVehicleDetail(false);
              
              Alert.alert('완료', '차량이 삭제되었습니다.');
              
            } catch (error) {
              logger.vehicle('delete_failed', undefined, user?.uid, { error: error instanceof Error ? error.message : String(error) });
              Alert.alert('오류', '차량 삭제에 실패했습니다.');
            } finally {
              setDeletingVehicle(false);
            }
          },
        },
      ]
    );
  };

  // 인증이 필요한 기능 실행 헬퍼 (로그인 화면으로 직접 이동)
  const executeWithAuth = (action: () => void, feature: string) => {
    if (!isAuthenticated) {
      navigation.navigate('Login', { showBackButton: true });
      return;
    }
    action();
  };

  // 진단 리포트 보기 핸들러
  const handleViewReport = () => {
    executeWithAuth(() => {
      if (vehicleReport) {
        // Analytics: 리포트 조회 추적
        analyticsService.logReportViewed(vehicleReport.id, 'vehicle_diagnosis').catch((error) => {
          console.error('❌ 리포트 조회 추적 실패:', error);
        });
        
        navigation.navigate('VehicleDiagnosisReport', { reportId: vehicleReport.id });
      }
    }, '진단 리포트 보기');
  };

  // 진단 리포트 목록 보기 핸들러
  const handleViewReportList = () => {
    executeWithAuth(() => {
      navigation.navigate('DiagnosisReportList');
    }, '진단 리포트 목록');
  };

  // 내 예약 보기 핸들러
  const handleViewMyReservations = () => {
    executeWithAuth(() => {
      navigation.navigate('MyReservations');
    }, '내 예약 보기');
  };

  // 진단 예약하기 핸들러
  const handleDiagnosisReservation = () => {
    executeWithAuth(() => {
      // Analytics: 예약 시작 추적
      analyticsService.logReservationStarted('manual').catch((error) => {
        console.error('❌ 예약 시작 추적 실패:', error);
      });
      
      navigation.navigate('DiagnosisReservation');
    }, '진단 예약');
  };

  // 차량 추가 카드 클릭 핸들러
  const handleAddVehicleCard = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login', { showBackButton: true });
      return;
    }
    setVehicleModalEditMode(false);
    setShowVehicleModal(true);
  };

  // 차량 선택 핸들러
  const handleSelectVehicle = async (vehicle: Vehicle) => {
    try {
      if (!user) return;
      
      if (vehicleModalEditMode && selectedVehicle) {
        // 수정 모드: 기존 차량 업데이트
        logger.vehicle('edit_start', { make: vehicle.make, model: vehicle.model, year: vehicle.year }, user?.uid);
        
        await firebaseService.updateUserVehicle(selectedVehicle.id, {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          batteryCapacity: vehicle.batteryCapacity,
          range: vehicle.range,
        });
        
        logger.vehicle('edit_complete', undefined, user?.uid);
        
        setShowVehicleModal(false);
        setVehicleModalEditMode(false);
        await loadUserVehicles(isMountedRef);
        Alert.alert('완료', `차량 정보가 ${vehicle.year} ${vehicle.make} ${vehicle.model}로 변경되었습니다.`);
      } else {
        // 추가 모드: 새 차량 추가
        logger.vehicle('add_start', { make: vehicle.make, model: vehicle.model, year: vehicle.year }, user?.uid);
        
        const vehicleId = await firebaseService.addUserVehicle({
          userId: user.uid,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          batteryCapacity: vehicle.batteryCapacity,
          range: vehicle.range,
          isActive: true,
        });
        
        logger.vehicle('add_complete', { make: vehicle.make, model: vehicle.model, year: vehicle.year }, user?.uid);
        
        setShowVehicleModal(false);
        await loadUserVehicles(isMountedRef);
        Alert.alert('완료', `${vehicle.year} ${vehicle.make} ${vehicle.model}이(가) 추가되었습니다.`);
      }
    } catch (error) {
      logger.error('VEHICLE', 'Vehicle operation failed', { error }, user?.uid);
      Alert.alert('오류', vehicleModalEditMode ? '차량 수정에 실패했습니다.' : '차량 추가에 실패했습니다.');
    }
  };

  
  const labels = ['접수완료', '예약됨', '완료'];
  
  const customStyles = {
    stepIndicatorSize: 40,
    currentStepIndicatorSize: 40,
    separatorStrokeWidth: 3,
    currentStepStrokeWidth: 3,
    stepStrokeCurrentColor: '#4495E8',
    stepStrokeWidth: 3,
    stepStrokeFinishedColor: '#4495E8',
    stepStrokeUnFinishedColor: '#E5E7EB',
    separatorFinishedColor: '#4495E8',
    separatorUnFinishedColor: '#E5E7EB',
    stepIndicatorFinishedColor: '#4495E8',
    stepIndicatorUnFinishedColor: '#FFFFFF',
    stepIndicatorCurrentColor: '#4495E8',
    stepIndicatorLabelFontSize: 0, // 숫자 숨기기
    currentStepIndicatorLabelFontSize: 0,
    stepIndicatorLabelCurrentColor: 'transparent',
    stepIndicatorLabelFinishedColor: 'transparent',
    stepIndicatorLabelUnFinishedColor: 'transparent',
    labelColor: '#9CA3AF',
    labelSize: 12,
    labelFontFamily: 'System',
    currentStepLabelColor: '#4495E8',
  };

  const renderStepIndicator = (params: any) => {
    const icons: Array<keyof typeof Ionicons.glyphMap> = ['document-text-outline', 'calendar-outline', 'checkmark-circle-outline'];
    const isActive = params.position <= currentStep;
    
    return (
      <Ionicons 
        name={icons[params.position]} 
        size={24} 
        color={isActive ? '#FFFFFF' : '#9CA3AF'} 
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showLogo={true} />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4495E8']} // Android
            tintColor="#4495E8" // iOS
          />
        }
      >
        {/* 내 차량 섹션 */}
        <View style={styles.vehicleSection}>
          {vehiclesLoading ? (
            <View style={styles.featureCard}>
              <View style={styles.vehicleHeader}>
                <Text style={styles.featureTitle}>내 차량</Text>
                <ActivityIndicator size="small" color="#4495E8" />
              </View>
              <Text style={styles.loadingText}>차량 정보를 불러오는 중...</Text>
            </View>
          ) : userVehicles.length > 0 ? (
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>내 차량</Text>
              {userVehicles.map((vehicle, index) => (
                <TouchableOpacity 
                  key={vehicle.id} 
                  style={styles.vehicleItem}
                  onPress={() => openVehicleDetail(vehicle)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Text>
                    <Text style={styles.vehicleSpecs}>
                      배터리: {vehicle.batteryCapacity}kWh • 주행거리: {vehicle.range}km
                    </Text>
                  </View>
                  <Ionicons name="car-sport" size={32} color="#4495E8" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.addMoreButton}
                onPress={handleAddVehicleCard}
              >
                <Ionicons name="add-circle-outline" size={20} color="#4495E8" />
                <Text style={styles.addMoreText}>차량 추가</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <AddVehicleCard 
              onPress={handleAddVehicleCard}
              isAuthenticated={isAuthenticated}
            />
          )}
        </View>

        {/* 서비스 특징 카드들 */}
        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>진단 예약</Text>
            
            {/* 로딩 상태 */}
            {isLoading && (
              <Text style={styles.featureDescription}>예약 정보를 불러오는 중...</Text>
            )}
            
            {/* 예약이 없는 경우 */}
            {!isLoading && !latestReservation && (
              <>
                <Text style={styles.featureDescription}>
                   차직 직원이 방문하여 전기차 배터리 상태를 정확히 진단해드립니다.
                </Text>
                <TouchableOpacity 
                  style={styles.reserveButton}
                  onPress={handleDiagnosisReservation}
                >
                  <Text style={styles.reserveButtonText}>진단 예약하기</Text>
                </TouchableOpacity>
              </>
            )}
            
            {/* 예약이 있는 경우 */}
            {!isLoading && latestReservation && currentStep >= 0 && (
              <>
                <Text style={styles.featureDescription}>
                  {latestReservation.address}
                  {latestReservation.detailAddress && `\n${latestReservation.detailAddress}`}
                </Text>
                <View style={styles.stepIndicatorContainer}>
                  <StepIndicator
                    customStyles={customStyles}
                    currentPosition={currentStep}
                    labels={labels}
                    stepCount={3}
                    renderStepIndicator={renderStepIndicator}
                  />
                </View>
                <Text style={styles.statusText}>
                  {latestReservation.status === 'pending' && '접수가 완료되었습니다.'}
                  {latestReservation.status === 'confirmed' && '예약이 확정되었습니다.'}
                  {latestReservation.status === 'completed' && '진단이 완료되었습니다.'}
                </Text>
                
                {/* 완료된 예약에 대한 진단 리포트 버튼 */}
                {latestReservation.status === 'completed' && (
                  <View style={styles.reportButtonContainer}>
                    {reportLoading ? (
                      <View style={styles.reportLoadingContainer}>
                        <ActivityIndicator size="small" color="#4495E8" />
                        <Text style={styles.reportLoadingText}>리포트 확인 중...</Text>
                      </View>
                    ) : vehicleReport ? (
                      <TouchableOpacity
                        style={styles.reportButton}
                        onPress={handleViewReport}
                        activeOpacity={0.8}
                      >
                        <View style={styles.reportButtonContent}>
                          <Ionicons name="document-text" size={16} color="#4495E8" />
                          <Text style={styles.reportButtonText}>진단 리포트 보기</Text>
                          <Ionicons name="chevron-forward" size={14} color="#4495E8" />
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.noReportContainer}>
                        <Ionicons name="document-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.noReportText}>진단 리포트 준비 중</Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleViewReportList}
          >
            <View style={styles.buttonContent}>
              <View style={styles.textContainer}>
                <Text style={styles.primaryButtonText}>진단</Text>
                <Text style={styles.primaryButtonText}>리포트</Text>
              </View>
              <View style={styles.iconContainer}>
                <Ionicons name="car-outline" size={40} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleViewMyReservations}
          >
            <View style={styles.buttonContent}>
              <View style={styles.textContainer}>
                <Text style={styles.secondaryButtonText}>내 예약</Text>
                <Text style={styles.secondaryButtonText}>보기</Text>
              </View>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar-outline" size={40} color="#4495E8" />
              </View>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>
      
      {/* 차량 검색 모달 */}
      <VehicleSearchModal
        visible={showVehicleModal}
        onClose={() => {
          setShowVehicleModal(false);
          setVehicleModalEditMode(false);
        }}
        onSelectVehicle={handleSelectVehicle}
        editMode={vehicleModalEditMode}
        existingVehicle={vehicleModalEditMode && selectedVehicle ? {
          id: selectedVehicle.id,
          make: selectedVehicle.make,
          model: selectedVehicle.model,
          year: selectedVehicle.year,
          batteryCapacity: selectedVehicle.batteryCapacity,
          range: selectedVehicle.range,
        } : undefined}
      />

      {/* 차량 상세 모달 */}
      <Modal
        visible={showVehicleDetail}
        transparent={true}
        animationType="none"
        onRequestClose={closeVehicleDetail}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeVehicleDetail}
          />
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>차량 정보</Text>
              <TouchableOpacity 
                onPress={closeVehicleDetail}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedVehicle && (
              <View style={styles.modalContent}>
                <View style={styles.vehicleDetailCard}>
                  <View style={styles.vehicleIconContainer}>
                    <Ionicons name="car-sport" size={48} color="#4495E8" />
                  </View>
                  
                  <View style={styles.vehicleDetailInfo}>
                    <Text style={styles.vehicleDetailName}>
                      {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                    </Text>
                    
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>배터리 용량</Text>
                      <Text style={styles.specValue}>{selectedVehicle.batteryCapacity}kWh</Text>
                    </View>
                    
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>주행 거리</Text>
                      <Text style={styles.specValue}>{selectedVehicle.range}km</Text>
                    </View>
                    
                    {selectedVehicle.nickname && (
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>별명</Text>
                        <Text style={styles.specValue}>{selectedVehicle.nickname}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={editVehicle}
                  >
                    <Ionicons name="create-outline" size={20} color="#4495E8" />
                    <Text style={styles.editButtonText}>수정</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={deleteVehicle}
                    disabled={deletingVehicle}
                  >
                    {deletingVehicle ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    )}
                    <Text style={styles.deleteButtonText}>
                      {deletingVehicle ? '삭제 중...' : '삭제'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  vehicleSection: {
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 4,
  },
  featureGrid: {
    paddingHorizontal: 0,
    paddingBottom: 16,
    gap: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  vehicleSpecs: {
    fontSize: 13,
    color: '#6B7280',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addMoreText: {
    fontSize: 14,
    color: '#4495E8',
    fontWeight: '500',
    marginLeft: 6,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 30,
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4495E8',
    borderRadius: 12,
    padding: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4495E8',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4495E8',
    lineHeight: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 60,
    gap: 8,
  },
  textContainer: {
    flex: 0.6,
    justifyContent: 'center',
  },
  iconContainer: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorContainer: {
    marginTop: 16,
    width: '100%',
  },
  reserveButton: {
    backgroundColor: '#4495E8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'center',
  },
  reserveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#4495E8',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  reportButtonContainer: {
    marginTop: 12,
    width: '100%',
  },
  reportButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#4495E8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  reportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4495E8',
    marginLeft: 6,
    marginRight: 6,
  },
  reportLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reportLoadingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  noReportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noReportText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  vehicleDetailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  vehicleIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleDetailInfo: {
    alignItems: 'center',
  },
  vehicleDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  specLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#4495E8',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4495E8',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});