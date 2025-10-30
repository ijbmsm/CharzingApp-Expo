const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkAudiFirebase() {
  console.log('🔍 Firebase에서 아우디 모델 목록 확인...\n');
  
  try {
    const brandRef = db.collection('vehicles').doc('audi');
    const modelsSnapshot = await brandRef.collection('models').get();
    
    console.log(`📋 아우디 모델 ${modelsSnapshot.size}개 발견:\n`);
    
    modelsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📁 ${doc.id}:`);
      console.log(`   한글명: ${data.name}`);
      console.log(`   영문명: ${data.englishName}`);
      
      if (data.trims && data.trims.length > 0) {
        console.log(`   트림 ${data.trims.length}개:`);
        data.trims.forEach((trim, index) => {
          if (trim.variants && trim.variants.length > 0) {
            trim.variants.forEach(variant => {
              console.log(`     - ${variant.trimName} (${variant.trimId})`);
            });
          }
        });
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 조회 중 오류:', error);
  }
}

checkAudiFirebase();