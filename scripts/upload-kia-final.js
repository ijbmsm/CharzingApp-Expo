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

// 기아 차량 데이터 (CLAUDE.md 구조)
const KIA_MODELS_FINAL = {
  "ev6": {
    name: "EV6",
    trims: [
      {
        trimId: "ev6-standard-2wd",
        trimName: "Standard 2WD",
        driveType: "RWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "125kW",
        torqueMax: "350Nm",
        acceleration: "8.5",
        topSpeed: "185",
        efficiency: "5.2",
        seats: 5,
        chargingDC: "233",
        defaultBattery: {
          capacity: 58,
          range: 370
        },
        variants: [
          {
            years: [2021, 2022],
            capacity: 58,
            range: 370,
            note: "초기 모델",
            variantId: "initial"
          },
          {
            years: [2023],
            capacity: 58,
            range: 370,
            note: "2023 연식"
          },
          {
            years: [2024],
            capacity: 63,
            range: 390,
            note: "2024 배터리 용량 증가",
            variantId: "capacity-upgrade"
          },
          {
            years: [2025],
            capacity: 63,
            range: 382,
            note: "2025 연식"
          }
        ]
      },
      {
        trimId: "ev6-standard-awd",
        trimName: "Standard AWD",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "173kW",
        torqueMax: "605Nm",
        acceleration: "6.2",
        topSpeed: "185",
        efficiency: "4.8",
        seats: 5,
        chargingDC: "233",
        defaultBattery: {
          capacity: 58,
          range: 351
        },
        variants: [
          {
            years: [2021, 2022],
            capacity: 58,
            range: 351,
            note: "초기 모델"
          },
          {
            years: [2023],
            capacity: 58,
            range: 351,
            note: "2023 연식"
          },
          {
            years: [2024],
            capacity: 63,
            range: 368,
            note: "2024 배터리 용량 증가",
            variantId: "capacity-upgrade"
          }
        ]
      },
      {
        trimId: "ev6-long-range-2wd",
        trimName: "Long Range 2WD",
        driveType: "RWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "10년/20만km",
        batteryType: "NCM",
        powerMax: "168kW",
        torqueMax: "350Nm",
        acceleration: "7.3",
        topSpeed: "185",
        efficiency: "5.3",
        seats: 5,
        chargingDC: "233",
        defaultBattery: {
          capacity: 77.4,
          range: 475
        },
        variants: [
          {
            years: [2021, 2022],
            capacity: 77.4,
            range: 475,
            note: "초기 모델"
          },
          {
            years: [2023],
            capacity: 77.4,
            range: 475,
            note: "2023 연식"
          },
          {
            years: [2024],
            capacity: 77.4,
            range: 481,
            note: "2024 효율 개선"
          },
          {
            years: [2025],
            capacity: 84,
            range: 494,
            note: "2025 대용량 배터리",
            variantId: "large-battery"
          }
        ]
      },
      {
        trimId: "ev6-long-range-awd",
        trimName: "Long Range AWD",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "10년/20만km",
        batteryType: "NCM",
        powerMax: "239kW",
        torqueMax: "605Nm",
        acceleration: "5.2",
        topSpeed: "185",
        efficiency: "4.7",
        seats: 5,
        chargingDC: "233",
        defaultBattery: {
          capacity: 77.4,
          range: 424
        },
        variants: [
          {
            years: [2021, 2022],
            capacity: 77.4,
            range: 424,
            note: "초기 모델"
          },
          {
            years: [2023],
            capacity: 77.4,
            range: 424,
            note: "2023 연식"
          },
          {
            years: [2024],
            capacity: 77.4,
            range: 430,
            note: "2024 효율 개선"
          },
          {
            years: [2025],
            capacity: 84,
            range: 461,
            note: "2025 대용량 배터리",
            variantId: "large-battery"
          }
        ]
      },
      {
        trimId: "ev6-gt",
        trimName: "GT",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "10년/20만km",
        batteryType: "NCM",
        powerMax: "430kW",
        torqueMax: "740Nm",
        acceleration: "3.5",
        topSpeed: "260",
        efficiency: "4.1",
        seats: 5,
        chargingDC: "233",
        defaultBattery: {
          capacity: 77.4,
          range: 365
        },
        variants: [
          {
            years: [2022],
            capacity: 77.4,
            range: 365,
            note: "GT 런칭"
          },
          {
            years: [2023],
            capacity: 77.4,
            range: 365,
            note: "2023 연식"
          },
          {
            years: [2024],
            capacity: 84,
            range: 355,
            note: "2024 고성능 배터리",
            powerMax: "478kW",
            torqueMax: "770Nm",
            variantId: "performance-upgrade"
          }
        ]
      }
    ]
  },
  "ev9": {
    name: "EV9",
    trims: [
      {
        trimId: "ev9-standard-2wd",
        trimName: "Standard 2WD",
        driveType: "RWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "10년/20만km",
        batteryType: "NCM",
        powerMax: "160kW",
        torqueMax: "350Nm",
        acceleration: "8.2",
        topSpeed: "180",
        efficiency: "4.4",
        seats: 6,
        chargingDC: "210",
        defaultBattery: {
          capacity: 76.1,
          range: 381
        },
        variants: [
          {
            years: [2023],
            capacity: 76.1,
            range: 381,
            note: "EV9 런칭",
            seats: 6
          },
          {
            years: [2024],
            capacity: 76.1,
            range: 374,
            note: "2024 연식",
            seats: 7
          }
        ]
      },
      {
        trimId: "ev9-long-range-2wd",
        trimName: "Long Range 2WD",
        driveType: "RWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "10년/20만km",
        batteryType: "NCM",
        powerMax: "150kW",
        torqueMax: "350Nm",
        acceleration: "9.4",
        topSpeed: "180",
        efficiency: "4.6",
        seats: 7,
        chargingDC: "210",
        defaultBattery: {
          capacity: 99.8,
          range: 501
        },
        variants: [
          {
            years: [2023],
            capacity: 99.8,
            range: 501,
            note: "대용량 배터리"
          },
          {
            years: [2024],
            capacity: 99.8,
            range: 501,
            note: "2024 연식",
            efficiency: "4.2"
          }
        ]
      },
      {
        trimId: "ev9-long-range-awd",
        trimName: "Long Range AWD",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "10년/20만km",
        batteryType: "NCM",
        powerMax: "283kW",
        torqueMax: "700Nm",
        acceleration: "5.3",
        topSpeed: "180",
        efficiency: "4.1",
        seats: 7,
        chargingDC: "210",
        defaultBattery: {
          capacity: 99.8,
          range: 445
        },
        variants: [
          {
            years: [2023],
            capacity: 99.8,
            range: 445,
            note: "AWD 고성능"
          },
          {
            years: [2024],
            capacity: 99.8,
            range: 445,
            note: "2024 연식",
            efficiency: "3.8"
          }
        ]
      },
      {
        trimId: "ev9-gt-line-awd",
        trimName: "GT-line AWD",
        driveType: "AWD",
        batteryManufacturer: "SK온",
        batteryWarranty: "10년/20만km",
        batteryType: "NCM",
        powerMax: "283kW",
        torqueMax: "700Nm",
        acceleration: "5.3",
        topSpeed: "180",
        efficiency: "3.8",
        seats: 7,
        chargingDC: "210",
        defaultBattery: {
          capacity: 99.8,
          range: 443
        },
        variants: [
          {
            years: [2024],
            capacity: 99.8,
            range: 443,
            note: "GT-line 런칭"
          }
        ]
      }
    ]
  },
  "ev3": {
    name: "EV3",
    trims: [
      {
        trimId: "ev3-standard",
        trimName: "Standard",
        driveType: "FWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "150kW",
        torqueMax: "283Nm",
        acceleration: "7.5",
        topSpeed: "170",
        efficiency: "5.4",
        seats: 5,
        chargingDC: "128",
        defaultBattery: {
          capacity: 58.3,
          range: 350
        },
        variants: [
          {
            years: [2024],
            capacity: 58.3,
            range: 350,
            note: "EV3 런칭"
          }
        ]
      },
      {
        trimId: "ev3-long-range",
        trimName: "Long Range",
        driveType: "FWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "10년/20만km",
        batteryType: "NCM",
        powerMax: "150kW",
        torqueMax: "283Nm",
        acceleration: "7.7",
        topSpeed: "170",
        efficiency: "5.7",
        seats: 5,
        chargingDC: "128",
        defaultBattery: {
          capacity: 81.4,
          range: 501
        },
        variants: [
          {
            years: [2024],
            capacity: 81.4,
            range: 501,
            note: "대용량 배터리"
          }
        ]
      }
    ]
  },
  "ev4": {
    name: "EV4",
    trims: [
      {
        trimId: "ev4-standard",
        trimName: "Standard",
        driveType: "FWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "150kW",
        torqueMax: "283Nm",
        acceleration: "7.4",
        topSpeed: "170",
        efficiency: "5.8",
        seats: 5,
        chargingDC: "150",
        defaultBattery: {
          capacity: 58.3,
          range: 382
        },
        variants: [
          {
            years: [2024],
            capacity: 58.3,
            range: 382,
            note: "EV4 런칭"
          }
        ]
      },
      {
        trimId: "ev4-long-range",
        trimName: "Long Range",
        driveType: "FWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "10년/20만km",
        batteryType: "NCM",
        powerMax: "150kW",
        torqueMax: "283Nm",
        acceleration: "7.7",
        topSpeed: "170",
        efficiency: "5.8",
        seats: 5,
        chargingDC: "150",
        defaultBattery: {
          capacity: 81.4,
          range: 533
        },
        variants: [
          {
            years: [2024],
            capacity: 81.4,
            range: 533,
            note: "대용량 배터리"
          }
        ]
      }
    ]
  },
  "ray-ev": {
    name: "Ray EV",
    trims: [
      {
        trimId: "ray-ev-standard",
        trimName: "Standard",
        driveType: "FWD",
        batteryManufacturer: "LG화학",
        batteryWarranty: "5년/10만km",
        batteryType: "Lithium-ion",
        powerMax: "50kW",
        torqueMax: "167Nm",
        acceleration: "15.9",
        topSpeed: "130",
        efficiency: "5.0",
        seats: 4,
        chargingDC: "50",
        defaultBattery: {
          capacity: 16,
          range: 91
        },
        variants: [
          {
            years: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018],
            capacity: 16,
            range: 91,
            note: "초기 전기차 모델",
            batteryManufacturer: "LG화학"
          },
          {
            years: [2024],
            capacity: 35.2,
            range: 205,
            note: "2024 리론칭",
            batteryManufacturer: "CATL",
            batteryType: "LFP",
            batteryWarranty: "8년/16만km",
            powerMax: "64.3kW",
            torqueMax: "147Nm",
            acceleration: "12.3",
            topSpeed: "140",
            efficiency: "5.1",
            chargingDC: "150",
            variantId: "relaunch"
          }
        ]
      }
    ]
  },
  "niro-ev": {
    name: "니로 EV",
    trims: [
      {
        trimId: "niro-ev-standard",
        trimName: "Standard",
        driveType: "FWD",
        batteryManufacturer: "LG에너지솔루션",
        batteryWarranty: "8년/16만km",
        batteryType: "NCM",
        powerMax: "150kW",
        torqueMax: "395Nm",
        acceleration: "7.8",
        topSpeed: "167",
        efficiency: "5.4",
        seats: 5,
        chargingDC: "77",
        defaultBattery: {
          capacity: 64,
          range: 385
        },
        variants: [
          {
            years: [2018, 2019, 2020, 2021],
            capacity: 64,
            range: 385,
            note: "초기 모델"
          },
          {
            years: [2022],
            capacity: 64,
            range: 385,
            note: "2022 연식"
          },
          {
            years: [2023],
            capacity: 64.8,
            range: 401,
            note: "2023 개선 모델",
            batteryManufacturer: "CATL",
            torqueMax: "255Nm",
            efficiency: "5.6"
          },
          {
            years: [2024],
            capacity: 64.8,
            range: 401,
            note: "2024 연식",
            batteryManufacturer: "CATL",
            torqueMax: "255Nm",
            efficiency: "5.6"
          }
        ]
      }
    ]
  }
};

