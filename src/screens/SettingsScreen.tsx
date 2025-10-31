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
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import notificationService, { NotificationSettings } from '../services/notificationService';
import firebaseService from '../services/firebaseService';
import authPersistenceService from '../services/authPersistenceService';
import devLog from '../utils/devLog';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
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
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    try {
      const settings = await notificationService.getNotificationSettings(user.uid);
      setNotificationSettings(settings);
    } catch (error) {
      devLog.error('❌ SettingsScreen: 설정 불러오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    if (!isAuthenticated || !user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      await notificationService.saveNotificationSettings(user.uid, newSettings);
      setNotificationSettings(newSettings);
    } catch (error) {
      devLog.error('❌ SettingsScreen: 설정 저장 실패:', error);
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
      Alert.alert('오류', `${title} 링크를 열 수 없습니다.`);
    }
  };

  const handleDeleteAccount = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    Alert.alert(
      '회원탈퇴',
      '정말로 탈퇴하시겠습니까?\n\n⚠️ 주의사항:\n• 모든 데이터가 영구적으로 삭제됩니다\n• 예약 내역, 진단 리포트 등이 모두 삭제됩니다\n• 이 작업은 되돌릴 수 없습니다',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            try {
              devLog.log('회원탈퇴 시작...');

              // Firestore에서 사용자 데이터 삭제
              await firebaseService.deleteUser(user.uid);

              // Firebase Auth 로그아웃
              await firebaseService.signOut();

              // 커스텀 persistence 데이터 삭제
              await authPersistenceService.clearAuthState();

              // Redux 상태 초기화
              dispatch(logout());

              devLog.log('✅ 회원탈퇴 완료');

              Alert.alert('탈퇴 완료', '회원탈퇴가 완료되었습니다.');

              // 홈으로 이동
              navigation.navigate('Home' as never);
            } catch (error) {
              devLog.error('회원탈퇴 오류:', error);
              Alert.alert('오류', '회원탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
          },
        },
      ]
    );
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
            <Ionicons name="notifications-outline" size={20} color="#06B6D4" />
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
              trackColor={{ false: '#E5E7EB', true: '#06B6D4' }}
              thumbColor={notificationSettings.enabled ? '#06B6D4' : '#9CA3AF'}
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
              trackColor={{ false: '#E5E7EB', true: '#06B6D4' }}
              thumbColor={notificationSettings.reservation && notificationSettings.enabled ? '#06B6D4' : '#9CA3AF'}
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
              trackColor={{ false: '#E5E7EB', true: '#06B6D4' }}
              thumbColor={notificationSettings.report && notificationSettings.enabled ? '#06B6D4' : '#9CA3AF'}
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
              trackColor={{ false: '#E5E7EB', true: '#06B6D4' }}
              thumbColor={notificationSettings.announcement && notificationSettings.enabled ? '#06B6D4' : '#9CA3AF'}
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
              trackColor={{ false: '#E5E7EB', true: '#06B6D4' }}
              thumbColor={notificationSettings.marketing && notificationSettings.enabled ? '#06B6D4' : '#9CA3AF'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>
        </View>

        {/* 개인정보 및 지원 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#06B6D4" />
            <Text style={styles.sectionTitle}>개인정보 및 지원</Text>
          </View>
          
          {/* 서비스 이용 정책 */}
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => navigation.navigate('PolicyList' as never)}
          >
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>서비스 이용 정책</Text>
              <Text style={styles.linkDescription}>이용약관, 개인정보처리방침, 면책조항, 환불 정책</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 고객지원 */}
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => openLink('https://charzing.kr/support', '고객지원')}
          >
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>고객지원</Text>
              <Text style={styles.linkDescription}>문의사항 및 도움말</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 회원탈퇴 */}
          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.linkItem, { borderBottomWidth: 0 }]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.linkInfo}>
                <Text style={[styles.linkTitle, styles.deleteText]}>회원탈퇴</Text>
                <Text style={styles.linkDescription}>계정 및 모든 데이터 삭제</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        
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
  deleteText: {
    color: '#EF4444',
  },
});

export default SettingsScreen;