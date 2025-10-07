import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import notificationService, { NotificationSettings } from '../services/notificationService';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: true,
    reservation: true,
    report: true,
    announcement: true,
    marketing: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [isAuthenticated, user]); // 인증 상태나 사용자가 변경되면 설정 다시 로드

  const loadSettings = async () => {
    console.log('🔍 SettingsScreen: loadSettings 시작', { 
      isAuthenticated, 
      userUid: user?.uid 
    });

    if (!isAuthenticated || !user) {
      console.log('❌ SettingsScreen: 인증되지 않은 상태로 설정 로드 건너뜀');
      setIsLoading(false);
      return;
    }

    try {
      console.log('📥 SettingsScreen: notificationService.getNotificationSettings 호출 중...');
      const settings = await notificationService.getNotificationSettings(user.uid);
      console.log('✅ SettingsScreen: 설정 로드 성공:', settings);
      setNotificationSettings(settings);
    } catch (error) {
      console.error('❌ SettingsScreen: 설정 불러오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    console.log('🔧 SettingsScreen: saveSettings 호출됨', { 
      isAuthenticated, 
      userUid: user?.uid, 
      newSettings 
    });

    if (!isAuthenticated || !user) {
      console.log('❌ SettingsScreen: 인증되지 않은 사용자');
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      console.log('📤 SettingsScreen: notificationService.saveNotificationSettings 호출 중...');
      await notificationService.saveNotificationSettings(user.uid, newSettings);
      console.log('✅ SettingsScreen: 설정 저장 성공, 로컬 상태 업데이트 중...');
      setNotificationSettings(newSettings);
      console.log('✅ SettingsScreen: 모든 저장 과정 완료');
    } catch (error) {
      console.error('❌ SettingsScreen: 설정 저장 실패:', error);
      Alert.alert('오류', '설정을 저장할 수 없습니다.');
    }
  };

  const handleToggleSetting = (
    settingKey: keyof NotificationSettings,
    value: boolean
  ) => {
    const newSettings = { ...notificationSettings, [settingKey]: value };
    saveSettings(newSettings);
    
    if (settingKey === 'enabled' && value) {
      Alert.alert(
        '푸시 알림 활성화',
        '예약 상태 변경, 새로운 공지사항 등을 푸시 알림으로 받으실 수 있습니다.',
        [{ text: '확인' }]
      );
    }
  };

  const openLink = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('오류', `${title} 링크를 열 수 없습니다.`);
      }
    } catch (error) {
      console.error('링크 열기 실패:', error);
      Alert.alert('오류', `${title} 링크를 열 수 없습니다.`);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="설정" 
          showLogo={false} 
          showBackButton={true} 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>설정을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="설정" 
        showLogo={false} 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        {/* 알림 설정 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color="#4495E8" />
            <Text style={styles.sectionTitle}>알림 설정</Text>
          </View>
          
          {/* 전체 알림 */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>전체 알림</Text>
              <Text style={styles.settingDescription}>
                모든 푸시 알림을 활성화/비활성화합니다
              </Text>
            </View>
            <Switch
              value={notificationSettings.enabled}
              onValueChange={(value) => handleToggleSetting('enabled', value)}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={notificationSettings.enabled ? '#4495E8' : '#9CA3AF'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>
          
          {/* 예약 관련 알림 */}
          <View style={[styles.settingItem, !notificationSettings.enabled && styles.disabledItem]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, !notificationSettings.enabled && styles.disabledText]}>예약 관련 알림</Text>
              <Text style={[styles.settingDescription, !notificationSettings.enabled && styles.disabledText]}>
                예약 접수, 확정, 완료 등 예약 상태 변경 알림
              </Text>
            </View>
            <Switch
              value={notificationSettings.reservation}
              onValueChange={(value) => handleToggleSetting('reservation', value)}
              disabled={!notificationSettings.enabled}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={notificationSettings.reservation && notificationSettings.enabled ? '#4495E8' : '#9CA3AF'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* 진단 리포트 알림 */}
          <View style={[styles.settingItem, !notificationSettings.enabled && styles.disabledItem]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, !notificationSettings.enabled && styles.disabledText]}>진단 리포트 알림</Text>
              <Text style={[styles.settingDescription, !notificationSettings.enabled && styles.disabledText]}>
                진단 리포트 등록 완료 알림
              </Text>
            </View>
            <Switch
              value={notificationSettings.report}
              onValueChange={(value) => handleToggleSetting('report', value)}
              disabled={!notificationSettings.enabled}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={notificationSettings.report && notificationSettings.enabled ? '#4495E8' : '#9CA3AF'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* 공지사항 알림 */}
          <View style={[styles.settingItem, !notificationSettings.enabled && styles.disabledItem]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, !notificationSettings.enabled && styles.disabledText]}>공지사항 알림</Text>
              <Text style={[styles.settingDescription, !notificationSettings.enabled && styles.disabledText]}>
                새로운 공지사항 및 업데이트 알림
              </Text>
            </View>
            <Switch
              value={notificationSettings.announcement}
              onValueChange={(value) => handleToggleSetting('announcement', value)}
              disabled={!notificationSettings.enabled}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={notificationSettings.announcement && notificationSettings.enabled ? '#4495E8' : '#9CA3AF'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* 마케팅 알림 */}
          <View style={[styles.settingItem, !notificationSettings.enabled && styles.disabledItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, !notificationSettings.enabled && styles.disabledText]}>마케팅 알림</Text>
              <Text style={[styles.settingDescription, !notificationSettings.enabled && styles.disabledText]}>
                할인, 이벤트 등 마케팅 관련 알림 (선택사항)
              </Text>
            </View>
            <Switch
              value={notificationSettings.marketing}
              onValueChange={(value) => handleToggleSetting('marketing', value)}
              disabled={!notificationSettings.enabled}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={notificationSettings.marketing && notificationSettings.enabled ? '#4495E8' : '#9CA3AF'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>
        </View>

        {/* 개인정보 및 지원 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#4495E8" />
            <Text style={styles.sectionTitle}>개인정보 및 지원</Text>
          </View>
          
          {/* 개인정보처리방침 */}
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('https://www.notion.so/1e3f67248617802985bae5b23476bfba', '개인정보처리방침')}
          >
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>개인정보처리방침</Text>
              <Text style={styles.linkDescription}>개인정보 수집 및 이용에 대한 정책</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 고객지원 */}
          <TouchableOpacity 
            style={[styles.linkItem, { borderBottomWidth: 0 }]}
            onPress={() => openLink('https://charzing.kr/support', '고객지원')}
          >
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>고객지원</Text>
              <Text style={styles.linkDescription}>문의사항 및 도움말</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* 개발자 테스트 섹션 */}
        {isAuthenticated && user && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flask-outline" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>개발자 테스트</Text>
            </View>
            
            {/* 인앱 알림 테스트 */}
            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => {
                notificationService.addInAppNotification(
                  '테스트 인앱 알림',
                  '이것은 직접 추가된 인앱 알림입니다.',
                  'announcement'
                );
                Alert.alert('성공', '인앱 알림이 추가되었습니다. 상단 알림 벨을 확인해보세요.');
              }}
            >
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>인앱 알림 테스트</Text>
                <Text style={styles.linkDescription}>직접 인앱 알림 추가</Text>
              </View>
              <Ionicons name="notifications" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 푸시→인앱 변환 테스트 */}
            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => {
                notificationService.testPushNotificationToInApp(
                  '테스트 푸시 알림',
                  '이것은 푸시 알림을 인앱 알림으로 변환하는 테스트입니다.',
                  'report'
                );
                Alert.alert('성공', '푸시 알림 변환 테스트가 실행되었습니다. 상단 알림 벨을 확인해보세요.');
              }}
            >
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>푸시→인앱 변환 테스트</Text>
                <Text style={styles.linkDescription}>푸시 알림 처리 로직 테스트</Text>
              </View>
              <Ionicons name="refresh" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 로컬 알림 테스트 */}
            <TouchableOpacity 
              style={[styles.linkItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                notificationService.scheduleLocalNotification(
                  '테스트 로컬 알림',
                  '5초 후에 표시되는 로컬 알림입니다.',
                  5
                );
                Alert.alert('성공', '5초 후에 로컬 알림이 표시됩니다.');
              }}
            >
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>로컬 알림 테스트</Text>
                <Text style={styles.linkDescription}>5초 후 로컬 알림 발송</Text>
              </View>
              <Ionicons name="timer" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* 설정 정보 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            알림 설정은 언제든지 변경할 수 있습니다. 전체 알림을 비활성화하면 예약 상태 변경, 리포트 완료 등 중요한 업데이트를 놓칠 수 있습니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  disabledItem: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  infoSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    textAlign: 'center',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  linkDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default SettingsScreen;