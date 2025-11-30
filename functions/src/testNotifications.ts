/**
 * 알림 시스템 테스트 스크립트
 *
 * 실행 방법:
 * cd functions
 * npx ts-node src/testNotifications.ts
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// 테스트 대상 사용자 ID
const TEST_USER_ID = 'ZB2ymdWjBkWQjtCU3dYnAlMzSlx1';

/**
 * 인앱 알림 생성 헬퍼 함수
 */
async function createInAppNotification(
  userId: string,
  title: string,
  body: string,
  category: 'reservation' | 'report' | 'announcement' | 'marketing',
  data: any = {}
): Promise<void> {
  const notification = {
    title,
    body,
    category,
    data: {
      ...data,
      category,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('users').doc(userId).collection('inAppNotifications').add(notification);
  console.log(`✅ [${category.toUpperCase()}] ${title}`);
}

/**
 * 푸시 알림 전송 헬퍼 함수 (푸시 토큰이 있는 경우)
 */
async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: any = {}
): Promise<void> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const pushToken = userData?.pushToken;

    if (!pushToken) {
      console.log(`⚠️  푸시 토큰 없음 - 인앱 알림만 저장됨`);
      return;
    }

    const axios = require('axios');
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    console.log(`📤 푸시 알림 전송 완료`);
  } catch (error) {
    console.error(`❌ 푸시 알림 전송 실패:`, error);
  }
}

/**
 * 메인 테스트 함수
 */
