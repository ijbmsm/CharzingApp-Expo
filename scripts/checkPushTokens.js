/**
 * 모든 사용자의 FCM 푸시 토큰 등록 상태를 확인하는 스크립트
 * 푸시 알림이 특정 사용자에게만 가는 문제를 진단
 */

const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
if (admin.apps.length === 0) {
  // 환경변수에서 서비스 계정 키 읽기
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  
  if (!serviceAccountBase64) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_BASE64 환경변수가 설정되지 않았습니다.');
    console.log('사용법: FIREBASE_SERVICE_ACCOUNT_BASE64="..." node scripts/checkPushTokens.js');
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString());
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin SDK 초기화 완료');
  } catch (error) {
    console.error('❌ Firebase Admin SDK 초기화 실패:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function checkPushTokens() {
  try {
    console.log('🔍 모든 사용자의 푸시 토큰 상태 확인 중...\n');
    
    // 모든 사용자 문서 조회
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ 등록된 사용자가 없습니다.');
      return;
    }
    
    const stats = {
      totalUsers: 0,
      withPushToken: 0,
      withoutPushToken: 0,
      validTokens: [],
      invalidTokens: [],
      userDetails: []
    };
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      stats.totalUsers++;
      
      const userInfo = {
        uid: userId,
        email: userData.email || 'N/A',
        displayName: userData.displayName || 'N/A',
        provider: userData.provider || 'N/A',
        lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt.toDate()).toLocaleString('ko-KR') : 'N/A',
        createdAt: userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleString('ko-KR') : 'N/A',
        pushToken: userData.pushToken || null,
        notificationSettings: userData.notificationSettings || null
      };
      
      if (userData.pushToken) {
        stats.withPushToken++;
        
        // 토큰 유효성 검사 (Expo 푸시 토큰 형식)
        if (userData.pushToken.startsWith('ExponentPushToken[') && userData.pushToken.endsWith(']')) {
          stats.validTokens.push({
            userId,
            email: userData.email,
            token: userData.pushToken
          });
          userInfo.tokenStatus = '✅ 유효';
        } else {
          stats.invalidTokens.push({
            userId,
            email: userData.email,
            token: userData.pushToken
          });
          userInfo.tokenStatus = '❌ 무효';
        }
      } else {
        stats.withoutPushToken++;
        userInfo.tokenStatus = '⭕ 없음';
      }
      
      stats.userDetails.push(userInfo);
    }
    
    // 결과 출력
    console.log('📊 푸시 토큰 등록 현황');
    console.log('='.repeat(50));
    console.log(`총 사용자 수: ${stats.totalUsers}명`);
    console.log(`푸시 토큰 등록됨: ${stats.withPushToken}명`);
    console.log(`푸시 토큰 없음: ${stats.withoutPushToken}명`);
    console.log(`유효한 토큰: ${stats.validTokens.length}명`);
    console.log(`무효한 토큰: ${stats.invalidTokens.length}명`);
    console.log('');
    
    // 사용자별 상세 정보
    console.log('👥 사용자별 상세 정보');
    console.log('='.repeat(80));
    stats.userDetails.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName} (${user.email})`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   로그인 방식: ${user.provider}`);
      console.log(`   푸시 토큰: ${user.tokenStatus}`);
      console.log(`   최근 로그인: ${user.lastLoginAt}`);
      console.log(`   가입일: ${user.createdAt}`);
      
      if (user.notificationSettings) {
        console.log(`   알림 설정: 활성화 (예약: ${user.notificationSettings.reservationUpdates ? 'ON' : 'OFF'}, 마케팅: ${user.notificationSettings.promotions ? 'ON' : 'OFF'})`);
      } else {
        console.log(`   알림 설정: 미설정`);
      }
      
      if (user.pushToken) {
        console.log(`   토큰: ${user.pushToken.substring(0, 30)}...`);
      }
      console.log('');
    });
    
    // 문제 진단
    console.log('🔍 문제 진단');
    console.log('='.repeat(50));
    
    if (stats.withoutPushToken > 0) {
      console.log(`❌ ${stats.withoutPushToken}명의 사용자에게 푸시 토큰이 등록되지 않았습니다.`);
      console.log('   원인:');
      console.log('   - 시뮬레이터에서 테스트 (실제 디바이스 필요)');
      console.log('   - 알림 권한 거부');
      console.log('   - 앱에서 registerForPushNotifications 호출 안됨');
      console.log('   - EAS projectId 설정 누락');
      console.log('');
    }
    
    if (stats.invalidTokens.length > 0) {
      console.log(`❌ ${stats.invalidTokens.length}명의 사용자에게 무효한 토큰이 저장되어 있습니다.`);
      stats.invalidTokens.forEach(token => {
        console.log(`   - ${token.email}: ${token.token}`);
      });
      console.log('');
    }
    
    if (stats.validTokens.length === 1) {
      console.log('⚠️  유효한 토큰이 1개만 있습니다. 이것이 푸시 알림이 본인에게만 오는 원인일 수 있습니다.');
      console.log(`   유일한 토큰 소유자: ${stats.validTokens[0].email}`);
      console.log('');
    }
    
    // 해결 방안 제시
    console.log('💡 해결 방안');
    console.log('='.repeat(50));
    console.log('1. 다른 사용자들이 실제 디바이스에서 앱에 로그인했는지 확인');
    console.log('2. 푸시 알림 권한을 허용했는지 확인');
    console.log('3. 앱의 NotificationInitializer가 제대로 작동하는지 확인');
    console.log('4. EAS projectId가 올바르게 설정되었는지 확인');
    console.log('5. Firebase Console > Cloud Messaging에서 테스트 토큰으로 직접 전송 테스트');
    
  } catch (error) {
    console.error('❌ 푸시 토큰 확인 중 오류 발생:', error);
  }
}

// 스크립트 실행
checkPushTokens()
  .then(() => {
    console.log('\n✅ 푸시 토큰 확인 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });