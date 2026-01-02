import * as admin from 'firebase-admin';

/**
 * 추천 코드 생성 유틸리티
 *
 * 형식: CHZ-{4~6자리}
 * - 알파벳 대문자 (A-Z)
 * - 숫자 (1-9, 0 제외)
 * - 대소문자 구분 없음 (저장 시 대문자로 통일)
 */

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789'; // 혼동 쉬운 문자 제외 (I, O, 0)
const MIN_LENGTH = 4;
const MAX_LENGTH = 6;

/**
 * 랜덤 추천 코드 생성 (CHZ-XXXX 형식)
 */
function generateReferralCode(): string {
  const length = Math.floor(Math.random() * (MAX_LENGTH - MIN_LENGTH + 1)) + MIN_LENGTH;
  let code = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[randomIndex];
  }

  return `CHZ-${code}`;
}

/**
 * 추천 코드 중복 체크
 */
async function isReferralCodeUnique(code: string): Promise<boolean> {
  const db = admin.firestore();

  // users 컬렉션에서 중복 체크
  const userQuery = await db.collection('users')
    .where('referralCode', '==', code)
    .limit(1)
    .get();

  if (!userQuery.empty) {
    return false;
  }

  // referralCodes 컬렉션에서도 체크 (존재하는 경우)
  const referralCodeDoc = await db.collection('referralCodes')
    .doc(code)
    .get();

  return !referralCodeDoc.exists;
}

/**
 * 고유한 추천 코드 생성 (중복 체크 포함)
 * 최대 10번 시도
 */
export async function generateUniqueReferralCode(): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateReferralCode();
    const isUnique = await isReferralCodeUnique(code);

    if (isUnique) {
      console.log(`✅ 고유 추천 코드 생성: ${code} (시도 ${attempt + 1}/${maxAttempts})`);
      return code;
    }

    console.log(`⚠️ 중복된 추천 코드: ${code}, 재시도 중... (${attempt + 1}/${maxAttempts})`);
  }

  throw new Error('추천 코드 생성 실패: 최대 시도 횟수 초과');
}

/**
 * 추천 코드 정규화 (대문자로 변환, 공백 제거)
 */
export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * 추천 코드 유효성 검증 (형식)
 */
export function isValidReferralCodeFormat(code: string): boolean {
  // CHZ-{4~6자리} 형식
  const regex = /^CHZ-[A-Z0-9]{4,6}$/;
  return regex.test(normalizeReferralCode(code));
}
