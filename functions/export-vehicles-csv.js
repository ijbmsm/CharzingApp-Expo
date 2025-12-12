/**
 * Firebase Firestore vehicles 컬렉션 CSV 추출 스크립트
 *
 * 실행 방법:
 * cd /Users/sungmin/CharzingApp-Expo/functions
 * node export-vehicles-csv.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase Admin 초기화
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * CSV 이스케이프 처리
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 배열을 CSV 행으로 변환
 */
function arrayToCSVRow(arr) {
  return arr.map(escapeCSV).join(',');
}

/**
 * vehicles 컬렉션 CSV 추출
 */
async function exportVehiclesCSV() {
  console.log('🚗 vehicles 컬렉션 CSV 추출 시작...\n');

  try {
    const outputDir = '/Users/sungmin/Desktop/vehicles';

    // CSV 데이터 배열
    const brandsData = [];
    const modelsData = [];
    const trimsData = [];
    const variantsData = [];
    const flatData = [];

    // CSV 헤더 정의
    const brandsHeader = ['brandId', 'brandName', 'englishName', 'logoUrl'];
    const modelsHeader = ['brandId', 'modelId', 'modelName', 'englishName', 'imageUrl', 'defaultBattery_capacity', 'defaultBattery_supplier', 'defaultBattery_type'];
    const trimsHeader = ['brandId', 'modelId', 'trimId', 'trimName', 'driveType', 'yearRange_start', 'yearRange_end'];
    const variantsHeader = ['brandId', 'modelId', 'trimId', 'years', 'batteryCapacity', 'range', 'supplier', 'motor', 'power', 'torque', 'acceleration', 'chargingSpeed', 'efficiency', 'imageUrl'];
    const flatHeader = ['brandId', 'brandName', 'modelId', 'modelName', 'trimId', 'trimName', 'driveType', 'year', 'batteryCapacity', 'range', 'supplier', 'motor', 'power', 'torque', 'acceleration', 'chargingSpeed', 'efficiency', 'imageUrl'];

    // 헤더 추가
    brandsData.push(brandsHeader);
    modelsData.push(modelsHeader);
    trimsData.push(trimsHeader);
    variantsData.push(variantsHeader);
    flatData.push(flatHeader);

    // 브랜드 데이터 가져오기
    const brandsSnapshot = await db.collection('vehicles').get();
    console.log(`📋 총 ${brandsSnapshot.size}개 브랜드 처리 중...\n`);

    for (const brandDoc of brandsSnapshot.docs) {
      const brandId = brandDoc.id;
      const brandData = brandDoc.data();

      console.log(`📦 처리중: ${brandData.name || brandId}`);

      // 브랜드 CSV 행 추가
      brandsData.push([
        brandId,
        brandData.name || '',
        brandData.englishName || '',
        brandData.logoUrl || ''
      ]);

      // 모델 데이터 가져오기
      const modelsSnapshot = await db
        .collection('vehicles')
        .doc(brandId)
        .collection('models')
        .get();

      console.log(`   └─ ${modelsSnapshot.size}개 모델 발견`);

      for (const modelDoc of modelsSnapshot.docs) {
        const modelId = modelDoc.id;
        const modelData = modelDoc.data();

        // 모델 CSV 행 추가
        modelsData.push([
          brandId,
          modelId,
          modelData.name || '',
          modelData.englishName || '',
          modelData.imageUrl || '',
          modelData.defaultBattery?.capacity || '',
          modelData.defaultBattery?.supplier || '',
          modelData.defaultBattery?.type || ''
        ]);

        // 트림 데이터 처리
        const trims = modelData.trims || [];
        for (const trim of trims) {
          // 트림 CSV 행 추가
          trimsData.push([
            brandId,
            modelId,
            trim.trimId || '',
            trim.name || '',
            trim.driveType || '',
            trim.yearRange?.start || '',
            trim.yearRange?.end || ''
          ]);

          // variants 데이터 처리
          const variants = trim.variants || [];
          for (const variant of variants) {
            const years = Array.isArray(variant.years) ? variant.years.join(';') : '';
            const specs = variant.specifications || {};

            // variants CSV 행 추가
            variantsData.push([
              brandId,
              modelId,
              trim.trimId || '',
              years,
              variant.batteryCapacity || '',
              variant.range || '',
              variant.supplier || '',
              specs.motor || '',
              specs.power || '',
              specs.torque || '',
              specs.acceleration || '',
              specs.chargingSpeed || '',
              specs.efficiency || '',
              variant.imageUrl || ''
            ]);

            // 평탄화된 데이터 (각 연도별로 한 줄씩)
            const yearArray = Array.isArray(variant.years) ? variant.years : [variant.years].filter(Boolean);
            for (const year of yearArray) {
              flatData.push([
                brandId,
                brandData.name || '',
                modelId,
                modelData.name || '',
                trim.trimId || '',
                trim.name || '',
                trim.driveType || '',
                year,
                variant.batteryCapacity || '',
                variant.range || '',
                variant.supplier || '',
                specs.motor || '',
                specs.power || '',
                specs.torque || '',
                specs.acceleration || '',
                specs.chargingSpeed || '',
                specs.efficiency || '',
                variant.imageUrl || ''
              ]);
            }
          }
        }
      }
    }

    // CSV 파일 저장
    console.log('\n📝 CSV 파일 생성 중...\n');

    // 1. 브랜드 CSV
    const brandsCSV = brandsData.map(row => arrayToCSVRow(row)).join('\n');
    fs.writeFileSync(path.join(outputDir, 'brands.csv'), brandsCSV, 'utf8');
    console.log(`   ✓ brands.csv (${brandsData.length - 1}개 브랜드)`);

    // 2. 모델 CSV
    const modelsCSV = modelsData.map(row => arrayToCSVRow(row)).join('\n');
    fs.writeFileSync(path.join(outputDir, 'models.csv'), modelsCSV, 'utf8');
    console.log(`   ✓ models.csv (${modelsData.length - 1}개 모델)`);

    // 3. 트림 CSV
    const trimsCSV = trimsData.map(row => arrayToCSVRow(row)).join('\n');
    fs.writeFileSync(path.join(outputDir, 'trims.csv'), trimsCSV, 'utf8');
    console.log(`   ✓ trims.csv (${trimsData.length - 1}개 트림)`);

    // 4. Variants CSV
    const variantsCSV = variantsData.map(row => arrayToCSVRow(row)).join('\n');
    fs.writeFileSync(path.join(outputDir, 'variants.csv'), variantsCSV, 'utf8');
    console.log(`   ✓ variants.csv (${variantsData.length - 1}개 variant)`);

    // 5. 평탄화된 전체 데이터 CSV
    const flatCSV = flatData.map(row => arrayToCSVRow(row)).join('\n');
    fs.writeFileSync(path.join(outputDir, 'vehicles-all-flat.csv'), flatCSV, 'utf8');
    console.log(`   ✓ vehicles-all-flat.csv (${flatData.length - 1}개 행 - 모든 데이터)`);

    console.log(`\n✅ CSV 추출 완료!`);
    console.log(`📁 저장 경로: ${outputDir}\n`);

    console.log('📊 생성된 파일:');
    console.log('   1. brands.csv - 브랜드 목록');
    console.log('   2. models.csv - 모델 목록');
    console.log('   3. trims.csv - 트림 목록');
    console.log('   4. variants.csv - 연도별 상세 스펙');
    console.log('   5. vehicles-all-flat.csv - 전체 데이터 (평탄화)');

    console.log('\n💡 사용 팁:');
    console.log('   - Excel에서 전체 데이터를 보려면: vehicles-all-flat.csv');
    console.log('   - 관계형 DB처럼 분석하려면: brands.csv + models.csv + trims.csv + variants.csv');

    console.log('\n🎉 모든 작업 완료!');
    process.exit(0);

  } catch (error) {
    console.error('❌ CSV 추출 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
exportVehiclesCSV();
