const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

async function checkFirebaseStorageAudi() {
  console.log('🗂️ Firebase Storage 아우디 구조 확인...\n');
  
  try {
    // vehicle-images/AUDI/ 하위 폴더들 조회
    const [files] = await bucket.getFiles({
      prefix: 'vehicle-images/AUDI/',
      delimiter: '/'
    });
    
    // 폴더명 추출 (중복 제거)
    const folders = new Set();
    
    files.forEach(file => {
      const path = file.name;
      // vehicle-images/AUDI/MODEL_NAME/ 형태에서 MODEL_NAME 추출
      const pathParts = path.split('/');
      if (pathParts.length >= 3 && pathParts[0] === 'vehicle-images' && pathParts[1] === 'AUDI') {
        const modelFolder = pathParts[2];
        if (modelFolder) {
          folders.add(modelFolder);
        }
      }
    });
    
    const sortedFolders = Array.from(folders).sort();
    
    console.log(`📁 Firebase Storage AUDI 폴더 ${sortedFolders.length}개:\n`);
    
    sortedFolders.forEach((folder, index) => {
      const status = folder.includes('-S-') || folder.includes('-SQ') || folder.includes('-RS-') ? ' ❌ (분리됨)' : ' ✅';
      console.log(`${index + 1}. ${folder}${status}`);
    });
    
    console.log('\n🔍 분석:');
    const separatedFolders = sortedFolders.filter(folder => 
      folder.includes('-S-') || folder.includes('-SQ') || folder.includes('-RS-') || 
      folder.startsWith('S-') || folder.startsWith('SQ') || folder.startsWith('RS-')
    );
    
    if (separatedFolders.length > 0) {
      console.log('❌ 잘못 분리된 폴더들:');
      separatedFolders.forEach(folder => console.log(`   • ${folder}`));
      console.log('\n💡 이 폴더들의 이미지를 올바른 모델 폴더로 이동해야 합니다.');
    } else {
      console.log('✅ 모든 폴더가 올바른 구조입니다.');
    }
    
  } catch (error) {
    console.error('❌ Storage 확인 중 오류:', error);
  }
}

checkFirebaseStorageAudi();