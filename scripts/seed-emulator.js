/**
 * 실제 Firestore → 에뮬레이터로 vehicles 컬렉션 복사
 * Admin SDK 사용 (보안 규칙 무시)
 *
 * 사용법:
 * 1. 에뮬레이터 실행: firebase emulators:start
 * 2. 다른 터미널에서: node scripts/seed-emulator.js
 */

// charzing 프로젝트의 .env.local에서 Firebase Admin 키 가져오기
require('dotenv').config({ path: '/Users/sungmin/Desktop/project/react/charzing/.env.local' });

const admin = require('firebase-admin');

// 환경변수에서 서비스 계정 정보 가져오기
const serviceAccount = {
  type: 'service_account',
  project_id: 'charzing-d1600',
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@charzing-d1600.iam.gserviceaccount.com',
};

if (!serviceAccount.private_key) {
  console.error('❌ FIREBASE_PRIVATE_KEY 환경변수가 없습니다.');
  process.exit(1);
}

// Firebase Admin - 실제 DB (읽기용)
const prodApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'charzing-d1600',
}, 'prod');
const prodDb = prodApp.firestore();

// Firebase Admin - 에뮬레이터 (쓰기용)
// FIRESTORE_EMULATOR_HOST 환경변수로 에뮬레이터 연결
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const emulatorApp = admin.initializeApp({
  projectId: 'charzing-d1600',
}, 'emulator');
const emulatorDb = emulatorApp.firestore();

async function copyCollection(collectionName) {
  console.log(`\n📦 ${collectionName} 컬렉션 복사 중...`);

  try {
    // 실제 DB에서 읽기
    const snapshot = await prodDb.collection(collectionName).get();
    console.log(`   - 실제 DB에서 ${snapshot.size}개 문서 발견`);

    if (snapshot.empty) {
      console.log(`   - 건너뜀 (빈 컬렉션)`);
      return 0;
    }

    // 에뮬레이터에 쓰기 (batch로 효율적으로)
    const batch = emulatorDb.batch();
    let count = 0;

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const ref = emulatorDb.collection(collectionName).doc(docSnapshot.id);
      batch.set(ref, data);
      count++;
    }

    await batch.commit();
    console.log(`   ✅ ${count}개 문서 복사 완료`);
    return count;
  } catch (error) {
    console.error(`   ❌ 에러:`, error.message);
    return 0;
  }
}

async function copyCollectionWithSubcollections(collectionName, subcollectionName) {
  console.log(`\n📦 ${collectionName} + ${subcollectionName} 컬렉션 복사 중...`);

  try {
    // 상위 컬렉션 복사
    const parentSnapshot = await prodDb.collection(collectionName).get();
    console.log(`   - 실제 DB에서 ${parentSnapshot.size}개 상위 문서 발견`);

    let totalCount = 0;

    for (const parentDoc of parentSnapshot.docs) {
      // 상위 문서 복사
      await emulatorDb.collection(collectionName).doc(parentDoc.id).set(parentDoc.data());
      totalCount++;

      // 하위 컬렉션 복사
      const subSnapshot = await prodDb
        .collection(collectionName)
        .doc(parentDoc.id)
        .collection(subcollectionName)
        .get();

      if (!subSnapshot.empty) {
        const batch = emulatorDb.batch();
        for (const subDoc of subSnapshot.docs) {
          const ref = emulatorDb
            .collection(collectionName)
            .doc(parentDoc.id)
            .collection(subcollectionName)
            .doc(subDoc.id);
          batch.set(ref, subDoc.data());
          totalCount++;
        }
        await batch.commit();
      }
    }

    console.log(`   ✅ 총 ${totalCount}개 문서 복사 완료`);
    return totalCount;
  } catch (error) {
    console.error(`   ❌ 에러:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 에뮬레이터 시드 스크립트 시작');
  console.log('================================\n');
  console.log('📍 에뮬레이터: localhost:8080');
  console.log('📍 실제 DB: charzing-d1600');

  let totalDocs = 0;

  // vehicles 컬렉션 + models 하위 컬렉션 복사
  totalDocs += await copyCollectionWithSubcollections('vehicles', 'models');

  console.log('\n================================');
  console.log(`✅ 완료! 총 ${totalDocs}개 문서 복사됨`);
  console.log('📍 http://localhost:4000 에서 확인하세요\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ 스크립트 실행 실패:', error);
  process.exit(1);
});
