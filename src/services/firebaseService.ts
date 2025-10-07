// Firebase 웹 SDK (Expo 호환)
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp,
  FieldValue,
  orderBy
} from 'firebase/firestore';
import { getAuth, signOut, signInWithCustomToken } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { getFunctions, httpsCallable } from 'firebase/functions'; // Removed to fix Metro bundler issues
import axios from 'axios';
import Constants from 'expo-constants';
import app from '../firebase/config';
import logger from './logService';

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  realName?: string; // 실명 추가
  photoURL?: string;
  provider: 'kakao' | 'email' | 'apple' | 'google';
  kakaoId?: string;
  appleId?: string;
  googleId?: string;
  phoneNumber?: string;
  address?: string;
  isRegistrationComplete: boolean;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

export interface UserVehicle {
  id: string;
  userId: string;
  make: string; // 제조사 (현대, 기아, 테슬라 등)
  model: string; // 모델명 (아이오닉 5, EV6 등)
  year: number; // 연식
  batteryCapacity?: string; // 배터리 용량
  range?: string; // 주행거리
  nickname?: string; // 차량 별명
  isActive: boolean; // 활성 차량 여부 (메인 차량)
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

export interface DiagnosisReservation {
  id: string;
  userId: string;
  userName?: string;
  address: string;
  detailAddress?: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  requestedDate: Date | FieldValue;
  notes?: string;
  adminNotes?: string;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

export interface DiagnosisReportFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface DiagnosisReport {
  id: string;
  userId: string;
  title: string;
  description?: string;
  files: DiagnosisReportFile[];
  status: 'uploaded' | 'processing' | 'completed';
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

// 차량 진단 리포트 세부 항목
export interface DiagnosisDetail {
  category: string; // 구분 (SOH, 셀 불량 여부 등)
  measuredValue: string; // 측정값
  interpretation: string; // 해석
}

// 배터리 셀 정보
export interface BatteryCell {
  id: number; // 셀 번호
  isDefective: boolean; // 불량 여부
  voltage?: number; // 전압 (옵션)
  temperature?: number; // 온도 (옵션)
}

// 새로운 차량 진단 리포트 구조
export interface VehicleDiagnosisReport {
  id: string;
  reservationId: string; // 예약과 연결
  userId: string;
  
  // 상단 기본 정보
  vehicleName: string; // 차량명
  vehicleYear: string; // 차량 년식
  diagnosisDate: Date | FieldValue; // 진단 날짜
  cellCount: number; // 셀 개수
  defectiveCellCount: number; // 불량 개수
  normalChargeCount: number; // 일반 충전 횟수
  fastChargeCount: number; // 급속 충전 횟수
  sohPercentage: number; // SOH(%)
  realDrivableDistance: string; // 실 주행 가능 거리
  
  // 셀 정보 (새로 추가)
  cellsData: BatteryCell[]; // 개별 셀 상태 데이터
  
  // 하단 세부 진단 결과
  diagnosisDetails: DiagnosisDetail[];
  
  // 메타 정보
  status: 'draft' | 'completed';
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

export interface ScheduleSettings {
  workingDays: number[]; // 0=일요일, 1=월요일, ...
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  unavailableSlots: {
    date: string; // YYYY-MM-DD
    timeSlots: string[]; // ["09:00", "10:00"]
  }[];
}

class FirebaseService {
  private db = getFirestore(app);
  private auth = getAuth(app);
  private storage = getStorage(app);
  // private functions = getFunctions(app, 'us-central1'); // Removed to fix Metro bundler issues
  private readonly CLOUD_FUNCTION_URL: string;
  private usersCollectionRef = collection(this.db, 'users');
  private diagnosisReservationsRef = collection(this.db, 'diagnosisReservations');
  private diagnosisReportsRef = collection(this.db, 'diagnosisReports');
  private vehicleDiagnosisReportsRef = collection(this.db, 'vehicleDiagnosisReports');
  private settingsRef = collection(this.db, 'settings');

  constructor() {
    this.CLOUD_FUNCTION_URL = Constants.expoConfig?.extra?.CLOUD_FUNCTION_URL || 
      'https://us-central1-charzing-d1600.cloudfunctions.net';
  }
  
  // 스케줄 설정 캐시
  private scheduleSettingsCache: ScheduleSettings | null = null;
  private scheduleSettingsCacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

  /**
   * Firebase Auth ID Token 가져오기
   */
  private async getIdToken(): Promise<string> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('로그인이 필요합니다');
    }
    return await currentUser.getIdToken();
  }

  /**
   * Cloud Function 직접 HTTP 호출 (Firebase Functions SDK 없이)
   */
  async callCloudFunction(functionName: string, data: any = {}): Promise<any> {
    try {
      console.log(`🌩️ Cloud Function 직접 호출: ${functionName}`);
      
      // 인증된 사용자인지 확인
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('로그인이 필요합니다');
      }

      // ID Token 가져오기
      const idToken = await currentUser.getIdToken(true);
      
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/${functionName}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      console.log(`✅ Cloud Function 호출 성공: ${functionName}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Cloud Function 호출 실패 (${functionName}):`, error);
      throw error;
    }
  }

  /**
   * Note: 카카오 로그인은 이제 Cloud Functions에서 처리하므로 이 메서드는 사용하지 않음
   * kakaoLoginService를 대신 사용하세요
   */
  async signInWithKakao() {
    throw new Error('이 메서드는 더 이상 사용되지 않습니다. kakaoLoginService를 사용하세요.');
  }

  /**
   * Note: Custom Token 생성은 이제 Cloud Functions에서 처리
   */
  private async createCustomTokenForKakao(): Promise<string> {
    throw new Error('이 메서드는 더 이상 사용되지 않습니다. Cloud Functions를 사용하세요.');
  }

