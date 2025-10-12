import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

interface UserProfile {
  uid?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  photoURL?: string;
  provider?: string;
  kakaoId?: string;
  isRegistrationComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

interface UpdateProfileData {
  displayName?: string;
  phoneNumber?: string;
  address?: string;
  isRegistrationComplete?: boolean;
}

class UserService {
  private getAuthInstance() {
    return getAuth();
  }
  private functions = getFunctions(undefined, 'us-central1');

  /**
   * 현재 사용자 프로필 조회 (Cloud Function 사용)
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const currentUser = this.getAuthInstance().currentUser;
      if (!currentUser) {
        return null;
      }

      console.log('👤 사용자 프로필 조회 중...');
      
      const getUserProfile = httpsCallable(this.functions, 'getUserProfile');
      const result = await getUserProfile();
      
      if (result.data && (result.data as any).success) {
        console.log('✅ 프로필 조회 성공');
        return (result.data as any).user;
      }
      
      throw new Error('프로필 조회 응답이 올바르지 않습니다.');
    } catch (error) {
      console.error('❌ 프로필 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 프로필 업데이트 (Cloud Function 사용)
   */
  async updateUserProfile(data: UpdateProfileData): Promise<boolean> {
    try {
      const currentUser = this.getAuthInstance().currentUser;
      if (!currentUser) {
        throw new Error('로그인된 사용자가 없습니다.');
      }

      console.log('✏️ 사용자 프로필 업데이트 중...');
      
      const updateUserProfile = httpsCallable(this.functions, 'updateUserProfile');
      const result = await updateUserProfile(data);
      
      if (result.data && (result.data as any).success) {
        console.log('✅ 프로필 업데이트 성공');
        return true;
      }
      
      throw new Error('프로필 업데이트 응답이 올바르지 않습니다.');
    } catch (error) {
      console.error('❌ 프로필 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 회원가입 완료 처리
   */
  async completeRegistration(profileData: {
    displayName: string;
    phoneNumber: string;
    address: string;
  }): Promise<boolean> {
    try {
      console.log('📝 회원가입 완료 처리 중...');
      
      const result = await this.updateUserProfile({
        ...profileData,
        isRegistrationComplete: true,
      });
      
      console.log('✅ 회원가입 완료 처리 성공');
      return result;
    } catch (error) {
      console.error('❌ 회원가입 완료 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 로그인 상태 확인
   */
  isLoggedIn(): boolean {
    return this.getAuthInstance().currentUser !== null;
  }

  /**
   * 현재 사용자 UID 가져오기
   */
  getCurrentUserId(): string | null {
    return this.getAuthInstance().currentUser?.uid || null;
  }

  /**
   * 현재 사용자 이메일 가져오기
   */
  getCurrentUserEmail(): string | null {
    return this.getAuthInstance().currentUser?.email || null;
  }

  /**
   * Firebase 사용자 객체 가져오기
   */
  getCurrentUser() {
    return this.getAuthInstance().currentUser;
  }

  /**
   * 인증 상태 변화 리스너 등록
   */
  onAuthStateChanged(callback: (user: any) => void) {
    return this.getAuthInstance().onAuthStateChanged(callback);
  }
}

// 싱글톤 인스턴스 생성
export const userService = new UserService();
export default userService;