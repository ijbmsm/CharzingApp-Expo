const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

async function checkKiaNiroImages() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🖼️  KIA Niro EV 이미지 확인`);
  console.log(`${'='.repeat(80)}\n`);

  const bucket = admin.storage().bucket();

  try {
    // KIA 폴더 확인
    console.log('📁 vehicle-images/KIA/ 폴더 확인:\n');
    const [kiaFiles] = await bucket.getFiles({
      prefix: 'vehicle-images/KIA/',
      delimiter: '/'
    });

    if (kiaFiles.length === 0) {
      console.log('❌ vehicle-images/KIA/ 폴더에 파일이 없습니다.');
    } else {
      console.log(`✅ ${kiaFiles.length}개 파일 발견:\n`);
      for (const file of kiaFiles) {
        console.log(`   📄 ${file.name}`);
      }
    }

    // kia 폴더 확인 (소문자)
    console.log('\n📁 vehicle-images/kia/ 폴더 확인:\n');
    const [kiaLowerFiles] = await bucket.getFiles({
      prefix: 'vehicle-images/kia/',
      delimiter: '/'
    });

    if (kiaLowerFiles.length === 0) {
      console.log('❌ vehicle-images/kia/ 폴더에 파일이 없습니다.');
    } else {
      console.log(`✅ ${kiaLowerFiles.length}개 파일 발견:\n`);
      for (const file of kiaLowerFiles) {
        console.log(`   📄 ${file.name}`);
      }
    }

    // NIRO-EV 확인
    console.log('\n📁 vehicle-images/KIA/NIRO-EV/ 폴더 확인:\n');
    const [niroFiles] = await bucket.getFiles({
      prefix: 'vehicle-images/KIA/NIRO-EV/',
    });

    if (niroFiles.length === 0) {
      console.log('❌ vehicle-images/KIA/NIRO-EV/ 폴더에 파일이 없습니다.');
    } else {
      console.log(`✅ ${niroFiles.length}개 파일 발견:\n`);
      for (const file of niroFiles) {
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
        console.log(`   📄 ${file.name}`);
        console.log(`      URL: ${publicUrl}\n`);
      }
    }

  } catch (error) {
    console.error('❌ 이미지 확인 실패:', error);
  }
}

checkKiaNiroImages()
  .then(() => {
    console.log('✅ 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
