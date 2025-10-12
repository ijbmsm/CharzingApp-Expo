/**
 * 토큰 관리 서비스
 * Single Responsibility Principle (SRP): 토큰 갱신과 관리만 담당
 * Open/Closed Principle (OCP): 새로운 토큰 갱신 전략 추가에 열려있음
 */

import { User as FirebaseUser } from 'firebase/auth';
import { ITokenManager, TokenRefreshResult } from './types';

/**
 * 토큰 관리 서비스 구현
 * 자동 토큰 갱신, 만료 감지, 갱신 스케줄링을 담당
 */
export class TokenManager implements ITokenManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private currentUser: FirebaseUser | null = null;
  private refreshThresholdMinutes: number;
  private checkIntervalMinutes: number;
  private isRefreshing = false;

  constructor(
    refreshThresholdMinutes: number = 5,
    checkIntervalMinutes: number = 1
  ) {
    this.refreshThresholdMinutes = refreshThresholdMinutes;
    this.checkIntervalMinutes = checkIntervalMinutes;
  }

  /**
   * 토큰 갱신 수행
   */
  async refreshToken(user: FirebaseUser): Promise<TokenRefreshResult> {
    if (this.isRefreshing) {
      this.log('토큰 갱신이 이미 진행 중입니다. 대기...');
      return { success: false, error: new Error('Token refresh already in progress') };
    }

    this.isRefreshing = true;
    this.log('토큰 갱신 시작');

    try {
      const startTime = Date.now();
      
      // 강제 토큰 갱신
      const newToken = await user.getIdToken(true);
      
      const endTime = Date.now();
      this.log(`토큰 갱신 완료 (${endTime - startTime}ms)`);

      // 새 토큰에서 만료 시간 추출
      const tokenData = this.parseJWT(newToken);
      const expiresAt = tokenData.exp * 1000;

      return {
        success: true,
        newToken,
        expiresAt
      };

    } catch (error) {
      this.error('토큰 갱신 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown token refresh error')
      };
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 토큰이 곧 만료되는지 확인
   */
  async isTokenExpiring(user: FirebaseUser): Promise<boolean> {
    try {
      // 현재 토큰 가져오기 (갱신하지 않고)
      const token = await user.getIdToken(false);
      const tokenData = this.parseJWT(token);
      
      const expirationTime = tokenData.exp * 1000;
      const thresholdTime = Date.now() + (this.refreshThresholdMinutes * 60 * 1000);
      
      const isExpiring = expirationTime < thresholdTime;
      
      if (isExpiring) {
        const minutesUntilExpiry = Math.round((expirationTime - Date.now()) / (60 * 1000));
        this.log(`토큰이 ${minutesUntilExpiry}분 후 만료됩니다.`);
      }

      return isExpiring;

    } catch (error) {
      this.error('토큰 만료 확인 실패:', error);
      return true; // 에러 시 만료된 것으로 간주하여 갱신 유도
    }
  }

  /**
   * 자동 토큰 갱신 시작
   */
  startAutoRefresh(user: FirebaseUser): void {
    this.currentUser = user;
    this.stopAutoRefresh(); // 기존 타이머 정리
    
    this.log('자동 토큰 갱신 시작');
    
    // 정기적으로 토큰 상태 확인
    this.refreshTimer = setInterval(async () => {
      if (!this.currentUser) {
        this.log('사용자가 없어 자동 갱신을 중단합니다.');
        this.stopAutoRefresh();
        return;
      }

      try {
        const isExpiring = await this.isTokenExpiring(this.currentUser);
        
        if (isExpiring) {
          this.log('토큰이 곧 만료됩니다. 자동 갱신을 시작합니다.');
          const result = await this.refreshToken(this.currentUser);
          
          if (result.success) {
            this.log('자동 토큰 갱신이 성공했습니다.');
          } else {
            this.error('자동 토큰 갱신이 실패했습니다:', result.error);
          }
        }

      } catch (error) {
        this.error('자동 토큰 갱신 체크 중 오류:', error);
      }
    }, this.checkIntervalMinutes * 60 * 1000);
  }

  /**
   * 자동 토큰 갱신 중지
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      this.log('자동 토큰 갱신이 중지되었습니다.');
    }
    this.currentUser = null;
  }

  /**
   * JWT 토큰 파싱
   */
  private parseJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('올바르지 않은 JWT 형식입니다.');
      }
      
      const base64Url = parts[1];
      if (!base64Url) {
        throw new Error('JWT payload가 없습니다.');
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error(`JWT 파싱 실패: ${error}`);
    }
  }

  /**
   * 디버그 로깅
   */
  private log(message: string, ...args: any[]): void {
    console.log(`[TokenManager] ${message}`, ...args);
  }

  /**
   * 에러 로깅
   */
  private error(message: string, ...args: any[]): void {
    console.error(`[TokenManager] ${message}`, ...args);
  }
}

/**
 * 향상된 토큰 관리자 (OCP - 확장을 위한 추상 클래스)
 */
export abstract class AdvancedTokenManager extends TokenManager {
  /**
   * 프로바이더별 토큰 갱신 전략 (확장 포인트)
   */
  protected abstract getProviderSpecificRefreshStrategy(provider: string): Promise<TokenRefreshResult>;
  
  /**
   * 토큰 갱신 실패 시 복구 전략 (확장 포인트)
   */
  protected abstract handleRefreshFailure(user: FirebaseUser, error: Error): Promise<TokenRefreshResult>;
}

/**
 * 기본 토큰 관리자 인스턴스 (싱글톤)
 */
export const tokenManager = new TokenManager();