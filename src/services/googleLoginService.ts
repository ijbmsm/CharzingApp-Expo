import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import Constants from 'expo-constants';
import firebaseService from './firebaseService';
import logger from './logService';

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
      console.log('🔑 Google Sign-In 이미 초기화됨');
      return;
    }

    try {
      const webClientId = Constants.expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID;
      
      console.log('🔍 [DEBUG] Web Client ID:', webClientId);
      
      if (!webClientId || webClientId.includes('PLACEHOLDER')) {
        throw new Error('Google Web Client ID가 설정되지 않았습니다. Firebase Console에서 Web Client ID를 생성하고 app.json에 설정해주세요.');
      }

      console.log(`🔧 [DEBUG] Google Sign-In configure 시작... (시도 ${retryCount + 1}/${MAX_RETRIES + 1})`);
      
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
        scopes: ['email', 'profile'],
      });

      this.isInitialized = true;
      console.log('✅ Google Sign-In 초기화 완료');
    } catch (error) {
      console.error(`❌ Google Sign-In 초기화 실패 (시도 ${retryCount + 1}):`, error);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Google Sign-In 초기화 재시도 중... (${retryCount + 1}/${MAX_RETRIES})`);
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
      console.log(`🔑 Google 로그인 시작 (시도 ${retryCount + 1}/${MAX_RETRIES + 1})`);
      logger.auth('google_login_attempt', 'google');

      // 초기화 확인 및 재시도
      if (!this.isInitialized) {
        console.log('🔧 [DEBUG] Google Sign-In 초기화 필요, 초기화 중...');
        await this.initialize();
      }

      // iOS 16+ Safari popup 안정화를 위한 대기
      const delayMs = retryCount === 0 ? 1500 : 2000 + (1000 * retryCount);
      console.log(`⏳ iOS Safari popup 안정화 대기 중... (${delayMs}ms)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Play Services 확인 (재시도 로직 포함)
      console.log('🔍 [DEBUG] Play Services 확인 중...');
      let hasPlayServices = false;
      for (let i = 0; i < 3; i++) {
        try {
          hasPlayServices = await GoogleSignin.hasPlayServices();
          console.log('🔍 [DEBUG] Play Services 사용 가능:', hasPlayServices);
          break;
        } catch (error) {
          console.log(`⚠️ Play Services 확인 실패 (시도 ${i + 1}/3):`, error);
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
          console.log('🔄 기존 Google 세션 정리 중...');
          await GoogleSignin.signOut();
          // 세션 정리 후 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.log('⚠️ 세션 정리 실패:', error);
          // 무시하고 계속 진행
        }
      }

      // Google Sign-In 실행 (iOS 16+ 안정화)
      console.log('🚀 [DEBUG] Google Sign-In 시작...');
      
      // iOS Safari popup 준비 시간 추가 (첫 시도에만)
      if (retryCount === 0) {
        console.log('⏳ iOS Safari popup 준비 중... (500ms)');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const signInResult = await GoogleSignin.signIn();
      console.log('🔍 [DEBUG] Sign-In 결과:', signInResult);
      
      if (signInResult.type === 'cancelled') {
        throw new Error('Google 로그인이 취소되었습니다.');
      }

      const userInfo = signInResult.data;
      
      if (!userInfo.idToken) {
        throw new Error('Google ID Token을 받지 못했습니다.');
      }

      console.log('✅ Google Sign-In 성공:', userInfo.user.email);

      // Firebase Auth로 먼저 로그인
      console.log('🔑 Firebase Auth 로그인 중...');
      const auth = getAuth();
      const userCredential = await signInWithCredential(
        auth, 
        GoogleAuthProvider.credential(userInfo.idToken)
      );
      const firebaseUser = userCredential.user;

      // ID Token 강제 갱신
      console.log('🔄 ID Token 강제 갱신 중...');
      const newIdToken = await firebaseUser.getIdToken(true);
      console.log('✅ 새 ID Token 발급 완료, 길이:', newIdToken.length);

      // Firestore에 사용자 정보 저장 또는 업데이트
      let isNewUser = false;
      try {
        console.log('📝 Firestore 사용자 프로필 저장/업데이트 중...');
        
        // 기존 사용자 정보 확인
        const existingProfile = await firebaseService.getUserProfile(firebaseUser.uid);
        
        if (!existingProfile) {
          // 신규 사용자 - 전체 프로필 생성
          isNewUser = true;
          const displayName = userInfo.user.name || userInfo.user.email?.split('@')[0] || 'Google 사용자';
          
          await firebaseService.saveUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || userInfo.user.email || '',
            displayName: displayName,
            provider: 'google',
            photoURL: userInfo.user.photo || firebaseUser.photoURL || '',
            googleId: userInfo.user.id,
            isRegistrationComplete: false,
          });
          console.log('✅ 신규 사용자 문서 생성 완료:', firebaseUser.uid, 'displayName:', displayName);
        } else {
          // 기존 사용자 - 로그인 시간만 업데이트
          console.log('✅ 기존 사용자 확인, displayName:', existingProfile.displayName);
          await firebaseService.updateUserLastLogin(firebaseUser.uid);
        }
      } catch (error) {
        console.log('⚠️ Firestore 사용자 정보 처리 에러:', error);
      }

      console.log('✅ Google 로그인 및 Firebase Auth 세션 유지 완료');

      return {
        success: true,
        user: firebaseUser,
        needsRegistration: isNewUser,
      };

    } catch (error: any) {
      console.error(`❌ Google 로그인 실패 (시도 ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
      
      // iOS 16+ popup dismiss 문제로 인한 재시도 로직 개선
      const isRetryableError = 
        error.code !== statusCodes.PLAY_SERVICES_NOT_AVAILABLE &&
        // iOS 16+에서 첫 번째 cancelled는 재시도 가능
        (error.code === statusCodes.SIGN_IN_CANCELLED && retryCount === 0) ||
        // 기타 일반적인 재시도 가능 에러들
        (error.code !== statusCodes.SIGN_IN_CANCELLED && !error.message?.includes('취소'));

      // 재시도 로직
      if (retryCount < MAX_RETRIES && isRetryableError) {
        console.log(`🔄 Google 로그인 재시도 (${retryCount + 1}/${MAX_RETRIES})`);
        return this.login(retryCount + 1);
      }

      // 최종 실패 로그
      logger.auth('google_login_attempt', 'google', false, error);

      // 에러 타입별 처리
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: '로그인이 취소되었습니다.' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
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
        console.log('✅ Google 로그아웃 완료');
      }
    } catch (error) {
      console.error('❌ Google 로그아웃 실패:', error);
    }
  }
}

export default new GoogleLoginService();