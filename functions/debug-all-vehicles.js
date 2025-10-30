const admin = require('firebase-admin');
const serviceAccount = require('../scripts/serviceAccountKey.json');

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'charzing-d1600'
});

const db = admin.firestore();

async function debugAllVehicles() {
  try {
    console.log('🔍 전체 차량 데이터베이스 구조 분석');
    
    // 1. 모든 브랜드 조회
    console.log('\n1. 브랜드 목록 조회...');
    const brandsSnapshot = await db.collection('vehicles').get();
    
    if (brandsSnapshot.empty) {
      console.log('❌ 브랜드가 없습니다.');
      return;
    }
    
    console.log(`✅ 총 ${brandsSnapshot.size}개 브랜드 발견\n`);
    
    const brandsList = [];
    
    for (const brandDoc of brandsSnapshot.docs) {
      const brandId = brandDoc.id;
      const brandData = brandDoc.data();
      
      console.log(`🏢 브랜드: ${brandId}`);
      console.log(`   데이터:`, brandData);
      
      // 2. 각 브랜드의 모델 조회
      const modelsSnapshot = await db.collection('vehicles').doc(brandId).collection('models').get();
      
      if (modelsSnapshot.empty) {
        console.log(`   ❌ 모델이 없습니다.`);
        continue;
      }
      
      const models = [];
      console.log(`   ✅ ${modelsSnapshot.size}개 모델 발견:`);
      
      for (const modelDoc of modelsSnapshot.docs) {
        const modelId = modelDoc.id;
        const modelData = modelDoc.data();
        
        console.log(`     📱 모델: ${modelId}`);
        console.log(`        데이터:`, modelData);
        
        // 3. 각 모델의 트림 수 확인
        const modelDocRef = db.collection('vehicles').doc(brandId).collection('models').doc(modelId);
        const trimCollections = await modelDocRef.listCollections();
        
        console.log(`        🔧 트림 수: ${trimCollections.length}`);
        if (trimCollections.length > 0) {
          const trimNames = trimCollections.map(c => c.id);
          console.log(`        트림: ${trimNames.join(', ')}`);
        }
        
        models.push({
          id: modelId,
          data: modelData,
          trimCount: trimCollections.length,
          trimNames: trimCollections.map(c => c.id)
        });
      }
      
      brandsList.push({
        id: brandId,
        data: brandData,
        models: models,
        modelCount: models.length
      });
      
      console.log(''); // 빈 줄
    }
    
    // 4. Firebase Storage 이미지 확인
    console.log('\n4. Firebase Storage 이미지 확인...');
    try {
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({ prefix: 'vehicles/' });
      
      if (files.length === 0) {
        console.log('❌ Firebase Storage에 차량 이미지가 없습니다.');
      } else {
        console.log(`✅ ${files.length}개 차량 이미지 파일 발견:`);
        files.slice(0, 10).forEach(file => {
          console.log(`   📷 ${file.name}`);
        });
        if (files.length > 10) {
          console.log(`   ... 및 ${files.length - 10}개 더`);
        }
      }
    } catch (storageError) {
      console.log('❌ Storage 접근 오류:', storageError.message);
    }
    
    // 5. 요약 통계
    console.log('\n=== 📊 요약 통계 ===');
    console.log(`총 브랜드 수: ${brandsList.length}`);
    const totalModels = brandsList.reduce((sum, brand) => sum + brand.modelCount, 0);
    console.log(`총 모델 수: ${totalModels}`);
    const totalTrims = brandsList.reduce((sum, brand) => 
      sum + brand.models.reduce((modelSum, model) => modelSum + model.trimCount, 0), 0);
    console.log(`총 트림 수: ${totalTrims}`);
    
    console.log('\n브랜드별 상세:');
    brandsList.forEach(brand => {
      console.log(`  ${brand.id}: ${brand.modelCount}개 모델, ${brand.models.reduce((sum, m) => sum + m.trimCount, 0)}개 트림`);
    });
    
    return {
      success: true,
      brands: brandsList,
      statistics: {
        brandCount: brandsList.length,
        modelCount: totalModels,
        trimCount: totalTrims
      }
    };
    
  } catch (error) {
    console.error('❌ 차량 데이터베이스 분석 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 실행
debugAllVehicles()
  .then(result => {
    console.log('\n🎯 분석 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 분석 실행 실패:', error);
    process.exit(1);
  });