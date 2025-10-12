import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import cors from 'cors';
import { google } from 'googleapis';

// Firebase Admin 초기화
admin.initializeApp();

// CORS 설정 (프로덕션에서는 특정 도메인만 허용)
const corsHandler = cors({
  origin: [
    'http://localhost:8082', // Expo dev server
    'https://your-production-domain.com', // 실제 프로덕션 도메인
  ],
  credentials: true,
});

// Firestore 인스턴스
const db = admin.firestore();

/**
 * 카카오 로그인용 HTTP 함수 (인증 없이 호출 가능)
 */
export const kakaoLoginHttp = functions
  .region('us-central1')
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
  })
  .https.onRequest(async (req, res) => {
    try {
      // CORS 헤더 설정
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');

      // OPTIONS 요청 처리 (CORS preflight)
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      // POST 요청만 허용
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      console.log('🟡 Kakao Login HTTP 요청 받음');
      console.log('🔍 Request body:', req.body);
      
      const { kakaoAccessToken, userInfo } = req.body;

      if (!kakaoAccessToken || !userInfo) {
        res.status(400).json({
          success: false,
          error: '카카오 액세스 토큰과 사용자 정보가 필요합니다.'
        });
        return;
      }

      // 카카오 액세스 토큰 검증 (선택적)
      try {
        // 카카오 API를 통한 토큰 검증
        const response = await axios.get('https://kapi.kakao.com/v1/user/access_token_info', {
          headers: {
            Authorization: `Bearer ${kakaoAccessToken}`,
          },
        });
        
        console.log('✅ 카카오 액세스 토큰 검증 완료:', response.data);
      } catch (error) {
        console.error('❌ 카카오 액세스 토큰 검증 실패:', error);
        res.status(400).json({
          success: false,
          error: '카카오 액세스 토큰이 유효하지 않습니다.'
        });
        return;
      }

      // Firebase UID 생성 (Kakao ID 기반)
      const firebaseUID = `kakao_${userInfo.id}`;
      const userDocRef = db.collection('users').doc(firebaseUID);
      const userDoc = await userDocRef.get();
      const isNewUser = !userDoc.exists;
      
      console.log('🔍 사용자 존재 여부:', isNewUser ? '신규 사용자' : '기존 사용자', 'UID:', firebaseUID);

      // 사용자 정보 저장/업데이트
      const userData = {
        kakaoId: userInfo.id,
        email: userInfo.email,
        displayName: userInfo.nickname || userInfo.email?.split('@')[0] || '카카오 사용자',
        photoURL: userInfo.profileImageUrl,
        provider: 'kakao',
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (isNewUser) {
        await userDocRef.set({
          ...userData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isRegistrationComplete: false,
        });
        console.log('✅ 신규 카카오 사용자 생성:', firebaseUID);
      } else {
        await userDocRef.update(userData);
        console.log('✅ 기존 카카오 사용자 정보 업데이트:', firebaseUID);
      }

      // Firebase Custom Token 생성
      console.log('🔥 Kakao Custom Token 생성 중... Firebase UID:', firebaseUID);
      
      const customClaims = {
        provider: 'kakao',
        kakaoId: userInfo.id,
        email: userInfo.email || null,
        displayName: userData.displayName,
        isVerified: true,
        role: 'user',
        canCreateReservation: true,
        tokenVersion: Date.now()
      };
      
      const customToken = await admin.auth().createCustomToken(firebaseUID, customClaims);
      console.log('✅ Kakao Custom Token 생성 완료 (강화된 claims 포함)');

      // 응답
      res.status(200).json({
        success: true,
        customToken,
        userInfo: {
          id: firebaseUID,
          email: userInfo.email,
          displayName: userData.displayName,
          photoURL: userInfo.profileImageUrl,
        },
        isExistingUser: !isNewUser,
      });

    } catch (error: any) {
      console.error('❌ Kakao Login 실패:', error);
      
      res.status(500).json({
        success: false,
        error: '카카오 로그인 처리 중 오류가 발생했습니다.'
      });
    }
  });

/**
 * 카카오 로그인용 Callable 함수 (기존 호환성)
 */
export const kakaoLogin = functions
  .region('us-central1')
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    try {
      console.log('🟡 Kakao Login Callable 요청 받음');
      
      const { kakaoAccessToken, userInfo } = data;
      if (!kakaoAccessToken || !userInfo) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          '카카오 액세스 토큰과 사용자 정보가 필요합니다.'
        );
      }

      // HTTP 함수로 리다이렉트
      const axios = require('axios');
      const response = await axios.post(
        'https://us-central1-charzing-d1600.cloudfunctions.net/kakaoLoginHttp',
        { kakaoAccessToken, userInfo },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Kakao Login Callable 실패:', error);
      throw new functions.https.HttpsError(
        'internal',
        '카카오 로그인 처리 중 오류가 발생했습니다.'
      );
    }
  });

