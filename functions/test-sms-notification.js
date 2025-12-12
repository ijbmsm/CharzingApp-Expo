/**
 * SMS 알림 테스트용 예약 생성 스크립트
 *
 * 실행 방법:
 * cd /Users/sungmin/CharzingApp-Expo/functions
 * node test-sms-notification.js
 */

const admin = require('firebase-admin');

// Firebase Admin 초기화 (Firebase CLI 인증 사용)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 테스트 예약 생성
 */
async function createTestReservation() {
  console.log('🧪 SMS 알림 테스트 예약 생성 시작...\n');

  try {
    // 테스트 예약 데이터
    const testReservation = {
      // 사용자 정보
      userId: '7eMo4XW2HpO2VjABejiS6PxZj3K3',
      userName: '테스트 고객',
      userPhone: '010-1234-5678',
      userEmail: 'test@example.com',

      // 차량 정보
      vehicleBrand: '현대',
      vehicleModel: '아이오닉 5',
      vehicleYear: '2024',

      // 위치 정보
      address: '서울시 강남구 테헤란로 123',
      detailAddress: '456호',

      // 예약 정보
      requestedDate: admin.firestore.Timestamp.fromDate(
        new Date('2025-12-20T14:30:00')
      ),
      serviceType: '일반 진단',
      servicePrice: 50000,
      notes: 'SMS 알림 테스트 예약입니다.',

      // 상태 정보
      status: 'pending',
      paymentStatus: 'pending_payment',

      // 타임스탬프
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Firestore에 예약 생성
    const reservationRef = await db.collection('diagnosisReservations').add(testReservation);

    console.log('✅ 테스트 예약 생성 완료!');
    console.log('예약 ID:', reservationRef.id);
    console.log('\nSMS 알림이 01074771455로 발송됩니다...');
    console.log('Firebase Functions 로그를 확인하세요:\n');
    console.log('   firebase functions:log\n');

    // 예약 정보 출력
    console.log('생성된 예약 정보:');
    console.log('   - 고객명:', testReservation.userName);
    console.log('   - 연락처:', testReservation.userPhone);
    console.log('   - 차량:', `${testReservation.vehicleBrand} ${testReservation.vehicleModel} ${testReservation.vehicleYear}`);
    console.log('   - 희망일시:', new Date('2025-12-20T14:30:00').toLocaleString('ko-KR'));
    console.log('   - 서비스:', `${testReservation.serviceType} (${testReservation.servicePrice.toLocaleString()}원)`);

    // 5초 후 종료 (Firestore 트리거 실행 시간 확보)
    console.log('\n⏳ 5초 후 종료됩니다...');
    setTimeout(() => {
      console.log('\n✅ 테스트 완료!');
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error('❌ 예약 생성 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
createTestReservation();
