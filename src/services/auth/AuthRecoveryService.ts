/**
 * 인증 복구 서비스
 * Single Responsibility Principle (SRP): 인증 복구 로직만 담당
 * 토큰 만료, 세션 복구, 조용한 재인증 등을 처리
 */

import { signInWithCustomToken, getAuth } from 'firebase/auth';
import { IAuthRecoveryService, AuthRecoveryResult, AppUser } from './types';

/**
 * 인증 복구 서비스 구현
 * 프로바이더별 토큰 만료 및 재인증 처리를 담당
 */
export class AuthRecoveryService implements IAuthRecoveryService {
  private retryAttempts: Map<string, number> = new Map();
  private maxRetryAttempts: number;
  private retryDelayMs: number;

  constructor(maxRetryAttempts: number = 3, retryDelayMs: number = 1000) {
    this.maxRetryAttempts = maxRetryAttempts;
    this.retryDelayMs = retryDelayMs;
  }

  /**
   * 조용한 재인증 시도
   */
  async attemptSilentReauth(provider: string): Promise<AuthRecoveryResult> {
    this.log(`${provider} 조용한 재인증 시도`);

    try {
      // 프로바이더별 재인증 전략
      switch (provider) {
        case 'apple':
          return await this.handleAppleReauth();
        case 'google':
          return await this.handleGoogleReauth();
        case 'kakao':
          return await this.handleKakaoReauth();
        default:
          throw new Error(`지원하지 않는 프로바이더: ${provider}`);
      }

    } catch (error) {
      this.error(`${provider} 조용한 재인증 실패:`, error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown reauth error'),
        requiresReauth: true
      };
    }
  }

  /**
   * 토큰 만료 처리
   */
  async handleTokenExpiration(user: AppUser): Promise<AuthRecoveryResult> {
    this.log(`토큰 만료 처리 시작:`, user.provider);

    if (!this.canAttemptRecovery(user)) {
      this.log(`최대 재시도 횟수 초과: ${user.provider}`);
      return {
        success: false,
        error: new Error('최대 재시도 횟수를 초과했습니다'),
        requiresReauth: true
      };
    }

    // 재시도 횟수 증가
    const currentAttempts = this.retryAttempts.get(user.provider) || 0;
    this.retryAttempts.set(user.provider, currentAttempts + 1);

    // 지연 후 재시도 (지수 백오프)
    const delay = this.retryDelayMs * Math.pow(2, currentAttempts);
    await this.sleep(delay);

    return await this.attemptSilentReauth(user.provider);
  }

  /**
   * 복구 가능 여부 확인
   */
  canAttemptRecovery(user: AppUser): boolean {
    const attempts = this.retryAttempts.get(user.provider) || 0;
    return attempts < this.maxRetryAttempts;
  }

  /**
   * 재시도 카운트 리셋
   */
  resetRetryCount(provider: string): void {
    this.retryAttempts.delete(provider);
    this.log(`${provider} 재시도 카운트 리셋`);
  }

  /**
   * Apple 재인증 처리
   */
  private async handleAppleReauth(): Promise<AuthRecoveryResult> {
    this.log('Apple 재인증 시도');
    
    // Apple은 조용한 재인증이 제한적이므로 대부분 사용자 재인증 필요
    return {
      success: false,
      requiresReauth: true,
      error: new Error('Apple 재인증이 필요합니다')
    };
  }

  /**
   * Google 재인증 처리
   */
  private async handleGoogleReauth(): Promise<AuthRecoveryResult> {
    this.log('Google 재인증 시도');
    
    try {
      // Google의 경우 토큰 새로고침 시도
      // 실제 구현에서는 Google Sign-In SDK를 사용해야 함
      this.log('Google 토큰 새로고침 시도');
      
      // 현재는 재인증 요구로 처리
      return {
        success: false,
        requiresReauth: true,
        error: new Error('Google 재인증이 필요합니다')
      };

    } catch (error) {
      this.error('Google 재인증 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Google reauth failed'),
        requiresReauth: true
      };
    }
  }

  /**
   * Kakao 재인증 처리
   */
  private async handleKakaoReauth(): Promise<AuthRecoveryResult> {
    this.log('Kakao 재인증 시도');
    
    try {
      // Kakao의 경우 토큰 새로고침 시도
      // 실제 구현에서는 Kakao SDK를 사용해야 함
      this.log('Kakao 토큰 새로고침 시도');
      
      // 현재는 재인증 요구로 처리
      return {
        success: false,
        requiresReauth: true,
        error: new Error('카카오 재인증이 필요합니다')
      };

    } catch (error) {
      this.error('Kakao 재인증 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Kakao reauth failed'),
        requiresReauth: true
      };
    }
  }

  /**
   * Firebase Custom Token으로 재인증 시도 (고급 기능)
   */
  private async attemptCustomTokenReauth(customToken: string): Promise<AuthRecoveryResult> {
    try {
      const auth = getAuth();
      const credential = await signInWithCustomToken(auth, customToken);
      
      this.log('Custom Token 재인증 성공');
      
      // 사용자 정보를 AppUser 형식으로 변환
      const user: AppUser = {
        uid: credential.user.uid,
        email: credential.user.email || undefined,
        displayName: credential.user.displayName || undefined,
        photoURL: credential.user.photoURL || undefined,
        provider: this.getProviderFromFirebaseUser(credential.user) || 'kakao'
      };

      return {
        success: true,
        user: user
      };

    } catch (error) {
      this.error('Custom Token 재인증 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Custom token reauth failed'),
        requiresReauth: true
      };
    }
  }

  /**
   * Firebase 사용자에서 프로바이더 추출
   */
  private getProviderFromFirebaseUser(firebaseUser: any): 'apple' | 'google' | 'kakao' | null {
    const providerId = firebaseUser.providerData[0]?.providerId;
    
    if (providerId === 'apple.com') return 'apple';
    if (providerId === 'google.com') return 'google';
    if (providerId?.includes('kakao')) return 'kakao';
    
    return null;
  }

  /**
   * 지연 함수
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 디버깅 로그
   */
  private log(message: string, ...args: any[]): void {
    console.log(`[AuthRecoveryService] ${message}`, ...args);
  }

  /**
   * 에러 로그
   */
  private error(message: string, ...args: any[]): void {
    console.error(`[AuthRecoveryService] ${message}`, ...args);
  }
}

/**
 * 기본 인증 복구 서비스 인스턴스 (싱글톤)
 */
export const authRecoveryService = new AuthRecoveryService();