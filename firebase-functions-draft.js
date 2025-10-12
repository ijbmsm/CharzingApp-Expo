// Firebase Cloud Functions에 추가할 Google 로그인 함수 (참고용)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { OAuth2Client } = require('google-auth-library');

// Google OAuth2 클라이언트 설정 (서버 사이드 검증용)
const client = new OAuth2Client(
  functions.config().google?.web_client_id || process.env.GOOGLE_WEB_CLIENT_ID
);

/**
 * Google ID Token을 검증하고 Firebase Custom Token을 생성하는 함수
 */
exports.createCustomTokenFromGoogle = functions.https.onRequest(async (req, res) => {
  // CORS 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { googleProfile, idToken } = req.body;
    
    if (!googleProfile || !idToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Google profile과 ID token이 필요합니다.' 
      });
    }

    console.log('🔍 Google 로그인 요청:', {
      googleId: googleProfile.id,
      email: googleProfile.email,
      name: googleProfile.name,
      hasIdToken: !!idToken
    });

    // 1. Google ID Token 검증
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: functions.config().google?.web_client_id || process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userId = payload['sub']; // Google User ID

    // 2. Google ID와 프로필의 ID가 일치하는지 확인
    if (userId !== googleProfile.id) {
      console.error('❌ Google ID 불일치:', { tokenId: userId, profileId: googleProfile.id });
      return res.status(400).json({
        success: false,
        error: 'Google ID token과 프로필 정보가 일치하지 않습니다.'
      });
    }

    // 3. Firebase UID 생성 (google_ 접두사 사용)
    const firebaseUid = `google_${googleProfile.id}`;
    console.log('🔥 Firebase UID:', firebaseUid);

    // 4. 기존 사용자 확인
    let userRecord;
    let isNewUser = false;

    try {
      userRecord = await admin.auth().getUser(firebaseUid);
      console.log('👤 기존 사용자 발견:', userRecord.uid);
      isNewUser = false;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('👶 새 사용자 생성 중...');
        
        // 새 사용자 생성
        const newUserData = {
          uid: firebaseUid,
          email: googleProfile.email,
          displayName: googleProfile.name || googleProfile.givenName,
          photoURL: googleProfile.photo,
          emailVerified: true, // Google 계정은 이미 검증됨
          providerData: [{
            uid: googleProfile.id,
            displayName: googleProfile.name || googleProfile.givenName,
            email: googleProfile.email,
            photoURL: googleProfile.photo,
            providerId: 'google.com'
          }]
        };

        userRecord = await admin.auth().createUser(newUserData);
        isNewUser = true;
        console.log('✅ 새 사용자 생성 완료:', userRecord.uid);
      } else {
        console.error('❌ 사용자 조회/생성 오류:', error);
        throw error;
      }
    }

    // 5. Firebase Custom Token 생성
    const customToken = await admin.auth().createCustomToken(firebaseUid, {
      googleId: googleProfile.id,
      provider: 'google',
      email: googleProfile.email,
      name: googleProfile.name,
      photo: googleProfile.photo
    });

    console.log('✅ Custom Token 생성 성공');

    // 6. Firestore에 사용자 정보 저장/업데이트
    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(firebaseUid);
    
    const userData = {
      uid: firebaseUid,
      email: googleProfile.email || '',
      displayName: googleProfile.name || googleProfile.givenName || 'Google 사용자',
      photoURL: googleProfile.photo || '',
      provider: 'google',
      googleId: googleProfile.id,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (isNewUser) {
      userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await userDocRef.set(userData, { merge: true });
    console.log('✅ Firestore 사용자 정보 저장 완료');

    return res.status(200).json({
      success: true,
      customToken: customToken,
      isNewUser: isNewUser,
      user: {
        uid: firebaseUid,
        email: googleProfile.email,
        displayName: googleProfile.name || googleProfile.givenName,
        photoURL: googleProfile.photo
      }
    });

  } catch (error) {
    console.error('❌ Google 로그인 처리 실패:', error);
    
    // 에러 타입별 처리
    if (error.message?.includes('Token used too early') || error.message?.includes('Token used too late')) {
      return res.status(400).json({
        success: false,
        error: '인증 토큰의 시간이 유효하지 않습니다. 다시 로그인해주세요.'
      });
    } else if (error.message?.includes('Invalid token signature')) {
      return res.status(400).json({
        success: false,
        error: '인증 토큰이 유효하지 않습니다. 다시 로그인해주세요.'
      });
    } else if (error.code === 'auth/invalid-argument') {
      return res.status(400).json({
        success: false,
        error: '잘못된 사용자 정보입니다.'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});