/**
 * 카카오 로그인을 위한 Firebase 커스텀 토큰 생성 (기존 함수 - 호환성 유지)
 * @deprecated 새로운 kakaoLogin 함수를 사용하세요
 */
export const createKakaoCustomToken = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      const { kakaoId, email, displayName, photoURL } = data;

      // 입력 데이터 검증
      if (!kakaoId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          '카카오 ID가 필요합니다.'
        );
      }

      // 카카오 ID를 기반으로 고유한 UID 생성
      const uid = `kakao_${kakaoId}`;

      // 사용자 정보 설정
      const userRecord = {
        uid,
        email: email || undefined,
        displayName: displayName || '카카오 사용자',
        photoURL: photoURL || undefined,
        emailVerified: false,
        disabled: false,
      };

      // Firebase Auth에서 사용자 확인/생성
      let user;
      try {
        user = await admin.auth().getUser(uid);
        // 기존 사용자 정보 업데이트
        user = await admin.auth().updateUser(uid, {
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
        });
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // 신규 사용자 생성
          user = await admin.auth().createUser(userRecord);
        } else {
          throw error;
        }
      }

      // 커스텀 토큰 생성
      const customToken = await admin.auth().createCustomToken(uid, {
        provider: 'kakao',
        kakaoId: kakaoId,
        email: email,
        displayName: displayName,
      });

      // Firestore에 사용자 정보 저장/업데이트 (선택사항)
      try {
        await db.collection('users').doc(uid).set({
          uid,
          email: email || null,
          displayName: displayName || '카카오 사용자',
          photoURL: photoURL || null,
          provider: 'kakao',
          kakaoId: kakaoId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (firestoreError) {
        console.warn('Firestore 사용자 정보 저장 실패:', firestoreError);
        // Firestore 저장 실패는 치명적이지 않으므로 계속 진행
      }

      return {
        success: true,
        customToken,
        uid: user.uid,
        isNewUser: !user.metadata?.creationTime || 
                   user.metadata.creationTime === user.metadata.lastSignInTime,
        message: '카카오 커스텀 토큰 생성 성공'
      };

    } catch (error: any) {
      console.error('카카오 커스텀 토큰 생성 실패:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        '카카오 로그인 처리 중 오류가 발생했습니다.',
        error.message
      );
    }
  });

/**
 * 사용자 프로필 업데이트 (웹과 앱 공통)
 */
export const updateUserProfile = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      // 인증 확인
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          '로그인이 필요합니다.'
        );
      }

      const uid = context.auth.uid;
      const { 
        displayName, 
        phoneNumber, 
        address, 
        isRegistrationComplete 
      } = data;

      console.log('👤 사용자 프로필 업데이트:', uid);

      // Firestore 업데이트
      await db.collection('users').doc(uid).update({
        displayName,
        phoneNumber,
        address,
        isRegistrationComplete: isRegistrationComplete || true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('✅ 프로필 업데이트 완료:', uid);

      return { success: true };
    } catch (error) {
      console.error('❌ 프로필 업데이트 실패:', error);
      throw new functions.https.HttpsError(
        'internal',
        '프로필 업데이트에 실패했습니다.'
      );
    }
  });

/**
 * Google 로그인용 Custom Token 생성
 */
export const googleLogin = functions
  .region('us-central1')
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    try {
      console.log('🔍 Google Login 요청 받음');
      
      const { idToken, userInfo } = data;

      if (!idToken || !userInfo) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Google ID Token과 사용자 정보가 필요합니다.'
        );
      }

      // Google ID Token 검증
      const OAuth2 = google.auth.OAuth2;
      const client = new OAuth2();
      
      try {
        // Google Web Client ID (Firebase Console > 프로젝트 설정 > 일반 > 웹 앱에서 확인)
        const GOOGLE_WEB_CLIENT_ID = '91035459357-0ulua3kp7eje2bmjd76mceml113el8gd.apps.googleusercontent.com';
        
        const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: GOOGLE_WEB_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error('Invalid Google ID Token');
        }
        
        console.log('✅ Google ID Token 검증 완료:', payload.email);
      } catch (error) {
        console.error('❌ Google ID Token 검증 실패:', error);
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Google ID Token이 유효하지 않습니다.'
        );
      }

      // Firebase UID 생성 (Google ID 기반)
      const firebaseUID = `google_${userInfo.id}`;
      const userDocRef = db.collection('users').doc(firebaseUID);
      const userDoc = await userDocRef.get();
      const isNewUser = !userDoc.exists;
      
      console.log('🔍 사용자 존재 여부:', isNewUser ? '신규 사용자' : '기존 사용자', 'UID:', firebaseUID);

      // 사용자 정보 저장/업데이트
      const userData = {
        googleId: userInfo.id,
        email: userInfo.email,
        displayName: userInfo.name || userInfo.email?.split('@')[0] || 'Google 사용자',
        photoURL: userInfo.photo,
        provider: 'google',
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (isNewUser) {
        await userDocRef.set({
          ...userData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isRegistrationComplete: false,
        });
        console.log('✅ 신규 Google 사용자 생성:', firebaseUID);
      } else {
        await userDocRef.update(userData);
        console.log('✅ 기존 Google 사용자 정보 업데이트:', firebaseUID);
      }

      // Firebase Custom Token 생성
      console.log('🔥 Google Custom Token 생성 중... Firebase UID:', firebaseUID);
      
      const customClaims = {
        provider: 'google',
        googleId: userInfo.id,
        email: userInfo.email || null,
        displayName: userData.displayName,
        isVerified: true,
        role: 'user',
        canCreateReservation: true,
        tokenVersion: Date.now()
      };
      
      const customToken = await admin.auth().createCustomToken(firebaseUID, customClaims);
      console.log('✅ Google Custom Token 생성 완료 (강화된 claims 포함)');

      // 응답
      return {
        success: true,
        customToken,
        userInfo: {
          id: firebaseUID,
          email: userInfo.email,
          displayName: userData.displayName,
          photoURL: userInfo.photo,
        },
        isExistingUser: !isNewUser,
      };

    } catch (error: any) {
      console.error('❌ Google Login 실패:', error);
      
      throw new functions.https.HttpsError(
        'internal',
        'Google 로그인 처리 중 오류가 발생했습니다.'
      );
    }
  });

