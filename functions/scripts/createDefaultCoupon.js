/**
 * 기본 추천 쿠폰 생성 스크립트
 *
 * 실행: node scripts/createDefaultCoupon.js
 */

const admin = require('firebase-admin');

// Use application default credentials
admin.initializeApp({
  projectId: 'charzing-d1600',
});

const db = admin.firestore();

async function createDefaultCoupon() {
  try {
    const couponId = 'referral-welcome';
    const couponData = {
      id: couponId,
      name: '추천 친구 웰컴 쿠폰',
      description: '추천인 코드로 가입하신 분께 드리는 할인 쿠폰입니다',
      type: 'referral',
      discountType: 'fixed',
      discountAmount: 10000,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('coupons').doc(couponId).set(couponData);

    console.log('✅ 기본 추천 쿠폰 생성 완료:', couponId);
    console.log('쿠폰 내용:', couponData);

    process.exit(0);
  } catch (error) {
    console.error('❌ 쿠폰 생성 실패:', error);
    process.exit(1);
  }
}

createDefaultCoupon();