  /**
   * 사용자 프로필 저장/업데이트 (merge 옵션 사용)
   */
  async createOrUpdateUser(userProfile: Partial<UserProfile>): Promise<void> {
    return this.saveUserProfile(userProfile as any);
  }
  
  async saveUserProfile(userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const now = serverTimestamp();
      const userDocRef = doc(this.db, 'users', userProfile.uid);
      
      // undefined 값을 제거한 깨끗한 객체 생성
      const cleanProfile: Partial<UserProfile> & { updatedAt: FieldValue } = {
        updatedAt: now,
      };
      
      // undefined가 아닌 값들만 추가
      if (userProfile.uid !== undefined) cleanProfile.uid = userProfile.uid;
      if (userProfile.email !== undefined) cleanProfile.email = userProfile.email;
      if (userProfile.displayName !== undefined) cleanProfile.displayName = userProfile.displayName;
      if (userProfile.realName !== undefined) cleanProfile.realName = userProfile.realName;
      if (userProfile.photoURL !== undefined) cleanProfile.photoURL = userProfile.photoURL;
      if (userProfile.provider !== undefined) cleanProfile.provider = userProfile.provider;
      if (userProfile.kakaoId !== undefined) cleanProfile.kakaoId = userProfile.kakaoId;
      if (userProfile.appleId !== undefined) cleanProfile.appleId = userProfile.appleId;
      if (userProfile.googleId !== undefined) cleanProfile.googleId = userProfile.googleId;
      if (userProfile.phoneNumber !== undefined) cleanProfile.phoneNumber = userProfile.phoneNumber;
      if (userProfile.address !== undefined) cleanProfile.address = userProfile.address;
      if (userProfile.isRegistrationComplete !== undefined) cleanProfile.isRegistrationComplete = userProfile.isRegistrationComplete;
      
      // merge: true 옵션을 사용해서 기존 데이터와 병합
      await setDoc(userDocRef, cleanProfile, { merge: true });
      
      logger.firebaseOperation('save_user_profile', 'users', true, undefined, userProfile.uid);
    } catch (error) {
      logger.firebaseOperation('save_user_profile', 'users', false, error, userProfile.uid);
      throw error;
    }
  }

