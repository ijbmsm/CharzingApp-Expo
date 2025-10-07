import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential, signInWithCustomToken, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import Constants from 'expo-constants';
import firebaseService from './firebaseService';

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

      console.log('🍎 Apple Sign-In credential:', {
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
      const userCredential = await signInWithCredential(auth, firebaseCredential);
      const firebaseUser = userCredential.user;
      const isNewUser = (userCredential as any).additionalUserInfo?.isNewUser;

      console.log('🔥 Firebase Apple Sign-In successful:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        isNewUser: isNewUser
      });

      // 🔑 ID Token 강제 갱신 (Callable Functions 인증을 위해)
      console.log('🔄 ID Token 강제 갱신 중...');
      const newIdToken = await firebaseUser.getIdToken(true);
      console.log('✅ 새 ID Token 발급 완료, 길이:', newIdToken.length);

      // Firestore에 사용자 정보 저장 또는 업데이트
      try {
        console.log('📝 Firestore 사용자 프로필 저장/업데이트 중...');
        
        // 기존 사용자 정보 확인
        const existingProfile = await firebaseService.getUserProfile(firebaseUser.uid);
        
        if (!existingProfile) {
          // 신규 사용자 - 전체 프로필 생성
          // Apple에서 제공하는 이름 정보 활용
          let displayName = 'Apple 사용자';
          if (credential.fullName) {
            const { givenName, familyName } = credential.fullName;
            if (givenName || familyName) {
              displayName = [familyName, givenName].filter(Boolean).join(' ');
            }
          } else if (firebaseUser.email) {
            // 이메일에서 이름 추출
            displayName = firebaseUser.email.split('@')[0] || 'Apple 사용자';
          } else if (credential.email) {
            // credential에서 이메일 추출
            displayName = credential.email.split('@')[0] || 'Apple 사용자';
          }
          
          await firebaseService.saveUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || credential.email || '',
            displayName: displayName,
            provider: 'apple',
            photoURL: firebaseUser.photoURL || '',
            appleId: firebaseUser.uid,
            isRegistrationComplete: false,
          });
          console.log('✅ 신규 사용자 문서 생성 완료:', firebaseUser.uid, 'displayName:', displayName);
        } else {
          // 기존 사용자 - 로그인 시간만 업데이트
          console.log('✅ 기존 사용자 확인, displayName:', existingProfile.displayName);
          // 마지막 로그인 시간 업데이트
          await firebaseService.updateUserLastLogin(firebaseUser.uid);
        }
      } catch (error) {
        console.log('⚠️ Firestore 사용자 정보 처리 에러:', error);
      }

      console.log('✅ Apple 로그인 및 Firebase Auth 세션 유지 완료');

      return {
        success: true,
        user: firebaseUser,
        needsRegistration: isNewUser,
      };

    } catch (error: any) {
      console.error('❌ Apple Sign-In error:', error);

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
      await auth.signOut();
      console.log('🍎 Apple Sign-Out completed');
    } catch (error) {
      console.error('❌ Apple Sign-Out error:', error);
      throw error;
    }
  }

  // Apple 계정 연결 해제 (선택사항)
  async revokeAccess(): Promise<boolean> {
    try {
      await (AppleAuthentication as any).revokeAsync();
      await auth.signOut();
      console.log('🍎 Apple account access revoked');
      return true;
    } catch (error) {
      console.error('❌ Apple access revoke error:', error);
      return false;
    }
  }
}

const appleLoginService = new AppleLoginService();
export default appleLoginService;