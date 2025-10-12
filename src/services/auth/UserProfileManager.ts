/**
 * 사용자 프로필 관리 서비스
 * Single Responsibility Principle (SRP): 사용자 프로필 로드/생성/동기화만 담당
 * Don't Repeat Yourself (DRY): 중복된 프로필 생성 로직 통합
 */

import { User as FirebaseUser } from 'firebase/auth';
import { IUserProfileManager, AppUser } from './types';
import firebaseService from '../firebaseService';

/**
 * 사용자 프로필 관리 서비스 구현
 * Firebase 사용자와 Firestore 프로필 간의 매핑을 담당
 */
export class UserProfileManager implements IUserProfileManager {
  
  /**
   * Firebase 사용자로부터 앱 사용자 프로필 로드
   */
  async loadUserProfile(firebaseUser: FirebaseUser): Promise<AppUser> {
    this.log('사용자 프로필 로드 시작:', firebaseUser.uid);

    try {
      // Firestore에서 사용자 문서 조회
      const userDoc = await firebaseService.getUserProfile(firebaseUser.uid);
      
      if (userDoc) {
        this.log('Firestore에서 기존 프로필을 찾았습니다.');
        return this.mapFirestoreToAppUser(firebaseUser, userDoc);
      } else {
        this.log('Firestore에 프로필이 없습니다. 새 프로필을 생성합니다.');
        return await this.createDefaultProfile(firebaseUser, this.getProviderFromFirebaseUser(firebaseUser));
      }

    } catch (error) {
      this.error('프로필 로드 실패, 기본 프로필로 폴백:', error);
      return this.createFallbackProfile(firebaseUser);
    }
  }

