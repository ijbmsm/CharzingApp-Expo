/**
 * 인증 시스템 타입 정의
 * Interface Segregation Principle (ISP)를 적용하여 각 책임별로 인터페이스 분리
 */

import { User as FirebaseUser } from 'firebase/auth';

/**
 * 앱 사용자 정보 인터페이스
 */
export interface AppUser {
  uid: string;
  email?: string;
  displayName?: string;
  realName?: string;
  photoURL?: string;
  kakaoId?: string;
  googleId?: string;
  appleId?: string;
  provider: 'kakao' | 'google' | 'apple';
}

/**
 * 인증 상태 열거형
 */
export enum AuthenticationStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error'
}

/**
 * 인증 이벤트 타입
 */
export interface AuthEvent {
  type: 'user_authenticated' | 'user_unauthenticated' | 'token_refreshed' | 'auth_error';
  timestamp: number;
  user?: AppUser;
  error?: Error;
  provider?: string;
}

/**
 * 인증 리스너 타입
 */
export type AuthEventListener = (event: AuthEvent) => void;

/**
 * 토큰 갱신 결과
 */
export interface TokenRefreshResult {
  success: boolean;
  error?: Error;
  newToken?: string;
  expiresAt?: number;
}

/**
 * 인증 복구 결과
 */
export interface AuthRecoveryResult {
  success: boolean;
  user?: AppUser;
  error?: Error;
  requiresReauth?: boolean;
}

/**
 * 인증 상태 관리 인터페이스 (ISP - 상태 관리만 담당)
 */
export interface IAuthStateManager {
  initialize(): Promise<void>;
  getStatus(): AuthenticationStatus;
  getCurrentUser(): AppUser | null;
  addListener(listener: AuthEventListener): void;
  removeListener(listener: AuthEventListener): void;
  cleanup(): void;
}

/**
 * 토큰 관리 인터페이스 (ISP - 토큰 관리만 담당)
 */
export interface ITokenManager {
  refreshToken(user: FirebaseUser): Promise<TokenRefreshResult>;
  isTokenExpiring(user: FirebaseUser): Promise<boolean>;
  startAutoRefresh(user: FirebaseUser): void;
  stopAutoRefresh(): void;
}

/**
 * 인증 복구 서비스 인터페이스 (ISP - 복구 로직만 담당)
 */
export interface IAuthRecoveryService {
  attemptSilentReauth(provider: string): Promise<AuthRecoveryResult>;
  handleTokenExpiration(user: AppUser): Promise<AuthRecoveryResult>;
  canAttemptRecovery(user: AppUser): boolean;
  resetRetryCount(provider: string): void;
}

/**
 * 사용자 프로필 관리 인터페이스 (ISP - 프로필 관리만 담당)
 */
export interface IUserProfileManager {
  loadUserProfile(firebaseUser: FirebaseUser): Promise<AppUser>;
  createDefaultProfile(firebaseUser: FirebaseUser, provider: string): Promise<AppUser>;
  syncProfile(user: AppUser): Promise<void>;
}

/**
 * 스마트 인증 서비스 메인 인터페이스 (DIP - 추상화에 의존)
 */
export interface ISmartAuthService {
  initialize(): Promise<void>;
  getAuthState(): { status: AuthenticationStatus; user: AppUser | null };
  addAuthListener(listener: AuthEventListener): void;
  removeAuthListener(listener: AuthEventListener): void;
  signOut(): Promise<void>;
  isReady(): boolean;
}

/**
 * 인증 설정 옵션
 */
export interface AuthServiceOptions {
  enableTokenAutoRefresh?: boolean;
  tokenRefreshThresholdMinutes?: number;
  maxRetryAttempts?: number;
  retryDelayMs?: number;
  enableSilentReauth?: boolean;
  debugLogging?: boolean;
}

// === 로그인 서비스 인터페이스 (ISP 적용) ===

/**
 * 로그인 결과 공통 인터페이스
 */
export interface LoginResult {
  success: boolean;
  user?: FirebaseUser;
  error?: string;
  needsRegistration?: boolean;
}

/**
 * 로그인 서비스 공통 인터페이스
 * Single Responsibility Principle (SRP): 로그인만 담당
 */
export interface ILoginService {
  /**
   * 로그인 서비스 초기화
   */
  initialize?(): Promise<void>;

  /**
   * 로그인 실행
   */
  login(): Promise<LoginResult>;

  /**
   * 로그아웃 실행 (선택사항)
   */
  logout?(): Promise<void>;

  /**
   * 서비스 사용 가능 여부 확인 (선택사항)
   */
  isAvailable?(): Promise<boolean>;
}

/**
 * 소셜 로그인 사용자 정보 생성 인터페이스
 */
export interface ISocialUserFactory {
  createUser(firebaseUser: FirebaseUser, socialData: any): AppUser;
}

/**
 * 로그인 공급자 타입
 */
export type LoginProvider = 'kakao' | 'google' | 'apple';

/**
 * 로그인 이벤트 타입
 */
export interface LoginEvent {
  provider: LoginProvider;
  success: boolean;
  user?: AppUser;
  error?: string;
  timestamp: number;
}

/**
 * 카카오 로그인 관련 타입
 */
export interface KakaoLoginData {
  id: string;
  email?: string;
  nickname?: string;
  profile_image_url?: string;
}

/**
 * 로그인 팩토리 인터페이스 (Factory Pattern)
 * Open/Closed Principle (OCP): 새로운 로그인 서비스 추가에 열려있음
 */
export interface ILoginServiceFactory {
  createLoginService(provider: LoginProvider): ILoginService;
  getSupportedProviders(): LoginProvider[];
}