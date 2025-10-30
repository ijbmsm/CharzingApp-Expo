const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const db = admin.firestore();

const bmwData = {
  name: 'BMW',
  englishName: 'BMW',
  logoUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/brand-logos%2Fbmw-logo.png?alt=media',
  models: {
    'iX': {
      name: 'iX',
      englishName: 'iX',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FBMW%2FiX%2F2022%2Fbmw_ix_2022.jpg?alt=media',
      defaultBattery: {
        capacity: 76.6,
        supplier: 'CATL',
        type: 'NCM',
        voltage: 400,
        range: 425
      },
      trims: [
        {
          trimId: 'ix-xdrive40',
          name: 'iX xDrive40',
          driveType: 'AWD',
          yearRange: { start: 2021, end: 2024 },
          variants: [
            {
              years: ['2021', '2022', '2023', '2024'],
              batteryCapacity: 76.6,
              range: 425,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터',
                power: '326마력',
                torque: '630Nm',
                acceleration: '6.1초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 150kW (DC)',
                efficiency: '18.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'ix-xdrive50',
          name: 'iX xDrive50',
          driveType: 'AWD',
          yearRange: { start: 2021, end: 2024 },
          variants: [
            {
              years: ['2021', '2022', '2023', '2024'],
              batteryCapacity: 111.5,
              range: 630,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터',
                power: '523마력',
                torque: '765Nm',
                acceleration: '4.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 200kW (DC)',
                efficiency: '17.7kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'ix-m60',
          name: 'iX M60',
          driveType: 'AWD',
          yearRange: { start: 2022, end: 2024 },
          variants: [
            {
              years: ['2022', '2023', '2024'],
              batteryCapacity: 111.5,
              range: 566,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터 (M 퍼포먼스)',
                power: '619마력',
                torque: '1100Nm',
                acceleration: '3.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 200kW (DC)',
                efficiency: '19.7kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'ix-xdrive30',
          name: 'iX xDrive30',
          driveType: 'AWD',
          yearRange: { start: 2023, end: 2024 },
          variants: [
            {
              years: ['2023', '2024'],
              batteryCapacity: 76.6,
              range: 439,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터',
                power: '286마력',
                torque: '494Nm',
                acceleration: '7.0초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 150kW (DC)',
                efficiency: '17.5kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'ix-edrive40',
          name: 'iX eDrive40',
          driveType: 'RWD',
          yearRange: { start: 2024, end: 2024 },
          variants: [
            {
              years: ['2024'],
              batteryCapacity: 76.6,
              range: 460,
              supplier: 'CATL',
              specifications: {
                motor: '단일 후륜 모터',
                power: '326마력',
                torque: '494Nm',
                acceleration: '6.2초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 150kW (DC)',
                efficiency: '16.7kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'iX3': {
      name: 'iX3',
      englishName: 'iX3',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FBMW%2FiX3%2F2021%2Fbmw_ix3_2021.jpg?alt=media',
      defaultBattery: {
        capacity: 74.0,
        supplier: 'CATL',
        type: 'NCM',
        voltage: 400,
        range: 440
      },
      trims: [
        {
          trimId: 'ix3-impressive',
          name: 'iX3 Impressive',
          driveType: 'RWD',
          yearRange: { start: 2021, end: 2022 },
          variants: [
            {
              years: ['2021', '2022'],
              batteryCapacity: 74.0,
              range: 440,
              supplier: 'CATL',
              specifications: {
                motor: '단일 후륜 모터',
                power: '286마력',
                torque: '400Nm',
                acceleration: '6.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 150kW (DC)',
                efficiency: '16.8kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'ix3-luxury',
          name: 'iX3 Luxury',
          driveType: 'RWD',
          yearRange: { start: 2021, end: 2022 },
          variants: [
            {
              years: ['2021', '2022'],
              batteryCapacity: 74.0,
              range: 440,
              supplier: 'CATL',
              specifications: {
                motor: '단일 후륜 모터',
                power: '286마력',
                torque: '400Nm',
                acceleration: '6.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 150kW (DC)',
                efficiency: '16.8kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'iX1': {
      name: 'iX1',
      englishName: 'iX1',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FBMW%2FiX1%2F2023%2Fbmw_ix1_2023.jpg?alt=media',
      defaultBattery: {
        capacity: 64.7,
        supplier: 'CATL',
        type: 'LFP',
        voltage: 400,
        range: 415
      },
      trims: [
        {
          trimId: 'ix1-xdrive30',
          name: 'iX1 xDrive30',
          driveType: 'AWD',
          yearRange: { start: 2023, end: 2024 },
          variants: [
            {
              years: ['2023', '2024'],
              batteryCapacity: 64.7,
              range: 415,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터',
                power: '313마력',
                torque: '494Nm',
                acceleration: '5.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 130kW (DC)',
                efficiency: '15.6kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'ix1-edrive20',
          name: 'iX1 eDrive20',
          driveType: 'FWD',
          yearRange: { start: 2023, end: 2024 },
          variants: [
            {
              years: ['2023'],
              batteryCapacity: 64.7,
              range: 440,
              supplier: 'CATL',
              specifications: {
                motor: '단일 전륜 모터',
                power: '204마력',
                torque: '250Nm',
                acceleration: '8.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 130kW (DC)',
                efficiency: '14.7kWh/100km'
              }
            },
            {
              years: ['2024'],
              batteryCapacity: 66.5,
              range: 455,
              supplier: 'CATL',
              specifications: {
                motor: '단일 전륜 모터',
                power: '204마력',
                torque: '250Nm',
                acceleration: '8.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 130kW (DC)',
                efficiency: '14.6kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'iX2': {
      name: 'iX2',
      englishName: 'iX2',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FBMW%2FiX2%2F2024%2Fbmw_ix2_2024.jpg?alt=media',
      defaultBattery: {
        capacity: 64.8,
        supplier: 'CATL',
        type: 'LFP',
        voltage: 400,
        range: 449
      },
      trims: [
        {
          trimId: 'ix2-xdrive30',
          name: 'iX2 xDrive30',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2024 },
          variants: [
            {
              years: ['2024'],
              batteryCapacity: 64.8,
              range: 420,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터',
                power: '313마력',
                torque: '494Nm',
                acceleration: '5.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 130kW (DC)',
                efficiency: '15.4kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'i4': {
      name: 'i4',
      englishName: 'i4',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FBMW%2Fi4%2F2022%2Fbmw_i4_2022.jpg?alt=media',
      defaultBattery: {
        capacity: 83.9,
        supplier: 'CATL',
        type: 'NCM',
        voltage: 400,
        range: 590
      },
      trims: [
        {
          trimId: 'i4-edrive40',
          name: 'i4 eDrive40',
          driveType: 'RWD',
          yearRange: { start: 2021, end: 2024 },
          variants: [
            {
              years: ['2021', '2022', '2023', '2024'],
              batteryCapacity: 83.9,
              range: 590,
              supplier: 'CATL',
              specifications: {
                motor: '단일 후륜 모터',
                power: '340마력',
                torque: '430Nm',
                acceleration: '5.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 205kW (DC)',
                efficiency: '14.2kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'i4-m50',
          name: 'i4 M50',
          driveType: 'AWD',
          yearRange: { start: 2021, end: 2024 },
          variants: [
            {
              years: ['2021', '2022', '2023', '2024'],
              batteryCapacity: 83.9,
              range: 520,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터 (M 퍼포먼스)',
                power: '544마력',
                torque: '795Nm',
                acceleration: '3.9초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 205kW (DC)',
                efficiency: '16.1kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'i4-edrive35',
          name: 'i4 eDrive35',
          driveType: 'RWD',
          yearRange: { start: 2023, end: 2024 },
          variants: [
            {
              years: ['2023', '2024'],
              batteryCapacity: 70.2,
              range: 483,
              supplier: 'CATL',
              specifications: {
                motor: '단일 후륜 모터',
                power: '286마력',
                torque: '365Nm',
                acceleration: '6.0초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 180kW (DC)',
                efficiency: '14.5kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'i4-xdrive40',
          name: 'i4 xDrive40',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2024 },
          variants: [
            {
              years: ['2024'],
              batteryCapacity: 83.9,
              range: 555,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터',
                power: '401마력',
                torque: '586Nm',
                acceleration: '5.2초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 205kW (DC)',
                efficiency: '15.1kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'i5': {
      name: 'i5',
      englishName: 'i5',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FBMW%2Fi5%2F2023%2Fbmw_i5_2023.jpg?alt=media',
      defaultBattery: {
        capacity: 84.3,
        supplier: 'CATL',
        type: 'NCM',
        voltage: 400,
        range: 570
      },
      trims: [
        {
          trimId: 'i5-edrive40',
          name: 'i5 eDrive40',
          driveType: 'RWD',
          yearRange: { start: 2023, end: 2024 },
          variants: [
            {
              years: ['2023', '2024'],
              batteryCapacity: 84.3,
              range: 570,
              supplier: 'CATL',
              specifications: {
                motor: '단일 후륜 모터',
                power: '340마력',
                torque: '430Nm',
                acceleration: '6.1초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 205kW (DC)',
                efficiency: '14.8kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'i5-xdrive40',
          name: 'i5 xDrive40',
          driveType: 'AWD',
          yearRange: { start: 2023, end: 2024 },
          variants: [
            {
              years: ['2023', '2024'],
              batteryCapacity: 84.3,
              range: 535,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터',
                power: '401마력',
                torque: '586Nm',
                acceleration: '5.4초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 205kW (DC)',
                efficiency: '15.8kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'i5-m60',
          name: 'i5 M60',
          driveType: 'AWD',
          yearRange: { start: 2023, end: 2024 },
          variants: [
            {
              years: ['2023', '2024'],
              batteryCapacity: 84.3,
              range: 455,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터 (M 퍼포먼스)',
                power: '601마력',
                torque: '820Nm',
                acceleration: '3.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 205kW (DC)',
                efficiency: '18.5kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'i5-touring-xdrive40',
          name: 'i5 Touring xDrive40',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2024 },
          variants: [
            {
              years: ['2024'],
              batteryCapacity: 84.3,
              range: 520,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터',
                power: '401마력',
                torque: '586Nm',
                acceleration: '5.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 205kW (DC)',
                efficiency: '16.2kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'i5-touring-m60',
          name: 'i5 Touring M60',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2024 },
          variants: [
            {
              years: ['2024'],
              batteryCapacity: 84.3,
              range: 445,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터 (M 퍼포먼스)',
                power: '601마력',
                torque: '820Nm',
                acceleration: '4.0초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 205kW (DC)',
                efficiency: '18.9kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'i7': {
      name: 'i7',
      englishName: 'i7',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FBMW%2Fi7%2F2023%2Fbmw_i7_2023.jpg?alt=media',
      defaultBattery: {
        capacity: 101.7,
        supplier: 'CATL',
        type: 'NCM',
        voltage: 400,
        range: 625
      },
      trims: [
        {
          trimId: 'i7-xdrive60',
          name: 'i7 xDrive60',
          driveType: 'AWD',
          yearRange: { start: 2022, end: 2024 },
          variants: [
            {
              years: ['2022', '2023', '2024'],
              batteryCapacity: 101.7,
              range: 625,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터',
                power: '544마력',
                torque: '745Nm',
                acceleration: '4.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 195kW (DC)',
                efficiency: '16.3kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'i7-m70',
          name: 'i7 M70',
          driveType: 'AWD',
          yearRange: { start: 2023, end: 2024 },
          variants: [
            {
              years: ['2023', '2024'],
              batteryCapacity: 101.7,
              range: 560,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터 (M 퍼포먼스)',
                power: '660마력',
                torque: '1000Nm',
                acceleration: '3.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 195kW (DC)',
                efficiency: '18.2kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'i7-edrive50',
          name: 'i7 eDrive50',
          driveType: 'RWD',
          yearRange: { start: 2024, end: 2024 },
          variants: [
            {
              years: ['2024'],
              batteryCapacity: 101.7,
              range: 675,
              supplier: 'CATL',
              specifications: {
                motor: '단일 후륜 모터',
                power: '455마력',
                torque: '650Nm',
                acceleration: '5.5초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 195kW (DC)',
                efficiency: '15.1kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'i7-protection',
          name: 'i7 Protection',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2024 },
          variants: [
            {
              years: ['2024'],
              batteryCapacity: 101.7,
              range: 520,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터 (방탄 사양)',
                power: '544마력',
                torque: '745Nm',
                acceleration: '6.0초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 195kW (DC)',
                efficiency: '19.6kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'i7-alpina-xb7',
          name: 'i7 ALPINA XB7',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2024 },
          variants: [
            {
              years: ['2024'],
              batteryCapacity: 101.7,
              range: 590,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터 (ALPINA 튜닝)',
                power: '630마력',
                torque: '950Nm',
                acceleration: '4.2초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 195kW (DC)',
                efficiency: '17.2kWh/100km'
              }
            }
          ]
        }
      ]
    }
  }
};

async function uploadBMWData() {
  console.log('BMW 차량 데이터 업로드 시작...');
  
  try {
    const brandRef = db.collection('vehicles').doc('BMW');
    
    // 브랜드 문서 생성/업데이트
    await brandRef.set({
      name: bmwData.name,
      englishName: bmwData.englishName,
      logoUrl: bmwData.logoUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ BMW 브랜드 문서 생성 완료');

    // 모델 업로드
    for (const [modelId, modelData] of Object.entries(bmwData.models)) {
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

    console.log('\n🎉 BMW 차량 데이터 업로드 완료!');
    console.log(`총 ${Object.keys(bmwData.models).length}개 모델 업로드됨`);
    
  } catch (error) {
    console.error('❌ BMW 데이터 업로드 중 오류:', error);
  }
}

// 스크립트 실행
uploadBMWData();