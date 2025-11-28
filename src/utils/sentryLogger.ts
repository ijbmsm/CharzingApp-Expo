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
   * 결제 시작 로그
   */
  logPaymentStart(
    userId: string,
    orderId: string,
    amount: number,
    serviceType: string
  ): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 결제 시작 로그:', {
        userId,
        orderId,
        amount,
        serviceType
      });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `💳 결제 시작 - ${amount}원 (${serviceType})`,
        level: 'info',
        data: { userId, orderId, amount, serviceType },
      });
      Sentry.setTag('last_payment_service_type', serviceType);
    } catch (error) {
      console.warn('⚠️ Sentry 결제 시작 로그 실패:', error);
    }
  }

  /**
   * 결제 위젯 초기화 성공 로그
   */
  logPaymentWidgetLoaded(orderId: string, clientKey: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 결제 위젯 로드 로그:', {
        orderId,
        clientKey: clientKey.slice(0, 15) + '...'
      });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `🎨 결제 위젯 로드 완료`,
        level: 'info',
        data: { orderId, clientKey: clientKey.slice(0, 15) + '...' },
      });
    } catch (error) {
      console.warn('⚠️ Sentry 결제 위젯 로드 로그 실패:', error);
    }
  }

  /**
   * 결제 요청 로그 (사용자가 결제 버튼 클릭)
   */
  logPaymentRequested(
    orderId: string,
    amount: number,
    customerName: string,
    paymentMethod?: string
  ): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 결제 요청 로그:', {
        orderId,
        amount,
        customerName,
        paymentMethod
      });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `💰 결제 요청 - ${amount}원`,
        level: 'info',
        data: { orderId, amount, customerName, paymentMethod },
      });
      if (paymentMethod) {
        Sentry.setTag('payment_method', paymentMethod);
      }
    } catch (error) {
      console.warn('⚠️ Sentry 결제 요청 로그 실패:', error);
    }
  }

  /**
   * 결제 성공 로그 (Toss 승인)
   */
  logPaymentSuccess(
    paymentKey: string,
    orderId: string,
    amount: number
  ): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 결제 성공 로그:', {
        paymentKey: paymentKey.slice(0, 15) + '...',
        orderId,
        amount
      });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `✅ 결제 성공 - ${amount}원`,
        level: 'info',
        data: { paymentKey: paymentKey.slice(0, 15) + '...', orderId, amount },
      });
    } catch (error) {
      console.warn('⚠️ Sentry 결제 성공 로그 실패:', error);
    }
  }

  /**
   * 결제 실패 로그
   */
  logPaymentError(
    userId: string,
    orderId: string,
    errorCode: string,
    errorMessage: string,
    amount: number
  ): void {
    if (this.isDevelopment) {
      console.error('📝 [DEV] Sentry 결제 실패 로그:', {
        userId,
        orderId,
        errorCode,
        errorMessage,
        amount
      });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `❌ 결제 실패 - ${errorCode}`,
        level: 'error',
        data: { userId, orderId, errorCode, errorMessage, amount },
      });
      Sentry.captureMessage(`결제 실패: ${errorCode} - ${errorMessage}`, {
        level: 'error',
        tags: {
          error_code: errorCode,
          order_id: orderId,
        },
      });
    } catch (error) {
      console.warn('⚠️ Sentry 결제 실패 로그 실패:', error);
    }
  }

  /**
   * 결제 취소 로그
   */
  logPaymentCancel(userId: string, orderId: string, reason?: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 결제 취소 로그:', {
        userId,
        orderId,
        reason
      });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `🚫 결제 취소${reason ? ` - ${reason}` : ''}`,
        level: 'info',
        data: { userId, orderId, reason },
      });
    } catch (error) {
      console.warn('⚠️ Sentry 결제 취소 로그 실패:', error);
    }
  }

  /**
   * 결제 확정 시작 로그 (Firebase Function 호출)
   */
  logPaymentConfirmationStart(
    orderId: string,
    paymentKey: string,
    amount: number
  ): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Sentry 결제 확정 시작 로그:', {
        orderId,
        paymentKey: paymentKey.slice(0, 15) + '...',
        amount
      });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `🔄 결제 확정 시작 - ${amount}원`,
        level: 'info',
        data: { orderId, paymentKey: paymentKey.slice(0, 15) + '...', amount },
      });
    } catch (error) {
      console.warn('⚠️ Sentry 결제 확정 시작 로그 실패:', error);
    }
  }

  /**
   * 결제 완료 로그 (확정 완료)
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
   * 일반 로그 (정보성)
   */
  log(message: string, data?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.log(`📝 [DEV] ${message}`, data || '');
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message,
        level: 'info',
        data,
      });
    } catch (error) {
      console.warn('⚠️ Sentry 로그 실패:', error);
    }
  }

  /**
   * 에러 로그 (non-fatal)
   */
  logError(message: string, error: Error, data?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.error(`❌ [DEV] ${message}`, { error, ...data });
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message: `❌ ${message}`,
        level: 'error',
        data: { ...data, errorMessage: error.message, errorStack: error.stack },
      });
      Sentry.captureException(error, {
        contexts: {
          custom: data || {},
        },
      });
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

  // ========================================
  // 🔥 100% 로깅 시스템 (5가지 카테고리)
  // ========================================

  /**
   * 1️⃣ Flow Tracing - 기능 단위 플로우 추적
   * 성공 로그는 Breadcrumb만 사용 (captureException은 실패 시만)
   */

  // Draft 관련 Flow
  logDraftSaveStart(userId: string, dataSize: number): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Draft 저장 시작', { userId, dataSize });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'draft',
      level: 'info',
      message: 'Draft save started',
      data: { userId, dataSize },
    });
  }

  logDraftSaveSuccess(userId: string, dataSize: number, duration: number): void {
    if (this.isDevelopment) {
      console.log('✅ [DEV] Draft 저장 완료', { userId, dataSize, duration });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'draft',
      level: 'info',
      message: 'Draft saved successfully',
      data: { userId, dataSize, duration },
    });
  }

  logDraftLoadStart(userId: string): void {
    if (this.isDevelopment) {
      console.log('📝 [DEV] Draft 불러오기 시작', { userId });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'draft',
      level: 'info',
      message: 'Draft load started',
      data: { userId },
    });
  }

  logDraftLoadSuccess(userId: string, dataSize: number, savedAt: string): void {
    if (this.isDevelopment) {
      console.log('✅ [DEV] Draft 불러오기 완료', { userId, dataSize, savedAt });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'draft',
      level: 'info',
      message: 'Draft loaded successfully',
      data: { userId, dataSize, savedAt },
    });
  }

  logDraftAutoResume(userId: string, elapsedSeconds: number): void {
    if (this.isDevelopment) {
      console.log('⚡ [DEV] 빠른 재진입 - 자동 이어쓰기', { userId, elapsedSeconds });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'draft',
      level: 'info',
      message: 'Draft auto-resumed (quick re-entry)',
      data: { userId, elapsedSeconds },
    });
  }

  logDraftPopupShown(userId: string, elapsedSeconds: number): void {
    if (this.isDevelopment) {
      console.log('🕐 [DEV] 오래 후 재진입 - 팝업 표시', { userId, elapsedSeconds });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'draft',
      level: 'info',
      message: 'Draft popup shown (delayed re-entry)',
      data: { userId, elapsedSeconds },
    });
  }

  logDraftDeleted(userId: string, reason: 'user_choice' | 'submission_success' | 'expired'): void {
    if (this.isDevelopment) {
      console.log('🗑️ [DEV] Draft 삭제', { userId, reason });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'draft',
      level: 'info',
      message: `Draft deleted (${reason})`,
      data: { userId, reason },
    });
  }

  /**
   * 2️⃣ 이미지 업로드 상세 로그
   */

  logImagePickStart(userId: string, source: 'camera' | 'gallery', category: string): void {
    if (this.isDevelopment) {
      console.log('📷 [DEV] 이미지 선택 시작', { userId, source, category });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'image',
      level: 'info',
      message: `Image pick started (${source})`,
      data: { userId, source, category },
    });
  }

  logImagePickSuccess(userId: string, count: number, source: 'camera' | 'gallery', category: string): void {
    if (this.isDevelopment) {
      console.log('✅ [DEV] 이미지 선택 완료', { userId, count, source, category });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'image',
      level: 'info',
      message: `Image picked successfully (${count} images)`,
      data: { userId, count, source, category },
    });
  }

  logImageUploadStart(userId: string, count: number, category: string): void {
    if (this.isDevelopment) {
      console.log('📤 [DEV] 이미지 업로드 시작', { userId, count, category });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'image',
      level: 'info',
      message: `Image upload started (${count} images)`,
      data: { userId, count, category },
    });
  }

  logImageUploadProgress(userId: string, current: number, total: number, category: string): void {
    if (this.isDevelopment) {
      console.log('📊 [DEV] 이미지 업로드 진행', { userId, current, total, category });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'image',
      level: 'info',
      message: `Image upload progress (${current}/${total})`,
      data: { userId, current, total, category },
    });
  }

  logImageUploadSuccess(userId: string, count: number, category: string, duration: number): void {
    if (this.isDevelopment) {
      console.log('✅ [DEV] 이미지 업로드 완료', { userId, count, category, duration });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'image',
      level: 'info',
      message: `Image uploaded successfully (${count} images)`,
      data: { userId, count, category, duration },
    });
  }

  logImageUploadError(userId: string, error: Error, category: string, imageIndex?: number): void {
    if (this.isDevelopment) {
      console.error('❌ [DEV] 이미지 업로드 실패', { userId, error, category, imageIndex });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'image',
      level: 'error',
      message: `Image upload failed`,
      data: { userId, category, imageIndex, errorMessage: error.message },
    });
    Sentry.captureException(error, {
      tags: { category, image_index: imageIndex?.toString() || 'unknown' },
    });
  }

  /**
   * 3️⃣ UI Interactions - 사용자 액션 로그
   */

  logButtonClick(userId: string, buttonName: string, screenName: string): void {
    if (this.isDevelopment) {
      console.log('👆 [DEV] 버튼 클릭', { userId, buttonName, screenName });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'ui',
      level: 'info',
      message: `Button clicked: ${buttonName}`,
      data: { userId, buttonName, screenName },
    });
  }

  logModalOpen(userId: string, modalName: string, trigger: string): void {
    if (this.isDevelopment) {
      console.log('🔓 [DEV] 모달 열림', { userId, modalName, trigger });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'ui',
      level: 'info',
      message: `Modal opened: ${modalName}`,
      data: { userId, modalName, trigger },
    });
  }

  logModalClose(userId: string, modalName: string, action: string): void {
    if (this.isDevelopment) {
      console.log('🔒 [DEV] 모달 닫힘', { userId, modalName, action });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'ui',
      level: 'info',
      message: `Modal closed: ${modalName}`,
      data: { userId, modalName, action },
    });
  }

  logAccordionToggle(userId: string, sectionName: string, isExpanded: boolean): void {
    if (this.isDevelopment) {
      console.log('📂 [DEV] 아코디언 토글', { userId, sectionName, isExpanded });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'ui',
      level: 'info',
      message: `Accordion ${isExpanded ? 'expanded' : 'collapsed'}: ${sectionName}`,
      data: { userId, sectionName, isExpanded },
    });
  }

  logScreenView(userId: string, screenName: string, params?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.log('📱 [DEV] 화면 진입', { userId, screenName, params });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'navigation',
      level: 'info',
      message: `Screen view: ${screenName}`,
      data: { userId, screenName, ...params },
    });
  }

  logFormFieldChange(userId: string, fieldName: string, screenName: string): void {
    if (this.isDevelopment) {
      console.log('✏️ [DEV] 폼 필드 변경', { userId, fieldName, screenName });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'ui',
      level: 'info',
      message: `Form field changed: ${fieldName}`,
      data: { userId, fieldName, screenName },
    });
  }

  /**
   * 4️⃣ Draft 구조 변화 감시
   */

  logDraftStructureChange(userId: string, section: string, changeType: 'add' | 'update' | 'delete', fieldCount: number): void {
    if (this.isDevelopment) {
      console.log('🔄 [DEV] Draft 구조 변경', { userId, section, changeType, fieldCount });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'draft',
      level: 'info',
      message: `Draft structure changed (${section}: ${changeType})`,
      data: { userId, section, changeType, fieldCount },
    });
  }

  logDraftValidation(userId: string, isValid: boolean, errors?: string[]): void {
    if (this.isDevelopment) {
      console.log('✔️ [DEV] Draft 검증', { userId, isValid, errors });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'draft',
      level: isValid ? 'info' : 'warning',
      message: `Draft validation ${isValid ? 'passed' : 'failed'}`,
      data: { userId, isValid, errors },
    });
  }

  logDraftImageCount(userId: string, totalImages: number, sections: Record<string, number>): void {
    if (this.isDevelopment) {
      console.log('🖼️ [DEV] Draft 이미지 수', { userId, totalImages, sections });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'draft',
      level: 'info',
      message: `Draft contains ${totalImages} images`,
      data: { userId, totalImages, sections },
    });
  }

  /**
   * 5️⃣ 디바이스/네트워크 환경
   */

  logDeviceInfo(platform: string, osVersion: string, appVersion: string, isSimulator: boolean): void {
    if (this.isDevelopment) {
      console.log('📱 [DEV] 디바이스 정보', { platform, osVersion, appVersion, isSimulator });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'device',
      level: 'info',
      message: 'Device info captured',
      data: { platform, osVersion, appVersion, isSimulator },
    });
    Sentry.setTag('platform', platform);
    Sentry.setTag('os_version', osVersion);
    Sentry.setTag('app_version', appVersion);
    Sentry.setTag('is_simulator', isSimulator.toString());
  }

  logNetworkStatus(isConnected: boolean, type?: string): void {
    if (this.isDevelopment) {
      console.log('🌐 [DEV] 네트워크 상태', { isConnected, type });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'network',
      level: isConnected ? 'info' : 'warning',
      message: `Network ${isConnected ? 'connected' : 'disconnected'}`,
      data: { isConnected, type },
    });
  }

  logAPICallStart(endpoint: string, method: string): void {
    if (this.isDevelopment) {
      console.log('🌐 [DEV] API 호출 시작', { endpoint, method });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'network',
      level: 'info',
      message: `API call started: ${method} ${endpoint}`,
      data: { endpoint, method },
    });
  }

  logAPICallSuccess(endpoint: string, method: string, duration: number, statusCode: number): void {
    if (this.isDevelopment) {
      console.log('✅ [DEV] API 호출 성공', { endpoint, method, duration, statusCode });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'network',
      level: 'info',
      message: `API call success: ${method} ${endpoint}`,
      data: { endpoint, method, duration, statusCode },
    });
  }

  logAPICallError(endpoint: string, method: string, error: Error, statusCode?: number): void {
    if (this.isDevelopment) {
      console.error('❌ [DEV] API 호출 실패', { endpoint, method, error, statusCode });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'network',
      level: 'error',
      message: `API call failed: ${method} ${endpoint}`,
      data: { endpoint, method, statusCode, errorMessage: error.message },
    });
    Sentry.captureException(error, {
      tags: { endpoint, method, status_code: statusCode?.toString() || 'unknown' },
    });
  }

  logStorageSize(userId: string, draftSize: number, imageSize: number): void {
    if (this.isDevelopment) {
      console.log('💾 [DEV] 저장소 크기', { userId, draftSize, imageSize });
      return;
    }
    Sentry.addBreadcrumb({
      category: 'performance',
      level: 'info',
      message: 'Storage size captured',
      data: { userId, draftSize, imageSize, totalSize: draftSize + imageSize },
    });
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
