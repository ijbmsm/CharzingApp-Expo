/**
 * 중앙집중식 에러 처리 시스템
 * 
 * 보안 원칙:
 * 1. 프로덕션에서는 민감한 정보 완전 제거
 * 2. 사용자에게는 친화적인 메시지만 표시
 * 3. 개발 환경에서만 상세 디버깅 정보 제공
 * 4. 서버 에러는 Firebase Analytics로만 전송
 */

import { Alert } from 'react-native';
import analyticsService from './analyticsService';

// 에러 레벨 정의
export type ErrorLevel = 'low' | 'medium' | 'high' | 'critical';

// 에러 카테고리 정의
export type ErrorCategory = 
  | 'auth'           // 인증 관련
  | 'network'        // 네트워크 관련  
  | 'firebase'       // Firebase 관련
  | 'ui'             // UI/UX 관련
  | 'payment'        // 결제 관련
  | 'reservation'    // 예약 관련
  | 'vehicle'        // 차량 관련
  | 'map'            // 지도 관련
  | 'unknown';       // 알 수 없는 오류

// 보안상 안전한 사용자 메시지 맵핑
const USER_FRIENDLY_MESSAGES: Record<ErrorCategory, string> = {
  auth: '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  network: '인터넷 연결을 확인하고 다시 시도해주세요.',
  firebase: '서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
  ui: '화면 로딩 중 문제가 발생했습니다.',
  payment: '결제 처리 중 문제가 발생했습니다. 고객센터에 문의해주세요.',
  reservation: '예약 처리 중 문제가 발생했습니다. 다시 시도해주세요.',
  vehicle: '차량 정보를 불러오는 중 문제가 발생했습니다.',
  map: '지도를 불러오는 중 문제가 발생했습니다.',
  unknown: '예기치 못한 문제가 발생했습니다. 고객센터에 문의해주세요.'
};

// 에러 정보 타입 (내부용)
interface ErrorInfo {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  level: ErrorLevel;
  userMessage: string;
  originalError?: any;
  context?: Record<string, any>;
  userId?: string;
  screenName?: string;
  actionName?: string;
}

class ErrorHandler {
  private isDevelopment = __DEV__;
  private errorQueue: ErrorInfo[] = [];
  private maxQueueSize = 100;

  /**
   * 에러 처리 메인 함수
   */
  handle(
    error: any,
    category: ErrorCategory,
    level: ErrorLevel = 'medium',
    context?: {
      screenName?: string;
      actionName?: string;
      userId?: string;
      customMessage?: string;
      additionalData?: Record<string, any>;
    }
  ): string {
    const errorId = this.generateErrorId();
    const timestamp = Date.now();
    
    const errorInfo: ErrorInfo = {
      id: errorId,
      timestamp,
      category,
      level,
      userMessage: context?.customMessage || USER_FRIENDLY_MESSAGES[category],
      originalError: this.isDevelopment ? error : null,
      context: {
        screenName: context?.screenName,
        actionName: context?.actionName,
        ...context?.additionalData
      },
      userId: context?.userId
    };

    // 에러 큐에 추가
    this.addToQueue(errorInfo);

    // 개발 환경에서만 콘솔 로그
    if (this.isDevelopment) {
      this.logToConsole(errorInfo);
    }

    // 프로덕션에서는 Analytics로만 전송 (민감한 정보 제거)
    this.logToAnalytics(errorInfo);

    // 크리티컬 에러는 즉시 사용자에게 알림
    if (level === 'critical') {
      this.showCriticalErrorAlert(errorInfo.userMessage);
    }

    return errorInfo.userMessage;
  }

