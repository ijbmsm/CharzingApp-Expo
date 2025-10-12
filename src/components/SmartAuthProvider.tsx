/**
 * 스마트 인증 프로바이더 (새로운 간소화된 버전)
 * Single Responsibility Principle (SRP): Redux 상태 동기화만 담당
 * 복잡한 인증 로직은 SmartAuthService에서 처리
 */

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading } from '../store/slices/authSlice';
import { RootState } from '../store';
import { smartAuthService } from '../services/auth/SmartAuthService';
import { 
  AuthEvent, 
  AuthenticationStatus, 
  AppUser 
} from '../services/auth/types';

/**
 * 스마트 인증 프로바이더 컴포넌트
 * 467줄 → 약 100줄로 대폭 간소화
 */
const SmartAuthProvider: React.FC = () => {
  const dispatch = useDispatch();
  const { autoLoginEnabled } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * 수동 로그인인지 확인 (자동 로그인과 구분)
   */
  const isManualLogin = useCallback((event: AuthEvent): boolean => {
    // 🔧 수정: 로직을 명확하게 변경
    // 앱 시작 후 5초 이내면 자동 로그인(Firebase persistence), 
    // 5초 이후면 수동 로그인(사용자가 직접 로그인 버튼 클릭)으로 간주
    const timeSinceEvent = Date.now() - event.timestamp;
    return timeSinceEvent > 5000; // 5초 이후면 수동 로그인
  }, []);

  /**
   * AppUser를 Redux 사용자 형식으로 변환
   */
  const convertToReduxUser = useCallback((appUser: AppUser): any => {
    return {
      uid: appUser.uid,
      email: appUser.email,
      displayName: appUser.displayName,
      realName: appUser.realName,
      photoURL: appUser.photoURL,
      kakaoId: appUser.kakaoId,
      googleId: appUser.googleId,
      appleId: appUser.appleId,
      provider: appUser.provider,
    };
  }, []);

  /**
   * 인증 이벤트 처리 (Redux 상태 동기화)
   */
  const handleAuthEvent = useCallback((event: AuthEvent): void => {
    console.log('🔔 인증 이벤트 수신:', event.type);

    switch (event.type) {
      case 'user_authenticated':
        if (event.user) {
          const isManual = isManualLogin(event);
          console.log('🔍 로그인 타입 판별:', {
            isManual,
            autoLoginEnabled,
            timeSinceEvent: Date.now() - event.timestamp,
            userDisplayName: event.user.displayName
          });
          
          // 수동 로그인이거나 자동 로그인이 활성화된 경우 로그인 허용
          if (isManual || autoLoginEnabled) {
            dispatch(setUser(convertToReduxUser(event.user)));
            console.log('✅ 사용자 인증 완료:', event.user.displayName, isManual ? '(수동 로그인)' : '(자동 로그인)');
          } else {
            console.log('⏭️ 자동 로그인이 비활성화되어 있어 로그인을 건너뜁니다');
            dispatch(setUser(null));
          }
        }
        break;

      case 'user_unauthenticated':
        dispatch(setUser(null));
        console.log('👋 사용자 로그아웃 처리 완료');
        break;

      case 'token_refreshed':
        console.log('🔄 토큰이 갱신되었습니다.');
        // 현재 사용자 정보는 유지, 토큰만 갱신됨
        break;

      case 'auth_error':
        console.error('❌ 인증 오류:', event.error?.message);
        // 심각한 오류가 아닌 경우 현재 상태 유지
        if (event.error?.message === '재인증이 필요합니다') {
          // 재인증 UI는 상위 컴포넌트에서 처리
          console.log('⚠️ 재인증이 필요합니다.');
        }
        break;

      default:
        console.log('🔔 알 수 없는 인증 이벤트:', event.type);
    }
  }, [dispatch, autoLoginEnabled, isManualLogin, convertToReduxUser]);

  // 🎯 핵심: 매우 간단한 초기화
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 SmartAuthProvider 초기화 시작');
      
      try {
        dispatch(setLoading(true));
        
        // 인증 이벤트 리스너 등록
        smartAuthService.addAuthListener(handleAuthEvent);
        
        // 스마트 인증 서비스 초기화
        await smartAuthService.initialize();
        
        setIsInitialized(true);
        console.log('✅ SmartAuthProvider 초기화 완료');
        
      } catch (error) {
        console.error('❌ SmartAuthProvider 초기화 실패:', error);
        dispatch(setUser(null));
      } finally {
        dispatch(setLoading(false));
      }
    };

    initializeAuth();

    // 정리 함수
    return () => {
      smartAuthService.removeAuthListener(handleAuthEvent);
      console.log('🔐 SmartAuthProvider 정리 완료');
    };
  }, [dispatch, handleAuthEvent]);

  /**
   * 현재 인증 상태 디버그 정보 (개발 환경에서만)
   */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isInitialized) {
      const { status, user } = smartAuthService.getAuthState();
      console.log('🔍 현재 인증 상태:', {
        status,
        userUid: user?.uid,
        userProvider: user?.provider,
        autoLoginEnabled,
        isInitialized
      });
    }
  }, [isInitialized, autoLoginEnabled]);

  // UI 렌더링 없음 (Pure Logic Component)
  return null;
};

export default SmartAuthProvider;