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

// 메르세데스-벤츠 차량 데이터 (CLAUDE.md 구조)
const MERCEDES_MODELS_FINAL = {
  "eqc": {
    name: "EQC",
    trims: [
      {
        trimId: "eqc-400-4matic",
        trimName: "400 4MATIC",
        driveType: "AWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "304kW",
        torqueMax: "759Nm",
        acceleration: "5.1",
        topSpeed: "180",
        efficiency: "3.1",
        seats: 5,
        defaultBattery: {
          capacity: 80,
          range: 309
        },
        variants: [
          {
            years: [2019, 2020, 2021, 2022, 2023],
            capacity: 80,
            range: 309,
            note: "400 4MATIC"
          }
        ]
      }
    ]
  },
  "eqa": {
    name: "EQA",
    trims: [
      {
        trimId: "eqa-250",
        trimName: "250",
        driveType: "FWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "141kW",
        torqueMax: "375Nm",
        acceleration: "8.9",
        topSpeed: "160",
        efficiency: "4.6",
        seats: 5,
        defaultBattery: {
          capacity: 66.5,
          range: 306
        },
        variants: [
          {
            years: [2021, 2022],
            capacity: 66.5,
            range: 306,
            note: "기본형",
            batteryManufacturer: "CATL"
          },
          {
            years: [2021, 2022],
            capacity: 66.5,
            range: 306,
            note: "AMG 패키지",
            batteryManufacturer: "CATL",
            variantId: "amg-package"
          },
          {
            years: [2021, 2022],
            capacity: 66.5,
            range: 306,
            note: "AMG 패키지 플러스",
            batteryManufacturer: "CATL",
            variantId: "amg-package-plus"
          },
          {
            years: [2023],
            capacity: 66.5,
            range: 306,
            note: "프로그레시브",
            batteryManufacturer: "SK온"
          },
          {
            years: [2023],
            capacity: 66.5,
            range: 306,
            note: "AMG 라인",
            batteryManufacturer: "SK온",
            variantId: "amg-line"
          },
          {
            years: [2024],
            capacity: 66.5,
            range: 378,
            note: "일렉트릭 아트",
            batteryManufacturer: "SK온",
            efficiency: "4.9",
            variantId: "electric-art"
          },
          {
            years: [2024],
            capacity: 66.5,
            range: 378,
            note: "AMG 라인 2024",
            batteryManufacturer: "SK온",
            efficiency: "4.9",
            variantId: "amg-line-2024"
          }
        ]
      }
    ]
  },
  "eqb": {
    name: "EQB",
    trims: [
      {
        trimId: "eqb-300-4matic",
        trimName: "300 4MATIC",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "170kW",
        torqueMax: "390Nm",
        acceleration: "8.0",
        topSpeed: "160",
        efficiency: "4.1",
        seats: 7,
        defaultBattery: {
          capacity: 66.5,
          range: 313
        },
        variants: [
          {
            years: [2022, 2023],
            capacity: 66.5,
            range: 313,
            note: "프로그레시브"
          },
          {
            years: [2022, 2023],
            capacity: 66.5,
            range: 313,
            note: "AMG 라인",
            variantId: "amg-line"
          },
          {
            years: [2024],
            capacity: 66.5,
            range: 302,
            note: "일렉트릭 아트",
            variantId: "electric-art"
          },
          {
            years: [2024],
            capacity: 66.5,
            range: 302,
            note: "AMG 라인 2024",
            variantId: "amg-line-2024"
          }
        ]
      }
    ]
  },
  "eqe": {
    name: "EQE",
    trims: [
      {
        trimId: "eqe-350",
        trimName: "350",
        driveType: "RWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "217kW",
        torqueMax: "565Nm",
        acceleration: "6.4",
        topSpeed: "210",
        efficiency: "4.9",
        seats: 5,
        defaultBattery: {
          capacity: 90.6,
          range: 471
        },
        variants: [
          {
            years: [2022],
            capacity: 90.6,
            range: 471,
            note: "초기 모델"
          }
        ]
      },
      {
        trimId: "eqe-350-plus",
        trimName: "350+",
        driveType: "RWD",
        batteryManufacturer: "Farasis Energy",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "217kW",
        torqueMax: "565Nm",
        acceleration: "6.2",
        topSpeed: "210",
        efficiency: "5.1",
        seats: 5,
        defaultBattery: {
          capacity: 90.6,
          range: 486
        },
        variants: [
          {
            years: [2022, 2023],
            capacity: 90.6,
            range: 471,
            note: "초기 350+ 모델",
            acceleration: "6.4",
            efficiency: "4.9"
          },
          {
            years: [2024, 2025],
            capacity: 90.6,
            range: 486,
            note: "개선된 350+",
            torqueMax: "568Nm"
          }
        ]
      },
      {
        trimId: "eqe-350-4matic",
        trimName: "350 4MATIC",
        driveType: "AWD",
        batteryManufacturer: "Farasis Energy",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "217kW",
        torqueMax: "751Nm",
        acceleration: "6.0",
        topSpeed: "210",
        efficiency: "4.5",
        seats: 5,
        defaultBattery: {
          capacity: 90.6,
          range: 432
        },
        variants: [
          {
            years: [2024, 2025],
            capacity: 90.6,
            range: 432,
            note: "AWD 모델"
          }
        ]
      },
      {
        trimId: "eqe-amg-53-4matic",
        trimName: "AMG 53 4MATIC+",
        driveType: "AWD",
        batteryManufacturer: "Farasis Energy",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "466kW",
        torqueMax: "950Nm",
        acceleration: "3.5",
        topSpeed: "240",
        efficiency: "3.6",
        seats: 5,
        defaultBattery: {
          capacity: 90.6,
          range: 354
        },
        variants: [
          {
            years: [2022, 2023],
            capacity: 90.6,
            range: 354,
            note: "초기 AMG 모델"
          },
          {
            years: [2024, 2025],
            capacity: 90.6,
            range: 370,
            note: "개선된 AMG"
          }
        ]
      }
    ]
  },
  "eqe-suv": {
    name: "EQE SUV",
    trims: [
      {
        trimId: "eqe-suv-350-4matic",
        trimName: "350 4MATIC",
        driveType: "AWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "217kW",
        torqueMax: "751Nm",
        acceleration: "6.0",
        topSpeed: "210",
        efficiency: "4.1",
        seats: 5,
        defaultBattery: {
          capacity: 88.8,
          range: 404
        },
        variants: [
          {
            years: [2023],
            capacity: 88.8,
            range: 404,
            note: "SUV 런칭"
          },
          {
            years: [2024],
            capacity: 88.8,
            range: 404,
            note: "2024 연식",
            batteryManufacturer: "CATL, Farasis Energy"
          },
          {
            years: [2025],
            capacity: 88.8,
            range: 404,
            note: "2025 연식",
            batteryManufacturer: "Farasis Energy"
          }
        ]
      },
      {
        trimId: "eqe-suv-500-4matic",
        trimName: "500 4MATIC",
        driveType: "AWD",
        batteryManufacturer: "Farasis Energy",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "304kW",
        torqueMax: "853Nm",
        acceleration: "5.0",
        topSpeed: "210",
        efficiency: "4.1",
        seats: 5,
        defaultBattery: {
          capacity: 88.8,
          range: 401
        },
        variants: [
          {
            years: [2023],
            capacity: 88.8,
            range: 401,
            note: "500 고성능 모델"
          },
          {
            years: [2024, 2025],
            capacity: 88.8,
            range: 401,
            note: "개선된 500",
            batteryManufacturer: "CATL"
          }
        ]
      },
      {
        trimId: "eqe-suv-amg-53-4matic",
        trimName: "AMG 53 4MATIC+",
        driveType: "AWD",
        batteryManufacturer: "Farasis Energy",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "466kW",
        torqueMax: "950Nm",
        acceleration: "3.5",
        topSpeed: "240",
        efficiency: "3.6",
        seats: 5,
        defaultBattery: {
          capacity: 90.6,
          range: 352
        },
        variants: [
          {
            years: [2024, 2025],
            capacity: 90.6,
            range: 352,
            note: "AMG SUV"
          }
        ]
      }
    ]
  },
  "eqs": {
    name: "EQS",
    trims: [
      {
        trimId: "eqs-350",
        trimName: "350",
        driveType: "RWD",
        batteryManufacturer: "Farasis Energy",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "217kW",
        torqueMax: "566Nm",
        acceleration: "6.6",
        topSpeed: "210",
        efficiency: "4.0",
        seats: 5,
        defaultBattery: {
          capacity: 96.5,
          range: 440
        },
        variants: [
          {
            years: [2022],
            capacity: 96.5,
            range: 440,
            note: "초기 EQS"
          },
          {
            years: [2025],
            capacity: 112.3,
            range: 464,
            note: "대용량 배터리",
            batteryManufacturer: "CATL",
            efficiency: "4.1"
          }
        ]
      },
      {
        trimId: "eqs-450-plus",
        trimName: "450+",
        driveType: "RWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "248kW",
        torqueMax: "568Nm",
        acceleration: "6.2",
        topSpeed: "210",
        efficiency: "3.8",
        seats: 5,
        defaultBattery: {
          capacity: 107.8,
          range: 478
        },
        variants: [
          {
            years: [2022, 2023],
            capacity: 107.8,
            range: 478,
            note: "450+ 모델"
          }
        ]
      },
      {
        trimId: "eqs-450-4matic",
        trimName: "450 4MATIC",
        driveType: "AWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "248kW",
        torqueMax: "568Nm",
        acceleration: "6.4",
        topSpeed: "210",
        efficiency: "3.6",
        seats: 5,
        defaultBattery: {
          capacity: 107.8,
          range: 468
        },
        variants: [
          {
            years: [2023],
            capacity: 107.8,
            range: 468,
            note: "AWD 초기"
          },
          {
            years: [2025],
            capacity: 118,
            range: 500,
            note: "2025 대용량",
            powerMax: "268kW",
            torqueMax: "800Nm",
            acceleration: "5.0",
            efficiency: "4.1"
          }
        ]
      },
      {
        trimId: "eqs-580-4matic",
        trimName: "580 4MATIC",
        driveType: "AWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "405kW",
        torqueMax: "858Nm",
        acceleration: "4.5",
        topSpeed: "210",
        efficiency: "4.1",
        seats: 5,
        defaultBattery: {
          capacity: 118,
          range: 500
        },
        variants: [
          {
            years: [2025],
            capacity: 118,
            range: 500,
            note: "580 고성능"
          }
        ]
      },
      {
        trimId: "eqs-amg-53-4matic",
        trimName: "AMG 53 4MATIC+",
        driveType: "AWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "567kW",
        torqueMax: "1020Nm",
        acceleration: "3.8",
        topSpeed: "250",
        efficiency: "3.1",
        seats: 5,
        defaultBattery: {
          capacity: 107.8,
          range: 397
        },
        variants: [
          {
            years: [2022, 2023],
            capacity: 107.8,
            range: 397,
            note: "초기 AMG"
          },
          {
            years: [2025],
            capacity: 118,
            range: 400,
            note: "개선된 AMG",
            acceleration: "3.4",
            efficiency: "3.3"
          }
        ]
      }
    ]
  },
  "eqs-suv": {
    name: "EQS SUV",
    trims: [
      {
        trimId: "eqs-suv-450-4matic",
        trimName: "450 4MATIC",
        driveType: "AWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "268kW",
        torqueMax: "800Nm",
        acceleration: "6.0",
        topSpeed: "210",
        efficiency: "3.6",
        seats: 7,
        defaultBattery: {
          capacity: 118,
          range: 459
        },
        variants: [
          {
            years: [2023, 2024, 2025],
            capacity: 118,
            range: 459,
            note: "럭셔리 7인승 SUV"
          }
        ]
      },
      {
        trimId: "eqs-suv-580-4matic",
        trimName: "580 4MATIC",
        driveType: "AWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "405kW",
        torqueMax: "858Nm",
        acceleration: "4.5",
        topSpeed: "210",
        efficiency: "3.5",
        seats: 7,
        defaultBattery: {
          capacity: 118,
          range: 459
        },
        variants: [
          {
            years: [2023, 2024, 2025],
            capacity: 118,
            range: 459,
            note: "고성능 7인승 SUV"
          }
        ]
      }
    ]
  },
  "g-class-electric": {
    name: "G-Class Electric",
    trims: [
      {
        trimId: "g-580-eq-technology",
        trimName: "G 580 with EQ Technology",
        driveType: "AWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "437kW",
        torqueMax: "1164Nm",
        acceleration: "4.7",
        topSpeed: "180",
        efficiency: "3.0",
        seats: 5,
        defaultBattery: {
          capacity: 116,
          range: 392
        },
        variants: [
          {
            years: [2025],
            capacity: 116,
            range: 392,
            note: "전기 G클래스"
          }
        ]
      }
    ]
  }
};

// 메르세데스-마이바흐 모델
const MAYBACH_MODELS_FINAL = {
  "eqs-suv": {
    name: "EQS SUV",
    trims: [
      {
        trimId: "maybach-eqs-680-suv",
        trimName: "680 4MATIC",
        driveType: "AWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "10년/25만km",
        batteryType: "NCM",
        powerMax: "490kW",
        torqueMax: "950Nm",
        acceleration: "4.4",
        topSpeed: "210",
        efficiency: "3.5",
        seats: 4,
        defaultBattery: {
          capacity: 118,
          range: 471
        },
        variants: [
          {
            years: [2024, 2025],
            capacity: 118,
            range: 471,
            note: "최고급 마이바흐"
          }
        ]
      }
    ]
  }
};

async function uploadMercedesVehicles() {
  try {
    console.log('🚗 메르세데스-벤츠 차량 데이터 업로드 시작 (CLAUDE.md 구조)...');
    
    // 1. 메르세데스-벤츠 브랜드 업로드
    console.log('🗑️ 기존 메르세데스-벤츠 데이터 삭제 중...');
    const mercedesDoc = db.collection('vehicles').doc('mercedes-benz');
    const modelsSnapshot = await mercedesDoc.collection('models').get();
    
    const batch = db.batch();
    modelsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✅ 기존 모델 데이터 삭제 완료');
    
    // 브랜드 문서 생성
    await mercedesDoc.set({
      brandName: '메르세데스-벤츠',
      englishName: 'MERCEDES-BENZ',
      logoUrl: 'https://example.com/mercedes-benz-logo.png',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ 메르세데스-벤츠 브랜드 문서 생성 완료');
    
    // 각 모델별로 업로드
    for (const [modelId, modelData] of Object.entries(MERCEDES_MODELS_FINAL)) {
      console.log(`🔄 업로드 중: ${modelData.name} (${modelId})`);
      
      const modelDoc = mercedesDoc.collection('models').doc(modelId);
      await modelDoc.set({
        name: modelData.name,
        englishName: modelId.toUpperCase(),
        brandId: 'mercedes-benz',
        trims: modelData.trims,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ ${modelData.name} 업로드 완료 (트림 ${modelData.trims.length}개)`);
      
      // 트림 구조 확인 출력
      modelData.trims.forEach(trim => {
        console.log(`   - ${trim.trimName}: ${trim.defaultBattery.capacity}kWh, ${trim.defaultBattery.range}km`);
        console.log(`     배터리: ${trim.batteryManufacturer}, 연도별 ${trim.variants.length}개 변형`);
      });
    }
    
    // 2. 메르세데스-마이바흐 브랜드 업로드
    console.log('\n🗑️ 기존 메르세데스-마이바흐 데이터 삭제 중...');
    const maybachDoc = db.collection('vehicles').doc('mercedes-maybach');
    const maybachModelsSnapshot = await maybachDoc.collection('models').get();
    
    const maybachBatch = db.batch();
    maybachModelsSnapshot.docs.forEach(doc => {
      maybachBatch.delete(doc.ref);
    });
    await maybachBatch.commit();
    console.log('✅ 기존 마이바흐 모델 데이터 삭제 완료');
    
    // 마이바흐 브랜드 문서 생성
    await maybachDoc.set({
      brandName: '메르세데스-마이바흐',
      englishName: 'MERCEDES-MAYBACH',
      logoUrl: 'https://example.com/mercedes-maybach-logo.png',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ 메르세데스-마이바흐 브랜드 문서 생성 완료');
    
    // 마이바흐 모델 업로드
    for (const [modelId, modelData] of Object.entries(MAYBACH_MODELS_FINAL)) {
      console.log(`🔄 업로드 중: Maybach ${modelData.name} (${modelId})`);
      
      const modelDoc = maybachDoc.collection('models').doc(modelId);
      await modelDoc.set({
        name: modelData.name,
        englishName: modelId.toUpperCase(),
        brandId: 'mercedes-maybach',
        trims: modelData.trims,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Maybach ${modelData.name} 업로드 완료 (트림 ${modelData.trims.length}개)`);
      
      // 트림 구조 확인 출력
      modelData.trims.forEach(trim => {
        console.log(`   - ${trim.trimName}: ${trim.defaultBattery.capacity}kWh, ${trim.defaultBattery.range}km`);
        console.log(`     배터리: ${trim.batteryManufacturer}, 연도별 ${trim.variants.length}개 변형`);
      });
    }
    
    console.log('\n🎉 메르세데스-벤츠 & 마이바흐 차량 데이터 업로드 완료! (CLAUDE.md 구조)');
    console.log(`📊 메르세데스-벤츠 모델: ${Object.keys(MERCEDES_MODELS_FINAL).length}개`);
    console.log(`📊 메르세데스-마이바흐 모델: ${Object.keys(MAYBACH_MODELS_FINAL).length}개`);
    
  } catch (error) {
    console.error('❌ 업로드 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  uploadMercedesVehicles()
    .then(() => {
      console.log('✅ 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실패:', error);
      process.exit(1);
    });
}

module.exports = { uploadMercedesVehicles, MERCEDES_MODELS_FINAL, MAYBACH_MODELS_FINAL };