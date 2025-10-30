const admin = require('firebase-admin');

// Firebase Admin 초기화
if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugUserMiniVehicle() {
  try {
    console.log('🔍 사용자 MINI 차량 데이터 확인...');
    
    // 사용자 차량 목록에서 MINI 차량 찾기
    const userVehiclesSnapshot = await db.collection('userVehicles').get();
    
    const miniVehicles = [];
    userVehiclesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.make && (data.make.includes('미니') || data.make.includes('MINI') || data.make.toLowerCase().includes('mini'))) {
        miniVehicles.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    console.log(`📋 발견된 MINI 차량 수: ${miniVehicles.length}개`);
    
    miniVehicles.forEach((vehicle, index) => {
      console.log(`\n🚗 MINI 차량 ${index + 1}:`);
      console.log(`  📄 문서 ID: ${vehicle.id}`);
      console.log(`  🏭 브랜드: "${vehicle.make}"`);
      console.log(`  🚙 모델: "${vehicle.model}"`);
      console.log(`  🎨 트림: "${vehicle.trim}"`);
      console.log(`  📅 연도: ${vehicle.year}`);
      console.log(`  🔋 배터리: ${vehicle.batteryCapacity}`);
      console.log(`  🖼️ 이미지 URL: ${vehicle.imageUrl ? '✅ 있음' : '❌ 없음'}`);
      
      // getVehicleDetails 함수 호출 시뮬레이션
      console.log(`\n🧪 getVehicleDetails 호출 시뮬레이션:`);
      console.log(`  입력: make="${vehicle.make}", model="${vehicle.model}", year=${vehicle.year}, trim="${vehicle.trim}"`);
      
      // 브랜드 매핑
      const brandMapping = {
        '현대': 'hyundai', 'HYUNDAI': 'hyundai', 'Hyundai': 'hyundai',
        '기아': 'kia', 'KIA': 'kia', 'Kia': 'kia',
        '테슬라': 'tesla', 'TESLA': 'tesla', 'Tesla': 'tesla',
        'BMW': 'BMW', 'bmw': 'BMW', '비엠더블유': 'BMW',
        '메르세데스-벤츠': 'mercedes-benz', 'Mercedes-Benz': 'mercedes-benz', 'MERCEDES-BENZ': 'mercedes-benz', '벤츠': 'mercedes-benz',
        '메르세데스-마이바흐': 'mercedes-maybach', 'Mercedes-Maybach': 'mercedes-maybach', 'MERCEDES-MAYBACH': 'mercedes-maybach', '마이바흐': 'mercedes-maybach', 'Maybach': 'mercedes-maybach', 'MAYBACH': 'mercedes-maybach',
        '아우디': 'audi', 'AUDI': 'audi', 'Audi': 'audi',
        '포르쉐': 'PORSCHE', 'PORSCHE': 'PORSCHE', 'Porsche': 'PORSCHE',
        'MINI': 'MINI', 'Mini': 'MINI', 'mini': 'MINI', '미니': 'MINI'
      };
      
      const brandId = brandMapping[vehicle.make] || vehicle.make.toLowerCase();
      console.log(`  브랜드 매핑: "${vehicle.make}" → "${brandId}"`);
      
      // 모델 정규화
      const normalizedModel = vehicle.model.toLowerCase().replace(/[\s\-]/g, '-');
      console.log(`  모델 정규화: "${vehicle.model}" → "${normalizedModel}"`);
      
      console.log(`  예상 Firestore 경로: vehicles/${brandId}/models/${normalizedModel}`);
    });
    
    // MINI 브랜드 실제 모델 목록 확인
    console.log(`\n🔍 MINI 브랜드 실제 모델 목록:`);
    const miniModelsSnapshot = await db.collection('vehicles').doc('MINI').collection('models').get();
    const availableModels = miniModelsSnapshot.docs.map(doc => doc.id);
    console.log(`  사용 가능한 모델: ${availableModels.join(', ')}`);
    
  } catch (error) {
    console.error('❌ 디버깅 실패:', error);
  } finally {
    process.exit(0);
  }
}

debugUserMiniVehicle();