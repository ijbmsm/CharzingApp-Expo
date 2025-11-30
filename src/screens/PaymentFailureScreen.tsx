import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../navigation/RootNavigator';
import { RootState } from '../store';
import firebaseService from '../services/firebaseService';
import { devLog } from '../utils/devLog';
import sentryLogger from '../utils/sentryLogger';

// 앱 공통 색상
const COLORS = {
  BACKGROUND: '#F9FAFB',
  PRIMARY: '#06B6D4',
  ERROR: '#EF4444',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_MUTED: '#9CA3AF',
  WHITE: '#FFFFFF',
  BORDER: '#E5E7EB',
};

// 에러 코드별 사용자 친화적 메시지
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  PAY_PROCESS_CANCELED: {
    title: '결제가 취소되었습니다',
    description: '사용자가 결제를 취소했습니다.',
  },
  PAY_PROCESS_ABORTED: {
    title: '결제가 중단되었습니다',
    description: '결제 진행 중 문제가 발생했습니다.',
  },
  REJECT_CARD_COMPANY: {
    title: '카드사 승인 거절',
    description: '카드사에서 결제를 거절했습니다. 다른 카드로 시도해주세요.',
  },
  EXCEED_MAX_DAILY_PAYMENT_COUNT: {
    title: '일일 결제 한도 초과',
    description: '일일 결제 횟수 한도를 초과했습니다.',
  },
  EXCEED_MAX_PAYMENT_AMOUNT: {
    title: '결제 한도 초과',
    description: '결제 금액이 한도를 초과했습니다.',
  },
  INVALID_CARD_NUMBER: {
    title: '카드 정보 오류',
    description: '카드 번호가 올바르지 않습니다.',
  },
  INVALID_CARD_EXPIRATION: {
    title: '카드 유효기간 오류',
    description: '카드 유효기간이 올바르지 않습니다.',
  },
  INVALID_STOPPED_CARD: {
    title: '정지된 카드',
    description: '정지된 카드입니다. 다른 카드로 시도해주세요.',
  },
  INVALID_CARD_LOST_OR_STOLEN: {
    title: '분실/도난 카드',
    description: '분실 또는 도난 신고된 카드입니다.',
  },
  NOT_SUPPORTED_CARD_TYPE: {
    title: '지원하지 않는 카드',
    description: '해당 카드는 지원하지 않습니다.',
  },
  NOT_AVAILABLE_PAYMENT: {
    title: '결제 불가',
    description: '현재 결제가 불가능합니다. 잠시 후 다시 시도해주세요.',
  },
  USER_CANCEL: {
    title: '결제가 취소되었습니다',
    description: '결제 창에서 취소하셨습니다.',
  },
  COMMON_ERROR: {
    title: '결제 오류',
    description: '결제 처리 중 오류가 발생했습니다.',
  },
};

type PaymentFailureRouteProp = RouteProp<RootStackParamList, 'PaymentFailure'>;
type PaymentFailureNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentFailure'>;