  /**
   * 기본 사용자 프로필 생성
   */
  async createDefaultProfile(firebaseUser: FirebaseUser, provider: string): Promise<AppUser> {
    this.log(`${provider} 사용자 기본 프로필 생성 시작`);

    try {
      const defaultProfile = this.buildDefaultProfileData(firebaseUser, provider);
      
      // Firestore에 프로필 저장
      await firebaseService.saveUserProfile({
        uid: firebaseUser.uid,
        email: defaultProfile.email || '',
        displayName: defaultProfile.displayName,
        realName: defaultProfile.displayName, // 초기값은 displayName과 동일
        provider: provider as any,
        photoURL: defaultProfile.photoURL || '',
        isRegistrationComplete: false,
        // 프로바이더별 ID 설정
        ...(provider === 'apple' && { appleId: firebaseUser.uid }),
        ...(provider === 'google' && { googleId: firebaseUser.uid }),
        ...(provider === 'kakao' && { kakaoId: firebaseUser.uid }),
      });

      this.log(`${provider} 사용자 프로필이 Firestore에 저장되었습니다.`);
      return defaultProfile;

    } catch (error) {
      this.error('기본 프로필 생성 실패:', error);
      throw new Error(`프로필 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 사용자 프로필 동기화
   */
  async syncProfile(user: AppUser): Promise<void> {
    this.log('사용자 프로필 동기화 시작:', user.uid);

    try {
      await firebaseService.saveUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        realName: user.realName || user.displayName || '',
        provider: user.provider,
        photoURL: user.photoURL || '',
        isRegistrationComplete: true,
        kakaoId: user.kakaoId,
        googleId: user.googleId,
        appleId: user.appleId,
      });

      this.log('사용자 프로필 동기화 완료');

    } catch (error) {
      this.error('프로필 동기화 실패:', error);
      throw new Error(`프로필 동기화 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Firestore 문서를 AppUser로 매핑
   */
  private mapFirestoreToAppUser(firebaseUser: FirebaseUser, userDoc: any): AppUser {
    const provider = this.getProviderFromFirebaseUser(firebaseUser);
    
    return {
      uid: firebaseUser.uid,
      email: userDoc.email || firebaseUser.email || undefined,
      displayName: userDoc.displayName || this.getDefaultDisplayName(provider, firebaseUser.email),
      realName: userDoc.realName || undefined,
      photoURL: userDoc.photoURL || firebaseUser.photoURL || undefined,
      provider: provider,
      kakaoId: provider === 'kakao' ? userDoc.kakaoId : undefined,
      googleId: provider === 'google' ? userDoc.googleId : undefined,
      appleId: provider === 'apple' ? userDoc.appleId : undefined,
    };
  }

  /**
   * 기본 프로필 데이터 구성
   */
  private buildDefaultProfileData(firebaseUser: FirebaseUser, provider: string): AppUser {
    const defaultDisplayName = this.getDefaultDisplayName(provider, firebaseUser.email);
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || undefined,
      displayName: defaultDisplayName,
      realName: defaultDisplayName,
      photoURL: firebaseUser.photoURL || undefined,
      provider: provider as any,
      // 프로바이더별 ID는 생성 시점에서 설정
      ...(provider === 'kakao' && { kakaoId: firebaseUser.uid }),
      ...(provider === 'google' && { googleId: firebaseUser.uid }),
      ...(provider === 'apple' && { appleId: firebaseUser.uid }),
    };
  }

  /**
   * 폴백 프로필 생성 (Firestore 실패 시)
   */
  private createFallbackProfile(firebaseUser: FirebaseUser): AppUser {
    const provider = this.getProviderFromFirebaseUser(firebaseUser);
    
    this.log('폴백 프로필 생성:', provider);
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || undefined,
      displayName: this.getDefaultDisplayName(provider, firebaseUser.email),
      realName: this.getDefaultDisplayName(provider, firebaseUser.email),
      photoURL: firebaseUser.photoURL || undefined,
      provider: provider,
    };
  }

  /**
   * Firebase 사용자에서 프로바이더 추출
   */
  private getProviderFromFirebaseUser(firebaseUser: FirebaseUser): 'apple' | 'google' | 'kakao' {
    const providerId = firebaseUser.providerData[0]?.providerId;
    
    if (providerId === 'apple.com') return 'apple';
    if (providerId === 'google.com') return 'google';
    return 'kakao'; // 기본값
  }

  /**
   * 프로바이더별 기본 displayName 생성 (DRY 원칙)
   */
  private getDefaultDisplayName(provider: string, email?: string | null): string {
    // 이메일이 있으면 @ 앞부분 사용
    if (email) {
      const emailPrefix = email.split('@')[0];
      if (emailPrefix && emailPrefix.length > 0) {
        return emailPrefix;
      }
    }
    
    // 이메일이 없거나 파싱 실패 시 프로바이더별 기본값
    switch (provider) {
      case 'apple':
        return 'Apple 사용자';
      case 'google':
        return 'Google 사용자';
      case 'kakao':
        return '카카오 사용자';
      default:
        return '사용자';
    }
  }

  /**
   * 프로필 유효성 검증
   */
  validateProfile(user: AppUser): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!user.uid) {
      errors.push('사용자 ID가 필요합니다.');
    }

    if (!user.provider) {
      errors.push('로그인 프로바이더 정보가 필요합니다.');
    }

    if (!user.displayName || user.displayName.trim().length === 0) {
      errors.push('표시 이름이 필요합니다.');
    }

    // 프로바이더별 특정 검증
    if (user.provider === 'apple' && !user.appleId) {
      errors.push('Apple 사용자는 Apple ID가 필요합니다.');
    }

    if (user.provider === 'google' && !user.googleId && !user.email) {
      errors.push('Google 사용자는 Google ID 또는 이메일이 필요합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 디버깅 로그
   */
  private log(message: string, ...args: any[]): void {
    console.log(`[UserProfileManager] ${message}`, ...args);
  }

  /**
   * 에러 로그
   */
  private error(message: string, ...args: any[]): void {
    console.error(`[UserProfileManager] ${message}`, ...args);
  }
}

/**
 * 기본 사용자 프로필 관리자 인스턴스 (싱글톤)
 */
export const userProfileManager = new UserProfileManager();