const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkAllAudiModels() {
  console.log('🔍 Firebase에서 아우디 전체 모델 목록 확인...\n');
  
  try {
    const brandRef = db.collection('vehicles').doc('audi');
    const modelsSnapshot = await brandRef.collection('models').get();
    
    console.log(`📋 아우디 총 ${modelsSnapshot.size}개 모델:\n`);
    
    const models = [];
    modelsSnapshot.forEach((doc) => {
      models.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    // 모델 ID로 정렬
    models.sort((a, b) => a.id.localeCompare(b.id));
    
    models.forEach(({id, data}) => {
      console.log(`📁 ${id}:`);
      console.log(`   한글명: ${data.name || '미설정'}`);
      console.log(`   영문명: ${data.englishName || '미설정'}`);
      
      if (data.trims && data.trims.length > 0) {
        console.log(`   트림 ${data.trims.length}개:`);
        data.trims.forEach((trim) => {
          if (trim.variants && trim.variants.length > 0) {
            trim.variants.forEach(variant => {
              console.log(`     - ${variant.trimName} (${variant.trimId})`);
            });
          }
        });
      } else {
        console.log(`   트림: 없음 (기존 구조)`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 조회 중 오류:', error);
  }
}

checkAllAudiModels();