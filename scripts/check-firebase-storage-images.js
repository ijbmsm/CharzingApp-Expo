const admin = require('firebase-admin');

// Firebase Admin 초기화
if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

async function checkStorageImages() {
  try {
    console.log('🔍 Firebase Storage 차량 이미지 확인 중...\n');
    
    // vehicle-images 폴더의 모든 파일 나열
    const [files] = await bucket.getFiles({
      prefix: 'vehicle-images/'
    });
    
    console.log(`📁 전체 파일 수: ${files.length}개\n`);
    
    // 브랜드별로 그룹화
    const brandGroups = {};
    files.forEach(file => {
      const path = file.name;
      const pathParts = path.split('/');
      
      if (pathParts.length >= 4) { // vehicle-images/BRAND/MODEL/YEAR/filename.png
        const brand = pathParts[1];
        const model = pathParts[2];
        const year = pathParts[3];
        const filename = pathParts[4];
        
        if (!brandGroups[brand]) {
          brandGroups[brand] = {};
        }
        if (!brandGroups[brand][model]) {
          brandGroups[brand][model] = {};
        }
        if (!brandGroups[brand][model][year]) {
          brandGroups[brand][model][year] = [];
        }
        
        brandGroups[brand][model][year].push(filename);
      }
    });
    
    // 결과 출력
    Object.keys(brandGroups).sort().forEach(brand => {
      console.log(`🚗 ${brand}/`);
      Object.keys(brandGroups[brand]).sort().forEach(model => {
        console.log(`  📂 ${model}/`);
        Object.keys(brandGroups[brand][model]).sort().forEach(year => {
          console.log(`    📅 ${year}/`);
          brandGroups[brand][model][year].forEach(filename => {
            console.log(`      🖼️  ${filename}`);
          });
        });
      });
      console.log('');
    });
    
    // 샘플 URL 생성 테스트
    console.log('🔗 샘플 이미지 URL 테스트:');
    const sampleFiles = files.slice(0, 5);
    for (const file of sampleFiles) {
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 1000 // 1분 후 만료
      });
      console.log(`📸 ${file.name}`);
      console.log(`   ${url}\n`);
    }
    
  } catch (error) {
    console.error('❌ Storage 확인 실패:', error);
  } finally {
    process.exit(0);
  }
}

checkStorageImages();