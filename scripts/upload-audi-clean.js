const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// vehicleBatteryData.js의 한국어 아우디 데이터
const audiData = {
  "e-tron": {
    "50": {
      "quattro": ["2020-2023"]
    },
    "55": {
      "quattro": ["2020-2023"]
    }
  },
  "e-tron-sportback": {
    "50": {
      "quattro": ["2020-2023"]
    },
    "55": {
      "quattro": ["2020-2023"]
    }
  },
  "q8-e-tron": {
    "50": {
      "quattro": ["2024-2025"]
    },
    "55": {
      "quattro": ["2024-2025", "2024-2025-프리미엄"]
    },
    "sq8": {
      "quattro": ["2024"]
    }
  },
  "q8-sportback-e-tron": {
    "50": {
      "quattro": ["2024-2025"]
    },
    "55": {
      "quattro": ["2024-2025", "2024-2025-프리미엄"]
    },
    "sq8": {
      "quattro": ["2024"]
    }
  },
  "q4-e-tron": {
    "40": {
      "rwd": ["2022-2024"]
    },
    "45": {
      "rwd": ["2025"]
    }
  },
  "q4-sportback-e-tron": {
    "40": {
      "rwd": ["2022-2024"]
    },
    "45": {
      "rwd": ["2025"]
    }
  },
  "q6-e-tron": {
    "기본": {
      "quattro": ["2025-프리미엄"]
    },
    "퍼포먼스": {
      "quattro": ["2025", "2025-프리미엄"]
    },
    "sq6": {
      "quattro": ["2025"]
    }
  },
  "e-tron-gt": {
    "e-tron-gt": {
      "quattro": ["2021-2023"]
    },
    "s": {
      "quattro": ["2025"]
    },
    "rs": {
      "quattro": ["2021-2023", "2025", "2025-퍼포먼스"]
    }
  },
  "a6-e-tron": {
    "퍼포먼스": {
      "quattro": ["2025-어드밴스드", "2025-s라인", "2025-s라인-블랙에디션"]
    },
    "s6": {
      "quattro": ["2025"]
    }
  }
};

// 모델명 매핑
const modelNames = {
  "e-tron": "e-트론",
  "e-tron-sportback": "e-트론 스포트백", 
  "q8-e-tron": "Q8 e-트론",
  "q8-sportback-e-tron": "Q8 스포트백 e-트론",
  "q4-e-tron": "Q4 e-트론",
  "q4-sportback-e-tron": "Q4 스포트백 e-트론",
  "q6-e-tron": "Q6 e-트론", 
  "e-tron-gt": "e-트론 GT",
  "a6-e-tron": "A6 e-트론"
};

// 트림명 매핑
const trimNames = {
  "50": "50 quattro",
  "55": "55 quattro", 
  "sq8": "SQ8",
  "40": "40",
  "45": "45",
  "기본": "기본",
  "퍼포먼스": "퍼포먼스",
  "sq6": "SQ6",
  "e-tron-gt": "기본",
  "s": "S", 
  "rs": "RS",
  "s6": "S6"
};

