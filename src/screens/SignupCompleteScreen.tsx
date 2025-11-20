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
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { setUser } from '../store/slices/authSlice';
import firebaseService from '../services/firebaseService';
import AgreementCheckbox from '../components/AgreementCheckbox';
import { KakaoUser, GoogleUser, AppleUser } from '../types/signup';
import {
  validateSignupForm,
  formatPhoneNumber,
  cleanPhoneNumber,
} from '../utils/signupValidation';
import { convertToLineSeedFont } from '../styles/fonts';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import sentryLogger from '../utils/sentryLogger';

interface RouteParams {
  kakaoUser?: KakaoUser;
  googleUser?: GoogleUser;
  appleUser?: AppleUser;
}

const COLORS = {
  BACKGROUND: '#F9FAFB',
  PRIMARY: '#4495E8',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_ERROR: '#EF4444',
  BORDER: '#E5E7EB',
  INPUT_BG: '#FFFFFF',
  DISABLED: '#9CA3AF',
} as const;

export default function SignupCompleteScreen() {
  const [realName, setRealName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { kakaoUser, googleUser, appleUser } = route.params as RouteParams;
  const insets = useSafeAreaInsets();

  const currentUser = kakaoUser || googleUser || appleUser;
  const provider = kakaoUser ? 'kakao' : googleUser ? 'google' : 'apple';

  // 나중에 하기: 로그아웃 후 로그인 화면으로 이동
  const handleSkipSignup = async () => {
    try {
      // Firebase Auth 로그아웃
      const auth = getAuth();
      await auth.signOut();
      console.log('✅ 회원가입 건너뛰기 - 로그아웃 완료');

      // 로그인 화면으로 이동 (showBackButton: true로 "나중에 하기" 버튼 표시)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{
            name: 'Login',
            params: { showBackButton: true }
          }],
        })
      );
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      // 에러가 나도 로그인 화면으로 이동
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{
            name: 'Login',
            params: { showBackButton: true }
          }],
        })
      );
    }
  };

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

          // 🔥 Guest 계정 자동 연결 (전화번호 기반)
          // 매번 로그인 시 체크 (이미 연결된 Guest는 자동으로 건너뜀)
          try {
            const linkedGuestCount = await firebaseService.linkGuestsByPhoneNumber(
              currentUser.uid,
              existingProfile.phoneNumber
            );
            if (linkedGuestCount > 0) {
              console.log(`✅ Guest 연결 완료: ${linkedGuestCount}개`);
            }
          } catch (error) {
            console.error('❌ Guest 연결 실패 (무시하고 진행):', error);
            // Guest 연결 실패해도 로그인은 계속 진행
          }

          // Firestore에서 조회한 프로필 데이터를 포함하여 Redux에 저장
          const completeUserData = {
            ...currentUser,
            realName: existingProfile.realName || currentUser.displayName,
            phoneNumber: existingProfile.phoneNumber,
            displayName: existingProfile.displayName || currentUser.displayName,
          };

          console.log('✅ Redux에 사용자 설정:', completeUserData);
          dispatch(setUser(completeUserData));

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
  }, [currentUser, dispatch, provider, navigation]);

  const handleCompleteSignup = async () => {
    if (!currentUser) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    // 유효성 검증
    const validationResult = validateSignupForm({
      realName,
      phoneNumber,
      agreedToTerms,
      agreedToPrivacy,
    });

    if (!validationResult.isValid) {
      const firstError = Object.values(validationResult.errors)[0];
      Alert.alert('입력 오류', firstError);
      return;
    }

    setIsLoading(true);

    try {
      const cleanPhone = cleanPhoneNumber(phoneNumber);

      // Firebase에 사용자 문서 최초 생성
      await firebaseService.completeRegistration(currentUser.uid, {
        email: currentUser.email,
        displayName: currentUser.displayName || realName,
        realName: realName.trim(),
        phoneNumber: cleanPhone,
        provider: provider as 'kakao' | 'google' | 'apple',
        photoURL: currentUser.photoURL,
        kakaoId: kakaoUser?.kakaoId,
        googleId: googleUser?.googleId,
        appleId: appleUser?.appleId,
        agreedToTerms,
        agreedToPrivacy,
        agreedAt: new Date(),
      });

      // 🔥 Guest 계정 자동 연결 (전화번호 기반)
      let linkedGuestCount = 0;
      try {
        linkedGuestCount = await firebaseService.linkGuestsByPhoneNumber(
          currentUser.uid,
          cleanPhone
        );
        console.log(`✅ Guest 연결 완료: ${linkedGuestCount}개`);
      } catch (error) {
        console.error('❌ Guest 연결 실패 (무시하고 진행):', error);
        // Guest 연결 실패해도 회원가입은 계속 진행
      }

      // Redux 스토어에 완성된 사용자 정보 저장 (realName과 phoneNumber 포함)
      dispatch(setUser({
        ...currentUser,
        realName: realName.trim(),
        phoneNumber: cleanPhone,
        displayName: currentUser.displayName || realName.trim(),
      }));

      // Crashlytics 로그
      sentryLogger.logSignupComplete(
        currentUser.uid,
        provider as 'kakao' | 'google' | 'apple'
      );

      // 🔥 Guest 리포트 연결 여부에 따라 다른 메시지 표시
      const welcomeMessage = linkedGuestCount > 0
        ? `환영합니다! 차징 서비스를 이용해보세요.\n\n이전에 작성된 ${linkedGuestCount}건의 진단 리포트가 회원님의 계정에 연결되었습니다.`
        : '환영합니다! 차징 서비스를 이용해보세요.';

      Alert.alert(
        '회원가입 완료',
        welcomeMessage,
        [
          {
            text: '확인',
            onPress: () => {
              // 스택을 리셋하고 홈으로 이동
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
      sentryLogger.logError('회원가입 완료 처리 실패', error as Error);
      Alert.alert('오류', '회원가입 완료 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const TERMS_CONTENT = `제1조 (목적)
본 약관은 주식회사 블루코어(이하 "회사")가 운영하는 차징(CHARZING) 전기차 배터리 진단 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
• "서비스"란 회사가 운영하는 모바일 애플리케이션 및 웹사이트를 통해 제공되는 전기차 배터리 진단, 리포트 제공, 예약, 결제 등의 일체의 행위를 말합니다.
• "이용자"란 회사의 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 고객을 말합니다.
• "진단 기사"란 회사 또는 회사와 계약한 제3자 중 실제 진단 서비스를 수행하는 자를 말합니다.

제3조 (약관의 효력 및 변경)
• 본 약관은 서비스를 이용하는 모든 이용자에게 적용됩니다.
• 회사는 관련 법령을 위반하지 않는 범위 내에서 약관을 개정할 수 있으며, 변경 시 앱 또는 홈페이지에 공지합니다.
• 변경된 약관은 공지 시점부터 효력이 발생합니다.

제4조 (서비스의 제공 및 성격)
• 회사는 전기차 배터리의 상태를 측정하여 데이터와 리포트를 제공하는 정보제공형 기술 서비스 사업자입니다.
• 회사는 자동차관리법상 정비업이 아니며, 차량의 수리·정비·보증 행위를 수행하지 않습니다.
• 진단 결과는 측정 시점의 데이터에 한정되며, 향후 차량 상태를 보증하지 않습니다.

제5조 (회원가입 및 로그인)
• 이용자는 카카오, 구글, 애플 계정을 통해 회원가입을 진행합니다.
• 이용자는 등록된 정보가 정확하지 않을 경우 서비스 이용이 제한될 수 있습니다.
• 회사는 허위 정보 입력, 비정상적 이용행위가 확인될 경우 사전 통보 없이 이용을 제한할 수 있습니다.

제6조 (이용계약의 성립)
• 이용자는 앱 또는 웹페이지에서 서비스 예약 및 결제를 완료함으로써 이용계약이 성립됩니다.
• 결제는 PG사를 통한 전자결제로 처리되며, 결제 금액은 회사 계좌로 직접 입금됩니다.

제7조 (회사의 의무)
• 회사는 관련 법령 및 본 약관에서 정한 바에 따라 서비스를 안정적으로 제공합니다.
• 회사는 이용자의 개인정보를 보호하며, 개인정보 처리방침을 준수합니다.
• 회사는 진단 결과에 대해 기술적·물리적 안정성을 확보하기 위해 합리적인 노력을 다합니다.

제8조 (이용자의 의무)
• 이용자는 차량의 합법적인 소유자이거나 소유자의 동의를 얻은 자여야 합니다.
• 이용자는 진단 과정에서 차량 접근 및 OBD2 포트 연결을 허용해야 합니다.
• 이용자는 회사의 서비스를 부정 사용하거나 타인의 권리를 침해하는 행위를 해서는 안 됩니다.

제9조 (서비스의 중단)
• 회사는 천재지변, 장비 고장, 통신 장애 등의 불가항력적인 사유로 인해 일시적으로 서비스를 중단할 수 있습니다.
• 이 경우 회사는 사전 또는 사후에 이용자에게 통보합니다.

제10조 (지식재산권)
• 서비스 내에서 제공되는 이미지, 데이터, 리포트 등 일체의 저작권은 회사에 귀속됩니다.
• 이용자는 회사의 사전 동의 없이 이를 복제, 배포, 전송할 수 없습니다.

제11조 (분쟁 해결 및 관할 법원)
• 본 약관에 따른 분쟁은 회사의 본사 소재지 관할 법원(서울중앙지방법원)을 제1심 전속 관할 법원으로 합니다.`;

  const PRIVACY_CONTENT = `1. 개인정보의 수집 항목 및 방법

수집 항목
• 필수 항목: 이름, 연락처(전화번호), 차량번호, 차량모델, 예약일시, 결제정보
• 선택 항목: 이메일, 주행거리, 진단 요청 내용

수집 방법
• 앱 회원가입, 예약 페이지, 고객 문의, 제휴 플랫폼

2. 개인정보의 이용 목적
• 서비스 예약, 진단 수행, 리포트 발급, 고객 응대
• 결제 및 환불 처리
• 서비스 품질 향상 및 통계 분석

3. 개인정보의 보유 및 이용 기간
• 진단 리포트: 앱 내에서만 열람 가능하며, 서버에는 일시 저장 후 삭제
• 결제 및 거래정보: 「전자상거래법」에 따라 5년간 보관
• 민원·분쟁 처리 기록: 3년간 보관

4. 개인정보 제3자 제공 및 위탁
• 회사는 진단 수행을 위해 진단 기사에게 최소한의 정보를 제공합니다.
• 회사는 개인정보처리 위탁 시 개인정보보호법 제26조에 따른 계약을 체결하고 관리·감독합니다.

5. 개인정보의 파기 절차 및 방법
• 보유기간이 경과하거나 목적이 달성된 개인정보는 지체 없이 삭제됩니다.
• 전자 파일은 복구 불가능한 기술적 방법으로, 서류는 분쇄 또는 소각을 통해 파기합니다.

6. 이용자의 권리 및 행사 방법
• 이용자는 언제든지 본인의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다.
• 문의: info@charzing.kr / 070-8027-8903

7. 개인정보 보호책임자
• 성명: 주민성
• 직책: 대표이사
• 연락처: info@charzing.kr

8. 고지의 의무
• 본 방침은 2025년 10월 31일부터 적용됩니다.
• 변경 시 홈페이지 및 앱 공지사항을 통해 안내합니다.`;

  const handleViewTerms = () => {
    navigation.navigate('PolicyDetail', {
      title: '이용약관',
      content: TERMS_CONTENT,
    });
  };

  const handleViewPrivacy = () => {
    navigation.navigate('PolicyDetail', {
      title: '개인정보 처리방침',
      content: PRIVACY_CONTENT,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header with Close Button and Title */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleSkipSignup}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          서비스 이용을 위해{'\n'}추가 정보를 입력해주세요
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="person-outline" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.label}>이름</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={realName}
                  onChangeText={setRealName}
                  placeholder="홍길동"
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                  editable={!isLoading}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="call-outline" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.label}>전화번호</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={handlePhoneNumberChange}
                  placeholder="010-1234-5678"
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                  keyboardType="phone-pad"
                  maxLength={13}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Agreement Section */}
            <View style={styles.agreementSection}>
              <View style={styles.labelRow}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.agreementTitle}>약관 동의</Text>
              </View>

              <View style={styles.agreementList}>
                <AgreementCheckbox
                  checked={agreedToTerms}
                  onToggle={() => setAgreedToTerms(!agreedToTerms)}
                  title="이용약관 동의"
                  required={true}
                  onViewDetails={handleViewTerms}
                />

                <AgreementCheckbox
                  checked={agreedToPrivacy}
                  onToggle={() => setAgreedToPrivacy(!agreedToPrivacy)}
                  title="개인정보 처리방침 동의"
                  required={true}
                  onViewDetails={handleViewPrivacy}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Complete Button - Fixed at Bottom */}
        <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.completeButton, isLoading && styles.disabledButton]}
            onPress={handleCompleteSignup}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.buttonContent}>
                <Ionicons name="hourglass-outline" size={20} color="#FFFFFF" />
                <Text style={styles.completeButtonText}>처리 중...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.completeButtonText}>시작하기</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: COLORS.BACKGROUND,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: convertToLineSeedFont({
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 30,
    paddingHorizontal: 8,
  }),
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  formCard: {
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  label: convertToLineSeedFont({
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  }),
  inputWrapper: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    ...convertToLineSeedFont({
      fontWeight: '400',
    }),
  },
  agreementSection: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  agreementTitle: convertToLineSeedFont({
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  }),
  agreementList: {
    marginTop: 12,
    gap: 8,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: COLORS.BACKGROUND,
  },
  completeButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completeButtonText: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  }),
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#9CA3AF',
  },
});
