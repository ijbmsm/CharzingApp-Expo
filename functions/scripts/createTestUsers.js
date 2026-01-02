/**
 * 테스트용 더미 사용자 생성 스크립트
 *
 * 생성되는 사용자:
 * 1. test-user-with-referral: 추천 코드만 있는 사용자 (쿠폰 없음)
 * 2. test-user-with-coupon: 추천 코드 + 쿠폰 있는 사용자
 * 3. test-user-basic: 추천 코드도 쿠폰도 없는 기본 사용자
 *
 * 실행: node scripts/createTestUsers.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('/Users/sungmin/Downloads/charzing-d1600-firebase-adminsdk-fbsvc-b0bddaf420.json');

// Use service account credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'charzing-d1600',
});

const db = admin.firestore();
const auth = admin.auth();

async function createTestUsers() {
  try {
    console.log('🔧 테스트 사용자 생성 시작...\n');

    // 1. 추천 코드만 있는 사용자
    console.log('1️⃣ 추천 코드만 있는 사용자 생성 중...');
    const user1 = await createUser({
      uid: 'test-user-with-referral',
      email: 'test-referral@charzing.test',
      displayName: '김추천',
      phoneNumber: '010-1111-1111',
      referralCode: 'CHZ-TEST1',
      withCoupon: false,
    });
    console.log(`✅ 생성 완료: ${user1.email}`);
    console.log(`   추천 코드: ${user1.referralCode}\n`);

    // 2. 쿠폰이 있는 사용자
    console.log('2️⃣ 쿠폰이 있는 사용자 생성 중...');
    const user2 = await createUser({
      uid: 'test-user-with-coupon',
      email: 'test-coupon@charzing.test',
      displayName: '박쿠폰',
      phoneNumber: '010-2222-2222',
      referralCode: 'CHZ-TEST2',
      withCoupon: true,
    });
    console.log(`✅ 생성 완료: ${user2.email}`);
    console.log(`   추천 코드: ${user2.referralCode}`);
    console.log(`   쿠폰 개수: 1개 (10,000원 할인)\n`);

    // 3. 기본 사용자 (추천 코드만)
    console.log('3️⃣ 기본 사용자 생성 중...');
    const user3 = await createUser({
      uid: 'test-user-basic',
      email: 'test-basic@charzing.test',
      displayName: '이기본',
      phoneNumber: '010-3333-3333',
      referralCode: 'CHZ-TEST3',
      withCoupon: false,
    });
    console.log(`✅ 생성 완료: ${user3.email}`);
    console.log(`   추천 코드: ${user3.referralCode}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 모든 테스트 사용자 생성 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 생성된 사용자 목록:');
    console.log('1. test-referral@charzing.test (추천 코드: CHZ-TEST1)');
    console.log('2. test-coupon@charzing.test (추천 코드: CHZ-TEST2, 쿠폰 1개)');
    console.log('3. test-basic@charzing.test (추천 코드: CHZ-TEST3)\n');
    console.log('🔑 비밀번호: test123456\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 사용자 생성 실패:', error);
    process.exit(1);
  }
}

async function createUser({ uid, email, displayName, phoneNumber, referralCode, withCoupon }) {
  try {
    // Firebase Auth 사용자 생성 (비밀번호: test123456)
    let authUser;
    try {
      authUser = await auth.createUser({
        uid: uid,
        email: email,
        password: 'test123456',
        displayName: displayName,
        emailVerified: true,
      });
    } catch (error) {
      // 이미 존재하면 업데이트
      if (error.code === 'auth/uid-already-exists') {
        console.log(`   ℹ️ Auth 사용자가 이미 존재함, 업데이트 진행...`);
        authUser = await auth.updateUser(uid, {
          email: email,
          displayName: displayName,
          emailVerified: true,
        });
      } else {
        throw error;
      }
    }

    // Firestore users 문서 생성
    await db.collection('users').doc(uid).set({
      uid: uid,
      email: email,
      displayName: displayName,
      realName: displayName,
      phoneNumber: phoneNumber,
      phoneNumberNormalized: phoneNumber.replace(/[^0-9]/g, ''),
      provider: 'email',
      referralCode: referralCode,
      isRegistrationComplete: true,
      isActive: true,
      isGuest: false,
      agreedToTerms: true,
      agreedToPrivacy: true,
      agreedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // referralCodes 문서 생성
    await db.collection('referralCodes').doc(referralCode).set({
      code: referralCode,
      userId: uid,
      ownerUserId: uid,
      ownerType: 'user',
      status: 'active',
      usedCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 쿠폰이 필요한 경우 쿠폰 발급
    if (withCoupon) {
      const now = admin.firestore.Timestamp.now();
      const expiresAt = admin.firestore.Timestamp.fromMillis(
        now.toMillis() + 90 * 24 * 60 * 60 * 1000 // 90일 후
      );

      const couponRef = db.collection('userCoupons').doc();
      await couponRef.set({
        id: couponRef.id,
        userId: uid,
        couponId: 'referral-welcome',
        couponName: '추천 친구 웰컴 쿠폰',
        couponDescription: '추천인 코드로 가입하신 분께 드리는 할인 쿠폰입니다',
        discountType: 'fixed',
        discountAmount: 10000,
        issueReason: 'referral',
        referralCode: 'CHZ-ADMIN', // 관리자가 발급한 것으로 표시
        status: 'active',
        issuedAt: now,
        expiresAt: expiresAt,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      uid,
      email,
      displayName,
      referralCode,
      withCoupon,
    };
  } catch (error) {
    console.error(`   ❌ ${email} 생성 실패:`, error);
    throw error;
  }
}

createTestUsers();
