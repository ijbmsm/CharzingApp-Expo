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
} from 'react-native';
import { MotiView } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import Header from '../components/Header';
import LocationAddressSection from '../components/LocationAddressSection';
import KakaoMapView from '../components/KakaoMapView';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useLoading } from '../contexts/LoadingContext';
import firebaseService from '../services/firebaseService';
import analyticsService from '../services/analyticsService';
import { devLog } from '../utils/devLog';
import { VEHICLE_BRANDS, VEHICLE_MODELS, RESERVATION_TYPES, VehicleBrand, VehicleModel, ReservationType } from '../constants/vehicles';

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

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface VehicleData {
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
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

  // 수정 모드 및 기존 예약 데이터
  const editMode = route.params?.editMode || false;
  const existingReservation = route.params?.reservation || null;

  // 예약 단계 관리
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
  const [selectedService, setSelectedService] = useState<ReservationType | null>(null);
  
  // 차량 선택 모달
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);
  const [showYearModal, setShowYearModal] = useState<boolean>(false);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

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

  // 5단계: 예약 확인
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);

  // moti 애니메이션을 위한 step 상태로 제어

  useEffect(() => {
    // 초기 위치 설정
    setUserLocation({ latitude: 37.5665, longitude: 126.9780 });
    
    // 사용자 정보 자동 입력 - 실명 우선 사용
    if (user) {
      setUserName(user.realName || user.displayName || user.email?.split('@')[0] || '');
      setUserPhone((user as any).phoneNumber || '');
    }

    // Analytics
    analyticsService.logScreenView('ReservationScreen', 'ReservationScreen').catch(console.error);
  }, [user]);

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

  // 로그인 체크
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Login', { showBackButton: true });
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

  // 차량 선택 핸들러
  const handleVehicleSelect = (brand: VehicleBrand, model: VehicleModel) => {
    setSelectedBrand(brand);
    setSelectedModel(model.name);
    setSelectedModelData(model);
    setShowVehicleModal(false);
    setShowYearModal(true);
  };

  // 연식 선택 핸들러
  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    setShowYearModal(false);
  };

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

    setShowConfirmationModal(false);
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
        // 생성 모드: 새로운 예약 생성
        const reservationData = {
          userId: user?.uid || '',
          userName: contactData.userName,
          userPhone: contactData.userPhone,
          address: addressData.address,
          detailAddress: addressData.detailAddress || '',
          latitude: addressData.latitude,
          longitude: addressData.longitude,
          vehicleBrand: vehicleData.vehicleBrand,
          vehicleModel: vehicleData.vehicleModel,
          vehicleYear: vehicleData.vehicleYear,
          serviceType: serviceData.serviceType,
          servicePrice: serviceData.servicePrice,
          status: 'pending' as const,
          requestedDate: dateTimeData.requestedDateTime,
          notes: contactData.notes || '',
          source: 'app' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        devLog.log('🚀 Firebase에 저장할 예약 데이터:', JSON.stringify(reservationData, null, 2));

        const reservationId = await firebaseService.createDiagnosisReservation(reservationData);
        
        // Analytics
        await analyticsService.logCustomEvent('reservation_completed', {
          reservation_id: reservationId,
          vehicle_brand: vehicleData.vehicleBrand,
          vehicle_model: vehicleData.vehicleModel,
          service_type: serviceData.serviceType,
          service_price: serviceData.servicePrice,
          source: 'app',
        });

        Alert.alert(
          '예약 완료',
          '진단 예약이 성공적으로 완료되었습니다.\n담당자가 연락드려 일정을 확정할 예정입니다.',
          [
            {
              text: '확인',
              onPress: () => {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                  })
                );
              },
            },
          ]
        );
      }
    } catch (error) {
      devLog.error('❌ 예약 생성 실패:', error);
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
      <Header 
        title={editMode ? "예약 수정" : "진단 예약"} 
        showBackButton 
        onBackPress={handlePrevious}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* 1단계: 차량 & 서비스 선택 */}
        <MotiView
          style={styles.stepContainer}
          animate={{
            opacity: currentStep >= 1 ? 1 : 0,
            translateY: currentStep === 1 ? 0 : currentStep > 1 ? 0 : 50,
            height: currentStep === 1 ? 'auto' : currentStep > 1 ? 100 : 0,
          }}
          transition={{
            type: 'timing',
            duration: 350,
          }}
        >
          {currentStep >= 1 && (
            <TouchableOpacity 
              style={styles.stepCard}
              onPress={() => handleCardClick(1)}
              disabled={currentStep === 1}
              activeOpacity={currentStep > 1 ? 0.7 : 1}
            >
              <Text style={styles.stepTitle}>차량 정보 & 서비스 선택</Text>
              
              {currentStep === 1 && (
                <View>
                  {/* 차량 선택 방식 */}
                  <View style={styles.inputModeContainer}>
                    <TouchableOpacity
                      style={[styles.modeButton, !isManualInput && styles.modeButtonActive]}
                      onPress={() => setIsManualInput(false)}
                    >
                      <Text style={[styles.modeButtonText, !isManualInput && styles.modeButtonTextActive]}>
                        목록에서 선택
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modeButton, isManualInput && styles.modeButtonActive]}
                      onPress={toggleManualInput}
                    >
                      <Text style={[styles.modeButtonText, isManualInput && styles.modeButtonTextActive]}>
                        직접 입력
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {!isManualInput ? (
                    <View>
                      {/* 차량 선택 버튼 */}
                      <View style={styles.inputContainer}>
                        <TouchableOpacity
                          style={styles.vehicleSelectButton}
                          onPress={() => setShowVehicleModal(true)}
                        >
                          <Text style={styles.vehicleSelectButtonText}>
                            {selectedBrand && selectedModel && selectedYear 
                              ? `${selectedBrand.name} ${selectedModel} (${selectedYear}년)`
                              : '차량을 선택해주세요'
                            }
                          </Text>
                          <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View>
                      {/* 직접 입력 */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>차량 브랜드</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="예: 현대, 기아, BMW 등"
                          value={manualBrand}
                          onChangeText={setManualBrand}
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>차량 모델</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="예: 소나타, K5, 320i 등"
                          value={manualModel}
                          onChangeText={setManualModel}
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>연식</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="예: 2023"
                          value={selectedYear}
                          onChangeText={setSelectedYear}
                          keyboardType="numeric"
                          maxLength={4}
                        />
                      </View>
                    </View>
                  )}

                  {/* 서비스 타입 선택 */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>서비스 타입</Text>
                    {RESERVATION_TYPES.map((service) => (
                      <TouchableOpacity
                        key={service.id}
                        style={[
                          styles.serviceCard,
                          selectedService?.id === service.id && styles.serviceCardSelected,
                        ]}
                        onPress={() => setSelectedService(service)}
                      >
                        <View style={styles.serviceCardHeader}>
                          <Text
                            style={[
                              styles.serviceCardTitle,
                              selectedService?.id === service.id && styles.serviceCardTitleSelected,
                            ]}
                          >
                            {service.name}
                          </Text>
                          <Text
                            style={[
                              styles.serviceCardPrice,
                              selectedService?.id === service.id && styles.serviceCardPriceSelected,
                            ]}
                          >
                            {service.price.toLocaleString()}원
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.serviceCardDescription,
                            selectedService?.id === service.id && styles.serviceCardDescriptionSelected,
                          ]}
                        >
                          {service.description}
                        </Text>
                        <View style={styles.serviceCardFeatures}>
                          {service.features.slice(0, 3).map((feature, index) => (
                            <Text
                              key={index}
                              style={[
                                styles.serviceCardFeature,
                                selectedService?.id === service.id && styles.serviceCardFeatureSelected,
                              ]}
                            >
                              • {feature}
                            </Text>
                          ))}
                          {service.features.length > 3 && (
                            <Text
                              style={[
                                styles.serviceCardFeature,
                                selectedService?.id === service.id && styles.serviceCardFeatureSelected,
                              ]}
                            >
                              외 {service.features.length - 3}가지
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {currentStep > 1 && vehicleData && serviceData && (
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryText}>
                    {vehicleData.vehicleBrand} {vehicleData.vehicleModel} ({vehicleData.vehicleYear}) - {serviceData.serviceType}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </MotiView>

        {/* 2단계: 주소 선택 */}
        <MotiView
          style={styles.stepContainer}
          animate={{
            opacity: currentStep >= 2 ? 1 : 0,
            translateY: currentStep === 2 ? 0 : currentStep > 2 ? 0 : 50,
            height: currentStep === 2 ? 'auto' : currentStep > 2 ? 100 : 0,
          }}
          transition={{
            type: 'timing',
            duration: 350,
          }}
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
        </MotiView>

        {/* 3단계: 날짜/시간 선택 */}
        <MotiView
          style={styles.stepContainer}
          animate={{
            opacity: currentStep >= 3 ? 1 : 0,
            translateY: currentStep === 3 ? 0 : currentStep > 3 ? 0 : 50,
            height: currentStep === 3 ? 'auto' : currentStep > 3 ? 100 : 0,
          }}
          transition={{
            type: 'timing',
            duration: 350,
          }}
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
                        selectedColor: '#2196f3',
                      },
                    }}
                    theme={{
                      backgroundColor: '#ffffff',
                      calendarBackground: '#ffffff',
                      textSectionTitleColor: '#b6c1cd',
                      selectedDayBackgroundColor: '#2196f3',
                      selectedDayTextColor: '#ffffff',
                      todayTextColor: '#2196f3',
                      dayTextColor: '#2d4150',
                      textDisabledColor: '#d9e1e8',
                      arrowColor: '#2196f3',
                    }}
                  />

                  {selectedDate && (
                    <View style={styles.timeSlotsContainer}>
                      <Text style={styles.inputLabel}>시간 선택</Text>
                      {isLoadingTimeSlots ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color="#2196f3" />
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
        </MotiView>

        {/* 4단계: 연락처 정보 */}
        <MotiView
          style={styles.stepContainer}
          animate={{
            opacity: currentStep >= 4 ? 1 : 0,
            translateY: currentStep === 4 ? 0 : currentStep > 4 ? 0 : 50,
            height: currentStep === 4 ? 'auto' : currentStep > 4 ? 100 : 0,
          }}
          transition={{
            type: 'timing',
            duration: 350,
          }}
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
        </MotiView>

        {/* 5단계: 예약 확인 */}
        <MotiView
          style={styles.stepContainer}
          animate={{
            opacity: currentStep >= 5 ? 1 : 0,
            translateY: currentStep === 5 ? 0 : 50,
            height: currentStep === 5 ? 'auto' : 0,
          }}
          transition={{
            type: 'timing',
            duration: 350,
          }}
        >
          {currentStep === 5 && vehicleData && serviceData && addressData && dateTimeData && contactData && (
            <TouchableOpacity 
              style={styles.stepCard}
              onPress={() => handleCardClick(5)}
              disabled={currentStep === 5}
              activeOpacity={currentStep > 5 ? 0.7 : 1}
            >
              <Text style={styles.stepTitle}>예약 확인</Text>
              
              <View style={styles.confirmationHeader}>
                <Ionicons name="checkmark-circle" size={48} color="#4caf50" />
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
                <Text style={styles.noticeTitle}>📋 안내사항</Text>
                <Text style={styles.noticeText}>
                  • 예약 확정 후 담당자가 연락드려 정확한 방문 시간을 조율합니다
                </Text>
                <Text style={styles.noticeText}>
                  • 진단 시간은 약 30분 정도 소요됩니다
                </Text>
                <Text style={styles.noticeText}>
                  • 진단 완료 후 24시간 내 상세 리포트를 제공합니다
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </MotiView>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        {currentStep < 5 ? (
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
          <TouchableOpacity
            style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
            onPress={() => setShowConfirmationModal(true)}
            disabled={isSubmitting}
          >
            <Text style={styles.confirmButtonText}>예약 확정하기</Text>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>예약 확정</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowConfirmationModal(false)}
              >
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalText}>
              입력하신 정보로 예약을 확정하시겠습니까?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmationModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmReservation}
              >
                <Text style={styles.modalConfirmButtonText}>확정</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 차량 선택 모달 */}
      <Modal
        visible={showVehicleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <SafeAreaView style={styles.vehicleModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>차량 선택</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowVehicleModal(false)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.vehicleModalContent} showsVerticalScrollIndicator={false}>
              {VEHICLE_BRANDS.map((brand) => {
                const models = VEHICLE_MODELS[brand.id] || [];
                if (models.length === 0) return null;
                
                return (
                  <View key={brand.id} style={styles.brandSection}>
                    <Text style={styles.brandTitle}>{brand.name}</Text>
                    {models.map((model) => {
                      const modelKey = `${brand.id}-${model.id}`;
                      const isExpanded = expandedModel === modelKey;
                      const years = model.years || getYearOptions();
                      
                      return (
                        <View key={modelKey} style={styles.vehicleListItem}>
                          <TouchableOpacity
                            style={styles.vehicleItemHeader}
                            onPress={() => setExpandedModel(isExpanded ? null : modelKey)}
                          >
                            <Text style={styles.vehicleItemText}>
                              {model.name}
                            </Text>
                            <Ionicons 
                              name={isExpanded ? "chevron-up" : "chevron-down"} 
                              size={22} 
                              color={isExpanded ? "#3B82F6" : "#64748B"} 
                            />
                          </TouchableOpacity>
                          
                          {isExpanded && (
                            <View style={styles.yearList}>
                              <View style={styles.yearGrid}>
                                {years.reduce((rows: string[][], year: string, index: number) => {
                                  const rowIndex = Math.floor(index / 3);
                                  if (!rows[rowIndex]) rows[rowIndex] = [];
                                  rows[rowIndex].push(year);
                                  return rows;
                                }, [] as string[][]).map((row: string[], rowIndex: number) => (
                                  <View key={rowIndex} style={styles.yearRow}>
                                    {row.map((year) => (
                                      <TouchableOpacity
                                        key={year}
                                        style={[
                                          styles.yearListItem,
                                          { width: `${(100 - 6) / 3}%` }
                                        ]}
                                        onPress={() => {
                                          setSelectedBrand(brand);
                                          setSelectedModel(model.name);
                                          setSelectedModelData(model);
                                          setSelectedYear(year);
                                          setShowVehicleModal(false);
                                          setExpandedModel(null);
                                        }}
                                      >
                                        <Text style={styles.yearListItemText}>{year}년</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 연식 선택 모달 */}
      <Modal
        visible={showYearModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowYearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.yearModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>연식 선택</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowYearModal(false)}
              >
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.selectedVehicleText}>
              {selectedBrand?.name} {selectedModel}
            </Text>
            
            <View style={styles.yearGrid}>
              {(selectedModelData?.years || getYearOptions()).reduce((rows, year, index) => {
                const rowIndex = Math.floor(index / 4);
                if (!rows[rowIndex]) rows[rowIndex] = [];
                rows[rowIndex].push(year);
                return rows;
              }, [] as string[][]).map((row, rowIndex) => (
                <View key={rowIndex} style={styles.yearRow}>
                  {row.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.yearItem, { width: `${(100 - 9) / 4}%` }]}
                      onPress={() => handleYearSelect(item)}
                    >
                      <Text style={styles.yearItemText}>{item}년</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
      default:
        return false;
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingTop: 16,
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
  stepIndicator: {
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
    marginBottom: 16,
  },
  stepCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
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
    backgroundColor: '#2196f3',
    borderColor: '#1976d2',
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
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
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
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
    marginBottom: 4,
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  nextButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
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
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  vehicleSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  vehicleSelectButtonText: {
    fontSize: 16,
    color: '#333',
  },
  vehicleModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  vehicleModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  brandSection: {
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    position: 'relative',
    textAlign: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  vehicleListItem: {
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  vehicleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  vehicleItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    letterSpacing: -0.1,
  },
  yearList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FAFBFC',
  },
  yearGrid: {
    paddingBottom: 8,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  yearListItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.02,
    shadowRadius: 1,
    elevation: 0.5,
  },
  yearListItemText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
  },
  yearModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '40%',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  selectedVehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196f3',
    textAlign: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  yearItem: {
    flex: 1,
    margin: 4,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  yearItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default ReservationScreen;