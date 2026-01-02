import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import Constants from 'expo-constants';
import firebaseService from './firebaseService';
import logger from './logService';
import devLog from '../utils/devLog';
import sentryLogger from '../utils/sentryLogger';
import authPersistenceService from './authPersistenceService';

interface GoogleLoginResult {
  success: boolean;
  user?: any;
  needsRegistration?: boolean;
  error?: string;
}

class GoogleLoginService {
  private isInitialized = false;

  /**
   * Google Sign-In 초기화 (재시도 로직 포함)
   */
  async initialize(retryCount: number = 0): Promise<void> {
    const MAX_RETRIES = 3;
    
    if (this.isInitialized) {
      return;
    }

    try {
      const webClientId = Constants.expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID;
      
      if (!webClientId || webClientId.includes('PLACEHOLDER')) {
        throw new Error('Google Web Client ID가 설정되지 않았습니다. Firebase Console에서 Web Client ID를 생성하고 app.json에 설정해주세요.');
      }

      // 잠시 대기 (모듈 로딩 시간 확보)
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
      
      GoogleSignin.configure({
        webClientId: webClientId,
        iosClientId: '91035459357-lc3tir17pmmomf793bnce1qmstns4rh7.apps.googleusercontent.com',
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['email', 'profile'],
      });

      this.isInitialized = true;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        return this.initialize(retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Google 로그인 실행 (재시도 로직 포함)
   */
  async login(retryCount: number = 0): Promise<GoogleLoginResult> {
    const MAX_RETRIES = 2;

    try {
      // 초기화 확인 및 재시도
      if (!this.isInitialized) {
        await this.initialize();
      }

      // iOS 16+ Safari popup 안정화를 위한 최소 대기
      const delayMs = retryCount === 0 ? 500 : 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Play Services 확인 (재시도 로직 포함)
      let hasPlayServices = false;
      for (let i = 0; i < 3; i++) {
        try {
          hasPlayServices = await GoogleSignin.hasPlayServices();
          break;
        } catch (error) {
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      if (!hasPlayServices) {
        throw new Error('Google Play Services를 사용할 수 없습니다.');
      }

      // 기존 로그인 상태 확인 및 정리 (재시도 시에만)
      if (retryCount > 0) {
        try {
          await GoogleSignin.signOut();
          // 세션 정리 후 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          // 무시하고 계속 진행
        }
      }

      // Google Sign-In 실행 (iOS 16+ 안정화)
      devLog.log('🚀 [DEBUG] Google Sign-In 시작...');
      
      const signInResult = await GoogleSignin.signIn();
      devLog.log('🔍 [DEBUG] Sign-In 결과:', signInResult);
      
      if (signInResult.type === 'cancelled') {
        throw new Error('Google 로그인이 취소되었습니다.');
      }

      const userInfo = signInResult.data;
      
      if (!userInfo.idToken) {
        throw new Error('Google ID Token을 받지 못했습니다.');
      }

      devLog.log('✅ Google Sign-In 성공:', userInfo.user.email);

      // 🔥 Custom Token 방식으로 변경: Cloud Functions로 Google ID Token 전송
      devLog.log('🔑 Cloud Functions에 Google ID Token 전송 중...');

      const response = await fetch('https://asia-northeast3-charzing-d1600.cloudfunctions.net/googleLoginHttp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleIdToken: userInfo.idToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Custom Token 생성 실패');
      }

      const { customToken, userInfo: serverUserInfo, isExistingUser } = await response.json();
      devLog.log('✅ Custom Token 받음:', { isExistingUser });

      // Custom Token으로 Firebase Auth 로그인
      devLog.log('🔑 Custom Token으로 Firebase Auth 로그인 중...');
      const auth = getAuth();
      const { user: firebaseUser } = await signInWithCustomToken(auth, customToken);
      devLog.log('✅ Firebase Auth 로그인 완료:', firebaseUser.uid);

      // 신규/기존 사용자 판별 (서버 응답 사용)
      const isNewUser = !isExistingUser;

      if (!isNewUser) {
        // 기존 사용자 - 로그인 시간만 업데이트
        devLog.log('✅ 기존 사용자 확인, UID:', firebaseUser.uid);
        try {
          await firebaseService.updateUserLastLogin(firebaseUser.uid);
        } catch (error) {
          devLog.log('⚠️ 로그인 시간 업데이트 실패 (무시):', error);
        }
      } else {
        // 신규 사용자 - SignupComplete 화면으로 이동 필요
        devLog.log('✅ 신규 사용자 확인:', firebaseUser.uid);
      }

      // 인증 상태를 AsyncStorage에 저장
      devLog.log('💾 인증 상태 AsyncStorage에 저장 중...');
      await authPersistenceService.saveAuthState(firebaseUser);

      devLog.log('✅ Google 로그인 및 Firebase Auth 세션 유지 완료');

      sentryLogger.logLoginSuccess(firebaseUser.uid, 'google');

      return {
        success: true,
        user: firebaseUser,
        needsRegistration: isNewUser,
      };

    } catch (error: any) {
      devLog.error(`❌ Google 로그인 실패 (시도 ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
      
      // 사용자 취소는 재시도하지 않음
      const isUserCancelled = 
        error.code === statusCodes.SIGN_IN_CANCELLED || 
        error.message?.includes('취소되었습니다') ||
        error.message?.includes('cancelled');

      // 재시도 가능한 에러 판단 (사용자 취소 제외)
      const isRetryableError = 
        !isUserCancelled &&
        error.code !== statusCodes.PLAY_SERVICES_NOT_AVAILABLE &&
        error.code !== statusCodes.IN_PROGRESS;

      // 사용자 취소의 경우 재시도하지 않고 바로 종료
      if (isUserCancelled) {
        devLog.log('👤 사용자가 Google 로그인을 취소했습니다.');
        // 사용자 취소는 에러가 아니므로 Sentry 로깅 안함
        return { success: false, error: '로그인이 취소되었습니다.' };
      }

      // 재시도 로직
      if (retryCount < MAX_RETRIES && isRetryableError) {
        devLog.log(`🔄 Google 로그인 재시도 (${retryCount + 1}/${MAX_RETRIES})`);
        return this.login(retryCount + 1);
      }

      // 최종 실패 로그
      sentryLogger.logLoginFailure('google', error instanceof Error ? error : new Error(error.message || '알 수 없는 오류'));

      // 에러 타입별 처리 (사용자 취소는 이미 위에서 처리됨)
      if (error.code === statusCodes.IN_PROGRESS) {
        return { success: false, error: '로그인이 진행 중입니다.' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { success: false, error: 'Google Play Services를 사용할 수 없습니다.' };
      } else {
        return { 
          success: false, 
          error: error.message || '알 수 없는 오류가 발생했습니다.' 
        };
      }
    }
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    try {
      const currentUser = GoogleSignin.getCurrentUser();
      if (currentUser) {
        await GoogleSignin.signOut();
        devLog.log('✅ Google 로그아웃 완료');
      }
    } catch (error) {
      devLog.error('❌ Google 로그아웃 실패:', error);
    }
  }
}

export default new GoogleLoginService();