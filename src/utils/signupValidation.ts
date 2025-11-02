import {
  SignupFormData,
  ValidationResult,
  ValidationErrors,
  VALIDATION_MESSAGES,
  PHONE_REGEX,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
} from '../types/signup';

export function validateSignupForm(formData: SignupFormData): ValidationResult {
  const errors: ValidationErrors = {};

  // 이름 검증
  if (!formData.realName.trim()) {
    errors.realName = VALIDATION_MESSAGES.REQUIRED_NAME;
  } else if (
    formData.realName.trim().length < NAME_MIN_LENGTH ||
    formData.realName.trim().length > NAME_MAX_LENGTH
  ) {
    errors.realName = VALIDATION_MESSAGES.INVALID_NAME_LENGTH;
  }

  // 전화번호 검증
  if (!formData.phoneNumber.trim()) {
    errors.phoneNumber = VALIDATION_MESSAGES.REQUIRED_PHONE;
  } else {
    const cleanPhoneNumber = formData.phoneNumber.replace(/[^0-9]/g, '');
    if (!PHONE_REGEX.test(cleanPhoneNumber)) {
      errors.phoneNumber = VALIDATION_MESSAGES.INVALID_PHONE;
    }
  }

  // 약관 동의 검증
  if (!formData.agreedToTerms) {
    errors.agreements = VALIDATION_MESSAGES.REQUIRED_TERMS;
  } else if (!formData.agreedToPrivacy) {
    errors.agreements = VALIDATION_MESSAGES.REQUIRED_PRIVACY;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatPhoneNumber(text: string): string {
  // 숫자만 추출
  const numbers = text.replace(/[^\d]/g, '');

  // 전화번호 형식으로 포맷팅
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return numbers.replace(/(\d{3})(\d{1,4})/, '$1-$2');
  } else if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
  }

  // 11자리 초과는 잘라냄
  return numbers.slice(0, 11).replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
}

export function cleanPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[^0-9]/g, '');
}
