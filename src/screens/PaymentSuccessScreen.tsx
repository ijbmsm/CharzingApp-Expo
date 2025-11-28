import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import firebaseService from '../services/firebaseService';
import { devLog } from '../utils/devLog';
import sentryLogger from '../utils/sentryLogger';
import { ConfirmPaymentRequest, ConfirmPaymentResponse, ReservationData } from '../types/payment.types';

// 앱 공통 색상 (SignupCompleteScreen과 동일)
const COLORS = {
  BACKGROUND: '#F9FAFB',
  PRIMARY: '#06B6D4',
  SUCCESS: '#10B981',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_MUTED: '#9CA3AF',
  WHITE: '#FFFFFF',
  BORDER: '#E5E7EB',
};

type PaymentSuccessRouteProp = RouteProp<RootStackParamList, 'PaymentSuccess'>;
type PaymentSuccessNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentSuccess'>;

const PaymentSuccessScreen: React.FC = () => {
  const navigation = useNavigation<PaymentSuccessNavigationProp>();
  const route = useRoute<PaymentSuccessRouteProp>();
  const { paymentKey, orderId, amount, reservationData } = route.params;

  const user = useSelector((state: RootState) => state.auth.user);

  const [isProcessing, setIsProcessing] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);

  // 결제 확정 처리 (Firebase Function 호출)
  const confirmPayment = useCallback(async () => {
    try {
      devLog.log('결제 확정 시작:', { paymentKey, orderId, amount });

      // Sentry 로깅 - 결제 확정 시작
      if (user?.uid) {
        sentryLogger.logPaymentConfirmationStart(orderId, paymentKey, amount);
      }

      // Firebase Function 호출하여 결제 확정
      const request: ConfirmPaymentRequest = {
        paymentKey,
        orderId,
        amount,
        customerInfo: {
          name: reservationData.userName,
          phone: reservationData.userPhone,
          email: user?.email,
        },
        reservationInfo: {
          vehicle: {
            make: reservationData.vehicleBrand,
            model: reservationData.vehicleModel,
            year: parseInt(reservationData.vehicleYear, 10) || new Date().getFullYear(),
          },
          address: reservationData.address,
          detailAddress: reservationData.detailAddress || '',
          requestedDate: typeof reservationData.requestedDate === 'string'
            ? reservationData.requestedDate
            : reservationData.requestedDate.toISOString(),
          serviceType: reservationData.serviceType,
          notes: reservationData.notes,
        },
      };

      // Firebase Function 호출 (결제 확정 + 예약 생성)
      const result = await firebaseService.callCloudFunction('confirmPaymentFunction', request) as ConfirmPaymentResponse;

      devLog.log('결제 확정 성공:', result);

      // Sentry 로깅 - 결제 완료
      if (user?.uid && result.reservationId) {
        sentryLogger.logPaymentComplete(
          user.uid,
          result.reservationId,
          amount,
          'card' // Toss Payments는 카드 결제만 지원
        );
      }

      setReservationId(result.reservationId || null);
      setIsConfirmed(true);
    } catch (err) {
      devLog.error('결제 확정 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '결제 확정 중 오류가 발생했습니다.';

      // Sentry 로깅 - 결제 확정 실패
      if (user?.uid) {
        sentryLogger.logPaymentError(
          user.uid,
          orderId,
          'CONFIRMATION_FAILED',
          errorMessage,
          amount
        );
      }

      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [paymentKey, orderId, amount, reservationData, user]);

  useEffect(() => {
    confirmPayment();
  }, [confirmPayment]);

  // 홈으로 이동
  const handleGoHome = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  }, [navigation]);

  // 예약 상세 보기
  const handleViewReservation = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { name: 'Main' },
          { name: 'MyReservations' },
        ],
      })
    );
  }, [navigation]);

  // 로딩 중
  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>결제를 확인하고 있습니다...</Text>
          <Text style={styles.loadingSubText}>잠시만 기다려주세요</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={80} color="#EF4444" />
          </View>
          <Text style={styles.title}>결제 확인 오류</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.helpText}>
            시스템 오류로 예약 처리가 완료되지 않았습니다.{'\n'}
            고객센터로 문의해 주세요.
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>주문번호</Text>
              <Text style={styles.infoValue}>{orderId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>결제금액</Text>
              <Text style={styles.infoValue}>{amount.toLocaleString()}원</Text>
            </View>
          </View>

          <View style={styles.singleButtonContainer}>
            <TouchableOpacity style={styles.singleButton} onPress={handleGoHome}>
              <Text style={styles.primaryButtonText}>홈으로 돌아가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 결제 확정 성공
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* 성공 아이콘 */}
          <View style={styles.iconContainer}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={50} color={COLORS.WHITE} />
            </View>
          </View>

          {/* 타이틀 */}
          <Text style={styles.title}>결제가 완료되었습니다</Text>
          <Text style={styles.subtitle}>
            진단 예약이 성공적으로 접수되었습니다.{'\n'}
            담당자가 연락드려 일정을 확정할 예정입니다.
          </Text>

          {/* 결제 정보 카드 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>결제 정보</Text>

            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>결제 금액</Text>
              <Text style={styles.amountValue}>{amount.toLocaleString()}원</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>주문번호</Text>
              <Text style={styles.infoValue}>{orderId}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>서비스</Text>
              <Text style={styles.infoValue}>
                {reservationData.serviceType === 'premium' ? '프리미엄 진단' : '스탠다드 진단'}
              </Text>
            </View>
          </View>

          {/* 예약 정보 카드 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>예약 정보</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>차량</Text>
              <Text style={styles.infoValue}>
                {reservationData.vehicleBrand} {reservationData.vehicleModel}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>연식</Text>
              <Text style={styles.infoValue}>{reservationData.vehicleYear}년</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>예약자</Text>
              <Text style={styles.infoValue}>{reservationData.userName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>연락처</Text>
              <Text style={styles.infoValue}>{reservationData.userPhone}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>주소</Text>
              <Text style={[styles.infoValue, styles.addressText]}>
                {reservationData.address}
                {reservationData.detailAddress ? `\n${reservationData.detailAddress}` : ''}
              </Text>
            </View>
          </View>

          {/* 안내 문구 */}
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.noticeText}>
              예약 확정 후 SMS로 안내드립니다.{'\n'}
              취소는 진단 예정 6시간 전까지 가능합니다.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleViewReservation}
        >
          <Text style={styles.secondaryButtonText}>내 예약 보기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGoHome}
        >
          <Text style={styles.primaryButtonText}>홈으로</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.SUCCESS,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorMessage: {
    fontSize: 15,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginVertical: 16,
  },
  infoCard: {
    width: '100%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    flex: 2,
    textAlign: 'right',
  },
  addressText: {
    lineHeight: 20,
  },
  noticeCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 34,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  singleButtonContainer: {
    width: '100%',
    paddingTop: 24,
  },
  singleButton: {
    width: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default PaymentSuccessScreen;
