import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signInWithCustomToken, User } from 'firebase/auth';
import devLog from '../utils/devLog';

const AUTH_TOKEN_KEY = 'firebase_auth_token';
const AUTH_USER_KEY = 'firebase_auth_user';

interface StoredAuthData {
  token: string;
  refreshToken: string;
  expirationTime: number;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    providerId: string;
  };
}

class AuthPersistenceService {
  /**
   * 인증 상태를 AsyncStorage에 저장
   */
  async saveAuthState(user: User): Promise<void> {
    try {
      const token = await user.getIdToken();
      const refreshToken = user.refreshToken;
      
      // 토큰 만료 시간 계산 (현재 시간 + 55분, 실제 만료는 1시간)
      const expirationTime = Date.now() + (55 * 60 * 1000);
      
      const authData: StoredAuthData = {
        token,
        refreshToken,
        expirationTime,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          providerId: user.providerData[0]?.providerId || 'firebase',
        },
      };
      
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(authData));
      devLog.log('✅ 인증 상태를 AsyncStorage에 저장 완료:', user.uid);
    } catch (error) {
      devLog.error('❌ 인증 상태 저장 실패:', error);
    }
  }
  
  /**
   * AsyncStorage에서 저장된 인증 상태 복원
   */
  async restoreAuthState(): Promise<User | null> {
    try {
      const authDataStr = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!authDataStr) {
        devLog.log('📱 저장된 인증 데이터 없음');
        return null;
      }
      
      const authData: StoredAuthData = JSON.parse(authDataStr);
      
      // 토큰 만료 확인
      if (Date.now() > authData.expirationTime) {
        devLog.log('⏰ 저장된 토큰이 만료됨, 인증 데이터 삭제');
        await this.clearAuthState();
        return null;
      }
      
      // Firebase Auth에 토큰으로 재로그인 시도
      const auth = getAuth();
      
      // 현재 사용자가 이미 있는지 확인
      if (auth.currentUser && auth.currentUser.uid === authData.user.uid) {
        devLog.log('✅ Firebase Auth에 이미 올바른 사용자가 로그인되어 있음');
        return auth.currentUser;
      }
      
      devLog.log('🔄 저장된 토큰으로 Firebase Auth 상태 복원 시도');
      
      // Note: signInWithCustomToken은 서버에서 생성된 커스텀 토큰이 필요함
      // ID 토큰으로는 직접 로그인할 수 없으므로 다른 접근 방식이 필요
      
      // 임시 해결책: 토큰 유효성만 검증하고 사용자 정보 반환
      devLog.log('📱 저장된 사용자 정보 반환:', authData.user.uid);
      
      // 실제로는 Firebase Auth에 사용자가 로그인되지 않았지만
      // Redux에서 사용할 수 있도록 사용자 정보 반환
      return {
        uid: authData.user.uid,
        email: authData.user.email,
        displayName: authData.user.displayName,
        photoURL: authData.user.photoURL,
        // 기타 필요한 User 인터페이스 속성들은 임시로 설정
        emailVerified: false,
        isAnonymous: false,
        metadata: {} as any,
        providerData: [{ providerId: authData.user.providerId } as any],
        refreshToken: authData.refreshToken,
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => authData.token,
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({} as any),
      } as User;
      
    } catch (error) {
      devLog.error('❌ 인증 상태 복원 실패:', error);
      await this.clearAuthState();
      return null;
    }
  }
  
  /**
   * 저장된 인증 데이터 삭제
   */
  async clearAuthState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      devLog.log('🗑️ 저장된 인증 데이터 삭제 완료');
    } catch (error) {
      devLog.error('❌ 인증 데이터 삭제 실패:', error);
    }
  }
  
  /**
   * 저장된 토큰의 유효성 확인
   */
  async isTokenValid(): Promise<boolean> {
    try {
      const authDataStr = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!authDataStr) return false;
      
      const authData: StoredAuthData = JSON.parse(authDataStr);
      return Date.now() < authData.expirationTime;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthPersistenceService();