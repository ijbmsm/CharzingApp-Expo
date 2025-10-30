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

// 테슬라 차량 데이터 (CLAUDE.md 구조)
const TESLA_MODELS_FINAL = {
  "model-s": {
    name: "Model S",
    trims: [
      {
        trimId: "model-s-90d",
        trimName: "90D",
        driveType: "AWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/무제한 주행거리",
        batteryType: "NCA",
        powerMax: "307kW",
        torqueMax: "660Nm",
        acceleration: "4.4",
        topSpeed: "250",
        efficiency: "4.3",
        seats: 5,
        defaultBattery: {
          capacity: 90,
          range: 378
        },
        variants: [
          {
            years: [2017],
            capacity: 90,
            range: 378,
            note: "90D 모델"
          }
        ]
      },
      {
        trimId: "model-s-100d",
        trimName: "100D",
        driveType: "AWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/24만km",
        batteryType: "NCA",
        powerMax: "386kW",
        torqueMax: "967Nm",
        acceleration: "4.3",
        topSpeed: "250",
        efficiency: "4.3",
        seats: 5,
        defaultBattery: {
          capacity: 100,
          range: 451
        },
        variants: [
          {
            years: [2018],
            capacity: 100,
            range: 451,
            note: "100D 모델"
          }
        ]
      },
      {
        trimId: "model-s-p100d",
        trimName: "P100D",
        driveType: "AWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/24만km",
        batteryType: "NCA",
        powerMax: "580kW",
        torqueMax: "967Nm",
        acceleration: "2.7",
        topSpeed: "250",
        efficiency: "4.2",
        seats: 5,
        defaultBattery: {
          capacity: 100,
          range: 424
        },
        variants: [
          {
            years: [2018],
            capacity: 100,
            range: 424,
            note: "P100D 고성능 모델"
          }
        ]
      },
      {
        trimId: "model-s-long-range",
        trimName: "Long Range",
        driveType: "AWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/24만km",
        batteryType: "NCA",
        powerMax: "499kW",
        torqueMax: "647Nm",
        acceleration: "3.2",
        topSpeed: "250",
        efficiency: "4.8",
        seats: 5,
        defaultBattery: {
          capacity: 100,
          range: 555
        },
        variants: [
          {
            years: [2019, 2020],
            capacity: 100,
            range: 483,
            note: "초기 Long Range",
            powerMax: "386kW",
            torqueMax: "647Nm",
            acceleration: "3.7"
          },
          {
            years: [2021, 2022],
            capacity: 100,
            range: 555,
            note: "개선된 Long Range"
          },
          {
            years: [2023, 2024],
            capacity: 100,
            range: 555,
            note: "최신 Long Range",
            topSpeed: "240"
          },
          {
            years: [2025],
            capacity: 100,
            range: 555,
            note: "4680 배터리",
            batteryType: "4680",
            torqueMax: "647Nm"
          }
        ]
      },
      {
        trimId: "model-s-performance",
        trimName: "Performance",
        driveType: "AWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/24만km",
        batteryType: "NCA",
        powerMax: "580kW",
        torqueMax: "967Nm",
        acceleration: "2.6",
        topSpeed: "250",
        efficiency: "4.0",
        seats: 5,
        defaultBattery: {
          capacity: 100,
          range: 450
        },
        variants: [
          {
            years: [2019, 2020],
            capacity: 100,
            range: 450,
            note: "Performance 모델"
          }
        ]
      },
      {
        trimId: "model-s-plaid",
        trimName: "Plaid",
        driveType: "AWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/24만km",
        batteryType: "NCA",
        powerMax: "761kW",
        torqueMax: "1300Nm",
        acceleration: "2.1",
        topSpeed: "322",
        efficiency: "4.6",
        seats: 5,
        defaultBattery: {
          capacity: 100,
          range: 474
        },
        variants: [
          {
            years: [2021, 2022],
            capacity: 100,
            range: 474,
            note: "Plaid 런칭"
          },
          {
            years: [2023, 2024],
            capacity: 100,
            range: 474,
            note: "Plaid 최신"
          },
          {
            years: [2025],
            capacity: 100,
            range: 474,
            note: "Plaid 4680 배터리",
            batteryType: "4680"
          }
        ]
      }
    ]
  },
  "model-3": {
    name: "Model 3",
    trims: [
      {
        trimId: "model-3-standard-range-plus",
        trimName: "Standard Range Plus",
        driveType: "RWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/16만km",
        batteryType: "LFP",
        powerMax: "179kW",
        torqueMax: "375Nm",
        acceleration: "5.6",
        topSpeed: "225",
        efficiency: "5.8",
        seats: 5,
        defaultBattery: {
          capacity: 50,
          range: 352
        },
        variants: [
          {
            years: [2019],
            capacity: 50,
            range: 352,
            note: "초기 Standard Range Plus"
          }
        ]
      },
      {
        trimId: "model-3-rwd",
        trimName: "RWD",
        driveType: "RWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "8년/16만km",
        batteryType: "LFP",
        powerMax: "211kW",
        torqueMax: "420Nm",
        acceleration: "6.1",
        topSpeed: "225",
        efficiency: "5.8",
        seats: 5,
        defaultBattery: {
          capacity: 60,
          range: 383
        },
        variants: [
          {
            years: [2021, 2022, 2023],
            capacity: 60,
            range: 383,
            note: "RWD 기본형"
          },
          {
            years: [2024],
            capacity: 67.2,
            range: 382,
            note: "Highland RWD",
            variantId: "highland",
            topSpeed: "201",
            efficiency: "5.7"
          }
        ]
      },
      {
        trimId: "model-3-long-range",
        trimName: "Long Range",
        driveType: "AWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/19.2만km",
        batteryType: "NCM",
        powerMax: "272kW",
        torqueMax: "519Nm",
        acceleration: "4.4",
        topSpeed: "233",
        efficiency: "5.1",
        seats: 5,
        defaultBattery: {
          capacity: 75,
          range: 488
        },
        variants: [
          {
            years: [2019],
            capacity: 75,
            range: 446,
            note: "초기 Long Range",
            powerMax: "258kW",
            torqueMax: "519Nm",
            acceleration: "4.6",
            efficiency: "4.7"
          },
          {
            years: [2021, 2022, 2023],
            capacity: 75,
            range: 488,
            note: "개선된 Long Range"
          },
          {
            years: [2024],
            capacity: 89.5,
            range: 488,
            note: "Highland Long Range",
            powerMax: "307kW",
            torqueMax: "480Nm",
            topSpeed: "201",
            efficiency: "4.8",
            variantId: "highland"
          }
        ]
      },
      {
        trimId: "model-3-performance",
        trimName: "Performance",
        driveType: "AWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/19.2만km",
        batteryType: "NCM",
        powerMax: "366kW",
        torqueMax: "639Nm",
        acceleration: "3.3",
        topSpeed: "261",
        efficiency: "4.8",
        seats: 5,
        defaultBattery: {
          capacity: 75,
          range: 480
        },
        variants: [
          {
            years: [2019],
            capacity: 75,
            range: 415,
            note: "초기 Performance",
            powerMax: "335kW",
            torqueMax: "639Nm",
            acceleration: "3.4",
            efficiency: "4.6"
          },
          {
            years: [2021, 2022, 2023],
            capacity: 75,
            range: 480,
            note: "개선된 Performance"
          },
          {
            years: [2024],
            capacity: 89.5,
            range: 430,
            note: "Highland Performance",
            powerMax: "467kW",
            torqueMax: "741Nm",
            acceleration: "3.1",
            topSpeed: "261",
            variantId: "highland"
          }
        ]
      }
    ]
  },
  "model-x": {
    name: "Model X",
    trims: [
      {
        trimId: "model-x-75d",
        trimName: "75D",
        driveType: "AWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/24만km",
        batteryType: "NCA",
        powerMax: "245kW",
        torqueMax: "527Nm",
        acceleration: "5.2",
        topSpeed: "209",
        efficiency: "4.0",
        seats: 5,
        defaultBattery: {
          capacity: 75,
          range: 275
        },
        variants: [
          {
            years: [2018],
            capacity: 75,
            range: 275,
            note: "75D 모델"
          }
        ]
      },
      {
        trimId: "model-x-100d",
        trimName: "100D",
        driveType: "AWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/24만km",
        batteryType: "NCA",
        powerMax: "311kW",
        torqueMax: "658Nm",
        acceleration: "4.9",
        topSpeed: "250",
        efficiency: "3.9",
        seats: 5,
        defaultBattery: {
          capacity: 100,
          range: 386
        },
        variants: [
          {
            years: [2018],
            capacity: 100,
            range: 386,
            note: "100D 모델"
          }
        ]
      },
      {
        trimId: "model-x-long-range",
        trimName: "Long Range",
        driveType: "AWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/24만km",
        batteryType: "NCA",
        powerMax: "391kW",
        torqueMax: "720Nm",
        acceleration: "3.9",
        topSpeed: "240",
        efficiency: "4.1",
        seats: 5,
        defaultBattery: {
          capacity: 95,
          range: 439
        },
        variants: [
          {
            years: [2019, 2020],
            capacity: 95,
            range: 460,
            note: "초기 Long Range",
            acceleration: "4.6",
            topSpeed: "249",
            efficiency: "3.9"
          },
          {
            years: [2021, 2022, 2023],
            capacity: 100,
            range: 439,
            note: "개선된 Long Range",
            powerMax: "499kW"
          },
          {
            years: [2024],
            capacity: 100,
            range: 439,
            note: "4680 배터리",
            batteryType: "4680",
            efficiency: "4.2"
          }
        ]
      },
      {
        trimId: "model-x-performance",
        trimName: "Performance",
        driveType: "AWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/24만km",
        batteryType: "NCA",
        powerMax: "575kW",
        torqueMax: "888Nm",
        acceleration: "2.9",
        topSpeed: "262",
        efficiency: "3.7",
        seats: 5,
        defaultBattery: {
          capacity: 95,
          range: 430
        },
        variants: [
          {
            years: [2019, 2020],
            capacity: 95,
            range: 430,
            note: "Performance 모델"
          }
        ]
      },
      {
        trimId: "model-x-plaid",
        trimName: "Plaid",
        driveType: "AWD",
        batteryManufacturer: "Panasonic",
        batteryWarranty: "8년/24만km",
        batteryType: "NCA",
        powerMax: "761kW",
        torqueMax: "1020Nm",
        acceleration: "2.6",
        topSpeed: "250",
        efficiency: "4.1",
        seats: 5,
        defaultBattery: {
          capacity: 100,
          range: 439
        },
        variants: [
          {
            years: [2021, 2022, 2023],
            capacity: 100,
            range: 439,
            note: "Plaid 모델"
          },
          {
            years: [2024],
            capacity: 100,
            range: 439,
            note: "Plaid 4680 배터리",
            batteryType: "4680"
          }
        ]
      }
    ]
  },
  "model-y": {
    name: "Model Y",
    trims: [
      {
        trimId: "model-y-standard",
        trimName: "Standard",
        driveType: "RWD",
        batteryManufacturer: "CATL",
        batteryWarranty: "8년/16만km",
        batteryType: "LFP",
        powerMax: "150kW",
        torqueMax: "420Nm",
        acceleration: "6.1",
        topSpeed: "217",
        efficiency: "5.1",
        seats: 5,
        defaultBattery: {
          capacity: 50,
          range: 350
        },
        variants: [
          {
            years: [2021, 2022],
            capacity: 50,
            range: 350,
            note: "초기 Standard"
          },
          {
            years: [2023],
            capacity: 57.5,
            range: 350,
            note: "2023 개선",
            powerMax: "220kW",
            acceleration: "6.9"
          },
          {
            years: [2024],
            capacity: 57.5,
            range: 350,
            note: "2024 연식",
            powerMax: "220kW",
            acceleration: "6.9"
          },
          {
            years: [2025],
            capacity: 62.5,
            range: 350,
            note: "2025 Juniper",
            powerMax: "259kW",
            acceleration: "5.9",
            efficiency: "5.7",
            variantId: "juniper"
          }
        ]
      },
      {
        trimId: "model-y-long-range",
        trimName: "Long Range",
        driveType: "AWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/19.2만km",
        batteryType: "NCM",
        powerMax: "258kW",
        torqueMax: "524Nm",
        acceleration: "5.0",
        topSpeed: "217",
        efficiency: "5.4",
        seats: 5,
        defaultBattery: {
          capacity: 75,
          range: 511
        },
        variants: [
          {
            years: [2021, 2022],
            capacity: 75,
            range: 511,
            note: "초기 Long Range"
          },
          {
            years: [2023],
            capacity: 75,
            range: 511,
            note: "2023 연식"
          },
          {
            years: [2024],
            capacity: 79,
            range: 432,
            note: "2024 개선",
            efficiency: "4.9"
          },
          {
            years: [2025],
            capacity: 78.4,
            range: 476,
            note: "2025 Juniper",
            powerMax: "223kW",
            acceleration: "4.8",
            topSpeed: "201",
            efficiency: "5.0",
            variantId: "juniper"
          }
        ]
      },
      {
        trimId: "model-y-performance",
        trimName: "Performance",
        driveType: "AWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/19.2만km",
        batteryType: "NCM",
        powerMax: "340kW",
        torqueMax: "660Nm",
        acceleration: "3.7",
        topSpeed: "241",
        efficiency: "5.2",
        seats: 5,
        defaultBattery: {
          capacity: 75,
          range: 480
        },
        variants: [
          {
            years: [2021, 2022],
            capacity: 75,
            range: 480,
            note: "초기 Performance"
          },
          {
            years: [2023],
            capacity: 75,
            range: 480,
            note: "2023 연식",
            powerMax: "335kW",
            topSpeed: "250"
          },
          {
            years: [2024],
            capacity: 79,
            range: 432,
            note: "2024 개선",
            efficiency: "4.9"
          }
        ]
      }
    ]
  },
  "cybertruck": {
    name: "Cybertruck",
    trims: [
      {
        trimId: "cybertruck-all-wheel-drive",
        trimName: "All-Wheel Drive",
        driveType: "AWD",
        batteryManufacturer: "Tesla",
        batteryWarranty: "8년/24만km",
        batteryType: "4680",
        powerMax: "447kW",
        torqueMax: "1000Nm",
        acceleration: "4.1",
        topSpeed: "180",
        efficiency: "4.4",
        seats: 5,
        defaultBattery: {
          capacity: 123,
          range: 547
        },
        variants: [
          {
            years: [2025],
            capacity: 123,
            range: 547,
            note: "AWD 기본형"
          }
        ]
      },
      {
        trimId: "cybertruck-cyberbeast",
        trimName: "Cyberbeast",
        driveType: "AWD",
        batteryManufacturer: "Tesla",
        batteryWarranty: "8년/24만km",
        batteryType: "4680",
        powerMax: "630kW",
        torqueMax: "1200Nm",
        acceleration: "2.7",
        topSpeed: "209",
        efficiency: "4.0",
        seats: 5,
        defaultBattery: {
          capacity: 123,
          range: 496
        },
        variants: [
          {
            years: [2025],
            capacity: 123,
            range: 496,
            note: "Cyberbeast 고성능"
          }
        ]
      }
    ]
  }
};

