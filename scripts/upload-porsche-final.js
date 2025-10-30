const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const db = admin.firestore();

const porscheData = {
  name: '포르쉐',
  englishName: 'PORSCHE',
  logoUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/brand-logos%2Fporsche-logo.png?alt=media',
  models: {
    'taycan': {
      name: 'Taycan',
      englishName: 'Taycan',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FPORSCHE%2FTaycan%2F2025%2Fporsche_taycan_2025.jpg?alt=media',
      defaultBattery: {
        capacity: 105,
        supplier: 'LG 에너지솔루션',
        type: 'NCM811',
        voltage: 800,
        range: 425
      },
      trims: [
        {
          trimId: 'taycan-base',
          name: 'Taycan Base',
          driveType: 'RWD',
          yearRange: { start: 2024, end: 2025 },
          variants: [
            {
              years: ['2024'],
              batteryCapacity: 79.2,
              range: 266,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '단일 후륜 모터',
                power: '402마력',
                torque: '352Nm',
                acceleration: '5.4초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '32.0kWh/100km'
              }
            },
            {
              years: ['2025'],
              batteryCapacity: 89,
              range: 458,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '단일 후륜 모터',
                power: '402마력',
                torque: '418Nm',
                acceleration: '4.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '46.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'taycan-4',
          name: 'Taycan 4',
          driveType: 'AWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 89,
              range: 456,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '429마력',
                torque: '622Nm',
                acceleration: '4.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '42.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'taycan-4s',
          name: 'Taycan 4S',
          driveType: 'AWD',
          yearRange: { start: 2021, end: 2025 },
          variants: [
            {
              years: ['2021'],
              batteryCapacity: 93.4,
              range: 251,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '523마력',
                torque: '653Nm',
                acceleration: '4.0초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '30.0kWh/100km'
              }
            },
            {
              years: ['2024'],
              batteryCapacity: 93.4,
              range: 251,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '523마력',
                torque: '653Nm',
                acceleration: '4.0초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '30.0kWh/100km'
              }
            },
            {
              years: ['2025'],
              batteryCapacity: 105,
              range: 477,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '590마력',
                torque: '724Nm',
                acceleration: '3.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '41.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'taycan-gts',
          name: 'Taycan GTS',
          driveType: 'AWD',
          yearRange: { start: 2022, end: 2025 },
          variants: [
            {
              years: ['2022', '2023'],
              batteryCapacity: 93.4,
              range: 485,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '598마력',
                torque: '850Nm',
                acceleration: '3.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '52.0kWh/100km'
              }
            },
            {
              years: ['2025'],
              batteryCapacity: 105,
              range: 602,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '690마력',
                torque: '790Nm',
                acceleration: '3.1초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '52.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'taycan-turbo',
          name: 'Taycan Turbo',
          driveType: 'AWD',
          yearRange: { start: 2021, end: 2025 },
          variants: [
            {
              years: ['2021'],
              batteryCapacity: 93.4,
              range: 309,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '680마력',
                torque: '867Nm',
                acceleration: '3.2초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '29.0kWh/100km'
              }
            },
            {
              years: ['2024'],
              batteryCapacity: 93.4,
              range: 284,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '670마력',
                torque: '867Nm',
                acceleration: '3.2초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '29.0kWh/100km'
              }
            },
            {
              years: ['2025'],
              batteryCapacity: 105,
              range: 430,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '871마력',
                torque: '908Nm',
                acceleration: '2.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '37.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'taycan-turbo-s',
          name: 'Taycan Turbo S',
          driveType: 'AWD',
          yearRange: { start: 2021, end: 2025 },
          variants: [
            {
              years: ['2021'],
              batteryCapacity: 93.4,
              range: 284,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '761마력',
                torque: '1071Nm',
                acceleration: '2.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '28.0kWh/100km'
              }
            },
            {
              years: ['2024'],
              batteryCapacity: 93.4,
              range: 289,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '750마력',
                torque: '1071Nm',
                acceleration: '2.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '28.0kWh/100km'
              }
            },
            {
              years: ['2025'],
              batteryCapacity: 105,
              range: 425,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '938마력',
                torque: '1132Nm',
                acceleration: '2.4초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '37.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'taycan-turbo-gt',
          name: 'Taycan Turbo GT',
          driveType: 'AWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 105,
              range: 423,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터 (GT)',
                power: '1018마력',
                torque: '1265Nm',
                acceleration: '2.3초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '37.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'taycan-turbo-gt-weissach',
          name: 'Taycan Turbo GT with Weissach Package',
          driveType: 'AWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 105,
              range: 423,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터 (GT Weissach)',
                power: '1018마력',
                torque: '1265Nm',
                acceleration: '2.3초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '37.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'taycan-cross-turismo': {
      name: 'Taycan Cross Turismo',
      englishName: 'Taycan Cross Turismo',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FPORSCHE%2FTaycan-Cross-Turismo%2F2025%2Fporsche_taycan_cross_turismo_2025.jpg?alt=media',
      defaultBattery: {
        capacity: 105,
        supplier: 'LG 에너지솔루션',
        type: 'NCM811',
        voltage: 800,
        range: 451
      },
      trims: [
        {
          trimId: 'taycan-cross-turismo-4',
          name: 'Taycan Cross Turismo 4',
          driveType: 'AWD',
          yearRange: { start: 2021, end: 2025 },
          variants: [
            {
              years: ['2021', '2022', '2023', '2024'],
              batteryCapacity: 93.4,
              range: 289,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '476마력',
                torque: '500Nm',
                acceleration: '4.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '29.0kWh/100km'
              }
            },
            {
              years: ['2025'],
              batteryCapacity: 105,
              range: 406,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '435마력',
                torque: '622Nm',
                acceleration: '4.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '38.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'taycan-cross-turismo-4s',
          name: 'Taycan Cross Turismo 4S',
          driveType: 'AWD',
          yearRange: { start: 2021, end: 2025 },
          variants: [
            {
              years: ['2021', '2022', '2023', '2024'],
              batteryCapacity: 93.4,
              range: 287,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '571마력',
                torque: '650Nm',
                acceleration: '3.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '29.0kWh/100km'
              }
            },
            {
              years: ['2025'],
              batteryCapacity: 105,
              range: 451,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '598마력',
                torque: '724Nm',
                acceleration: '3.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '43.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'taycan-cross-turismo-turbo',
          name: 'Taycan Cross Turismo Turbo',
          driveType: 'AWD',
          yearRange: { start: 2021, end: 2025 },
          variants: [
            {
              years: ['2021', '2022', '2023', '2024'],
              batteryCapacity: 93.4,
              range: 274,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '680마력',
                torque: '850Nm',
                acceleration: '3.1초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '28.0kWh/100km'
              }
            },
            {
              years: ['2025'],
              batteryCapacity: 105,
              range: 406,
              supplier: 'LG 에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '884마력',
                torque: '908Nm',
                acceleration: '2.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '39.0kWh/100km'
              }
            }
          ]
        }
      ]
    }
  }
};

async function uploadPorscheData() {
  console.log('포르쉐 차량 데이터 업로드 시작...');
  
  try {
    const brandRef = db.collection('vehicles').doc('PORSCHE');
    
    // 브랜드 문서 생성/업데이트
    await brandRef.set({
      name: porscheData.name,
      englishName: porscheData.englishName,
      logoUrl: porscheData.logoUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ 포르쉐 브랜드 문서 생성 완료');

    // 모델 업로드
    for (const [modelId, modelData] of Object.entries(porscheData.models)) {
      console.log(`\n📝 ${modelData.name} 모델 업로드 중...`);
      
      const modelRef = brandRef.collection('models').doc(modelId);
      
      await modelRef.set({
        name: modelData.name,
        englishName: modelData.englishName,
        imageUrl: modelData.imageUrl,
        defaultBattery: modelData.defaultBattery,
        trims: modelData.trims,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ ${modelData.name} 업로드 완료 (트림 ${modelData.trims.length}개)`);
    }

    console.log('\n🎉 포르쉐 차량 데이터 업로드 완료!');
    console.log(`총 ${Object.keys(porscheData.models).length}개 모델 업로드됨`);
    
  } catch (error) {
    console.error('❌ 포르쉐 데이터 업로드 중 오류:', error);
  }
}

// 스크립트 실행
uploadPorscheData();