#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin 초기화
const serviceAccount = require('./serviceAccountKey.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// 현대 차량 데이터 (vehicleBatteryData.js에서 추출)
const HYUNDAI_MODELS = {
  "ioniq-5": {
    name: "아이오닉 5",
    trims: [
      {
        trimId: "ioniq-5-standard-2wd",
        trimName: "Standard 2WD",
        driveType: "RWD",
        years: ["2021", "2022", "2023", "2024"],
        batteryCapacity: 58,
        batterySizes: [
          { years: ["2021", "2022", "2023"], capacity: 58, range: 336 },
          { years: ["2024"], capacity: 58, range: 342 },
          { years: ["2024-refresh"], capacity: 63, range: 368 }
        ],
        specs: {
          powerMax: "125kW",
          torqueMax: "350Nm",
          acceleration: "8.5",
          topSpeed: "185",
          efficiency: "5.1",
          seats: 5
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
      },
      {
        trimId: "ioniq-5-standard-awd",
        trimName: "Standard AWD",
        driveType: "AWD",
        years: ["2021", "2022", "2023"],
        batteryCapacity: 58,
        batterySizes: [
          { years: ["2021", "2022", "2023"], capacity: 58, range: 316 }
        ],
        specs: {
          powerMax: "173kW",
          torqueMax: "605Nm",
          acceleration: "5.2",
          topSpeed: "185",
          efficiency: "5.4",
          seats: 5
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
      },
      {
        trimId: "ioniq-5-long-range-2wd",
        trimName: "Long Range 2WD",
        driveType: "RWD",
        years: ["2021", "2022", "2023", "2024"],
        batteryCapacity: 77,
        batterySizes: [
          { years: ["2021", "2022", "2023"], capacity: 77, range: 429 },
          { years: ["2024"], capacity: 77, range: 438 },
          { years: ["2024-refresh"], capacity: 84, range: 481 }
        ],
        specs: {
          powerMax: "160kW",
          torqueMax: "350Nm",
          acceleration: "7.4",
          topSpeed: "185",
          efficiency: "5.1",
          seats: 5
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
      },
      {
        trimId: "ioniq-5-long-range-awd",
        trimName: "Long Range AWD",
        driveType: "AWD",
        years: ["2021", "2022", "2023", "2024"],
        batteryCapacity: 77,
        batterySizes: [
          { years: ["2021", "2022", "2023"], capacity: 77, range: 400 },
          { years: ["2024-refresh"], capacity: 84, range: 455 }
        ],
        specs: {
          powerMax: "225kW",
          torqueMax: "605Nm",
          acceleration: "5.2",
          topSpeed: "185",
          efficiency: "5.4",
          seats: 5
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
      },
      {
        trimId: "ioniq-5-n-performance",
        trimName: "N Performance",
        driveType: "AWD",
        years: ["2023", "2024"],
        batteryCapacity: 84,
        batterySizes: [
          { years: ["2023", "2024"], capacity: 84, range: 448 }
        ],
        specs: {
          powerMax: "478kW",
          torqueMax: "740Nm",
          acceleration: "3.4",
          topSpeed: "260",
          efficiency: "6.1",
          seats: 5
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
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
        batterySizes: [
          { years: ["2022", "2023", "2024"], capacity: 53, range: 305 }
        ],
        specs: {
          powerMax: "111.25kW",
          torqueMax: "350Nm",
          acceleration: "8.8",
          topSpeed: "185",
          efficiency: "5.1",
          seats: 5
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
      },
      {
        trimId: "ioniq-6-long-range-2wd",
        trimName: "Long Range 2WD",
        driveType: "RWD",
        years: ["2022", "2023", "2024"],
        batteryCapacity: 77,
        batterySizes: [
          { years: ["2022", "2023", "2024"], capacity: 77, range: 524 }
        ],
        specs: {
          powerMax: "168kW",
          torqueMax: "350Nm",
          acceleration: "7.4",
          topSpeed: "185",
          efficiency: "4.6",
          seats: 5
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
      },
      {
        trimId: "ioniq-6-long-range-awd",
        trimName: "Long Range AWD",
        driveType: "AWD",
        years: ["2022", "2023", "2024"],
        batteryCapacity: 77,
        batterySizes: [
          { years: ["2022", "2023", "2024"], capacity: 77, range: 486 }
        ],
        specs: {
          powerMax: "239kW",
          torqueMax: "605Nm",
          acceleration: "5.1",
          topSpeed: "185",
          efficiency: "5.1",
          seats: 5
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
      },
      {
        trimId: "ioniq-6-n-performance",
        trimName: "N Performance",
        driveType: "AWD",
        years: ["2024"],
        batteryCapacity: 84,
        batterySizes: [
          { years: ["2024"], capacity: 84, range: 450 }
        ],
        specs: {
          powerMax: "430kW",
          torqueMax: "700Nm",
          acceleration: "3.4",
          topSpeed: "250",
          efficiency: "5.8",
          seats: 5
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
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
        batterySizes: [
          { years: ["2018", "2020"], capacity: 39, range: 254 },
          { years: ["2023"], capacity: 48, range: 305 }
        ],
        specs: {
          powerMax: "100kW",
          torqueMax: "395Nm",
          acceleration: "9.9",
          topSpeed: "155",
          efficiency: "5.1",
          seats: 5
        },
        battery: {
          manufacturers: ["LG에너지솔루션"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
      },
      {
        trimId: "kona-electric-long-range",
        trimName: "Long Range",
        driveType: "FWD",
        years: ["2018", "2020", "2021", "2022", "2023"],
        batteryCapacity: 64,
        batterySizes: [
          { years: ["2018", "2020", "2021", "2022"], capacity: 64, range: 406 },
          { years: ["2023"], capacity: 65, range: 400 }
        ],
        specs: {
          powerMax: "150kW",
          torqueMax: "395Nm",
          acceleration: "7.9",
          topSpeed: "167",
          efficiency: "5.1",
          seats: 5
        },
        battery: {
          manufacturers: ["LG에너지솔루션"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
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
        batterySizes: [
          { years: ["2025"], capacity: 110, range: 620 }
        ],
        specs: {
          powerMax: "160kW",
          torqueMax: "350Nm",
          acceleration: "9.4",
          topSpeed: "185",
          efficiency: "5.2",
          seats: 7
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
      },
      {
        trimId: "ioniq-9-long-range-awd",
        trimName: "항속형 AWD",
        driveType: "AWD",
        years: ["2025"],
        batteryCapacity: 110,
        batterySizes: [
          { years: ["2025"], capacity: 110, range: 590 }
        ],
        specs: {
          powerMax: "225kW",
          torqueMax: "605Nm",
          acceleration: "6.7",
          topSpeed: "185",
          efficiency: "5.5",
          seats: 7
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
      },
      {
        trimId: "ioniq-9-performance",
        trimName: "성능형",
        driveType: "AWD",
        years: ["2025"],
        batteryCapacity: 110,
        batterySizes: [
          { years: ["2025"], capacity: 110, range: 570 }
        ],
        specs: {
          powerMax: "320kW",
          torqueMax: "700Nm",
          acceleration: "5.2",
          topSpeed: "200",
          efficiency: "5.8",
          seats: 7
        },
        battery: {
          manufacturers: ["SK온"],
          warranty: "8년/16만km",
          cellType: "NCM"
        }
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
        batterySizes: [
          { years: ["2024", "2025"], capacity: 49, range: 315 }
        ],
        specs: {
          powerMax: "85kW",
          torqueMax: "255Nm",
          acceleration: "10.6",
          topSpeed: "150",
          efficiency: "6.4",
          seats: 5
        },
        battery: {
          manufacturers: ["LG에너지솔루션"],
          warranty: "8년/16만km",
          cellType: "LFP"
        }
      },
      {
        trimId: "casper-electric-inspiration",
        trimName: "Inspiration",
        driveType: "FWD",
        years: ["2024", "2025"],
        batteryCapacity: 49,
        batterySizes: [
          { years: ["2024", "2025"], capacity: 49, range: 315 }
        ],
        specs: {
          powerMax: "85kW",
          torqueMax: "255Nm",
          acceleration: "10.6",
          topSpeed: "150",
          efficiency: "6.4",
          seats: 5
        },
        battery: {
          manufacturers: ["LG에너지솔루션"],
          warranty: "8년/16만km",
          cellType: "LFP"
        }
      },
      {
        trimId: "casper-electric-cross",
        trimName: "Cross",
        driveType: "FWD",
        years: ["2025"],
        batteryCapacity: 49,
        batterySizes: [
          { years: ["2025"], capacity: 49, range: 300 }
        ],
        specs: {
          powerMax: "85kW",
          torqueMax: "255Nm",
          acceleration: "10.8",
          topSpeed: "150",
          efficiency: "6.6",
          seats: 5
        },
        battery: {
          manufacturers: ["LG에너지솔루션"],
          warranty: "8년/16만km",
          cellType: "LFP"
        }
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
        batteryCapacity: 1.56, // 수소연료전지차는 배터리 용량이 작음
        batterySizes: [
          { years: ["2018"], capacity: 1.56, range: 609 },
          { years: ["2023"], capacity: 1.56, range: 666 },
          { years: ["2024"], capacity: 1.56, range: 686 }
        ],
        specs: {
          powerMax: "95kW",
          torqueMax: "395Nm",
          acceleration: "9.5",
          topSpeed: "179",
          efficiency: "0.95", // 수소 연비 kg/100km
          seats: 5
        },
        battery: {
          manufacturers: ["현대"],
          warranty: "8년/16만km",
          cellType: "수소연료전지"
        }
      }
    ]
  }
};

async function uploadHyundaiVehicles() {
  try {
    console.log('🚗 현대 차량 데이터 업로드 시작...');
    
    // 1. 현대 브랜드 문서 생성
    const brandDoc = db.collection('vehicles').doc('hyundai');
    await brandDoc.set({
      brandName: '현대',
      englishName: 'HYUNDAI',
      logoUrl: 'https://example.com/hyundai-logo.png', // 실제 로고 URL로 교체
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ 현대 브랜드 문서 생성 완료');
    
    // 2. 각 모델별로 업로드
    for (const [modelId, modelData] of Object.entries(HYUNDAI_MODELS)) {
      console.log(`🔄 업로드 중: ${modelData.name} (${modelId})`);
      
      const modelDoc = brandDoc.collection('models').doc(modelId);
      await modelDoc.set({
        name: modelData.name,
        englishName: modelId.toUpperCase(),
        brandId: 'hyundai',
        trims: modelData.trims,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ ${modelData.name} 업로드 완료 (트림 ${modelData.trims.length}개)`);
    }
    
    console.log('🎉 현대 차량 데이터 업로드 완료!');
    console.log(`📊 총 업로드된 모델: ${Object.keys(HYUNDAI_MODELS).length}개`);
    
    // 업로드 결과 검증
    const brandsSnapshot = await db.collection('vehicles').get();
    console.log(`🔍 vehicles 컬렉션 브랜드 수: ${brandsSnapshot.size}`);
    
    const hyundaiModelsSnapshot = await db.collection('vehicles').doc('hyundai').collection('models').get();
    console.log(`🔍 현대 모델 수: ${hyundaiModelsSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ 업로드 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  uploadHyundaiVehicles()
    .then(() => {
      console.log('✅ 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실패:', error);
      process.exit(1);
    });
}

module.exports = { uploadHyundaiVehicles, HYUNDAI_MODELS };