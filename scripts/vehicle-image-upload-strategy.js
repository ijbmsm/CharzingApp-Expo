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
const CAR_IMAGE_DIR = '/Users/sungmin/CharzingApp-Expo/src/assets/images/car-image';

// 이미지 업로드 전략 정의
const IMAGE_UPLOAD_STRATEGY = {
  // 트림별 이미지가 있는 경우 - 실제 트림 이미지 사용
  TRIM_SPECIFIC: [
    // AUDI는 일부 모델에서 트림별 이미지 존재
    'AUDI-A6-E-TRON-2025-s-line',
    'AUDI-RS-E-TRON-GT-2025-premium',
    // PORSCHE는 고성능 트림에서 차별화
    'PORSCHE-TAYCAN-2025-TURBO-GT-WEISSACH-PACKAGE'
  ],
  
  // 통합 이미지 사용 - 모든 트림에서 동일한 이미지 사용
  UNIFIED_IMAGE: [
    // 대부분의 브랜드는 트림이 달라도 외관이 동일
    'HYUNDAI', 'KIA', 'TESLA', 'BMW', 'MERCEDES-BENZ', 'MINI'
  ],
  
  // 연도별 디자인 변경이 있는 모델들
  YEAR_SPECIFIC: [
    'TESLA-MODEL-3', 'TESLA-MODEL-S', 'TESLA-MODEL-X', 'TESLA-MODEL-Y',
    'HYUNDAI-IONIQ-5', 'HYUNDAI-IONIQ-6',
    'KIA-EV6'
  ]
};

// Firebase Storage 경로 생성 규칙
function generateStoragePath(brand, model, year, trimSpecific = false, trimName = '') {
  const basePath = `vehicle-images/${brand}/${model}/${year}`;
  
  if (trimSpecific && trimName) {
    return `${basePath}/${brand.toLowerCase()}_${model.toLowerCase()}_${year}_${trimName.toLowerCase()}.png`;
  } else {
    return `${basePath}/${brand.toLowerCase()}_${model.toLowerCase()}_${year}.png`;
  }
}

// 이미지 파일명에서 정보 추출
function parseImageFileName(fileName) {
  const parts = fileName.replace('.png', '').replace('.jpg', '').replace('.jpeg', '').split('-');
  
  return {
    brand: parts[0],
    model: parts.slice(1, -1).join('-'),
    year: parts[parts.length - 1],
    fullName: fileName
  };
}

// MINI Cooper E 이미지 누락 문제 해결 전략
const MINI_IMAGE_MAPPING = {
  'MINI-COOPER-2025-E': 'MINI-COOPER-2025-SE', // E 트림이 없으면 SE 이미지 사용
  'MINI-ACEMAN-2025': 'MINI-ACEMAN-2025-SE', // 기본 이미지가 필요한 경우
  'MINI-COUNTRYMAN-2025': 'MINI-COUNTRYMAN-2025-E' // 기본 이미지
};

async function uploadVehicleImages() {
  console.log('🚀 차량 이미지 Firebase Storage 업로드 시작...\n');
  
  try {
    const brands = fs.readdirSync(CAR_IMAGE_DIR).filter(item => 
      fs.statSync(path.join(CAR_IMAGE_DIR, item)).isDirectory()
    );
    
    let uploadCount = 0;
    let skippedCount = 0;
    
    for (const brand of brands) {
      console.log(`📋 ${brand} 브랜드 처리 중...`);
      
      const brandPath = path.join(CAR_IMAGE_DIR, brand);
      const models = fs.readdirSync(brandPath).filter(item => 
        fs.statSync(path.join(brandPath, item)).isDirectory()
      );
      
      for (const model of models) {
        const modelPath = path.join(brandPath, model);
        const images = fs.readdirSync(modelPath).filter(file => 
          /\.(png|jpg|jpeg)$/i.test(file)
        );
        
        console.log(`   📁 ${model} 모델:`);
        
        for (const image of images) {
          const imagePath = path.join(modelPath, image);
          const imageInfo = parseImageFileName(image);
          
          // 연도 추출 (복잡한 패턴 처리)
          let year = '2025'; // 기본값
          if (image.includes('2024')) year = '2024';
          else if (image.includes('2023')) year = '2023';
          else if (image.includes('2022')) year = '2022';
          else if (image.includes('2021')) year = '2021';
          else if (image.includes('2020')) year = '2020';
          else if (image.includes('2019')) year = '2019';
          else if (image.includes('2018')) year = '2018';
          else if (image.includes('2017')) year = '2017';
          
          // 트림별 이미지인지 판단
          const isTrimSpecific = image.includes('-SE-') || image.includes('-JCW-') || 
                                image.includes('-E-') || image.includes('-TURBO-GT-') ||
                                image.includes('-AMG-') || image.includes('-PERFORMANCE-');
          
          let storagePath;
          if (isTrimSpecific) {
            // 트림 정보 추출
            const trimMatch = image.match(/-([A-Z]+(?:-[A-Z]+)*)-(?:\d{4})/);
            const trimName = trimMatch ? trimMatch[1] : 'STANDARD';
            storagePath = generateStoragePath(brand, model, year, true, trimName);
          } else {
            storagePath = generateStoragePath(brand, model, year);
          }
          
          try {
            // 이미지 업로드
            await bucket.upload(imagePath, {
              destination: storagePath,
              metadata: {
                metadata: {
                  brand: brand,
                  model: model,
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
            skippedCount++;
          }
        }
        console.log('');
      }
    }
    
    console.log('='.repeat(60));
    console.log('📊 업로드 완료 결과:');
    console.log(`✅ 성공: ${uploadCount}개 이미지`);
    console.log(`❌ 실패: ${skippedCount}개 이미지`);
    console.log(`📁 총 처리: ${uploadCount + skippedCount}개 이미지`);
    
    console.log('\n🎯 Firebase Storage 구조:');
    console.log('vehicle-images/');
    console.log('├── {BRAND}/');
    console.log('│   ├── {MODEL}/');
    console.log('│   │   ├── {YEAR}/');
    console.log('│   │   │   ├── {brand}_{model}_{year}.png (통합 이미지)');
    console.log('│   │   │   └── {brand}_{model}_{year}_{trim}.png (트림별 이미지)');
    
  } catch (error) {
    console.error('❌ 업로드 프로세스 중 오류:', error);
  }
}

// 실행하지 않고 전략만 출력
console.log('📋 차량 이미지 업로드 전략:');
console.log('1. 트림별 외관 차이가 있는 모델: 트림별 이미지 사용');
console.log('2. 트림별 외관이 동일한 모델: 통합 이미지 사용');
console.log('3. 연도별 디자인 변경: 연도별 이미지 사용');
console.log('4. MINI Cooper E 누락: SE 이미지로 대체');
console.log('5. Tesla 브랜드명 오타: TELSA → TESLA 수정');
console.log('\n실행하려면 uploadVehicleImages() 함수를 호출하세요.');

module.exports = { uploadVehicleImages, generateStoragePath, IMAGE_UPLOAD_STRATEGY };