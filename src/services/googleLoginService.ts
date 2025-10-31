import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import Constants from 'expo-constants';
import firebaseService from './firebaseService';
import logger from './logService';
import devLog from '../utils/devLog';
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
        hostedDomain: '',
        scopes: [
          'email',
          'profile',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ],
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
      logger.auth('google_login_attempt', 'google');

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

      // Firebase Auth로 먼저 로그인
      devLog.log('🔑 Firebase Auth 로그인 중...');
      const auth = getAuth();
      const userCredential = await signInWithCredential(
        auth, 
        GoogleAuthProvider.credential(userInfo.idToken)
      );
      const firebaseUser = userCredential.user;

      // ID Token 강제 갱신
      devLog.log('🔄 ID Token 강제 갱신 중...');
      const newIdToken = await firebaseUser.getIdToken(true);
      devLog.log('✅ 새 ID Token 발급 완료, 길이:', newIdToken.length);

      // 신규/기존 사용자 판별
      let isNewUser = false;
      try {
        devLog.log('📝 사용자 프로필 확인 중...');

        // 기존 사용자 정보 확인
        const existingProfile = await firebaseService.getUserProfile(firebaseUser.uid);

        if (!existingProfile) {
          // 신규 사용자 - SignupComplete 화면으로 이동 필요
          isNewUser = true;
          devLog.log('✅ 신규 사용자 확인:', firebaseUser.uid);
        } else {
          // 기존 사용자 - 로그인 시간만 업데이트
          devLog.log('✅ 기존 사용자 확인, displayName:', existingProfile.displayName);
          await firebaseService.updateUserLastLogin(firebaseUser.uid);
        }
      } catch (error) {
        devLog.log('⚠️ 사용자 프로필 확인 에러:', error);
        // 프로필 조회 실패 시 신규 사용자로 간주
        isNewUser = true;
      }

      // 인증 상태를 AsyncStorage에 저장
      devLog.log('💾 인증 상태 AsyncStorage에 저장 중...');
      await authPersistenceService.saveAuthState(firebaseUser);

      devLog.log('✅ Google 로그인 및 Firebase Auth 세션 유지 완료');

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
        logger.auth('google_login_attempt', 'google', false, error);
        return { success: false, error: '로그인이 취소되었습니다.' };
      }

      // 재시도 로직
      if (retryCount < MAX_RETRIES && isRetryableError) {
        devLog.log(`🔄 Google 로그인 재시도 (${retryCount + 1}/${MAX_RETRIES})`);
        return this.login(retryCount + 1);
      }

      // 최종 실패 로그
      logger.auth('google_login_attempt', 'google', false, error);

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