async function uploadTeslaVehicles() {
  try {
    console.log('🚗 테슬라 차량 데이터 업로드 시작 (CLAUDE.md 구조)...');
    
    // 기존 테슬라 데이터 삭제
    console.log('🗑️ 기존 테슬라 데이터 삭제 중...');
    const teslaDoc = db.collection('vehicles').doc('tesla');
    const modelsSnapshot = await teslaDoc.collection('models').get();
    
    const batch = db.batch();
    modelsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✅ 기존 모델 데이터 삭제 완료');
    
    // 브랜드 문서 생성
    await teslaDoc.set({
      brandName: '테슬라',
      englishName: 'TESLA',
      logoUrl: 'https://example.com/tesla-logo.png',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ 테슬라 브랜드 문서 생성 완료');
    
    // 각 모델별로 업로드
    for (const [modelId, modelData] of Object.entries(TESLA_MODELS_FINAL)) {
      console.log(`🔄 업로드 중: ${modelData.name} (${modelId})`);
      
      const modelDoc = teslaDoc.collection('models').doc(modelId);
      await modelDoc.set({
        name: modelData.name,
        englishName: modelId.toUpperCase(),
        brandId: 'tesla',
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
    
    console.log('🎉 테슬라 차량 데이터 업로드 완료! (CLAUDE.md 구조)');
    console.log(`📊 총 업로드된 모델: ${Object.keys(TESLA_MODELS_FINAL).length}개`);
    
  } catch (error) {
    console.error('❌ 업로드 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  uploadTeslaVehicles()
    .then(() => {
      console.log('✅ 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실패:', error);
      process.exit(1);
    });
}

module.exports = { uploadTeslaVehicles, TESLA_MODELS_FINAL };