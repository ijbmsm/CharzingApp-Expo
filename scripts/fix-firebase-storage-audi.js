const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

async function fixFirebaseStorageAudi() {
  console.log('🔧 Firebase Storage 아우디 구조 수정...\n');
  
  try {
    // 이동할 폴더 매핑
    const folderMappings = {
      'S-E-TRON': 'E-TRON-GT',
      'SQ6-E-TRON': 'Q6-E-TRON', 
      'SQ8-E-TRON': 'Q8-E-TRON'
    };
    
    for (const [oldFolder, newFolder] of Object.entries(folderMappings)) {
      console.log(`📁 ${oldFolder} → ${newFolder} 이동 중...`);
      
      // 해당 폴더의 모든 파일 조회
      const [files] = await bucket.getFiles({
        prefix: `vehicle-images/AUDI/${oldFolder}/`
      });
      
      console.log(`   📄 ${files.length}개 파일 발견`);
      
      for (const file of files) {
        const oldPath = file.name;
        const newPath = oldPath.replace(`vehicle-images/AUDI/${oldFolder}/`, `vehicle-images/AUDI/${newFolder}/`);
        
        try {
          // 파일 복사
          await file.copy(newPath);
          console.log(`      ✅ ${oldPath.split('/').pop()} → ${newPath}`);
          
          // 원본 파일 삭제
          await file.delete();
          
        } catch (error) {
          console.log(`      ❌ ${oldPath.split('/').pop()} 이동 실패: ${error.message}`);
        }
      }
      
      console.log(`   ✅ ${oldFolder} 폴더 정리 완료\n`);
    }
    
    console.log('='.repeat(60));
    console.log('✅ Firebase Storage 아우디 구조 수정 완료!');
    console.log('🔄 변경사항:');
    console.log('   • S-E-TRON → E-TRON-GT (S, RS 트림 이미지)');
    console.log('   • SQ6-E-TRON → Q6-E-TRON (SQ6 트림 이미지)');
    console.log('   • SQ8-E-TRON → Q8-E-TRON (SQ8 트림 이미지)');
    console.log('\n📱 이제 앱에서 올바른 이미지 경로로 로드됩니다.');
    
  } catch (error) {
    console.error('❌ Storage 수정 중 오류:', error);
  }
}

fixFirebaseStorageAudi();