/**
 * Apple 로그인용 Custom Token 생성
 */
export const createCustomTokenFromApple = functions
  .region('us-central1')
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
  })
  .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        console.log('🍎 Apple Custom Token 생성 요청 받음');
        
        if (req.method !== 'POST') {
          res.status(405).json({ success: false, error: 'Method not allowed' });
          return;
        }

        const { appleUser } = req.body;

        if (!appleUser || !appleUser.uid) {
          res.status(400).json({ 
            success: false, 
            error: 'Apple 사용자 정보가 필요합니다.' 
          });
          return;
        }

        const firebaseUID = appleUser.uid; // 클라이언트에서 실제 Firebase UID 전달받음
        const userInfo = {
          id: firebaseUID,
          email: appleUser.email || null,
          displayName: appleUser.displayName || 'Apple 사용자',
          photoURL: appleUser.photoURL || null,
        };

        console.log('✅ 실제 Firebase UID 받음:', firebaseUID);

        // Firebase UID로 사용자 문서 참조 (실제 Firebase UID 사용)
        const userDocRef = db.collection('users').doc(firebaseUID);
        const userDoc = await userDocRef.get();
        
        let isNewUser = !userDoc.exists;
        
        console.log('🔍 사용자 존재 여부:', isNewUser ? '신규 사용자' : '기존 사용자', 'UID:', firebaseUID);

        // 사용자 정보 저장/업데이트
        const userData = {
          appleId: firebaseUID, // Apple ID 대신 Firebase UID 저장
          email: userInfo.email,
          displayName: userInfo.displayName,
          photoURL: userInfo.photoURL,
          provider: 'apple',
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (isNewUser) {
          await userDocRef.set({
            ...userData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isRegistrationComplete: false,
          });
          console.log('✅ 신규 Apple 사용자 생성:', firebaseUID);
        } else {
          await userDocRef.update(userData);
          console.log('✅ 기존 Apple 사용자 정보 업데이트:', firebaseUID);
        }

        // Firebase Custom Token 생성 (실제 Firebase UID 사용)
        console.log('🔥 Apple Custom Token 생성 중... Firebase UID:', firebaseUID);
        
        const customClaims = {
          provider: 'apple',
          appleId: firebaseUID, // Firebase UID 사용
          email: userInfo.email || null,
          displayName: userInfo.displayName,
          isVerified: true,
          role: 'user',
          canCreateReservation: true,
          tokenVersion: Date.now()
        };
        
        const customToken = await admin.auth().createCustomToken(firebaseUID, customClaims);
        console.log('✅ Apple Custom Token 생성 완료 (강화된 claims 포함)');

        // 응답
        res.status(200).json({
          success: true,
          customToken,
          userInfo,
          isNewUser,
        });

      } catch (error: any) {
        console.error('❌ Apple Custom Token 생성 실패:', error);
        
        res.status(500).json({
          success: false,
          error: '서버 오류가 발생했습니다.',
        });
      }
    });
  });

/**
 * 회원탈퇴 (웹과 앱 공통)
 */
export const deleteUserAccount = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      // 인증 확인
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          '로그인이 필요합니다.'
        );
      }

      const uid = context.auth.uid;
      console.log('🔴 회원탈퇴 처리 시작:', uid);

      // 1. Firestore에서 사용자 데이터 삭제
      await db.collection('users').doc(uid).delete();
      console.log('✅ Firestore 사용자 데이터 삭제 완료');

      // 2. Firebase Auth에서 사용자 삭제
      await admin.auth().deleteUser(uid);
      console.log('✅ Firebase Auth 사용자 삭제 완료');

      // 3. 추가로 삭제할 데이터가 있다면 여기서 처리
      // 예: 사용자가 작성한 게시글, 댓글 등

      console.log('✅ 회원탈퇴 처리 완료:', uid);

      return { success: true };
    } catch (error) {
      console.error('❌ 회원탈퇴 처리 실패:', error);
      throw new functions.https.HttpsError(
        'internal',
        '회원탈퇴 처리에 실패했습니다.'
      );
    }
  });


