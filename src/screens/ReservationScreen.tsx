import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Text,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import Header from '../components/Header';
import LocationAddressSection from '../components/LocationAddressSection';
import KakaoMapView from '../components/KakaoMapView';
import VehicleAccordionSelector from '../components/VehicleAccordionSelector';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useLoading } from '../contexts/LoadingContext';
import firebaseService, { EnrichedUserVehicle } from '../services/firebaseService';
import analyticsService from '../services/analyticsService';
import { devLog } from '../utils/devLog';
import { getAvailableBrands, getAvailableModels, getAvailableYearsForModel, RESERVATION_TYPES, ReservationType, VehicleBrand, VehicleModel } from '../constants/ev-battery-database';

import { handleError, handleFirebaseError, handleNetworkError, handleAuthError, showUserError } from '../services/errorHandler';
import sentryLogger from '../utils/sentryLogger';
// 캘린더 한국어 설정
LocaleConfig.locales['ko'] = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  monthNamesShort: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'ko';

// 타입 안전 접근을 위한 헬퍼 함수들
const safeGetString = (
  obj: Record<string, unknown> | any,
  key: string,
  defaultValue = "정보 없음"
): string => {
  const value = obj?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return defaultValue;
};

const safeGetNumber = (
  obj: Record<string, unknown> | any,
  key: string,
  defaultValue = 0
): number => {
  const value = obj?.[key];
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface VehicleData {
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleTrim?: string;
}

interface ServiceData {
  serviceType: string;
  servicePrice: number;
}

interface AddressData {
  address: string;
  detailAddress?: string;
  latitude: number;
  longitude: number;
}

interface DateTimeData {
  selectedDate: string;
  selectedTime: string;
  requestedDateTime: Date;
}

interface ContactData {
  userName: string;
  userPhone: string;
  notes?: string;
}

const ReservationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { showLoading, hideLoading } = useLoading();
  const insets = useSafeAreaInsets();

  // 수정 모드 및 기존 예약 데이터
  const editMode = route.params?.editMode || false;
  const existingReservation = route.params?.reservation || null;
  
  // Tab Navigator에서 접근할 때는 params가 없을 수 있음
  console.log('🔍 Route params:', route.params);

  // 예약 단계 관리
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // 사용자 차량 목록
  const [userVehicles, setUserVehicles] = useState<EnrichedUserVehicle[]>([]);

  // 단계별 데이터
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [dateTimeData, setDateTimeData] = useState<DateTimeData | null>(null);
  const [contactData, setContactData] = useState<ContactData | null>(null);

  // 1단계: 차량 & 서비스 선택
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedModelData, setSelectedModelData] = useState<VehicleModel | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [manualBrand, setManualBrand] = useState<string>('');
  const [manualModel, setManualModel] = useState<string>('');
  const [selectedService, setSelectedService] = useState<ReservationType | null>(RESERVATION_TYPES[0] || null);
  
  // 차량 선택 모달
  const [showReservationVehicleModal, setShowReservationVehicleModal] = useState<boolean>(false);
  const [isVehicleSelected, setIsVehicleSelected] = useState<boolean>(false);
  
  // 모달 상태 변경 감지
  useEffect(() => {
    console.log('📱 ReservationScreen 모달 상태 변경:', showReservationVehicleModal);
  }, [showReservationVehicleModal]);
  

  // 2단계: 주소 선택
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [detailAddress, setDetailAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  // 3단계: 날짜/시간 선택
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false);

  // 4단계: 연락처 정보
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  // 5단계: 서비스 타입 선택
  const [serviceType, setServiceType] = useState<'standard' | 'premium' | null>(null);
  const [servicePrice, setServicePrice] = useState<number>(0);

  // 🔥 예약 ID 상태 (중복 생성 방지)
  const [createdReservationId, setCreatedReservationId] = useState<string | null>(null);

  // moti 애니메이션을 위한 step 상태로 제어

  // 초기 설정 (한 번만 실행)
  useEffect(() => {
    // 초기 위치 설정
    setUserLocation({ latitude: 37.5665, longitude: 126.9780 });
    
    // Analytics - 무한 리렌더링 문제 해결 전까지 비활성화
    console.log('📊 ReservationScreen mounted');
    // analyticsService.logScreenView('ReservationScreen', 'ReservationScreen').catch(console.error);
  }, []);

  // 사용자 정보 자동 입력
  useEffect(() => {
    if (user) {
      setUserName(user.realName || user.displayName || user.email?.split('@')[0] || '');
      setUserPhone((user as any).phoneNumber || '');
      
      // 사용자 차량 목록 로드
      loadUserVehicles();
    }
  }, [user]);

  // 사용자 차량 목록 로드
  const loadUserVehicles = async () => {
    if (!user?.uid) {
      devLog.log('⚠️ 사용자 UID가 없음');
      return;
    }

    try {
      devLog.log('🔍 사용자 차량 목록 조회 시작 (Application-level JOIN), userId:', user.uid);

      // ✅ Application-level JOIN: userVehicles + vehicles
      const vehicles = await firebaseService.getUserVehiclesEnriched(user.uid);

      devLog.log('✅ 사용자 차량 목록 로드됨 (enriched):', {
        count: vehicles.length,
        vehicles: vehicles.map(v => ({
          brandId: v.brandId,
          modelId: v.modelId,
          year: v.year,
          trimId: v.trimId,
          modelName: v.vehicleData.modelName
        }))
      });

      setUserVehicles([...vehicles]); // 새로운 배열로 강제 리렌더링
    } catch (error) {
      devLog.error('❌ 사용자 차량 목록 로드 실패:', error);
      setUserVehicles([]);
    }
  };

  // 수정 모드일 때 기존 데이터로 초기화
  useEffect(() => {
    if (editMode && existingReservation) {
      devLog.log('🔧 수정 모드: 기존 데이터로 초기화 시작', existingReservation);
      
      // 차량 데이터 설정
      if (existingReservation.vehicleBrand) {
        setVehicleData({
          vehicleBrand: existingReservation.vehicleBrand,
          vehicleModel: existingReservation.vehicleModel,
          vehicleYear: existingReservation.vehicleYear,
        });
        // UI 상태도 설정
        setSelectedBrand({ name: existingReservation.vehicleBrand } as VehicleBrand);
        setSelectedModel(existingReservation.vehicleModel);
        setSelectedYear(existingReservation.vehicleYear);
      }

      // 서비스 데이터 설정
      if (existingReservation.serviceType) {
        setServiceData({
          serviceType: existingReservation.serviceType,
          servicePrice: existingReservation.servicePrice || 0,
        });
        // UI 상태도 설정
        setSelectedService(existingReservation.serviceType);
        // setServicePrice(existingReservation.servicePrice || 0); // servicePrice is set in formData above
      }

      // 주소 데이터 설정
      if (existingReservation.address) {
        setAddressData({
          address: existingReservation.address,
          detailAddress: existingReservation.detailAddress || '',
          latitude: existingReservation.latitude,
          longitude: existingReservation.longitude,
        });
        setUserAddress(existingReservation.address);
        setDetailAddress(existingReservation.detailAddress || '');
        setUserLocation({
          latitude: existingReservation.latitude,
          longitude: existingReservation.longitude,
        });
      }

      // 날짜/시간 데이터 설정
      if (existingReservation.requestedDate) {
        let reservationDate: Date | null = null;
        
        if (typeof existingReservation.requestedDate === 'string') {
          reservationDate = new Date(existingReservation.requestedDate);
        } else if (existingReservation.requestedDate instanceof Date) {
          reservationDate = existingReservation.requestedDate;
        } else if (existingReservation.requestedDate.toDate) {
          reservationDate = existingReservation.requestedDate.toDate();
        }

        if (reservationDate && !isNaN(reservationDate.getTime())) {
          const dateString = reservationDate.toISOString().split('T')[0];
          const timeString = `${reservationDate.getHours().toString().padStart(2, '0')}:${reservationDate.getMinutes().toString().padStart(2, '0')}`;
          
          setSelectedDate(dateString || '');
          setSelectedTimeSlot({
            id: `${dateString}-${timeString}`,
            time: timeString,
            available: true,
          });

          setDateTimeData({
            selectedDate: dateString || '',
            selectedTime: timeString,
            requestedDateTime: reservationDate,
          });
        }
      }

      // 연락처 데이터 설정
      if (existingReservation.userName || existingReservation.userPhone) {
        setContactData({
          userName: existingReservation.userName || '',
          userPhone: existingReservation.userPhone || '',
          notes: existingReservation.notes || '',
        });
        setUserName(existingReservation.userName || '');
        setUserPhone(existingReservation.userPhone || '');
        setNotes(existingReservation.notes || '');
      }

      // 수정 모드일 때는 모든 단계를 활성화
      setCurrentStep(5); // 마지막 단계까지 모든 것이 완료된 상태로 시작
      
      devLog.log('✅ 수정 모드: 기존 데이터로 초기화 완료');
    }
  }, [editMode, existingReservation]);

  // 로그인 체크 및 안전한 네비게이션
  useEffect(() => {
    if (!isAuthenticated) {
      // 탭 네비게이터에서 접근한 경우 홈 탭으로 안전하게 이동 후 로그인 화면 표시
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'Main' }, // 메인 탭으로 먼저 이동
            { name: 'Login', params: { showBackButton: true } } // 그 다음 로그인 화면
          ],
        })
      );
    }
  }, [isAuthenticated, navigation]);

  // moti를 사용한 단계 애니메이션은 선언적으로 처리됩니다

  // 축소된 카드 클릭 시 해당 단계로 이동
  const handleCardClick = (targetStep: number) => {
    if (targetStep < currentStep) {
      // 이전 단계로 돌아가기 (moti 애니메이션은 currentStep 변경으로 자동 트리거)
      setCurrentStep(targetStep);
    }
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      // 차량 & 서비스 데이터 저장
      const finalBrand = isManualInput ? manualBrand : selectedBrand?.name || '';
      const finalModel = isManualInput ? manualModel : selectedModel;
      
      setVehicleData({
        vehicleBrand: finalBrand,
        vehicleModel: finalModel,
        vehicleYear: selectedYear,
      });
      
      const finalServiceData = {
        serviceType: selectedService?.name || '',
        servicePrice: selectedService?.price || 0,
      };
      
      devLog.log('🚗 차량 & 서비스 데이터 저장:', {
        vehicleData: {
          vehicleBrand: finalBrand,
          vehicleModel: finalModel,
          vehicleYear: selectedYear,
        },
        serviceData: finalServiceData,
        selectedService: selectedService,
      });
      
      setServiceData(finalServiceData);

      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      // 주소 데이터 저장
      setAddressData({
        address: userAddress,
        detailAddress: detailAddress || '',
        latitude: userLocation?.latitude || 37.5665,
        longitude: userLocation?.longitude || 126.9780,
      });

      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      // 날짜/시간 데이터 저장
      const [year, month, day] = selectedDate.split('-').map(Number);
      const [hour] = (selectedTimeSlot?.time || '09:00').split(':').map(Number);
      const requestedDateTime = new Date(year || 0, (month || 1) - 1, day || 1, hour || 9, 0, 0);

      setDateTimeData({
        selectedDate,
        selectedTime: selectedTimeSlot?.time || '',
        requestedDateTime,
      });

      setCurrentStep(4);
    } else if (currentStep === 4 && validateStep4()) {
      // 연락처 데이터 저장
      const phoneNumbersOnly = userPhone.replace(/[^0-9]/g, '');
      devLog.log('🔍 연락처 데이터 저장:', {
        userName: userName.trim(),
        userPhone: userPhone,
        phoneNumbersOnly,
        phoneNumbersOnlyLength: phoneNumbersOnly.length,
        notes: notes.trim(),
        finalUserPhone: phoneNumbersOnly.length >= 10 ? phoneNumbersOnly : userPhone,
      });
      
      setContactData({
        userName: userName.trim(),
        userPhone: phoneNumbersOnly.length >= 10 ? phoneNumbersOnly : userPhone, // 숫자만 10자리 이상일 때만 사용
        notes: notes.trim(),
      });

      setCurrentStep(5);
    } else if (currentStep === 5 && validateStep5()) {
      // 서비스 타입 선택 완료 후 최종 단계로
      setCurrentStep(6);
    }
  };

  // 이전 단계로 이동
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  // 단계별 유효성 검사
  const validateStep1 = (): boolean => {
    const finalBrand = isManualInput ? manualBrand : selectedBrand?.name || '';
    const finalModel = isManualInput ? manualModel : selectedModel;
    
    if (!finalBrand.trim() || !finalModel.trim() || !selectedYear.trim() || !selectedService) {
      Alert.alert('알림', '모든 항목을 입력해주세요.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!userAddress.trim()) {
      Alert.alert('알림', '주소를 선택해주세요.');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('알림', '날짜와 시간을 선택해주세요.');
      return false;
    }
    return true;
  };

  const validateStep4 = (): boolean => {
    if (!validateName(userName) || !validatePhone(userPhone)) {
      Alert.alert('알림', '입력한 정보를 다시 확인해주세요.');
      return false;
    }
    return true;
  };

  const validateStep5 = (): boolean => {
    if (!serviceType) {
      Alert.alert('알림', '서비스 타입을 선택해주세요.');
      return false;
    }
    return true;
  };

  // 이름 유효성 검사
  const validateName = (name: string): boolean => {
    if (name.trim().length < 2) {
      setNameError('이름은 2글자 이상 입력해주세요.');
      return false;
    }
    const nameRegex = /^[가-힣a-zA-Z\\s]+$/;
    if (!nameRegex.test(name.trim())) {
      setNameError('이름은 한글 또는 영문만 입력 가능합니다.');
      return false;
    }
    setNameError('');
    return true;
  };

  // 전화번호 유효성 검사
  const validatePhone = (phone: string): boolean => {
    const numbers = phone.replace(/[^0-9]/g, '');
    if (numbers.length !== 11) {
      setPhoneError('전화번호는 11자리를 입력해주세요.');
      return false;
    }
    if (!numbers.startsWith('010')) {
      setPhoneError('010으로 시작하는 번호를 입력해주세요.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (phone: string): string => {
    const numbers = phone.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // 연도 배열 생성
  const getYearOptions = (): string[] => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let year = currentYear; year >= currentYear - 30; year--) {
      years.push(year.toString());
    }
    return years;
  };

  // 내 차량 선택 핸들러 (한 대만 지원)
  const handleMyVehicleSelect = (vehicle: EnrichedUserVehicle) => {
    devLog.log('🚗 내 차량 선택됨 (enriched):', vehicle);

    // ✅ EnrichedUserVehicle을 VehicleData 형태로 변환
    const vehicleData: VehicleData = {
      vehicleBrand: vehicle.brandId,
      vehicleModel: vehicle.vehicleData.modelName,
      vehicleYear: vehicle.year.toString(),
      vehicleTrim: vehicle.trimId,
    };
    
    setVehicleData(vehicleData);
    
    // 기본 서비스 데이터도 설정 (내 차량 선택 시)
    const defaultServiceData: ServiceData = {
      serviceType: "배터리 진단",
      servicePrice: 100000,
    };
    setServiceData(defaultServiceData);
    
    setCurrentStep(2); // 다음 단계로 이동
  };

  // 차량 선택 핸들러는 VehicleAccordionSelector에서 직접 처리됨

  // 직접 입력 모드 토글
  const toggleManualInput = () => {
    setIsManualInput(!isManualInput);
    // 기존 선택 초기화
    setSelectedBrand(null);
    setSelectedModel('');
    setSelectedModelData(null);
    setSelectedYear('');
    setManualBrand('');
    setManualModel('');
  };

  // 시간대 생성 (Firebase settings 연동)
  const generateTimeSlots = async (date: string): Promise<TimeSlot[]> => {
    try {
      const selectedDateObj = new Date(date);
      const now = new Date();
      
      // Firebase에서 가용 시간 슬롯 가져오기
      const availableSlots = await firebaseService.getAvailableTimeSlots(selectedDateObj);
      
      const slots: TimeSlot[] = [];
      
      for (const timeSlot of availableSlots) {
        const hour = parseInt(timeSlot.split(':')[0] || '0');
        const slotDateTime = new Date(selectedDateObj);
        slotDateTime.setHours(hour, 0, 0, 0);
        
        const isPast = slotDateTime <= now;
        const isAvailable = await firebaseService.isTimeSlotAvailable(selectedDateObj, timeSlot);
        
        slots.push({
          id: `${date}-${hour}`,
          time: timeSlot,
          available: !isPast && isAvailable,
        });
      }
      
      return slots;
    } catch (error) {
      devLog.error('❌ 시간 슬롯 생성 실패:', error);
      // 에러 발생 시 기본 시간 슬롯 반환
      const slots: TimeSlot[] = [];
      const selectedDateObj = new Date(date);
      const now = new Date();
      
      for (let hour = 9; hour <= 17; hour++) {
        const slotDateTime = new Date(selectedDateObj);
        slotDateTime.setHours(hour, 0, 0, 0);
        
        const isPast = slotDateTime <= now;
        
        slots.push({
          id: `${date}-${hour}`,
          time: `${hour.toString().padStart(2, '0')}:00`,
          available: !isPast,
        });
      }
      
      return slots;
    }
  };

  // 날짜 선택 처리
  const handleDateSelect = async (day: any) => {
    const selectedDateString = day.dateString;
    setSelectedDate(selectedDateString);
    setSelectedTimeSlot(null);
    setIsLoadingTimeSlots(true);
    
    try {
      const timeSlots = await generateTimeSlots(selectedDateString);
      setTimeSlots(timeSlots);
    } catch (error) {
      devLog.error('❌ 시간 슬롯 로딩 실패:', error);
      // 기본 시간 슬롯으로 폴백
      const fallbackSlots: TimeSlot[] = [];
      const selectedDateObj = new Date(selectedDateString);
      const now = new Date();
      
      for (let hour = 9; hour <= 17; hour++) {
        const slotDateTime = new Date(selectedDateObj);
        slotDateTime.setHours(hour, 0, 0, 0);
        const isPast = slotDateTime <= now;
        
        fallbackSlots.push({
          id: `${selectedDateString}-${hour}`,
          time: `${hour.toString().padStart(2, '0')}:00`,
          available: !isPast,
        });
      }
      setTimeSlots(fallbackSlots);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  // 지도 위치 선택 처리
  const handleMapLocationSelect = async (latitude: number, longitude: number, showAlert: boolean = true) => {
    try {
      setIsLoadingAddress(true);
      setUserLocation({ latitude, longitude });

      // 카카오 역지오코딩 API 호출
      const KAKAO_REST_KEY = Constants.expoConfig?.extra?.KAKAO_REST_API_KEY;
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`,
        {
          headers: {
            Authorization: `KakaoAK ${KAKAO_REST_KEY}`,
          },
        }
      );

      const data = await response.json();
      if (data.documents && data.documents.length > 0) {
        const address = data.documents[0].address?.address_name || data.documents[0].road_address?.address_name;
        if (address) {
          setUserAddress(address);
        }
      }
    } catch (error) {
      devLog.error('역지오코딩 실패:', error);
      if (showAlert) {
        Alert.alert('오류', '주소를 가져올 수 없습니다.');
      }
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // 현재 위치 가져오기
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한 필요', '현재 위치를 사용하려면 위치 권한이 필요합니다.');
        return;
      }
      
      setLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      
      // 한국 영역 체크
      if (latitude >= 33.0 && latitude <= 38.5 && longitude >= 124.0 && longitude <= 132.0) {
        await handleMapLocationSelect(latitude, longitude, false);
      } else {
        // 한국 밖이면 서울로 설정
        await handleMapLocationSelect(37.5665, 126.9780, false);
      }
    } catch (error) {
      devLog.error('위치 가져오기 실패:', error);
      await handleMapLocationSelect(37.5665, 126.9780, false);
    }
  };

  // 예약 확정 처리
  const handleConfirmReservation = async () => {
    if (!vehicleData || !serviceData || !addressData || !dateTimeData || !contactData) {
      Alert.alert('오류', '예약 정보가 완전하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    showLoading(editMode ? '예약을 수정하는 중...' : '예약을 처리하는 중...');
    
    try {
      if (editMode && existingReservation) {
        // 수정 모드: 기존 예약 업데이트
        const updateData = {
          address: addressData.address,
          detailAddress: addressData.detailAddress || undefined,
          latitude: addressData.latitude,
          longitude: addressData.longitude,
          requestedDate: dateTimeData.requestedDateTime,
          notes: contactData.notes || undefined,
          vehicleBrand: vehicleData.vehicleBrand,
          vehicleModel: vehicleData.vehicleModel,
          vehicleYear: vehicleData.vehicleYear,
          serviceType: serviceData.serviceType,
          servicePrice: serviceData.servicePrice,
          userName: contactData.userName,
          userPhone: contactData.userPhone.replace(/[^0-9]/g, ''),
        };

        await firebaseService.updateDiagnosisReservation(existingReservation.id, updateData);
        
        // Analytics
        await analyticsService.logCustomEvent('reservation_modified', {
          reservation_id: existingReservation.id,
          vehicle_brand: vehicleData.vehicleBrand,
          vehicle_model: vehicleData.vehicleModel,
          service_type: serviceData.serviceType,
          service_price: serviceData.servicePrice,
          source: 'app',
        });

        Alert.alert(
          '수정 완료',
          '예약이 성공적으로 수정되었습니다.',
          [
            {
              text: '확인',
              onPress: () => {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  })
                );
              },
            },
          ]
        );
      } else {
        // 생성 모드: 예약 먼저 생성 → 결제 화면으로 이동
        const reservationData = {
          userName: contactData.userName,
          userPhone: contactData.userPhone.replace(/[^0-9]/g, ''),
          address: addressData.address,
          detailAddress: addressData.detailAddress || '',
          latitude: addressData.latitude,
          longitude: addressData.longitude,
          vehicleBrand: vehicleData.vehicleBrand,
          vehicleModel: vehicleData.vehicleModel,
          vehicleYear: vehicleData.vehicleYear,
          serviceType: serviceData.serviceType,
          servicePrice: serviceData.servicePrice,
          requestedDate: dateTimeData.requestedDateTime,
          notes: contactData.notes || '',
          source: 'app' as const,
        };

        // 🔥 1️⃣ 예약 ID 재사용 로직 (중복 생성 방지!)
        let reservationId = createdReservationId;

        if (!reservationId) {
          // ✅ 예약이 없으면 새로 생성
          devLog.log('🆕 새 예약 생성 시작...');

          reservationId = await firebaseService.createDiagnosisReservation({
            ...reservationData,
            userId: user?.uid,
            status: 'pending_payment',
            paymentStatus: 'pending',
          });

          // ⭐ State에 저장 (재사용 가능하도록)
          setCreatedReservationId(reservationId);

          devLog.log('✅ 예약 생성 완료 (pending_payment):', {
            reservationId,
            status: 'pending_payment',
          });

          // Analytics (생성 시에만)
          await analyticsService.logCustomEvent('reservation_created_pending', {
            reservation_id: reservationId,
            vehicle_brand: vehicleData.vehicleBrand,
            vehicle_model: vehicleData.vehicleModel,
            service_type: serviceData.serviceType,
            service_price: serviceData.servicePrice,
            source: 'app',
          });
        } else {
          // ✅ 이미 예약이 있으면 재사용
          devLog.log('♻️ 기존 예약 재사용:', {
            reservationId,
            status: 'pending_payment (재사용)',
          });
        }

        // 2️⃣ 생성된/재사용된 예약 ID를 주문번호로 사용
        const orderId = `CHZ_${reservationId}`;
        const orderName = `${vehicleData.vehicleBrand} ${vehicleData.vehicleModel} 배터리 진단`;

        devLog.log('🚀 결제 화면으로 이동:', {
          reservationId,
          orderId,
          amount: serviceData.servicePrice,
          isReused: !!createdReservationId,
        });

        // 로딩 상태 해제 후 결제 화면으로 이동
        hideLoading();
        setIsSubmitting(false);

        // 3️⃣ 결제 화면으로 이동 (예약 ID 포함)
        navigation.navigate('Payment', {
          reservationId,  // ⭐ 생성/재사용된 예약 ID
          reservationData: {
            ...reservationData,
            requestedDate: reservationData.requestedDate instanceof Date
              ? reservationData.requestedDate.toISOString()
              : reservationData.requestedDate,
          },
          orderId,
          orderName,
          amount: serviceData.servicePrice,
        });

        return; // finally 블록의 hideLoading 중복 호출 방지
      }
    } catch (error) {
      devLog.error('❌ 예약 생성 실패:', error);
      sentryLogger.logError('예약 생성/수정 실패', error as Error);
      Alert.alert('예약 실패', '예약 처리 중 오류가 발생했습니다.\\n잠시 후 다시 시도해주세요.');
    } finally {
      hideLoading();
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // 오늘 날짜와 30일 후 날짜 계산
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0] || '';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 프로그레스 인디케이터 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.progressTitle}>
            {currentStep === 1 && "차량 선택"}
            {currentStep === 2 && "주소 입력"}
            {currentStep === 3 && "날짜/시간 선택"}
            {currentStep === 4 && "연락처 입력"}
            {currentStep === 5 && "서비스 선택"}
            {currentStep === 6 && "예약 확인"}
          </Text>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>{currentStep}/6</Text>
          </View>
        </View>
        
        {/* 프로그레스 바 */}
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBar, { width: `${(currentStep / 6) * 100}%` }]}
          />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        pointerEvents="box-none"
      >
        {/* 1단계: 차량 선택 */}
        {currentStep === 1 && (
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={200}
            style={[styles.vehicleSelectionContainer, { pointerEvents: 'box-none' }]}
          >
            <VehicleAccordionSelector
              key="reservation-vehicle-selector"
              visible={showReservationVehicleModal}
              editMode={false}
              onComplete={async (vehicle) => {
                console.log('🎉 ReservationScreen VehicleAccordionSelector onComplete 호출됨!');
                console.log('🚗 ReservationScreen에서 선택된 차량:', vehicle);
                
                try {
                  // 선택된 차량을 사용자 차량 목록에 추가
                  if (user?.uid) {
                    console.log('💾 사용자 차량 목록에 추가 중 (참조만 저장)...');

                    // ✅ 참조만 저장 (vehicles 컬렉션과 JOIN 방식)
                    const vehicleId = await firebaseService.addUserVehicle({
                      userId: user.uid,
                      brandId: vehicle.brandId,   // Firestore ID만
                      modelId: vehicle.modelId,   // Firestore ID만
                      year: vehicle.year,
                      trimId: vehicle.trimId,     // Firestore ID만
                      isActive: true,
                    });

                    console.log('✅ 사용자 차량 추가 완료 (참조):', {
                      vehicleId,
                      brandId: vehicle.brandId,
                      modelId: vehicle.modelId,
                      year: vehicle.year,
                      trimId: vehicle.trimId
                    });

                    // 로컬 차량 목록도 업데이트
                    await loadUserVehicles();
                    console.log('🔄 ReservationScreen 로컬 차량 목록 업데이트 완료');
                  }
                } catch (error) {
                  console.log('❌ 사용자 차량 추가 실패:', error);
                  // 에러가 발생해도 예약은 계속 진행
                }
                
                // vehicleData 설정
                setVehicleData({
                  vehicleBrand: vehicle.make,
                  vehicleModel: vehicle.model,
                  vehicleYear: vehicle.year.toString(),
                });

                // 서비스 데이터 설정 (기본값)
                setServiceData({
                  serviceType: selectedService?.name || '방문 배터리 진단',
                  servicePrice: selectedService?.price || 0,
                });

                // 모달 닫기
                setShowReservationVehicleModal(false);
                setIsVehicleSelected(true);
                  
                  // 다음 단계로 자동 진행
                  setTimeout(() => {
                    setCurrentStep(2);
                  }, 500);
                }}
                onClose={() => {
                  console.log('🔒 ReservationScreen VehicleAccordionSelector 닫기');
                  setShowReservationVehicleModal(false);
                }}
              />
            
            {/* 차량 선택 버튼 */}
            <View style={[styles.welcomeContainer, { pointerEvents: 'box-none' }]}>
              <Text style={styles.welcomeTitle}>내 차량을 선택해 주세요</Text>
              <Text style={styles.welcomeSubtitle}>정확한 진단을 위해 차량 정보가 필요합니다</Text>
              
              {/* 등록된 내 차량 (한 대만 지원) */}
              {userVehicles.length > 0 && (
              <View style={styles.myVehiclesContainer}>
                <Text style={styles.myVehiclesTitle}>내 차량</Text>
                <TouchableOpacity
                  style={styles.myVehicleCard}
                  onPress={() => userVehicles[0] && handleMyVehicleSelect(userVehicles[0])}
                  activeOpacity={0.7}
                >
                  <View style={styles.myVehicleInfo}>
                    <Text
                      style={styles.myVehicleName}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {userVehicles[0]?.year} {userVehicles[0]?.vehicleData?.modelName}
                    </Text>
                    {userVehicles[0]?.trimId && (
                      <Text style={styles.myVehicleTrim}>{userVehicles[0]?.trimId}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
                
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>또는</Text>
                  <View style={styles.dividerLine} />
                </View>
              </View>
              )}
              
              <View style={styles.addVehicleButton}>
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10000,
                    backgroundColor: 'transparent',
                  }}
                  onPress={() => {
                    console.log('🚗 ReservationScreen 차량 버튼 클릭 - 모달 열기');
                    setShowReservationVehicleModal(true);
                  }}
                  activeOpacity={1}
                />
                <Ionicons name="car-outline" size={24} color="#06B6D4" />
                <Text style={styles.addVehicleButtonText}>
                  {userVehicles.length > 0 ? '차량 변경하기' : '차량 선택하기'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>
            </View>
          </Animatable.View>
        )}

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          pointerEvents="box-none"
        >

        {/* 1단계: 차량 & 서비스 선택 (Step 2 이상에서만 표시) */}
        {currentStep > 1 && (
          <View
            style={[styles.stepContainer, { opacity: 1, minHeight: 100 }]}
          >
            <TouchableOpacity 
              style={styles.stepCard}
              onPress={() => handleCardClick(1)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepTitle}>차량 정보 & 서비스 선택</Text>
              
              {/* 복잡한 차량 선택 UI는 제거됨 - 나중에 추가될 예정 */}

              {currentStep > 1 && vehicleData && (
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryText}>
                    {vehicleData.vehicleBrand} {vehicleData.vehicleModel} ({vehicleData.vehicleYear})
                    {vehicleData.vehicleTrim ? ` ${vehicleData.vehicleTrim}` : ''}
                    {serviceData ? ` - ${serviceData.serviceType}` : ''}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 2단계: 주소 선택 */}
        <View
          style={[styles.stepContainer, {
            opacity: currentStep >= 2 ? 1 : 0,
            ...(currentStep === 2 ? { height: 'auto' } : currentStep > 2 ? { minHeight: 100 } : { height: 0 }),
          }]}
        >
          {currentStep >= 2 && (
            <TouchableOpacity 
              style={styles.stepCard}
              onPress={() => handleCardClick(2)}
              disabled={currentStep === 2}
              activeOpacity={currentStep > 2 ? 0.7 : 1}
            >
              <Text style={styles.stepTitle}>방문 주소 선택</Text>
              
              {currentStep === 2 ? (
                <LocationAddressSection
                  mode="full"
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
              ) : (
                addressData && (
                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryText}>
                      {addressData.address}
                      {addressData.detailAddress && ` ${addressData.detailAddress}`}
                    </Text>
                  </View>
                )
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 3단계: 날짜/시간 선택 */}
        <View
          style={[styles.stepContainer, {
            opacity: currentStep >= 3 ? 1 : 0,
            ...(currentStep === 3 ? { height: 'auto' } : currentStep > 3 ? { minHeight: 100 } : { height: 0 }),
          }]}
        >
          {currentStep >= 3 && (
            <TouchableOpacity 
              style={styles.stepCard}
              onPress={() => handleCardClick(3)}
              disabled={currentStep === 3}
              activeOpacity={currentStep > 3 ? 0.7 : 1}
            >
              <Text style={styles.stepTitle}>날짜 & 시간 선택</Text>
              
              {currentStep === 3 ? (
                <View>
                  <Calendar
                    current={formatDate(today)}
                    minDate={formatDate(today)}
                    maxDate={formatDate(maxDate)}
                    onDayPress={handleDateSelect}
                    markedDates={{
                      [selectedDate]: {
                        selected: true,
                        selectedColor: '#06B6D4',
                      },
                    }}
                    theme={{
                      backgroundColor: '#ffffff',
                      calendarBackground: '#ffffff',
                      textSectionTitleColor: '#b6c1cd',
                      selectedDayBackgroundColor: '#06B6D4',
                      selectedDayTextColor: '#ffffff',
                      todayTextColor: '#06B6D4',
                      dayTextColor: '#2d4150',
                      textDisabledColor: '#d9e1e8',
                      arrowColor: '#06B6D4',
                    }}
                  />

                  {selectedDate && (
                    <View style={styles.timeSlotsContainer}>
                      <Text style={styles.inputLabel}>시간 선택</Text>
                      {isLoadingTimeSlots ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color="#06B6D4" />
                          <Text style={styles.loadingText}>예약정보를 불러오는 중...</Text>
                        </View>
                      ) : (
                        <View style={styles.timeGrid}>
                          {timeSlots.reduce((rows, slot, index) => {
                            const rowIndex = Math.floor(index / 4);
                            if (!rows[rowIndex]) rows[rowIndex] = [];
                            rows[rowIndex].push(slot);
                            return rows;
                          }, [] as TimeSlot[][]).map((row, rowIndex) => (
                            <View key={rowIndex} style={styles.timeRow}>
                              {row.map((item) => (
                                <TouchableOpacity
                                  key={item.id}
                                  style={[
                                    styles.timeSlot,
                                    !item.available && styles.timeSlotDisabled,
                                    selectedTimeSlot?.id === item.id && styles.timeSlotSelected,
                                    { width: `${(100 - 9) / 4}%` }
                                  ]}
                                  onPress={() => item.available && setSelectedTimeSlot(item)}
                                  disabled={!item.available}
                                >
                                  <Text
                                    style={[
                                      styles.timeSlotText,
                                      !item.available && styles.timeSlotTextDisabled,
                                      selectedTimeSlot?.id === item.id && styles.timeSlotTextSelected,
                                    ]}
                                  >
                                    {item.time}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                dateTimeData && (
                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryText}>
                      {dateTimeData.selectedDate} {dateTimeData.selectedTime}
                    </Text>
                  </View>
                )
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 4단계: 연락처 정보 */}
        <View
          style={[styles.stepContainer, {
            opacity: currentStep >= 4 ? 1 : 0,
            ...(currentStep === 4 ? { height: 'auto' } : currentStep > 4 ? { minHeight: 100 } : { height: 0 }),
          }]}
        >
          {currentStep >= 4 && (
            <TouchableOpacity 
              style={styles.stepCard}
              onPress={() => handleCardClick(4)}
              disabled={currentStep === 4}
              activeOpacity={currentStep > 4 ? 0.7 : 1}
            >
              <Text style={styles.stepTitle}>연락처 정보</Text>
              
              {currentStep === 4 ? (
                <View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>이름 *</Text>
                    <TextInput
                      style={[styles.textInput, nameError && styles.textInputError]}
                      placeholder="이름을 입력하세요"
                      value={userName}
                      onChangeText={(text) => {
                        setUserName(text);
                        if (nameError) validateName(text);
                      }}
                      onBlur={() => validateName(userName)}
                    />
                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>전화번호 *</Text>
                    <TextInput
                      style={[styles.textInput, phoneError && styles.textInputError]}
                      placeholder="010-0000-0000"
                      value={userPhone}
                      onChangeText={(text) => {
                        const formatted = formatPhoneNumber(text);
                        setUserPhone(formatted);
                        if (phoneError) validatePhone(formatted);
                      }}
                      onBlur={() => validatePhone(userPhone)}
                      keyboardType="phone-pad"
                      maxLength={13}
                    />
                    {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>추가 요청사항</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder="특별한 요청사항이 있으시면 입력해주세요"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              ) : (
                contactData && (
                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryText}>
                      {contactData.userName} - {formatPhoneNumber(contactData.userPhone)}
                    </Text>
                  </View>
                )
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 5단계: 서비스 타입 선택 */}
        <View
          style={[styles.stepContainer, {
            opacity: currentStep >= 5 ? 1 : 0,
            ...(currentStep === 5 ? { height: 'auto' } : currentStep > 5 ? { minHeight: 100 } : { height: 0 }),
          }]}
        >
          {currentStep >= 5 && (
            <TouchableOpacity 
              style={styles.stepCard}
              onPress={() => handleCardClick(5)}
              disabled={currentStep === 5}
              activeOpacity={currentStep > 5 ? 0.7 : 1}
            >
              <Text style={styles.stepTitle}>서비스 타입 선택</Text>
              
              {currentStep === 5 ? (
                <View style={styles.serviceTypeSelection}>
                  <Text style={styles.serviceTypeLabel}>원하시는 서비스 타입을 선택해주세요</Text>
                  
                  <View style={styles.serviceTypeOptions}>
                    <TouchableOpacity
                      style={[
                        styles.serviceTypeOption,
                        serviceType === 'standard' && styles.serviceTypeOptionSelected
                      ]}
                      onPress={() => {
                        setServiceType('standard');
                        setServicePrice(100000);
                        setServiceData({
                          serviceType: 'standard',
                          servicePrice: 100000,
                        });
                      }}
                    >
                      <View style={styles.serviceTypeHeader}>
                        <Text style={[
                          styles.serviceTypeName,
                          serviceType === 'standard' && styles.serviceTypeNameSelected
                        ]}>
                          스탠다드
                        </Text>
                        <Text style={[
                          styles.serviceTypePrice,
                          serviceType === 'standard' && styles.serviceTypePriceSelected
                        ]}>
                          100,000원
                        </Text>
                      </View>
                      <Text style={[
                        styles.serviceTypeDescription,
                        serviceType === 'standard' && styles.serviceTypeDescriptionSelected
                      ]}>
                        기본 배터리 진단 서비스
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.serviceTypeOption,
                        serviceType === 'premium' && styles.serviceTypeOptionSelected
                      ]}
                      onPress={() => {
                        setServiceType('premium');
                        setServicePrice(200000);
                        setServiceData({
                          serviceType: 'premium',
                          servicePrice: 200000,
                        });
                      }}
                    >
                      <View style={styles.serviceTypeHeader}>
                        <Text style={[
                          styles.serviceTypeName,
                          serviceType === 'premium' && styles.serviceTypeNameSelected
                        ]}>
                          프리미엄
                        </Text>
                        <Text style={[
                          styles.serviceTypePrice,
                          serviceType === 'premium' && styles.serviceTypePriceSelected
                        ]}>
                          200,000원
                        </Text>
                      </View>
                      <Text style={[
                        styles.serviceTypeDescription,
                        serviceType === 'premium' && styles.serviceTypeDescriptionSelected
                      ]}>
                        기술분석 배터리 진단
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                serviceData && (
                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryText}>
                      {serviceType === 'standard' ? '스탠다드' : '프리미엄'} • {servicePrice.toLocaleString()}원
                    </Text>
                  </View>
                )
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 6단계: 예약 확인 */}
        <View
          style={[styles.stepContainer, {
            opacity: currentStep >= 6 ? 1 : 0,
            height: currentStep === 6 ? 'auto' : 0,
          }]}
        >
          {currentStep === 6 && vehicleData && serviceData && addressData && dateTimeData && contactData && serviceType && (
            <TouchableOpacity 
              style={styles.stepCard}
              onPress={() => handleCardClick(6)}
              disabled={currentStep === 6}
              activeOpacity={currentStep > 6 ? 0.7 : 1}
            >
              <Text style={styles.stepTitle}>예약 확인</Text>
              
              <View style={styles.confirmationHeader}>
                <Ionicons name="checkmark-circle" size={48} color="#06B6D4" />
                <Text style={styles.confirmationTitle}>예약 정보를 확인해주세요</Text>
              </View>

              <View style={styles.confirmationDetails}>
                <View style={styles.confirmationSection}>
                  <Text style={styles.confirmationSectionTitle}>차량 정보</Text>
                  <Text style={styles.confirmationText}>
                    {vehicleData.vehicleBrand} {vehicleData.vehicleModel} ({vehicleData.vehicleYear})
                  </Text>
                </View>

                <View style={styles.confirmationSection}>
                  <Text style={styles.confirmationSectionTitle}>서비스</Text>
                  <Text style={styles.confirmationText}>
                    {serviceData.serviceType} - {serviceData.servicePrice.toLocaleString()}원
                  </Text>
                </View>

                <View style={styles.confirmationSection}>
                  <Text style={styles.confirmationSectionTitle}>방문 주소</Text>
                  <Text style={styles.confirmationText}>
                    {addressData.address}
                    {addressData.detailAddress && ` ${addressData.detailAddress}`}
                  </Text>
                </View>

                <View style={styles.confirmationSection}>
                  <Text style={styles.confirmationSectionTitle}>예약 일시</Text>
                  <Text style={styles.confirmationText}>
                    {dateTimeData.selectedDate} {dateTimeData.selectedTime}
                  </Text>
                </View>

                <View style={styles.confirmationSection}>
                  <Text style={styles.confirmationSectionTitle}>연락처</Text>
                  <Text style={styles.confirmationText}>
                    {contactData.userName} - {formatPhoneNumber(contactData.userPhone)}
                  </Text>
                  {contactData.notes && (
                    <Text style={styles.confirmationText}>요청사항: {contactData.notes}</Text>
                  )}
                </View>
              </View>

              <View style={styles.noticeContainer}>
                <Text style={styles.noticeTitle}>안내사항</Text>
                <View style={styles.noticeItem}>
                  <Text style={styles.noticeBullet}>•</Text>
                  <Text style={styles.noticeText}>
                    결제 완료 후 담당자가 연락드려 정확한 방문 시간을 조율합니다
                  </Text>
                </View>
                <View style={styles.noticeItem}>
                  <Text style={styles.noticeBullet}>•</Text>
                  <Text style={styles.noticeText}>
                    진단 시간은 약 1시간 정도 소요됩니다
                  </Text>
                </View>
                <View style={styles.noticeItem}>
                  <Text style={styles.noticeBullet}>•</Text>
                  <Text style={styles.noticeText}>
                    진단 완료 후 24시간 내 상세 리포트를 제공합니다
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {currentStep < 6 ? (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceedToNext() && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceedToNext()}
          >
            <Text style={[
              styles.nextButtonText,
              !canProceedToNext() && styles.nextButtonTextDisabled,
            ]}>
              다음
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
              onPress={handleConfirmReservation}
              disabled={isSubmitting}
            >
              <Text style={styles.confirmButtonText}>{editMode ? '수정 완료' : '결제하기'}</Text>
            </TouchableOpacity>

            {/* 이전 버튼 (텍스트만) */}
            <TouchableOpacity
              style={styles.previousTextButton}
              onPress={handlePrevious}
            >
              <Text style={styles.previousTextButtonText}>이전</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      </KeyboardAvoidingView>

      {/* 차량 선택 모달은 1단계에서 직접 처리됨 */}
    </SafeAreaView>
  );

  // 다음 단계 진행 가능 여부 확인
  function canProceedToNext(): boolean {
    switch (currentStep) {
      case 1:
        const finalBrand = isManualInput ? manualBrand : selectedBrand?.name || '';
        const finalModel = isManualInput ? manualModel : selectedModel;
        return !!(finalBrand.trim() && finalModel.trim() && selectedYear.trim() && selectedService);
      case 2:
        return !!userAddress.trim();
      case 3:
        return !!(selectedDate && selectedTimeSlot);
      case 4:
        return !!(userName.trim() && userPhone.trim() && !nameError && !phoneError);
      case 5:
        return !!serviceType;
      default:
        return false;
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // 프로그레스 인디케이터 스타일
  progressContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  stepIndicator: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#06B6D4',
    borderRadius: 2,
  },
  // 차량 선택 컨테이너 스타일
  vehicleSelectionContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    minHeight: '100%',
  },
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 32,
    paddingVertical: 40,
    minHeight: 400,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 24,
  },
  addVehicleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 100,
    minHeight: 60,
  },
  addVehicleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  stepIndicatorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  stepIndicatorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  stepDotIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  stepDotActive: {
    backgroundColor: '#2196f3',
  },
  stepContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#06B6D4',
    marginBottom: 8,
  },
  inputModeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#2196f3',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  textInputError: {
    borderColor: '#f44336',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  serviceCardSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  serviceCardTitleSelected: {
    color: '#1976d2',
  },
  serviceCardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196f3',
  },
  serviceCardPriceSelected: {
    color: '#1976d2',
  },
  serviceCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  serviceCardDescriptionSelected: {
    color: '#555',
  },
  serviceCardFeatures: {
    gap: 4,
  },
  serviceCardFeature: {
    fontSize: 13,
    color: '#666',
  },
  serviceCardFeatureSelected: {
    color: '#555',
  },
  serviceInfoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  serviceInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  serviceInfoPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196f3',
  },
  serviceInfoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceInfoFeatures: {
    gap: 6,
  },
  serviceInfoFeature: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  timeSlotsContainer: {
    marginTop: 16,
  },
  timeGrid: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  timeSlot: {
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeSlotDisabled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  timeSlotSelected: {
    backgroundColor: '#06B6D4',
    borderColor: '#0891B2',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  timeSlotTextDisabled: {
    color: '#999',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  summaryContainer: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  summaryText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    lineHeight: 22,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
  },
  confirmationDetails: {
    marginBottom: 24,
  },
  confirmationSection: {
    marginBottom: 16,
  },
  confirmationSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  confirmationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  noticeContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 12,
  },
  noticeItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  noticeBullet: {
    fontSize: 13,
    color: '#888888',
    marginRight: 8,
    lineHeight: 18,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#888888',
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  nextButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: '#999',
  },
  confirmButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  previousTextButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  previousTextButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalCancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#06B6D4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // 내 차량 목록 스타일
  myVehiclesContainer: {
    marginBottom: 20,
  },
  myVehiclesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  myVehicleCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  myVehicleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  myVehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  myVehicleTrim: {
    fontSize: 14,
    color: '#6B7280',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // 서비스 타입 선택 스타일
  serviceTypeSelection: {
    marginTop: 16,
  },
  serviceTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  serviceTypeOptions: {
    gap: 12,
  },
  serviceTypeOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  serviceTypeOptionSelected: {
    borderColor: '#06B6D4',
    backgroundColor: '#F0FDF4',
  },
  serviceTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTypeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  serviceTypeNameSelected: {
    color: '#06B6D4',
  },
  serviceTypePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  serviceTypePriceSelected: {
    color: '#06B6D4',
  },
  serviceTypeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  serviceTypeDescriptionSelected: {
    color: '#059669',
  },
});

export default ReservationScreen;