async function uploadKiaVehicles() {
  try {
    console.log('🚗 기아 차량 데이터 업로드 시작 (CLAUDE.md 구조)...');
    
    // 기존 기아 데이터 삭제
    console.log('🗑️ 기존 기아 데이터 삭제 중...');
    const kiaDoc = db.collection('vehicles').doc('kia');
    const modelsSnapshot = await kiaDoc.collection('models').get();
    
    const batch = db.batch();
    modelsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✅ 기존 모델 데이터 삭제 완료');
    
    // 브랜드 문서 생성
    await kiaDoc.set({
      brandName: '기아',
      englishName: 'KIA',
      logoUrl: 'https://example.com/kia-logo.png',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ 기아 브랜드 문서 생성 완료');
    
    // 각 모델별로 업로드
    for (const [modelId, modelData] of Object.entries(KIA_MODELS_FINAL)) {
      console.log(`🔄 업로드 중: ${modelData.name} (${modelId})`);
      
      const modelDoc = kiaDoc.collection('models').doc(modelId);
      await modelDoc.set({
        name: modelData.name,
        englishName: modelId.toUpperCase(),
        brandId: 'kia',
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
    
    console.log('🎉 기아 차량 데이터 업로드 완료! (CLAUDE.md 구조)');
    console.log(`📊 총 업로드된 모델: ${Object.keys(KIA_MODELS_FINAL).length}개`);
    
  } catch (error) {
    console.error('❌ 업로드 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  uploadKiaVehicles()
    .then(() => {
      console.log('✅ 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실패:', error);
      process.exit(1);
    });
}

module.exports = { uploadKiaVehicles, KIA_MODELS_FINAL };