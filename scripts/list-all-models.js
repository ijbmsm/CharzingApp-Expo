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

async function listAllModels(brandId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 ${brandId} 브랜드의 모든 모델 목록`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const modelsRef = db.collection('vehicles').doc(brandId).collection('models');
    const snapshot = await modelsRef.get();

    if (snapshot.empty) {
      console.log(`❌ ${brandId} 브랜드에 모델이 없습니다.`);
      return [];
    }

    const models = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      models.push({
        id: doc.id,
        name: data.name,
        englishName: data.englishName,
        trimsCount: data.trims?.length || 0
      });
    });

    console.log(`✅ 총 ${models.length}개 모델 발견:\n`);
    models.forEach((model, index) => {
      console.log(`  ${index + 1}. ID: ${model.id}`);
      console.log(`     - 이름: ${model.name}`);
      console.log(`     - 영문: ${model.englishName}`);
      console.log(`     - 트림 수: ${model.trimsCount}`);
      console.log('');
    });

    return models;

  } catch (error) {
    console.error('❌ 모델 목록 조회 실패:', error);
    return [];
  }
}

// 실행
const brandId = process.argv[2] || 'KIA';

listAllModels(brandId)
  .then(() => {
    console.log('✅ 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
