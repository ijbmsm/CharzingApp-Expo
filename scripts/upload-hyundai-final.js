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

// 현대 차량 데이터 (CLAUDE.md 구조에 따라)
const HYUNDAI_MODELS_FINAL = {
  "ioniq-5": {
    name: "아이오닉 5",
    englishName: "IONIQ-5",
    trims: [
      {
        trimId: "ioniq-5-standard-2wd",
        trimName: "Standard 2WD",
        driveType: "RWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "125kW",
        torqueMax: "350Nm",
        acceleration: "8.5초",
        topSpeed: "185km/h",
        seats: 5,
        efficiency: "5.1km/kWh",
        defaultBattery: {
          capacity: 58,
          range: 336
        },
        variants: [
          {
            years: [2021, 2022, 2023],
            capacity: 58,
            range: 336,
            note: "기본형"
          },
          {
            years: [2024],
            capacity: 58,
            range: 342,
            note: "2024 연식"
          },
          {
            years: [2024],
            capacity: 63,
            range: 368,
            note: "2024 리프레시 모델",
            variantId: "refresh"
          }
        ]
      },
      {
        trimId: "ioniq-5-standard-awd",
        trimName: "Standard AWD",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "173kW",
        torqueMax: "605Nm",
        acceleration: "5.2초",
        topSpeed: "185km/h",
        seats: 5,
        efficiency: "5.4km/kWh",
        defaultBattery: {
          capacity: 58,
          range: 316
        },
        variants: [
          {
            years: [2021, 2022, 2023],
            capacity: 58,
            range: 316,
            note: "기본형"
          }
        ]
      },
      {
        trimId: "ioniq-5-long-range-2wd",
        trimName: "Long Range 2WD",
        driveType: "RWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "160kW",
        torqueMax: "350Nm",
        acceleration: "7.4초",
        topSpeed: "185km/h",
        seats: 5,
        efficiency: "5.1km/kWh",
        defaultBattery: {
          capacity: 77,
          range: 429
        },
        variants: [
          {
            years: [2021, 2022, 2023],
            capacity: 77,
            range: 429,
            note: "기본형"
          },
          {
            years: [2024],
            capacity: 77,
            range: 438,
            note: "2024 연식"
          },
          {
            years: [2024],
            capacity: 84,
            range: 481,
            note: "2024 리프레시 모델",
            variantId: "refresh"
          }
        ]
      },
      {
        trimId: "ioniq-5-long-range-awd",
        trimName: "Long Range AWD",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "225kW",
        torqueMax: "605Nm",
        acceleration: "5.2초",
        topSpeed: "185km/h",
        seats: 5,
        efficiency: "5.4km/kWh",
        defaultBattery: {
          capacity: 77,
          range: 400
        },
        variants: [
          {
            years: [2021, 2022, 2023],
            capacity: 77,
            range: 400,
            note: "기본형"
          },
          {
            years: [2024],
            capacity: 84,
            range: 455,
            note: "2024 리프레시 모델",
            variantId: "refresh"
          }
        ]
      },
      {
        trimId: "ioniq-5-n-performance",
        trimName: "N Performance",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "478kW",
        torqueMax: "740Nm",
        acceleration: "3.4초",
        topSpeed: "260km/h",
        seats: 5,
        efficiency: "6.1km/kWh",
        defaultBattery: {
          capacity: 84,
          range: 448
        },
        variants: [
          {
            years: [2023, 2024],
            capacity: 84,
            range: 448,
            note: "고성능 모델"
          }
        ]
      }
    ]
  },
  "ioniq-6": {
    name: "아이오닉 6",
    englishName: "IONIQ-6", 
    trims: [
      {
        trimId: "ioniq-6-standard-2wd",
        trimName: "Standard 2WD",
        driveType: "RWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "111.25kW",
        torqueMax: "350Nm",
        acceleration: "8.8초",
        topSpeed: "185km/h",
        seats: 5,
        efficiency: "5.1km/kWh",
        defaultBattery: {
          capacity: 53,
          range: 305
        },
        variants: [
          {
            years: [2022, 2023, 2024],
            capacity: 53,
            range: 305,
            note: "기본형"
          }
        ]
      },
      {
        trimId: "ioniq-6-long-range-2wd",
        trimName: "Long Range 2WD",
        driveType: "RWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "168kW",
        torqueMax: "350Nm",
        acceleration: "7.4초",
        topSpeed: "185km/h",
        seats: 5,
        efficiency: "4.6km/kWh",
        defaultBattery: {
          capacity: 77,
          range: 524
        },
        variants: [
          {
            years: [2022, 2023, 2024],
            capacity: 77,
            range: 524,
            note: "장거리 모델"
          }
        ]
      },
      {
        trimId: "ioniq-6-long-range-awd",
        trimName: "Long Range AWD",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "239kW",
        torqueMax: "605Nm",
        acceleration: "5.1초",
        topSpeed: "185km/h",
        seats: 5,
        efficiency: "5.1km/kWh",
        defaultBattery: {
          capacity: 77,
          range: 486
        },
        variants: [
          {
            years: [2022, 2023, 2024],
            capacity: 77,
            range: 486,
            note: "장거리 AWD"
          }
        ]
      },
      {
        trimId: "ioniq-6-n-performance",
        trimName: "N Performance",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "430kW",
        torqueMax: "700Nm",
        acceleration: "3.4초",
        topSpeed: "250km/h",
        seats: 5,
        efficiency: "5.8km/kWh",
        defaultBattery: {
          capacity: 84,
          range: 450
        },
        variants: [
          {
            years: [2024],
            capacity: 84,
            range: 450,
            note: "고성능 모델"
          }
        ]
      }
    ]
  },
  "kona-electric": {
    name: "코나 일렉트릭",
    englishName: "KONA-ELECTRIC",
    trims: [
      {
        trimId: "kona-electric-standard",
        trimName: "Standard",
        driveType: "FWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "100kW",
        torqueMax: "395Nm",
        acceleration: "9.9초",
        topSpeed: "155km/h",
        seats: 5,
        efficiency: "5.1km/kWh",
        defaultBattery: {
          capacity: 39,
          range: 254
        },
        variants: [
          {
            years: [2018, 2020],
            capacity: 39,
            range: 254,
            note: "1세대"
          },
          {
            years: [2023],
            capacity: 48,
            range: 305,
            note: "2세대"
          }
        ]
      },
      {
        trimId: "kona-electric-long-range",
        trimName: "Long Range",
        driveType: "FWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "150kW",
        torqueMax: "395Nm",
        acceleration: "7.9초",
        topSpeed: "167km/h",
        seats: 5,
        efficiency: "5.1km/kWh",
        defaultBattery: {
          capacity: 64,
          range: 406
        },
        variants: [
          {
            years: [2018, 2020, 2021, 2022],
            capacity: 64,
            range: 406,
            note: "1세대"
          },
          {
            years: [2023],
            capacity: 65,
            range: 400,
            note: "2세대"
          }
        ]
      }
    ]
  },
  "ioniq-9": {
    name: "아이오닉 9",
    englishName: "IONIQ-9",
    trims: [
      {
        trimId: "ioniq-9-long-range-2wd",
        trimName: "항속형 2WD",
        driveType: "RWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "160kW",
        torqueMax: "350Nm",
        acceleration: "9.4초",
        topSpeed: "185km/h",
        seats: 7,
        efficiency: "5.2km/kWh",
        defaultBattery: {
          capacity: 110,
          range: 620
        },
        variants: [
          {
            years: [2025],
            capacity: 110,
            range: 620,
            note: "7인승 대형 SUV"
          }
        ]
      },
      {
        trimId: "ioniq-9-long-range-awd",
        trimName: "항속형 AWD",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "225kW",
        torqueMax: "605Nm",
        acceleration: "6.7초",
        topSpeed: "185km/h",
        seats: 7,
        efficiency: "5.5km/kWh",
        defaultBattery: {
          capacity: 110,
          range: 590
        },
        variants: [
          {
            years: [2025],
            capacity: 110,
            range: 590,
            note: "7인승 AWD"
          }
        ]
      },
      {
        trimId: "ioniq-9-performance",
        trimName: "성능형",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "320kW",
        torqueMax: "700Nm",
        acceleration: "5.2초",
        topSpeed: "200km/h",
        seats: 7,
        efficiency: "5.8km/kWh",
        defaultBattery: {
          capacity: 110,
          range: 570
        },
        variants: [
          {
            years: [2025],
            capacity: 110,
            range: 570,
            note: "고성능 7인승"
          }
        ]
      }
    ]
  },
  "casper-electric": {
    name: "캐스퍼 일렉트릭",
    englishName: "CASPER-ELECTRIC",
    trims: [
      {
        trimId: "casper-electric-premium",
        trimName: "Premium",
        driveType: "FWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "LFP",
        powerMax: "85kW",
        torqueMax: "255Nm",
        acceleration: "10.6초",
        topSpeed: "150km/h",
        seats: 5,
        efficiency: "6.4km/kWh",
        defaultBattery: {
          capacity: 49,
          range: 315
        },
        variants: [
          {
            years: [2024, 2025],
            capacity: 49,
            range: 315,
            note: "경형 전기차"
          }
        ]
      },
      {
        trimId: "casper-electric-inspiration",
        trimName: "Inspiration",
        driveType: "FWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "LFP",
        powerMax: "85kW",
        torqueMax: "255Nm",
        acceleration: "10.6초",
        topSpeed: "150km/h",
        seats: 5,
        efficiency: "6.4km/kWh",
        defaultBattery: {
          capacity: 49,
          range: 315
        },
        variants: [
          {
            years: [2024, 2025],
            capacity: 49,
            range: 315,
            note: "프리미엄 트림"
          }
        ]
      },
      {
        trimId: "casper-electric-cross",
        trimName: "Cross",
        driveType: "FWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "LFP",
        powerMax: "85kW",
        torqueMax: "255Nm",
        acceleration: "10.8초",
        topSpeed: "150km/h",
        seats: 5,
        efficiency: "6.6km/kWh",
        defaultBattery: {
          capacity: 49,
          range: 300
        },
        variants: [
          {
            years: [2025],
            capacity: 49,
            range: 300,
            note: "크로스오버 스타일"
          }
        ]
      }
    ]
  },
  "nexo": {
    name: "넥쏘",
    englishName: "NEXO",
    trims: [
      {
        trimId: "nexo-hydrogen",
        trimName: "Hydrogen",
        driveType: "FWD",
        batteryManufacturer: "현대",
        batteryWarranty: "8년/16만km",
        batteryType: "수소연료전지",
        powerMax: "95kW",
        torqueMax: "395Nm",
        acceleration: "9.5초",
        topSpeed: "179km/h",
        seats: 5,
        efficiency: "0.95kg/100km",
        defaultBattery: {
          capacity: 1.56,
          range: 609
        },
        variants: [
          {
            years: [2018],
            capacity: 1.56,
            range: 609,
            note: "1세대"
          },
          {
            years: [2023],
            capacity: 1.56,
            range: 666,
            note: "페이스리프트"
          },
          {
            years: [2024],
            capacity: 1.56,
            range: 686,
            note: "2세대"
          }
        ]
      }
    ]
  }
};

