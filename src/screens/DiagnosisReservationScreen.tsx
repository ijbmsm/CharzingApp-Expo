import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Text,
  ActivityIndicator,
  Animated,
  Modal,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import Header from '../components/Header';
import LocationAddressSection from '../components/LocationAddressSection';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useLoading } from '../contexts/LoadingContext';
import firebaseService from '../services/firebaseService';
import analyticsService from '../services/analyticsService';
import DateTimeSection from '../components/DateTimeSection';
import devLog from '../utils/devLog';

// 네비게이션 파라미터 타입 정의
type RootStackParamList = {
  DiagnosisReservation: {
    vehicleData?: {
      vehicleBrand: string;
      vehicleModel: string;
      vehicleYear: string;
    };
    serviceData?: {
      serviceType: string;
      servicePrice: number;
    };
  } | undefined;
};

type DiagnosisReservationRouteProp = RouteProp<RootStackParamList, 'DiagnosisReservation'>;

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface CalendarDay {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
}

const DiagnosisReservationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<DiagnosisReservationRouteProp>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { showLoading, hideLoading } = useLoading();
  
  // 이전 화면에서 전달받은 차량 및 서비스 정보 (파라미터가 없으면 새로운 플로우로 리다이렉트)
  const params = route.params;
  
  useEffect(() => {
    // 모든 경우에 새로운 예약 플로우로 리다이렉트
    devLog.log('🔄 기존 예약 화면에서 새로운 통합 예약 화면으로 리다이렉트');
    navigation.replace('Reservation');
    return;
  }, [navigation]);
  
  // 파라미터가 없으면 로딩 표시
  if (!params || !params.vehicleData || !params.serviceData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={styles.loadingText}>새로운 예약 화면으로 이동 중...</Text>
      </View>
    );
  }
  
  const { vehicleData, serviceData } = params;
  
  // 위치 및 주소 상태
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [detailAddress, setDetailAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);
  
  // 예약 단계 및 날짜/시간 상태
  const [reservationStep, setReservationStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false);
  const [hasPendingReservation, setHasPendingReservation] = useState<boolean>(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);

  // 애니메이션 관련
  const dateTimeSectionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 진단 예약 화면 조회 추적
    analyticsService.logScreenView('DiagnosisReservationScreen', 'DiagnosisReservationScreen').catch((error: any) => {
      devLog.error('❌ 진단 예약 화면 조회 추적 실패:', error);
    });

    checkPendingReservations();
    // 기본 위치를 서울로 설정 (사용자가 위치 권한을 허용하지 않아도 지도 사용 가능)
    setUserLocation({ latitude: 37.5665, longitude: 126.9780 });
  }, []);

  // 진행 중인 예약 확인
  const checkPendingReservations = async () => {
    try {
      if (!user?.uid) return;
      
      const reservations = await firebaseService.getUserDiagnosisReservations(user.uid);
      const pendingReservations = reservations.filter((r: any) =>
        r.status === 'pending' || r.status === 'confirmed' || r.status === 'pending_payment'
      );

      if (pendingReservations.length > 0) {
        setHasPendingReservation(true);

        // 결제 대기 중인 예약이 있는 경우
        const pendingPaymentReservations = pendingReservations.filter((r: any) => r.status === 'pending_payment');

        if (pendingPaymentReservations.length > 0) {
          Alert.alert(
            '결제 대기 중인 예약이 있습니다',
            '결제하지 않은 예약이 있습니다.\n기존 예약을 삭제하고 새로 예약하시겠습니까?',
            [
              { text: '취소', onPress: () => navigation.goBack() },
              {
                text: '기존 예약 삭제',
                style: 'destructive',
                onPress: async () => {
                  try {
                    // 모든 결제 대기 예약 취소
                    for (const reservation of pendingPaymentReservations) {
                      await firebaseService.updateDiagnosisReservationStatus(reservation.id, 'cancelled');
                    }
                    setHasPendingReservation(false);
                    Alert.alert('삭제 완료', '기존 예약이 삭제되었습니다. 새로운 예약을 진행해주세요.');
                  } catch (error) {
                    Alert.alert('오류', '예약 삭제 중 문제가 발생했습니다.');
                  }
                }
              },
              { text: '예약 확인', onPress: () => navigation.navigate('MyReservations') }
            ]
          );
        } else {
          Alert.alert(
            '진행 중인 예약이 있습니다',
            '이미 진행 중인 예약이 있어 새로운 예약을 접수할 수 없습니다.\n기존 예약을 확인하시겠습니까?',
            [
              { text: '취소', onPress: () => navigation.goBack() },
              { text: '예약 확인', onPress: () => navigation.navigate('MyReservations') }
            ]
          );
        }
      }
    } catch (error) {
      devLog.error('예약 확인 실패:', error);
    }
  };


  // 한국 영역 내 좌표인지 확인
  const isKoreanCoordinates = (latitude: number, longitude: number): boolean => {
    return (
      latitude >= 33.0 && latitude <= 38.5 &&
      longitude >= 124.0 && longitude <= 132.0
    );
  };

  // 현재 위치 가져오기 (권한 요청 포함)
  const getCurrentLocation = async () => {
    try {
      devLog.log('🌍 위치 권한 및 정보 요청 시작...');
      
      // 먼저 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          '위치 권한 필요',
          '현재 위치를 사용하려면 위치 권한이 필요합니다.',
          [{ text: '확인' }]
        );
        return;
      }
      
      setLocationPermission(true);
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10초 타임아웃
      });
      
      let { latitude, longitude } = location.coords;
      devLog.log('📍 현재 위치:', { latitude, longitude });
      
      if (!isKoreanCoordinates(latitude, longitude)) {
        devLog.log('🌏 한국 밖 위치 감지, 서울로 변경');
        latitude = 37.5665;
        longitude = 126.9780;
        // 사용자에게 알림 없이 조용히 서울로 설정
      }
      
      setUserLocation({ latitude, longitude });
      await handleMapLocationSelect(latitude, longitude, false);
      
    } catch (error) {
      devLog.error('위치 가져오기 실패:', error);
      
      // 위치 서비스 실패 시 기본값으로 서울 설정
      const defaultLocation = { latitude: 37.5665, longitude: 126.9780 };
      setUserLocation(defaultLocation);
      await handleMapLocationSelect(defaultLocation.latitude, defaultLocation.longitude, false);
      
      Alert.alert(
        '위치 설정',
        '위치 정보를 가져올 수 없어 서울 중심으로 설정되었습니다.\n지도에서 정확한 위치를 선택해주세요.',
        [{ text: '확인' }]
      );
    }
  };

  // 지도 클릭/좌표로 주소 가져오기
  const handleMapLocationSelect = async (latitude: number, longitude: number, showAlert: boolean = true) => {
    setUserLocation({ latitude, longitude });
    setIsLoadingAddress(true);
    
    try {
      const KAKAO_REST_API_KEY = Constants.expoConfig?.extra?.KAKAO_REST_API_KEY;
      
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`,
        {
          headers: {
            Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.documents && data.documents.length > 0) {
          const addressInfo = data.documents[0];
          const address = addressInfo.road_address 
            ? addressInfo.road_address.address_name 
            : addressInfo.address.address_name;
          
          setUserAddress(address);
          
          if (showAlert) {
            Alert.alert('위치 설정', `선택된 위치: ${address}`);
          }
        }
      } else {
        throw new Error('주소 변환 실패');
      }
    } catch (error) {
      devLog.error('주소 가져오기 실패:', error);
      if (showAlert) {
        Alert.alert('오류', '주소를 가져올 수 없습니다. 직접 입력해주세요.');
      }
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // 다음 단계로 이동 (애니메이션과 함께)
  const handleNext = async () => {
    if (!userAddress.trim()) {
      Alert.alert('알림', '방문 받을 주소를 입력해주세요.');
      return;
    }
    if (!userLocation) {
      Alert.alert('알림', '위치 정보를 가져올 수 없습니다. 지도에서 위치를 선택해주세요.');
      return;
    }
    
    // 먼저 단계 변경 (mode를 summary로 바로 변경)
    setReservationStep(2);
    
    // 날짜/시간 섹션 나타내기 애니메이션만 실행 (위치 섹션은 mode 변화로 자연스럽게 처리)
    Animated.timing(dateTimeSectionOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // 이전 단계로 돌아가기 (애니메이션과 함께)
  const handleBackStep = () => {
    if (reservationStep > 1) {
      // 역방향 애니메이션: 날짜/시간 섹션 숨기기 (위치 섹션은 mode 변화로 자연스럽게 처리)
      Animated.timing(dateTimeSectionOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setReservationStep(reservationStep - 1);
      });
    } else {
      navigation.goBack();
    }
  };

  // 예약 가능한 시간대 생성
  const generateTimeSlots = async (date: string): Promise<TimeSlot[]> => {
    try {
      const selectedDateObj = new Date(date);
      const now = new Date();
      
      // 웹에서 설정한 가용 시간 슬롯 가져오기
      const availableSlots = await firebaseService.getAvailableTimeSlots(selectedDateObj);
      
      const timeSlots: TimeSlot[] = [];
      
      for (const timeSlot of availableSlots) {
        const [hour, minute] = timeSlot.split(':').map(Number);
        const timeSlotDate = new Date(selectedDateObj);
        timeSlotDate.setHours(hour || 0, minute || 0, 0, 0);
        
        const isPast = timeSlotDate <= now;
        
        // 실제 예약 여부 확인 (기존 예약과 충돌하는지)
        const isAvailable = await firebaseService.isTimeSlotAvailable(selectedDateObj, timeSlot);
        
        timeSlots.push({
          id: `${date}-${timeSlot}`,
          time: timeSlot,
          available: !isPast && isAvailable,
        });
      }
      
      return timeSlots;
    } catch (error) {
      devLog.error('시간 슬롯 생성 실패:', error);
      // 오류 시 기본 시간 슬롯 반환
      return [];
    }
  };

  // 시간 슬롯 로드 함수
  const loadTimeSlots = async (date: string) => {
    try {
      setIsLoadingTimeSlots(true);
      const slots = await generateTimeSlots(date);
      setTimeSlots(slots);
    } catch (error) {
      devLog.error('시간 슬롯 로드 실패:', error);
      setTimeSlots([]);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  // 날짜 가용성 확인 함수 - 더 효율적으로 처리
  const checkDateAvailability = async (dateString: string): Promise<boolean> => {
    try {
      const selectedDateObj = new Date(dateString);
      const now = new Date();
      
      // 과거 날짜인지 확인
      if (selectedDateObj < now) {
        return false;
      }
      
      // 웹에서 설정한 가용 시간 슬롯 가져오기 (캐싱됨)
      const availableSlots = await firebaseService.getAvailableTimeSlots(selectedDateObj);
      
      // 현재 시간 이후의 슬롯이 있는지 확인
      for (const timeSlot of availableSlots) {
        const [hour, minute] = timeSlot.split(':').map(Number);
        const timeSlotDate = new Date(selectedDateObj);
        timeSlotDate.setHours(hour || 0, minute || 0, 0, 0);
        
        const isPast = timeSlotDate <= now;
        
        if (!isPast) {
          const isAvailable = await firebaseService.isTimeSlotAvailable(selectedDateObj, timeSlot);
          if (isAvailable) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      devLog.error('날짜 가용성 확인 실패:', error);
      return false;
    }
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (day: CalendarDay) => {
    // 진행 중인 예약이 있으면 차단
    if (hasPendingReservation) {
      Alert.alert('예약 불가', '이미 진행 중인 예약이 있어 새로운 예약을 접수할 수 없습니다.');
      return;
    }

    // 즉시 날짜 변경 및 선택된 시간 초기화
    setSelectedDate(day.dateString);
    setSelectedTimeSlot('');
    setTimeSlots([]); // 기존 시간 슬롯 초기화
    
    // 백그라운드에서 시간 슬롯 로딩
    loadTimeSlots(day.dateString);
  };

  // 시간 선택 핸들러
  const handleTimeSlotSelect = (timeSlotId: string) => {
    if (selectedTimeSlot === timeSlotId) {
      setSelectedTimeSlot('');
    } else {
      setSelectedTimeSlot(timeSlotId);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekDay})`;
  };

  // 예약 확인 모달 표시
  const handleShowConfirmation = () => {
    // 진행 중인 예약이 있으면 차단
    if (hasPendingReservation) {
      Alert.alert('예약 불가', '이미 진행 중인 예약이 있어 새로운 예약을 접수할 수 없습니다.');
      return;
    }

    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('선택 오류', '날짜와 시간을 모두 선택해주세요.');
      return;
    }
    
    const selectedTime = timeSlots.find(slot => slot.id === selectedTimeSlot);
    if (!selectedTime) {
      Alert.alert('오류', '선택된 시간 정보를 찾을 수 없습니다.');
      return;
    }

    setShowConfirmationModal(true);
  };

  // 실제 예약 확정 처리
  const handleConfirmReservation = async () => {
    const selectedTime = timeSlots.find(slot => slot.id === selectedTimeSlot);
    if (!selectedTime) return;

    setShowConfirmationModal(false);
    showLoading('예약을 처리하고 있습니다...');
    setIsSubmitting(true);
    
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const [hour] = selectedTime.time.split(':').map(Number);
      const requestedDateTime = new Date(year || 2024, (month || 1) - 1, day || 1, hour || 9, 0, 0);
      
      if (!user || !user.uid) {
        Alert.alert('로그인 오류', '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }
      
      const reservationData = {
        userId: user?.uid || '',
        userName: user?.displayName || user?.email || '사용자',
        userPhone: '',  // 진단 예약에서는 전화번호를 받지 않으므로 빈 문자열
        address: userAddress,
        detailAddress: detailAddress || '',
        latitude: userLocation?.latitude || 37.5665,
        longitude: userLocation?.longitude || 126.9780,
        vehicleBrand: '기타', // 진단 예약에서는 차량 정보를 받지 않으므로 기본값
        vehicleModel: '기타',
        vehicleYear: '2020',
        serviceType: '방문 배터리 진단 및 상담',
        servicePrice: 0, // 진단 예약은 무료
        status: 'pending' as const,
        requestedDate: requestedDateTime,
        notes: '',
        source: 'app' as const,
      };
      
      devLog.log('📝 예약 데이터:', reservationData);
      
      await firebaseService.createDiagnosisReservation(reservationData);
      
      // Analytics: 예약 완료 추적
      analyticsService.logReservationCompleted({
        userId: user.uid,
        address: userAddress,
        selectedDate: selectedDate,
        selectedTime: selectedTime.time,
      }).catch((error: any) => {
        devLog.error('❌ 예약 완료 추적 실패:', error);
      });
      
      Alert.alert(
        '예약 완료',
        '진단 예약이 성공적으로 접수되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              // 스택을 리셋하고 홈으로 이동 (뒤로가기 시 스택 쌓임 방지)
              setTimeout(() => {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                  })
                );
              }, 100);
            },
          },
        ]
      );
    } catch (error) {
      devLog.error('❌ 예약 생성 실패:', error);
      Alert.alert(
        '예약 실패',
        '예약 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    } finally {
      hideLoading();
      setIsSubmitting(false);
    }
  };

  // 로그인되지 않은 경우 Login 화면으로 이동
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Login', { showBackButton: true });
    }
  }, [isAuthenticated, navigation]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
        <Header 
          title={reservationStep === 1 ? "진단 예약" : "날짜 및 시간 선택"} 
          showLogo={false} 
          showBackButton={true}
          onBackPress={handleBackStep}
        />

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {/* 위치 섹션 - mode 변화로 자연스러운 크기 변화 */}
          <View style={styles.locationSectionContainer}>
            <LocationAddressSection
              mode={reservationStep === 1 ? "full" : "summary"}
              userLocation={userLocation}
              userAddress={userAddress}
              detailAddress={detailAddress}
              isLoadingAddress={isLoadingAddress}
              locationPermission={locationPermission}
              onAddressChange={setUserAddress}
              onDetailAddressChange={setDetailAddress}
              onMapClick={handleMapLocationSelect}
              onResetLocation={getCurrentLocation}
            />
          </View>

          {/* 날짜/시간 선택 섹션 - 2단계에서만 애니메이션으로 표시 */}
          {reservationStep === 2 && (
            <Animated.View
              style={[
                styles.dateTimeSectionContainer,
                {
                  opacity: dateTimeSectionOpacity,
                },
              ]}
            >
              <DateTimeSection
                selectedDate={selectedDate}
                selectedTimeSlot={selectedTimeSlot}
                timeSlots={timeSlots}
                onDateSelect={handleDateSelect}
                onTimeSlotSelect={handleTimeSlotSelect}
                formatDate={formatDate}
                isLoadingTimeSlots={isLoadingTimeSlots}
              />
            </Animated.View>
          )}
        </ScrollView>

        {/* 버튼 */}
        <View style={styles.buttonContainer}>
          {reservationStep === 1 && (
            <TouchableOpacity
              style={[
                styles.button,
                !userAddress.trim() && styles.disabledButton,
              ]}
              onPress={handleNext}
              disabled={!userAddress.trim()}
            >
              <Text style={[
                styles.buttonText,
                !userAddress.trim() && styles.disabledButtonText,
              ]}>
                다음
              </Text>
            </TouchableOpacity>
          )}

          {reservationStep === 2 && selectedDate && selectedTimeSlot && (
            <TouchableOpacity 
              style={[styles.button, isSubmitting && styles.disabledButton]} 
              onPress={handleShowConfirmation}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.buttonLoadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.buttonText}>예약 처리 중...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>예약 확정하기</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 예약 확인 모달 */}
        <Modal
          visible={showConfirmationModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowConfirmationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* 모달 헤더 */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>예약 확인</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowConfirmationModal(false)}
                >
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* 예약 정보 */}
              <View style={styles.reservationInfo}>
                <Text style={styles.reservationInfoTitle}>예약 정보를 확인해주세요</Text>

                {/* 방문 주소 */}
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color="#06B6D4" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>방문 주소</Text>
                    <Text style={styles.infoText}>{userAddress}</Text>
                    {detailAddress && (
                      <Text style={styles.infoSubText}>{detailAddress}</Text>
                    )}
                  </View>
                </View>

                {/* 예약 날짜 및 시간 */}
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#06B6D4" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>예약 일시</Text>
                    <Text style={styles.infoText}>
                      {formatDate(selectedDate)} {timeSlots.find(slot => slot.id === selectedTimeSlot)?.time}
                    </Text>
                  </View>
                </View>

                {/* 서비스 정보 */}
                <View style={styles.infoRow}>
                  <Ionicons name="construct-outline" size={20} color="#06B6D4" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>서비스 내용</Text>
                    <Text style={styles.infoText}>전기차 배터리 진단 및 상담</Text>
                    <Text style={styles.infoSubText}>예상 소요시간: 약 30분</Text>
                  </View>
                </View>
              </View>

              {/* 안내 사항 */}
              <View style={styles.noticeContainer}>
                <Text style={styles.noticeTitle}>안내사항</Text>
                <Text style={styles.noticeText}>• 예약 시간 15분 전까지 준비 완료 부탁드립니다</Text>
                <Text style={styles.noticeText}>• 진단 결과는 현장에서 바로 확인 가능합니다</Text>
                <Text style={styles.noticeText}>• 예약 변경은 마이페이지에서 가능합니다</Text>
              </View>

              {/* 버튼들 */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowConfirmationModal(false)}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmReservation}
                >
                  <Text style={styles.confirmButtonText}>예약 확정</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#6B7280',
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationSectionContainer: {
    overflow: 'hidden',
  },
  dateTimeSectionContainer: {
    overflow: 'hidden',
  },
  
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  reservationInfo: {
    padding: 20,
  },
  reservationInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  infoSubText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  noticeContainer: {
    backgroundColor: '#F9FAFB',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#06B6D4',
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#06B6D4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default DiagnosisReservationScreen;