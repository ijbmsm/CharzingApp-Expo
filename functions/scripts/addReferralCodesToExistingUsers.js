/**
 * 기존 사용자에게 추천 코드 부여 스크립트
 *
 * 실행: node scripts/addReferralCodesToExistingUsers.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('/Users/sungmin/Downloads/charzing-d1600-firebase-adminsdk-fbsvc-b0bddaf420.json');

// Use service account credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'charzing-d1600',
});

const db = admin.firestore();

/**
 * 랜덤 추천 코드 생성 (CHZ-XXXXXX)
 */
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 6;
  let code = 'CHZ-';

  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

/**
 * 추천 코드 중복 체크
 */
async function isCodeUnique(code) {
  const snapshot = await db.collection('referralCodes').doc(code).get();
  return !snapshot.exists;
}

/**
 * 고유한 추천 코드 생성 (중복 체크)
 */
async function generateUniqueReferralCode() {
  let code;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateReferralCode();
    attempts++;

    if (attempts >= maxAttempts) {
      throw new Error('추천 코드 생성 실패: 최대 시도 횟수 초과');
    }
  } while (!(await isCodeUnique(code)));

  return code;
}

/**
 * 기존 사용자에게 추천 코드 추가
 */
async function addReferralCodesToExistingUsers() {
  try {
    console.log('🔧 기존 사용자 추천 코드 부여 시작...\n');

    // 1. 모든 사용자 조회
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 전체 사용자 수: ${usersSnapshot.size}명\n`);

    // 2. referralCode가 없는 사용자 필터링
    const usersWithoutCode = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (!userData.referralCode) {
        usersWithoutCode.push({
          id: doc.id,
          ...userData
        });
      }
    });

    console.log(`🔍 추천 코드가 없는 사용자: ${usersWithoutCode.length}명\n`);

    if (usersWithoutCode.length === 0) {
      console.log('✅ 모든 사용자가 이미 추천 코드를 가지고 있습니다.');
      process.exit(0);
    }

    // 3. 각 사용자에게 추천 코드 부여
    let successCount = 0;
    let failCount = 0;

    for (const user of usersWithoutCode) {
      try {
        console.log(`👤 처리 중: ${user.displayName || user.realName || user.email} (${user.id})`);

        // 고유한 추천 코드 생성
        const referralCode = await generateUniqueReferralCode();
        console.log(`   생성된 코드: ${referralCode}`);

        // users 문서 업데이트
        await db.collection('users').doc(user.id).update({
          referralCode: referralCode,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // referralCodes 컬렉션에 문서 생성
        await db.collection('referralCodes').doc(referralCode).set({
          code: referralCode,
          userId: user.id,
          ownerUserId: user.id,
          ownerType: 'user',
          status: 'active',
          usedCount: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`   ✅ 추천 코드 부여 완료\n`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ 추천 코드 부여 실패:`, error.message);
        console.error(`   사용자 ID: ${user.id}\n`);
        failCount++;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 작업 완료 통계');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 성공: ${successCount}명`);
    console.log(`❌ 실패: ${failCount}명`);
    console.log(`📝 총 처리: ${successCount + failCount}명\n`);

    process.exit(0);

  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
addReferralCodesToExistingUsers();
