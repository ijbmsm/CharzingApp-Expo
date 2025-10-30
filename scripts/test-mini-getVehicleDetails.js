const admin = require('firebase-admin');

// Firebase Admin 초기화
if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// getVehicleDetails 함수 시뮬레이션
async function testMiniVehicleDetails() {
  try {
    const make = 'MINI';
    const model = 'COOPER';
    const year = 2025;
    const trim = 'SE';
    
    console.log(`🧪 테스트 시작: ${make} ${model} ${year} ${trim}`);
    
    // 브랜드명 정규화
    const brandMapping = {
      'MINI': 'MINI',
      'Mini': 'MINI',
      'mini': 'MINI'
    };
    
    const brandId = brandMapping[make] || make.toLowerCase();
    console.log(`📋 브랜드 매핑: ${make} → ${brandId}`);
    
    // 동적 모델 검색
    const brandDocRef = db.collection('vehicles').doc(brandId);
    const modelsCollectionRef = brandDocRef.collection('models');
    const modelsSnapshot = await modelsCollectionRef.get();
    
    if (!modelsSnapshot.empty) {
      const availableModels = modelsSnapshot.docs.map(doc => doc.id);
      console.log(`📋 ${brandId} 브랜드 사용 가능한 모델들:`, availableModels);
      
      // 정확히 일치하는 모델 찾기
      const normalizedModel = model.toLowerCase().replace(/[\s\-]/g, '-');
      console.log(`🔍 정규화된 모델명: ${model} → ${normalizedModel}`);
      
      let modelId = availableModels.find(availableModel => 
        availableModel.toLowerCase() === normalizedModel ||
        availableModel.toLowerCase().replace(/[\s\-]/g, '-') === normalizedModel
      ) || null;
      
      if (!modelId) {
        // 부분 매칭으로 가장 유사한 모델 찾기
        const inputWords = model.toLowerCase().replace(/[\s\-]/g, ' ').split(' ').filter(w => w.length > 0);
        console.log(`🔤 입력 단어들:`, inputWords);
        
        let bestMatch = null;
        let bestScore = 0;
        
        for (const availableModel of availableModels) {
          const modelWords = availableModel.toLowerCase().replace(/[\s\-]/g, ' ').split(' ').filter(w => w.length > 0);
          let score = 0;
          
          // 단어별 매칭 점수 계산
          for (const inputWord of inputWords) {
            for (const modelWord of modelWords) {
              if (inputWord === modelWord) {
                score += 2; // 정확한 단어 매칭
              } else if (inputWord.includes(modelWord) || modelWord.includes(inputWord)) {
                score += 1; // 부분 매칭
              }
            }
          }
          
          console.log(`📊 ${availableModel}: 점수 ${score}`);
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = availableModel;
          }
        }
        
        if (bestMatch && bestScore > 0) {
          modelId = bestMatch;
          console.log(`🎯 유사도 매칭 성공: "${model}" → "${modelId}" (점수: ${bestScore})`);
        } else {
          console.log(`❌ 매칭 실패: "${model}" in ${brandId}`);
          return;
        }
      } else {
        console.log(`✅ 정확한 매칭: "${model}" → "${modelId}"`);
      }
      
      // Firestore에서 차량 데이터 조회
      console.log(`\n🔍 Firestore 경로: vehicles/${brandId}/models/${modelId}`);
      const vehicleDocRef = db.collection('vehicles').doc(brandId).collection('models').doc(modelId);
      const vehicleDoc = await vehicleDocRef.get();

      if (!vehicleDoc.exists) {
        console.log(`❌ 차량 데이터 없음: ${brandId}/${modelId}`);
        return;
      }

      const vehicleData = vehicleDoc.data();
      console.log(`✅ 차량 데이터 조회 성공!`);
      console.log(`📊 모델명: ${vehicleData.name}`);
      console.log(`🖼️ 이미지 URL: ${vehicleData.imageUrl ? '✅ 있음' : '❌ 없음'}`);
      console.log(`🔋 기본 배터리:`, vehicleData.defaultBattery ? '✅ 있음' : '❌ 없음');
      console.log(`🏷️ 트림 개수: ${vehicleData.trims ? vehicleData.trims.length : 0}개`);
      
      if (vehicleData.trims && vehicleData.trims.length > 0) {
        console.log(`📋 사용 가능한 트림들:`);
        vehicleData.trims.forEach(trim => {
          console.log(`  - ${trim.name} (${trim.driveType})`);
        });
      }
      
    } else {
      console.log(`❌ ${brandId} 브랜드에 모델이 없습니다.`);
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  } finally {
    process.exit(0);
  }
}

testMiniVehicleDetails();