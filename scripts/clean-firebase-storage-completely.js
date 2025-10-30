const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

async function cleanFirebaseStorageCompletely() {
  console.log('🧹 Firebase Storage 아우디 폴더 완전 정리...\n');
  
  try {
    // 아우디의 모든 파일 조회
    const [files] = await bucket.getFiles({
      prefix: 'vehicle-images/AUDI/'
    });
    
    console.log(`📁 총 ${files.length}개 파일 발견\n`);
    
    // 폴더별로 그룹화
    const folders = {};
    files.forEach(file => {
      const pathParts = file.name.split('/');
      if (pathParts.length >= 3) {
        const folder = pathParts[2]; // AUDI 다음의 모델 폴더명
        if (!folders[folder]) {
          folders[folder] = [];
        }
        folders[folder].push(file);
      }
    });
    
    const sortedFolders = Object.keys(folders).sort();
    console.log('📋 현재 Storage 폴더들:');
    sortedFolders.forEach((folder, index) => {
      console.log(`${index + 1}. ${folder} (${folders[folder].length}개 파일)`);
    });
    
    // 잘못된 폴더들 (고성능 트림이 분리된 것들)
    const wrongFolders = [
      'RS-E-TRON-GT',  // e-tron-gt로 이동
      'S-E-TRON-GT',   // e-tron-gt로 이동 
      'S6-E-TRON',     // a6-e-tron으로 이동
      'SQ6-E-TRON'     // q6-e-tron으로 이동
    ];
    
    // 폴더 매핑 (소문자 버전도 포함)
    const folderMappings = {
      'RS-E-TRON-GT': 'E-TRON-GT',
      'rs-e-tron-gt': 'E-TRON-GT',
      'S-E-TRON-GT': 'E-TRON-GT',
      's-e-tron-gt': 'E-TRON-GT',
      'S6-E-TRON': 'A6-E-TRON',
      's6-e-tron': 'A6-E-TRON',
      'SQ6-E-TRON': 'Q6-E-TRON',
      'sq6-e-tron': 'Q6-E-TRON'
    };
    
    console.log('\n🔧 잘못된 폴더 정리 시작...\n');
    
    for (const [wrongFolder, correctFolder] of Object.entries(folderMappings)) {
      if (folders[wrongFolder]) {
        console.log(`📁 ${wrongFolder} → ${correctFolder} 이동 중...`);
        const filesToMove = folders[wrongFolder];
        
        for (const file of filesToMove) {
          const oldPath = file.name;
          const newPath = oldPath.replace(`vehicle-images/AUDI/${wrongFolder}/`, `vehicle-images/AUDI/${correctFolder}/`);
          
          try {
            // 파일 복사
            await file.copy(newPath);
            console.log(`   ✅ ${oldPath.split('/').pop()} → ${newPath}`);
            
            // 원본 파일 삭제
            await file.delete();
            
          } catch (error) {
            console.log(`   ❌ ${oldPath.split('/').pop()} 이동 실패: ${error.message}`);
          }
        }
        
        console.log(`   ✅ ${wrongFolder} 정리 완료 (${filesToMove.length}개 파일)\n`);
      }
    }
    
    // 최종 확인
    console.log('='.repeat(60));
    const [finalFiles] = await bucket.getFiles({
      prefix: 'vehicle-images/AUDI/'
    });
    
    const finalFolders = {};
    finalFiles.forEach(file => {
      const pathParts = file.name.split('/');
      if (pathParts.length >= 3) {
        const folder = pathParts[2];
        if (!finalFolders[folder]) {
          finalFolders[folder] = 0;
        }
        finalFolders[folder]++;
      }
    });
    
    console.log('✅ Firebase Storage 정리 완료!');
    console.log('\n📁 최종 폴더 구조:');
    Object.keys(finalFolders).sort().forEach((folder, index) => {
      console.log(`${index + 1}. ${folder} (${finalFolders[folder]}개 파일)`);
    });
    
  } catch (error) {
    console.error('❌ Storage 정리 중 오류:', error);
  }
}

cleanFirebaseStorageCompletely();