/**
 * 스마트 인증 서비스 (메인 Facade)
 * Facade Pattern: 복잡한 인증 하위 시스템들을 간단한 인터페이스로 제공
 * Composition Pattern: 여러 서비스를 조합하여 완성된 인증 시스템 구성
 * Single Responsibility Principle (SRP): 인증 시스템 총괄 조정만 담당
 */

import { getAuth, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { 
  ISmartAuthService, 
  ITokenManager,
  IAuthRecoveryService,
  IUserProfileManager,
  AuthenticationStatus, 
  AppUser, 
  AuthEvent, 
  AuthEventListener,
  AuthServiceOptions 
} from './types';

/**
 * 스마트 인증 서비스 구현
 * 모든 인증 관련 서비스들을 조합하여 통합된 인증 경험 제공
 */
export class SmartAuthService implements ISmartAuthService {
  // 의존성 주입 (DIP)
  private tokenManager: ITokenManager;
  private recoveryService: IAuthRecoveryService;
  private profileManager: IUserProfileManager;
  
  // 상태 관리
  private status: AuthenticationStatus = AuthenticationStatus.UNINITIALIZED;
  private currentUser: AppUser | null = null;
  private firebaseUser: FirebaseUser | null = null;
  private listeners: AuthEventListener[] = [];
  private authUnsubscribe: (() => void) | null = null;
  
  // 설정
  private options: AuthServiceOptions;
  
  constructor(
    tokenManager: ITokenManager,
    recoveryService: IAuthRecoveryService,
    profileManager: IUserProfileManager,
    options: AuthServiceOptions = {}
  ) {
    this.tokenManager = tokenManager;
    this.recoveryService = recoveryService;
    this.profileManager = profileManager;
    this.options = {
      enableTokenAutoRefresh: true,
      tokenRefreshThresholdMinutes: 5,
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      enableSilentReauth: true,
      debugLogging: process.env.NODE_ENV === 'development',
      ...options
    };
  }

  /**
   * 인증 서비스 초기화
   * 🎯 핵심: 간단하고 명확한 onAuthStateChanged만 사용
   */
  async initialize(): Promise<void> {
    if (this.status !== AuthenticationStatus.UNINITIALIZED) {
      this.log('이미 초기화되었습니다.');
      return;
    }

    this.status = AuthenticationStatus.INITIALIZING;
    this.log('스마트 인증 서비스 초기화 시작');

    try {
      const auth = getAuth();
      
      // 🎯 핵심: 단순하고 명확한 onAuthStateChanged
      this.authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        this.log('Firebase Auth 상태 변화 감지:', {
          hasUser: !!firebaseUser,
          uid: firebaseUser?.uid,
          email: firebaseUser?.email,
          provider: firebaseUser?.providerData[0]?.providerId
        });

        await this.handleAuthStateChange(firebaseUser);
      });

      this.status = AuthenticationStatus.AUTHENTICATED; // onAuthStateChanged가 곧 호출될 예정
      this.log('스마트 인증 서비스 초기화 완료');

    } catch (error) {
      this.error('인증 서비스 초기화 실패:', error);
      this.status = AuthenticationStatus.ERROR;
      throw error;
    }
  }

  /**
   * Firebase Auth 상태 변화 처리 (핵심 로직)
   */
  private async handleAuthStateChange(firebaseUser: FirebaseUser | null): Promise<void> {
    try {
      if (firebaseUser) {
        // ✅ 로그인된 사용자 처리
        await this.handleAuthenticatedUser(firebaseUser);
      } else {
        // ❌ 로그아웃 처리
        await this.handleUnauthenticatedUser();
      }
    } catch (error) {
      this.error('Auth 상태 변화 처리 실패:', error);
      this.status = AuthenticationStatus.ERROR;
      this.emitEvent({
        type: 'auth_error',
        timestamp: Date.now(),
        error: error instanceof Error ? error : new Error('Auth state change failed')
      });
    }
  }

  /**
   * 인증된 사용자 처리
   */
  private async handleAuthenticatedUser(firebaseUser: FirebaseUser): Promise<void> {
    this.log('인증된 사용자 처리 시작:', firebaseUser.uid);
    
    try {
      // 1. 사용자 프로필 로드
      const user = await this.profileManager.loadUserProfile(firebaseUser);
      
      // 2. 상태 업데이트
      this.firebaseUser = firebaseUser;
      this.currentUser = user;
      this.status = AuthenticationStatus.AUTHENTICATED;
      
      // 3. 토큰 자동 갱신 시작 (옵션에 따라)
      if (this.options.enableTokenAutoRefresh) {
        this.tokenManager.startAutoRefresh(firebaseUser);
      }
      
      // 4. 복구 서비스 재시도 카운트 리셋
      this.recoveryService.resetRetryCount(user.provider);
      
      // 5. 인증 성공 이벤트 발생
      this.emitEvent({
        type: 'user_authenticated',
        timestamp: Date.now(),
        user: user,
        provider: user.provider
      });
      
      this.log('사용자 인증 처리 완료:', user.displayName);

    } catch (error) {
      this.error('인증된 사용자 처리 실패:', error);
      
      // 프로필 로드 실패 시 복구 시도
      if (this.options.enableSilentReauth && this.currentUser) {
        await this.attemptRecovery(this.currentUser);
      } else {
        throw error;
      }
    }
  }

  /**
   * 로그아웃 사용자 처리
   */
  private async handleUnauthenticatedUser(): Promise<void> {
    this.log('로그아웃 상태 처리');
    
    // 기존 사용자 정보로 복구 시도 (조건부)
    if (this.currentUser && this.options.enableSilentReauth) {
      this.log('기존 사용자 정보로 복구 시도:', this.currentUser.provider);
      
      const recoveryResult = await this.attemptRecovery(this.currentUser);
      if (recoveryResult) {
        return; // 복구 성공 시 여기서 종료
      }
    }
    
    // 복구 실패하거나 복구 비활성화 시 완전 로그아웃 처리
    await this.performFullLogout();
  }

  /**
   * 인증 복구 시도
   */
  private async attemptRecovery(user: AppUser): Promise<boolean> {
    if (!this.recoveryService.canAttemptRecovery(user)) {
      this.log('최대 복구 시도 횟수 초과:', user.provider);
      return false;
    }

    try {
      const result = await this.recoveryService.handleTokenExpiration(user);
      
      if (result.success) {
        this.log('인증 복구 성공:', user.provider);
        return true;
      } else if (result.requiresReauth) {
        this.log('재인증이 필요합니다:', user.provider);
        // 사용자에게 재인증 요청 (UI 컴포넌트에서 처리)
        this.emitEvent({
          type: 'auth_error',
          timestamp: Date.now(),
          error: new Error('재인증이 필요합니다'),
          user: user
        });
      }
      
      return false;

    } catch (error) {
      this.error('인증 복구 실패:', error);
      return false;
    }
  }

  /**
   * 완전 로그아웃 처리
   */
  private async performFullLogout(): Promise<void> {
    // 토큰 자동 갱신 중지
    this.tokenManager.stopAutoRefresh();
    
    // 상태 초기화
    const previousUser = this.currentUser;
    this.firebaseUser = null;
    this.currentUser = null;
    this.status = AuthenticationStatus.UNAUTHENTICATED;
    
    // 로그아웃 이벤트 발생
    this.emitEvent({
      type: 'user_unauthenticated',
      timestamp: Date.now(),
      user: previousUser || undefined
    });
    
    this.log('완전 로그아웃 처리 완료');
  }

  /**
   * 현재 인증 상태 반환
   */
  getAuthState(): { status: AuthenticationStatus; user: AppUser | null } {
    return {
      status: this.status,
      user: this.currentUser
    };
  }

  /**
   * 로그아웃 수행
   */
  async signOut(): Promise<void> {
    this.log('로그아웃 시작');
    
    try {
      const auth = getAuth();
      await signOut(auth);
      this.log('Firebase 로그아웃 완료');
      
      // onAuthStateChanged가 자동으로 호출되어 상태 정리됨
      
    } catch (error) {
      this.error('로그아웃 실패:', error);
      throw error;
    }
  }

  /**
   * 서비스 준비 상태 확인
   */
  isReady(): boolean {
    return this.status !== AuthenticationStatus.UNINITIALIZED && 
           this.status !== AuthenticationStatus.INITIALIZING;
  }

  /**
   * 인증 이벤트 리스너 추가
   */
  addAuthListener(listener: AuthEventListener): void {
    this.listeners.push(listener);
  }

  /**
   * 인증 이벤트 리스너 제거
   */
  removeAuthListener(listener: AuthEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 이벤트 발생
   */
  private emitEvent(event: AuthEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.error('이벤트 리스너 실행 실패:', error);
      }
    });
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    // Firebase Auth 리스너 해제
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
    
    // 토큰 자동 갱신 중지
    this.tokenManager.stopAutoRefresh();
    
    // 리스너 정리
    this.listeners = [];
    
    // 상태 초기화
    this.status = AuthenticationStatus.UNINITIALIZED;
    this.currentUser = null;
    this.firebaseUser = null;
    
    this.log('스마트 인증 서비스 정리 완료');
  }

  /**
   * 디버깅 로그
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.debugLogging) {
      console.log(`[SmartAuthService] ${message}`, ...args);
    }
  }

  /**
   * 에러 로그
   */
  private error(message: string, ...args: any[]): void {
    console.error(`[SmartAuthService] ${message}`, ...args);
  }
}

/**
 * 스마트 인증 서비스 팩토리 (Dependency Injection)
 */
export class SmartAuthServiceFactory {
  static create(options?: AuthServiceOptions): SmartAuthService {
    // 필요한 의존성들을 import하고 주입
    const { tokenManager } = require('./TokenManager');
    const { authRecoveryService } = require('./AuthRecoveryService');  
    const { userProfileManager } = require('./UserProfileManager');
    
    return new SmartAuthService(
      tokenManager,
      authRecoveryService, 
      userProfileManager,
      options
    );
  }
}

/**
 * 전역에서 사용할 스마트 인증 서비스 인스턴스 (싱글톤)
 */
export const smartAuthService = SmartAuthServiceFactory.create();