  /**
   * 네트워크 에러 전용 처리
   */
  handleNetworkError(error: any, context?: { 
    actionName?: string; 
    userId?: string; 
    screenName?: string;
    additionalData?: Record<string, any>;
  }): string {
    const isOffline = error?.message?.includes('Network request failed') || 
                     error?.code === 'network-request-failed';
    
    return this.handle(
      error,
      'network',
      isOffline ? 'high' : 'medium',
      {
        ...context,
        customMessage: isOffline 
          ? '인터넷 연결이 끊어졌습니다. 연결 상태를 확인해주세요.'
          : '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }
    );
  }

  /**
   * Firebase 에러 전용 처리
   */
  handleFirebaseError(error: any, context?: { 
    actionName?: string; 
    userId?: string; 
    screenName?: string;
    additionalData?: Record<string, any>;
  }): string {
    const errorCode = error?.code || 'unknown';
    
    // Firebase 에러 코드별 사용자 친화적 메시지
    const firebaseMessages: Record<string, string> = {
      'permission-denied': '접근 권한이 없습니다. 로그인 상태를 확인해주세요.',
      'unauthenticated': '로그인이 필요합니다.',
      'deadline-exceeded': '서버 응답 시간이 초과되었습니다. 다시 시도해주세요.',
      'unavailable': '서비스가 일시적으로 이용할 수 없습니다.',
      'data-loss': '데이터 처리 중 오류가 발생했습니다.',
      'unknown': '서버 오류가 발생했습니다.'
    };

    return this.handle(
      error,
      'firebase',
      errorCode === 'permission-denied' ? 'high' : 'medium',
      {
        ...context,
        customMessage: firebaseMessages[errorCode] || firebaseMessages.unknown,
        additionalData: { firebaseErrorCode: errorCode }
      }
    );
  }

  /**
   * 인증 에러 전용 처리
   */
  handleAuthError(error: any, provider?: 'google' | 'kakao' | 'apple'): string {
    return this.handle(
      error,
      'auth',
      'high',
      {
        actionName: `${provider}_login`,
        additionalData: { provider }
      }
    );
  }

  /**
   * 사용자에게 에러 메시지 표시
   */
  showUserError(
    category: ErrorCategory,
    customMessage?: string,
    showAlert: boolean = false
  ): string {
    const message = customMessage || USER_FRIENDLY_MESSAGES[category];
    
    if (showAlert) {
      Alert.alert('알림', message, [{ text: '확인' }]);
    }
    
    return message;
  }

  /**
   * 에러 ID 생성
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 에러 큐에 추가
   */
  private addToQueue(errorInfo: ErrorInfo): void {
    this.errorQueue.push(errorInfo);
    
    // 큐 크기 제한
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * 개발 환경 콘솔 로그 (상세 정보 포함)
   */
  private logToConsole(errorInfo: ErrorInfo): void {
    const logPrefix = `🚨 [${errorInfo.level.toUpperCase()}] [${errorInfo.category.toUpperCase()}]`;
    
    console.group(`${logPrefix} Error ${errorInfo.id}`);
    // console.log('📅 Timestamp:', new Date(errorInfo.timestamp).toISOString());
    // console.log('👤 User ID:', errorInfo.userId || 'anonymous');
    // console.log('📱 Screen:', errorInfo.context?.screenName || 'unknown');
    // console.log('⚡ Action:', errorInfo.context?.actionName || 'unknown');
    // console.log('💬 User Message:', errorInfo.userMessage);
    
    if (errorInfo.originalError) {
      // console.log('🔍 Original Error:', errorInfo.originalError);
    }
    
    if (errorInfo.context) {
      // console.log('📋 Context:', errorInfo.context);
    }
    
    console.groupEnd();
  }

  /**
   * Analytics로 에러 전송 (민감한 정보 제거)
   */
  private logToAnalytics(errorInfo: ErrorInfo): void {
    try {
      // 프로덕션에서는 민감한 정보 완전 제거
      const sanitizedData = {
        error_id: errorInfo.id,
        error_category: errorInfo.category,
        error_level: errorInfo.level,
        screen_name: errorInfo.context?.screenName || 'unknown',
        action_name: errorInfo.context?.actionName || 'unknown',
        has_user: !!errorInfo.userId,
        timestamp: errorInfo.timestamp,
        // 원본 에러나 민감한 컨텍스트는 전송하지 않음
      };

      analyticsService.logEvent('app_error', sanitizedData);
    } catch (analyticsError) {
      // Analytics 전송 실패는 무시 (재귀 에러 방지)
      if (this.isDevelopment) {
        console.warn('📊 Analytics 에러 로그 전송 실패:', analyticsError);
      }
    }
  }

  /**
   * 크리티컬 에러 알림
   */
  private showCriticalErrorAlert(message: string): void {
    Alert.alert(
      '중요한 오류',
      message,
      [
        { text: '확인', style: 'default' }
      ],
      { cancelable: false }
    );
  }

  /**
   * 개발 환경에서만 에러 큐 조회
   */
  getErrorQueue(): ErrorInfo[] {
    return this.isDevelopment ? [...this.errorQueue] : [];
  }

  /**
   * 에러 큐 초기화
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

// 싱글톤 인스턴스
const errorHandler = new ErrorHandler();

export default errorHandler;

// 편의 함수들
export const handleError = errorHandler.handle.bind(errorHandler);
export const handleNetworkError = errorHandler.handleNetworkError.bind(errorHandler);
export const handleFirebaseError = errorHandler.handleFirebaseError.bind(errorHandler);
export const handleAuthError = errorHandler.handleAuthError.bind(errorHandler);
export const showUserError = errorHandler.showUserError.bind(errorHandler);