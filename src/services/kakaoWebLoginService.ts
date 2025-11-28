/**
 * 카카오 웹 기반 로그인 서비스 (Fallback for Native SDK)
 * Single Responsibility Principle (SRP): 웹 기반 카카오 로그인만 담당
 * Interface Segregation Principle (ISP): ILoginService 구현
 * Strategy Pattern: 네이티브 SDK 실패 시 자동 폴백
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import Constants from 'expo-constants';
import firebaseService from './firebaseService';
import logger from './logService';
import devLog from '../utils/devLog';
import sentryLogger from '../utils/sentryLogger';
import { 
  ILoginService, 
  LoginResult, 
  ISocialUserFactory,
  AppUser
} from './auth/types';

/**
 * 카카오 웹 API 사용자 응답 타입
 */
interface KakaoWebProfile {
  id: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
    };
  };
}

/**
 * 카카오 웹 사용자 팩토리
 */
class KakaoWebUserFactory implements ISocialUserFactory {
  createUser(firebaseUser: any, kakaoProfile: KakaoWebProfile): AppUser {
    const kakaoId = kakaoProfile.id.toString();
    const email = kakaoProfile.kakao_account?.email;
    const displayName = kakaoProfile.kakao_account?.profile?.nickname || 
                       kakaoProfile.properties?.nickname || '카카오 사용자';
    const photoURL = kakaoProfile.kakao_account?.profile?.profile_image_url || 
                    kakaoProfile.properties?.profile_image;

    return {
      uid: firebaseUser.uid,
      email,
      displayName,
      photoURL,
      kakaoId,
      provider: 'kakao'
    };
  }
}

/**
 * 카카오 웹 기반 로그인 서비스 (네이티브 SDK 폴백)
 */
class KakaoWebLoginService implements ILoginService {
  private userFactory: ISocialUserFactory;
  private isInitialized = false;
  private kakaoRestApiKey: string;
  private kakaoClientSecret: string;

  constructor() {
    this.userFactory = new KakaoWebUserFactory();
    
    // 환경 변수에서 키 로드
    const config = Constants.expoConfig?.extra;
    this.kakaoRestApiKey = config?.KAKAO_REST_API_KEY || '';
    this.kakaoClientSecret = config?.KAKAO_CLIENT_SECRET || '';
    
    devLog.log('🔧 카카오 웹 기반 로그인 서비스 초기화');
  }

