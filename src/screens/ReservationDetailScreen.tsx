import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp, FieldValue } from 'firebase/firestore';
import Header from '../components/Header';
import firebaseService, { DiagnosisReservation, VehicleDiagnosisReport } from '../services/firebaseService';
import { RootStackParamList } from '../navigation/RootNavigator';
import devLog from '../utils/devLog';

// Date 필드가 string으로 변환된 reservation 타입
type SerializableReservation = Omit<DiagnosisReservation, 'requestedDate' | 'createdAt' | 'updatedAt'> & {
  requestedDate: string | Date | Timestamp | FieldValue;
  createdAt: string | Date | Timestamp | FieldValue;
  updatedAt: string | Date | Timestamp | FieldValue;
};

type RouteProps = {
  reservation: SerializableReservation;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ReservationDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { reservation } = route.params as RouteProps;
  
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleReport, setVehicleReport] = useState<VehicleDiagnosisReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [currentReservation, setCurrentReservation] = useState(reservation);
  const [shouldResetOnBack, setShouldResetOnBack] = useState(false);
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(false);

  // 완료된 예약에 대한 진단 리포트 조회
  useEffect(() => {
    if (currentReservation.status === 'completed') {
      loadVehicleReport();
    }
  }, [currentReservation.id, currentReservation.status]);

  const loadVehicleReport = async () => {
    try {
      setReportLoading(true);
      const report = await firebaseService.getReservationVehicleDiagnosisReport(currentReservation.id);
      setVehicleReport(report);
    } catch (error) {
      devLog.error('진단 리포트 조회 실패:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleViewReport = () => {
    if (vehicleReport) {
      navigation.navigate('VehicleDiagnosisReport', { reportId: vehicleReport.id });
    } else {
      Alert.alert('알림', '진단 리포트를 찾을 수 없습니다.');
    }
  };

  // 예약 수정/취소 가능 여부 확인
  const getModifyPermission = () => {
    // currentReservation 데이터를 DiagnosisReservation 형태로 변환
    const reservationData: DiagnosisReservation = {
      ...currentReservation,
      requestedDate: typeof currentReservation.requestedDate === 'string' 
        ? new Date(currentReservation.requestedDate)
        : currentReservation.requestedDate,
      createdAt: typeof currentReservation.createdAt === 'string' 
        ? new Date(currentReservation.createdAt)
        : currentReservation.createdAt,
      updatedAt: typeof currentReservation.updatedAt === 'string' 
        ? new Date(currentReservation.updatedAt)
        : currentReservation.updatedAt,
    };
    
    return firebaseService.canModifyReservation(reservationData);
  };

  const handleModifyReservation = () => {
    const permission = getModifyPermission();

    if (!permission.canModify) {
      Alert.alert('수정 불가', permission.reason || '예약을 수정할 수 없습니다.');
      return;
    }

    // 예약 수정 화면으로 이동 (ReservationScreen을 수정 모드로 사용)
    navigation.navigate('Reservation', {
      editMode: true,
      existingReservation: currentReservation
    });
  };

  const handleCancelReservation = () => {
    const permission = getModifyPermission();

    if (!permission.canCancel) {
      Alert.alert('취소 불가', permission.reason || '예약을 취소할 수 없습니다.');
      return;
    }

    // 취소 확인 Alert
    Alert.alert(
      '예약 취소',
      '정말 예약을 취소하시겠습니까?\n취소된 예약은 복구할 수 없습니다.',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예, 취소합니다',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await firebaseService.cancelDiagnosisReservation(currentReservation.id);

              // 현재 화면의 예약 상태를 업데이트
              setCurrentReservation(prev => ({
                ...prev,
                status: 'cancelled',
              }));
              setShouldResetOnBack(true);

              Alert.alert('알림', '예약이 취소되었습니다.');
            } catch (error) {
              devLog.error('예약 취소 실패:', error);
              const errorMessage = error instanceof Error ? error.message : '예약 취소에 실패했습니다.';
              Alert.alert('오류', errorMessage);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleStartDiagnosis = () => {
    // 완료/취소된 예약은 진단 불가
    if (currentReservation.status === 'completed' || currentReservation.status === 'cancelled') {
      Alert.alert('알림', '완료 또는 취소된 예약은 진단할 수 없습니다.');
      return;
    }

    // VehicleInspection 화면으로 예약 정보를 전달하여 즉시 진단 시작
    navigation.navigate('VehicleInspection', {
      reservation: {
        id: currentReservation.id,
        userId: currentReservation.userId,
        userName: currentReservation.userName,
        userPhone: currentReservation.userPhone,
        vehicleBrand: currentReservation.vehicleBrand,
        vehicleModel: currentReservation.vehicleModel,
        vehicleYear: currentReservation.vehicleYear,
        requestedDate: currentReservation.requestedDate,
        status: currentReservation.status,
      },
    });
  };

  const handleUnassignReservation = () => {
    // 담당자가 없는 예약은 해제 불가
    if (!currentReservation.assignedTo) {
      Alert.alert('알림', '담당자가 없는 예약입니다.');
      return;
    }

    // 완료/취소된 예약은 담당 해제 불가
    if (currentReservation.status === 'completed' || currentReservation.status === 'cancelled') {
      Alert.alert('알림', '완료 또는 취소된 예약은 담당 해제할 수 없습니다.');
      return;
    }

    Alert.alert(
      '담당 취소',
      '이 예약의 담당을 취소하시겠습니까?\n예약은 다시 대기 상태로 돌아갑니다.',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예, 취소합니다',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await firebaseService.unassignReservationFromMechanic(currentReservation.id);

              // 현재 화면의 예약 상태를 업데이트
              setCurrentReservation(prev => ({
                ...prev,
                status: 'pending',
                assignedTo: undefined,
                assignedToName: undefined,
                assignedAt: undefined,
                confirmedBy: undefined,
              }));
              setShouldResetOnBack(true);

              Alert.alert('알림', '담당이 취소되었습니다. 예약이 대기 상태로 변경되었습니다.');
            } catch (error) {
              devLog.error('담당 취소 실패:', error);
              const errorMessage = error instanceof Error ? error.message : '담당 취소에 실패했습니다.';
              Alert.alert('오류', errorMessage);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handlePayment = () => {
    // requestedDate를 Date 객체로 변환
    const requestedDate = typeof currentReservation.requestedDate === 'string'
      ? new Date(currentReservation.requestedDate)
      : currentReservation.requestedDate instanceof Date
      ? currentReservation.requestedDate
      : (currentReservation.requestedDate as any)?.toDate?.()
      ? (currentReservation.requestedDate as any).toDate()
      : new Date();

    // PaymentScreen으로 이동
    navigation.navigate('Payment', {
      reservationId: currentReservation.id,
      orderId: `CHZ_${currentReservation.id}_${Date.now()}`,
      orderName: currentReservation.serviceType || '방문 배터리 진단',
      amount: currentReservation.servicePrice || 100000,
      reservationData: {
        vehicleBrand: currentReservation.vehicleBrand || '',
        vehicleModel: currentReservation.vehicleModel || '',
        vehicleYear: currentReservation.vehicleYear || '',
        address: currentReservation.address || '',
        detailAddress: currentReservation.detailAddress,
        latitude: currentReservation.latitude,
        longitude: currentReservation.longitude,
        requestedDate,
        timeSlot: '', // 예약 상세에서는 timeSlot 정보가 없음
        serviceType: (currentReservation.serviceType?.includes('프리미엄') ? 'premium' : 'standard') as 'standard' | 'premium',
        userName: currentReservation.userName || '',
        userPhone: currentReservation.userPhone || '',
        notes: currentReservation.notes,
      },
    });
  };

  const getStatusText = (status: DiagnosisReservation['status']) => {
    switch (status) {
      case 'pending_payment': return '결제 필요';  // 🔥 이모지 제거
      case 'pending': return '접수완료';
      case 'confirmed': return '예약확정';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  const getStatusColor = (status: DiagnosisReservation['status']) => {
    switch (status) {
      case 'pending_payment': return '#6B7280';  // 🔥 회색
      case 'pending': return '#06B6D4';
      case 'confirmed': return '#06B6D4';
      case 'completed': return '#06B6D4';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusDescription = (status: DiagnosisReservation['status']) => {
    switch (status) {
      case 'pending_payment': return '결제가 필요합니다. 결제를 완료해야 예약이 확정됩니다.';  // 🔥 pending_payment 추가
      case 'pending': return '예약 요청이 접수되었습니다. 곧 연락드리겠습니다.';
      case 'confirmed': return '예약이 확정되었습니다. 예정된 시간에 방문해드립니다.';
      case 'completed': return '진단이 완료되었습니다.';
      case 'cancelled': return '예약이 취소되었습니다.';
      default: return '';
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    return `${year}년 ${month}월 ${day}일 (${weekDay}) ${hours}:${minutes}`;
  };

  // 결제 일시 포맷팅 (PaymentSuccessScreen과 동일)
  const formatPaymentDate = (date: Date | any): string => {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  const handleBackPress = () => {
    if (shouldResetOnBack) {
      // 예약이 취소/완료된 경우 스택을 리셋하고 홈으로 이동
      // 현재 뒤로가기 애니메이션이 끝난 후 즉시 리셋
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      }, 100);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header 
        title="예약 상세" 
        showLogo={false} 
        showBackButton={true} 
        onBackPress={handleBackPress}
      />
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 통합된 예약 정보 카드 */}
        <View style={styles.receiptCard}>
          {/* 상태 헤더 */}
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentReservation.status) }]}>
              <Text style={styles.statusText}>{getStatusText(currentReservation.status)}</Text>
            </View>
            <Text style={styles.statusDescription}>
              {getStatusDescription(currentReservation.status)}
            </Text>
            
            {/* 진단 리포트 버튼 - 완료된 예약에만 표시 */}
            {currentReservation.status === 'completed' && (
              <View style={styles.reportButtonContainer}>
                {reportLoading ? (
                  <View style={styles.reportLoadingContainer}>
                    <ActivityIndicator size="small" color="#06B6D4" />
                    <Text style={styles.reportLoadingText}>리포트 확인 중...</Text>
                  </View>
                ) : vehicleReport ? (
                  <TouchableOpacity
                    style={styles.reportButton}
                    onPress={handleViewReport}
                    activeOpacity={0.8}
                  >
                    <View style={styles.reportButtonContent}>
                      <Ionicons name="document-text" size={20} color="#06B6D4" />
                      <Text style={styles.reportButtonText}>진단 리포트 보기</Text>
                      <Ionicons name="chevron-forward" size={16} color="#06B6D4" />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noReportContainer}>
                    <Ionicons name="document-outline" size={16} color="#06B6D4" />
                    <Text style={styles.noReportText}>진단 리포트 준비 중</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 구분선 */}
          <View style={styles.divider} />

          {/* 영수증 스타일 정보 */}
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>서비스</Text>
              <Text style={styles.receiptValue}>방문진단</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>방문일시</Text>
              <Text style={styles.receiptValue}>{formatDate(currentReservation.requestedDate)}</Text>
            </View>
            {currentReservation.userName && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>예약자</Text>
                <Text style={styles.receiptValue}>{currentReservation.userName}</Text>
              </View>
            )}
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>연락처</Text>
              <Text style={styles.receiptValue}>{currentReservation.userPhone || '-'}</Text>
            </View>
            {(currentReservation.vehicleBrand || currentReservation.vehicleModel) && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>차량</Text>
                <Text style={styles.receiptValue}>
                  {currentReservation.vehicleBrand} {currentReservation.vehicleModel}
                  {currentReservation.vehicleYear && ` (${currentReservation.vehicleYear}년)`}
                </Text>
              </View>
            )}
            {currentReservation.notes && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>요청사항</Text>
                <Text style={[styles.receiptValue, styles.addressValue]} numberOfLines={2}>
                  {currentReservation.notes}
                </Text>
              </View>
            )}
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>신청일</Text>
              <Text style={styles.receiptValue}>{formatDate(currentReservation.createdAt)}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>서비스 타입</Text>
              <Text style={styles.receiptValue}>
                {currentReservation.serviceType === 'standard' ? '스탠다드' : '프리미엄'}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>주소</Text>
              <Text style={[styles.receiptValue, styles.addressValue]} numberOfLines={2}>
                {currentReservation.address}{currentReservation.detailAddress && ` ${currentReservation.detailAddress}`}
              </Text>
            </View>
            <View style={[styles.receiptRow, styles.priceRow]}>
              <Text style={[styles.receiptLabel, styles.priceLabel]}>결제금액</Text>
              <Text style={styles.priceValue}>
                {(() => {
                  if (currentReservation.servicePrice) {
                    return currentReservation.servicePrice.toLocaleString() + '원';
                  }
                  // servicePrice가 없는 경우 serviceType에 따라 기본 가격 표시
                  return currentReservation.serviceType === 'standard' ? '100,000원' : '200,000원';
                })()}
              </Text>
            </View>
        </View>

        {/* 결제 정보 - 결제 완료된 예약에만 표시 */}
        {currentReservation.paymentStatus === 'completed' && currentReservation.paidAt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>결제 정보</Text>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>결제일시</Text>
              <Text style={styles.receiptValue}>{formatPaymentDate(currentReservation.paidAt)}</Text>
            </View>

            {currentReservation.cardCompany && (
              <>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>카드사</Text>
                  <Text style={styles.receiptValue}>{currentReservation.cardCompany}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>카드번호</Text>
                  <Text style={styles.receiptValue}>{currentReservation.cardNumber}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>카드종류</Text>
                  <Text style={styles.receiptValue}>{currentReservation.cardType}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>할부</Text>
                  <Text style={styles.receiptValue}>
                    {currentReservation.installmentPlanMonths === 0
                      ? '일시불'
                      : `${currentReservation.installmentPlanMonths}개월`}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* 관리자 메모 */}
        {currentReservation.adminNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>관리자 메모</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{currentReservation.adminNotes}</Text>
            </View>
          </View>
        )}

        {/* 예약 취소 및 환불 정책 - 아코디언 */}
        {(currentReservation.status === 'pending' ||
          currentReservation.status === 'pending_payment' ||
          currentReservation.status === 'confirmed') && (
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setIsPolicyExpanded(!isPolicyExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.accordionTitle}>취소 및 환불 안내</Text>
              <Ionicons
                name={isPolicyExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>

            {isPolicyExpanded && (
              <View style={styles.accordionContent}>
                {/* 결제 기한 (pending_payment 상태일 때 강조) */}
                <View style={styles.policyBox}>
                  <Text style={styles.policySubtitle}>결제 기한</Text>
                  <Text style={styles.policyText}>
                    • 예약 후 1시간 이내 결제하지 않으면 자동 취소됩니다.{'\n'}
                    • 취소 시 예약 정보가 모두 삭제됩니다.
                  </Text>
                </View>

                {/* 취소 및 환불 기준 */}
                <View style={styles.policyBox}>
                  <Text style={styles.policySubtitle}>취소 및 환불 기준</Text>
                  <Text style={styles.policyText}>
                    • 진단 예약 시간 6시간 이전 취소: 100% 환불{'\n'}
                    • 진단 예약 시간 6시간 이내 취소 또는 현장 미방문: 50% 환불{'\n'}
                    • 연락두절 또는 고의적 서비스 방해: 환불 불가{'\n'}
                    • 차량 판매 등 불가피한 사유: 증빙서류 제출 시 50% 환불{'\n'}
                    • 회사 귀책(진단사 일정, 장비 고장 등): 100% 환불
                  </Text>
                </View>

                {/* 예약 변경 */}
                <View style={styles.policyBox}>
                  <Text style={styles.policySubtitle}>예약 변경</Text>
                  <Text style={styles.policyText}>
                    • 예약 변경은 1회에 한하여 가능합니다.{'\n'}
                    • 변경 요청은 예약 시간 6시간 이전에만 접수됩니다.{'\n'}
                    • 변경 후 재취소 시 동일한 환불 기준이 적용됩니다.
                  </Text>
                </View>

                {/* 환불 절차 */}
                <View style={[styles.policyBox, { marginBottom: 0 }]}>
                  <Text style={styles.policySubtitle}>환불 절차</Text>
                  <Text style={styles.policyText}>
                    • 고객센터(info@charzing.kr) 또는 앱 내 문의를 통해 접수{'\n'}
                    • 접수일 기준 3영업일 이내 환불 처리{'\n'}
                    • 결제 수단과 동일한 방법으로 환불{'\n'}
                    • 카드사 정책에 따라 실제 환불 시점은 다소 차이 있을 수 있음
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* 하단 액션 버튼 */}

      {/* 결제 필요 상태일 때 결제 버튼 + 하단 취소 텍스트 */}
      {currentReservation.status === 'pending_payment' && (
        <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePayment}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>결제하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelTextButton}
              onPress={handleCancelReservation}
              activeOpacity={0.6}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#9CA3AF" />
              ) : (
                <Text style={styles.cancelTextButtonText}>예약 취소</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* 정비사 할당 시 진단/담당 취소 버튼 */}
      {currentReservation.assignedTo &&
        currentReservation.status !== 'completed' &&
        currentReservation.status !== 'cancelled' &&
        currentReservation.status !== 'pending_payment' && (
          <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
            <View style={styles.bottomActionBar}>
              {/* 좌측: 지금 진단 버튼 */}
              <TouchableOpacity
                style={[styles.bottomButton, styles.bottomDiagnosisButton]}
                onPress={handleStartDiagnosis}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Ionicons name="clipboard-outline" size={24} color="#06B6D4" />
                <Text style={[styles.bottomButtonText, styles.bottomDiagnosisText]}>
                  지금 진단
                </Text>
              </TouchableOpacity>

              {/* 우측: 담당 취소 버튼 */}
              <TouchableOpacity
                style={[styles.bottomButton, styles.bottomUnassignButton]}
                onPress={handleUnassignReservation}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="person-remove-outline" size={24} color="#EF4444" />
                    <Text style={[styles.bottomButtonText, styles.bottomUnassignText]}>
                      담당 취소
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}

      {/* 일반 예약 (pending, confirmed) 취소 텍스트 */}
      {!currentReservation.assignedTo &&
        (currentReservation.status === 'pending' || currentReservation.status === 'confirmed') && (
          <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={styles.cancelTextButton}
                onPress={handleCancelReservation}
                activeOpacity={0.6}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#9CA3AF" />
                ) : (
                  <Text style={styles.cancelTextButtonText}>예약 취소</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}

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
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 100, // 하단 버튼 영역 + 여유 공간
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  reportButtonContainer: {
    marginTop: 16,
    width: '100%',
  },
  reportButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 12,
    padding: 16,
  },
  reportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06B6D4',
    marginLeft: 8,
    marginRight: 8,
  },
  reportLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reportLoadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  noReportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noReportText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    lineHeight: 22,
  },
  notesContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // 수정/취소 버튼 스타일
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  modifyButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modifyButtonText: {
    color: '#06B6D4',
  },
  cancelButtonText: {
    color: '#6B7280',
  },
  // 통합된 카드 스타일
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    minHeight: 24,
  },
  receiptLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    width: 65,
    flexShrink: 0,
  },
  receiptValue: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  priceRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#06B6D4',
  },
  addressValue: {
    fontSize: 12,
    lineHeight: 16,
  },
  kakaoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  kakaoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  kakaoLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '400',
    width: 80,
    flexShrink: 0,
  },
  kakaoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#06B6D4',
  },
  addressText: {
    fontSize: 13,
    lineHeight: 22,
  },
  restrictionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#9CA3AF',
  },
  restrictionText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  // 하단 네비게이션 바 스타일
  bottomSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  bottomActionBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    gap: 6,
  },
  bottomModifyButton: {
    backgroundColor: 'transparent',
  },
  bottomCancelButton: {
    backgroundColor: 'transparent',
  },
  bottomDiagnosisButton: {
    backgroundColor: 'transparent',
  },
  bottomUnassignButton: {
    backgroundColor: 'transparent',
  },
  bottomButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomModifyText: {
    color: '#06B6D4',
  },
  bottomCancelText: {
    color: '#6B7280',
  },
  bottomDiagnosisText: {
    color: '#06B6D4',
  },
  bottomUnassignText: {
    color: '#EF4444',
  },
  // 아코디언 컨테이너 (카드 없음)
  accordionContainer: {
    marginVertical: 8,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  accordionContent: {
    paddingTop: 8,
  },
  policyBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  policySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  policyText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  // 하단 컨테이너 (세로 배치)
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  // 주요 CTA 버튼
  primaryButton: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // 취소 텍스트 링크 버튼
  cancelTextButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTextButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ReservationDetailScreen;