  /**
   * 카카오 사용자 프로필을 Firestore에 저장 (Transaction 사용)
   */
  async saveKakaoUserProfile(uid: string, kakaoProfile: any): Promise<{ isNewUser: boolean; user: UserProfile }> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      
      return await runTransaction(this.db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        const now = serverTimestamp();
        
        if (userDoc.exists()) {
          // 기존 사용자 - 로그인 시간만 업데이트
          const existingData = userDoc.data() as UserProfile;
          const updateData: Partial<UserProfile> = {
            updatedAt: now,
            // 카카오 프로필 정보가 변경되었을 수 있으므로 업데이트
            displayName: kakaoProfile.nickname || existingData.displayName,
          };
          
          // 프로필 이미지가 있는 경우에만 업데이트
          if (kakaoProfile.profileImageUrl) {
            updateData.photoURL = kakaoProfile.profileImageUrl;
          }
          
          transaction.update(userDocRef, updateData);
          
          logger.auth('login', 'kakao', true, undefined, uid);
          return { 
            isNewUser: false, 
            user: { 
              ...existingData, 
              updatedAt: new Date(),
              displayName: kakaoProfile.nickname || existingData.displayName,
              photoURL: kakaoProfile.profileImageUrl || existingData.photoURL,
            } 
          };
        } else {
          // 신규 사용자 - 기본 프로필 생성 (회원가입 미완료 상태)
          // 카카오에서는 닉네임만 확실하게 받아올 수 있음
          const newUserProfile: UserProfile = {
            uid,
            displayName: kakaoProfile.nickname || '카카오 사용자',
            provider: 'kakao',
            kakaoId: kakaoProfile.id,
            isRegistrationComplete: false, // 추가 정보 입력 필요
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // 선택적으로 이메일과 프로필 이미지 추가 (undefined가 아닌 경우에만)
          if (kakaoProfile.email) {
            newUserProfile.email = kakaoProfile.email;
          }
          if (kakaoProfile.profileImageUrl) {
            newUserProfile.photoURL = kakaoProfile.profileImageUrl;
          }
          
          transaction.set(userDocRef, newUserProfile);
          logger.auth('signup', 'kakao', true, undefined, uid);
          return { isNewUser: true, user: newUserProfile };
        }
      });
    } catch (error) {
      logger.firebaseOperation('save_kakao_user_profile', 'users', false, error);
      throw error;
    }
  }

  /**
   * 사용자 문서 존재 여부 확인
   */
  async checkUserDocumentExists(uid: string): Promise<boolean> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists();
    } catch (error) {
      logger.firebaseOperation('check_user_document_exists', 'users', false, error, uid);
      return false;
    }
  }

  /**
   * 기본 사용자 문서 생성 (Apple/Google용)
   */
  async createUserDocument(uid: string, userInfo: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    provider: 'apple' | 'google' | 'kakao';
    appleId?: string;
    googleId?: string;
    kakaoId?: string;
  }): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      
      const userData = {
        uid,
        email: userInfo.email,
        displayName: userInfo.displayName,
        photoURL: userInfo.photoURL,
        provider: userInfo.provider,
        ...(userInfo.appleId && { appleId: userInfo.appleId }),
        ...(userInfo.googleId && { googleId: userInfo.googleId }),
        ...(userInfo.kakaoId && { kakaoId: userInfo.kakaoId }),
        isRegistrationComplete: false, // 추가 정보 입력 필요
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData);
      logger.firebaseOperation('create_user_document', 'users', true, undefined, uid);
    } catch (error) {
      logger.firebaseOperation('create_user_document', 'users', false, error, uid);
      throw error;
    }
  }

  /**
   * 사용자 문서 생성 또는 업데이트 (upsert)
   */
  async upsertUserDocument(uid: string, userInfo: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    provider: 'apple' | 'google' | 'kakao';
    appleId?: string;
    googleId?: string;
    kakaoId?: string;
  }): Promise<void> {
    try {
      const exists = await this.checkUserDocumentExists(uid);
      
      if (!exists) {
        await this.createUserDocument(uid, userInfo);
      } else {
        // 기존 문서가 있으면 기본 정보만 업데이트
        // undefined 값들을 제거하여 Firebase 에러 방지
        const updateData: any = {
          updatedAt: serverTimestamp(),
        };
        
        if (userInfo.email !== undefined) updateData.email = userInfo.email;
        if (userInfo.displayName !== undefined) updateData.displayName = userInfo.displayName;
        if (userInfo.photoURL !== undefined) updateData.photoURL = userInfo.photoURL;
        
        const userDocRef = doc(this.db, 'users', uid);
        await updateDoc(userDocRef, updateData);
        console.log('✅ 기존 사용자 문서 업데이트 완료:', uid);
      }
    } catch (error) {
      console.error('❌ 사용자 문서 upsert 실패:', error);
      throw error;
    }
  }

  /**
   * 회원가입 완료 처리 (추가 정보 저장)
   */
  async completeRegistration(uid: string, additionalInfo: { phoneNumber: string; address: string }): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      
      await updateDoc(userDocRef, {
        phoneNumber: additionalInfo.phoneNumber,
        address: additionalInfo.address,
        isRegistrationComplete: true,
        updatedAt: serverTimestamp(),
      });
      
      console.log('회원가입 완료 처리:', uid);
    } catch (error) {
      console.error('회원가입 완료 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 프로필 조회
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid,
          email: data?.email,
          displayName: data?.displayName,
          realName: data?.realName,
          photoURL: data?.photoURL,
          provider: data?.provider,
          kakaoId: data?.kakaoId,
          appleId: data?.appleId,
          googleId: data?.googleId,
          phoneNumber: data?.phoneNumber,
          address: data?.address,
          isRegistrationComplete: data?.isRegistrationComplete ?? false,
          createdAt: data?.createdAt?.toDate(),
          updatedAt: data?.updatedAt?.toDate(),
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('사용자 프로필 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 마지막 로그인 시간 업데이트
   */
  async updateUserLastLogin(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ 마지막 로그인 시간 업데이트:', uid);
    } catch (error) {
      console.error('❌ 마지막 로그인 시간 업데이트 실패:', error);
    }
  }

  /**
   * 카카오 ID로 사용자 검색
   */
  async getUserByKakaoId(kakaoId: string): Promise<UserProfile | null> {
    try {
      const q = query(
        this.usersCollectionRef, 
        where('kakaoId', '==', kakaoId), 
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        if (!doc) return null;
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          provider: data.provider,
          kakaoId: data.kakaoId,
          createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt 
            ? (data.createdAt as any).toDate() 
            : data.createdAt instanceof Date 
              ? data.createdAt 
              : new Date(),
          updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt 
            ? (data.updatedAt as any).toDate() 
            : data.updatedAt instanceof Date 
              ? data.updatedAt 
              : new Date(),
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('카카오 ID로 사용자 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 프로필 삭제
   */
  async deleteUserProfile(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.db, 'users', uid);
      await deleteDoc(userDocRef);
      console.log('사용자 프로필 삭제 완료:', uid);
    } catch (error) {
      console.error('사용자 프로필 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * Firebase Authentication에 커스텀 토큰으로 로그인
   */
  async signInWithCustomToken(token: string): Promise<void> {
    try {
      await signInWithCustomToken(this.auth, token);
      console.log('Firebase 커스텀 토큰 로그인 완료');
    } catch (error) {
      console.error('Firebase 커스텀 토큰 로그인 실패:', error);
      throw error;
    }
  }

  /**
   * Firebase Authentication 로그아웃 (현재 사용자가 있는 경우에만)
   */
  async signOut(): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        await signOut(this.auth);
        console.log('Firebase 로그아웃 완료');
      } else {
        console.log('Firebase에 로그인된 사용자가 없음 - 로그아웃 스킵');
      }
    } catch (error) {
      console.error('Firebase 로그아웃 실패:', error);
      // Firebase 로그아웃 실패해도 앱 상태는 로그아웃으로 처리
      console.log('Firebase 로그아웃 실패했지만 앱 로그아웃은 계속 진행');
    }
  }

  /**
   * 현재 Firebase Authentication 사용자 조회
   */
  getCurrentFirebaseUser() {
    return this.auth.currentUser;
  }

  /**
   * 사용자 계정 완전 삭제 (탈퇴)
   */
  async deleteUserAccount(uid: string): Promise<void> {
    try {
      console.log('사용자 계정 삭제 시작:', uid);
      
      // 1. Firestore에서 사용자 문서 삭제
      const userDocRef = doc(this.db, 'users', uid);
      await deleteDoc(userDocRef);
      console.log('Firestore 사용자 문서 삭제 완료:', uid);
      
      // 2. Firebase Auth에서 사용자 삭제 (로그인되어 있는 경우)
      const currentUser = this.auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        await currentUser.delete();
        console.log('Firebase Auth 사용자 삭제 완료:', uid);
      }
      
      console.log('✅ 사용자 계정 삭제 완료:', uid);
    } catch (error) {
      console.error('❌ 사용자 계정 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 인증 상태 테스트 (디버깅용)
   */
  async testAuth(): Promise<any> {
    try {
      console.log('🧪 인증 상태 테스트 시작...');
      
      // 인증 상태 확인
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('사용자가 로그인되지 않았습니다.');
      }
      
      console.log('👤 현재 인증된 사용자:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      });
      
      // 토큰 강제 갱신
      console.log('🔄 인증 토큰 강제 갱신...');
      const idToken = await currentUser.getIdToken(true);
      console.log('✅ 갱신된 토큰 길이:', idToken.length);
      
      if (!idToken) {
        throw new Error('인증 토큰 갱신에 실패했습니다. 다시 로그인해주세요.');
      }
      
      // HTTP 직접 호출로 변경
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/testAuth`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      const result = response.data;
      console.log('✅ 인증 테스트 결과:', result);
      return result;
    } catch (error: any) {
      console.error('❌ 인증 테스트 실패:', error);
      throw error;
    }
  }

  /**
   * 진단 예약 생성 (강화된 Custom Token으로 Firebase Functions 사용)
   */
  async createDiagnosisReservation(reservationData: Omit<DiagnosisReservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('🌩️ 강화된 Custom Token으로 Firebase Functions 호출:', reservationData);
      
      // 인증 상태 확인
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('사용자가 로그인되지 않았습니다.');
      }
      
      console.log('👤 현재 인증된 사용자:', {
        uid: currentUser.uid,
        email: currentUser.email,
        isAnonymous: currentUser.isAnonymous,
        providerId: currentUser.providerId
      });
      
      // 인증 토큰 새로고침 및 검증
      try {
        const idToken = await currentUser.getIdToken(true);
        console.log('🔑 강화된 인증 토큰 새로고침 완료, 토큰 길이:', idToken.length);
        
        // 토큰을 디코딩해서 claims 확인 (디버깅용)
        try {
          const tokenPayload = JSON.parse(atob(idToken?.split('.')[1] || ''));
          console.log('🔍 토큰 Claims 확인:', {
            provider: tokenPayload.provider || 'N/A',
            kakaoId: tokenPayload.kakaoId || 'N/A',
            canCreateReservation: tokenPayload.canCreateReservation || 'N/A',
            role: tokenPayload.role || 'N/A'
          });
        } catch (decodeError) {
          console.log('⚠️ 토큰 디코딩 실패 (정상적일 수 있음)');
        }
        
        if (!idToken || idToken.length < 100) {
          throw new Error('유효하지 않은 인증 토큰');
        }
      } catch (tokenError: any) {
        console.error('❌ 인증 토큰 새로고침 실패:', tokenError.message);
        throw new Error('인증 토큰 갱신에 실패했습니다. 다시 로그인해주세요.');
      }
      
      // HTTP 함수로 직접 요청
      const idToken = await currentUser.getIdToken(true);
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/createDiagnosisReservation`,
        reservationData,
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15초 타임아웃
        }
      );
      
      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || '진단 예약 생성 실패');
      }

      logger.reservation('create', data.reservationId, 'pending', currentUser.uid);
      return data.reservationId;
    } catch (error: any) {
      logger.reservation('create_failed', undefined, 'error', this.auth.currentUser?.uid, { error: error.message });
      console.error('🔍 에러 상세 정보:', {
        code: error.code,
        message: error.message,
        details: error.details,
        customData: error.customData,
        name: error.name
      });
      
      // 인증 오류 시 재시도 또는 폴백
      if (error.code === 'functions/unauthenticated') {
        console.error('🚨 강화된 토큰에도 인증 오류 발생 - 로그 확인 필요');
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
      
      throw error;
    }
  }

  /**
   * 사용자의 진단 예약 목록 조회 (클라이언트 측 직접 접근)
   */
  async getUserDiagnosisReservations(userId: string): Promise<DiagnosisReservation[]> {
    try {
      console.log('📱 클라이언트에서 사용자 진단 예약 목록 조회:', userId);
      
      // 현재 로그인한 사용자만 자신의 예약을 조회할 수 있도록 체크
      if (!this.auth.currentUser || this.auth.currentUser.uid !== userId) {
        throw new Error('접근 권한이 없습니다.');
      }

      const reservationsRef = collection(this.db, 'diagnosisReservations');
      const q = query(
        reservationsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const reservations = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          requestedDate: data.requestedDate?.toDate?.()?.toISOString(),
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
        } as DiagnosisReservation;
      });

      logger.firebaseOperation('get_user_reservations', 'diagnosisReservations', true, undefined, userId);
      return reservations;
    } catch (error: any) {
      logger.firebaseOperation('get_user_reservations', 'diagnosisReservations', false, error, userId);
      throw error;
    }
  }

  /**
   * 진단 예약 상태 업데이트
   */
  async updateDiagnosisReservationStatus(reservationId: string, status: DiagnosisReservation['status'], adminNotes?: string): Promise<void> {
    try {
      console.log('진단 예약 상태 업데이트:', reservationId, status);
      
      const reservationRef = doc(this.db, 'diagnosisReservations', reservationId);
      
      const updateData: Partial<DiagnosisReservation> = {
        status,
        updatedAt: serverTimestamp(),
      };
      
      if (adminNotes) {
        updateData.adminNotes = adminNotes;
      }
      
      await updateDoc(reservationRef, updateData);
      
      console.log('✅ 진단 예약 상태 업데이트 완료:', reservationId, status);
    } catch (error) {
      console.error('❌ 진단 예약 상태 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 진단 예약 취소
   */
  async cancelDiagnosisReservation(reservationId: string, reason?: string): Promise<void> {
    try {
      console.log('진단 예약 취소:', reservationId);
      
      await this.updateDiagnosisReservationStatus(reservationId, 'cancelled', reason);
      
      console.log('✅ 진단 예약 취소 완료:', reservationId);
    } catch (error) {
      console.error('❌ 진단 예약 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 예약 수정/취소 가능 여부 확인
   */
  canModifyReservation(reservation: DiagnosisReservation): {
    canModify: boolean;
    canCancel: boolean;
    reason?: string;
  } {
    const now = new Date();
    const reservationDate = reservation.requestedDate instanceof Date 
      ? reservation.requestedDate 
      : reservation.requestedDate && typeof reservation.requestedDate === 'object' && 'toDate' in reservation.requestedDate
        ? (reservation.requestedDate as any).toDate()
        : new Date();
    
    // 예약 시간 2시간 전 계산
    const twoHoursBefore = new Date(reservationDate.getTime() - 2 * 60 * 60 * 1000);
    const isPastDeadline = now >= twoHoursBefore;
    
    switch (reservation.status) {
      case 'pending':
        return { canModify: true, canCancel: true };
        
      case 'confirmed':
        if (isPastDeadline) {
          return { 
            canModify: false, 
            canCancel: false, 
            reason: '예약 시간 2시간 전까지만 수정/취소 가능합니다.' 
          };
        }
        return { canModify: true, canCancel: true };
        
      case 'in_progress':
        return { 
          canModify: false, 
          canCancel: false, 
          reason: '진행 중인 예약은 수정/취소할 수 없습니다.' 
        };
        
      case 'completed':
        return { 
          canModify: false, 
          canCancel: false, 
          reason: '완료된 예약은 수정/취소할 수 없습니다.' 
        };
        
      case 'cancelled':
        return { 
          canModify: false, 
          canCancel: false, 
          reason: '이미 취소된 예약입니다.' 
        };
        
      default:
        return { canModify: false, canCancel: false };
    }
  }

  /**
   * 예약 정보 수정
   */
  async updateDiagnosisReservation(
    reservationId: string, 
    updateData: Partial<Pick<DiagnosisReservation, 
      'address' | 'detailAddress' | 'latitude' | 'longitude' | 'requestedDate' | 'notes'
    >>
  ): Promise<void> {
    try {
      console.log('🔧 진단 예약 수정 시작:', reservationId);
      console.log('📝 수정 데이터:', JSON.stringify(updateData, null, 2));
      
      // requestedDate 로깅 강화
      if (updateData.requestedDate) {
        console.log('🕐 수정할 날짜/시간:');
        console.log('  - 원본 값:', updateData.requestedDate);
        console.log('  - 타입:', typeof updateData.requestedDate);
        console.log('  - Date 객체 여부:', updateData.requestedDate instanceof Date);
        console.log('  - ISO 문자열:', updateData.requestedDate instanceof Date ? updateData.requestedDate.toISOString() : 'N/A');
        console.log('  - 로컬 문자열:', updateData.requestedDate instanceof Date ? updateData.requestedDate.toLocaleString('ko-KR') : 'N/A');
      }
      
      const reservationRef = doc(this.diagnosisReservationsRef, reservationId);
      
      // undefined 값들을 제거하여 Firebase 에러 방지
      const cleanedUpdateData: any = {};
      Object.keys(updateData).forEach(key => {
        const value = updateData[key as keyof typeof updateData];
        if (value !== undefined) {
          cleanedUpdateData[key] = value;
        }
      });
      
      const finalUpdateData = {
        ...cleanedUpdateData,
        updatedAt: serverTimestamp(),
      };
      
      console.log('🚀 Firebase로 전송할 최종 데이터:', JSON.stringify(finalUpdateData, null, 2));
      
      await updateDoc(reservationRef, finalUpdateData);
      
      console.log('✅ 진단 예약 수정 완료:', reservationId);
    } catch (error) {
      console.error('❌ 진단 예약 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 진단 리포트 업로드 (파일과 함께)
   */
  async uploadDiagnosisReport(reportData: {
    userId: string;
    title: string;
    description?: string;
    files: Array<{
      uri: string;
      name: string;
      type: string;
      size: number;
    }>;
    status: 'uploaded' | 'processing' | 'completed';
    createdAt: Date;
  }): Promise<string> {
    try {
      console.log('📄 진단 리포트 업로드 시작:', reportData.title);
      
      const reportId = doc(this.diagnosisReportsRef).id;
      
      // 파일들을 Firebase Storage에 업로드
      const uploadedFiles: DiagnosisReportFile[] = [];
      
      for (const file of reportData.files) {
        try {
          // 파일을 Blob으로 변환
          const response = await fetch(file.uri);
          const blob = await response.blob();
          
          // Storage 경로 생성
          const fileName = `${Date.now()}_${file.name}`;
          const storageRef = ref(this.storage, `diagnosisReports/${reportData.userId}/${reportId}/${fileName}`);
          
          // 파일 업로드
          await uploadBytes(storageRef, blob);
          
          // 다운로드 URL 가져오기
          const downloadURL = await getDownloadURL(storageRef);
          
          uploadedFiles.push({
            name: file.name,
            url: downloadURL,
            type: file.type,
            size: file.size,
          });
          
          console.log('✅ 파일 업로드 완료:', file.name);
        } catch (fileError) {
          console.error('❌ 파일 업로드 실패:', file.name, fileError);
          throw new Error(`파일 업로드 실패: ${file.name}`);
        }
      }
      
      // Firestore에 리포트 정보 저장
      const now = serverTimestamp();
      const reportDocRef = doc(this.diagnosisReportsRef, reportId);
      
      await setDoc(reportDocRef, {
        id: reportId,
        userId: reportData.userId,
        title: reportData.title,
        description: reportData.description || '',
        files: uploadedFiles,
        status: reportData.status,
        createdAt: now,
        updatedAt: now,
      });
      
      console.log('✅ 진단 리포트 업로드 완료:', reportId);
      return reportId;
    } catch (error) {
      console.error('❌ 진단 리포트 업로드 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 진단 리포트 목록 조회
   */
  async getUserDiagnosisReports(userId: string): Promise<DiagnosisReport[]> {
    try {
      console.log('📄 사용자 진단 리포트 목록 조회:', userId);
      
      const q = query(
        this.diagnosisReportsRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const reports: DiagnosisReport[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          description: data.description,
          files: data.files,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      
      // 최신순 정렬
      reports.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('✅ 진단 리포트 목록 조회 완료:', reports.length, '개');
      return reports;
    } catch (error) {
      console.error('❌ 진단 리포트 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 진단 리포트 상세 조회
   */
  async getDiagnosisReport(reportId: string): Promise<DiagnosisReport | null> {
    try {
      console.log('📄 진단 리포트 상세 조회:', reportId);
      
      const reportDocRef = doc(this.diagnosisReportsRef, reportId);
      const reportDoc = await getDoc(reportDocRef);
      
      if (!reportDoc.exists()) {
        console.log('진단 리포트를 찾을 수 없음:', reportId);
        return null;
      }
      
      const data = reportDoc.data();
      const report: DiagnosisReport = {
        id: reportDoc.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        files: data.files,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
      
      console.log('✅ 진단 리포트 상세 조회 완료:', report.title);
      return report;
    } catch (error) {
      console.error('❌ 진단 리포트 상세 조회 실패:', error);
      throw error;
    }
  }

  // 스케줄 설정 관련 메서드들
  async getScheduleSettings(): Promise<ScheduleSettings> {
    try {
      // 캐시 확인
      const now = Date.now();
      if (
        this.scheduleSettingsCache && 
        (now - this.scheduleSettingsCacheTime) < this.CACHE_DURATION
      ) {
        return this.scheduleSettingsCache;
      }
      
      console.log('📅 스케줄 설정 조회 중...');
      
      const docSnap = await getDoc(doc(this.settingsRef, 'schedule'));
      
      let settings: ScheduleSettings;
      
      if (docSnap.exists()) {
        settings = docSnap.data() as ScheduleSettings;
        console.log('✅ 스케줄 설정 조회 완료');
      } else {
        // 기본 스케줄 설정
        settings = {
          workingDays: [1, 2, 3, 4, 5], // 월-금
          workingHours: {
            start: '09:00',
            end: '18:00',
          },
          unavailableSlots: [],
        };
        console.log('📅 기본 스케줄 설정 반환');
      }
      
      // 캐시에 저장
      this.scheduleSettingsCache = settings;
      this.scheduleSettingsCacheTime = now;
      
      return settings;
    } catch (error) {
      console.error('❌ 스케줄 설정 조회 실패:', error);
      throw error;
    }
  }

  async isTimeSlotAvailable(date: Date, timeSlot: string, excludeReservationId?: string): Promise<boolean> {
    try {
      const settings = await this.getScheduleSettings();
      
      // 운영 요일 확인
      const dayOfWeek = date.getDay();
      if (!settings.workingDays.includes(dayOfWeek)) {
        return false;
      }
      
      // 운영 시간 확인
      const hourParts = timeSlot.split(':').map(Number);
      const startHourParts = settings.workingHours.start.split(':').map(Number);
      const endHourParts = settings.workingHours.end.split(':').map(Number);
      
      const hour = hourParts[0];
      const startHour = startHourParts[0];
      const endHour = endHourParts[0];
      
      if (!hour || !startHour || !endHour || hour < startHour || hour >= endHour) {
        return false;
      }
      
      // 예약 불가 시간 확인
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const unavailableSlot = settings.unavailableSlots.find(slot => slot.date === dateString);
      
      if (unavailableSlot && unavailableSlot.timeSlots.includes(timeSlot)) {
        return false;
      }
      
      // 실제 예약된 시간 슬롯 확인
      const targetDateTime = new Date(date);
      if (typeof hour === 'number') {
        targetDateTime.setHours(hour, 0, 0, 0);
      }
      
      // 해당 시간에 예약된 건이 있는지 확인
      const reservationsRef = collection(this.db, 'diagnosisReservations');
      const reservationQuery = query(
        reservationsRef,
        where('requestedDate', '==', Timestamp.fromDate(targetDateTime)),
        where('status', 'in', ['pending', 'confirmed'])
      );
      
      const querySnapshot = await getDocs(reservationQuery);
      
      // 수정 중인 예약 제외하고 확인
      const conflictingReservations = querySnapshot.docs.filter(doc => {
        if (excludeReservationId && doc.id === excludeReservationId) {
          return false; // 현재 수정 중인 예약은 제외
        }
        return true;
      });
      
      // 예약이 있으면 사용 불가
      if (conflictingReservations.length > 0) {
        console.log(`🚫 시간 슬롯 ${timeSlot} 이미 예약됨:`, conflictingReservations.length, '건');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ 시간 슬롯 가용성 확인 실패:', error);
      return false;
    }
  }

  async getAvailableTimeSlots(date: Date): Promise<string[]> {
    try {
      const settings = await this.getScheduleSettings();
      
      // 운영 요일 확인
      const dayOfWeek = date.getDay();
      if (!settings.workingDays.includes(dayOfWeek)) {
        return [];
      }
      
      // 운영 시간 내 모든 시간 슬롯 생성
      const startHourParts = settings.workingHours.start.split(':').map(Number);
      const endHourParts = settings.workingHours.end.split(':').map(Number);
      
      const startHour = startHourParts[0];
      const endHour = endHourParts[0];
      
      if (typeof startHour !== 'number' || typeof endHour !== 'number') {
        return [];
      }
      
      const allSlots: string[] = [];
      for (let hour = startHour; hour < endHour; hour++) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      }
      
      // 예약 불가 시간 제외
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const unavailableSlot = settings.unavailableSlots.find(slot => slot.date === dateString);
      
      if (unavailableSlot) {
        return allSlots.filter(slot => !unavailableSlot.timeSlots.includes(slot));
      }
      
      return allSlots;
    } catch (error) {
      console.error('❌ 가용 시간 슬롯 조회 실패:', error);
      return [];
    }
  }

  // Vehicle Diagnosis Reports
  async getVehicleDiagnosisReport(reportId: string): Promise<VehicleDiagnosisReport | null> {
    try {
      const docSnap = await getDoc(doc(this.vehicleDiagnosisReportsRef, reportId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          diagnosisDate: data.diagnosisDate && typeof data.diagnosisDate === 'object' && 'toDate' in data.diagnosisDate 
            ? (data.diagnosisDate as any).toDate() 
            : data.diagnosisDate instanceof Date 
              ? data.diagnosisDate 
              : new Date(),
          createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt 
            ? (data.createdAt as any).toDate() 
            : data.createdAt instanceof Date 
              ? data.createdAt 
              : new Date(),
          updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt 
            ? (data.updatedAt as any).toDate() 
            : data.updatedAt instanceof Date 
              ? data.updatedAt 
              : new Date(),
        } as VehicleDiagnosisReport;
      }
      return null;
    } catch (error) {
      console.error('❌ 차량 진단 리포트 조회 실패:', error);
      throw error;
    }
  }

  async getUserVehicleDiagnosisReports(userId: string): Promise<VehicleDiagnosisReport[]> {
    try {
      const q = query(
        this.vehicleDiagnosisReportsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          diagnosisDate: data.diagnosisDate && typeof data.diagnosisDate === 'object' && 'toDate' in data.diagnosisDate 
            ? (data.diagnosisDate as any).toDate() 
            : data.diagnosisDate instanceof Date 
              ? data.diagnosisDate 
              : new Date(),
          createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt 
            ? (data.createdAt as any).toDate() 
            : data.createdAt instanceof Date 
              ? data.createdAt 
              : new Date(),
          updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt 
            ? (data.updatedAt as any).toDate() 
            : data.updatedAt instanceof Date 
              ? data.updatedAt 
              : new Date(),
        } as VehicleDiagnosisReport;
      });
    } catch (error) {
      console.error('❌ 사용자 차량 진단 리포트 조회 실패:', error);
      throw error;
    }
  }

  async getReservationVehicleDiagnosisReport(reservationId: string): Promise<VehicleDiagnosisReport | null> {
    try {
      const q = query(
        this.vehicleDiagnosisReportsRef,
        where('reservationId', '==', reservationId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        if (!docData) return null;
        const data = docData.data();
        return {
          id: docData.id,
          ...data,
          diagnosisDate: data.diagnosisDate && typeof data.diagnosisDate === 'object' && 'toDate' in data.diagnosisDate 
            ? (data.diagnosisDate as any).toDate() 
            : data.diagnosisDate instanceof Date 
              ? data.diagnosisDate 
              : new Date(),
          createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt 
            ? (data.createdAt as any).toDate() 
            : data.createdAt instanceof Date 
              ? data.createdAt 
              : new Date(),
          updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt 
            ? (data.updatedAt as any).toDate() 
            : data.updatedAt instanceof Date 
              ? data.updatedAt 
              : new Date(),
        } as VehicleDiagnosisReport;
      }
      return null;
    } catch (error) {
      console.error('❌ 예약별 차량 진단 리포트 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 푸시 토큰 저장 (Firebase Functions 사용)
   */
  async saveUserPushToken(userId: string, pushToken: string): Promise<void> {
    try {
      // 현재 사용자 확인 및 토큰 갱신
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('⚠️ 인증된 사용자가 없어 푸시 토큰 저장 건너뜀');
        return;
      }
      
      // ID 토큰 갱신 (Functions 호출 전 필수)
      try {
        await currentUser.getIdToken(true);
        console.log('✅ 푸시 토큰 저장을 위한 ID Token 갱신 완료');
      } catch (tokenError) {
        console.log('⚠️ ID Token 갱신 실패, 기존 토큰으로 시도:', tokenError);
      }
      
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/savePushToken`,
        { pushToken },
        {
          headers: {
            'Authorization': `Bearer ${await currentUser.getIdToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      if (response.data.success) {
        console.log('✅ 사용자 푸시 토큰 저장 완료:', userId);
      } else {
        throw new Error(response.data.error || '푸시 토큰 저장 실패');
      }
    } catch (error) {
      console.error('❌ 사용자 푸시 토큰 저장 실패:', error);
      // 에러를 throw하지 않고 로그만 남김 (앱 중단 방지)
      // throw error;
    }
  }

  /**
   * 수동 푸시 알림 전송 (관리자용)
   */
  async sendPushNotification(userIds: string[], title: string, body: string, data?: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/sendPushNotification`,
        {
          userIds,
          title,
          body,
          data: data || {}
        },
        {
          headers: {
            'Authorization': `Bearer ${await this.getIdToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      if (response.data.success) {
        console.log('✅ 푸시 알림 전송 완료:', response.data.message);
        return response.data;
      } else {
        throw new Error(response.data.error || '푸시 알림 전송 실패');
      }
    } catch (error) {
      console.error('❌ 푸시 알림 전송 실패:', error);
      throw error;
    }
  }

  /**
   * 푸시 토큰이 있는 사용자 목록 조회 (관리자용)
   */
  async getUsersWithPushTokens(): Promise<any> {
    try {
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/getUsersWithPushTokens`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${await this.getIdToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      
      if (response.data.success) {
        console.log('✅ 사용자 목록 조회 완료:', response.data.message);
        return response.data;
      } else {
        throw new Error(response.data.error || '사용자 목록 조회 실패');
      }
    } catch (error) {
      console.error('❌ 사용자 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 알림 설정 저장
   */
  async saveUserNotificationSettings(userId: string, settings: any): Promise<void> {
    try {
      const userDoc = doc(this.usersCollectionRef, userId);
      // setDoc with merge를 사용해서 문서가 없어도 생성되도록
      await setDoc(userDoc, {
        notificationSettings: settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log('✅ 사용자 알림 설정 저장 완료:', userId);
    } catch (error) {
      console.error('❌ 사용자 알림 설정 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 알림 설정 조회
   */
  async getUserNotificationSettings(userId: string): Promise<any | null> {
    try {
      const userDoc = doc(this.usersCollectionRef, userId);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.notificationSettings || null;
      }
      return null;
    } catch (error) {
      console.error('❌ 사용자 알림 설정 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 푸시 토큰 조회
   */
  async getUserPushToken(userId: string): Promise<string | null> {
    try {
      const userDoc = doc(this.usersCollectionRef, userId);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.pushToken || null;
      }
      return null;
    } catch (error) {
      console.error('❌ 사용자 푸시 토큰 조회 실패:', error);
      throw error;
    }
  }

  // === 사용자 차량 관리 메서드들 ===

  /**
   * 사용자 차량 추가 (클라이언트 측 직접 접근)
   */
  async addUserVehicle(vehicleData: Omit<UserVehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('📱 클라이언트에서 사용자 차량 추가 시작:', vehicleData);
      
      // 현재 로그인한 사용자만 차량을 추가할 수 있도록 체크
      if (!this.auth.currentUser || this.auth.currentUser.uid !== vehicleData.userId) {
        throw new Error('접근 권한이 없습니다.');
      }

      const now = serverTimestamp();
      const vehicleRef = doc(collection(this.db, 'userVehicles'));
      
      // undefined 값들을 제거하여 Firebase 에러 방지
      const cleanVehicleData: any = {};
      Object.entries(vehicleData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanVehicleData[key] = value;
        }
      });

      const completeVehicleData = {
        ...cleanVehicleData,
        createdAt: now,
        updatedAt: now,
      };
      
      await setDoc(vehicleRef, completeVehicleData);
      
      logger.vehicle('add', { make: vehicleData.make, model: vehicleData.model, year: vehicleData.year }, vehicleData.userId);
      return vehicleRef.id;
    } catch (error: any) {
      logger.vehicle('add_failed', { make: vehicleData.make, model: vehicleData.model }, vehicleData.userId, { error: error.message });
      throw error;
    }
  }


  /**
   * 사용자의 차량 목록 조회 (클라이언트 측 직접 접근)
   */
  async getUserVehicles(userId: string): Promise<UserVehicle[]> {
    try {
      console.log('📱 클라이언트에서 사용자 차량 목록 조회 시작:', userId);
      
      // 현재 로그인한 사용자만 자신의 차량을 조회할 수 있도록 체크
      if (!this.auth.currentUser || this.auth.currentUser.uid !== userId) {
        console.log('❌ 접근 권한 없음. currentUser:', this.auth.currentUser?.uid, 'requestedUserId:', userId);
        throw new Error('접근 권한이 없습니다.');
      }

      console.log('🔍 Firestore 쿼리 생성 중...');
      const vehiclesRef = collection(this.db, 'userVehicles');
      const q = query(
        vehiclesRef, 
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      console.log('📤 Firestore 쿼리 실행 중...');
      const querySnapshot = await getDocs(q);
      console.log('📥 Firestore 쿼리 결과:', querySnapshot.size, '개 문서');
      
      const vehicles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
        } as UserVehicle;
      });

      logger.firebaseOperation('get_user_vehicles', 'userVehicles', true, undefined, userId);
      return vehicles;
    } catch (error: any) {
      logger.firebaseOperation('get_user_vehicles', 'userVehicles', false, error, userId);
      throw error;
    }
  }

  /**
   * 사용자의 활성 차량 조회 (Cloud Function 사용)
   */
  async getUserActiveVehicle(userId: string): Promise<UserVehicle | null> {
    try {
      console.log('🌩️ Cloud Function으로 사용자 활성 차량 조회:', userId);
      
      const response = await axios.post(
        `${this.CLOUD_FUNCTION_URL}/getUserActiveVehicle`,
        { userId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getIdToken()}`,
          },
          timeout: 15000,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || '사용자 활성 차량 조회 실패');
      }

      console.log('✅ Cloud Function 사용자 활성 차량 조회 완료');
      return response.data.activeVehicle;
    } catch (error: any) {
      console.error('❌ Cloud Function 사용자 활성 차량 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 모든 차량 비활성화
   */
  async deactivateUserVehicles(userId: string): Promise<void> {
    try {
      const q = query(
        collection(this.db, 'userVehicles'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map(doc =>
        updateDoc(doc.ref, { isActive: false, updatedAt: serverTimestamp() })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('❌ 차량 비활성화 실패:', error);
      throw error;
    }
  }

  /**
   * 차량 정보 업데이트
   */
  async updateUserVehicle(
    vehicleId: string, 
    updateData: Partial<Pick<UserVehicle, 'nickname' | 'isActive' | 'make' | 'model' | 'year' | 'batteryCapacity' | 'range'>>
  ): Promise<void> {
    try {
      console.log('🚗 차량 정보 업데이트:', vehicleId, updateData);
      
      // 활성 차량으로 설정하는 경우, 기존 활성 차량 비활성화
      if (updateData.isActive === true) {
        const vehicleDoc = await getDoc(doc(this.db, 'userVehicles', vehicleId));
        if (vehicleDoc.exists()) {
          const vehicleData = vehicleDoc.data() as UserVehicle;
          await this.deactivateUserVehicles(vehicleData.userId);
        }
      }
      
      // undefined 값들을 제거하여 Firebase 에러 방지
      const cleanUpdateData: any = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanUpdateData[key] = value;
        }
      });

      const vehicleRef = doc(this.db, 'userVehicles', vehicleId);
      await updateDoc(vehicleRef, {
        ...cleanUpdateData,
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ 차량 정보 업데이트 완료:', vehicleId);
    } catch (error) {
      console.error('❌ 차량 정보 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 차량 삭제
   */
  async deleteUserVehicle(vehicleId: string): Promise<void> {
    try {
      console.log('🚗 사용자 차량 삭제:', vehicleId);
      
      const vehicleRef = doc(this.db, 'userVehicles', vehicleId);
      await deleteDoc(vehicleRef);
      
      console.log('✅ 사용자 차량 삭제 완료:', vehicleId);
    } catch (error) {
      console.error('❌ 사용자 차량 삭제 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
export const firebaseService = new FirebaseService();
export default firebaseService;