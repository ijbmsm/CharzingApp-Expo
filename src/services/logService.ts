import { Platform } from 'react-native';
import Constants from 'expo-constants';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    isDevice: boolean;
  };
}

class LogService {
  private isProduction: boolean;
  private enableConsole: boolean;
  
  constructor() {
    this.isProduction = !__DEV__;
    this.enableConsole = __DEV__; // 개발 모드에서만 콘솔 출력
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    userId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      userId,
      deviceInfo: {
        platform: Platform.OS,
        version: Constants.expoConfig?.version || '1.0.0',
        isDevice: !Constants.isDevice ? false : true,
      },
    };
  }

  private formatLogMessage(entry: LogEntry): string {
    const { timestamp, level, category, message, userId } = entry;
    const userStr = userId ? ` [User: ${userId.substring(0, 8)}...]` : '';
    return `[${timestamp}] ${level} [${category}]${userStr} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isProduction) return true; // 개발 모드에서는 모든 로그
    
    // 운영 모드에서는 WARN, ERROR, FATAL만 로그
    return ['WARN', 'ERROR', 'FATAL'].includes(level);
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.enableConsole) return;

    const message = this.formatLogMessage(entry);
    
    switch (entry.level) {
      case 'DEBUG':
        console.log(`🔍 ${message}`, entry.data);
        break;
      case 'INFO':
        console.info(`ℹ️ ${message}`, entry.data);
        break;
      case 'WARN':
        console.warn(`⚠️ ${message}`, entry.data);
        break;
      case 'ERROR':
        console.error(`❌ ${message}`, entry.data);
        break;
      case 'FATAL':
        console.error(`💀 ${message}`, entry.data);
        break;
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.isProduction) return; // 개발 모드에서는 원격 로그 안함
    
    try {
      // Firebase Analytics나 외부 로그 서비스로 전송
      // 실제 구현 시 Firebase Analytics logEvent 사용
      // await analytics().logEvent('app_log', {
      //   level: entry.level,
      //   category: entry.category,
      //   message: entry.message,
      //   userId: entry.userId,
      // });
    } catch (error) {
      // 원격 로그 실패는 조용히 처리
    }
  }

  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    userId?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, category, message, data, userId);
    
    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  // 디버그 로그 (개발 모드에서만)
  debug(category: string, message: string, data?: any, userId?: string): void {
    this.log('DEBUG', category, message, data, userId);
  }

  // 정보 로그
  info(category: string, message: string, data?: any, userId?: string): void {
    this.log('INFO', category, message, data, userId);
  }

  // 경고 로그 (운영에서도 기록)
  warn(category: string, message: string, data?: any, userId?: string): void {
    this.log('WARN', category, message, data, userId);
  }

  // 에러 로그 (운영에서도 기록)
  error(category: string, message: string, data?: any, userId?: string): void {
    this.log('ERROR', category, message, data, userId);
  }

  // 치명적 에러 (운영에서도 기록)
  fatal(category: string, message: string, data?: any, userId?: string): void {
    this.log('FATAL', category, message, data, userId);
  }

  // 사용자 액션 로그 (비즈니스 로직)
  userAction(
    action: string,
    userId?: string,
    data?: any
  ): void {
    this.info('USER_ACTION', `User performed: ${action}`, data, userId);
  }

  // 앱 성능 로그
  performance(
    metric: string,
    value: number,
    unit: string = 'ms',
    data?: any
  ): void {
    this.info('PERFORMANCE', `${metric}: ${value}${unit}`, data);
  }

  // 네트워크 요청 로그
  networkRequest(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
    userId?: string
  ): void {
    const message = `${method} ${url} ${statusCode ? `-> ${statusCode}` : ''}${duration ? ` (${duration}ms)` : ''}`;
    
    if (statusCode && statusCode >= 400) {
      this.error('NETWORK', message, { method, url, statusCode, duration }, userId);
    } else {
      this.debug('NETWORK', message, { method, url, statusCode, duration }, userId);
    }
  }

  // Firebase 작업 로그
  firebaseOperation(
    operation: string,
    collection?: string,
    success: boolean = true,
    error?: any,
    userId?: string
  ): void {
    const message = `Firebase ${operation}${collection ? ` on ${collection}` : ''} ${success ? 'succeeded' : 'failed'}`;
    
    if (success) {
      this.debug('FIREBASE', message, { operation, collection }, userId);
    } else {
      this.error('FIREBASE', message, { operation, collection, error }, userId);
    }
  }

  // 인증 관련 로그
  auth(
    action: string,
    provider?: string,
    success: boolean = true,
    error?: any,
    userId?: string
  ): void {
    const message = `Auth ${action}${provider ? ` with ${provider}` : ''} ${success ? 'succeeded' : 'failed'}`;
    
    if (success) {
      this.info('AUTH', message, { action, provider }, userId);
    } else {
      this.error('AUTH', message, { action, provider, error }, userId);
    }
  }

  // 예약 관련 로그
  reservation(
    action: string,
    reservationId?: string,
    status?: string,
    userId?: string,
    data?: any
  ): void {
    const message = `Reservation ${action}${reservationId ? ` (${reservationId})` : ''}${status ? ` -> ${status}` : ''}`;
    this.info('RESERVATION', message, { action, reservationId, status, ...data }, userId);
  }

  // 차량 관련 로그
  vehicle(
    action: string,
    vehicleInfo?: { make?: string; model?: string; year?: number },
    userId?: string,
    data?: any
  ): void {
    const vehicleStr = vehicleInfo ? `${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}` : '';
    const message = `Vehicle ${action}${vehicleStr ? ` (${vehicleStr})` : ''}`;
    this.info('VEHICLE', message, { action, vehicleInfo, ...data }, userId);
  }
}

// 싱글톤 인스턴스
export const logger = new LogService();
export default logger;