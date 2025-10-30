const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();
const AUDI_IMAGE_DIR = '/Users/sungmin/CharzingApp-Expo/src/assets/images/car-image/AUDI';

async function uploadAudiImagesClean() {
  console.log('🚀 아우디 이미지 Firebase Storage 업로드 (올바른 구조)...\n');
  
  let uploadCount = 0;
  let errorCount = 0;
  
  try {
    // 현재 아우디 로컬 폴더 구조 확인
    const modelFolders = fs.readdirSync(AUDI_IMAGE_DIR).filter(item => 
      fs.statSync(path.join(AUDI_IMAGE_DIR, item)).isDirectory()
    );
    
    console.log('📁 로컬 아우디 모델 폴더들:');
    modelFolders.forEach(folder => console.log(`   - ${folder}`));
    console.log('');
    
    for (const modelFolder of modelFolders) {
      console.log(`📝 ${modelFolder} 처리 중...`);
      
      const modelPath = path.join(AUDI_IMAGE_DIR, modelFolder);
      const images = fs.readdirSync(modelPath).filter(file => 
        /\.(png|jpg|jpeg)$/i.test(file)
      );
      
      console.log(`   📄 ${images.length}개 이미지 발견`);
      
      for (const image of images) {
        const imagePath = path.join(modelPath, image);
        
        try {
          // 년도 추출 (파일명에서)
          const yearMatch = image.match(/(\d{4})/);
          const year = yearMatch ? yearMatch[1] : '2025';
          
          // Firebase Storage 경로 생성 (표준 명명 규칙)
          const normalizedModelName = modelFolder.toLowerCase().replace(/-/g, '_');
          const fileName = `audi_${normalizedModelName}_${year}.png`;
          const storagePath = `vehicle-images/AUDI/${modelFolder}/${year}/${fileName}`;
          
          // 이미지 업로드
          await bucket.upload(imagePath, {
            destination: storagePath,
            metadata: {
              metadata: {
                brand: 'AUDI',
                model: modelFolder,
                year: year,
                originalFileName: image,
                uploadedAt: new Date().toISOString()
              }
            }
          });
          
          console.log(`      ✅ ${image} → ${storagePath}`);
          uploadCount++;
          
        } catch (error) {
          console.log(`      ❌ ${image} 업로드 실패: ${error.message}`);
          errorCount++;
        }
      }
      console.log('');
    }
    
    console.log('='.repeat(60));
    console.log('📊 아우디 이미지 업로드 완료!');
    console.log(`✅ 성공: ${uploadCount}개 이미지`);
    console.log(`❌ 실패: ${errorCount}개 이미지`);
    console.log(`📁 총 처리: ${uploadCount + errorCount}개 이미지`);
    
    console.log('\n🎯 Firebase Storage 구조:');
    console.log('vehicle-images/AUDI/');
    modelFolders.forEach(folder => {
      console.log(`├── ${folder}/`);
      console.log(`│   └── {YEAR}/`);
      console.log(`│       └── audi_${folder.toLowerCase().replace(/-/g, '_')}_{year}.png`);
    });
    
  } catch (error) {
    console.error('❌ 업로드 프로세스 중 오류:', error);
  }
}

uploadAudiImagesClean();