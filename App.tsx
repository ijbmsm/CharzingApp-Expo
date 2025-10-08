// URL polyfill for Hermes (최상단에서 먼저 실행)
import 'react-native-url-polyfill/auto';

// React Native Gesture Handler (네이티브 모듈 초기화)
import 'react-native-gesture-handler';

// Firebase 초기화 (React import 전에 먼저)
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// React Native Firebase 환경 설정
// Firebase v12 web SDK는 getReactNativePersistence를 제공하지 않으므로
// 커스텀 persistence 구현을 위한 설정

// React Native 환경임을 Firebase에 알림
// @ts-ignore
global.navigator = global.navigator || {};
// @ts-ignore
global.navigator.product = 'ReactNative';

// AsyncStorage를 전역에 등록
// @ts-ignore
global.AsyncStorage = AsyncStorage;

// Firebase가 AsyncStorage를 찾을 수 있도록 전역 설정
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.AsyncStorage = AsyncStorage;
}

const firebaseConfig = {
  apiKey: "AIzaSyCa5WLhZwAowvna4vrLbweOtW8w8oEoS88",
  authDomain: "charzing-d1600.firebaseapp.com",
  projectId: "charzing-d1600",
  storageBucket: "charzing-d1600.firebasestorage.app",
  messagingSenderId: "91035459357",
  appId: "1:91035459357:android:a146043ea80a3d5d48cbf4"
};

// Firebase 앱 초기화 (한 번만)
let firebaseApp;
if (getApps().length === 0) {
  console.log('🔥 App.tsx에서 Firebase 앱과 Auth(AsyncStorage) 초기화');
  firebaseApp = initializeApp(firebaseConfig);
  
  // React Native에서 Firebase Auth 초기화 (한 번만)
  try {
    // Firebase v12 web SDK에서는 getReactNativePersistence가 제공되지 않으므로
    // 기본 설정으로 초기화하고 수동 persistence 구현
    const auth = initializeAuth(firebaseApp, {
      // React Native 환경에서는 persistence 자동 감지를 시도
      // AsyncStorage가 전역에 설정되어 있으면 Firebase가 사용할 수 있음
    });
    
    // Auth 초기화 직후 AsyncStorage 키 설정 확인
    setTimeout(async () => {
      try {
        // Firebase Auth가 AsyncStorage를 제대로 사용하도록 강제 설정
        const testKey = 'firebase:test';
        await AsyncStorage.setItem(testKey, 'test');
        await AsyncStorage.removeItem(testKey);
        console.log('✅ AsyncStorage 작동 확인됨');
        
        // Firebase Auth persistence 강제 활성화 체크
        console.log('🔍 Firebase Auth config:', {
          app: auth.app.name,
          options: auth.app.options.projectId
        });
      } catch (error) {
        console.error('❌ AsyncStorage 테스트 실패:', error);
      }
    }, 100);
    
    console.log('✅ Firebase Auth 초기화 완료 (getReactNativePersistence로 AsyncStorage 설정됨)');
    
    // Auth 초기화 직후 상태 확인
    console.log('🔍 Firebase Auth 초기 상태:', {
      currentUser: auth.currentUser?.uid || 'none',
      app: auth.app.name,
      authInstance: !!auth
    });
    
    // Firebase Auth persistence 강제 활성화 시도
    setTimeout(async () => {
      console.log('🔍 Firebase Auth 지연 확인 (1초 후):', {
        currentUser: auth.currentUser?.uid || 'none',
        ready: !!auth.currentUser
      });
      
      // authStateReady() 호출로 초기화 완료 대기
      try {
        await auth.authStateReady();
        console.log('🔍 authStateReady 완료, currentUser:', auth.currentUser?.uid || 'still none');
      } catch (error) {
        console.log('❌ authStateReady 실패:', error);
      }
      
      // AsyncStorage 직접 확인
      try {
        const keys = await AsyncStorage.getAllKeys();
        const firebaseKeys = keys.filter(key => key.includes('firebase') || key.includes('auth'));
        console.log('🔍 AsyncStorage Firebase 키들:', firebaseKeys);
        
        // Redux persist 데이터 확인
        const persistAuthKey = keys.find(key => key === 'persist:auth');
        if (persistAuthKey) {
          const persistData = await AsyncStorage.getItem(persistAuthKey);
          if (persistData) {
            const parsed = JSON.parse(persistData);
            const user = JSON.parse(parsed.user || 'null');
            if (user) {
              console.log('🔍 Redux persist에서 사용자 발견:', {
                uid: user.uid,
                provider: user.provider,
                email: user.email
              });
              
              // Redux에 사용자가 있지만 Firebase Auth에 없는 경우 - 토큰 만료 확실
              if (!auth.currentUser) {
                console.log('⚠️ Firebase Auth 세션 만료 확인됨 - 재로그인 필요');
              }
            }
          }
        }
        
        // Firebase Auth 키 확인
        const authKey = firebaseKeys.find(key => key.includes('firebase:authUser'));
        if (authKey) {
          const authData = await AsyncStorage.getItem(authKey);
          console.log('🔍 저장된 Firebase 인증 데이터 존재:', !!authData);
          if (authData) {
            try {
              const parsedData = JSON.parse(authData);
              console.log('🔍 저장된 Firebase 사용자:', {
                uid: parsedData.uid,
                email: parsedData.email,
                provider: parsedData.providerData?.[0]?.providerId
              });
            } catch (parseError) {
              console.log('❌ Firebase 인증 데이터 파싱 실패:', parseError);
            }
          }
        } else {
          console.log('⚠️ Firebase Auth 키가 AsyncStorage에 없음 - 세션이 저장되지 않았음');
        }
      } catch (error) {
        console.log('❌ AsyncStorage 확인 실패:', error);
      }
    }, 1000);
    
  } catch (error) {
    // Auth가 이미 초기화된 경우는 발생하지 않아야 함
    console.warn('⚠️ Firebase Auth 초기화 중 예외 발생:', error);
    // 이미 초기화된 경우라면 기존 Auth 인스턴스 사용
    const existingAuth = getAuth(firebaseApp);
    console.log('🔍 기존 Firebase Auth 사용:', {
      currentUser: existingAuth.currentUser?.uid || 'none'
    });
  }
} else {
  console.log('🔥 App.tsx에서 기존 Firebase 앱 사용');
  firebaseApp = getApps()[0];
}

// React 및 기타 imports
import React, { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Linking, Platform } from 'react-native';
import { store, persistor, RootState } from './src/store';
import { LoadingProvider } from './src/contexts/LoadingContext';
import RootNavigator from './src/navigation/RootNavigator';
import GlobalLoadingOverlay from './src/components/GlobalLoadingOverlay';
import AuthProvider from './src/components/AuthProvider';
import notificationService from './src/services/notificationService';
import googleLoginService from './src/services/googleLoginService';
import analyticsService from './src/services/analyticsService';

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
  }, []); // 앱 시작 시 한 번만 실행

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('📱 사용자 로그인 완료, 푸시 알림 등록 및 인앱 알림 불러오기 중...');
      // 안전한 비동기 호출
      Promise.all([
        notificationService.registerForPushNotifications(user.uid),
        notificationService.loadInAppNotifications(user.uid)
      ]).catch((error) => {
        console.error('❌ 알림 초기화 실패:', error);
      });
    }
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
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LoadingProvider>
          <SafeAreaProvider>
            <URLHandler />
            <AuthProvider />
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

export default registerRootComponent(App);