async function uploadFinalHyundaiVehicles() {
  try {
    console.log('🚗 현대 차량 데이터 업로드 시작 (CLAUDE.md 구조)...');
    
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
    
    // 브랜드 문서 생성
    await hyundaiDoc.set({
      brandName: '현대',
      englishName: 'HYUNDAI',
      logoUrl: 'https://example.com/hyundai-logo.png',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ 현대 브랜드 문서 생성 완료');
    
    // 각 모델별로 업로드 (CLAUDE.md 구조)
    for (const [modelId, modelData] of Object.entries(HYUNDAI_MODELS_FINAL)) {
      console.log(`🔄 업로드 중: ${modelData.name} (${modelId})`);
      
      const modelDoc = hyundaiDoc.collection('models').doc(modelId);
      await modelDoc.set({
        name: modelData.name,
        englishName: modelData.englishName,
        brandId: 'hyundai',
        trims: modelData.trims,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ ${modelData.name} 업로드 완료 (트림 ${modelData.trims.length}개)`);
      
      // 구조 확인 출력
      modelData.trims.forEach(trim => {
        console.log(`   - ${trim.trimName}: ${trim.defaultBattery.capacity}kWh, ${trim.defaultBattery.range}km`);
        console.log(`     배터리: ${trim.batteryManufacturer}, 연도별 ${trim.variants.length}개 변형`);
      });
    }
    
    console.log('🎉 현대 차량 데이터 업로드 완료! (CLAUDE.md 구조)');
    console.log(`📊 총 업로드된 모델: ${Object.keys(HYUNDAI_MODELS_FINAL).length}개`);
    
  } catch (error) {
    console.error('❌ 업로드 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  uploadFinalHyundaiVehicles()
    .then(() => {
      console.log('✅ 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실패:', error);
      process.exit(1);
    });
}

module.exports = { uploadFinalHyundaiVehicles, HYUNDAI_MODELS_FINAL };