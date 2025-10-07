import React, { useState, useEffect } from 'react';
import { View, Linking, Easing, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// 카카오 로그인 서비스 제거됨

// Screens
import HomeScreen from '../screens/HomeScreen';
import DiagnosticScreen from '../screens/DiagnosticScreen';
import DiagnosisReservationScreen from '../screens/DiagnosisReservationScreen';
import DiagnosisReportScreen from '../screens/DiagnosisReportScreen';
import VehicleDiagnosisReportScreen from '../screens/VehicleDiagnosisReportScreen';
import DiagnosisReportListScreen from '../screens/DiagnosisReportListScreen';
import MyPageScreen from '../screens/MyPageScreen';
import MyReservationsScreen from '../screens/MyReservationsScreen';
import ReservationDetailScreen from '../screens/ReservationDetailScreen';
import ModifyReservationScreen from '../screens/ModifyReservationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';
import SignupCompleteScreen from '../screens/SignupCompleteScreen';

// Types
export type RootStackParamList = {
  Main: undefined;
  Login: { showBackButton?: boolean; message?: string };
  DiagnosisReservation: undefined;
  DiagnosisReportList: undefined;
  DiagnosisReport: {reportId?: string};
  VehicleDiagnosisReport: {reportId: string};
  MyReservations: undefined;
  ReservationDetail: {
    reservation: Omit<import('../services/firebaseService').DiagnosisReservation, 'requestedDate' | 'createdAt' | 'updatedAt'> & {
      requestedDate: string | Date | any;
      createdAt: string | Date | any;
      updatedAt: string | Date | any;
    };
  };
  ModifyReservation: {
    reservation: Omit<import('../services/firebaseService').DiagnosisReservation, 'requestedDate' | 'createdAt' | 'updatedAt'> & {
      requestedDate: string | Date | any;
      createdAt: string | Date | any;
      updatedAt: string | Date | any;
    };
  };
  Settings: undefined;
  SignupComplete: {
    kakaoUser?: {
      uid: string;
      email?: string;
      displayName?: string;
      photoURL?: string;
      kakaoId?: string;
      appleId?: string;
      provider: 'kakao' | 'apple';
    };
    googleUser?: {
      uid: string;
      email?: string;
      displayName?: string;
      photoURL?: string;
      googleId: string;
      provider: 'google';
    };
  };
};

export type MainTabParamList = {
  Home: undefined;
  Diagnostic: undefined;
  MyPage: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icon components
const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="home-outline" size={size} color={color} />
);

const DiagnosticIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="construct-outline" size={size} color={color} />
);

const MyPageIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="person-outline" size={size} color={color} />
);

// 모든 화면이 기능별로 보호됨

function MainTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4495E8',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: Platform.OS === 'android' ? insets.bottom + 8 : insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          elevation: 10,
          shadowOpacity: 0.1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen 
        name="Diagnostic" 
        component={DiagnosticScreen}
        options={{
          tabBarLabel: '진단예약',
          tabBarIcon: DiagnosticIcon,
        }}
      />
      <Tab.Screen 
        name="MyPage" 
        component={MyPageScreen}
        options={{
          tabBarLabel: '마이페이지',
          tabBarIcon: MyPageIcon,
        }}
      />
    </Tab.Navigator>
  );
}

// 모든 화면이 직접 Login으로 리다이렉트하는 방식으로 통일됨

export default function RootNavigator() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Deep Link 처리
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep Link 감지:', url);
      // 카카오 로그인 Deep Link 처리 제거됨
    };

    // 앱이 실행 중일 때 Deep Link
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // 앱이 종료된 상태에서 Deep Link로 실행될 때
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
          cardOverlayEnabled: false,
          // 기본 슬라이드 애니메이션 (iOS 스타일)
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
          // 스와이프로 뒤로가기 활성화
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={MainTabs}
          options={{
            // 홈 화면으로 오는 경우 자연스러운 Fade 애니메이션
            cardStyleInterpolator: ({ current }) => {
              return {
                cardStyle: {
                  opacity: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              };
            },
            // 부드러운 전환을 위한 애니메이션 타이밍 설정
            transitionSpec: {
              open: {
                animation: 'timing',
                config: {
                  duration: 300,
                  easing: Easing.out(Easing.ease),
                },
              },
              close: {
                animation: 'timing',
                config: {
                  duration: 200,
                  easing: Easing.in(Easing.ease),
                },
              },
            },
          }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            // 로그인은 모달처럼 아래에서 올라오기
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.height, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        />
        <Stack.Screen name="DiagnosisReservation" component={DiagnosisReservationScreen} />
        <Stack.Screen name="DiagnosisReportList" component={DiagnosisReportListScreen} />
        <Stack.Screen name="DiagnosisReport" component={DiagnosisReportScreen} />
        <Stack.Screen name="VehicleDiagnosisReport" component={VehicleDiagnosisReportScreen} />
        <Stack.Screen name="MyReservations" component={MyReservationsScreen} />
        <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
        <Stack.Screen name="ModifyReservation" component={ModifyReservationScreen} />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            // 설정은 모달처럼 아래에서 올라오기
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.height, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        />
        <Stack.Screen 
          name="SignupComplete" 
          component={SignupCompleteScreen}
          options={{
            // 회원가입 완료는 모달처럼 아래에서 올라오기
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateY: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.height, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}