/**
 * 사용자 정보 조회 (웹과 앱 공통)
 */
export const getUserProfile = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      // 인증 확인
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          '로그인이 필요합니다.'
        );
      }

      const uid = context.auth.uid;
      console.log('👤 사용자 정보 조회:', uid);

      const userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          '사용자 정보를 찾을 수 없습니다.'
        );
      }

      const userData = userDoc.data();
      console.log('✅ 사용자 정보 조회 완료');

      return {
        success: true,
        user: {
          uid,
          ...userData,
          // 민감한 정보는 제외
          createdAt: userData?.createdAt?.toDate?.()?.toISOString(),
          updatedAt: userData?.updatedAt?.toDate?.()?.toISOString(),
          lastLoginAt: userData?.lastLoginAt?.toDate?.()?.toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ 사용자 정보 조회 실패:', error);
      throw new functions.https.HttpsError(
        'internal',
        '사용자 정보 조회에 실패했습니다.'
      );
    }
  });

// ======= 진단 예약 관련 Functions =======


/**
 * 진단 예약 생성 (서버사이드 검증 포함)
 */
export const createDiagnosisReservation = functions
  .region('us-central1')
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
  })
  .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        console.log('🔍 진단 예약 생성 요청 받음 (HTTP)');
        
        if (req.method !== 'POST') {
          res.status(405).json({ success: false, error: 'Method not allowed' });
          return;
        }

        // 인증 토큰 검증
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          res.status(401).json({ success: false, error: '인증 토큰이 필요합니다.' });
          return;
        }

        let uid: string;
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          uid = decodedToken.uid;
          console.log('✅ 인증 성공:', uid);
          console.log('🔐 토큰 claims:', decodedToken);
        } catch (authError) {
          console.error('❌ 인증 실패:', authError);
          res.status(401).json({ success: false, error: '유효하지 않은 인증 토큰입니다.' });
          return;
        }

        const { 
          address, 
          detailAddress, 
          latitude, 
          longitude, 
          requestedDate, 
          notes,
          serviceType,
          servicePrice,
          vehicleBrand,
          vehicleModel,
          vehicleYear,
          userName,
          userPhone
        } = req.body;

        console.log('📅 진단 예약 생성 요청:', uid);

        // 데이터 검증
        if (!address || !latitude || !longitude || !requestedDate) {
          res.status(400).json({
            success: false,
            error: '필수 정보가 누락되었습니다.'
          });
          return;
        }

        // 예약 시간 검증
        const requestedDateTime = new Date(requestedDate);
        const now = new Date();
        
        if (requestedDateTime <= now) {
          res.status(400).json({
            success: false,
            error: '예약 시간은 현재 시간 이후여야 합니다.'
          });
          return;
        }

        // 사용자 정보 조회
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
          res.status(404).json({
            success: false,
            error: '사용자 정보를 찾을 수 없습니다.'
          });
          return;
        }

        const userData = userDoc.data();

        // 예약 데이터 생성
        const reservationData = {
          userId: uid,
          userName: userName || userData?.displayName || '사용자',
          userPhone: userPhone || userData?.phoneNumber || null,
          address,
          detailAddress: detailAddress || '',
          latitude: Number(latitude),
          longitude: Number(longitude),
          status: 'pending',
          requestedDate: admin.firestore.Timestamp.fromDate(requestedDateTime),
          estimatedDuration: '약 30분',
          serviceType: serviceType || '방문 배터리 진단 및 상담',
          servicePrice: servicePrice || 100000,
          vehicleBrand: vehicleBrand || '',
          vehicleModel: vehicleModel || '',
          vehicleYear: vehicleYear || '',
          notes: notes || '',
          adminNotes: '',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Firestore에 저장
        const reservationRef = await db.collection('diagnosisReservations').add(reservationData);
        
        console.log('✅ 진단 예약 생성 완료:', reservationRef.id);

        res.status(200).json({
          success: true,
          reservationId: reservationRef.id,
          message: '진단 예약이 성공적으로 생성되었습니다.'
        });

      } catch (error: any) {
        console.error('❌ 진단 예약 생성 실패:', error);
        res.status(500).json({
          success: false,
          error: '서버 오류가 발생했습니다.'
        });
      }
    });
  });

/**
 * 사용자 진단 예약 목록 조회
 */
