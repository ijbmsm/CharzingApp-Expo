const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

async function checkStorageRules() {
  console.log('\n📋 Firebase Storage 버킷 정보:\n');

  const bucket = admin.storage().bucket();
  console.log(`버킷 이름: ${bucket.name}`);

  // 샘플 이미지 파일 확인
  console.log('\n🔍 vehicle-images 폴더의 파일들:\n');

  const [files] = await bucket.getFiles({
    prefix: 'vehicle-images/',
    maxResults: 10
  });

  if (files.length === 0) {
    console.log('❌ vehicle-images 폴더에 파일이 없습니다.');
  } else {
    console.log(`✅ ${files.length}개 파일 발견:\n`);

    for (const file of files) {
      console.log(`📄 ${file.name}`);

      // 파일의 공개 URL 생성
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
      console.log(`   URL: ${publicUrl}`);

      // 메타데이터 확인
      const [metadata] = await file.getMetadata();
      console.log(`   Content-Type: ${metadata.contentType}`);
      console.log(`   크기: ${Math.round(metadata.size / 1024)}KB`);
      console.log('');
    }
  }

  // 현재 Storage 규칙 확인 (Firebase Admin SDK로는 직접 확인 불가)
  console.log('\n⚠️  Storage 규칙 확인 방법:');
  console.log('1. Firebase Console 접속: https://console.firebase.google.com/');
  console.log('2. Storage > Rules 탭으로 이동');
  console.log('3. 다음 규칙이 적용되었는지 확인:\n');
  console.log(`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /vehicle-images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /brand-logos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /vehicle-reports/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    match /diagnosis-reports/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}`);
}

checkStorageRules()
  .then(() => {
    console.log('\n✅ 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
