const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function cleanAudiCompletely() {
  console.log('🧹 아우디 Firebase 데이터 완전 삭제...\n');
  
  const brandId = 'audi';
  const brandRef = db.collection('vehicles').doc(brandId);
  
  try {
    // 1. 모든 모델 서브컬렉션 삭제
    console.log('🗑️ 아우디 모든 모델 삭제 중...');
    const modelsSnapshot = await brandRef.collection('models').get();
    
    console.log(`📋 삭제할 모델 ${modelsSnapshot.size}개 발견:`);
    
    const deletePromises = [];
    modelsSnapshot.forEach((doc) => {
      console.log(`   - ${doc.id} (${doc.data().name})`);
      deletePromises.push(doc.ref.delete());
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ ${modelsSnapshot.size}개 모델 삭제 완료\n`);
    
    // 2. 아우디 브랜드 문서 자체도 삭제
    console.log('🗑️ 아우디 브랜드 문서 삭제 중...');
    await brandRef.delete();
    console.log('✅ 아우디 브랜드 문서 삭제 완료\n');
    
    console.log('='.repeat(60));
    console.log('✅ 아우디 Firebase 데이터 완전 삭제 완료!');
    console.log('🧹 이제 깨끗한 상태에서 올바른 구조로 다시 업로드할 수 있습니다.');
    console.log('\n📝 다음 단계: 새로운 아우디 데이터를 올바른 모델-트림 구조로 업로드');
    
  } catch (error) {
    console.error('❌ 삭제 중 오류 발생:', error);
  }
}

cleanAudiCompletely();