export const getUserDiagnosisReservations = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          res.status(405).json({ success: false, error: 'Method not allowed' });
          return;
        }

        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          res.status(401).json({ success: false, error: '인증 토큰이 필요합니다.' });
          return;
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;

        console.log('📋 사용자 예약 목록 조회:', uid);

      const reservationsSnapshot = await db
        .collection('diagnosisReservations')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();

      const reservations = reservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedDate: doc.data().requestedDate?.toDate?.()?.toISOString(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
      }));

        console.log(`✅ 예약 목록 조회 완료: ${reservations.length}건`);

        res.status(200).json({
          success: true,
          reservations
        });

      } catch (error) {
        console.error('❌ 예약 목록 조회 실패:', error);
        res.status(500).json({
          success: false,
          error: '예약 목록 조회에 실패했습니다.'
        });
      }
    });
  });

// ======= 사용자 차량 관리 Functions =======

/**
 * 사용자 차량 추가 (서버사이드 검증)
 */
export const addUserVehicle = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          '로그인이 필요합니다.'
        );
      }

      const uid = context.auth.uid;
      const { make, model, year, batteryCapacity, range, nickname } = data;

      console.log('🚗 사용자 차량 추가:', uid);

      // 데이터 검증
      if (!make || !model || !year) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          '차량 정보(제조사, 모델명, 연식)가 누락되었습니다.'
        );
      }

      // 기존 활성 차량 비활성화
      const batch = db.batch();
      
      const existingVehicles = await db
        .collection('userVehicles')
        .where('userId', '==', uid)
        .where('isActive', '==', true)
        .get();

      existingVehicles.docs.forEach(doc => {
        batch.update(doc.ref, { 
          isActive: false, 
          updatedAt: admin.firestore.FieldValue.serverTimestamp() 
        });
      });

      // 새 차량 추가
      const vehicleData = {
        userId: uid,
        make,
        model,
        year: parseInt(year.toString()),
        batteryCapacity: batteryCapacity || null,
        range: range || null,
        nickname: nickname || null,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const newVehicleRef = db.collection('userVehicles').doc();
      batch.set(newVehicleRef, vehicleData);

      await batch.commit();
      console.log('✅ 사용자 차량 추가 완료:', newVehicleRef.id);

      return {
        success: true,
        vehicleId: newVehicleRef.id,
        message: '차량이 성공적으로 등록되었습니다.'
      };

    } catch (error) {
      console.error('❌ 사용자 차량 추가 실패:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        '차량 등록 중 오류가 발생했습니다.'
      );
    }
  });

/**
 * 사용자 차량 목록 조회
 */
export const getUserVehicles = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          '로그인이 필요합니다.'
        );
      }

      const uid = context.auth.uid;
      console.log('사용자 차량 목록 조회:', uid);

      const vehiclesSnapshot = await db
        .collection('userVehicles')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();

      const vehicles = vehiclesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
      }));

      console.log(`차량 목록 조회 완료: ${vehicles.length}대`);

      return {
        success: true,
        vehicles
      };

    } catch (error) {
      console.error('차량 목록 조회 실패:', error);
      throw new functions.https.HttpsError(
        'internal',
        '차량 목록 조회에 실패했습니다.'
      );
    }
  });

// ======= 푸시 알림 시스템 =======

/**
 * 푸시 알림 전송 (관리자용)
 */
