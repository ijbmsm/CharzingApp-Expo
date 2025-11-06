// URL polyfill for Hermes (최상단에서 먼저 실행)
import 'react-native-url-polyfill/auto';

// React Native Gesture Handler (네이티브 모듈 초기화)
import 'react-native-gesture-handler';

// Sentry 초기화 (최상단)
import * as Sentry from '@sentry/react-native';

// Firebase 초기화 (새로운 시스템 사용)
import { firebaseFacade } from './src/services/firebase/config';

// React 및 기타 imports
import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, StatusBar, Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Linking } from 'react-native';
import { store, persistor, RootState } from './src/store';
import { LoadingProvider } from './src/contexts/LoadingContext';
import RootNavigator from './src/navigation/RootNavigator';
import GlobalLoadingOverlay from './src/components/GlobalLoadingOverlay';
import SmartAuthProvider from './src/components/SmartAuthProvider';
import BundlingLoadingScreen from './src/components/BundlingLoadingScreen';
import notificationService from './src/services/notificationService';
import googleLoginService from './src/services/googleLoginService';
import kakaoLoginService from './src/services/kakaoLoginService';
import analyticsService from './src/services/analyticsService';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import RNBootSplash from 'react-native-bootsplash';
import Constants from 'expo-constants';

// Sentry 초기화 (프로덕션에서만)
if (!__DEV__) {
  Sentry.init({
    dsn: Constants.expoConfig?.extra?.SENTRY_DSN || '',
    // 개발 환경에서는 비활성화
    enabled: !__DEV__,
    // 앱 버전 추적
    release: Constants.expoConfig?.version,
    dist: Constants.expoConfig?.version,
    // 환경 설정
    environment: __DEV__ ? 'development' : 'production',
    // 트레이스 샘플링 레이트 (10%)
    tracesSampleRate: 0.1,
    // 사용자 정보 자동 수집 비활성화 (수동으로 설정)
    enableAutoSessionTracking: true,
    // 네이티브 크래시 수집
    enableNative: true,
    enableNativeCrashHandling: true,
  });
}

// Expo 스플래시 화면을 최대한 빨리 숨기기 (촌스러운 화면 제거)
// 우리가 만든 커스텀 로딩 화면을 대신 사용

// 알림 초기화를 담당하는 내부 컴포넌트
function NotificationInitializer() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // 앱 시작 시 즉시 알림 리스너 초기화 (인증 상태와 무관)
    console.log('🔔 알림 서비스 초기화 중...');
    
    // 알림 리스너 초기화 - NotificationService는 생성자에서 자동으로 초기화됨
    // 하지만 명시적으로 확인해보자
    try {
      // NotificationService는 이미 constructor에서 setupNotificationHandlers()를 호출함
      console.log('✅ 알림 시스템 초기화 완료 - 리스너가 활성화됨');
    } catch (error) {
      console.error('❌ 알림 시스템 초기화 실패:', error);
    }

    // Google 로그인 서비스 초기화 (Android만)
    if (Platform.OS === 'android') {
      console.log('🔍 Google 로그인 서비스 초기화 중...');
      // 약간의 지연 후 초기화 (다른 서비스들이 먼저 로드되도록)
      setTimeout(() => {
        googleLoginService.initialize().catch((error) => {
          console.error('❌ Google 로그인 서비스 초기화 실패:', error);
        });
      }, 2000);
    }

    // 카카오 로그인 서비스 초기화 (모든 플랫폼)
    console.log('📱 카카오 로그인 서비스 초기화 중...');
    setTimeout(() => {
      kakaoLoginService.initialize().catch((error) => {
        console.error('❌ 카카오 로그인 서비스 초기화 실패:', error);
      });
    }, 1000);
  }, []); // 앱 시작 시 한 번만 실행

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('📱 사용자 로그인 완료, 푸시 알림 등록 및 인앱 알림 불러오기 중...');
      // 안전한 비동기 호출 - 푸시 알림 등록만 (실시간 리스너는 registerForPushNotifications 내부에서 시작)
      notificationService.registerForPushNotifications(user.uid).catch((error) => {
        console.error('❌ 알림 초기화 실패:', error);
      });
    } else if (!isAuthenticated) {
      // 로그아웃 시 실시간 리스너 중지
      notificationService.stopRealtimeNotificationListener();
    }
  }, [isAuthenticated, user]);

  // 앱 상태 변화 감지 (포그라운드/백그라운드)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated && user) {
        // 포그라운드로 돌아올 때는 실시간 리스너가 이미 동작 중이므로 별도 작업 불필요
        console.log('📱 앱이 포그라운드로 전환됨 (실시간 리스너 동작 중)');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated, user]);

  return null; // UI를 렌더링하지 않는 로직 전용 컴포넌트
}

