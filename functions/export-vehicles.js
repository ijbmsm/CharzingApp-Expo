/**
 * Firebase Firestore vehicles 컬렉션 전체 데이터 추출 스크립트
 *
 * 실행 방법:
 * cd /Users/sungmin/CharzingApp-Expo/functions
 * node export-vehicles.js
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
 * vehicles 컬렉션 전체 데이터 추출
 */
async function exportVehiclesData() {
  console.log('🚗 vehicles 컬렉션 데이터 추출 시작...\n');

  try {
    const vehiclesData = {};

    // 1. 최상위 vehicles 컬렉션의 모든 브랜드 문서 가져오기
    const brandsSnapshot = await db.collection('vehicles').get();

    console.log(`📋 총 ${brandsSnapshot.size}개 브랜드 발견\n`);

    // 2. 각 브랜드별로 처리
    for (const brandDoc of brandsSnapshot.docs) {
      const brandId = brandDoc.id;
      const brandData = brandDoc.data();

      console.log(`📦 처리중: ${brandData.name || brandId}`);

      // 브랜드 기본 정보 저장
      vehiclesData[brandId] = {
        ...brandData,
        models: {}
      };

      // 3. 해당 브랜드의 models 서브컬렉션 가져오기
      const modelsSnapshot = await db
        .collection('vehicles')
        .doc(brandId)
        .collection('models')
        .get();

      console.log(`   └─ ${modelsSnapshot.size}개 모델 발견`);

      // 4. 각 모델별로 처리
      for (const modelDoc of modelsSnapshot.docs) {
        const modelId = modelDoc.id;
        const modelData = modelDoc.data();

        // 모델 기본 정보 저장
        vehiclesData[brandId].models[modelId] = {
          ...modelData,
          yearTemplates: {}
        };

        // 5. 해당 모델의 yearTemplates 서브컬렉션 가져오기 (있다면)
        try {
          const yearTemplatesSnapshot = await db
            .collection('vehicles')
            .doc(brandId)
            .collection('models')
            .doc(modelId)
            .collection('yearTemplates')
            .get();

          if (!yearTemplatesSnapshot.empty) {
            console.log(`      └─ ${yearTemplatesSnapshot.size}개 연도별 템플릿 발견`);

            for (const yearTemplateDoc of yearTemplatesSnapshot.docs) {
              const yearTemplateId = yearTemplateDoc.id;
              const yearTemplateData = yearTemplateDoc.data();

              vehiclesData[brandId].models[modelId].yearTemplates[yearTemplateId] = yearTemplateData;
            }
          }
        } catch (error) {
          // yearTemplates 서브컬렉션이 없는 경우 무시
        }
      }
    }

    // 6. JSON 파일로 저장
    const outputDir = '/Users/sungmin/Desktop/vehicles';
    const outputPath = path.join(outputDir, 'vehicles-data.json');

    fs.writeFileSync(
      outputPath,
      JSON.stringify(vehiclesData, null, 2),
      'utf8'
    );

    console.log(`\n✅ 데이터 추출 완료!`);
    console.log(`📁 저장 경로: ${outputPath}`);

    // 통계 출력
    const brandCount = Object.keys(vehiclesData).length;
    let modelCount = 0;
    let yearTemplateCount = 0;

    for (const brandId in vehiclesData) {
      const models = vehiclesData[brandId].models;
      modelCount += Object.keys(models).length;

      for (const modelId in models) {
        const yearTemplates = models[modelId].yearTemplates;
        yearTemplateCount += Object.keys(yearTemplates).length;
      }
    }

    console.log(`\n📊 추출된 데이터 통계:`);
    console.log(`   - 브랜드: ${brandCount}개`);
    console.log(`   - 모델: ${modelCount}개`);
    console.log(`   - 연도별 템플릿: ${yearTemplateCount}개`);

    // 브랜드별로 개별 JSON 파일도 생성
    console.log(`\n📝 브랜드별 개별 파일 생성 중...`);

    for (const brandId in vehiclesData) {
      const brandPath = path.join(outputDir, `${brandId}.json`);
      fs.writeFileSync(
        brandPath,
        JSON.stringify(vehiclesData[brandId], null, 2),
        'utf8'
      );
      console.log(`   ✓ ${brandId}.json`);
    }

    console.log(`\n🎉 모든 작업 완료!`);
    process.exit(0);

  } catch (error) {
    console.error('❌ 데이터 추출 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
exportVehiclesData();
