const fs = require('fs');
const path = require('path');

const CAR_IMAGE_DIR = '/Users/sungmin/CharzingApp-Expo/src/assets/images/car-image';

function analyzeVehicleImages() {
  console.log('🔍 차량 이미지 구조 분석 시작...\n');
  
  const brands = fs.readdirSync(CAR_IMAGE_DIR).filter(item => 
    fs.statSync(path.join(CAR_IMAGE_DIR, item)).isDirectory()
  );
  
  let totalImages = 0;
  const imageAnalysis = {};
  
  brands.forEach(brand => {
    console.log(`📋 ${brand} 브랜드:`);
    imageAnalysis[brand] = {};
    
    const brandPath = path.join(CAR_IMAGE_DIR, brand);
    const models = fs.readdirSync(brandPath).filter(item => 
      fs.statSync(path.join(brandPath, item)).isDirectory()
    );
    
    models.forEach(model => {
      const modelPath = path.join(brandPath, model);
      const images = fs.readdirSync(modelPath).filter(file => 
        /\.(png|jpg|jpeg)$/i.test(file)
      );
      
      console.log(`   📁 ${model}: ${images.length}개 이미지`);
      imageAnalysis[brand][model] = [];
      
      images.forEach(image => {
        console.log(`      • ${image}`);
        imageAnalysis[brand][model].push(image);
        totalImages++;
      });
      console.log('');
    });
  });
  
  console.log('='.repeat(60));
  console.log(`📊 총 ${brands.length}개 브랜드, ${totalImages}개 이미지\n`);
  
  // 이미지 명명 패턴 분석
  console.log('🎯 이미지 명명 패턴 분석:');
  
  brands.forEach(brand => {
    console.log(`\n${brand}:`);
    Object.keys(imageAnalysis[brand]).forEach(model => {
      const images = imageAnalysis[brand][model];
      
      // 트림별 이미지와 통합 이미지 구분
      const trimSpecificImages = images.filter(img => {
        const name = img.toLowerCase();
        return name.includes('-se-') || name.includes('-jcw-') || name.includes('-e-') ||
               name.includes('-turbo-') || name.includes('-performance-') || 
               name.includes('-exclusive-') || name.includes('-long-range-') ||
               name.includes('-standard-') || name.includes('-all4-');
      });
      
      const generalImages = images.filter(img => !trimSpecificImages.includes(img));
      
      console.log(`   ${model}:`);
      if (generalImages.length > 0) {
        console.log(`      📸 통합 이미지: ${generalImages.length}개`);
        generalImages.forEach(img => console.log(`         - ${img}`));
      }
      if (trimSpecificImages.length > 0) {
        console.log(`      🎨 트림별 이미지: ${trimSpecificImages.length}개`);
        trimSpecificImages.forEach(img => console.log(`         - ${img}`));
      }
    });
  });
  
  return imageAnalysis;
}

analyzeVehicleImages();