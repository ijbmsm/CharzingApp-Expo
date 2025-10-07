import { Platform } from 'react-native';

class AnalyticsService {
  private isTrackingEnabled = true; // 추적 없이 일반 로깅만 사용

  // Analytics 초기화 (추적 없음)
  async initialize(): Promise<void> {
    try {
      console.log('🔥 Firebase Analytics 초기화 완료 (추적 비활성화)');
    } catch (error) {
      console.error('Analytics 초기화 실패:', error);
    }
  }

  // 화면 조회 로깅 (추적 없음)
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      console.log('📊 Analytics: screen_view', {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error('화면 조회 로그 실패:', error);
    }
  }

  // 진단 예약 관련 이벤트
  async logReservationStarted(locationType: 'map' | 'manual'): Promise<void> {
    try {
      console.log('📊 Analytics: reservation_started', {
        location_type: locationType,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('예약 시작 로그 실패:', error);
    }
  }

  async logReservationCompleted(data: {
    userId: string;
    address: string;
    selectedDate: string;
    selectedTime: string;
  }): Promise<void> {
    try {
      console.log('📊 Analytics: reservation_completed', {
        user_id: data.userId,
        location: data.address,
        selected_date: data.selectedDate,
        selected_time: data.selectedTime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('예약 완료 로그 실패:', error);
    }
  }

  async logReservationCancelled(reservationId: string, reason?: string): Promise<void> {
    try {
      console.log('📊 Analytics: reservation_cancelled', {
        reservation_id: reservationId,
        cancellation_reason: reason || 'user_action',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('예약 취소 로그 실패:', error);
    }
  }

  // 리포트 관련 이벤트
  async logReportViewed(reportId: string, reportType: string): Promise<void> {
    try {
      console.log('📊 Analytics: report_viewed', {
        report_id: reportId,
        report_type: reportType,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('리포트 조회 로그 실패:', error);
    }
  }

  async logReportDownloaded(reportId: string): Promise<void> {
    try {
      console.log('📊 Analytics: report_downloaded', {
        report_id: reportId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('리포트 다운로드 로그 실패:', error);
    }
  }

  // 사용자 행동 이벤트
  async logLogin(method: 'kakao' | 'google' | 'email'): Promise<void> {
    try {
      console.log('📊 Analytics: login', {
        method: method,
      });
    } catch (error) {
      console.error('로그인 로그 실패:', error);
    }
  }

  async logSignUp(method: 'kakao' | 'google' | 'email'): Promise<void> {
    try {
      console.log('📊 Analytics: sign_up', {
        method: method,
      });
    } catch (error) {
      console.error('회원가입 로그 실패:', error);
    }
  }

  // 맞춤 이벤트
  async logCustomEvent(eventName: string, parameters?: { [key: string]: any }): Promise<void> {
    try {
      console.log('📊 Analytics: ' + eventName, {
        ...parameters,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`맞춤 이벤트 로그 실패 (${eventName}):`, error);
    }
  }

  // 오류 이벤트
  async logError(error: Error, context?: string): Promise<void> {
    try {
      console.log('📊 Analytics: app_error', {
        error_message: error.message,
        error_stack: error.stack || 'No stack trace',
        context: context || 'unknown',
        timestamp: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('오류 로그 실패:', logError);
    }
  }

  // 사용자 설정
  async setUserId(userId: string): Promise<void> {
    try {
      console.log('📊 Analytics: setUserId', userId);
    } catch (error) {
      console.error('사용자 ID 설정 실패:', error);
    }
  }

  async setUserProperty(name: string, value: string): Promise<void> {
    try {
      console.log('📊 Analytics: setUserProperty', name, value);
    } catch (error) {
      console.error('사용자 속성 설정 실패:', error);
    }
  }
}

// 싱글톤 인스턴스 생성
const analyticsService = new AnalyticsService();
export default analyticsService;