import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading } from '../store/slices/authSlice';
import { RootState } from '../store';
// import userService from '../services/userService'; // Firebase Functions 문제로 임시 제거
import firebaseService from '../services/firebaseService';
import { getAuth, signOut } from 'firebase/auth';
import logger from '../services/logService';
import analyticsService from '../services/analyticsService';

interface User {
  uid: string;
  email?: string | undefined;
  displayName?: string | undefined;
  photoURL?: string | undefined;
  kakaoId?: string;
  googleId?: string;
  provider?: 'kakao' | 'google' | 'apple';
}

// 프로바이더별 기본 displayName 설정 함수
const getDefaultDisplayName = (provider: string, email?: string | null): string => {
  if (email) {
    return email.split('@')[0];
  }
  switch (provider) {
    case 'apple':
      return 'Apple 사용자';
    case 'google':
      return 'Google 사용자';
    case 'kakao':
      return '카카오 사용자';
    default:
      return '사용자';
  }
};

const AuthProvider: React.FC = () => {
  const dispatch = useDispatch();
  const { autoLoginEnabled, user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const autoLoginEnabledRef = useRef(autoLoginEnabled);
  const [isReady, setIsReady] = useState(false);
  
  console.log('🔐 AuthProvider 렌더링됨:', { autoLoginEnabled, isAuthenticated, userUid: user?.uid });

  // autoLoginEnabled 값이 변경될 때마다 ref 업데이트
  useEffect(() => {
    autoLoginEnabledRef.current = autoLoginEnabled;
  }, [autoLoginEnabled]);

  // Redux persist 복원 완료를 기다리는 초기화 지연
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔐 AuthProvider 초기화 준비 완료');
      setIsReady(true);
    }, 100); // 짧은 지연으로 Redux persist 완료 대기
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    
    console.log('🔐 AuthProvider 초기화 (한 번만 실행), autoLoginEnabled:', autoLoginEnabledRef.current);
    
    let isComponentMounted = true; // 컴포넌트 마운트 상태 추적
    
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      // 컴포넌트가 언마운트된 경우 처리하지 않음
      if (!isComponentMounted) {
        console.log('🔐 AuthProvider 언마운트됨, Auth 상태 변화 무시');
        return;
      }
      const currentAutoLoginEnabled = autoLoginEnabledRef.current;
      console.log('🔥 Firebase Auth 상태 변화 감지:', firebaseUser ? `사용자 있음 (${firebaseUser.uid})` : '사용자 없음', 'autoLoginEnabled:', currentAutoLoginEnabled);
      try {
        dispatch(setLoading(true));
        
        if (firebaseUser && currentAutoLoginEnabled) {
          // Firebase에 사용자가 있고 자동 로그인이 활성화된 경우
          console.log('✅ Firebase 사용자 감지, 자동 로그인 처리 중...', firebaseUser.uid);
          
          // Redux에 이미 같은 사용자가 있다면 스킵
          if (user && user.uid === firebaseUser.uid && isAuthenticated) {
            console.log('⏭️ 이미 같은 사용자가 Redux에 있음, 자동 로그인 스킵');
            dispatch(setLoading(false));
            return;
          }
          
          // Firebase Auth에서 제공하는 정보로 사용자 객체 생성
          const provider = firebaseUser.providerData[0]?.providerId === 'apple.com' ? 'apple' : 
                         firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'kakao';
          
          // Firestore에서 실제 사용자 정보 가져오기 (필수)
          try {
            console.log('📱 Firestore에서 사용자 정보 조회 중...', firebaseUser.uid);
            const userDoc = await firebaseService.getUserProfile(firebaseUser.uid);
            
            if (userDoc) {
              const user: User = {
                uid: firebaseUser.uid,
                email: userDoc.email || firebaseUser.email || undefined,
                displayName: userDoc.displayName || userDoc.email?.split('@')[0] || 'Apple 사용자',
                photoURL: userDoc.photoURL || firebaseUser.photoURL || undefined,
                provider: provider,
                kakaoId: provider === 'kakao' ? userDoc.kakaoId : undefined,
                googleId: provider === 'google' ? userDoc.googleId : undefined,
              };
              
              dispatch(setUser(user));
              console.log('✅ 자동 로그인 성공, 사용자명:', user.displayName);
              logger.auth('auto_login_success', provider, true, undefined, firebaseUser.uid);
              
              // Analytics: 자동 로그인 추적
              analyticsService.logLogin(provider as 'kakao' | 'google' | 'email').catch((error) => {
                console.error('❌ 자동 로그인 Analytics 추적 실패:', error);
              });
            } else {
              // Firestore에 사용자 정보가 없으면 새로 생성
              console.log('⚠️ Firestore에 사용자 정보 없음, 새로 생성');
              const defaultDisplayName = firebaseUser.email?.split('@')[0] || `${provider}_user`;
              
              await firebaseService.saveUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: defaultDisplayName,
                provider: provider,
                photoURL: firebaseUser.photoURL || '',
                isRegistrationComplete: false,
                ...(provider === 'apple' && { appleId: firebaseUser.uid }),
                ...(provider === 'google' && { googleId: firebaseUser.uid }),
              });
              
              const user: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || undefined,
                displayName: defaultDisplayName,
                photoURL: firebaseUser.photoURL || undefined,
                provider: provider,
              };
              
              dispatch(setUser(user));
              console.log('✅ 자동 로그인 성공 (새 프로필 생성), 사용자명:', user.displayName);
            }
          } catch (error) {
            console.log('⚠️ Firestore 조회 실패, 기본값으로 처리:', error);
            
            // Firestore 실패시에도 로그인 처리
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              displayName: getDefaultDisplayName(provider, firebaseUser.email),
              photoURL: firebaseUser.photoURL || undefined,
              provider: provider,
            };
            
            dispatch(setUser(user));
          }
          
        } else if (firebaseUser && !currentAutoLoginEnabled) {
          // Firebase에 사용자가 있지만 자동 로그인이 비활성화된 경우
          // 이 경우에도 수동 로그인은 유지해야 함 (자동 로그인 != 로그인 금지)
          console.log('🔐 수동 로그인 사용자 인증 처리 중...');
          
          // Redux에 이미 같은 사용자가 있다면 스킵
          if (user && user.uid === firebaseUser.uid && isAuthenticated) {
            console.log('⏭️ 이미 같은 사용자가 Redux에 있음, 처리 스킵');
            dispatch(setLoading(false));
            return;
          }
          
          // 수동 로그인한 사용자도 정상적으로 인증 처리
          const provider = firebaseUser.providerData[0]?.providerId === 'apple.com' ? 'apple' : 
                         firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'kakao';
          
          try {
            console.log('📱 Firestore에서 사용자 정보 조회 중...', firebaseUser.uid);
            const userDoc = await firebaseService.getUserProfile(firebaseUser.uid);
            
            if (userDoc) {
              const user: User = {
                uid: firebaseUser.uid,
                email: userDoc.email || firebaseUser.email || undefined,
                displayName: userDoc.displayName || userDoc.email?.split('@')[0] || 'Apple 사용자',
                photoURL: userDoc.photoURL || firebaseUser.photoURL || undefined,
                provider: provider,
                kakaoId: provider === 'kakao' ? userDoc.kakaoId : undefined,
                googleId: provider === 'google' ? userDoc.googleId : undefined,
              };
              
              dispatch(setUser(user));
              console.log('✅ 수동 로그인 처리 완료, 사용자명:', user.displayName);
              logger.auth('manual_login_success', provider, true, undefined, firebaseUser.uid);
            } else {
              // Firestore에 사용자 정보가 없으면 새로 생성
              console.log('⚠️ Firestore에 사용자 정보 없음, 새로 생성');
              const defaultDisplayName = firebaseUser.email?.split('@')[0] || `${provider}_user`;
              
              await firebaseService.saveUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: defaultDisplayName,
                provider: provider,
                photoURL: firebaseUser.photoURL || '',
                isRegistrationComplete: false,
                ...(provider === 'apple' && { appleId: firebaseUser.uid }),
                ...(provider === 'google' && { googleId: firebaseUser.uid }),
              });
              
              const user: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || undefined,
                displayName: defaultDisplayName,
                photoURL: firebaseUser.photoURL || undefined,
                provider: provider,
              };
              
              dispatch(setUser(user));
              console.log('✅ 수동 로그인 처리 완료 (새 프로필 생성), 사용자명:', user.displayName);
            }
          } catch (error) {
            console.log('⚠️ Firestore 조회 실패, 기본값으로 처리:', error);
            
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              displayName: getDefaultDisplayName(provider, firebaseUser.email),
              photoURL: firebaseUser.photoURL || undefined,
              provider: provider,
            };
            
            dispatch(setUser(user));
          }
          
        } else {
          // Firebase에 사용자가 없는 경우
          console.log('👤 인증된 사용자 없음');
          dispatch(setUser(null));
        }
      } catch (error) {
        console.error('❌ 인증 상태 처리 중 오류:', error);
        dispatch(setUser(null));
        logger.auth('auth_state_error', 'unknown', false, error);
      } finally {
        dispatch(setLoading(false));
      }
    });

    return () => {
      isComponentMounted = false; // 컴포넌트 언마운트 표시
      console.log('🔐 AuthProvider 정리');
      unsubscribe();
    };
  }, [dispatch, isReady]); // isReady가 true가 되면 실행

  return null; // UI 렌더링 없음
};

export default AuthProvider;