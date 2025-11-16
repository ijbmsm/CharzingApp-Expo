import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import AddressSearch from '../components/AddressSearch';
import DateTimeSection from '../components/DateTimeSection';
import firebaseService, { DiagnosisReservation } from '../services/firebaseService';
import { RootStackParamList } from '../navigation/RootNavigator';

type ModifyReservationScreenRouteProp = RouteProp<RootStackParamList, 'ModifyReservation'>;
type ModifyReservationScreenNavigationProp = StackNavigationProp<RootStackParamList>;


const ModifyReservationScreen: React.FC = () => {
  const navigation = useNavigation<ModifyReservationScreenNavigationProp>();
  const route = useRoute<ModifyReservationScreenRouteProp>();
  const { reservation } = route.params;

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: 위치, 2: 날짜/시간, 3: 차량/서비스/연락처, 4: 확인
  
  // 위치 관련 상태
  const [userLocation, setUserLocation] = useState({
    latitude: 37.5665,
    longitude: 126.9780,
  });
  const [userAddress, setUserAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [notes, setNotes] = useState('');

  // 날짜/시간 관련 상태
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [timeSlots, setTimeSlots] = useState<{ id: string; time: string; available: boolean; }[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

  // 차량 정보 상태
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');

  // 서비스 정보 상태
  const [serviceType, setServiceType] = useState('');
  const [servicePrice, setServicePrice] = useState(0);

  // 연락처 정보 상태
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // 초기값 설정
  useEffect(() => {
    if (reservation) {
      setUserLocation({
        latitude: reservation.latitude,
        longitude: reservation.longitude,
      });
      setUserAddress(reservation.address);
      setDetailAddress(reservation.detailAddress || '');
      setNotes(((reservation as any).notes as string) || '');

      // 차량 정보 설정
      setVehicleBrand(((reservation as any).vehicleBrand as string) || '');
      setVehicleModel(((reservation as any).vehicleModel as string) || '');
      setVehicleYear(((reservation as any).vehicleYear as string) || '');

      // 서비스 정보 설정
      setServiceType(((reservation as any).serviceType as string) || '');
      setServicePrice(((reservation as any).servicePrice as number) || 0);

      // 연락처 정보 설정
      setUserName(((reservation as any).userName as string) || '');
      setUserPhone(((reservation as any).userPhone as string) || '');

      // 기존 예약 날짜 설정 (개선된 로직)
      console.log('🔧 기존 예약 날짜 파싱 시작');
      console.log('reservation.requestedDate:', reservation.requestedDate);
      console.log('타입:', typeof reservation.requestedDate);

      let reservationDate: Date | null = null;

      if (reservation.requestedDate) {
        if (typeof reservation.requestedDate === 'string') {
          reservationDate = new Date(reservation.requestedDate);
        } else if (reservation.requestedDate instanceof Date) {
          reservationDate = reservation.requestedDate;
        } else if (reservation.requestedDate && typeof reservation.requestedDate === 'object' && 'toDate' in reservation.requestedDate && typeof reservation.requestedDate.toDate === 'function') {
          // Firestore Timestamp 객체인 경우
          reservationDate = reservation.requestedDate.toDate();
        }
      }
      
      if (reservationDate && !isNaN(reservationDate.getTime())) {
        console.log('🕐 파싱된 기존 날짜:', reservationDate);
        console.log('🕐 로컬 문자열:', reservationDate.toLocaleString('ko-KR'));
        
        const dateString = reservationDate.toISOString().split('T')[0];
        const timeString = `${reservationDate.getHours().toString().padStart(2, '0')}:${reservationDate.getMinutes().toString().padStart(2, '0')}`;
        
        console.log('🗓️ dateString:', dateString);
        console.log('🕐 timeString:', timeString);
        
        setSelectedDate(dateString || '');
        setSelectedTimeSlot(`${dateString}-${timeString || ''}`);
        
        console.log('✅ 기존 예약 날짜/시간 설정 완료');
      } else {
        console.warn('⚠️ 기존 예약 날짜 파싱 실패, 기본값 사용');
      }
    }
  }, [reservation]);

  // 선택된 날짜가 변경되면 시간 슬롯도 로드
  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    }
  }, [selectedDate]);


  // 예약 가능한 시간대 생성 (DiagnosisReservationScreen에서 복사)
  const generateTimeSlots = async (date: string) => {
    try {
      const selectedDateObj = new Date(date);
      const now = new Date();
      
      // 웹에서 설정한 가용 시간 슬롯 가져오기
      const availableSlots = await firebaseService.getAvailableTimeSlots(selectedDateObj);
      
      const timeSlots: { id: string; time: string; available: boolean; }[] = [];
      
      for (const timeSlot of availableSlots) {
        const [hour, minute] = timeSlot.split(':').map(Number);
        const slotDateTime = new Date(selectedDateObj);
        slotDateTime.setHours(hour || 0, minute || 0, 0, 0);
        
        // 과거 시간 체크
        const isPast = slotDateTime.getTime() <= now.getTime();
        
        // 실제 예약 여부 확인 (기존 예약과 충돌하는지) - 현재 수정 중인 예약은 제외
        const isAvailable = await firebaseService.isTimeSlotAvailable(selectedDateObj, timeSlot, reservation.id);
        
        timeSlots.push({
          id: `${date}-${timeSlot}`,
          time: timeSlot,
          available: !isPast && isAvailable,
        });
      }
      
      return timeSlots;
    } catch (error) {
      console.error('시간 슬롯 생성 실패:', error);
      // 오류 시 기본 시간 슬롯 반환
      const defaultSlots: { id: string; time: string; available: boolean; }[] = [];
      for (let hour = 9; hour <= 17; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        defaultSlots.push({
          id: `${date}-${timeSlot}`,
          time: timeSlot,
          available: false,
        });
      }
      return defaultSlots;
    }
  };

  // 시간 슬롯 로드
  const loadTimeSlots = async (date: string) => {
    try {
      setIsLoadingTimeSlots(true);
      const slots = await generateTimeSlots(date);
      setTimeSlots(slots);
    } catch (error) {
      console.error('시간 슬롯 로드 실패:', error);
      setTimeSlots([]);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  const handleAddressSelect = (address: string, zonecode: string) => {
    setUserAddress(address);
    // 주소 검색으로는 정확한 좌표를 얻기 어려우므로 기본값 사용
    // 실제 서비스에서는 카카오 지오코딩 API로 주소→좌표 변환 필요
    setUserLocation({
      latitude: 37.5665, // 서울 중심 기본값
      longitude: 126.9780
    });
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedTimeSlot('');
    loadTimeSlots(day.dateString);
  };

  const handleTimeSlotSelect = (timeSlotId: string) => {
    setSelectedTimeSlot(timeSlotId);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!userAddress.trim()) {
        Alert.alert('알림', '위치를 선택해주세요.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedDate || !selectedTimeSlot) {
        Alert.alert('알림', '날짜와 시간을 선택해주세요.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // 차량/서비스/연락처 정보 검증
      if (!vehicleBrand.trim() || !vehicleModel.trim() || !vehicleYear.trim()) {
        Alert.alert('알림', '차량 정보를 모두 입력해주세요.');
        return;
      }
      if (!serviceType.trim()) {
        Alert.alert('알림', '서비스 유형을 선택해주세요.');
        return;
      }
      if (!userName.trim() || !userPhone.trim()) {
        Alert.alert('알림', '연락처 정보를 모두 입력해주세요.');
        return;
      }
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
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

  const handleConfirmModification = async () => {
    try {
      setLoading(true);

      // 선택된 날짜와 시간을 조합 (더 안전한 파싱)
      console.log('🔧 날짜/시간 파싱 시작');
      console.log('selectedDate:', selectedDate);
      console.log('selectedTimeSlot:', selectedTimeSlot);

      if (!selectedDate || !selectedTimeSlot) {
        throw new Error('날짜 또는 시간이 선택되지 않았습니다.');
      }

      // selectedTimeSlot 형태: "2025-01-15-14:00"
      const timeSlotParts = selectedTimeSlot.split('-');
      if (timeSlotParts.length < 4) {
        throw new Error('시간 슬롯 형식이 올바르지 않습니다.');
      }

      // 날짜 부분: "2025-01-15" 
      const dateStr = `${timeSlotParts[0]}-${timeSlotParts[1]}-${timeSlotParts[2]}`;
      // 시간 부분: "14:00"
      const timeStr = timeSlotParts[3];

      console.log('dateStr:', dateStr);
      console.log('timeStr:', timeStr);

      // 더 안전한 날짜 파싱
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute] = (timeStr || '00:00').split(':').map(Number);

      // 확실한 number 타입으로 변환
      const validYear = Number(year);
      const validMonth = Number(month);
      const validDay = Number(day);
      const validHour = Number(hour);
      const validMinute = Number(minute);

      // 유효성 검사
      if (isNaN(validYear) || isNaN(validMonth) || isNaN(validDay) || isNaN(validHour) || isNaN(validMinute)) {
        throw new Error('날짜/시간 파싱에 실패했습니다.');
      }

      if (validYear < 2024 || validYear > 2030 || validMonth < 1 || validMonth > 12 || validDay < 1 || validDay > 31 || validHour < 0 || validHour > 23 || validMinute < 0 || validMinute > 59) {
        throw new Error('날짜/시간 값이 유효하지 않습니다.');
      }

      const requestedDateTime = new Date(validYear, validMonth - 1, validDay, validHour, validMinute, 0, 0);

      console.log('🕐 생성된 날짜/시간:', requestedDateTime);
      console.log('🕐 ISO 문자열:', requestedDateTime.toISOString());
      console.log('🕐 로컬 문자열:', requestedDateTime.toLocaleString('ko-KR'));

      // 날짜가 미래인지 확인
      const now = new Date();
      if (requestedDateTime.getTime() <= now.getTime()) {
        throw new Error('과거 시간으로는 예약할 수 없습니다.');
      }

      const updateData = {
        address: userAddress,
        detailAddress: detailAddress.trim() || undefined,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        requestedDate: requestedDateTime,
        notes: notes.trim() || undefined,
        // 새로 추가된 필드들
        vehicleBrand: vehicleBrand.trim() || undefined,
        vehicleModel: vehicleModel.trim() || undefined,
        vehicleYear: vehicleYear.trim() || undefined,
        serviceType: serviceType.trim() || undefined,
        servicePrice: servicePrice || undefined,
        userName: userName.trim() || undefined,
        userPhone: userPhone.replace(/[^0-9]/g, '') || undefined,
      };

      console.log('📝 수정 데이터:', updateData);

      await firebaseService.updateDiagnosisReservation(reservation.id, updateData);

      Alert.alert(
        '수정 완료',
        '예약이 성공적으로 수정되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              // 스택을 리셋하고 홈으로 이동 (스택 쌓임 방지)
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
      console.error('❌ 예약 수정 실패:', error);
      Alert.alert('오류', `예약 수정 중 오류가 발생했습니다: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${weekDay})`;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>

            <View style={styles.addressSection}>
              <Text style={styles.searchLabel}>주소 검색</Text>
              <AddressSearch
                onAddressSelect={handleAddressSelect}
                placeholder="주소를 검색해주세요"
                value={userAddress}
              />

              <Text style={styles.detailLabel}>상세 주소</Text>
              <TextInput
                style={styles.detailInput}
                value={detailAddress}
                onChangeText={setDetailAddress}
                placeholder="상세 주소를 입력해주세요"
                multiline
                numberOfLines={2}
              />

              <Text style={styles.notesLabel}>요청사항</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="특별한 요청사항이 있으시면 입력해주세요"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>

            <DateTimeSection
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              timeSlots={timeSlots}
              onDateSelect={handleDateSelect}
              onTimeSlotSelect={handleTimeSlotSelect}
              formatDate={formatDateDisplay}
              isLoadingTimeSlots={isLoadingTimeSlots}
              noPadding={true}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>추가 정보 수정</Text>
            
            {/* 차량 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>차량 정보</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>브랜드</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="차량 브랜드 (예: 현대, 기아, BMW)"
                  value={vehicleBrand}
                  onChangeText={setVehicleBrand}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>모델</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="차량 모델 (예: 소나타, K5, 320i)"
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>연식</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="연식 (예: 2023)"
                  value={vehicleYear}
                  onChangeText={setVehicleYear}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* 서비스 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>서비스 정보</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>서비스 유형</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="서비스 유형 (예: 방문 진단, 종합 점검)"
                  value={serviceType}
                  onChangeText={setServiceType}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>예상 비용 (원)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="예상 비용 (예: 50000)"
                  value={servicePrice.toString()}
                  onChangeText={(text) => setServicePrice(parseInt(text) || 0)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* 연락처 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>연락처 정보</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이름</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="이름"
                  value={userName}
                  onChangeText={setUserName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>전화번호</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="010-0000-0000"
                  value={userPhone}
                  onChangeText={(text) => {
                    const formatted = formatPhoneNumber(text);
                    setUserPhone(formatted);
                  }}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
              </View>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>수정 내용 확인</Text>
            <Text style={styles.stepDescription}>
              아래 내용으로 예약을 수정하시겠습니까?
            </Text>

            <View style={styles.confirmSection}>
              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>📍 위치</Text>
                <Text style={styles.confirmValue}>{userAddress}</Text>
                {detailAddress && (
                  <Text style={styles.confirmDetailValue}>{detailAddress}</Text>
                )}
              </View>

              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>📅 날짜/시간</Text>
                <Text style={styles.confirmValue}>
                  {formatDateDisplay(selectedDate)} {selectedTimeSlot.split('-')[1] || ''}
                </Text>
              </View>

              {notes && (
                <View style={styles.confirmItem}>
                  <Text style={styles.confirmLabel}>📝 요청사항</Text>
                  <Text style={styles.confirmValue}>{notes}</Text>
                </View>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="예약 수정"
        showLogo={false}
        showBackButton={true}
        onBackPress={() => {
          if (step > 1) {
            handlePrevStep();
          } else {
            navigation.goBack();
          }
        }}
      />

      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }}>
        {/* 진행 단계 표시 */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((stepNumber) => (
            <View key={stepNumber} style={styles.progressStep}>
              <View style={[
                styles.progressCircle,
                step >= stepNumber && styles.activeProgressCircle
              ]}>
                <Text style={[
                  styles.progressNumber,
                  step >= stepNumber && styles.activeProgressNumber
                ]}>
                  {stepNumber}
                </Text>
              </View>
              <Text style={[
                styles.progressLabel,
                step >= stepNumber && styles.activeProgressLabel
              ]}>
                {stepNumber === 1 ? '위치' : stepNumber === 2 ? '날짜/시간' : '확인'}
              </Text>
            </View>
          ))}
        </View>

        {renderStepContent()}

        {/* 하단 버튼 */}
        <View style={styles.buttonContainer}>
          {step < 3 ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextStep}
            >
              <Text style={styles.nextButtonText}>다음</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.disabledButton]}
              onPress={handleConfirmModification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>수정 완료</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressStep: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeProgressCircle: {
    backgroundColor: '#06B6D4',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  activeProgressNumber: {
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  activeProgressLabel: {
    color: '#06B6D4',
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  addressSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  confirmSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  confirmItem: {
    marginBottom: 20,
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  confirmValue: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  confirmDetailValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
});

export default ModifyReservationScreen;