// Analytics 초기화를 담당하는 컴포넌트
function AnalyticsInitializer() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // 앱 시작 시 Analytics 초기화
    console.log('📊 Firebase Analytics 초기화 중...');
    analyticsService.initialize().catch((error) => {
      console.error('❌ Analytics 초기화 실패:', error);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      // 사용자 로그인 시 Analytics 사용자 설정
      analyticsService.setUserId(user.uid).catch((error) => {
        console.error('❌ Analytics 사용자 ID 설정 실패:', error);
      });

      // 사용자 속성 설정
      if (user.displayName) {
        analyticsService.setUserProperty('user_name', user.displayName).catch((error) => {
          console.error('❌ Analytics 사용자 속성 설정 실패:', error);
        });
      }
    }
  }, [isAuthenticated, user]);

  return null;
}

// URL Linking 처리를 위한 컴포넌트
function URLHandler() {
  useEffect(() => {
    // 앱이 URL을 통해 열렸을 때 처리
    const handleDeepLink = (event: { url: string }) => {
      console.log('🔗 Deep Link 수신:', event.url);
      
      // Deep Link 처리 (카카오 로그인 관련 제거됨)
    };

    // URL 리스너 등록
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // 앱이 닫힌 상태에서 URL로 열렸을 때 처리
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 앱 시작 시 Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return null;
}

function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('앱을 준비하고 있습니다...');

  // LineSeed 폰트 로드
  const [fontsLoaded] = useFonts({
    'LINESeedSansKR-Regular': require('./assets/fonts/LINESeedSansKR-Regular.ttf'),
    'LINESeedSansKR-Bold': require('./assets/fonts/LINESeedSansKR-Bold.ttf'),
  });

  // 🔥 앱 초기화 (커스텀 로딩 준비 후 스플래시 숨기기)
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 앱 초기화 시작...');

      try {
        // 0. Expo 스플래시 화면 즉시 숨기기 (최소 지연)
        await SplashScreen.hideAsync();
        console.log('✅ Expo 스플래시 화면 숨김 완료');

        // 1. BootSplash 숨기기 (번들링 로딩 화면)
        await RNBootSplash.hide({ fade: true });
        console.log('✅ BootSplash 숨김 완료');

        // 2. Firebase 초기화
        setLoadingMessage('Firebase 연결 중...');
        console.log('🚀 Firebase 초기화 시작...');
        const success = await firebaseFacade.initialize();

        if (success) {
          console.log('✅ Firebase 초기화 성공');
        } else {
          console.error('❌ Firebase 초기화 실패');
          // Firebase 초기화 실패 시에도 앱은 계속 동작하도록 함
        }
        
        // 3. 서비스 초기화 (필요시)
        setLoadingMessage('서비스 준비 중...');
        await new Promise(resolve => setTimeout(resolve, 500)); // 최소 로딩 시간
        
        // 4. 카카오 로그인 서비스 초기화
        setLoadingMessage('로그인 서비스 준비 중...');
        try {
          await kakaoLoginService.initialize();
          console.log('✅ 카카오 로그인 서비스 초기화 성공');
        } catch (error) {
          console.warn('⚠️ 카카오 로그인 서비스 초기화 실패:', error);
        }
        
        // 5. 앱 준비 완료
        setLoadingMessage('앱 시작 중...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 6. 커스텀 로딩 완료
        setIsAppReady(true);
        
      } catch (error) {
        console.error('❌ 앱 초기화 중 예외 발생:', error);
        // 오류 발생 시에도 앱 실행 계속 (Expo 스플래시는 이미 숨김)
        setIsAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // 앱이 준비되지 않았다면 커스텀 로딩 화면 표시
  if (!isAppReady) {
    return <BundlingLoadingScreen message={loadingMessage} showProgress={true} />;
  }

  // 폰트가 로드되지 않았으면 로딩 화면 표시
  if (!fontsLoaded) {
    return <BundlingLoadingScreen message="폰트 로딩 중..." />;
  }

  return (
    <Provider store={store}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <PersistGate loading={null} persistor={persistor}>
        <LoadingProvider>
          <SafeAreaProvider>
            <URLHandler />
            <SmartAuthProvider />
            <NotificationInitializer />
            <AnalyticsInitializer />
            <RootNavigator />
            <GlobalLoadingOverlay />
          </SafeAreaProvider>
        </LoadingProvider>
      </PersistGate>
    </Provider>
  );
}

const WrappedApp = __DEV__ ? App : Sentry.wrap(App);

export default registerRootComponent(WrappedApp);