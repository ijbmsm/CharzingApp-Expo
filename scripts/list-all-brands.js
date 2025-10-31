const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const db = admin.firestore();

async function listAllBrands() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🏢 Firestore의 모든 브랜드 목록`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const vehiclesRef = db.collection('vehicles');
    const snapshot = await vehiclesRef.get();

    if (snapshot.empty) {
      console.log('❌ vehicles 컬렉션이 비어있습니다.');
      return;
    }

    console.log(`✅ 총 ${snapshot.size}개 브랜드 발견:\n`);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`📌 브랜드 ID: ${doc.id}`);
      console.log(`   - 이름: ${data.name || '없음'}`);
      console.log(`   - 영문: ${data.englishName || '없음'}`);

      // 해당 브랜드의 모델 개수 확인
      const modelsRef = db.collection('vehicles').doc(doc.id).collection('models');
      const modelsSnapshot = await modelsRef.get();
      console.log(`   - 모델 수: ${modelsSnapshot.size}`);

      if (modelsSnapshot.size > 0 && modelsSnapshot.size <= 10) {
        console.log(`   - 모델 목록:`);
        modelsSnapshot.forEach(modelDoc => {
          const modelData = modelDoc.data();
          console.log(`     • ${modelDoc.id} (${modelData.name})`);
        });
      }

      console.log('');
    }

  } catch (error) {
    console.error('❌ 브랜드 목록 조회 실패:', error);
  }
}

// 실행
listAllBrands()
  .then(() => {
    console.log('✅ 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
