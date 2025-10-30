const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function deleteAllAudiFirebase() {
  console.log('🗑️ Firebase 아우디 데이터 완전 삭제 시작...\n');
  
  try {
    // 1. Firestore 아우디 브랜드 완전 삭제
    console.log('📝 Firestore 아우디 데이터 삭제 중...');
    const brandRef = db.collection('vehicles').doc('audi');
    
    // 모든 모델 서브컬렉션 삭제
    const modelsSnapshot = await brandRef.collection('models').get();
    console.log(`   🗑️ ${modelsSnapshot.size}개 모델 삭제 중...`);
    
    const deletePromises = [];
    modelsSnapshot.forEach((doc) => {
      console.log(`      - ${doc.id}`);
      deletePromises.push(doc.ref.delete());
    });
    
    await Promise.all(deletePromises);
    
    // 아우디 브랜드 문서 삭제
    await brandRef.delete();
    console.log('   ✅ Firestore 아우디 삭제 완료\n');
    
    // 2. Firebase Storage 아우디 폴더 완전 삭제
    console.log('🗂️ Firebase Storage 아우디 폴더 삭제 중...');
    const [files] = await bucket.getFiles({
      prefix: 'vehicle-images/AUDI/'
    });
    
    console.log(`   🗑️ ${files.length}개 파일 삭제 중...`);
    
    // 폴더별로 그룹화해서 보여주기
    const folders = {};
    files.forEach(file => {
      const pathParts = file.name.split('/');
      if (pathParts.length >= 3) {
        const folder = pathParts[2];
        if (!folders[folder]) {
          folders[folder] = 0;
        }
        folders[folder]++;
      }
    });
    
    console.log('   📁 삭제할 폴더들:');
    Object.keys(folders).forEach(folder => {
      console.log(`      - ${folder} (${folders[folder]}개 파일)`);
    });
    
    // 모든 파일 삭제
    const deleteFilePromises = files.map(file => file.delete());
    await Promise.all(deleteFilePromises);
    
    console.log('   ✅ Firebase Storage 아우디 삭제 완료\n');
    
    console.log('='.repeat(60));
    console.log('✅ Firebase 아우디 데이터 완전 삭제 완료!');
    console.log('🧹 Firestore와 Storage 모두 깨끗하게 정리됨');
    console.log('\n📝 다음 단계:');
    console.log('1. 로컬 이미지를 올바른 구조로 Firebase Storage에 업로드');
    console.log('2. vehicleBatteryData.js 기반으로 Firestore에 올바른 모델-트림 구조 업로드');
    
  } catch (error) {
    console.error('❌ 삭제 중 오류 발생:', error);
  }
}

deleteAllAudiFirebase();