import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import firebaseService from './firebaseService';
import { getDb } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, writeBatch, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { store } from '../store';
import { addNotification, markAsRead, markAllAsRead, setNotifications, removeNotification, InAppNotification } from '../store/slices/notificationSlice';
import { devLog } from '../utils/devLog';

// 알림 설정 인터페이스
export interface NotificationSettings {
  enabled: boolean;
  reservation: boolean;
  report: boolean;
  announcement: boolean;
  marketing: boolean;
  timeRange?: {
    start: string;
    end: string;
  };
}

// 기본 알림 설정
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  reservation: true,
  report: true,
  announcement: true,
  marketing: false,
};

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Unsubscribe | null = null;
  private currentUserId: string | null = null;

  constructor() {
    this.setupNotificationHandlers();
  }

  // 알림 핸들러 설정
  private setupNotificationHandlers() {
    devLog.log('🔧 NotificationService: 알림 핸들러 설정 중...');
    
    // 앱이 포그라운드에 있을 때 알림 표시 방법
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        devLog.log('🔔 NotificationService: 포그라운드 알림 수신:', notification.request.content.title);
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });

    // 푸시 알림 수신 시 처리 (인앱알림 변환 제거)
    devLog.log('📥 NotificationService: 푸시 알림 수신 리스너 등록 중...');
    this.addNotificationReceivedListener((notification) => {
      devLog.log('📨 NotificationService: 푸시 알림 수신됨:', notification.request.content.title);
      // 더 이상 인앱알림으로 변환하지 않음 - Firebase에서 직접 로드
      devLog.log('ℹ️  NotificationService: 인앱알림은 Firebase에서 직접 로드됩니다.');
    });

    // 알림 탭 처리
    devLog.log('👆 NotificationService: 알림 응답 리스너 등록 중...');
    this.addNotificationResponseReceivedListener((response) => {
      devLog.log('👆 NotificationService: 알림 탭됨:', response.notification.request.content.title);
      this.handleNotificationResponse(response);
    });

    devLog.log('✅ NotificationService: 모든 알림 핸들러 설정 완료');
  }

  // 푸시 알림 권한 요청 및 토큰 등록
  async registerForPushNotifications(userId: string): Promise<string | null> {
    try {
      let token = null;

      devLog.log('🔔 푸시 알림 등록 시작', {
        userId,
        isDevice: Device.isDevice,
        deviceType: Device.deviceType,
        osName: Device.osName,
        osVersion: Device.osVersion
      });

      // 실제 디바이스에서만 푸시 토큰 생성
      if (Device.isDevice) {
        // 알림 권한 요청
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          devLog.log('❌ 푸시 알림 권한이 거부되었습니다.', {
            userId,
            existingStatus,
            finalStatus,
            device: Device.deviceName
          });
          return null;
        }

        devLog.log('✅ 푸시 알림 권한 획득 성공', {
          userId,
          status: finalStatus,
          device: Device.deviceName
        });

        // projectId가 있는지 확인
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
          devLog.log('⚠️  EAS projectId가 설정되지 않았습니다.');
          return null;
        }

        // Expo 푸시 토큰 생성
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
        
        token = tokenData.data;
        this.expoPushToken = token;

        devLog.log('✅ Expo 푸시 토큰 생성 성공:', token);

        // 토큰을 Firestore에 저장
        await firebaseService.saveUserPushToken(userId, token);
        
        // 기존 설정이 없는 경우에만 기본 알림 설정 저장
        const existingSettings = await firebaseService.getUserNotificationSettings(userId);
        if (!existingSettings) {
          devLog.log('🆕 신규 사용자: 기본 알림 설정 저장');
          await this.saveNotificationSettings(userId, DEFAULT_NOTIFICATION_SETTINGS);
        } else {
          devLog.log('✅ 기존 사용자: 알림 설정 유지됨');
        }

        // 실시간 인앱 알림 리스너 시작 (푸시 토큰과 독립적으로)
        this.startRealtimeNotificationListener(userId);

      } else {
        devLog.log('⚠️  푸시 알림은 실제 디바이스에서만 작동합니다.');
        devLog.log('📱 실제 디바이스에서 앱을 실행하면 푸시 토큰이 자동으로 생성됩니다.');
        
        // 기존 설정이 없는 경우에만 기본 알림 설정 저장 (토큰 없이)
        const existingSettings = await firebaseService.getUserNotificationSettings(userId);
        if (!existingSettings) {
          devLog.log('🆕 신규 사용자 (에뮬레이터): 기본 알림 설정 저장');
          await this.saveNotificationSettings(userId, DEFAULT_NOTIFICATION_SETTINGS);
        } else {
          devLog.log('✅ 기존 사용자 (에뮬레이터): 알림 설정 유지됨');
        }

        // 실시간 인앱 알림 리스너 시작 (푸시 토큰 없어도 동작)
        this.startRealtimeNotificationListener(userId);
      }

      return token;
    } catch (error) {
      devLog.error('❌ 푸시 알림 등록 실패:', error);
      if (error instanceof Error) {
        devLog.error('오류 메시지:', error.message);
        devLog.error('오류 스택:', error.stack);
      }
      return null;
    }
  }

  // 사용자 알림 설정 저장
  async saveNotificationSettings(userId: string, settings: NotificationSettings): Promise<void> {
    try {
      devLog.log('📤 NotificationService: saveNotificationSettings 시작', { userId, settings });
      await firebaseService.saveUserNotificationSettings(userId, settings);
      devLog.log('✅ NotificationService: 알림 설정 저장 완료');
    } catch (error) {
      devLog.error('❌ NotificationService: 알림 설정 저장 실패:', error);
      throw error; // 에러를 다시 던져서 상위에서 처리할 수 있도록
    }
  }

  // 사용자 알림 설정 조회
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      devLog.log('📥 NotificationService: getNotificationSettings 시작', { userId });
      const settings = await firebaseService.getUserNotificationSettings(userId);
      devLog.log('📋 NotificationService: Firebase에서 받은 설정:', settings);
      const result = settings || DEFAULT_NOTIFICATION_SETTINGS;
      devLog.log('✅ NotificationService: 반환할 최종 설정:', result);
      return result;
    } catch (error) {
      devLog.error('❌ NotificationService: 알림 설정 조회 실패:', error);
      devLog.log('🔄 NotificationService: 기본 설정 반환:', DEFAULT_NOTIFICATION_SETTINGS);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  // 특정 타입의 알림 설정 토글
  async toggleNotificationSetting(
    userId: string, 
    settingKey: keyof Omit<NotificationSettings, 'timeRange'>, 
    value: boolean
  ): Promise<void> {
    try {
      const currentSettings = await this.getNotificationSettings(userId);
      const updatedSettings = { ...currentSettings, [settingKey]: value };
      await this.saveNotificationSettings(userId, updatedSettings);
      devLog.log(`✅ ${settingKey} 알림 설정 변경: ${value}`);
    } catch (error) {
      devLog.error('❌ 알림 설정 변경 실패:', error);
    }
  }

  // 로컬 알림 스케줄링 (테스트용)
  async scheduleLocalNotification(title: string, body: string, seconds = 5): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: { type: 'timeInterval', seconds } as Notifications.TimeIntervalTriggerInput,
    });
    return id;
  }

  // 알림 리스너 등록
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // 배지 카운트 설정 (iOS)
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  }

  // 모든 알림 취소
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // 현재 푸시 토큰 반환
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // 수신된 푸시 알림을 인앱 알림으로 변환
  private handleIncomingNotification(notification: Notifications.Notification) {
    try {
      devLog.log('🔄 NotificationService: 인앱 알림 변환 시작');
      devLog.log('📦 NotificationService: 수신된 알림 데이터:', JSON.stringify({
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data
      }, null, 2));

      const { title, body, data } = notification.request.content;
      
      if (!title || !body) {
        devLog.log('⚠️  NotificationService: 제목 또는 내용이 없어서 처리 건너뜀');
        return;
      }

      // 카테고리 결정 (data에서 category 추출 또는 기본값 사용)
      let category: InAppNotification['category'] = 'announcement';
      if (data?.category) {
        category = data.category as InAppNotification['category'];
      } else if (data?.reservationId) {
        category = 'reservation';
      } else if (data?.reportId) {
        category = 'report';
      }

      devLog.log(`📂 NotificationService: 카테고리 결정됨: ${category}`);

      // Redux store에 인앱 알림 추가
      const notificationPayload = {
        title,
        body,
        category,
        data: data || {},
      };

      devLog.log('📤 NotificationService: Redux store에 알림 추가 중...', notificationPayload);
      store.dispatch(addNotification(notificationPayload));

      devLog.log('✅ NotificationService: 푸시 알림을 인앱 알림으로 변환 완료:', title);
    } catch (error) {
      devLog.error('❌ NotificationService: 푸시 알림 처리 실패:', error);
      if (error instanceof Error) {
        devLog.error('오류 스택:', error.stack);
      }
    }
  }

  // 알림 탭 시 처리 (필요시 특정 화면으로 네비게이션)
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    try {
      const { data } = response.notification.request.content;
      
      devLog.log('📱 알림 탭됨:', data);
      
      // 여기서 특정 데이터에 따라 네비게이션 처리 가능
      // 예: 예약 관련 알림이면 예약 상세 화면으로 이동
      if (data?.reservationId) {
        // navigation.navigate('ReservationDetail', { id: data.reservationId });
      } else if (data?.reportId) {
        // navigation.navigate('ReportDetail', { id: data.reportId });
      }
      
    } catch (error) {
      devLog.error('❌ 알림 응답 처리 실패:', error);
    }
  }

  // Firebase에서 인앱 알림 불러오기
  async loadInAppNotifications(userId: string): Promise<void> {
    try {
      devLog.log('📥 Firebase에서 인앱 알림 불러오는 중...', userId);
      
      const notificationsRef = query(
        collection(getDb(), 'users', userId, 'inAppNotifications'),
        orderBy('createdAt', 'desc'),
        limit(50) // 최근 50개만 불러오기
      );

      const snapshot = await getDocs(notificationsRef);
      
      if (snapshot.empty) {
        devLog.log('📪 저장된 인앱 알림이 없습니다');
        return;
      }

      const notifications: InAppNotification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          title: data.title,
          body: data.body,
          category: data.category || 'announcement',
          data: data.data || {},
          isRead: data.isRead || false,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      devLog.log(`📥 ${notifications.length}개의 인앱 알림 불러오기 완료`);
      
      // Redux store에 알림들 설정
      store.dispatch(setNotifications(notifications));
      
    } catch (error) {
      devLog.error('❌ 인앱 알림 불러오기 실패:', error);
    }
  }

  // 인앱 알림을 읽음으로 표시하고 Firebase에도 반영
  async markInAppNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      // Redux store 업데이트
      store.dispatch(markAsRead(notificationId));
      
      // Firebase에도 반영
      await updateDoc(
        doc(getDb(), 'users', userId, 'inAppNotifications', notificationId),
        { isRead: true }
      );
        
      devLog.log('✅ 알림 읽음 처리 완료:', notificationId);
    } catch (error) {
      devLog.error('❌ 알림 읽음 처리 실패:', error);
    }
  }

  // 모든 인앱 알림을 읽음으로 표시
  async markAllInAppNotificationsAsRead(userId: string): Promise<void> {
    try {
      // Redux store에서 읽지 않은 알림들 가져오기
      const state = store.getState();
      const unreadNotifications = state.notification.notifications.filter(n => !n.isRead);
      
      if (unreadNotifications.length === 0) {
        devLog.log('읽지 않은 알림이 없습니다.');
        return;
      }

      // Redux store 업데이트
      store.dispatch(markAllAsRead());

      // Firebase에서 배치 업데이트 (안전한 처리)
      const batch = writeBatch(getDb());
      let updateCount = 0;
      
      for (const notification of unreadNotifications) {
        try {
          const notificationRef = doc(getDb(), 'users', userId, 'inAppNotifications', notification.id);
          // set으로 변경하여 문서가 없어도 생성되도록 함
          batch.set(notificationRef, {
            ...notification,
            isRead: true,
            updatedAt: new Date()
          }, { merge: true });
          updateCount++;
        } catch (error) {
          devLog.warn(`⚠️ 알림 ${notification.id} 업데이트 건너뜀:`, error);
        }
      }
      
      if (updateCount > 0) {
        await batch.commit();
        devLog.log(`✅ ${updateCount}개 알림 모두 읽음 처리 완료`);
      } else {
        devLog.log('업데이트할 알림이 없습니다.');
      }
    } catch (error) {
      devLog.error('❌ 모든 알림 읽음 처리 실패:', error);
    }
  }

  // 인앱 알림 삭제하고 Firebase에도 반영
  async removeInAppNotification(userId: string, notificationId: string): Promise<void> {
    try {
      // Redux store에서 먼저 제거
      store.dispatch(removeNotification(notificationId));
      
      // Firebase에서도 문서 삭제
      await deleteDoc(doc(getDb(), 'users', userId, 'inAppNotifications', notificationId));
        
      devLog.log('✅ 알림 삭제 완료:', notificationId);
    } catch (error) {
      devLog.error('❌ 알림 삭제 실패:', error);
      // Firebase 삭제 실패 시에도 Redux는 이미 삭제된 상태이므로 에러 로그만 출력
    }
  }

  // 수동으로 인앱 알림 추가 (테스트용)
  addInAppNotification(
    title: string,
    body: string,
    category: InAppNotification['category'] = 'announcement',
    data?: any
  ) {
    devLog.log('➕ NotificationService: 수동 인앱 알림 추가:', { title, body, category });
    store.dispatch(addNotification({
      title,
      body,
      category,
      data: data || {},
    }));
    devLog.log('✅ NotificationService: 인앱 알림 추가 완료');
  }

  // 실시간 인앱 알림 리스너 시작
  startRealtimeNotificationListener(userId: string): void {
    this.currentUserId = userId;
    
    // 기존 리스너 정리
    if (this.notificationListener) {
      this.notificationListener();
    }

    devLog.log('🔄 NotificationService: 실시간 인앱 알림 리스너 시작');
    
    try {
      const notificationsRef = query(
        collection(getDb(), 'users', userId, 'inAppNotifications'),
        orderBy('createdAt', 'desc'),
        limit(50) // 최근 50개만
      );

      this.notificationListener = onSnapshot(
        notificationsRef,
        (snapshot) => {
          devLog.log(`🔔 NotificationService: 실시간 알림 업데이트 감지 (${snapshot.size}개)`);
          
          const notifications: InAppNotification[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            notifications.push({
              id: doc.id,
              title: data.title,
              body: data.body,
              category: data.category || 'announcement',
              data: data.data || {},
              isRead: data.isRead || false,
              createdAt: data.createdAt?.toDate() || new Date(),
            });
          });

          devLog.log(`✅ NotificationService: ${notifications.length}개의 실시간 알림 업데이트 완료`);
          
          // Redux store에 알림들 설정
          store.dispatch(setNotifications(notifications));
        },
        (error) => {
          devLog.error('❌ NotificationService: 실시간 알림 리스너 오류:', error);
        }
      );
      
      devLog.log('✅ NotificationService: 실시간 알림 리스너 등록 완료');
    } catch (error) {
      devLog.error('❌ NotificationService: 실시간 알림 리스너 시작 실패:', error);
    }
  }

  // 실시간 리스너 중지
  stopRealtimeNotificationListener(): void {
    if (this.notificationListener) {
      this.notificationListener();
      this.notificationListener = null;
      this.currentUserId = null;
      devLog.log('🛑 NotificationService: 실시간 인앱 알림 리스너 중지');
    }
  }

  // 수동 새로고침 (백업용 - 이제 거의 필요없음)
  async refreshInAppNotifications(): Promise<void> {
    if (this.currentUserId) {
      devLog.log('🔄 NotificationService: 수동 새로고침 실행 (백업)');
      await this.loadInAppNotifications(this.currentUserId);
    } else {
      devLog.log('⚠️  NotificationService: 사용자 ID가 없어서 새로고침 불가');
    }
  }

  // 알림 시스템 테스트용 푸시 알림 시뮬레이션
  async testPushNotificationToInApp(
    title: string = '테스트 푸시 알림',
    body: string = '이것은 푸시 알림을 인앱 알림으로 변환하는 테스트입니다.',
    category: InAppNotification['category'] = 'announcement'
  ) {
    devLog.log('🧪 NotificationService: 푸시 알림 변환 테스트 시작');
    
    // 가상의 푸시 알림 객체 생성
    const mockNotification = {
      date: Date.now(),
      request: {
        identifier: 'test-notification',
        content: {
          title,
          subtitle: null,
          body,
          data: { category },
          categoryIdentifier: null,
          sound: 'default' as const,
        },
        trigger: null,
      },
    } as unknown as Notifications.Notification;

    // handleIncomingNotification 직접 호출하여 테스트
    this.handleIncomingNotification(mockNotification);
    
    devLog.log('🧪 NotificationService: 푸시 알림 변환 테스트 완료');
  }
}

// 싱글톤 인스턴스
const notificationService = new NotificationService();
export default notificationService;