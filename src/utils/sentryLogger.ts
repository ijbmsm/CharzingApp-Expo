/**
 * Sentry 로깅 유틸리티
 *
 * 주요 사용자 액션 및 비즈니스 이벤트를 Sentry에 기록합니다.
 * 프로덕션 환경에서만 동작하며, 개발 환경에서는 콘솔 로그만 출력합니다.
 */

import * as Sentry from '@sentry/react-native';

class SentryLogger {
  private isDevelopment = __DEV__;

  /**
   * 회원가입 완료 로그
   */
  logSignupComplete(userId: string, provider: 'kakao' | 'google' | 'apple'): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 회원가입 로그:', { userId, provider });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `✅ 회원가입 완료 - Provider: ${provider}`,
        level: 'info',
        data: { userId, provider },
      });
      Sentry.setTag('last_signup_provider', provider);
    } catch (error) {
      console.warn('⚠️ Sentry 회원가입 로그 실패:', error);
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
      console.log('📝 [DEV] Sentry 예약 생성 로그:', {
        userId,
        reservationId,
        vehicleInfo,
        reservationType
      });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `📅 예약 생성 - ${vehicleInfo.brand} ${vehicleInfo.model} (${vehicleInfo.year})`,
        level: 'info',
        data: { userId, reservationId, vehicleInfo, reservationType },
      });
      Sentry.setTag('last_reservation_brand', vehicleInfo.brand);
      Sentry.setTag('last_reservation_type', reservationType);
    } catch (error) {
      console.warn('⚠️ Sentry 예약 생성 로그 실패:', error);
    }
  }

  /**
   * 예약 수정 로그
   */
  logReservationUpdated(reservationId: string, updatedFields: string[]): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 예약 수정 로그:', { reservationId, updatedFields });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `📝 예약 수정 - ${updatedFields.join(', ')}`,
        level: 'info',
        data: { reservationId, updatedFields },
      });
    } catch (error) {
      console.warn('⚠️ Sentry 예약 수정 로그 실패:', error);
    }
  }

  /**
   * 예약 취소 로그
   */
  logReservationCancelled(reservationId: string, reason?: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 예약 취소 로그:', { reservationId, reason });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `❌ 예약 취소${reason ? ` - ${reason}` : ''}`,
        level: 'info',
        data: { reservationId, reason },
      });
    } catch (error) {
      console.warn('⚠️ Sentry 예약 취소 로그 실패:', error);
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
      console.log('📝 [DEV] Sentry 차량 추가 로그:', { userId, vehicleInfo });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `🚗 차량 추가 - ${vehicleInfo.brand} ${vehicleInfo.model} (${vehicleInfo.year})`,
        level: 'info',
        data: { userId, vehicleInfo },
      });
      Sentry.setTag('last_added_vehicle_brand', vehicleInfo.brand);
    } catch (error) {
      console.warn('⚠️ Sentry 차량 추가 로그 실패:', error);
    }
  }

  /**
   * 차량 삭제 로그
   */
  logVehicleDeleted(userId: string, vehicleId: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 차량 삭제 로그:', { userId, vehicleId });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `🗑️ 차량 삭제`,
        level: 'info',
        data: { userId, vehicleId },
      });
    } catch (error) {
      console.warn('⚠️ Sentry 차량 삭제 로그 실패:', error);
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
      console.log('📝 [DEV] Sentry 결제 완료 로그:', {
        userId,
        reservationId,
        amount,
        paymentMethod
      });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `💳 결제 완료 - ${amount}원`,
        level: 'info',
        data: { userId, reservationId, amount, paymentMethod },
      });
      Sentry.setTag('last_payment_method', paymentMethod);
    } catch (error) {
      console.warn('⚠️ Sentry 결제 완료 로그 실패:', error);
    }
  }

  /**
   * 리포트 조회 로그
   */
  logReportViewed(userId: string, reportId: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 리포트 조회 로그:', { userId, reportId });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `📊 진단 리포트 조회`,
        level: 'info',
        data: { userId, reportId },
      });
    } catch (error) {
      console.warn('⚠️ Sentry 리포트 조회 로그 실패:', error);
    }
  }

  /**
   * 진단 리포트 업로드 시작 로그
   */
  logDiagnosisReportUploadStart(
    userId: string,
    vehicleInfo: {
      brand?: string;
      name: string;
      year: string;
    }
  ): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 진단 리포트 업로드 시작:', { userId, vehicleInfo });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `🔄 진단 리포트 업로드 시작 - ${vehicleInfo.brand || ''} ${vehicleInfo.name} (${vehicleInfo.year})`,
        level: 'info',
        data: { userId, vehicleInfo },
      });
      if (vehicleInfo.brand) {
        Sentry.setTag('last_report_vehicle_brand', vehicleInfo.brand);
      }
    } catch (error) {
      console.warn('⚠️ Sentry 진단 리포트 업로드 시작 로그 실패:', error);
    }
  }

  /**
   * 진단 리포트 업로드 성공 로그
   */
  logDiagnosisReportUploadSuccess(
    userId: string,
    reportId: string,
    vehicleInfo: {
      brand?: string;
      name: string;
      year: string;
    },
    reportDetails: {
      cellCount: number;
      defectiveCellCount: number;
      sohPercentage: number;
      mileage?: number;
    }
  ): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 진단 리포트 업로드 성공:', {
        userId,
        reportId,
        vehicleInfo,
        reportDetails
      });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `✅ 진단 리포트 업로드 완료 - ${vehicleInfo.brand || ''} ${vehicleInfo.name} (${vehicleInfo.year}) | SOH: ${reportDetails.sohPercentage}% | 셀: ${reportDetails.cellCount}개 (불량: ${reportDetails.defectiveCellCount}개)`,
        level: 'info',
        data: { userId, reportId, vehicleInfo, reportDetails },
      });
      if (vehicleInfo.brand) {
        Sentry.setTag('last_uploaded_vehicle_brand', vehicleInfo.brand);
      }
      Sentry.setTag('last_report_id', reportId);
    } catch (error) {
      console.warn('⚠️ Sentry 진단 리포트 업로드 성공 로그 실패:', error);
    }
  }

  /**
   * 진단 리포트 업로드 실패 로그
   */
  logDiagnosisReportUploadError(
    userId: string,
    error: Error,
    vehicleInfo: {
      brand?: string;
      name: string;
      year: string;
    },
    context?: string
  ): void {
    if (this.isDevelopment) {
      console.error('📝 [DEV] Sentry 진단 리포트 업로드 실패:', {
        userId,
        error,
        vehicleInfo,
        context
      });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `❌ 진단 리포트 업로드 실패 - ${vehicleInfo.brand || ''} ${vehicleInfo.name} (${vehicleInfo.year})${context ? ` | Context: ${context}` : ''}`,
        level: 'error',
        data: { userId, vehicleInfo, context, errorMessage: error.message },
      });
      Sentry.captureException(error, {
        tags: {
          vehicle_brand: vehicleInfo.brand || 'unknown',
          vehicle_name: vehicleInfo.name,
          vehicle_year: vehicleInfo.year,
          context: context || 'unknown',
        },
      });
    } catch (err) {
      console.warn('⚠️ Sentry 진단 리포트 업로드 실패 로그 실패:', err);
    }
  }

  /**
   * 커스텀 이벤트 로그
   */
  logCustomEvent(eventName: string, details?: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 커스텀 이벤트:', { eventName, details });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `🔔 ${eventName}${details ? ` - ${details}` : ''}`,
        level: 'info',
        data: { eventName, details },
      });
    } catch (error) {
      console.warn('⚠️ Sentry 커스텀 이벤트 로그 실패:', error);
    }
  }

  /**
   * 에러 로그 (non-fatal)
   */
  logError(error: Error, context?: string): void {
    if (this.isDevelopment) {
      console.error('❌ [DEV] Sentry 에러:', { error, context });
      return;
    }

    try {
      if (context) {
        Sentry.addBreadcrumb({
          message: `❌ 에러 발생 - Context: ${context}`,
          level: 'error',
        });
      }
      Sentry.captureException(error);
    } catch (err) {
      console.warn('⚠️ Sentry 에러 로그 실패:', err);
    }
  }

  /**
   * 로그인 성공 로그
   */
  logLoginSuccess(userId: string, provider: 'kakao' | 'google' | 'apple'): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 로그인 성공:', { userId, provider });
      return;
    }

    try {
      Sentry.setUser({ id: userId });
      Sentry.addBreadcrumb({
        message: `✅ 로그인 성공 - Provider: ${provider}`,
        level: 'info',
        data: { userId, provider },
      });
      Sentry.setTag('last_login_provider', provider);
    } catch (error) {
      console.warn('⚠️ Sentry 로그인 성공 로그 실패:', error);
    }
  }

  /**
   * 로그인 실패 로그
   */
  logLoginFailure(provider: 'kakao' | 'google' | 'apple', error: Error): void {
    if (this.isDevelopment) {
      console.error('📝 [DEV] Sentry 로그인 실패:', { provider, error });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `❌ 로그인 실패 - Provider: ${provider}`,
        level: 'error',
        data: { provider, errorMessage: error.message },
      });
      Sentry.captureException(error);
    } catch (err) {
      console.warn('⚠️ Sentry 로그인 실패 로그 실패:', err);
    }
  }

  /**
   * 로그아웃 로그
   */
  logLogout(userId: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 로그아웃:', { userId });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `👋 로그아웃`,
        level: 'info',
        data: { userId },
      });
      Sentry.setUser(null);
    } catch (error) {
      console.warn('⚠️ Sentry 로그아웃 로그 실패:', error);
    }
  }

  /**
   * 사용자 속성 설정
   */
  setUserId(userId: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 사용자 ID 설정:', userId);
      return;
    }

    try {
      Sentry.setUser({ id: userId });
    } catch (error) {
      console.warn('⚠️ Sentry 사용자 ID 설정 실패:', error);
    }
  }

  /**
   * 사용자 속성 추가
   */
  setAttribute(key: string, value: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 속성 설정:', { key, value });
      return;
    }

    try {
      Sentry.setTag(key, value);
    } catch (error) {
      console.warn('⚠️ Sentry 속성 설정 실패:', error);
    }
  }

  /**
   * 크래시 강제 발생 (테스트용)
   */
  testCrash(): void {
    if (this.isDevelopment) {
      console.warn('⚠️ [DEV] 크래시 테스트는 개발 모드에서 실행되지 않습니다.');
      return;
    }

    throw new Error('Sentry 테스트 크래시');
  }
}

