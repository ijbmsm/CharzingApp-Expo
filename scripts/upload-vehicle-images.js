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

// 브랜드명 매핑 (로컬 폴더명 → Firebase 브랜드명)
const BRAND_MAPPING = {
  'BENZ': 'MERCEDES-BENZ',
  'MINI': 'MINI',
  'HYUNDAI': 'HYUNDAI',
  'KIA': 'KIA',
  'TESLA': 'TESLA',
  'BMW': 'BMW',
  'AUDI': 'AUDI',
  'PORSCHE': 'PORSCHE'
};

// 특수 처리가 필요한 이미지들
const SPECIAL_CASES = {
  // Tesla 브랜드명 오타 수정
  'TELSA-MODEL-S': 'TESLA-MODEL-S',
  // Mercedes-Maybach 분리 처리
  'BENZ-MM-EQS-SUV': 'MERCEDES-MAYBACH-EQS-SUV'
};

// 연도 추출 함수
function extractYear(fileName) {
  const yearMatches = fileName.match(/(\d{4})/g);
  if (yearMatches) {
    // 가장 큰 연도값 반환 (범위인 경우 끝년도)
    return Math.max(...yearMatches.map(y => parseInt(y))).toString();
  }
  return '2025'; // 기본값
}

// 트림 정보 추출 함수
function extractTrim(fileName) {
  const trimPatterns = [
    'JCW', 'SE', 'E', 'TURBO-GT', 'TURBO-S', 'TURBO', 'GTS', 'GT', 
    'AMG', 'ART', 'PERFORMANCE', 'LONGRANGE', 'STANDARD', 'EXCLUSIVE',
    'S-LINE', 'SPORTBACK', 'PREMIUM', 'WEISSACH'
  ];
  
  for (const trim of trimPatterns) {
    if (fileName.toUpperCase().includes(trim)) {
      return trim.toLowerCase().replace('-', '_');
    }
  }
  return null;
}

// Firebase Storage 경로 생성
function generateStoragePath(brand, model, year, trim = null) {
  const baseName = `${brand.toLowerCase()}_${model.toLowerCase().replace(/-/g, '_')}_${year}`;
  const fileName = trim ? `${baseName}_${trim}.png` : `${baseName}.png`;
  return `vehicle-images/${brand}/${model}/${year}/${fileName}`;
}

async function uploadVehicleImages() {
  console.log('🚀 차량 이미지 Firebase Storage 업로드 시작...\n');
  
  let uploadCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  try {
    const brands = fs.readdirSync(CAR_IMAGE_DIR).filter(item => 
      fs.statSync(path.join(CAR_IMAGE_DIR, item)).isDirectory()
    );
    
    for (const localBrand of brands) {
      const mappedBrand = BRAND_MAPPING[localBrand] || localBrand;
      console.log(`📋 ${localBrand} → ${mappedBrand} 브랜드 처리 중...`);
      
      const brandPath = path.join(CAR_IMAGE_DIR, localBrand);
      const models = fs.readdirSync(brandPath).filter(item => 
        fs.statSync(path.join(brandPath, item)).isDirectory()
      );
      
      for (const model of models) {
        const modelPath = path.join(brandPath, model);
        const images = fs.readdirSync(modelPath).filter(file => 
          /\.(png|jpg|jpeg)$/i.test(file)
        );
        
        console.log(`   📁 ${model} 모델 (${images.length}개 이미지):`);
        
        // 모델별 대표 이미지 선택 (가장 최신 연도, 기본 트림)
        const sortedImages = images.sort((a, b) => {
          const yearA = extractYear(a);
          const yearB = extractYear(b);
          if (yearA !== yearB) return yearB.localeCompare(yearA); // 최신 연도 우선
          
          // 기본 트림 우선순위 (트림 정보가 적은 것)
          const trimA = extractTrim(a);
          const trimB = extractTrim(b);
          if (!trimA && trimB) return -1; // 트림 정보 없는 것 우선
          if (trimA && !trimB) return 1;
          return 0;
        });
        
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const imagePath = path.join(modelPath, image);
          
          try {
            // 파일명에서 정보 추출
            let originalName = image.replace(/\.(png|jpg|jpeg)$/i, '');
            
            // 특수 케이스 처리
            for (const [from, to] of Object.entries(SPECIAL_CASES)) {
              if (originalName.includes(from)) {
                originalName = originalName.replace(from, to);
              }
            }
            
            const year = extractYear(originalName);
            const trim = extractTrim(originalName);
            
            // Firebase Storage 경로 생성
            const storagePath = generateStoragePath(mappedBrand, model, year, trim);
            
            // 대표 이미지인지 확인 (첫 번째 = 가장 우선순위 높은 이미지)
            const isRepresentative = i === 0;
            
            // 이미지 업로드
            await bucket.upload(imagePath, {
              destination: storagePath,
              metadata: {
                metadata: {
                  brand: mappedBrand,
                  model: model,
                  year: year,
                  trim: trim || 'default',
                  originalFileName: image,
                  isRepresentative: isRepresentative.toString(),
                  uploadedAt: new Date().toISOString()
                }
              }
            });
            
            const trimInfo = trim ? ` (${trim} 트림)` : ' (통합)';
            const repInfo = isRepresentative ? ' [대표]' : '';
            console.log(`      ✅ ${originalName}${trimInfo}${repInfo}`);
            console.log(`         → ${storagePath}`);
            uploadCount++;
            
            // 대표 이미지는 트림 정보 없는 기본 경로에도 업로드
            if (isRepresentative && trim) {
              const defaultPath = generateStoragePath(mappedBrand, model, year);
              await bucket.upload(imagePath, {
                destination: defaultPath,
                metadata: {
                  metadata: {
                    brand: mappedBrand,
                    model: model,
                    year: year,
                    trim: 'default',
                    originalFileName: image,
                    isRepresentative: 'true',
                    isDefault: 'true',
                    uploadedAt: new Date().toISOString()
                  }
                }
              });
              console.log(`      ✅ ${originalName} (기본 이미지)`);
              console.log(`         → ${defaultPath}`);
              uploadCount++;
            }
            
          } catch (error) {
            console.log(`      ❌ ${image} 업로드 실패: ${error.message}`);
            errorCount++;
          }
        }
        console.log('');
      }
    }
    
    console.log('='.repeat(60));
    console.log('📊 업로드 완료 결과:');
    console.log(`✅ 성공: ${uploadCount}개 이미지`);
    console.log(`❌ 실패: ${errorCount}개 이미지`);
    console.log(`⏭️  건너뜀: ${skippedCount}개 이미지`);
    console.log(`📁 총 처리: ${uploadCount + errorCount + skippedCount}개 이미지`);
    
    console.log('\n🎯 Firebase Storage 구조가 CLAUDE.md 규칙에 따라 생성되었습니다:');
    console.log('✅ 브랜드별 폴더 구성');
    console.log('✅ 모델별 하위 폴더');
    console.log('✅ 연도별 이미지 분류');
    console.log('✅ 트림별/통합 이미지 구분');
    console.log('✅ 표준 명명 규칙 적용');
    
  } catch (error) {
    console.error('❌ 업로드 프로세스 중 치명적 오류:', error);
  }
}

uploadVehicleImages();