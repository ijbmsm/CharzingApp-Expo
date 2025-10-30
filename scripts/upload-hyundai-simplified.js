#!/usr/bin/env node

const admin = require('firebase-admin');

// Firebase Admin 초기화
const serviceAccount = require('./serviceAccountKey.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// 현대 차량 데이터 (단순화된 구조)
const HYUNDAI_MODELS_SIMPLIFIED = {
  "ioniq-5": {
    name: "아이오닉 5",
    trims: [
      {
        trimId: "ioniq-5-standard-2wd",
        trimName: "Standard 2WD",
        driveType: "RWD",
        years: ["2021", "2022", "2023", "2024"],
        batteryCapacity: 58,
        range: 336,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "125kW",
        torqueMax: "350Nm",
        acceleration: "8.5",
        topSpeed: "185",
        efficiency: "5.1",
        seats: 5
      },
      {
        trimId: "ioniq-5-standard-awd",
        trimName: "Standard AWD",
        driveType: "AWD",
        years: ["2021", "2022", "2023"],
        batteryCapacity: 58,
        range: 316,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "173kW",
        torqueMax: "605Nm",
        acceleration: "5.2",
        topSpeed: "185",
        efficiency: "5.4",
        seats: 5
      },
      {
        trimId: "ioniq-5-long-range-2wd",
        trimName: "Long Range 2WD",
        driveType: "RWD",
        years: ["2021", "2022", "2023", "2024"],
        batteryCapacity: 77,
        range: 429,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "160kW",
        torqueMax: "350Nm",
        acceleration: "7.4",
        topSpeed: "185",
        efficiency: "5.1",
        seats: 5
      },
      {
        trimId: "ioniq-5-long-range-awd",
        trimName: "Long Range AWD",
        driveType: "AWD",
        years: ["2021", "2022", "2023", "2024"],
        batteryCapacity: 77,
        range: 400,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "225kW",
        torqueMax: "605Nm",
        acceleration: "5.2",
        topSpeed: "185",
        efficiency: "5.4",
        seats: 5
      },
      {
        trimId: "ioniq-5-n-performance",
        trimName: "N Performance",
        driveType: "AWD",
        years: ["2023", "2024"],
        batteryCapacity: 84,
        range: 448,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "478kW",
        torqueMax: "740Nm",
        acceleration: "3.4",
        topSpeed: "260",
        efficiency: "6.1",
        seats: 5
      }
    ]
  },
  "ioniq-6": {
    name: "아이오닉 6",
    trims: [
      {
        trimId: "ioniq-6-standard-2wd",
        trimName: "Standard 2WD",
        driveType: "RWD",
        years: ["2022", "2023", "2024"],
        batteryCapacity: 53,
        range: 305,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "111.25kW",
        torqueMax: "350Nm",
        acceleration: "8.8",
        topSpeed: "185",
        efficiency: "5.1",
        seats: 5
      },
      {
        trimId: "ioniq-6-long-range-2wd",
        trimName: "Long Range 2WD",
        driveType: "RWD",
        years: ["2022", "2023", "2024"],
        batteryCapacity: 77,
        range: 524,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "168kW",
        torqueMax: "350Nm",
        acceleration: "7.4",
        topSpeed: "185",
        efficiency: "4.6",
        seats: 5
      },
      {
        trimId: "ioniq-6-long-range-awd",
        trimName: "Long Range AWD",
        driveType: "AWD",
        years: ["2022", "2023", "2024"],
        batteryCapacity: 77,
        range: 486,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "239kW",
        torqueMax: "605Nm",
        acceleration: "5.1",
        topSpeed: "185",
        efficiency: "5.1",
        seats: 5
      },
      {
        trimId: "ioniq-6-n-performance",
        trimName: "N Performance",
        driveType: "AWD",
        years: ["2024"],
        batteryCapacity: 84,
        range: 450,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "430kW",
        torqueMax: "700Nm",
        acceleration: "3.4",
        topSpeed: "250",
        efficiency: "5.8",
        seats: 5
      }
    ]
  },
  "kona-electric": {
    name: "코나 일렉트릭",
    trims: [
      {
        trimId: "kona-electric-standard",
        trimName: "Standard",
        driveType: "FWD",
        years: ["2018", "2020", "2023"],
        batteryCapacity: 39,
        range: 254,
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "100kW",
        torqueMax: "395Nm",
        acceleration: "9.9",
        topSpeed: "155",
        efficiency: "5.1",
        seats: 5
      },
      {
        trimId: "kona-electric-long-range",
        trimName: "Long Range",
        driveType: "FWD",
        years: ["2018", "2020", "2021", "2022", "2023"],
        batteryCapacity: 64,
        range: 406,
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "150kW",
        torqueMax: "395Nm",
        acceleration: "7.9",
        topSpeed: "167",
        efficiency: "5.1",
        seats: 5
      }
    ]
  },
  "ioniq-9": {
    name: "아이오닉 9",
    trims: [
      {
        trimId: "ioniq-9-long-range-2wd",
        trimName: "항속형 2WD",
        driveType: "RWD",
        years: ["2025"],
        batteryCapacity: 110,
        range: 620,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "160kW",
        torqueMax: "350Nm",
        acceleration: "9.4",
        topSpeed: "185",
        efficiency: "5.2",
        seats: 7
      },
      {
        trimId: "ioniq-9-long-range-awd",
        trimName: "항속형 AWD",
        driveType: "AWD",
        years: ["2025"],
        batteryCapacity: 110,
        range: 590,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "225kW",
        torqueMax: "605Nm",
        acceleration: "6.7",
        topSpeed: "185",
        efficiency: "5.5",
        seats: 7
      },
      {
        trimId: "ioniq-9-performance",
        trimName: "성능형",
        driveType: "AWD",
        years: ["2025"],
        batteryCapacity: 110,
        range: 570,
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "320kW",
        torqueMax: "700Nm",
        acceleration: "5.2",
        topSpeed: "200",
        efficiency: "5.8",
        seats: 7
      }
    ]
  },
  "casper-electric": {
    name: "캐스퍼 일렉트릭",
    trims: [
      {
        trimId: "casper-electric-premium",
        trimName: "Premium",
        driveType: "FWD",
        years: ["2024", "2025"],
        batteryCapacity: 49,
        range: 315,
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "LFP",
        powerMax: "85kW",
        torqueMax: "255Nm",
        acceleration: "10.6",
        topSpeed: "150",
        efficiency: "6.4",
        seats: 5
      },
      {
        trimId: "casper-electric-inspiration",
        trimName: "Inspiration",
        driveType: "FWD",
        years: ["2024", "2025"],
        batteryCapacity: 49,
        range: 315,
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "LFP",
        powerMax: "85kW",
        torqueMax: "255Nm",
        acceleration: "10.6",
        topSpeed: "150",
        efficiency: "6.4",
        seats: 5
      },
      {
        trimId: "casper-electric-cross",
        trimName: "Cross",
        driveType: "FWD",
        years: ["2025"],
        batteryCapacity: 49,
        range: 300,
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "LFP",
        powerMax: "85kW",
        torqueMax: "255Nm",
        acceleration: "10.8",
        topSpeed: "150",
        efficiency: "6.6",
        seats: 5
      }
    ]
  },
  "nexo": {
    name: "넥쏘",
    trims: [
      {
        trimId: "nexo-hydrogen",
        trimName: "Hydrogen",
        driveType: "FWD",
        years: ["2018", "2023", "2024"],
        batteryCapacity: 1.56,
        range: 609,
        batteryManufacturer: "현대",
        batteryWarranty: "8년/16만km",
        batteryType: "수소연료전지",
        powerMax: "95kW",
        torqueMax: "395Nm",
        acceleration: "9.5",
        topSpeed: "179",
        efficiency: "0.95",
        seats: 5
      }
    ]
  }
};

async function uploadSimplifiedHyundaiVehicles() {
  try {
    console.log('🚗 현대 차량 데이터 업로드 시작 (단순화된 구조)...');
    
    // 기존 현대 데이터 삭제
    console.log('🗑️ 기존 현대 데이터 삭제 중...');
    const hyundaiDoc = db.collection('vehicles').doc('hyundai');
    const modelsSnapshot = await hyundaiDoc.collection('models').get();
    
    const batch = db.batch();
    modelsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✅ 기존 모델 데이터 삭제 완료');
    
    // 브랜드 문서 다시 생성
    await hyundaiDoc.set({
      brandName: '현대',
      englishName: 'HYUNDAI',
      logoUrl: 'https://example.com/hyundai-logo.png',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ 현대 브랜드 문서 재생성 완료');
    
    // 각 모델별로 업로드 (단순화된 구조)
    for (const [modelId, modelData] of Object.entries(HYUNDAI_MODELS_SIMPLIFIED)) {
      console.log(`🔄 업로드 중: ${modelData.name} (${modelId})`);
      
      const modelDoc = hyundaiDoc.collection('models').doc(modelId);
      await modelDoc.set({
        name: modelData.name,
        englishName: modelId.toUpperCase(),
        brandId: 'hyundai',
        trims: modelData.trims,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ ${modelData.name} 업로드 완료 (트림 ${modelData.trims.length}개)`);
      
      // 트림 구조 확인 출력
      modelData.trims.forEach(trim => {
        console.log(`   - ${trim.trimName}: ${trim.batteryCapacity}kWh, ${trim.range}km, ${trim.batteryManufacturer}`);
      });
    }
    
    console.log('🎉 현대 차량 데이터 업로드 완료! (단순화된 구조)');
    console.log(`📊 총 업로드된 모델: ${Object.keys(HYUNDAI_MODELS_SIMPLIFIED).length}개`);
    
  } catch (error) {
    console.error('❌ 업로드 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  uploadSimplifiedHyundaiVehicles()
    .then(() => {
      console.log('✅ 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실패:', error);
      process.exit(1);
    });
}

module.exports = { uploadSimplifiedHyundaiVehicles, HYUNDAI_MODELS_SIMPLIFIED };