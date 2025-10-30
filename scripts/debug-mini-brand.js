const admin = require('firebase-admin');

// Firebase Admin 초기화
if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkMINI() {
  try {
    console.log('🔍 MINI 브랜드 확인...');
    
    // 1. vehicles 컬렉션의 모든 문서 확인
    const vehiclesSnapshot = await db.collection('vehicles').get();
    console.log('\n📂 vehicles 컬렉션의 모든 브랜드:');
    vehiclesSnapshot.docs.forEach(doc => {
      console.log(`  📄 ${doc.id}`);
    });
    
    // 2. MINI 문서 직접 조회 (대문자)
    console.log('\n🔍 MINI (대문자) 문서 조회...');
    const miniDocUpper = await db.collection('vehicles').doc('MINI').get();
    if (miniDocUpper.exists) {
      console.log('✅ MINI (대문자) 문서 존재');
      const data = miniDocUpper.data();
      console.log('MINI 기본 정보:', { name: data.name, englishName: data.englishName });
    } else {
      console.log('❌ MINI (대문자) 문서 없음');
    }
    
    // 3. mini 문서 조회 (소문자)
    console.log('\n🔍 mini (소문자) 문서 조회...');
    const miniDocLower = await db.collection('vehicles').doc('mini').get();
    if (miniDocLower.exists) {
      console.log('✅ mini (소문자) 문서 존재');
      const data = miniDocLower.data();
      console.log('mini 기본 정보:', { name: data.name, englishName: data.englishName });
    } else {
      console.log('❌ mini (소문자) 문서 없음');
    }
    
    // 4. MINI 모델 목록 확인
    const brandToCheck = miniDocUpper.exists ? 'MINI' : (miniDocLower.exists ? 'mini' : null);
    if (brandToCheck) {
      console.log(`\n🔍 ${brandToCheck} 모델 서브컬렉션 확인...`);
      try {
        const miniModelsSnapshot = await db.collection('vehicles').doc(brandToCheck).collection('models').get();
        console.log(`${brandToCheck} 모델 수: ${miniModelsSnapshot.size}개`);
        miniModelsSnapshot.docs.forEach(doc => {
          console.log(`  📄 ${doc.id}`);
        });
        
        // 첫 번째 모델의 상세 정보 확인
        if (miniModelsSnapshot.size > 0) {
          const firstModel = miniModelsSnapshot.docs[0];
          console.log(`\n🔍 첫 번째 모델 (${firstModel.id}) 상세 정보:`);
          const modelData = firstModel.data();
          console.log('모델 데이터:', {
            name: modelData.name,
            englishName: modelData.englishName,
            imageUrl: modelData.imageUrl ? '✅ 이미지 URL 있음' : '❌ 이미지 URL 없음'
          });
        }
      } catch (error) {
        console.log(`${brandToCheck} 모델 조회 실패:`, error.message);
      }
    } else {
      console.log('\n❌ MINI 브랜드를 찾을 수 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 디버깅 실패:', error);
  } finally {
    process.exit(0);
  }
}

checkMINI();