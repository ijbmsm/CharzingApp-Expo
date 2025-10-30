const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addAudiBaseModels() {
  console.log('🔧 아우디 기본 모델들 추가...\n');
  
  const brandId = 'audi';
  const brandRef = db.collection('vehicles').doc(brandId);
  
  try {
    // 1. e-tron (2020-2023)
    console.log('📝 e-tron 모델 추가 중...');
    await brandRef.collection('models').doc('e-tron').set({
      name: 'e-트론',
      englishName: 'E-TRON',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FE-TRON%2F2023%2Faudi_e_tron_2023.png?alt=media',
      defaultBattery: {
        manufacturer: 'LG Energy Solution',
        capacity: '95kWh',
        warranty: '8년/16만km',
        cellType: 'NCM'
      },
      trims: [
        {
          variants: [{
            trimId: '50',
            trimName: '50 quattro',
            driveType: 'AWD',
            years: ['2020', '2021', '2022', '2023'],
            batteryCapacity: 71,
            range: 328,
            powerMax: '313HP',
            acceleration: 6.6,
            topSpeed: 200
          }]
        },
        {
          variants: [{
            trimId: '55',
            trimName: '55 quattro',
            driveType: 'AWD',
            years: ['2020', '2021', '2022', '2023'],
            batteryCapacity: 95,
            range: 415,
            powerMax: '408HP',
            acceleration: 5.7,
            topSpeed: 200
          }]
        }
      ]
    });
    console.log('   ✅ e-tron (50 + 55 quattro 트림)');
    
    // 2. e-tron-sportback (2020-2023)
    console.log('\n📝 e-tron-sportback 모델 추가 중...');
    await brandRef.collection('models').doc('e-tron-sportback').set({
      name: 'e-트론 스포트백',
      englishName: 'E-TRON-SPORTBACK',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FE-TRON-SPORTBACK%2F2023%2Faudi_e_tron_sportback_2023.png?alt=media',
      defaultBattery: {
        manufacturer: 'LG Energy Solution',
        capacity: '95kWh',
        warranty: '8년/16만km',
        cellType: 'NCM'
      },
      trims: [
        {
          variants: [{
            trimId: '50',
            trimName: '50 quattro',
            driveType: 'AWD',
            years: ['2020', '2021', '2022', '2023'],
            batteryCapacity: 71,
            range: 347,
            powerMax: '313HP',
            acceleration: 6.6,
            topSpeed: 200
          }]
        },
        {
          variants: [{
            trimId: '55',
            trimName: '55 quattro',
            driveType: 'AWD',
            years: ['2020', '2021', '2022', '2023'],
            batteryCapacity: 95,
            range: 446,
            powerMax: '408HP',
            acceleration: 5.7,
            topSpeed: 200
          }]
        }
      ]
    });
    console.log('   ✅ e-tron-sportback (50 + 55 quattro 트림)');
    
    // 3. q4-e-tron
    console.log('\n📝 q4-e-tron 모델 추가 중...');
    await brandRef.collection('models').doc('q4-e-tron').set({
      name: 'Q4 e-트론',
      englishName: 'Q4-E-TRON',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FQ4-E-TRON%2F2025%2Faudi_q4_e_tron_2025.png?alt=media',
      defaultBattery: {
        manufacturer: 'LG Energy Solution',
        capacity: '82kWh',
        warranty: '8년/16만km',
        cellType: 'NCM'
      },
      trims: [
        {
          variants: [{
            trimId: '40',
            trimName: '40',
            driveType: 'RWD',
            years: ['2022', '2023', '2024'],
            batteryCapacity: 82,
            range: 519,
            powerMax: '204HP',
            acceleration: 8.5,
            topSpeed: 160
          }]
        },
        {
          variants: [{
            trimId: '45',
            trimName: '45',
            driveType: 'RWD',
            years: ['2025'],
            batteryCapacity: 82,
            range: 406,
            powerMax: '286HP',
            acceleration: 6.2,
            topSpeed: 180
          }]
        }
      ]
    });
    console.log('   ✅ q4-e-tron (40 + 45 트림)');
    
    // 4. q4-sportback-e-tron
    console.log('\n📝 q4-sportback-e-tron 모델 추가 중...');
    await brandRef.collection('models').doc('q4-sportback-e-tron').set({
      name: 'Q4 스포트백 e-트론',
      englishName: 'Q4-SPORTBACK-E-TRON',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FQ4-SPORTBACK-E-TRON%2F2025%2Faudi_q4_sportback_e_tron_2025.png?alt=media',
      defaultBattery: {
        manufacturer: 'LG Energy Solution',
        capacity: '82kWh',
        warranty: '8년/16만km',
        cellType: 'NCM'
      },
      trims: [
        {
          variants: [{
            trimId: '40',
            trimName: '40',
            driveType: 'RWD',
            years: ['2022', '2023', '2024'],
            batteryCapacity: 82,
            range: 534,
            powerMax: '204HP',
            acceleration: 8.5,
            topSpeed: 160
          }]
        },
        {
          variants: [{
            trimId: '45',
            trimName: '45',
            driveType: 'RWD',
            years: ['2025'],
            batteryCapacity: 82,
            range: 418,
            powerMax: '286HP',
            acceleration: 6.2,
            topSpeed: 180
          }]
        }
      ]
    });
    console.log('   ✅ q4-sportback-e-tron (40 + 45 트림)');
    
    // 5. q8-e-tron
    console.log('\n📝 q8-e-tron 모델 추가 중...');
    await brandRef.collection('models').doc('q8-e-tron').set({
      name: 'Q8 e-트론',
      englishName: 'Q8-E-TRON',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FQ8-E-TRON%2F2024%2Faudi_q8_e_tron_2024.png?alt=media',
      defaultBattery: {
        manufacturer: 'Samsung SDI',
        capacity: '114kWh',
        warranty: '8년/16만km',
        cellType: 'NCM'
      },
      trims: [
        {
          variants: [{
            trimId: '50',
            trimName: '50 quattro',
            driveType: 'AWD',
            years: ['2024', '2025'],
            batteryCapacity: 89,
            range: 328,
            powerMax: '340HP',
            acceleration: 6.0,
            topSpeed: 200
          }]
        },
        {
          variants: [{
            trimId: '55',
            trimName: '55 quattro',
            driveType: 'AWD',
            years: ['2024', '2025'],
            batteryCapacity: 114,
            range: 414,
            powerMax: '408HP',
            acceleration: 5.6,
            topSpeed: 200
          }]
        },
        {
          variants: [{
            trimId: 'sq8',
            trimName: 'SQ8',
            driveType: 'AWD',
            years: ['2024', '2025'],
            batteryCapacity: 114,
            range: 385,
            powerMax: '503HP',
            acceleration: 4.5,
            topSpeed: 210
          }]
        }
      ]
    });
    console.log('   ✅ q8-e-tron (50 + 55 quattro + SQ8 트림)');
    
    // 6. q8-sportback-e-tron
    console.log('\n📝 q8-sportback-e-tron 모델 추가 중...');
    await brandRef.collection('models').doc('q8-sportback-e-tron').set({
      name: 'Q8 스포트백 e-트론',
      englishName: 'Q8-SPORTBACK-E-TRON',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FQ8-SPORTBACK-E-TRON%2F2024%2Faudi_q8_sportback_e_tron_2024.png?alt=media',
      defaultBattery: {
        manufacturer: 'Samsung SDI',
        capacity: '114kWh',
        warranty: '8년/16만km',
        cellType: 'NCM'
      },
      trims: [
        {
          variants: [{
            trimId: '50',
            trimName: '50 quattro',
            driveType: 'AWD',
            years: ['2024', '2025'],
            batteryCapacity: 89,
            range: 343,
            powerMax: '340HP',
            acceleration: 6.0,
            topSpeed: 200
          }]
        },
        {
          variants: [{
            trimId: '55',
            trimName: '55 quattro',
            driveType: 'AWD',
            years: ['2024', '2025'],
            batteryCapacity: 114,
            range: 433,
            powerMax: '408HP',
            acceleration: 5.6,
            topSpeed: 200
          }]
        },
        {
          variants: [{
            trimId: 'sq8',
            trimName: 'SQ8',
            driveType: 'AWD',
            years: ['2024', '2025'],
            batteryCapacity: 114,
            range: 401,
            powerMax: '503HP',
            acceleration: 4.5,
            topSpeed: 210
          }]
        }
      ]
    });
    console.log('   ✅ q8-sportback-e-tron (50 + 55 quattro + SQ8 트림)');
    
    console.log('\n='.repeat(60));
    console.log('✅ 아우디 기본 모델들 추가 완료!');
    console.log('📁 총 추가된 모델: 6개');
    console.log('   • e-tron');
    console.log('   • e-tron-sportback');
    console.log('   • q4-e-tron');
    console.log('   • q4-sportback-e-tron');
    console.log('   • q8-e-tron');
    console.log('   • q8-sportback-e-tron');
    
  } catch (error) {
    console.error('❌ 추가 중 오류 발생:', error);
  }
}

addAudiBaseModels();