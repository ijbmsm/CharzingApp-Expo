/**
 * Firebase 초기화 서비스
 * Single Responsibility Principle (SRP): Firebase 초기화만 담당
 * Open/Closed Principle (OCP): 새로운 설정 확장에 열려있음
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔧 2024년 Firebase Auth React Native persistence 워라운드
const getReactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

import {
  IFirebaseService,
  FirebaseConfig,
  FirebaseInitializationResult,
  FirebaseInitializationStatus,
  FirebaseInitializationOptions,
  FirebaseInitializationEvent,
  FirebaseInitializationListener
} from './types';

/**
 * Firebase 초기화 서비스 구현
 * SOLID 원칙을 준수하며 확장 가능한 구조로 설계
 */
export class FirebaseInitializationService implements IFirebaseService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private status: FirebaseInitializationStatus = FirebaseInitializationStatus.NOT_INITIALIZED;
  private listeners: FirebaseInitializationListener[] = [];
  private config: FirebaseConfig | null = null;
  private options: FirebaseInitializationOptions = {};

  /**
   * Firebase 초기화
   * @param config Firebase 설정
   * @param options 초기화 옵션
   */
  async initialize(
    config: FirebaseConfig, 
    options: FirebaseInitializationOptions = {}
  ): Promise<FirebaseInitializationResult> {
    
    // 이미 초기화된 경우 재초기화 방지
    if (this.status === FirebaseInitializationStatus.INITIALIZED) {
      return {
        success: true,
        app: this.app!,
        auth: this.auth!,
        message: 'Firebase가 이미 초기화되어 있습니다.'
      };
    }

    this.config = config;
    this.options = { 
      enableDebugLogging: true,
      enablePersistence: true,
      retryOnFailure: true,
      maxRetries: 3,
      ...options 
    };

    this.status = FirebaseInitializationStatus.INITIALIZING;
    this.emitEvent({
      type: 'initialization_started',
      timestamp: Date.now()
    });

    try {
      // Firebase App 초기화
      const appResult = await this.initializeFirebaseApp();
      if (!appResult.success) {
        return appResult;
      }

      // Firebase Auth 초기화
      const authResult = await this.initializeFirebaseAuth();
      if (!authResult.success) {
        return authResult;
      }

      this.status = FirebaseInitializationStatus.INITIALIZED;
      
      const result: FirebaseInitializationResult = {
        success: true,
        app: this.app!,
        auth: this.auth!,
        message: 'Firebase 초기화가 성공적으로 완료되었습니다.'
      };

      this.emitEvent({
        type: 'initialization_completed',
        timestamp: Date.now(),
        data: result
      });

      this.log('✅ Firebase 초기화 완료');
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      this.status = FirebaseInitializationStatus.FAILED;
      
      const result: FirebaseInitializationResult = {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        message: `Firebase 초기화 실패: ${errorMessage}`
      };

      this.emitEvent({
        type: 'initialization_failed',
        timestamp: Date.now(),
        error: result.error
      });

      this.error('❌ Firebase 초기화 실패:', error);
      return result;
    }
  }

  /**
   * Firebase App 초기화
   */
  private async initializeFirebaseApp(): Promise<FirebaseInitializationResult> {
    try {
      // 기존 앱이 있는지 확인 (중복 초기화 방지)
      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.app = existingApps[0] || null;
        this.log('🔄 기존 Firebase 앱 사용');
        return {
          success: true,
          app: this.app!,
          message: '기존 Firebase 앱을 사용합니다.'
        };
      }

      // 새 Firebase 앱 초기화
      this.app = initializeApp(this.config!);
      this.log('🔥 새 Firebase 앱 초기화 완료');
      
      return {
        success: true,
        app: this.app,
        message: 'Firebase 앱이 성공적으로 초기화되었습니다.'
      };

    } catch (error) {
      const errorMessage = `Firebase 앱 초기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        message: errorMessage
      };
    }
  }

  /**
   * Firebase Auth 초기화
   */
  private async initializeFirebaseAuth(): Promise<FirebaseInitializationResult> {
    try {
      if (!this.app) {
        throw new Error('Firebase 앱이 초기화되지 않았습니다.');
      }

      // 🔧 수정: 항상 persistence와 함께 새로 초기화
      if (this.options.enablePersistence) {
        // AsyncStorage persistence와 함께 새로 초기화
        this.auth = initializeAuth(this.app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
        this.log('🔐 AsyncStorage Persistence가 활성화된 Firebase Auth 초기화 완료');
      } else {
        // persistence 없이 초기화
        this.auth = initializeAuth(this.app);
        this.log('🔐 기본 Firebase Auth 초기화 완료 (persistence 비활성화)');
      }

      // Auth 상태 준비 대기
      await this.waitForAuthReady();

      this.emitEvent({
        type: 'auth_ready',
        timestamp: Date.now()
      });

      return {
        success: true,
        auth: this.auth,
        message: 'Firebase Auth가 성공적으로 초기화되었습니다.'
      };

    } catch (error) {
      const errorMessage = `Firebase Auth 초기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        message: errorMessage
      };
    }
  }

  /**
   * Auth 상태 준비 대기
   */
  private async waitForAuthReady(): Promise<void> {
    if (!this.auth) {
      throw new Error('Auth 인스턴스가 없습니다.');
    }

    try {
      await this.auth.authStateReady();
      this.log('🔐 Firebase Auth 상태 준비 완료');
    } catch (error) {
      this.error('⚠️ Auth 상태 준비 실패:', error);
      // Auth 상태 준비 실패는 치명적이지 않으므로 계속 진행
    }
  }

  /**
   * Firebase App 인스턴스 반환
   */
  getApp(): FirebaseApp | null {
    return this.app;
  }

  /**
   * Firebase Auth 인스턴스 반환
   */
  getAuth(): Auth | null {
    return this.auth;
  }

  /**
   * 현재 초기화 상태 반환
   */
  getStatus(): FirebaseInitializationStatus {
    return this.status;
  }

  /**
   * Firebase가 사용 준비되었는지 확인
   */
  isReady(): boolean {
    return this.status === FirebaseInitializationStatus.INITIALIZED && 
           this.app !== null && 
           this.auth !== null;
  }

  /**
   * 이벤트 리스너 등록
   */
  addListener(listener: FirebaseInitializationListener): void {
    this.listeners.push(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeListener(listener: FirebaseInitializationListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 이벤트 발생
   */
  private emitEvent(event: FirebaseInitializationEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.error('이벤트 리스너 실행 중 오류:', error);
      }
    });
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    this.listeners = [];
    this.app = null;
    this.auth = null;
    this.status = FirebaseInitializationStatus.NOT_INITIALIZED;
    this.log('🧹 Firebase 서비스 정리 완료');
  }

  /**
   * 디버그 로깅
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.enableDebugLogging) {
      console.log(`[FirebaseService] ${message}`, ...args);
    }
  }

  /**
   * 에러 로깅
   */
  private error(message: string, ...args: any[]): void {
    console.error(`[FirebaseService] ${message}`, ...args);
  }
}

// 싱글톤 인스턴스 생성 (전역에서 하나만 사용)
export const firebaseInitializationService = new FirebaseInitializationService();