// 싱글톤 인스턴스
const sentryLogger = new SentryLogger();

export default sentryLogger;

// 편의 함수들
export const logSignupComplete = sentryLogger.logSignupComplete.bind(sentryLogger);
export const logReservationCreated = sentryLogger.logReservationCreated.bind(sentryLogger);
export const logReservationUpdated = sentryLogger.logReservationUpdated.bind(sentryLogger);
export const logReservationCancelled = sentryLogger.logReservationCancelled.bind(sentryLogger);
export const logVehicleAdded = sentryLogger.logVehicleAdded.bind(sentryLogger);
export const logVehicleDeleted = sentryLogger.logVehicleDeleted.bind(sentryLogger);
export const logPaymentComplete = sentryLogger.logPaymentComplete.bind(sentryLogger);
export const logReportViewed = sentryLogger.logReportViewed.bind(sentryLogger);
export const logCustomEvent = sentryLogger.logCustomEvent.bind(sentryLogger);
export const logError = sentryLogger.logError.bind(sentryLogger);
export const logLoginSuccess = sentryLogger.logLoginSuccess.bind(sentryLogger);
export const logLoginFailure = sentryLogger.logLoginFailure.bind(sentryLogger);
export const logLogout = sentryLogger.logLogout.bind(sentryLogger);
export const setUserId = sentryLogger.setUserId.bind(sentryLogger);
export const setAttribute = sentryLogger.setAttribute.bind(sentryLogger);
export const testCrash = sentryLogger.testCrash.bind(sentryLogger);
