const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

async function checkStorageDetailed() {
  console.log('🗂️ Firebase Storage 전체 구조 확인...\n');
  
  try {
    // vehicle-images 전체 조회
    const [files] = await bucket.getFiles({
      prefix: 'vehicle-images/'
    });
    
    console.log(`📁 총 ${files.length}개 파일 발견\n`);
    
    // 브랜드별로 그룹화
    const brands = {};
    
    files.forEach(file => {
      const path = file.name;
      const pathParts = path.split('/');
      
      if (pathParts.length >= 3 && pathParts[0] === 'vehicle-images') {
        const brand = pathParts[1];
        const model = pathParts[2];
        
        if (!brands[brand]) {
          brands[brand] = new Set();
        }
        
        if (model) {
          brands[brand].add(model);
        }
      }
    });
    
    console.log('📋 브랜드별 모델 수:\n');
    
    Object.keys(brands).sort().forEach(brand => {
      const models = Array.from(brands[brand]).sort();
      console.log(`${brand}: ${models.length}개 모델`);
      
      if (brand === 'AUDI') {
        console.log('   아우디 모델들:');
        models.forEach((model, index) => {
          const status = model.includes('-S-') || model.includes('-SQ') || model.includes('-RS-') || 
                        model.startsWith('S-') || model.startsWith('SQ') || model.startsWith('RS-') ? ' ❌' : ' ✅';
          console.log(`   ${index + 1}. ${model}${status}`);
        });
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Storage 확인 중 오류:', error);
  }
}

checkStorageDetailed();