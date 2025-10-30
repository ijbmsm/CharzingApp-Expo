const admin = require('firebase-admin');
const serviceAccount = require('../scripts/serviceAccountKey.json');

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'charzing-d1600'
});

const db = admin.firestore();

async function testGetVehicleTrims() {
  try {
    console.log('🔍 차량 트림 조회 테스트 시작');
    
    // 테스트할 브랜드/모델 (Firebase Console에서 확인한 실제 데이터)
    const brandId = 'audi';
    const modelId = 'a6-e-tron';
    
    console.log(`📋 테스트 대상: ${brandId}/${modelId}`);

    // 모델 문서 경로: /vehicles/{brandId}/models/{modelId}
    const modelDocRef = db.collection('vehicles').doc(brandId).collection('models').doc(modelId);
    const modelDoc = await modelDocRef.get();
    
    if (!modelDoc.exists) {
      console.log(`❌ 모델 문서가 존재하지 않음: ${brandId}/${modelId}`);
      return;
    }
    
    const modelData = modelDoc.data();
    console.log(`📄 모델 데이터:`, modelData);

    // Admin SDK listCollections() 사용하여 서브컬렉션 동적 조회
    const trimCollections = await modelDocRef.listCollections();
    console.log(`🔍 발견된 서브컬렉션 수: ${trimCollections.length}`);
    
    const trims = [];
    
    // 각 트림 서브컬렉션에서 데이터 조회
    for (const trimCollection of trimCollections) {
      const trimId = trimCollection.id;
      console.log(`📋 트림 처리 중: ${trimId}`);
      
      try {
        // 트림의 data 문서 조회: /vehicles/{brandId}/models/{modelId}/{trimId}/data
        const trimDataDoc = await trimCollection.doc('data').get();
        
        if (trimDataDoc.exists) {
          const trimData = trimDataDoc.data();
          console.log(`📊 트림 데이터 (${trimId}):`, JSON.stringify(trimData, null, 2));
          
          // 트림 데이터 구조화
          const trim = {
            id: trimId,
            trimName: trimData.trimId || trimId,
            year: trimData.startYear || 2024,
            batteryCapacity: trimData.battery?.capacity || null,
            range: trimData.specs?.range || null,
            powerType: 'BEV',
            drivetrain: trimData.specs?.driveType === 'AWD' ? 'AWD' : 
                       trimData.specs?.driveType === '4WD' ? '4WD' : '2WD',
            modelId,
            brandId,
            battery: trimData.battery || {},
            specs: trimData.specs || {},
            startYear: trimData.startYear || 2024,
            endYear: trimData.endYear,
            createdAt: trimData.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: trimData.updatedAt?.toDate?.()?.toISOString() || null,
          };
          
          trims.push(trim);
        } else {
          console.log(`⚠️ 트림 데이터 문서가 없음: ${trimId}/data`);
        }
      } catch (trimError) {
        console.error(`❌ 트림 처리 실패 (${trimId}):`, trimError);
      }
    }
    
    // 연도별로 정렬 (최신 연도부터)
    trims.sort((a, b) => (b.year || 0) - (a.year || 0));
    
    console.log(`✅ 트림 조회 완료: ${brandId}/${modelId}, 총 ${trims.length}개 트림`);
    console.log('📋 최종 결과:');
    trims.forEach((trim, index) => {
      console.log(`${index + 1}. ${trim.trimName} (${trim.year}) - ${trim.batteryCapacity} - ${trim.range}`);
    });

    return {
      success: true,
      trims,
      totalCount: trims.length,
      message: `${trims.length}개 트림을 찾았습니다.`
    };

  } catch (error) {
    console.error('❌ 차량 트림 조회 테스트 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 테스트 실행
testGetVehicleTrims()
  .then(result => {
    console.log('\n🎯 테스트 결과:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 테스트 실행 실패:', error);
    process.exit(1);
  });