  /**
   * 웹 기반 카카오 로그인 서비스 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      if (!this.kakaoRestApiKey) {
        throw new Error('KAKAO_REST_API_KEY가 설정되지 않았습니다');
      }
      if (!this.kakaoClientSecret) {
        throw new Error('KAKAO_CLIENT_SECRET이 설정되지 않았습니다');
      }

      devLog.log('✅ 카카오 웹 기반 로그인 서비스 초기화 완료');
      this.isInitialized = true;
    } catch (error) {
      devLog.error('❌ 카카오 웹 기반 로그인 서비스 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 웹 기반 카카오 로그인 사용 가능 여부 확인
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return !!(this.kakaoRestApiKey && this.kakaoClientSecret);
    } catch (error) {
      devLog.error('❌ 카카오 웹 로그인 가용성 체크 실패:', error);
      return false;
    }
  }

  /**
   * 카카오 웹 기반 로그인 실행
   */
  async login(): Promise<LoginResult> {
    try {
      devLog.log('🌐🌐🌐 [FALLBACK] 카카오 웹 기반 로그인 시작 (네이티브 SDK 아님!)');

      // 초기화 확인
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!(await this.isAvailable())) {
        throw new Error('카카오 웹 로그인 서비스를 사용할 수 없습니다.');
      }

      // 1. OAuth 2.0 Authorization Code 요청
      const authCode = await this.requestAuthorizationCode();
      devLog.log('✅ 카카오 인증 코드 획득 성공');

      // 2. Access Token 요청
      const accessToken = await this.exchangeCodeForToken(authCode);
      devLog.log('✅ 카카오 액세스 토큰 획득 성공');

      // 3. 사용자 프로필 조회
      const kakaoProfile = await this.fetchUserProfile(accessToken);
      devLog.log('✅ 카카오 프로필 조회 성공:', kakaoProfile);

      // 4. Firebase 커스텀 토큰 생성 및 로그인
      const firebaseResult = await this.loginWithFirebase(kakaoProfile);

      if (firebaseResult.success && firebaseResult.user) {
        // 5. 사용자 문서 생성/업데이트
        const appUser = this.userFactory.createUser(firebaseResult.user, kakaoProfile);
        await this.syncUserDocument(appUser, kakaoProfile);

        sentryLogger.logLoginSuccess(firebaseResult.user.uid, 'kakao');
        devLog.log('✅ 카카오 웹 기반 로그인 성공:', appUser.displayName);

        return {
          success: true,
          user: firebaseResult.user,
          needsRegistration: firebaseResult.needsRegistration
        };
      } else {
        throw new Error(firebaseResult.error || 'Firebase 로그인 실패');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      devLog.error('❌ 카카오 웹 기반 로그인 실패:', error);
      sentryLogger.logLoginFailure('kakao', error instanceof Error ? error : new Error(errorMessage));

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * OAuth 2.0 Authorization Code 요청
   */
  private async requestAuthorizationCode(): Promise<string> {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'charzingapp',
      preferLocalhost: Platform.OS === 'web'
    });

    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${this.kakaoRestApiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile_nickname,account_email`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== 'success' || !result.url) {
      throw new Error('카카오 인증이 취소되었습니다');
    }

    // URL에서 code 파라미터 추출
    const url = new URL(result.url);
    const authCode = url.searchParams.get('code');

    if (!authCode) {
      throw new Error('카카오 인증 코드를 받을 수 없습니다');
    }

    return authCode;
  }

  /**
   * Authorization Code를 Access Token으로 교환
   */
  private async exchangeCodeForToken(authCode: string): Promise<string> {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'charzingapp',
      preferLocalhost: Platform.OS === 'web'
    });

    const response = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.kakaoRestApiKey,
        client_secret: this.kakaoClientSecret,
        redirect_uri: redirectUri,
        code: authCode,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error_description || '액세스 토큰 요청 실패');
    }

    return data.access_token;
  }

  /**
   * Access Token으로 사용자 프로필 조회
   */
  private async fetchUserProfile(accessToken: string): Promise<KakaoWebProfile> {
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || '사용자 프로필 조회 실패');
    }

    return data;
  }

  /**
   * Firebase 커스텀 토큰으로 로그인
   */
  private async loginWithFirebase(kakaoProfile: KakaoWebProfile): Promise<LoginResult> {
    try {
      // Firebase Functions를 통해 커스텀 토큰 생성
      const customToken = await this.getFirebaseCustomToken(kakaoProfile);
      
      // Firebase Auth로 로그인
      const auth = getAuth();
      const userCredential = await signInWithCustomToken(auth, customToken);

      // 신규 사용자 여부 확인
      const isNewUser = await this.checkIfNewUser(userCredential.user.uid);

      return {
        success: true,
        user: userCredential.user,
        needsRegistration: isNewUser
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Firebase 로그인 실패'
      };
    }
  }

  /**
   * Firebase Functions를 통해 커스텀 토큰 생성
   */
  private async getFirebaseCustomToken(kakaoProfile: KakaoWebProfile): Promise<string> {
    const response = await firebaseService.callCloudFunction('createKakaoCustomToken', {
      kakaoId: kakaoProfile.id.toString(),
      email: kakaoProfile.kakao_account?.email,
      displayName: kakaoProfile.kakao_account?.profile?.nickname ||
                  kakaoProfile.properties?.nickname || '카카오 사용자',
      photoURL: kakaoProfile.kakao_account?.profile?.profile_image_url ||
               kakaoProfile.properties?.profile_image
    }) as { success: boolean; customToken?: string; message?: string };

    if (!response.success || !response.customToken) {
      throw new Error(response.message || '커스텀 토큰 생성 실패');
    }

    return response.customToken;
  }

  /**
   * 신규 사용자 여부 확인
   */
  private async checkIfNewUser(uid: string): Promise<boolean> {
    try {
      const userProfile = await firebaseService.getUserProfile(uid);
      return !userProfile;
    } catch (error) {
      // 프로필이 없으면 신규 사용자로 간주
      return true;
    }
  }

  /**
   * 사용자 문서 동기화
   */
  private async syncUserDocument(appUser: AppUser, kakaoProfile: KakaoWebProfile): Promise<void> {
    try {
      await firebaseService.upsertUserDocument(appUser.uid, {
        email: appUser.email,
        displayName: appUser.displayName,
        photoURL: appUser.photoURL,
        provider: 'kakao',
        kakaoId: appUser.kakaoId
      });

      devLog.log('✅ 카카오 사용자 문서 동기화 완료:', appUser.uid);
    } catch (error) {
      devLog.error('❌ 카카오 사용자 문서 동기화 실패:', error);
      // 문서 동기화 실패는 치명적이지 않으므로 로그만 남김
    }
  }

  /**
   * 카카오 로그아웃 (웹 기반)
   */
  async logout(): Promise<void> {
    try {
      devLog.log('🔓 카카오 웹 기반 로그아웃 시작');
      
      // Firebase 로그아웃
      const auth = getAuth();
      await auth.signOut();
      
      devLog.log('✅ 카카오 웹 기반 로그아웃 완료');
    } catch (error) {
      devLog.error('❌ 카카오 웹 기반 로그아웃 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const kakaoWebLoginService = new KakaoWebLoginService();
export default kakaoWebLoginService;