export const sendPushNotification = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      console.log('푸시 알림 전송 요청');
      
      const { userIds, title, body, data: notificationData } = data;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        console.log('유효하지 않은 사용자 목록');
        throw new functions.https.HttpsError(
          'invalid-argument',
          '받을 사용자 ID 목록이 필요합니다.'
        );
      }

      if (!title || !body) {
        console.log('유효하지 않은 제목/내용');
        throw new functions.https.HttpsError(
          'invalid-argument',
          '알림 제목과 내용이 필요합니다.'
        );
      }

      console.log(`${userIds.length}명의 사용자에게 알림 전송`);
      console.log('알림 전송:', title);

      const results = [];
      
      for (const userId of userIds) {
        try {
          
          // 사용자의 푸시 토큰 및 알림 설정 조회
          const userDoc = await db.collection('users').doc(userId).get();
          
          if (!userDoc.exists) {
              results.push({ userId, success: false, error: 'User not found' });
            continue;
          }

          const userData = userDoc.data();
          const pushToken = userData?.pushToken;
          
          // 알림 설정 확인
          const notificationSettingsDoc = await db.collection('users').doc(userId).collection('notificationSettings').doc('settings').get();
          const notificationSettings = notificationSettingsDoc.exists ? (notificationSettingsDoc.data() || {}) : { enabled: true }; // 기본값: 활성화
          
          // 전체 알림이 비활성화된 경우 건너뛰기
          if (notificationSettings.enabled === false) {
            console.log(`사용자 ${userId}는 전체 알림이 비활성화됨, 전송 건너뛰기`);
            results.push({ userId, success: false, error: 'Notifications disabled by user' });
            continue;
          }
          
          // 카테고리별 알림 설정 확인
          const category = notificationData?.category || 'announcement';
          if (notificationSettings[category] === false) {
            console.log(`사용자 ${userId}는 ${category} 알림이 비활성화됨, 전송 건너뛰기`);
            results.push({ userId, success: false, error: `${category} notifications disabled by user` });
            continue;
          }
          
          let pushSuccess = false;
          let pushError = null;

          // 1. 푸시 토큰이 있으면 푸시 알림 전송
          if (pushToken) {
            try {
              const message = {
                to: pushToken,
                sound: 'default',
                title,
                body,
                data: notificationData || {},
              };

              const response = await axios.post(
                'https://exp.host/--/api/v2/push/send',
                message,
                {
                  headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                  },
                }
              );

              pushSuccess = true;

              // 푸시 알림 로그 저장
              await db.collection('notificationLogs').add({
                userId,
                pushToken,
                title,
                body,
                data: notificationData || {},
                response: response.data,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'sent'
              });

            } catch (pushErr) {
              console.error(`푸시 알림 전송 실패: ${userId}`, pushErr);
              pushError = pushErr instanceof Error ? pushErr.message : '푸시 알림 전송 실패';
            }
          }

          // 2. 모든 사용자에게 인앱 알림 저장 (푸시 토큰 유무와 상관없이)
          try {
            const inAppNotification = {
              title,
              body,
              category: notificationData?.category || 'announcement',
              data: notificationData || {},
              isRead: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            };

            // 사용자의 inAppNotifications 컬렉션에 저장
            await db.collection('users').doc(userId).collection('inAppNotifications').add(inAppNotification);
            
            results.push({
              userId,
              success: true,
              pushSent: !!pushToken && pushSuccess,
              inAppSaved: true,
              pushError: pushError
            });

          } catch (inAppError) {
            console.error(`인앱 알림 저장 실패: ${userId}`, inAppError);
            const errorMessage = inAppError instanceof Error ? inAppError.message : '인앱 알림 저장 실패';
            
            results.push({
              userId,
              success: false,
              pushSent: !!pushToken && pushSuccess,
              inAppSaved: false,
              error: errorMessage,
              pushError: pushError
            });
          }

        } catch (error) {
          console.error(`푸시 알림 전송 실패: ${userId}`);
          results.push({ userId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      console.log('전송 완료');

      return {
        success: true,
        results,
        message: `${results.length}명에게 알림 전송 시도 완료`
      };

    } catch (error) {
      console.error('푸시 알림 전송 실패:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        '푸시 알림 전송 중 오류가 발생했습니다.'
      );
    }
  });

/**
 * 푸시 알림을 받을 수 있는 사용자 목록 조회 (관리자용)
 */
export const getUsersWithPushTokens = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      console.log('사용자 목록 조회');
      
      // 푸시 토큰이 있는 사용자만 조회
      const usersQuery = await db
        .collection('users')
        .where('pushToken', '!=', null)
        .orderBy('updatedAt', 'desc')
        .limit(100)
        .get();

      const users = usersQuery.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: doc.id,
          displayName: data.displayName || '이름 없음',
          email: data.email || '',
          provider: data.provider || 'unknown',
          hasPushToken: !!data.pushToken,
          pushTokenPreview: data.pushToken ? `${data.pushToken.substring(0, 20)}...` : null,
          lastUpdated: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        };
      });

      console.log(`사용자 ${users.length}명 조회 완료`);

      return {
        success: true,
        users,
        totalCount: users.length,
        message: `푸시 토큰이 있는 사용자 ${users.length}명`
      };

    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      throw new functions.https.HttpsError(
        'internal',
        '사용자 목록 조회 중 오류가 발생했습니다.'
      );
    }
  });

/**
 * 예약 상태 변경 시 자동 푸시 알림
 */