const PaymentFailureScreen: React.FC = () => {
  const navigation = useNavigation<PaymentFailureNavigationProp>();
  const route = useRoute<PaymentFailureRouteProp>();
  const { reservationId, errorCode, errorMessage, orderId, orderName, amount, reservationData } = route.params;

  const user = useSelector((state: RootState) => state.auth.user);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  // 에러 메시지 가져오기
  const errorInfo = ERROR_MESSAGES[errorCode] || {
    title: '결제 실패',
    description: errorMessage || '결제 처리 중 오류가 발생했습니다.',
  };

  // ⭐ 결제 실패 시 자동으로 예약 취소 (Two-Phase Commit 롤백)
  useEffect(() => {
    const cancelReservation = async () => {
      if (!reservationId || isCancelling || isCancelled) {
        return;
      }

      try {
        setIsCancelling(true);
        devLog.log('🔄 결제 실패로 인한 예약 자동 취소:', { reservationId, errorCode });

        // Sentry 로깅 - 예약 취소 시작
        if (user?.uid) {
          sentryLogger.log('Auto-cancelling reservation due to payment failure', {
            reservationId,
            errorCode,
            orderId,
          });
        }

        // Firestore 예약 상태 업데이트: pending_payment → cancelled
        await firebaseService.updateDiagnosisReservationStatus(reservationId, 'cancelled');

        devLog.log('✅ 예약 자동 취소 완료:', { reservationId });
        setIsCancelled(true);

        // Sentry 로깅 - 예약 취소 완료
        if (user?.uid) {
          sentryLogger.logReservationCancelled(reservationId, `Payment failed: ${errorCode}`);
        }
      } catch (error) {
        devLog.error('❌ 예약 취소 실패:', error);

        // Sentry 로깅 - 예약 취소 실패
        if (user?.uid) {
          sentryLogger.logError('Auto-cancel reservation failed on payment failure', error as Error, {
            reservationId,
            errorCode,
          });
        }
      } finally {
        setIsCancelling(false);
      }
    };

    cancelReservation();
  }, [reservationId, errorCode, orderId, user, isCancelling, isCancelled]);

  // 다시 결제하기 (기존 예약 재사용)
  const handleRetryPayment = useCallback(async () => {
    if (!reservationId || !reservationData) {
      devLog.error('❌ 재시도 불가: reservationId 또는 reservationData 없음');
      return;
    }

    try {
      devLog.log('🔄 결제 재시도 시작:', { reservationId, isCancelled });

      // Sentry 로깅
      if (user?.uid) {
        sentryLogger.log('User retrying payment after failure', {
          previousOrderId: orderId,
          reservationId,
        });
      }

      // 1️⃣ 예약 상태 복구: cancelled → pending_payment
      await firebaseService.updateDiagnosisReservationStatus(reservationId, 'pending_payment');
      devLog.log('✅ 예약 상태 복구 완료:', { reservationId, newStatus: 'pending_payment' });

      // 2️⃣ 새 주문번호 생성 (재시도 횟수 추가)
      const retryOrderId = `${orderId}_retry${Date.now()}`;
      devLog.log('🆕 새 주문번호 생성:', { retryOrderId });

      // 3️⃣ 바로 결제 화면으로 이동 (기존 reservationId 유지)
      navigation.replace('Payment', {
        reservationId,  // ⭐ 같은 예약 ID 재사용
        reservationData,
        orderId: retryOrderId,
        orderName,
        amount,
      });

      devLog.log('✅ 결제 화면으로 이동 완료');
    } catch (error) {
      devLog.error('❌ 결제 재시도 실패:', error);

      // Sentry 로깅
      if (user?.uid) {
        sentryLogger.logError('Payment retry failed', error as Error, {
          reservationId,
          orderId,
        });
      }

      Alert.alert('오류', '결제 재시도 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [navigation, reservationData, orderId, orderName, amount, reservationId, isCancelled, user]);

  // 고객센터 연결 (카카오톡 채널)
  const handleContactSupport = useCallback(() => {
    Linking.openURL('http://pf.kakao.com/_amsHn').catch((err) => {
      devLog.error('카카오톡 채널 열기 실패:', err);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* 실패 아이콘 */}
          <View style={styles.iconContainer}>
            <View style={styles.errorCircle}>
              <Ionicons name="close" size={50} color={COLORS.WHITE} />
            </View>
          </View>

          {/* 타이틀 */}
          <Text style={styles.title}>{errorInfo.title}</Text>
          <Text style={styles.subtitle}>{errorInfo.description}</Text>

          {/* 에러 상세 카드 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>오류 정보</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>오류 코드</Text>
              <Text style={styles.errorCode}>{errorCode}</Text>
            </View>

            {orderId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>주문번호</Text>
                <Text style={styles.infoValue}>{orderId}</Text>
              </View>
            )}

            {errorMessage && errorMessage !== errorInfo.description && (
              <View style={styles.errorMessageContainer}>
                <Text style={styles.errorMessageLabel}>상세 메시지</Text>
                <Text style={styles.errorMessageText}>{errorMessage}</Text>
              </View>
            )}
          </View>

          {/* 예약 정보 카드 (있는 경우) */}
          {reservationData && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>예약 정보</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>서비스</Text>
                <Text style={styles.infoValue}>
                  {reservationData.serviceType === 'premium' ? '프리미엄 진단' : '스탠다드 진단'}
                </Text>
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
            </View>
          )}

          {/* 안내 문구 */}
          <View style={styles.helpCard}>
            <Ionicons name="help-circle-outline" size={20} color={COLORS.TEXT_SECONDARY} />
            <View style={styles.helpTextContainer}>
              <Text style={styles.helpTitle}>결제에 문제가 있으신가요?</Text>
              <Text style={styles.helpText}>
                계속 결제가 실패하는 경우 다른 결제 수단을 이용하시거나{'\n'}
                고객센터로 문의해 주세요.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleContactSupport}
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.TEXT_PRIMARY} style={styles.buttonIcon} />
          <Text style={styles.secondaryButtonText}>문의하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRetryPayment}
          disabled={!reservationData}
        >
          <Ionicons name="card-outline" size={20} color={COLORS.WHITE} style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>다시 결제하기</Text>
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
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  errorCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.ERROR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.ERROR,
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
    paddingHorizontal: 20,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  errorCode: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ERROR,
    fontFamily: 'monospace',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  errorMessageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  errorMessageLabel: {
    fontSize: 13,
    color: COLORS.TEXT_MUTED,
    marginBottom: 4,
  },
  errorMessageText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  helpCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  helpText: {
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
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  buttonIcon: {
    marginRight: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
});

export default PaymentFailureScreen;
