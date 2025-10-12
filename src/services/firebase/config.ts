/**
 * Firebase 설정 및 편의 기능을 제공하는 Facade
 * Open/Closed Principle (OCP): 새로운 설정 추가에 열려있음
 * Single Responsibility Principle (SRP): Firebase 설정 관리만 담당
 */

import { FirebaseConfig, FirebaseInitializationOptions } from './types';
import { firebaseInitializationService } from './FirebaseInitializationService';

/**
 * Firebase 설정 정보
 * 환경에 따라 다른 설정을 사용할 수 있도록 확장 가능
 */
export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyCa5WLhZwAowvna4vrLbweOtW8w8oEoS88",
  authDomain: "charzing-d1600.firebaseapp.com",
  projectId: "charzing-d1600",
  storageBucket: "charzing-d1600.firebasestorage.app",
  messagingSenderId: "91035459357",
  appId: "1:91035459357:android:a146043ea80a3d5d48cbf4"
};

/**
 * 기본 Firebase 초기화 옵션
 * 프로덕션/개발 환경에 따라 다른 설정 적용 가능
 */
export const DEFAULT_FIREBASE_OPTIONS: FirebaseInitializationOptions = {
  enableDebugLogging: process.env.NODE_ENV === 'development', // 개발 환경에서만 디버그 로깅
  enablePersistence: true,      // React Native Persistence 활성화
  retryOnFailure: true,         // 실패 시 재시도
  maxRetries: 3                 // 최대 3회 재시도
};

/**
 * Firebase 초기화 Facade
 * 복잡한 초기화 로직을 간단한 인터페이스로 제공
 */
export class FirebaseFacade {
  private static instance: FirebaseFacade;
  private isInitialized = false;

  private constructor() {}

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): FirebaseFacade {
    if (!FirebaseFacade.instance) {
      FirebaseFacade.instance = new FirebaseFacade();
    }
    return FirebaseFacade.instance;
  }

  /**
   * Firebase 초기화 (간편 메서드)
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('🔄 Firebase가 이미 초기화되어 있습니다.');
      return true;
    }

    try {
      console.log('🚀 Firebase 초기화 시작...');
      
      const result = await firebaseInitializationService.initialize(
        FIREBASE_CONFIG,
        DEFAULT_FIREBASE_OPTIONS
      );

      if (result.success) {
        this.isInitialized = true;
        console.log('✅ Firebase 초기화 성공');
        return true;
      } else {
        console.error('❌ Firebase 초기화 실패:', result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Firebase 초기화 중 예외 발생:', error);
      return false;
    }
  }

  /**
   * Firebase 준비 상태 확인
   */
  isReady(): boolean {
    return this.isInitialized && firebaseInitializationService.isReady();
  }

  /**
   * Firebase App 인스턴스 반환
   */
  getApp() {
    return firebaseInitializationService.getApp();
  }

  /**
   * Firebase Auth 인스턴스 반환
   */
  getAuth() {
    return firebaseInitializationService.getAuth();
  }

  /**
   * 초기화 상태 반환
   */
  getStatus() {
    return firebaseInitializationService.getStatus();
  }

  /**
   * 사용자 정의 설정으로 초기화
   * @param config 사용자 정의 Firebase 설정
   * @param options 사용자 정의 옵션
   */
  async initializeWithCustomConfig(
    config: FirebaseConfig, 
    options?: FirebaseInitializationOptions
  ): Promise<boolean> {
    try {
      const result = await firebaseInitializationService.initialize(
        config,
        { ...DEFAULT_FIREBASE_OPTIONS, ...options }
      );

      if (result.success) {
        this.isInitialized = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ 사용자 정의 설정으로 Firebase 초기화 실패:', error);
      return false;
    }
  }
}

// 전역에서 사용할 수 있는 인스턴스
export const firebaseFacade = FirebaseFacade.getInstance();