/**
 * Crashlytics 로깅 유틸리티
 *
 * 주요 사용자 액션 및 비즈니스 이벤트를 Crashlytics에 기록합니다.
 * 프로덕션 환경에서만 동작하며, 개발 환경에서는 콘솔 로그만 출력합니다.
 */

import crashlytics from '@react-native-firebase/crashlytics';

class CrashlyticsLogger {
  private isDevelopment = __DEV__;

  /**
   * 회원가입 완료 로그
   */
  logSignupComplete(userId: string, provider: 'kakao' | 'google' | 'apple'): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Crashlytics 회원가입 로그:', { userId, provider });
      return;
    }

    try {
      crashlytics().log(`✅ 회원가입 완료 - Provider: ${provider}, UserID: ${userId}`);
      crashlytics().setAttribute('last_signup_provider', provider);
    } catch (error) {
      console.warn('⚠️ Crashlytics 회원가입 로그 실패:', error);
    }
  }

  /**
   * 예약 생성 로그
   */
  logReservationCreated(
    userId: string,
    reservationId: string,
    vehicleInfo: {
      brand: string;
      model: string;
      year: string;
    },
    reservationType: string
  ): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Crashlytics 예약 생성 로그:', {
        userId,
        reservationId,
        vehicleInfo,
        reservationType
      });
      return;
    }

    try {
      crashlytics().log(
        `📅 예약 생성 - ID: ${reservationId}, 차량: ${vehicleInfo.brand} ${vehicleInfo.model} (${vehicleInfo.year}), 타입: ${reservationType}`
      );
      crashlytics().setAttribute('last_reservation_brand', vehicleInfo.brand);
      crashlytics().setAttribute('last_reservation_type', reservationType);
    } catch (error) {
      console.warn('⚠️ Crashlytics 예약 생성 로그 실패:', error);
    }
  }

  /**
   * 예약 수정 로그
   */
  logReservationUpdated(reservationId: string, updatedFields: string[]): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Crashlytics 예약 수정 로그:', { reservationId, updatedFields });
      return;
    }

    try {
      crashlytics().log(
        `📝 예약 수정 - ID: ${reservationId}, 수정 필드: ${updatedFields.join(', ')}`
      );
    } catch (error) {
      console.warn('⚠️ Crashlytics 예약 수정 로그 실패:', error);
    }
  }

  /**
   * 예약 취소 로그
   */
  logReservationCancelled(reservationId: string, reason?: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Crashlytics 예약 취소 로그:', { reservationId, reason });
      return;
    }

    try {
      crashlytics().log(
        `❌ 예약 취소 - ID: ${reservationId}${reason ? `, 사유: ${reason}` : ''}`
      );
    } catch (error) {
      console.warn('⚠️ Crashlytics 예약 취소 로그 실패:', error);
    }
  }

  /**
   * 차량 추가 로그
   */
  logVehicleAdded(
    userId: string,
    vehicleInfo: {
      brand: string;
      model: string;
      year: string;
      licensePlate?: string;
    }
  ): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Crashlytics 차량 추가 로그:', { userId, vehicleInfo });
      return;
    }

    try {
      crashlytics().log(
        `🚗 차량 추가 - ${vehicleInfo.brand} ${vehicleInfo.model} (${vehicleInfo.year})${
          vehicleInfo.licensePlate ? `, 차량번호: ${vehicleInfo.licensePlate}` : ''
        }`
      );
      crashlytics().setAttribute('last_added_vehicle_brand', vehicleInfo.brand);
    } catch (error) {
      console.warn('⚠️ Crashlytics 차량 추가 로그 실패:', error);
    }
  }

  /**
   * 차량 삭제 로그
   */
  logVehicleDeleted(userId: string, vehicleId: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Crashlytics 차량 삭제 로그:', { userId, vehicleId });
      return;
    }

    try {
      crashlytics().log(`🗑️ 차량 삭제 - VehicleID: ${vehicleId}`);
    } catch (error) {
      console.warn('⚠️ Crashlytics 차량 삭제 로그 실패:', error);
    }
  }

  /**
   * 결제 완료 로그
   */
  logPaymentComplete(
    userId: string,
    reservationId: string,
    amount: number,
    paymentMethod: string
  ): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Crashlytics 결제 완료 로그:', {
        userId,
        reservationId,
        amount,
        paymentMethod
      });
      return;
    }

    try {
      crashlytics().log(
        `💳 결제 완료 - 예약ID: ${reservationId}, 금액: ${amount}원, 방법: ${paymentMethod}`
      );
      crashlytics().setAttribute('last_payment_method', paymentMethod);
    } catch (error) {
      console.warn('⚠️ Crashlytics 결제 완료 로그 실패:', error);
    }
  }

  /**
   * 리포트 조회 로그
   */
  logReportViewed(userId: string, reportId: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Crashlytics 리포트 조회 로그:', { userId, reportId });
      return;
    }

    try {
      crashlytics().log(`📊 진단 리포트 조회 - ReportID: ${reportId}`);
    } catch (error) {
      console.warn('⚠️ Crashlytics 리포트 조회 로그 실패:', error);
    }
  }

  /**
   * 커스텀 이벤트 로그
   */
  logCustomEvent(eventName: string, details?: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Crashlytics 커스텀 이벤트:', { eventName, details });
      return;
    }

    try {
      crashlytics().log(`🔔 ${eventName}${details ? ` - ${details}` : ''}`);
    } catch (error) {
      console.warn('⚠️ Crashlytics 커스텀 이벤트 로그 실패:', error);
    }
  }
}

// 싱글톤 인스턴스
const crashlyticsLogger = new CrashlyticsLogger();

export default crashlyticsLogger;

// 편의 함수들
export const logSignupComplete = crashlyticsLogger.logSignupComplete.bind(crashlyticsLogger);
export const logReservationCreated = crashlyticsLogger.logReservationCreated.bind(crashlyticsLogger);
export const logReservationUpdated = crashlyticsLogger.logReservationUpdated.bind(crashlyticsLogger);
export const logReservationCancelled = crashlyticsLogger.logReservationCancelled.bind(crashlyticsLogger);
export const logVehicleAdded = crashlyticsLogger.logVehicleAdded.bind(crashlyticsLogger);
export const logVehicleDeleted = crashlyticsLogger.logVehicleDeleted.bind(crashlyticsLogger);
export const logPaymentComplete = crashlyticsLogger.logPaymentComplete.bind(crashlyticsLogger);
export const logReportViewed = crashlyticsLogger.logReportViewed.bind(crashlyticsLogger);
export const logCustomEvent = crashlyticsLogger.logCustomEvent.bind(crashlyticsLogger);
