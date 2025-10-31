const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const db = admin.firestore();

async function scanModel(brandId, modelId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 Firestore 구조 스캔: vehicles/${brandId}/models/${modelId}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const modelRef = db.collection('vehicles').doc(brandId).collection('models').doc(modelId);
    const modelDoc = await modelRef.get();

    if (!modelDoc.exists) {
      console.log(`❌ 문서를 찾을 수 없습니다: vehicles/${brandId}/models/${modelId}`);
      return;
    }

    const data = modelDoc.data();

    console.log('📄 문서 기본 정보:');
    console.log(`  - name: ${data.name}`);
    console.log(`  - englishName: ${data.englishName}`);
    console.log(`  - imageUrl: ${data.imageUrl ? '✅ 있음' : '❌ 없음'}`);
    console.log(`  - createdAt: ${data.createdAt?.toDate?.() || data.createdAt}`);
    console.log(`  - updatedAt: ${data.updatedAt?.toDate?.() || data.updatedAt}`);

    console.log('\n🔋 defaultBattery:');
    console.log(JSON.stringify(data.defaultBattery, null, 2));

    console.log('\n🚗 trims 배열 구조:');
    console.log(`  - trims.length: ${data.trims?.length || 0}`);

    if (data.trims && Array.isArray(data.trims)) {
      data.trims.forEach((trim, trimIndex) => {
        console.log(`\n  [${trimIndex}] Trim 구조:`);
        console.log(`    - Keys: ${Object.keys(trim).join(', ')}`);

        // Hyundai/KIA 스타일인지 확인
        if (trim.trimId && trim.name && trim.driveType && trim.yearRange && trim.variants) {
          console.log(`    - 스타일: Hyundai/KIA`);
          console.log(`    - trimId: ${trim.trimId}`);
          console.log(`    - name: ${trim.name}`);
          console.log(`    - driveType: ${trim.driveType}`);
          console.log(`    - yearRange: ${JSON.stringify(trim.yearRange)}`);
          console.log(`    - variants 개수: ${trim.variants?.length || 0}`);

          if (trim.variants && Array.isArray(trim.variants)) {
            trim.variants.forEach((variant, variantIndex) => {
              console.log(`\n      [${trimIndex}.${variantIndex}] Variant:`);
              console.log(`        - Keys: ${Object.keys(variant).join(', ')}`);
              console.log(`        - years: ${JSON.stringify(variant.years)}`);
              console.log(`        - batteryCapacity: ${variant.batteryCapacity}`);
              console.log(`        - range: ${variant.range}`);
              console.log(`        - supplier: ${variant.supplier || '없음'}`);

              if (variant.specifications) {
                console.log(`        - specifications:`);
                console.log(`          ${JSON.stringify(variant.specifications, null, 10)}`);
              }
            });
          }
        }
        // Audi/BMW/Mercedes 스타일인지 확인
        else if (trim.variants && Array.isArray(trim.variants) && !trim.trimId) {
          console.log(`    - 스타일: Audi/BMW/Mercedes`);
          console.log(`    - variants 개수: ${trim.variants.length}`);

          trim.variants.forEach((variant, variantIndex) => {
            console.log(`\n      [${trimIndex}.${variantIndex}] Variant:`);
            console.log(`        - Keys: ${Object.keys(variant).join(', ')}`);
            console.log(`        - trimId: ${variant.trimId}`);
            console.log(`        - trimName: ${variant.trimName}`);
            console.log(`        - years: ${JSON.stringify(variant.years)}`);
            console.log(`        - batteryCapacity: ${variant.batteryCapacity}`);
            console.log(`        - range: ${variant.range}`);
            console.log(`        - driveType: ${variant.driveType || '없음'}`);
            console.log(`        - powerMax: ${variant.powerMax || '없음'}`);
            console.log(`        - topSpeed: ${variant.topSpeed || '없음'}`);
            console.log(`        - acceleration: ${variant.acceleration || '없음'}`);
          });
        } else {
          console.log(`    - 스타일: 알 수 없음`);
          console.log(`    - 전체 데이터:\n${JSON.stringify(trim, null, 6)}`);
        }
      });
    }

    console.log(`\n${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('❌ 스캔 중 오류 발생:', error);
  }
}

// 실행
const brandId = process.argv[2] || 'KIA';
const modelId = process.argv[3] || 'niro-ev';

scanModel(brandId, modelId)
  .then(() => {
    console.log('✅ 스캔 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
