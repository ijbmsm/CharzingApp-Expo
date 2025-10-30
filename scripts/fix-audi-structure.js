const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixAudiStructure() {
  console.log('🔧 아우디 모델-트림 구조 수정 시작...\n');
  
  const brandId = 'audi';
  const brandRef = db.collection('vehicles').doc(brandId);
  
  try {
    // 1. 삭제할 잘못된 모델들
    const modelsToDelete = [
      'rs-e-tron-gt',    // e-tron-gt의 RS 트림
      's-e-tron-gt',     // e-tron-gt의 S 트림  
      's6-e-tron',       // a6-e-tron의 S6 트림
      'sq6-e-tron'       // q6-e-tron의 SQ6 트림
    ];
    
    console.log('🗑️ 잘못 분리된 모델들 삭제 중...');
    for (const modelId of modelsToDelete) {
      await brandRef.collection('models').doc(modelId).delete();
      console.log(`   ❌ ${modelId} 삭제`);
    }
    
    // 2. e-tron-gt 모델 업데이트 (S, RS 트림 추가)
    console.log('\n📝 e-tron-gt 모델 업데이트 중...');
    await brandRef.collection('models').doc('e-tron-gt').set({
      name: 'e-트론 GT',
      englishName: 'E-TRON-GT',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FE-TRON-GT%2F2025%2Faudi_e_tron_gt_2025.png?alt=media',
      defaultBattery: {
        manufacturer: 'LG Energy Solution',
        capacity: '93.4kWh',
        warranty: '8년/16만km',
        cellType: 'NCM'
      },
      trims: [
        {
          variants: [{
            trimId: 'base',
            trimName: '기본',
            driveType: 'AWD',
            years: ['2021', '2022', '2023'],
            batteryCapacity: 93.4,
            range: 362,
            powerMax: '476HP',
            acceleration: 4.1,
            topSpeed: 245
          }]
        },
        {
          variants: [{
            trimId: 's',
            trimName: 'S',
            driveType: 'AWD', 
            years: ['2025'],
            batteryCapacity: 97.0,
            range: 413,
            powerMax: '590HP',
            acceleration: 3.4,
            topSpeed: 250
          }]
        },
        {
          variants: [{
            trimId: 'rs',
            trimName: 'RS',
            driveType: 'AWD',
            years: ['2021', '2022', '2023', '2025'],
            batteryCapacity: 93.4,
            range: 373,
            powerMax: '646HP',
            acceleration: 3.3,
            topSpeed: 250
          }]
        }
      ]
    });
    console.log('   ✅ e-tron-gt (기본 + S + RS 트림)');
    
    // 3. a6-e-tron 모델 업데이트 (S6 트림 추가)
    console.log('\n📝 a6-e-tron 모델 업데이트 중...');
    await brandRef.collection('models').doc('a6-e-tron').set({
      name: 'A6 e-트론',
      englishName: 'A6-E-TRON',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FA6-E-TRON%2F2025%2Faudi_a6_e_tron_2025.png?alt=media',
      defaultBattery: {
        manufacturer: 'CATL',
        capacity: '100kWh',
        warranty: '8년/16만km',
        cellType: 'NCM'
      },
      trims: [
        {
          variants: [{
            trimId: 'performance',
            trimName: '퍼포먼스',
            driveType: 'AWD',
            years: ['2025'],
            batteryCapacity: 100,
            range: 520,
            powerMax: '381HP',
            acceleration: 5.1,
            topSpeed: 210
          }]
        },
        {
          variants: [{
            trimId: 's6',
            trimName: 'S6',
            driveType: 'AWD',
            years: ['2025'],
            batteryCapacity: 100,
            range: 480,
            powerMax: '544HP',
            acceleration: 3.9,
            topSpeed: 250
          }]
        }
      ]
    });
    console.log('   ✅ a6-e-tron (퍼포먼스 + S6 트림)');
    
    // 4. q6-e-tron 모델 업데이트 (SQ6 트림 추가)
    console.log('\n📝 q6-e-tron 모델 업데이트 중...');
    await brandRef.collection('models').doc('q6-e-tron').set({
      name: 'Q6 e-트론',
      englishName: 'Q6-E-TRON',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FQ6-E-TRON%2F2025%2Faudi_q6_e_tron_2025.png?alt=media',
      defaultBattery: {
        manufacturer: 'CATL',
        capacity: '100kWh',
        warranty: '8년/16만km',
        cellType: 'NCM'
      },
      trims: [
        {
          variants: [{
            trimId: 'base',
            trimName: '기본',
            driveType: 'AWD',
            years: ['2025'],
            batteryCapacity: 100,
            range: 400,
            powerMax: '285HP',
            acceleration: 7.0,
            topSpeed: 210
          }]
        },
        {
          variants: [{
            trimId: 'performance',
            trimName: '퍼포먼스',
            driveType: 'AWD',
            years: ['2025'],
            batteryCapacity: 100,
            range: 365,
            powerMax: '367HP',
            acceleration: 5.9,
            topSpeed: 210
          }]
        },
        {
          variants: [{
            trimId: 'sq6',
            trimName: 'SQ6',
            driveType: 'AWD',
            years: ['2025'],
            batteryCapacity: 100,
            range: 412,
            powerMax: '516HP',
            acceleration: 4.3,
            topSpeed: 230
          }]
        }
      ]
    });
    console.log('   ✅ q6-e-tron (기본 + 퍼포먼스 + SQ6 트림)');
    
    console.log('\n='.repeat(60));
    console.log('✅ 아우디 모델-트림 구조 수정 완료!');
    console.log('🔄 변경 사항:');
    console.log('   • RS e-트론 GT → e-트론 GT의 RS 트림');
    console.log('   • S e-트론 GT → e-트론 GT의 S 트림');
    console.log('   • S6 e-트론 → A6 e-트론의 S6 트림');
    console.log('   • SQ6 e-트론 → Q6 e-트론의 SQ6 트림');
    console.log('\n📱 이제 앱에서 올바른 모델/트림 구조로 표시됩니다.');
    
  } catch (error) {
    console.error('❌ 수정 중 오류 발생:', error);
  }
}

fixAudiStructure();