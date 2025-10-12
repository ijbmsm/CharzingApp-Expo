/**
 * Firebase 초기화 및 관리를 위한 타입 정의
 * SOLID 원칙의 Interface Segregation Principle (ISP)를 적용하여
 * 각각의 책임을 명확히 분리
 */

import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';

/**
 * Firebase 설정 타입
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Firebase 초기화 결과
 */
export interface FirebaseInitializationResult {
  success: boolean;
  app?: FirebaseApp;
  auth?: Auth;
  error?: Error;
  message: string;
}

/**
 * Firebase 초기화 상태
 */
export enum FirebaseInitializationStatus {
  NOT_INITIALIZED = 'not_initialized',
  INITIALIZING = 'initializing', 
  INITIALIZED = 'initialized',
  FAILED = 'failed'
}

/**
 * Firebase 초기화 옵션
 */
export interface FirebaseInitializationOptions {
  enableDebugLogging?: boolean;
  enablePersistence?: boolean;
  persistenceKey?: string;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

/**
 * Firebase 서비스 인터페이스 (DIP - 추상화에 의존)
 */
export interface IFirebaseService {
  initialize(config: FirebaseConfig, options?: FirebaseInitializationOptions): Promise<FirebaseInitializationResult>;
  getApp(): FirebaseApp | null;
  getAuth(): Auth | null;
  getStatus(): FirebaseInitializationStatus;
  isReady(): boolean;
  cleanup(): void;
}

/**
 * Firebase 초기화 이벤트
 */
export interface FirebaseInitializationEvent {
  type: 'initialization_started' | 'initialization_completed' | 'initialization_failed' | 'auth_ready';
  timestamp: number;
  data?: any;
  error?: Error;
}

/**
 * Firebase 초기화 리스너
 */
export type FirebaseInitializationListener = (event: FirebaseInitializationEvent) => void;