const admin = require('firebase-admin');

// Firebase Admin 초기화
if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function printCollectionStructure(collectionPath = null, indent = 0) {
  const prefix = ' '.repeat(indent * 2);
  
  // 루트 레벨에서는 알려진 컬렉션들을 직접 조회
  if (!collectionPath) {
    console.log(`${prefix}📂 (root)`);
    const knownCollections = ['vehicles', 'users', 'reservations', 'diagnosticReservations'];
    for (const collectionName of knownCollections) {
      try {
        await printCollectionStructure(collectionName, indent + 1);
      } catch (error) {
        console.log(`${prefix}  📂 ${collectionName} (error: ${error.message})`);
      }
    }
    return;
  }
  
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`${prefix}📂 ${collectionPath} (empty)`);
    return;
  }

  console.log(`${prefix}📂 ${collectionPath} (${snapshot.size} documents)`);

  for (const doc of snapshot.docs) {
    console.log(`${prefix}  📄 ${doc.id}`);
    
    // 문서 데이터 구조 출력 (첫 번째 문서만)
    if (indent === 0) {
      const data = doc.data();
      console.log(`${prefix}    🔍 Sample data structure:`);
      console.log(`${prefix}      ${JSON.stringify(Object.keys(data), null, 2)}`);
      
      // trims 배열이 있으면 첫 번째 트림 구조 출력
      if (data.trims && Array.isArray(data.trims) && data.trims.length > 0) {
        console.log(`${prefix}    🎯 First trim structure:`);
        console.log(`${prefix}      ${JSON.stringify(Object.keys(data.trims[0]), null, 2)}`);
        
        // variants 배열이 있으면 첫 번째 variant 구조 출력
        if (data.trims[0].variants && Array.isArray(data.trims[0].variants) && data.trims[0].variants.length > 0) {
          console.log(`${prefix}    🎯 First variant structure:`);
          console.log(`${prefix}      ${JSON.stringify(data.trims[0].variants[0], null, 2)}`);
        }
      }
      
      // defaultBattery 구조 출력
      if (data.defaultBattery) {
        console.log(`${prefix}    🔋 defaultBattery structure:`);
        console.log(`${prefix}      ${JSON.stringify(data.defaultBattery, null, 2)}`);
      }
    }
    
    const subcollections = await doc.ref.listCollections();
    for (const sub of subcollections) {
      await printCollectionStructure(`${collectionPath ? collectionPath + '/' : ''}${doc.id}/${sub.id}`, indent + 2);
    }
  }
}

async function checkSpecificVehicle() {
  console.log('\n🚗 현대 아이오닉 5 2024년 모델 구체적 확인:');
  try {
    // vehicles/hyundai/models/ioniq-5 문서 직접 조회
    const hyundaiRef = db.collection('vehicles').doc('hyundai');
    const modelsRef = hyundaiRef.collection('models').doc('ioniq-5');
    const modelDoc = await modelsRef.get();
    
    if (modelDoc.exists) {
      const data = modelDoc.data();
      console.log('✅ IONIQ-5 문서 발견');
      console.log('📊 전체 구조:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ IONIQ-5 문서를 찾을 수 없음');
    }
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

async function main() {
  try {
    console.log('🔍 Firestore 전체 구조 분석 시작...\n');
    await printCollectionStructure();
    
    console.log('\n' + '='.repeat(80));
    await checkSpecificVehicle();
    
  } catch (error) {
    console.error('❌ 구조 분석 실패:', error);
  } finally {
    process.exit(0);
  }
}

main();