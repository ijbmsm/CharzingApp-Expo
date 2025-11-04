import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { setUser, setLoading, setAutoLoginEnabled } from '../store/slices/authSlice';
import { RootState } from '../store';
import appleLoginService from '../services/appleLoginService';
import googleLoginService from '../services/googleLoginService';
import kakaoLoginService from '../services/kakaoLoginService';
import firebaseService from '../services/firebaseService';
import { useLoading } from '../contexts/LoadingContext';
import { Ionicons } from '@expo/vector-icons';
import logger from '../services/logService';

interface KakaoUser {
  id: string;
  nickname?: string;
  email?: string;
  profileImageUrl?: string;
}
import { RootStackParamList } from '../navigation/RootNavigator';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type LoginRouteProp = RouteProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const { showLoading, hideLoading } = useLoading();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoginRouteProp>();
  const { autoLoginEnabled } = useSelector((state: RootState) => state.auth);

  const showBackButton = route.params?.showBackButton ?? false;
  const message = route.params?.message;

  // 카카오 로그인 초기화는 App.tsx에서 이미 처리됨

  // 다른 provider로 로그인 시도 전에 기존 세션 정리
  const clearPreviousSession = async () => {
    try {
      const auth = getAuth();
      if (auth.currentUser) {
        await firebaseSignOut(auth);
        console.log('🧹 기존 Firebase 세션 정리 완료');
      }
    } catch (error) {
      console.error('❌ 세션 정리 실패:', error);
    }
  };

  // 카카오 로그인 (useCallback으로 최적화)
  const handleKakaoLogin = useCallback(async () => {
    logger.auth('login_attempt', 'kakao');
    showLoading('카카오 로그인 중...');
    dispatch(setLoading(true));

    try {
      // 기존 세션 정리
      await clearPreviousSession();

      // 카카오 로그인 서비스 초기화 및 실행
      await kakaoLoginService.initialize();
      const result = await kakaoLoginService.login();
      
      if (result.success && result.user) {
        const firebaseUser = result.user;
        
        const kakaoUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || '카카오 사용자',
          photoURL: firebaseUser.photoURL || undefined,
          kakaoId: firebaseUser.uid.replace('kakao_', ''), // Firebase UID에서 카카오 ID 추출
          provider: 'kakao' as const,
        };

        logger.auth('login_success', 'kakao', true, undefined, firebaseUser.uid);

        if (result.needsRegistration) {
          // 신규 사용자 - 추가 정보 입력 화면으로 이동
          logger.userAction('navigate_to_signup_complete', firebaseUser.uid, { provider: 'kakao' });
          navigation.navigate('SignupComplete', { kakaoUser: kakaoUser });
        } else {
          // 기존 사용자 - Firestore에서 프로필 조회 후 로그인 완료
          logger.userAction('login_complete', firebaseUser.uid, { provider: 'kakao', isExistingUser: true });

          try {
            const userProfile = await firebaseService.getUserProfile(firebaseUser.uid);
            const completeUserData = {
              ...kakaoUser,
              realName: userProfile?.realName || kakaoUser.displayName,
              phoneNumber: userProfile?.phoneNumber,
              displayName: userProfile?.displayName || kakaoUser.displayName,
            };
            dispatch(setUser(completeUserData));
          } catch (error) {
            console.error('프로필 조회 실패, 기본 정보로 로그인:', error);
            dispatch(setUser(kakaoUser));
          }

          // 로그인 완료 후 이전 화면으로 돌아가기
          logger.userAction('navigate_back_after_login', firebaseUser.uid);
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              })
            );
          }
        }
      } else {
        Alert.alert('로그인 실패', result.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      logger.auth('login_attempt', 'kakao', false, error);
      Alert.alert('로그인 실패', '카카오 로그인 중 오류가 발생했습니다.');
    } finally {
      hideLoading();
      dispatch(setLoading(false));
    }
  }, [showLoading, hideLoading, dispatch, navigation, logger]);


  const handleBackPress = () => {
    // 스택 리셋하여 메인 화면으로 이동
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  };

  const handleGoogleLogin = useCallback(async () => {
    logger.auth('login_attempt', 'google');
    showLoading('Google 로그인 중...');
    dispatch(setLoading(true));

    try {
      // 기존 세션 정리
      await clearPreviousSession();

      const result = await googleLoginService.login();
      
      if (result.success && result.user) {
        const firebaseUser = result.user;
        
        const googleUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || 'Google 사용자',
          photoURL: firebaseUser.photoURL || undefined,
          googleId: firebaseUser.uid, // Google 사용자 ID
          provider: 'google' as const,
        };

        logger.auth('login_success', 'google', true, undefined, firebaseUser.uid);

        if (result.needsRegistration) {
          // 신규 사용자 - 추가 정보 입력 화면으로 이동
          logger.userAction('navigate_to_signup_complete', firebaseUser.uid, { provider: 'google' });
          navigation.navigate('SignupComplete', { googleUser: googleUser });
        } else {
          // 기존 사용자 - Firestore에서 프로필 조회 후 로그인 완료
          logger.userAction('login_complete', firebaseUser.uid, { provider: 'google', isExistingUser: true });

          try {
            const userProfile = await firebaseService.getUserProfile(firebaseUser.uid);
            const completeUserData = {
              ...googleUser,
              realName: userProfile?.realName || googleUser.displayName,
              phoneNumber: userProfile?.phoneNumber,
              displayName: userProfile?.displayName || googleUser.displayName,
            };
            dispatch(setUser(completeUserData));
          } catch (error) {
            console.error('프로필 조회 실패, 기본 정보로 로그인:', error);
            dispatch(setUser(googleUser));
          }

          // 로그인 완료 후 이전 화면으로 돌아가기
          logger.userAction('navigate_back_after_login', firebaseUser.uid);
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              })
            );
          }
        }
      } else {
        Alert.alert('로그인 실패', result.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      logger.auth('login_attempt', 'google', false, error);
      Alert.alert('로그인 실패', 'Google 로그인 중 오류가 발생했습니다.');
    } finally {
      hideLoading();
      dispatch(setLoading(false));
    }
  }, [showLoading, hideLoading, dispatch, navigation, logger]);

  const handleAppleLogin = useCallback(async () => {
    logger.auth('login_attempt', 'apple');
    showLoading('Apple 로그인 중...');
    dispatch(setLoading(true));

    try {
      // 기존 세션 정리
      await clearPreviousSession();

      const result = await appleLoginService.login();
      
      if (result.success && result.user) {
        const firebaseUser = result.user;
        
        const appleUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || 'Apple 사용자',
          photoURL: firebaseUser.photoURL || undefined,
          appleId: firebaseUser.uid, // Apple의 경우 Firebase UID를 재사용
          provider: 'apple' as const,
        };

        logger.auth('login_success', 'apple', true, undefined, firebaseUser.uid);

        if (result.needsRegistration) {
          // 신규 사용자 - 추가 정보 입력 화면으로 이동
          logger.userAction('navigate_to_signup_complete', firebaseUser.uid, { provider: 'apple' });
          navigation.navigate('SignupComplete', { appleUser: appleUser });
        } else {
          // 기존 사용자 - Firestore에서 프로필 조회 후 로그인 완료
          logger.userAction('login_complete', firebaseUser.uid, { provider: 'apple', isExistingUser: true });

          try {
            const userProfile = await firebaseService.getUserProfile(firebaseUser.uid);
            const completeUserData = {
              ...appleUser,
              realName: userProfile?.realName || appleUser.displayName,
              phoneNumber: userProfile?.phoneNumber,
              displayName: userProfile?.displayName || appleUser.displayName,
            };
            dispatch(setUser(completeUserData));
          } catch (error) {
            console.error('프로필 조회 실패, 기본 정보로 로그인:', error);
            dispatch(setUser(appleUser));
          }

          // 로그인 완료 후 이전 화면으로 돌아가기
          logger.userAction('navigate_back_after_login', firebaseUser.uid);
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              })
            );
          }
        }
      } else {
        Alert.alert('로그인 실패', result.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      logger.auth('login_attempt', 'apple', false, error);
      Alert.alert('로그인 실패', 'Apple 로그인 중 오류가 발생했습니다.');
    } finally {
      hideLoading();
      dispatch(setLoading(false));
    }
  }, [showLoading, hideLoading, dispatch, navigation, logger]);

  const handleSkipLogin = () => {
    // 스택 리셋하여 메인 화면으로 이동
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  };

  const handleAutoLoginToggle = (value: boolean) => {
    dispatch(setAutoLoginEnabled(value));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 - 뒤로가기 버튼 */}
      {showBackButton && (
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {/* 로고 */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* 제목 */}
        <Text style={styles.title}>Charzing에 오신 것을 환영합니다</Text>
        <Text style={styles.subtitle}>
          {message || "전문가의 전기차 배터리 진단 서비스를 경험해보세요"}
        </Text>

        {/* 소셜 로그인 버튼들 */}
        <View style={styles.socialButtonsContainer}>
          {/* 카카오로 시작하기 - 제일 상단에 배치 */}
          <TouchableOpacity 
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={handleKakaoLogin}
          >
            <Image
              source={require('../../assets/socialLogo/KakaoLogo.png')}
              style={styles.socialLogo}
              resizeMode="contain"
            />
            <Text style={[styles.socialButtonText, styles.kakaoButtonText]}>
              카카오로 시작하기
            </Text>
          </TouchableOpacity>

          {/* iOS: Apple + Google, Android: Google만 */}
          {Platform.OS === 'ios' ? (
            <>
              {/* Apple 로그인 (iOS 전용) */}
              <TouchableOpacity 
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleAppleLogin}
              >
                <Image
                  source={require('../../assets/socialLogo/AppleLogo.png')}
                  style={styles.socialLogoApple}
                  resizeMode="contain"
                />
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                  Apple로 시작하기
                </Text>
              </TouchableOpacity>

              {/* Google 로그인 (iOS에서도 제공) */}
              <TouchableOpacity 
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleLogin}
              >
                <Image
                  source={require('../../assets/socialLogo/GoogleLogo.png')}
                  style={styles.socialLogo}
                  resizeMode="contain"
                />
                <Text style={[styles.socialButtonText, styles.googleButtonText]}>
                  Google로 시작하기
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Google 로그인 (Android 전용) */}
              <TouchableOpacity 
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleLogin}
              >
                <Image
                  source={require('../../assets/socialLogo/GoogleLogo.png')}
                  style={styles.socialLogo}
                  resizeMode="contain"
                />
                <Text style={[styles.socialButtonText, styles.googleButtonText]}>
                  Google로 시작하기
                </Text>
              </TouchableOpacity>
            </>
          )}

        </View>

        {/* 자동 로그인 설정 */}
        <View style={styles.autoLoginContainer}>
          <View style={styles.autoLoginRow}>
            <Text style={styles.autoLoginText}>자동 로그인</Text>
            <Switch
              value={autoLoginEnabled}
              onValueChange={handleAutoLoginToggle}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={autoLoginEnabled ? '#FFFFFF' : '#FFFFFF'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>
          <Text style={styles.autoLoginDescription}>
            자동 로그인을 활성화하면 다음에 앱을 실행할 때 자동으로 로그인됩니다.
          </Text>
        </View>

        {/* 나중에 하기 버튼 - AuthGuard에서 호출된 경우에만 표시 */}
        {showBackButton && (
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkipLogin}
          >
            <Text style={styles.skipButtonText}>나중에 하기</Text>
          </TouchableOpacity>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 40,
    lineHeight: 24,
  },
  socialButtonsContainer: {
    marginTop: 40,
    gap: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderWidth: 1,
    borderColor: '#FEE500',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#000000',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  socialLogo: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  socialLogoApple:{
    width: 20,
    height: 20,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  kakaoButtonText: {
    color: '#000000',
  },
  appleButtonText: {
    color: '#FFFFFF',
  },
  googleButtonText: {
    color: '#3C4043',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  skipButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  autoLoginContainer: {
    marginTop: 32,
    paddingHorizontal: 4,
  },
  autoLoginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  autoLoginText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  autoLoginDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});