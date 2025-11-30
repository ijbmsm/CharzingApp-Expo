import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/RootNavigator';
import TossPaymentWebView, { PaymentParams } from '../components/payment/TossPaymentWebView';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { devLog } from '../utils/devLog';
import sentryLogger from '../utils/sentryLogger';

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

// 결제 성공/실패 URL (앱 내부에서 감지용)
const SUCCESS_URL = 'https://charzing.co.kr/payment/success';
const FAIL_URL = 'https://charzing.co.kr/payment/fail';

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { reservationId, reservationData, orderId, orderName, amount } = route.params;

  const user = useSelector((state: RootState) => state.auth.user);

  const [paymentStarted, setPaymentStarted] = useState(false);

  // 직렬화 가능한 reservationData (Date를 ISO string으로 변환)
  const serializedReservationData = useMemo(() => ({
    ...reservationData,
    requestedDate: typeof reservationData.requestedDate === 'string'
      ? reservationData.requestedDate
      : reservationData.requestedDate.toISOString(),
  }), [reservationData]);

  // 결제 파라미터 생성
  const paymentParams: PaymentParams = useMemo(() => ({
    orderId,
    orderName,
    amount,
    customerName: reservationData.userName,
    customerEmail: user?.email || undefined,
    customerMobilePhone: reservationData.userPhone?.replace(/[^0-9]/g, ''),
    successUrl: SUCCESS_URL,
    failUrl: FAIL_URL,
  }), [orderId, orderName, amount, reservationData, user]);

  // 결제 성공 처리 - PaymentSuccessScreen으로 이동
  const handlePaymentSuccess = useCallback((
    paymentKey: string,
    completedOrderId: string,
    paidAmount: number
  ) => {
    devLog.log('결제 성공, PaymentSuccess 화면으로 이동:', { paymentKey, completedOrderId, paidAmount, reservationId });

    // Sentry 로깅
    if (user?.uid) {
      sentryLogger.logPaymentSuccess(paymentKey, completedOrderId, paidAmount);
    }

    // PaymentSuccessScreen에서 Firebase Function 호출 및 예약 처리
    navigation.replace('PaymentSuccess', {
      reservationId, // ⭐ 예약 ID 전달 (앱 플로우: 예약 먼저 생성됨)
      paymentKey,
      orderId: completedOrderId,
      amount: paidAmount,
      reservationData: serializedReservationData,
    });
  }, [reservationId, serializedReservationData, navigation, user]);

  // 결제 실패 처리 - PaymentFailureScreen으로 이동
  const handlePaymentFail = useCallback((
    errorCode: string,
    errorMessage: string,
    failedOrderId: string,
    errorDetail?: string
  ) => {
    devLog.error('결제 실패, PaymentFailure 화면으로 이동:', { errorCode, errorMessage, failedOrderId, errorDetail, reservationId });

    // Sentry 로깅
    if (user?.uid) {
      sentryLogger.logPaymentError(user.uid, failedOrderId, errorCode, errorMessage, amount);
    }

    // PaymentFailureScreen으로 이동
    navigation.replace('PaymentFailure', {
      reservationId, // ⭐ 예약 ID 전달 (취소용)
      errorCode,
      errorMessage,
      orderId: failedOrderId,
      orderName,
      amount,
      reservationData: serializedReservationData,
    });
  }, [reservationId, serializedReservationData, navigation, orderName, amount, user]);

  // 결제창 닫기
  const handlePaymentClose = useCallback(() => {
    Alert.alert(
      '결제 취소',
      '결제를 취소하시겠습니까?',
      [
        {
          text: '아니오',
          style: 'cancel',
        },
        {
          text: '예',
          onPress: () => {
            // Sentry 로깅
            if (user?.uid) {
              sentryLogger.logPaymentCancel(user.uid, orderId, '사용자 취소');
            }
            navigation.goBack();
          },
        },
      ]
    );
  }, [navigation, user, orderId]);

  // 뒤로가기
  const handleBack = useCallback(() => {
    if (paymentStarted) {
      Alert.alert(
        '결제 취소',
        '결제를 취소하시겠습니까?\n입력하신 예약 정보는 유지됩니다.',
        [
          { text: '아니오', style: 'cancel' },
          { text: '예', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [paymentStarted, navigation]);

  // 결제 시작
  const handleStartPayment = useCallback(() => {
    devLog.log('결제 시작 버튼 클릭:', { orderId, amount });

    // Sentry 로깅
    if (user?.uid) {
      sentryLogger.logPaymentStart(
        user.uid,
        orderId,
        amount,
        reservationData.serviceType
      );
    }

    setPaymentStarted(true);
  }, [user, orderId, amount, reservationData.serviceType]);

  return (
    <SafeAreaView style={styles.container}>
      {paymentStarted ? (
        // 결제 WebView (전체 화면, 헤더 없음)
        <View style={styles.webViewContainer}>
          {/* 결제 화면 닫기 버튼 (우측 상단) */}
          <TouchableOpacity onPress={handlePaymentClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#202632" />
          </TouchableOpacity>
          <TossPaymentWebView
            paymentParams={paymentParams}
            onSuccess={handlePaymentSuccess}
            onFail={handlePaymentFail}
            onClose={handlePaymentClose}
          />
        </View>
      ) : (
        <>
          {/* 뒤로가기 버튼 (결제 시작 전에만 표시) */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#202632" />
          </TouchableOpacity>
          {/* 결제 정보 확인 화면 */}
          <View style={styles.content}>
          <View style={styles.orderInfo}>
            <Text style={styles.sectionTitle}>결제 정보</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>서비스</Text>
              <Text style={styles.infoValue}>{orderName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>차량</Text>
              <Text style={styles.infoValue}>
                {reservationData.vehicleBrand} {reservationData.vehicleModel}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>예약자</Text>
              <Text style={styles.infoValue}>{reservationData.userName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>결제 금액</Text>
              <Text style={styles.totalAmount}>
                {amount.toLocaleString()}원
              </Text>
            </View>
          </View>

          <View style={styles.noticeContainer}>
            <Text style={styles.noticeTitle}>안내사항</Text>
            <Text style={styles.noticeText}>
              • 결제 완료 후 담당자가 연락드려 일정을 확정합니다.
            </Text>
            <Text style={styles.noticeText}>
              • 예약 취소는 진단 예정 6시간 전까지 가능합니다.
            </Text>
            <Text style={styles.noticeText}>
              • 취소 시 결제 수단으로 환불됩니다.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.payButton}
            onPress={handleStartPayment}
          >
            <Text style={styles.payButtonText}>
              {amount.toLocaleString()}원 결제하기
            </Text>
          </TouchableOpacity>
        </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webViewContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 100,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  orderInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202632',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202632',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202632',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#06B6D4',
  },
  noticeContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  payButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PaymentScreen;
