const admin = require('firebase-admin');

// Firebase Admin 초기화
if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugBMWData() {
  try {
    console.log('🔍 BMW 브랜드 문서 확인...');
    
    // 1. vehicles 컬렉션의 모든 문서 확인
    const vehiclesSnapshot = await db.collection('vehicles').get();
    console.log('\n📂 vehicles 컬렉션의 모든 문서:');
    vehiclesSnapshot.docs.forEach(doc => {
      console.log(`  📄 ${doc.id}`);
    });
    
    // 2. BMW 문서 직접 조회
    console.log('\n🔍 BMW 문서 직접 조회...');
    const bmwDoc = await db.collection('vehicles').doc('BMW').get();
    if (bmwDoc.exists) {
      console.log('✅ BMW 문서 존재');
      console.log('BMW 데이터:', bmwDoc.data());
    } else {
      console.log('❌ BMW 문서 없음');
    }
    
    // 3. bmw (소문자) 문서 조회
    const bmwLowerDoc = await db.collection('vehicles').doc('bmw').get();
    if (bmwLowerDoc.exists) {
      console.log('✅ bmw (소문자) 문서 존재');
      console.log('bmw 데이터:', bmwLowerDoc.data());
    } else {
      console.log('❌ bmw (소문자) 문서 없음');
    }
    
    // 4. BMW 모델 확인
    console.log('\n🔍 BMW 모델 서브컬렉션 확인...');
    try {
      const bmwModelsSnapshot = await db.collection('vehicles').doc('BMW').collection('models').get();
      console.log(`BMW 모델 수: ${bmwModelsSnapshot.size}`);
      bmwModelsSnapshot.docs.forEach(doc => {
        console.log(`  📄 ${doc.id}`);
      });
    } catch (error) {
      console.log('BMW 모델 조회 실패:', error.message);
    }
    
    // 5. bmw (소문자) 모델 확인
    try {
      const bmwLowerModelsSnapshot = await db.collection('vehicles').doc('bmw').collection('models').get();
      console.log(`bmw (소문자) 모델 수: ${bmwLowerModelsSnapshot.size}`);
      bmwLowerModelsSnapshot.docs.forEach(doc => {
        console.log(`  📄 ${doc.id}`);
      });
    } catch (error) {
      console.log('bmw 모델 조회 실패:', error.message);
    }
    
    // 6. i4 모델 직접 조회
    console.log('\n🔍 i4 모델 직접 조회...');
    const i4DocBMW = await db.collection('vehicles').doc('BMW').collection('models').doc('i4').get();
    if (i4DocBMW.exists) {
      console.log('✅ BMW/i4 문서 존재');
      console.log('i4 데이터 (일부):', JSON.stringify(i4DocBMW.data(), null, 2).substring(0, 500) + '...');
    } else {
      console.log('❌ BMW/i4 문서 없음');
    }
    
    const i4Docbmw = await db.collection('vehicles').doc('bmw').collection('models').doc('i4').get();
    if (i4Docbmw.exists) {
      console.log('✅ bmw/i4 문서 존재');
      console.log('i4 데이터 (일부):', JSON.stringify(i4Docbmw.data(), null, 2).substring(0, 500) + '...');
    } else {
      console.log('❌ bmw/i4 문서 없음');
    }
    
  } catch (error) {
    console.error('❌ 디버깅 실패:', error);
  } finally {
    process.exit(0);
  }
}

debugBMWData();