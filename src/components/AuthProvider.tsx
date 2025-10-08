import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading } from '../store/slices/authSlice';
import { RootState } from '../store';
// import userService from '../services/userService'; // Firebase Functions 문제로 임시 제거
import firebaseService from '../services/firebaseService';
import { getAuth, signOut } from 'firebase/auth';
import { getApps } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../services/logService';
import analyticsService from '../services/analyticsService';
import authPersistenceService from '../services/authPersistenceService';
import { devLog } from '../utils/devLog';

interface User {
  uid: string;
  email?: string | undefined;
  displayName?: string | undefined;
  realName?: string | undefined; // 실명 필드 추가
  photoURL?: string | undefined;
  kakaoId?: string;
  googleId?: string;
  appleId?: string; // Apple ID 필드 추가
  provider?: 'kakao' | 'google' | 'apple';
}

// 프로바이더별 기본 displayName 설정 함수
const getDefaultDisplayName = (provider: string, email?: string | null): string => {
  if (email) {
    return email.split('@')[0] || 'user';
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
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 로그아웃 상태 추적
  
  devLog.log('🔐 AuthProvider 렌더링됨:', { 
    autoLoginEnabled, 
    isAuthenticated, 
    userUid: user?.uid,
    provider: user?.provider,
    displayName: user?.displayName,
    isLoggingOut 
  });

  // autoLoginEnabled 값이 변경될 때마다 ref 업데이트
  useEffect(() => {
    autoLoginEnabledRef.current = autoLoginEnabled;
  }, [autoLoginEnabled]);

  // 로그아웃 상태 감지: Redux 인증 상태 변화 감지
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    // 인증된 상태에서 인증 해제된 경우 로그아웃으로 간주
    if (!isAuthenticated && user === null) {
      devLog.log('🚪 로그아웃 상태 감지됨');
      setIsLoggingOut(true);
      // 5초 후 로그아웃 상태 해제 (새로운 로그인을 위해)
      timer = setTimeout(() => {
        devLog.log('🔄 로그아웃 상태 해제');
        setIsLoggingOut(false);
      }, 5000);
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isAuthenticated, user]);

  // Redux persist 복원 완료를 기다리는 초기화 지연
  useEffect(() => {
    const timer = setTimeout(() => {
      devLog.log('🔐 AuthProvider 초기화 준비 완료');
      setIsReady(true);
    }, 1500); // Firebase Auth 초기화 대기 시간을 더 증가 (Apple 로그인 세션 복원 시간 고려)
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    
    devLog.log('🔐 AuthProvider 초기화 (한 번만 실행), autoLoginEnabled:', autoLoginEnabledRef.current);
    
    let isComponentMounted = true; // 컴포넌트 마운트 상태 추적
    let retryInterval: NodeJS.Timeout | null = null; // interval 추적
    
    // Firebase 앱이 초기화되었는지 확인
    if (getApps().length === 0) {
      devLog.error('❌ Firebase 앱이 초기화되지 않음 - App.tsx를 확인하세요');
      dispatch(setLoading(false));
      return;
    }
    
    const auth = getAuth();
    devLog.log('🔑 Firebase Auth 초기화 완료, 현재 사용자:', auth.currentUser?.uid || 'none');
    devLog.log('🔑 Firebase Auth persistence 상태:', {
      app: auth.app.name,
      currentUser: !!auth.currentUser,
      settings: auth.settings || 'none'
    });
    
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      // 컴포넌트가 언마운트된 경우 처리하지 않음
      if (!isComponentMounted) {
        devLog.log('🔐 AuthProvider 언마운트됨, Auth 상태 변화 무시');
        return;
      }
      const currentAutoLoginEnabled = autoLoginEnabledRef.current;
      devLog.log('🔥 Firebase Auth 상태 변화 감지:', {
        hasFirebaseUser: !!firebaseUser,
        firebaseUserUid: firebaseUser?.uid,
        firebaseUserEmail: firebaseUser?.email,
        autoLoginEnabled: currentAutoLoginEnabled,
        reduxUserUid: user?.uid,
        isAuthenticated,
        provider: firebaseUser?.providerData[0]?.providerId,
        isLoggingOut
      });
      try {
        dispatch(setLoading(true));
        
        if (firebaseUser && currentAutoLoginEnabled) {
          // Firebase에 사용자가 있고 자동 로그인이 활성화된 경우
          devLog.log('✅ Firebase 사용자 감지, 자동 로그인 처리 중...', firebaseUser.uid);
          
          // Redux에 이미 같은 사용자가 있다면 스킵
          if (user && user.uid === firebaseUser.uid && isAuthenticated) {
            devLog.log('⏭️ 이미 같은 사용자가 Redux에 있음, 자동 로그인 스킵');
            dispatch(setLoading(false));
            return;
          }
          
          // Firebase Auth에서 제공하는 정보로 사용자 객체 생성
          const provider = firebaseUser.providerData[0]?.providerId === 'apple.com' ? 'apple' : 
                         firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'kakao';
          
          // Firestore에서 실제 사용자 정보 가져오기 (필수)
          try {
            devLog.log('📱 Firestore에서 사용자 정보 조회 중...', firebaseUser.uid);
            const userDoc = await firebaseService.getUserProfile(firebaseUser.uid);
            
            if (userDoc) {
              const user: User = {
                uid: firebaseUser.uid,
                email: userDoc.email || firebaseUser.email || undefined,
                displayName: userDoc.displayName || userDoc.email?.split('@')[0] || 'Apple 사용자',
                realName: userDoc.realName || undefined,
                photoURL: userDoc.photoURL || firebaseUser.photoURL || undefined,
                provider: provider,
                kakaoId: provider === 'kakao' ? userDoc.kakaoId : undefined,
                googleId: provider === 'google' ? userDoc.googleId : undefined,
                appleId: provider === 'apple' ? userDoc.appleId : undefined,
              };
              
              dispatch(setUser(user));
              devLog.log('✅ 자동 로그인 성공, 사용자명:', user.displayName);
              logger.auth('auto_login_success', provider, true, undefined, firebaseUser.uid);
              
              // Analytics: 자동 로그인 추적
              analyticsService.logLogin(provider as 'kakao' | 'google' | 'email').catch((error) => {
                devLog.error('❌ 자동 로그인 Analytics 추적 실패:', error);
              });
            } else {
              // Firestore에 사용자 정보가 없으면 새로 생성
              devLog.log('⚠️ Firestore에 사용자 정보 없음, 새로 생성');
              const defaultDisplayName = firebaseUser.email?.split('@')[0] || `${provider}_user`;
              
              await firebaseService.saveUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: defaultDisplayName,
                realName: defaultDisplayName,
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
                realName: defaultDisplayName,
                photoURL: firebaseUser.photoURL || undefined,
                provider: provider,
              };
              
              dispatch(setUser(user));
              devLog.log('✅ 자동 로그인 성공 (새 프로필 생성), 사용자명:', user.displayName);
            }
            
            // 인증 성공 시 커스텀 persistence에 저장
            devLog.log('💾 자동 로그인 성공, 인증 상태를 커스텀 persistence에 저장 중...');
            await authPersistenceService.saveAuthState(firebaseUser);
          } catch (error) {
            devLog.log('⚠️ Firestore 조회 실패, 기본값으로 처리:', error);
            
            // Firestore 실패시에도 로그인 처리
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              displayName: getDefaultDisplayName(provider, firebaseUser.email),
              realName: getDefaultDisplayName(provider, firebaseUser.email),
              photoURL: firebaseUser.photoURL || undefined,
              provider: provider,
            };
            
            dispatch(setUser(user));
          }
          
        } else if (firebaseUser && !currentAutoLoginEnabled) {
          // Firebase에 사용자가 있지만 자동 로그인이 비활성화된 경우
          // 이 경우에도 수동 로그인은 유지해야 함 (자동 로그인 != 로그인 금지)
          devLog.log('🔐 수동 로그인 사용자 인증 처리 중...');
          
          // Redux에 이미 같은 사용자가 있다면 스킵
          if (user && user.uid === firebaseUser.uid && isAuthenticated) {
            devLog.log('⏭️ 이미 같은 사용자가 Redux에 있음, 처리 스킵');
            dispatch(setLoading(false));
            return;
          }
          
          // 수동 로그인한 사용자도 정상적으로 인증 처리
          const provider = firebaseUser.providerData[0]?.providerId === 'apple.com' ? 'apple' : 
                         firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'kakao';
          
          try {
            devLog.log('📱 Firestore에서 사용자 정보 조회 중...', firebaseUser.uid);
            const userDoc = await firebaseService.getUserProfile(firebaseUser.uid);
            
            if (userDoc) {
              const user: User = {
                uid: firebaseUser.uid,
                email: userDoc.email || firebaseUser.email || undefined,
                displayName: userDoc.displayName || userDoc.email?.split('@')[0] || 'Apple 사용자',
                realName: userDoc.realName || undefined,
                photoURL: userDoc.photoURL || firebaseUser.photoURL || undefined,
                provider: provider,
                kakaoId: provider === 'kakao' ? userDoc.kakaoId : undefined,
                googleId: provider === 'google' ? userDoc.googleId : undefined,
                appleId: provider === 'apple' ? userDoc.appleId : undefined,
              };
              
              dispatch(setUser(user));
              devLog.log('✅ 수동 로그인 처리 완료, 사용자명:', user.displayName);
              logger.auth('manual_login_success', provider, true, undefined, firebaseUser.uid);
            } else {
              // Firestore에 사용자 정보가 없으면 새로 생성
              devLog.log('⚠️ Firestore에 사용자 정보 없음, 새로 생성');
              const defaultDisplayName = firebaseUser.email?.split('@')[0] || `${provider}_user`;
              
              await firebaseService.saveUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: defaultDisplayName,
                realName: defaultDisplayName,
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
                realName: defaultDisplayName,
                photoURL: firebaseUser.photoURL || undefined,
                provider: provider,
              };
              
              dispatch(setUser(user));
              devLog.log('✅ 수동 로그인 처리 완료 (새 프로필 생성), 사용자명:', user.displayName);
            }
          } catch (error) {
            devLog.log('⚠️ Firestore 조회 실패, 기본값으로 처리:', error);
            
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              displayName: getDefaultDisplayName(provider, firebaseUser.email),
              realName: getDefaultDisplayName(provider, firebaseUser.email),
              photoURL: firebaseUser.photoURL || undefined,
              provider: provider,
            };
            
            dispatch(setUser(user));
          }
          
        } else {
          // Firebase에 사용자가 없는 경우
          devLog.log('👤 인증된 사용자 없음');
          
          // Redux에 사용자가 있다면 커스텀 세션 복원 시도 (단, 로그아웃 중이 아닌 경우에만)
          if (user && user.uid && isAuthenticated && !isLoggingOut) {
            devLog.log('🔄 Redux에 사용자 정보가 있음, 커스텀 세션 복원 확인 중...');
            devLog.log('📝 Redux 사용자:', { uid: user.uid, provider: user.provider, displayName: user.displayName });
            
            // 먼저 커스텀 persistence 서비스로 세션 복원 시도
            devLog.log('💾 커스텀 persistence 서비스로 세션 복원 시도...');
            const restoredUser = await authPersistenceService.restoreAuthState();
            
            if (restoredUser && restoredUser.uid === user.uid) {
              devLog.log('✅ 커스텀 persistence에서 세션 복원 성공:', restoredUser.uid);
              // Redux 상태는 이미 있으므로 추가 처리 불필요
              dispatch(setLoading(false));
              return;
            } else {
              devLog.log('❌ 커스텀 persistence에서 세션 복원 실패, Firebase Auth 재시도 로직 진행');
            }
            
            // Apple 로그인 사용자의 경우 더 긴 대기 시간 적용
            const maxRetries = user.provider === 'apple' ? 5 : 3;
            const retryDelay = user.provider === 'apple' ? 1500 : 1000;
            devLog.log(`🔄 ${user.provider} 로그인 사용자, 최대 ${maxRetries}번 재시도 (${retryDelay}ms 간격)`);
            
            // 더 강력한 세션 복원 시도
            let retryCount = 0;
            retryInterval = setInterval(async () => {
              const currentAuth = getAuth();
              retryCount++;
              
              devLog.log(`🔄 Firebase Auth 세션 복원 시도 ${retryCount}/${maxRetries}, currentUser:`, currentAuth.currentUser?.uid || 'none');
              
              // AsyncStorage에서 Firebase Auth 정보 확인 및 강제 복원 시도
              if (retryCount === 2) {
                try {
                  const keys = await AsyncStorage.getAllKeys();
                  const firebaseKeys = keys.filter(key => key.includes('firebase') || key.includes('auth'));
                  devLog.log('🔍 AsyncStorage Firebase 관련 키들:', firebaseKeys);
                  
                  // Firebase Auth 키 확인
                  const firebaseAuthKey = firebaseKeys.find(key => key.includes('firebase:authUser'));
                  if (firebaseAuthKey) {
                    const authData = await AsyncStorage.getItem(firebaseAuthKey);
                    devLog.log(`🔍 ${firebaseAuthKey}:`, authData ? authData.substring(0, 100) + '...' : 'null');
                    
                    if (authData) {
                      try {
                        const parsedAuthData = JSON.parse(authData);
                        devLog.log('🔄 AsyncStorage에서 Firebase Auth 데이터 발견, 강제 복원 시도:', {
                          uid: parsedAuthData.uid,
                          email: parsedAuthData.email,
                          provider: parsedAuthData.providerData?.[0]?.providerId
                        });
                        
                        // Firebase Auth 인스턴스 재초기화 시도
                        const currentAuth = getAuth();
                        devLog.log('🔄 Firebase Auth 상태 강제 새로고침 시도...');
                        
                        // Auth 상태 강제 리로드
                        await currentAuth.authStateReady();
                        devLog.log('🔄 authStateReady 완료, currentUser:', currentAuth.currentUser?.uid || 'still none');
                        
                        // 만약 여전히 currentUser가 없으면 Apple 토큰 재인증 필요 알림
                        if (!currentAuth.currentUser && parsedAuthData.providerData?.[0]?.providerId === 'apple.com') {
                          devLog.log('🍎 Apple 토큰 만료 확인됨, 재로그인이 필요합니다');
                        }
                        
                      } catch (parseError) {
                        devLog.error('🔍 AsyncStorage 데이터 파싱 실패:', parseError);
                      }
                    }
                  }
                } catch (error) {
                  devLog.error('🔍 AsyncStorage 확인 실패:', error);
                }
              }
              
              if (currentAuth.currentUser && isComponentMounted) {
                devLog.log('✅ Firebase Auth 세션 복원 확인됨');
                if (retryInterval) clearInterval(retryInterval);
                retryInterval = null;
                // 세션이 복원되었으므로 onAuthStateChanged가 다시 호출될 것임
              } else if (retryCount >= maxRetries && isComponentMounted) {
                devLog.log('❌ Firebase Auth 세션 복원 실패');
                if (retryInterval) clearInterval(retryInterval);
                retryInterval = null;
                
                // Apple 로그인의 경우 토큰 만료 처리
                if (user.provider === 'apple') {
                  devLog.log('🍎 Apple 토큰 만료 확인됨, 사용자에게 재로그인 안내 필요');
                } else if (user.provider === 'google') {
                  devLog.log('🔍 Google 토큰 만료 확인됨, 사용자에게 재로그인 안내 필요');
                }
                
                // 세션 만료 상황 알림 (사용자가 앱을 활발히 사용 중인 경우에만)
                // 이는 AuthProvider 초기화 과정에서 자동으로 감지되는 상황임
                devLog.log(`⚠️ ${user.provider} 로그인 세션 만료로 로그아웃 처리됨`);
                
                // Redux 상태 정리
                dispatch(setUser(null));
              }
            }, retryDelay); // 프로바이더별 간격
          } else if (isLoggingOut) {
            devLog.log('🚪 로그아웃 중이므로 세션 복원 시도 건너뜀');
            dispatch(setUser(null));
          } else {
            dispatch(setUser(null));
          }
        }
      } catch (error) {
        devLog.error('❌ 인증 상태 처리 중 오류:', error);
        dispatch(setUser(null));
        logger.auth('auth_state_error', 'unknown', false, error);
      } finally {
        dispatch(setLoading(false));
      }
    });

    return () => {
      isComponentMounted = false; // 컴포넌트 언마운트 표시
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
      devLog.log('🔐 AuthProvider 정리');
      unsubscribe();
    };
  }, [dispatch, isReady, isLoggingOut]); // isReady가 true가 되면 실행

  return null; // UI 렌더링 없음
};

export default AuthProvider;