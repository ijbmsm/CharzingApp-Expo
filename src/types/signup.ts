/**
 * 회원가입 관련 타입 정의
 */

export interface SocialUserBase {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

export interface KakaoUser extends SocialUserBase {
  kakaoId: string;
  provider: 'kakao';
}

export interface GoogleUser extends SocialUserBase {
  googleId: string;
  provider: 'google';
}

export interface AppleUser extends SocialUserBase {
  appleId: string;
  provider: 'apple';
}

export type SocialUser = KakaoUser | GoogleUser | AppleUser;

export interface SignupFormData {
  realName: string;
  phoneNumber: string;
  address: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
}

export interface RegistrationData extends SignupFormData {
  agreedAt: Date;
}

export interface AgreementCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  title: string;
  required: boolean;
  onViewDetails?: () => void;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

export interface ValidationErrors {
  realName?: string;
  phoneNumber?: string;
  address?: string;
  agreements?: string;
}

export const VALIDATION_MESSAGES = {
  REQUIRED_NAME: '이름을 입력해주세요.',
  REQUIRED_PHONE: '전화번호를 입력해주세요.',
  REQUIRED_ADDRESS: '주소를 입력해주세요.',
  INVALID_PHONE: '올바른 전화번호 형식을 입력해주세요. (예: 01012345678)',
  REQUIRED_TERMS: '이용약관에 동의해주세요.',
  REQUIRED_PRIVACY: '개인정보 처리방침에 동의해주세요.',
  INVALID_NAME_LENGTH: '이름은 2자 이상 20자 이하로 입력해주세요.',
} as const;

export const PHONE_REGEX = /^[0-9]{10,11}$/;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 20;
