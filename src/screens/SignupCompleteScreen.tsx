import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { setUser } from '../store/slices/authSlice';
import firebaseService from '../services/firebaseService';
import Header from '../components/Header';

interface RouteParams {
  kakaoUser?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    kakaoId: string;
    provider: 'kakao';
  };
  googleUser?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    googleId: string;
    provider: 'google';
  };
}

export default function SignupCompleteScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { kakaoUser, googleUser } = route.params as RouteParams;
  
  // 실제 사용할 사용자 데이터 결정
  const currentUser = kakaoUser || googleUser;
  const provider = kakaoUser ? 'kakao' : 'google';

  // 기존 사용자 확인 - Firebase에서 사용자 프로필이 있는지 확인
  useEffect(() => {
    if (!currentUser) {
      console.error('❌ SignupCompleteScreen: 사용자 정보가 없습니다.');
      navigation.goBack();
      return;
    }
    
    console.log('🎯 SignupCompleteScreen useEffect 실행됨');
    console.log('🎯 현재 사용자 데이터:', { provider, user: currentUser });
    
    const checkExistingUser = async () => {
      try {
        console.log('🔍 기존 사용자 확인 중...', currentUser.uid);
        const existingProfile = await firebaseService.getUserProfile(currentUser.uid);
        console.log('🔍 조회된 프로필:', existingProfile);
        
        if (existingProfile && existingProfile.phoneNumber) {
          // 기존 사용자로 확인되면 바로 로그인 완료 처리
          console.log('✅ 기존 사용자 확인됨, 바로 로그인 처리');
          console.log('✅ Redux에 사용자 설정:', currentUser);
          dispatch(setUser(currentUser));
          
          // 로그인 완료 후 홈으로 돌아가기 (스택 리셋)
          console.log('🔙 로그인 완료, 홈으로 돌아가기');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
          return;
        } else {
          console.log('ℹ️ 신규 사용자 - 회원가입 양식 표시');
        }
      } catch (error) {
        console.log('❌ 사용자 프로필 조회 에러:', error);
        console.log('ℹ️ 신규 사용자로 처리 - 회원가입 계속 진행');
      }
    };
    
    checkExistingUser();
  }, [currentUser, dispatch, provider]);

  const handleCompleteSignup = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('입력 오류', '전화번호를 입력해주세요.');
      return;
    }

    if (!address.trim()) {
      Alert.alert('입력 오류', '주소를 입력해주세요.');
      return;
    }

    // 전화번호 형식 검증 (간단한 검증)
    const phoneRegex = /^[0-9]{10,11}$/;
    const cleanPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    
    if (!phoneRegex.test(cleanPhoneNumber)) {
      Alert.alert('입력 오류', '올바른 전화번호 형식을 입력해주세요. (예: 01012345678)');
      return;
    }

    setIsLoading(true);

    try {
      // Firebase에 추가 정보 저장
      await firebaseService.completeRegistration(currentUser!.uid, {
        phoneNumber: cleanPhoneNumber,
        address: address.trim(),
      });

      // Redux 스토어에 완성된 사용자 정보 저장
      dispatch(setUser(currentUser!));

      Alert.alert(
        '회원가입 완료',
        '환영합니다! 차징 서비스를 이용해보세요.',
        [
          {
            text: '확인',
            onPress: () => {
              // 스택을 리셋하고 홈으로 이동 (스택 쌓임 방지)
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                })
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('회원가입 완료 처리 실패:', error);
      Alert.alert('오류', '회원가입 완료 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    // 숫자만 추출
    const numbers = text.replace(/[^\d]/g, '');
    
    // 전화번호 형식으로 포맷팅
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return numbers.replace(/(\d{3})(\d{1,4})/, '$1-$2');
    } else {
      return numbers.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="회원가입 완료" showLogo={false} />
      
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              환영합니다! {currentUser?.displayName || '사용자'}님
            </Text>
            <Text style={styles.welcomeDescription}>
              서비스 이용을 위해 추가 정보를 입력해주세요.
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>전화번호 *</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                placeholder="010-1234-5678"
                keyboardType="phone-pad"
                maxLength={13}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>주소 *</Text>
              <TextInput
                style={[styles.input, styles.addressInput]}
                value={address}
                onChangeText={setAddress}
                placeholder="서울시 강남구 테헤란로 123"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isLoading}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.completeButton, isLoading && styles.disabledButton]}
            onPress={handleCompleteSignup}
            disabled={isLoading}
          >
            <Text style={styles.completeButtonText}>
              {isLoading ? '처리 중...' : '회원가입 완료'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#1F2937',
  },
  addressInput: {
    height: 80,
    paddingTop: 16,
  },
  completeButton: {
    backgroundColor: '#4495E8',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
});