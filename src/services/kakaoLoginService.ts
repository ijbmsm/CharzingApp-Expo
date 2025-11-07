/**
 * 카카오 로그인 서비스 (네이티브 SDK 방식)
 * Single Responsibility Principle (SRP): 카카오 로그인만 담당
 * Interface Segregation Principle (ISP): ILoginService 구현
 * Dependency Inversion Principle (DIP): 추상화된 인터페이스에 의존
 */

// 안전한 카카오 SDK import
let login: any, logout: any, getProfile: any, unlink: any;

try {
  const KakaoSDK = require("@react-native-seoul/kakao-login");
  login = KakaoSDK.login;
  logout = KakaoSDK.logout;
  getProfile = KakaoSDK.getProfile;
  unlink = KakaoSDK.unlink;
} catch (error) {
  console.warn('⚠️ 카카오 SDK import 실패 - Development Build 필요:', error);
  // 네이티브 모듈이 없는 환경에서는 undefined로 설정
  login = undefined;
  logout = undefined;
  getProfile = undefined;
  unlink = undefined;
}
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { Platform, NativeModules } from 'react-native';
import firebaseService from './firebaseService';
import logger from './logService';
import devLog from '../utils/devLog';
import kakaoWebLoginService from './kakaoWebLoginService';
import { 
  ILoginService, 
  LoginResult, 
  ISocialUserFactory,
  AppUser
} from './auth/types';

/**
 * 카카오 사용자 응답 타입 (네이티브 SDK)
 */
interface KakaoProfile {
  id: string;
  nickname?: string;
  profileImageUrl?: string;
  thumbnailImageUrl?: string;
  email?: string;
}

/**
 * 카카오 사용자 팩토리 (Factory Pattern)
 * Single Responsibility Principle (SRP): 카카오 사용자 객체 생성만 담당
 */
