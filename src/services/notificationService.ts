import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import firebaseService from './firebaseService';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';
import { store } from '../store';
import { addNotification, markAsRead, setNotifications, InAppNotification } from '../store/slices/notificationSlice';

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

  constructor() {
    this.setupNotificationHandlers();
  }

  // 알림 핸들러 설정
  private setupNotificationHandlers() {
    console.log('🔧 NotificationService: 알림 핸들러 설정 중...');
    
    // 앱이 포그라운드에 있을 때 알림 표시 방법
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('🔔 NotificationService: 포그라운드 알림 수신:', notification.request.content.title);
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });

    // 푸시 알림 수신 시 인앱 알림으로 변환
    console.log('📥 NotificationService: 알림 수신 리스너 등록 중...');
    this.addNotificationReceivedListener((notification) => {
      console.log('📨 NotificationService: 알림 수신됨:', notification.request.content.title);
      this.handleIncomingNotification(notification);
    });

    // 알림 탭 처리
    console.log('👆 NotificationService: 알림 응답 리스너 등록 중...');
    this.addNotificationResponseReceivedListener((response) => {
      console.log('👆 NotificationService: 알림 탭됨:', response.notification.request.content.title);
      this.handleNotificationResponse(response);
    });

    console.log('✅ NotificationService: 모든 알림 핸들러 설정 완료');
  }

  // 푸시 알림 권한 요청 및 토큰 등록
  async registerForPushNotifications(userId: string): Promise<string | null> {
    try {
      let token = null;

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
          console.log('푸시 알림 권한이 거부되었습니다.');
          return null;
        }

        // projectId가 있는지 확인
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
          console.log('⚠️  EAS projectId가 설정되지 않았습니다.');
          return null;
        }

        // Expo 푸시 토큰 생성
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
        
        token = tokenData.data;
        this.expoPushToken = token;

        console.log('✅ Expo 푸시 토큰 생성 성공:', token);

        // 토큰을 Firestore에 저장
        await firebaseService.saveUserPushToken(userId, token);
        
        // 기존 설정이 없는 경우에만 기본 알림 설정 저장
        const existingSettings = await firebaseService.getUserNotificationSettings(userId);
        if (!existingSettings) {
          console.log('🆕 신규 사용자: 기본 알림 설정 저장');
          await this.saveNotificationSettings(userId, DEFAULT_NOTIFICATION_SETTINGS);
        } else {
          console.log('✅ 기존 사용자: 알림 설정 유지됨');
        }

      } else {
        console.log('⚠️  푸시 알림은 실제 디바이스에서만 작동합니다.');
        console.log('📱 실제 디바이스에서 앱을 실행하면 푸시 토큰이 자동으로 생성됩니다.');
        
        // 기존 설정이 없는 경우에만 기본 알림 설정 저장 (토큰 없이)
        const existingSettings = await firebaseService.getUserNotificationSettings(userId);
        if (!existingSettings) {
          console.log('🆕 신규 사용자 (에뮬레이터): 기본 알림 설정 저장');
          await this.saveNotificationSettings(userId, DEFAULT_NOTIFICATION_SETTINGS);
        } else {
          console.log('✅ 기존 사용자 (에뮬레이터): 알림 설정 유지됨');
        }
      }

      return token;
    } catch (error) {
      console.error('❌ 푸시 알림 등록 실패:', error);
      if (error instanceof Error) {
        console.error('오류 메시지:', error.message);
        console.error('오류 스택:', error.stack);
      }
      return null;
    }
  }

  // 사용자 알림 설정 저장
  async saveNotificationSettings(userId: string, settings: NotificationSettings): Promise<void> {
    try {
      console.log('📤 NotificationService: saveNotificationSettings 시작', { userId, settings });
      await firebaseService.saveUserNotificationSettings(userId, settings);
      console.log('✅ NotificationService: 알림 설정 저장 완료');
    } catch (error) {
      console.error('❌ NotificationService: 알림 설정 저장 실패:', error);
      throw error; // 에러를 다시 던져서 상위에서 처리할 수 있도록
    }
  }

  // 사용자 알림 설정 조회
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      console.log('📥 NotificationService: getNotificationSettings 시작', { userId });
      const settings = await firebaseService.getUserNotificationSettings(userId);
      console.log('📋 NotificationService: Firebase에서 받은 설정:', settings);
      const result = settings || DEFAULT_NOTIFICATION_SETTINGS;
      console.log('✅ NotificationService: 반환할 최종 설정:', result);
      return result;
    } catch (error) {
      console.error('❌ NotificationService: 알림 설정 조회 실패:', error);
      console.log('🔄 NotificationService: 기본 설정 반환:', DEFAULT_NOTIFICATION_SETTINGS);
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
      console.log(`✅ ${settingKey} 알림 설정 변경: ${value}`);
    } catch (error) {
      console.error('❌ 알림 설정 변경 실패:', error);
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
      console.log('🔄 NotificationService: 인앱 알림 변환 시작');
      console.log('📦 NotificationService: 수신된 알림 데이터:', JSON.stringify({
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data
      }, null, 2));

      const { title, body, data } = notification.request.content;
      
      if (!title || !body) {
        console.log('⚠️  NotificationService: 제목 또는 내용이 없어서 처리 건너뜀');
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

      console.log(`📂 NotificationService: 카테고리 결정됨: ${category}`);

      // Redux store에 인앱 알림 추가
      const notificationPayload = {
        title,
        body,
        category,
        data: data || {},
      };

      console.log('📤 NotificationService: Redux store에 알림 추가 중...', notificationPayload);
      store.dispatch(addNotification(notificationPayload));

      console.log('✅ NotificationService: 푸시 알림을 인앱 알림으로 변환 완료:', title);
    } catch (error) {
      console.error('❌ NotificationService: 푸시 알림 처리 실패:', error);
      if (error instanceof Error) {
        console.error('오류 스택:', error.stack);
      }
    }
  }

  // 알림 탭 시 처리 (필요시 특정 화면으로 네비게이션)
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    try {
      const { data } = response.notification.request.content;
      
      console.log('📱 알림 탭됨:', data);
      
      // 여기서 특정 데이터에 따라 네비게이션 처리 가능
      // 예: 예약 관련 알림이면 예약 상세 화면으로 이동
      if (data?.reservationId) {
        // navigation.navigate('ReservationDetail', { id: data.reservationId });
      } else if (data?.reportId) {
        // navigation.navigate('ReportDetail', { id: data.reportId });
      }
      
    } catch (error) {
      console.error('❌ 알림 응답 처리 실패:', error);
    }
  }

  // Firebase에서 인앱 알림 불러오기
  async loadInAppNotifications(userId: string): Promise<void> {
    try {
      console.log('📥 Firebase에서 인앱 알림 불러오는 중...', userId);
      
      const notificationsRef = query(
        collection(db, 'users', userId, 'inAppNotifications'),
        orderBy('createdAt', 'desc'),
        limit(50) // 최근 50개만 불러오기
      );

      const snapshot = await getDocs(notificationsRef);
      
      if (snapshot.empty) {
        console.log('📪 저장된 인앱 알림이 없습니다');
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

      console.log(`📥 ${notifications.length}개의 인앱 알림 불러오기 완료`);
      
      // Redux store에 알림들 설정
      store.dispatch(setNotifications(notifications));
      
    } catch (error) {
      console.error('❌ 인앱 알림 불러오기 실패:', error);
    }
  }

  // 인앱 알림을 읽음으로 표시하고 Firebase에도 반영
  async markInAppNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      // Redux store 업데이트
      store.dispatch(markAsRead(notificationId));
      
      // Firebase에도 반영
      await updateDoc(
        doc(db, 'users', userId, 'inAppNotifications', notificationId),
        { isRead: true }
      );
        
      console.log('✅ 알림 읽음 처리 완료:', notificationId);
    } catch (error) {
      console.error('❌ 알림 읽음 처리 실패:', error);
    }
  }

  // 수동으로 인앱 알림 추가 (테스트용)
  addInAppNotification(
    title: string,
    body: string,
    category: InAppNotification['category'] = 'announcement',
    data?: any
  ) {
    console.log('➕ NotificationService: 수동 인앱 알림 추가:', { title, body, category });
    store.dispatch(addNotification({
      title,
      body,
      category,
      data: data || {},
    }));
    console.log('✅ NotificationService: 인앱 알림 추가 완료');
  }

  // 알림 시스템 테스트용 푸시 알림 시뮬레이션
  async testPushNotificationToInApp(
    title: string = '테스트 푸시 알림',
    body: string = '이것은 푸시 알림을 인앱 알림으로 변환하는 테스트입니다.',
    category: InAppNotification['category'] = 'announcement'
  ) {
    console.log('🧪 NotificationService: 푸시 알림 변환 테스트 시작');
    
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
    
    console.log('🧪 NotificationService: 푸시 알림 변환 테스트 완료');
  }
}

// 싱글톤 인스턴스
const notificationService = new NotificationService();
export default notificationService;