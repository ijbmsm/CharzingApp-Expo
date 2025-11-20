const admin = require('firebase-admin');
const serviceAccount = require('./charzing-d1600-firebase-adminsdk-avqwb-b9b52ff48c.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkRecentReservations() {
  try {
    console.log('📋 최근 5개 예약 조회 중...\n');

    const snapshot = await db
      .collection('diagnosisReservations')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    if (snapshot.empty) {
      console.log('예약이 없습니다.');
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.();
      const requestedDate = data.requestedDate?.toDate?.();

      console.log(`📌 예약 ID: ${doc.id}`);
      console.log(`   상태: ${data.status}`);
      console.log(`   사용자: ${data.userName} (${data.userPhone})`);
      console.log(`   생성일: ${createdAt}`);
      console.log(`   예약일: ${requestedDate}`);
      console.log(`   주소: ${data.address}`);
      console.log('---\n');
    });

  } catch (error) {
    console.error('❌ 조회 실패:', error);
  } finally {
    process.exit();
  }
}

checkRecentReservations();