export const sendReservationStatusNotification = functions
  .region('us-central1')
  .firestore.document('diagnosisReservations/{reservationId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      
      // 상태가 변경된 경우에만 알림 전송
      if (beforeData.status === afterData.status) {
        return;
      }

      console.log(`예약 상태 변경: ${beforeData.status} → ${afterData.status}`);
      
      const userId = afterData.userId;
      const reservationId = context.params.reservationId;
      
      // 사용자 푸시 토큰 및 알림 설정 조회
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log(`사용자 문서 없음: ${userId}`);
        return;
      }

      const userData = userDoc.data();
      const pushToken = userData?.pushToken;
      
      // 알림 설정 확인
      const notificationSettingsDoc = await db.collection('users').doc(userId).collection('notificationSettings').doc('settings').get();
      const notificationSettings = notificationSettingsDoc.exists ? (notificationSettingsDoc.data() || {}) : { enabled: true, reservation: true }; // 기본값: 활성화
      
      // 전체 알림 또는 예약 알림이 비활성화된 경우 건너뛰기
      if (notificationSettings.enabled === false || notificationSettings.reservation === false) {
        console.log(`사용자 ${userId}는 예약 알림이 비활성화됨, 자동 알림 전송 건너뛰기`);
        return;
      }

      // 상태별 알림 메시지
      let title = '';
      let body = '';
      
      switch (afterData.status) {
        case 'confirmed':
          title = '예약 확정 안내';
          body = '진단 예약이 확정되었습니다. 예정된 시간에 전문가가 방문할 예정입니다.';
          break;
        case 'in_progress':
          title = '진단 시작 안내';
          body = '전기차 배터리 진단이 시작되었습니다.';
          break;
        case 'completed':
          title = '진단 완료 안내';
          body = '배터리 진단이 완료되었습니다. 진단 리포트를 확인해보세요.';
          break;
        case 'cancelled':
          title = '예약 취소 안내';
          body = '진단 예약이 취소되었습니다.';
          break;
        default:
          return; // 알림을 보내지 않는 상태
      }


      // 1. 푸시 토큰이 있으면 푸시 알림 전송
      if (pushToken) {
        try {
          const message = {
            to: pushToken,
            sound: 'default',
            title,
            body,
            data: {
              type: 'reservation_status_change',
              reservationId,
              status: afterData.status,
              category: 'reservation',
            },
          };

          const response = await axios.post(
            'https://exp.host/--/api/v2/push/send',
            message,
            {
              headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              },
            }
          );

          console.log(`자동 푸시 알림 전송 성공: ${userId}`);

          // 푸시 알림 로그 저장
          await db.collection('notificationLogs').add({
            userId,
            pushToken,
            title,
            body,
            data: message.data,
            response: response.data,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'sent',
            trigger: 'reservation_status_change',
            reservationId
          });

        } catch (pushErr) {
          console.error(`자동 푸시 알림 전송 실패: ${userId}`, pushErr);
        }
      } else {
        console.log(`사용자 ${userId}에게 푸시 토큰이 없음, 인앱 알림만 저장`);
      }

      // 2. 모든 사용자에게 인앱 알림 저장 (푸시 토큰 유무와 상관없이)
      try {
        const inAppNotification = {
          title,
          body,
          category: 'reservation',
          data: {
            type: 'reservation_status_change',
            reservationId,
            status: afterData.status,
          },
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        // 사용자의 inAppNotifications 컬렉션에 저장
        await db.collection('users').doc(userId).collection('inAppNotifications').add(inAppNotification);
        console.log(`사용자 ${userId}에게 자동 인앱 알림 저장 완료 (예약 상태 변경)`);

      } catch (inAppError) {
        console.error(`사용자 ${userId} 자동 인앱 알림 저장 실패:`, inAppError);
      }

    } catch (error) {
      console.error('자동 푸시 알림 전송 실패:', error);
    }
  });

/**
 * 푸시 토큰 저장
 */
export const savePushToken = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          '로그인이 필요합니다.'
        );
      }

      const uid = context.auth.uid;
      const { pushToken } = data;

      if (!pushToken) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          '푸시 토큰이 필요합니다.'
        );
      }

      console.log(`푸시 토큰 저장: ${uid}`);

      // 사용자 문서에 푸시 토큰 저장
      await db.collection('users').doc(uid).update({
        pushToken,
        pushTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`푸시 토큰 저장 완료: ${uid}`);

      return {
        success: true,
        message: '푸시 토큰이 저장되었습니다.'
      };

    } catch (error) {
      console.error('푸시 토큰 저장 실패:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        '푸시 토큰 저장 중 오류가 발생했습니다.'
      );
    }
  });

// ===============================
// Admin Web용 HTTPS 엔드포인트들 (인증 없이 호출 가능)
// ===============================

/**
 * Admin Web용 푸시 알림 전송 (HTTPS 엔드포인트)
 */
