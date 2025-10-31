import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential, signInWithCustomToken, User } from 'firebase/auth';
import { getAuthInstance } from '../firebase/config';
import Constants from 'expo-constants';
import firebaseService from './firebaseService';
import devLog from '../utils/devLog';

interface AppleAuthResult {
  success: boolean;
  user?: User;
  error?: string;
  needsRegistration?: boolean;
}

class AppleLoginService {
  async login(): Promise<AppleAuthResult> {
    try {
      // Apple Sign-In 지원 여부 확인
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Apple Sign-In is not available on this device'
        };
      }

      // Apple Sign-In 요청
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      devLog.log('🍎 Apple Sign-In credential:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        identityToken: credential.identityToken ? 'present' : 'missing',
        authorizationCode: credential.authorizationCode ? 'present' : 'missing'
      });

      if (!credential.identityToken) {
        throw new Error('Apple Sign-In failed: No identity token received');
      }

      // Firebase Apple provider 생성
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: undefined, // Expo Apple Authentication에서는 nonce를 자동 처리
      });

      // Firebase Apple Sign-In 직접 로그인 (세션 유지)
      devLog.log('🔗 Firebase signInWithCredential 시작...');
      const userCredential = await signInWithCredential(getAuthInstance(), firebaseCredential);
      const firebaseUser = userCredential.user;
      const isNewUser = (userCredential as any).additionalUserInfo?.isNewUser;

      devLog.log('🔥 Firebase Apple Sign-In successful:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        isNewUser: isNewUser
      });

      // 세션 저장 확인
      const auth = getAuthInstance();
      devLog.log('🔍 Firebase Auth 세션 확인:', {
        currentUserUid: auth.currentUser?.uid,
        isCurrentUserSame: auth.currentUser?.uid === firebaseUser.uid,
        authReady: !!auth.currentUser
      });

      // 🔑 ID Token 강제 갱신 (Callable Functions 인증을 위해)
      devLog.log('🔄 ID Token 강제 갱신 중...');
      const newIdToken = await firebaseUser.getIdToken(true);
      devLog.log('✅ 새 ID Token 발급 완료, 길이:', newIdToken.length);

      // 신규/기존 사용자 판별
      try {
        devLog.log('📝 사용자 프로필 확인 중...');

        // 기존 사용자 정보 확인
        const existingProfile = await firebaseService.getUserProfile(firebaseUser.uid);

        if (!existingProfile) {
          // 신규 사용자 - SignupComplete 화면으로 이동 필요
          devLog.log('✅ 신규 사용자 확인:', firebaseUser.uid);
        } else {
          // 기존 사용자 - 로그인 시간만 업데이트
          devLog.log('✅ 기존 사용자 확인, displayName:', existingProfile.displayName);
          await firebaseService.updateUserLastLogin(firebaseUser.uid);
        }
      } catch (error) {
        devLog.log('⚠️ 사용자 프로필 확인 에러:', error);
      }

      devLog.log('✅ Apple 로그인 및 Firebase Auth 세션 유지 완료');

      return {
        success: true,
        user: firebaseUser,
        needsRegistration: isNewUser,
      };

    } catch (error: any) {
      devLog.error('❌ Apple Sign-In error:', error);
      devLog.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack?.substring(0, 200)
      });

      // 사용자가 취소한 경우
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return {
          success: false,
          error: '로그인이 취소되었습니다.'
        };
      }

      // Firebase 인증 에러
      if (error.code?.startsWith('auth/')) {
        return {
          success: false,
          error: `인증 오류: ${error.message}`
        };
      }

      return {
        success: false,
        error: `Apple 로그인 중 오류가 발생했습니다: ${error.message}`
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await getAuthInstance().signOut();
      devLog.log('🍎 Apple Sign-Out completed');
    } catch (error) {
      devLog.error('❌ Apple Sign-Out error:', error);
      throw error;
    }
  }

  // Apple 세션 silent refresh 시도
  async silentRefresh(): Promise<AppleAuthResult> {
    try {
      devLog.log('🔄 Apple 세션 silent refresh 시도...');
      
      // Apple Sign-In 지원 여부 확인
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Apple Sign-In is not available on this device'
        };
      }

      // 자동 로그인 시도 (사용자 입력 없이)
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [], // silent refresh에서는 scope 요청하지 않음
      });

      if (!credential.identityToken) {
        throw new Error('Silent refresh failed: No identity token received');
      }

      // Firebase Apple provider 생성
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: undefined,
      });

      // Firebase에 재로그인
      const userCredential = await signInWithCredential(getAuthInstance(), firebaseCredential);
      const firebaseUser = userCredential.user;

      devLog.log('✅ Apple silent refresh 성공:', firebaseUser.uid);

      return {
        success: true,
        user: firebaseUser,
        needsRegistration: false,
      };

    } catch (error: any) {
      devLog.log('❌ Apple silent refresh 실패:', error.message);
      
      // 사용자가 취소한 경우 (silent refresh에서는 정상적인 상황)
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return {
          success: false,
          error: 'Silent refresh 취소됨 (재로그인 필요)'
        };
      }

      return {
        success: false,
        error: `Silent refresh 실패: ${error.message}`
      };
    }
  }

  // Apple 계정 연결 해제 (선택사항)
  async revokeAccess(): Promise<boolean> {
    try {
      await (AppleAuthentication as any).revokeAsync();
      await getAuthInstance().signOut();
      devLog.log('🍎 Apple account access revoked');
      return true;
    } catch (error) {
      devLog.error('❌ Apple access revoke error:', error);
      return false;
    }
  }
}

const appleLoginService = new AppleLoginService();
export default appleLoginService;