async function runNotificationTests() {
  console.log('🧪 알림 시스템 테스트 시작...');
  console.log(`👤 테스트 사용자: ${TEST_USER_ID}\n`);

  try {
    // ========================================
    // 1️⃣ 예약 관련 알림 (category: 'reservation')
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📅 예약 관련 알림 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 예약 생성
    await createInAppNotification(
      TEST_USER_ID,
      '예약 접수 완료',
      '배터리 진단 예약이 접수되었습니다. 관리자 승인 후 확정됩니다.',
      'reservation',
      {
        type: 'reservation_created',
        reservationId: 'test-reservation-001',
        status: 'pending',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // 예약 확정
    await createInAppNotification(
      TEST_USER_ID,
      '예약 확정 안내',
      '진단 예약이 확정되었습니다. 예정된 시간에 전문가가 방문할 예정입니다.',
      'reservation',
      {
        type: 'reservation_status_change',
        reservationId: 'test-reservation-001',
        status: 'confirmed',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // 진단 시작
    await createInAppNotification(
      TEST_USER_ID,
      '진단 시작 안내',
      '전기차 배터리 진단이 시작되었습니다.',
      'reservation',
      {
        type: 'reservation_status_change',
        reservationId: 'test-reservation-001',
        status: 'in_progress',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // 진단 완료
    await createInAppNotification(
      TEST_USER_ID,
      '진단 완료 안내',
      '배터리 진단이 완료되었습니다. 진단 리포트를 확인해보세요.',
      'reservation',
      {
        type: 'reservation_status_change',
        reservationId: 'test-reservation-001',
        status: 'completed',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // 예약 취소
    await createInAppNotification(
      TEST_USER_ID,
      '예약 취소 안내',
      '진단 예약이 취소되었습니다.',
      'reservation',
      {
        type: 'reservation_status_change',
        reservationId: 'test-reservation-002',
        status: 'cancelled',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // ========================================
    // 2️⃣ 리포트 관련 알림 (category: 'report')
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 리포트 관련 알림 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 리포트 검수 중
    await createInAppNotification(
      TEST_USER_ID,
      '진단 리포트 검수 중',
      '전문가가 작성한 진단 리포트를 검수하고 있습니다. 잠시만 기다려주세요.',
      'report',
      {
        type: 'report_status_change',
        reportId: 'test-report-001',
        status: 'pending_review',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // 리포트 발행 완료
    await createInAppNotification(
      TEST_USER_ID,
      '진단 리포트 완료',
      '배터리 진단 리포트가 발행되었습니다. 지금 바로 확인해보세요!',
      'report',
      {
        type: 'report_status_change',
        reportId: 'test-report-001',
        status: 'published',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    // 리포트 반려
    await createInAppNotification(
      TEST_USER_ID,
      '진단 리포트 재검토 필요',
      '리포트 내용 보완이 필요하여 재작성 중입니다. 완료 시 다시 알려드리겠습니다.',
      'report',
      {
        type: 'report_status_change',
        reportId: 'test-report-002',
        status: 'rejected',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // ========================================
    // 3️⃣ 공지사항 알림 (category: 'announcement')
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📢 공지사항 알림 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await createInAppNotification(
      TEST_USER_ID,
      '시스템 업데이트 안내',
      '차징 앱이 업데이트되었습니다. 더욱 편리한 서비스를 경험해보세요.',
      'announcement',
      {
        type: 'system_update',
        version: '1.1.1',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    await createInAppNotification(
      TEST_USER_ID,
      '서비스 점검 안내',
      '12월 1일 02:00~04:00 시스템 점검이 진행됩니다. 이용에 참고 부탁드립니다.',
      'announcement',
      {
        type: 'maintenance',
        startTime: '2025-12-01T02:00:00Z',
        endTime: '2025-12-01T04:00:00Z',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    await createInAppNotification(
      TEST_USER_ID,
      '새로운 기능 추가',
      '이제 진단 리포트를 PDF로 다운로드할 수 있습니다!',
      'announcement',
      {
        type: 'new_feature',
        feature: 'pdf_download',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // ========================================
    // 4️⃣ 마케팅 알림 (category: 'marketing')
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎁 마케팅 알림 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await createInAppNotification(
      TEST_USER_ID,
      '특별 할인 이벤트',
      '12월 한정! 배터리 진단 20% 할인 이벤트를 진행합니다.',
      'marketing',
      {
        type: 'promotion',
        discount: 20,
        validUntil: '2025-12-31',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    await createInAppNotification(
      TEST_USER_ID,
      '친구 추천 이벤트',
      '친구를 초대하고 5,000원 할인 쿠폰을 받아가세요!',
      'marketing',
      {
        type: 'referral',
        reward: 5000,
      }
    );

    await new Promise(resolve => setTimeout(resolve, 500));

    await createInAppNotification(
      TEST_USER_ID,
      '연말 감사 이벤트',
      '올 한해 감사합니다. 특별 무료 점검 이벤트에 응모해보세요!',
      'marketing',
      {
        type: 'event',
        eventName: 'year_end_2025',
      }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    // ========================================
    // 5️⃣ 추가 테스트: 푸시 알림 전송 (토큰이 있는 경우)
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 푸시 알림 전송 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await sendPushNotification(
      TEST_USER_ID,
      '테스트 푸시 알림',
      '푸시 알림이 정상적으로 작동하는지 확인하는 테스트입니다.',
      {
        category: 'announcement',
        type: 'test',
      }
    );

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 모든 알림 테스트 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 전송된 알림 요약:');
    console.log('  - 예약 관련: 5개');
    console.log('  - 리포트 관련: 3개');
    console.log('  - 공지사항: 3개');
    console.log('  - 마케팅: 3개');
    console.log('  - 푸시 알림: 1개');
    console.log('  총 15개 알림 전송 완료\n');

    console.log('💡 앱에서 알림을 확인하려면:');
    console.log('  1. 마이페이지로 이동');
    console.log('  2. 알림 아이콘 클릭');
    console.log('  3. 각 알림을 클릭하여 네비게이션 테스트\n');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    throw error;
  }
}

// 스크립트 실행
runNotificationTests()
  .then(() => {
    console.log('🎉 테스트 스크립트 종료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 치명적 오류:', error);
    process.exit(1);
  });