export const sendPushNotificationAdmin = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      // CORS 설정
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      console.log('관리자 알림 전송');
      
      const { userIds, title, body, data: notificationData } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        console.log('유효하지 않은 사용자 목록');
        res.status(400).json({
          success: false,
          error: '받을 사용자 ID 목록이 필요합니다.'
        });
        return;
      }

      if (!title || !body) {
        console.log('유효하지 않은 제목/내용');
        res.status(400).json({
          success: false,
          error: '제목과 내용이 필요합니다.'
        });
        return;
      }

      const results = [];
      let totalSuccess = 0;
      let totalFailure = 0;
      const errors = [];

      // 각 사용자별로 푸시 토큰 조회 및 전송
      for (const userId of userIds) {
        try {
          console.log(`사용자 ${userId}에게 푸시 알림 전송 시도`);
          
          const userDoc = await db.collection('users').doc(userId).get();
          if (!userDoc.exists) {
            console.log(`사용자 ${userId} 존재하지 않음`);
            errors.push(`사용자 ${userId}를 찾을 수 없습니다`);
            totalFailure++;
            continue;
          }

          const userData = userDoc.data();
          const pushToken = userData?.pushToken;
          
          // 알림 설정 확인
          const notificationSettingsDoc = await db.collection('users').doc(userId).collection('notificationSettings').doc('settings').get();
          const notificationSettings = notificationSettingsDoc.exists ? (notificationSettingsDoc.data() || {}) : { enabled: true }; // 기본값: 활성화
          
          // 전체 알림이 비활성화된 경우 건너뛰기
          if (notificationSettings.enabled === false) {
            console.log(`사용자 ${userId}는 전체 알림이 비활성화됨, Admin 알림 전송 건너뛰기`);
            errors.push(`사용자 ${userId}: 알림이 비활성화됨`);
            totalFailure++;
            continue;
          }
          
          // 카테고리별 알림 설정 확인 
          const category = notificationData?.category || 'announcement';
          if (notificationSettings[category] === false) {
            console.log(`사용자 ${userId}는 ${category} 알림이 비활성화됨, Admin 알림 전송 건너뛰기`);
            errors.push(`사용자 ${userId}: ${category} 알림이 비활성화됨`);
            totalFailure++;
            continue;
          }

          let pushSuccess = false;
          let pushError = null;

          // 1. 푸시 토큰이 있으면 푸시 알림 전송
          if (pushToken) {
            try {
              const message = {
                to: pushToken,
                sound: 'default',
                title: title,
                body: body,
                data: notificationData || {},
              };

              console.log(`Expo Push API 호출 중 (사용자: ${userId})`);
              
              const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
                headers: {
                  'Accept': 'application/json',
                  'Accept-encoding': 'gzip, deflate',
                  'Content-Type': 'application/json',
                },
              });

              console.log(`사용자 ${userId} 푸시 알림 전송 성공:`, response.data);
              pushSuccess = true;
            } catch (pushErr) {
              console.error(`사용자 ${userId} 푸시 알림 전송 실패:`, pushErr);
              pushError = pushErr instanceof Error ? pushErr.message : '푸시 알림 전송 실패';
            }
          } else {
            console.log(`사용자 ${userId}에게 푸시 토큰이 없음, 인앱 알림만 저장`);
          }

          // 2. 모든 사용자에게 인앱 알림 저장 (푸시 토큰 유무와 상관없이)
          try {
            const inAppNotification = {
              title,
              body,
              category: notificationData?.category || 'announcement',
              data: notificationData || {},
              isRead: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            };

            // 사용자의 inAppNotifications 컬렉션에 저장
            await db.collection('users').doc(userId).collection('inAppNotifications').add(inAppNotification);
            console.log(`사용자 ${userId}에게 인앱 알림 저장 완료`);
            
            totalSuccess++;
            results.push({
              userId,
              success: true,
              pushSent: !!pushToken && pushSuccess,
              inAppSaved: true,
              pushError: pushError
            });

          } catch (inAppError) {
            console.error(`사용자 ${userId} 인앱 알림 저장 실패:`, inAppError);
            const errorMessage = inAppError instanceof Error ? inAppError.message : '인앱 알림 저장 실패';
            errors.push(`사용자 ${userId}: ${errorMessage}`);
            totalFailure++;
            
            results.push({
              userId,
              success: false,
              pushSent: !!pushToken && pushSuccess,
              inAppSaved: false,
              error: errorMessage,
              pushError: pushError
            });
          }

        } catch (error) {
          console.error(`사용자 ${userId} 푸시 알림 전송 실패:`, error);
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          errors.push(`사용자 ${userId}: ${errorMessage}`);
          totalFailure++;
          
          results.push({
            userId,
            success: false,
            error: errorMessage
          });
        }
      }

      console.log(`푸시 알림 전송 완료 - 성공: ${totalSuccess}, 실패: ${totalFailure}`);

      res.json({
        success: true,
        successCount: totalSuccess,
        failureCount: totalFailure,
        errors: errors,
        results: results
      });

    } catch (error) {
      console.error('Admin Web 푸시 알림 전송 실패:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  });

/**
 * Admin Web용 푸시 토큰 보유 사용자 목록 조회 (HTTPS 엔드포인트)
 */
export const getUsersWithPushTokensAdmin = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      // CORS 설정
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      console.log('Admin Web 푸시 토큰이 있는 사용자 목록 조회');
      
      // 모든 사용자 조회 후 클라이언트에서 푸시 토큰 필터링 (인덱스 문제 해결)
      const usersQuery = await db
        .collection('users')
        .limit(100)
        .get();

      const users = usersQuery.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName || '이름 없음',
            email: data.email || '',
            provider: data.provider || 'unknown',
            hasPushToken: !!data.pushToken,
            pushTokenPreview: data.pushToken ? `${data.pushToken.substring(0, 20)}...` : null,
            lastUpdated: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            _pushToken: data.pushToken, // 임시로 전체 토큰도 포함 (필터링용)
          };
        })
        .filter(user => user._pushToken) // 푸시 토큰이 있는 사용자만 필터링
        .map(user => {
          const { _pushToken, ...userWithoutToken } = user; // _pushToken 제거
          return userWithoutToken;
        });

      console.log(`사용자 ${users.length}명 조회 완료`);

      res.json({
        success: true,
        users: users,
        totalCount: users.length,
        message: `푸시 토큰이 있는 사용자 ${users.length}명`
      });

    } catch (error) {
      console.error('Admin Web 사용자 목록 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  });