class KakaoUserFactory implements ISocialUserFactory {
  createUser(firebaseUser: any, kakaoProfile: KakaoProfile): AppUser {
    const kakaoId = kakaoProfile.id;
    const email = kakaoProfile.email;
    const displayName = kakaoProfile.nickname || '카카오 사용자';
    const photoURL = kakaoProfile.profileImageUrl;

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
 * 카카오 로그인 서비스 구현 (네이티브 SDK 사용)
 * Open/Closed Principle (OCP): 확장에는 열려있고 수정에는 닫혀있음
 */
class KakaoLoginService implements ILoginService {
  private userFactory: ISocialUserFactory;
  private isInitialized = false;

  constructor() {
    this.userFactory = new KakaoUserFactory();
    
    devLog.log('🔧 카카오 네이티브 SDK 로그인 서비스 초기화');
  }

  /**
   * 카카오 로그인 서비스 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      devLog.log('✅ 카카오 네이티브 SDK 로그인 서비스 초기화 완료');
      this.isInitialized = true;
    } catch (error) {
      devLog.error('❌ 카카오 네이티브 SDK 로그인 서비스 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 카카오 네이티브 SDK 사용 가능 여부 확인
   * Development Build 환경과 네이티브 모듈 초기화 상태를 체크
   */
  async isAvailable(): Promise<boolean> {
    try {
      // 1. 플랫폼 지원 여부 확인
      if (!Platform.OS || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
        devLog.warn('⚠️ 카카오 네이티브 SDK는 iOS/Android에서만 지원됩니다');
        return false;
      }

      // 2. 네이티브 모듈 연결 상태 직접 확인 (정확한 이름 사용)
      const RNKakaoLogins = NativeModules.RNKakaoLogins;
      
      devLog.log('🔍 정확한 네이티브 모듈 연결 상태 디버깅:', {
        'NativeModules.RNKakaoLogins': RNKakaoLogins,
        'typeof RNKakaoLogins': typeof RNKakaoLogins,
        'RNKakaoLogins === null': RNKakaoLogins === null,
        'RNKakaoLogins === undefined': RNKakaoLogins === undefined,
        'Platform.OS': Platform.OS,
        'Available NativeModules keys': Object.keys(NativeModules).filter(key => key.toLowerCase().includes('kakao')),
        'ALL NativeModules (first 20)': Object.keys(NativeModules).slice(0, 20),
        'Total NativeModules count': Object.keys(NativeModules).length
      });

      devLog.log('🔍 카카오 SDK 모듈 상태 디버깅:', {
        'login 타입': typeof login,
        'login 값': login,
        'getProfile 타입': typeof getProfile,
        'logout 타입': typeof logout,
        'unlink 타입': typeof unlink,
        'login === undefined': login === undefined,
        'login === null': login === null
      });

      // 네이티브 모듈이 제대로 연결되지 않은 경우
      if (!RNKakaoLogins) {
        devLog.error('❌ 핵심 문제 발견: RNKakaoLogins 네이티브 모듈이 null/undefined입니다');
        devLog.error('이는 다음 중 하나의 문제입니다:');
        devLog.error('1. Development Build에서 네이티브 모듈이 제대로 컴파일되지 않음');
        devLog.error('2. app.config.js의 kakaoAppKey가 올바르지 않음');
        devLog.error('3. Expo plugin이 제대로 네이티브 코드를 생성하지 않음');
        devLog.error('4. iOS에서 카카오 SDK 초기화 실패');
        return false;
      }

      // 3. 초기화 상태 확인
      if (!this.isInitialized) {
        devLog.warn('⚠️ 카카오 로그인 서비스가 초기화되지 않았습니다');
        return false;
      }

      devLog.log('✅ 카카오 네이티브 SDK 사용 가능');
      return true;
    } catch (error) {
      devLog.error('❌ 카카오 네이티브 SDK 가용성 체크 실패:', error);
      return false;
    }
  }

  /**
   * 카카오 로그인 실행 (네이티브 SDK 사용)
   */
  async login(): Promise<LoginResult> {
    try {
      console.log('🔐 [1/7] 카카오 네이티브 SDK 로그인 시작');
      devLog.log('🔐 카카오 네이티브 SDK 로그인 시작');
      logger.auth('login_attempt', 'kakao');

      // 초기화 확인
      if (!this.isInitialized) {
        console.log('🔐 [2/7] 카카오 서비스 초기화 중...');
        await this.initialize();
      }

      console.log('🔐 [3/7] 카카오 SDK 가용성 확인 중...');
      if (!(await this.isAvailable())) {
        throw new Error('카카오 네이티브 SDK를 사용할 수 없습니다. RNKakaoLogins 네이티브 모듈이 연결되지 않았습니다.');
      }

      // 1. 카카오 네이티브 SDK 로그인 (안전한 호출)
      console.log('🔐 [4/7] 카카오 SDK login() 함수 호출 시작 (카카오톡 앱으로 이동)');
      devLog.log('🔐 카카오 SDK login 함수 호출 시작');

      // 호출 직전 네이티브 모듈 상태 재확인
      const currentNativeModule = NativeModules.RNCKakaoSDK || NativeModules.KakaoLogin || NativeModules.RNKakaoLogins;
      devLog.log('🔍 로그인 호출 직전 네이티브 모듈 상태:', {
        'currentNativeModule': currentNativeModule,
        'login 함수': login,
        'typeof login': typeof login
      });

      // 호출 직전 한 번 더 안전성 체크
      if (!login || typeof login !== 'function') {
        throw new Error('카카오 login 함수가 사용할 수 없는 상태입니다');
      }

      console.log('🔐 [5/7] 카카오 SDK login() Promise 대기 중... (Deep Link 복귀 후 resolve 예상)');
      const kakaoToken = await login();
      console.log('✅ [6/7] 카카오 SDK 로그인 성공! accessToken 받음:', kakaoToken?.accessToken ? '있음' : '없음');
      devLog.log('✅ 카카오 SDK 로그인 성공:', kakaoToken);

      // 2. 카카오 사용자 프로필 조회 (클라이언트 표시용)
      console.log('🔐 [7/7] 카카오 프로필 조회 중...');
      const kakaoProfile = await getProfile();
      console.log('✅ 카카오 프로필 조회 성공:', kakaoProfile?.nickname || '이름없음');
      devLog.log('✅ 카카오 프로필 조회 성공:', kakaoProfile);

      // 3. Firebase 커스텀 토큰 생성 및 로그인 (서버가 직접 사용자 정보 조회)
      console.log('🔥 Firebase Functions 호출 시작 (kakaoLoginHttp)');
      const firebaseResult = await this.loginWithFirebase(kakaoToken.accessToken);

      if (firebaseResult.success && firebaseResult.user) {
        // 4. 사용자 정보 로깅
        const appUser = this.userFactory.createUser(firebaseResult.user, kakaoProfile);

        logger.auth('login_success', 'kakao', true, undefined, firebaseResult.user.uid);
        devLog.log('✅ 카카오 네이티브 SDK 로그인 성공:', appUser.displayName);

        // 기존 사용자인 경우 로그인 시간 업데이트
        if (!firebaseResult.needsRegistration) {
          await firebaseService.updateUserLastLogin(firebaseResult.user.uid);
        }

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

      // 상세 에러 로깅 (Key Hash 정보 포함 가능)
      console.error('❌❌❌ 카카오 로그인 전체 에러 객체:', JSON.stringify(error, null, 2));
      console.error('❌❌❌ 에러 타입:', typeof error);
      console.error('❌❌❌ 에러 메시지:', errorMessage);

      if (error && typeof error === 'object') {
        console.error('❌❌❌ 에러 객체 키들:', Object.keys(error));
        console.error('❌❌❌ 에러 name:', (error as any).name);
        console.error('❌❌❌ 에러 code:', (error as any).code);
        console.error('❌❌❌ 에러 nativeStackAndroid:', (error as any).nativeStackAndroid);
      }

      devLog.error('❌ 카카오 네이티브 SDK 로그인 실패:', error);
      logger.auth('login_attempt', 'kakao', false, error);

      // Sentry에 Key Hash 에러 전송
      if (errorMessage.toLowerCase().includes('keyhash') ||
          errorMessage.toLowerCase().includes('key hash')) {
        const Sentry = require('@sentry/react-native');
        Sentry.captureException(error, {
          tags: {
            feature: 'kakao-login',
            error_type: 'keyhash_validation',
            platform: Platform.OS,
          },
          contexts: {
            kakao: {
              error_message: errorMessage,
              error_full: JSON.stringify(error),
              platform: Platform.OS,
            }
          },
          level: 'error',
        });

        console.error('🔴🔴🔴 KEY HASH 에러 발생! Sentry에 전송됨');
        console.error('🔴 해결 방법: 카카오 개발자 콘솔(developers.kakao.com)에 올바른 Key Hash 등록 필요');
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Firebase 커스텀 토큰으로 로그인
   */
  private async loginWithFirebase(kakaoAccessToken: string): Promise<LoginResult> {
    try {
      console.log('🔥 [Firebase 1/3] Functions를 통해 커스텀 토큰 생성 시작');
      // Firebase Functions를 통해 커스텀 토큰 생성
      const customToken = await this.getFirebaseCustomToken(kakaoAccessToken);
      console.log('✅ [Firebase 2/3] 커스텀 토큰 받음:', customToken ? '있음' : '없음');

      // Firebase Auth로 로그인
      console.log('🔥 [Firebase 3/3] Firebase Auth로 로그인 중...');
      const auth = getAuth();
      const userCredential = await signInWithCustomToken(auth, customToken);
      console.log('✅ Firebase Auth 로그인 성공:', userCredential.user.uid);

      // 신규 사용자 여부 확인
      const isNewUser = await this.checkIfNewUser(userCredential.user.uid);
      console.log('✅ 신규 사용자 여부:', isNewUser ? '신규' : '기존');

      return {
        success: true,
        user: userCredential.user,
        needsRegistration: isNewUser
      };
    } catch (error) {
      console.error('❌ Firebase 로그인 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Firebase 로그인 실패'
      };
    }
  }

  /**
   * Firebase Functions를 통해 커스텀 토큰 생성 (구글/애플과 동일한 패턴)
   * 🔒 보안 개선: userInfo를 서버에서 직접 조회하도록 변경
   */
  private async getFirebaseCustomToken(kakaoAccessToken: string): Promise<string> {
    console.log('🔥 Firebase Functions 호출: kakaoLoginHttp');
    console.log('🔥 전송 데이터:', { kakaoAccessToken: kakaoAccessToken ? '있음 (길이: ' + kakaoAccessToken.length + ')' : '없음' });

    // 새로운 kakaoLoginHttp 함수 호출 (인증 없이)
    // 서버에서 kakaoAccessToken으로 /v2/user/me를 직접 호출하여 사용자 정보 조회
    const response = await firebaseService.callCloudFunctionWithoutAuth('kakaoLoginHttp', {
      kakaoAccessToken: kakaoAccessToken
      // userInfo 제거 - 서버에서 직접 조회
    });

    console.log('✅ Firebase Functions 응답:', response);

    if (!response.success || !response.customToken) {
      console.error('❌ Firebase Functions 오류:', response.error || '알 수 없는 오류');
      throw new Error(response.error || '카카오 로그인 처리 중 오류가 발생했습니다.');
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
  private async syncUserDocument(appUser: AppUser, kakaoProfile: KakaoProfile): Promise<void> {
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
   * 카카오 로그아웃
   */
  async logout(): Promise<void> {
    try {
      devLog.log('🔓 카카오 네이티브 SDK 로그아웃 시작');
      
      // 카카오 SDK 로그아웃
      await logout();
      
      // Firebase 로그아웃
      const auth = getAuth();
      await auth.signOut();
      
      devLog.log('✅ 카카오 네이티브 SDK 로그아웃 완료');
    } catch (error) {
      devLog.error('❌ 카카오 네이티브 SDK 로그아웃 실패:', error);
      throw error;
    }
  }

  /**
   * 카카오 계정 연결 해제 (선택사항)
   */
  async unlink(): Promise<void> {
    try {
      devLog.log('🔓 카카오 계정 연결 해제 시작');
      
      await unlink();
      
      devLog.log('✅ 카카오 계정 연결 해제 완료');
    } catch (error) {
      devLog.error('❌ 카카오 계정 연결 해제 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const kakaoLoginService = new KakaoLoginService();
export default kakaoLoginService;