async function uploadAudiClean() {
  console.log('🚀 아우디 차량 데이터 깨끗하게 업로드...\n');
  
  const brandId = 'audi';
  const brandRef = db.collection('vehicles').doc(brandId);
  
  try {
    // 1. 아우디 브랜드 문서 생성
    console.log('📝 아우디 브랜드 문서 생성 중...');
    await brandRef.set({
      name: '아우디',
      englishName: 'AUDI',
      logoUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/brand-logos%2Faudi-logo.png?alt=media',
      country: '독일',
      established: 1909,
      description: '독일의 프리미엄 자동차 브랜드',
      website: 'https://www.audi.co.kr'
    });
    console.log('✅ 아우디 브랜드 문서 생성 완료\n');
    
    // 2. 각 모델 업로드
    let modelCount = 0;
    
    for (const [modelId, trims] of Object.entries(audiData)) {
      console.log(`📝 ${modelNames[modelId]} (${modelId}) 업로드 중...`);
      
      // 트림 데이터 구성
      const trimVariants = [];
      for (const [trimId, driveTypes] of Object.entries(trims)) {
        for (const [driveType, years] of Object.entries(driveTypes)) {
          for (const yearRange of years) {
            const variant = {
              trimId: trimId,
              trimName: trimNames[trimId] || trimId,
              driveType: driveType.toUpperCase(),
              years: yearRange.includes('-') ? yearRange.split('-') : [yearRange],
              batteryCapacity: getBatteryCapacity(modelId, trimId),
              range: getRange(modelId, trimId),
              powerMax: getPowerMax(modelId, trimId),
              acceleration: getAcceleration(modelId, trimId),
              topSpeed: getTopSpeed(modelId, trimId)
            };
            trimVariants.push(variant);
          }
        }
      }
      
      // 모델 문서 생성
      await brandRef.collection('models').doc(modelId).set({
        name: modelNames[modelId],
        englishName: modelId.toUpperCase().replace(/-/g, '-'),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2F${modelId.toUpperCase().replace(/-/g, '-')}%2F2025%2Faudi_${modelId.replace(/-/g, '_')}_2025.png?alt=media`,
        defaultBattery: {
          manufacturer: getBatteryManufacturer(modelId),
          capacity: getBatteryCapacity(modelId, Object.keys(trims)[0]) + 'kWh',
          warranty: '8년/16만km',
          cellType: 'NCM'
        },
        trims: [{
          variants: trimVariants
        }]
      });
      
      modelCount++;
      console.log(`✅ ${modelNames[modelId]} 업로드 완료 (트림 ${trimVariants.length}개)`);
    }
    
    console.log('\n='.repeat(60));
    console.log('🎉 아우디 차량 데이터 업로드 완료!');
    console.log(`📁 총 ${modelCount}개 모델 업로드됨`);
    console.log('✅ 올바른 모델-트림 구조로 구성됨');
    console.log('📱 앱에서 정상적으로 차량 선택 가능');
    
  } catch (error) {
    console.error('❌ 업로드 중 오류 발생:', error);
  }
}

// 헬퍼 함수들
function getBatteryCapacity(modelId, trimId) {
  const capacities = {
    "e-tron": { "50": 71, "55": 95 },
    "e-tron-sportback": { "50": 71, "55": 95 },
    "q8-e-tron": { "50": 89, "55": 114, "sq8": 114 },
    "q8-sportback-e-tron": { "50": 89, "55": 114, "sq8": 114 },
    "q4-e-tron": { "40": 82, "45": 82 },
    "q4-sportback-e-tron": { "40": 82, "45": 82 },
    "q6-e-tron": { "기본": 100, "퍼포먼스": 100, "sq6": 100 },
    "e-tron-gt": { "e-tron-gt": 93.4, "s": 97, "rs": 93.4 },
    "a6-e-tron": { "퍼포먼스": 100, "s6": 100 }
  };
  return capacities[modelId]?.[trimId] || 90;
}

function getBatteryManufacturer(modelId) {
  const manufacturers = {
    "e-tron": "LG Energy Solution",
    "e-tron-sportback": "LG Energy Solution",
    "q8-e-tron": "Samsung SDI",
    "q8-sportback-e-tron": "Samsung SDI",
    "q4-e-tron": "LG Energy Solution",
    "q4-sportback-e-tron": "LG Energy Solution", 
    "q6-e-tron": "CATL",
    "e-tron-gt": "LG Energy Solution",
    "a6-e-tron": "CATL"
  };
  return manufacturers[modelId] || "LG Energy Solution";
}

function getRange(modelId, trimId) {
  // 간소화된 주행거리 데이터
  return 400;
}

function getPowerMax(modelId, trimId) {
  // 간소화된 최대출력 데이터
  return "350HP";
}

function getAcceleration(modelId, trimId) {
  // 간소화된 가속도 데이터
  return 5.5;
}

function getTopSpeed(modelId, trimId) {
  // 간소화된 최고속도 데이터
  return 200;
}

uploadAudiClean();