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

async function checkImageUrls() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🖼️  실제 Firestore의 이미지 URL 확인`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // KIA Niro EV 확인
    const kiaDoc = await db.collection('vehicles').doc('kia').get();
    if (!kiaDoc.exists) {
      console.log('❌ KIA 브랜드 문서 없음');
      return;
    }

    const niroDoc = await db.collection('vehicles').doc('kia').collection('models').doc('niro-ev').get();
    if (!niroDoc.exists) {
      console.log('❌ Niro EV 모델 문서 없음');
      return;
    }

    const niroData = niroDoc.data();
    console.log('📌 KIA Niro EV 모델 데이터:');
    console.log(`   - 모델 imageUrl: ${niroData.imageUrl || '없음'}`);

    if (niroData.trims && niroData.trims.length > 0) {
      console.log(`\n   트림 정보:`);
      niroData.trims.forEach((trim, trimIdx) => {
        console.log(`   \n   트림 ${trimIdx + 1}: ${trim.name || '이름 없음'}`);
        if (trim.variants && trim.variants.length > 0) {
          trim.variants.forEach((variant, varIdx) => {
            console.log(`      Variant ${varIdx}: ${JSON.stringify(variant.years || [])}`);
            console.log(`         - imageUrl: ${variant.imageUrl || '없음'}`);
            console.log(`         - range: ${variant.range || '없음'}`);
            console.log(`         - batteryCapacity: ${variant.batteryCapacity || '없음'}`);
          });
        }
      });
    }

    // 현대 IONIQ-5도 확인
    console.log(`\n${'='.repeat(80)}\n`);

    const hyundaiDoc = await db.collection('vehicles').doc('hyundai').collection('models').doc('ioniq-5').get();
    if (hyundaiDoc.exists) {
      const ioniq5Data = hyundaiDoc.data();
      console.log('📌 HYUNDAI IONIQ-5 모델 데이터:');
      console.log(`   - 모델 imageUrl: ${ioniq5Data.imageUrl || '없음'}`);

      if (ioniq5Data.trims && ioniq5Data.trims.length > 0) {
        console.log(`\n   트림 정보 (첫 번째만):`);
        const trim = ioniq5Data.trims[0];
        console.log(`   트림: ${trim.name || '이름 없음'}`);
        if (trim.variants && trim.variants.length > 0) {
          console.log(`      Variant 0: ${JSON.stringify(trim.variants[0].years || [])}`);
          console.log(`         - imageUrl: ${trim.variants[0].imageUrl || '없음'}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ 이미지 URL 확인 실패:', error);
  }
}

checkImageUrls()
  .then(() => {
    console.log('\n✅ 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
