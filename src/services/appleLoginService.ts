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

      // Firestore에 사용자 정보 저장 또는 업데이트
      try {
        devLog.log('📝 Firestore 사용자 프로필 저장/업데이트 중...');
        
        // 기존 사용자 정보 확인
        const existingProfile = await firebaseService.getUserProfile(firebaseUser.uid);
        
        if (!existingProfile) {
          // 신규 사용자 - 전체 프로필 생성
          // Apple에서 제공하는 이름 정보 활용
          let displayName = 'Apple 사용자';
          let realName = '';
          
          if (credential.fullName) {
            const { givenName, familyName } = credential.fullName;
            if (givenName || familyName) {
              // Apple에서는 보통 서구식 이름 순서 (이름 성)이므로 한국식으로 조정
              const fullNameParts = [familyName, givenName].filter(Boolean);
              displayName = fullNameParts.join(' ');
              realName = fullNameParts.join(' ');
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
            realName: realName || displayName, // realName이 없으면 displayName 사용
            provider: 'apple',
            photoURL: firebaseUser.photoURL || '',
            appleId: firebaseUser.uid,
            isRegistrationComplete: false,
          });
          devLog.log('✅ 신규 사용자 문서 생성 완료:', firebaseUser.uid, 'displayName:', displayName, 'realName:', realName);
        } else {
          // 기존 사용자 - 로그인 시간만 업데이트
          devLog.log('✅ 기존 사용자 확인, displayName:', existingProfile.displayName);
          // 마지막 로그인 시간 업데이트
          await firebaseService.updateUserLastLogin(firebaseUser.uid);
        }
      } catch (error) {
        devLog.log('⚠️ Firestore 사용자 정보 처리 에러:', error);
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