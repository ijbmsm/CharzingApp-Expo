import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MotiView } from 'moti';
import { RootState } from '../store';
import { logout, updateUserProfile } from '../store/slices/authSlice';
import Header from '../components/Header';
import firebaseService from '../services/firebaseService';
import authPersistenceService from '../services/authPersistenceService';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import devLog from '../utils/devLog';

type NavigationProp = StackNavigationProp<RootStackParamList>;


// 마이페이지 컴포넌트
const AuthenticatedMyPage: React.FC<{
  user: any;
  onLogout: () => void;
  dispatch: any;
}> = ({ user, onLogout, dispatch }) => {
  const navigation = useNavigation<NavigationProp>();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [_profileLoading, setProfileLoading] = useState(true);

  // 편집 관련 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<'realName' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadUserProfile = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const profile = await firebaseService.getUserProfile(user.uid);
      setFirebaseUser(profile);
    } catch (error) {
      devLog.error('사용자 프로필 로드 실패:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // 편집 시작 함수
  const startEdit = (field: 'realName') => {
    const currentValue = displayUser?.realName || '';

    setEditingField(field);
    setEditValue(currentValue);
    setShowEditModal(true);
  };

  // 편집 저장 함수
  const saveEdit = async () => {
    if (!editingField || !user?.uid) return;

    try {
      setUpdating(true);

      // Firestore 업데이트 데이터 준비
      const updateData: any = {
        uid: user.uid,
        updatedAt: new Date(),
      };

      // 필드에 따라 업데이트
      if (editingField === 'realName') {
        updateData.realName = editValue.trim();
      }

      // Firestore에 직접 업데이트
      await firebaseService.createOrUpdateUser(updateData);

      // Redux 상태 업데이트
      dispatch(updateUserProfile({ [editingField]: editValue.trim() }));

      // 프로필 새로고침
      await loadUserProfile();

      setShowEditModal(false);
      setEditingField(null);
      setEditValue('');

      Alert.alert('성공', '프로필이 업데이트되었습니다.');

    } catch (error) {
      devLog.error('프로필 업데이트 실패:', error);
      Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  // 편집 취소 함수
  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingField(null);
    setEditValue('');
  };

  const displayUser = firebaseUser || user;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="마이페이지" showLogo={false} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 메인 프로필 섹션 */}
        <MotiView
          style={styles.profileCard}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <View style={styles.profileHeader}>
            <Text style={styles.profileTitle}>내 정보</Text>
            <TouchableOpacity style={styles.editIconButton} onPress={() => startEdit('realName')}>
              <Ionicons name="pencil" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              {displayUser?.photoURL ? (
                <Image
                  source={{ uri: displayUser.photoURL }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Ionicons name="person" size={32} color="#6B7280" />
                </View>
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {displayUser?.realName || displayUser?.displayName || '이름 없음'}
              </Text>
              <Text style={styles.userEmail}>
                {displayUser?.email || '이메일 정보 없음'}
              </Text>
              <View style={styles.providerBadge}>
                <Text style={styles.providerText}>
                  {displayUser?.provider === 'kakao' ? '카카오' :
                   displayUser?.provider === 'google' ? '구글' :
                   displayUser?.provider === 'apple' ? '애플' : '이메일'} 로그인
                </Text>
              </View>
            </View>
          </View>
        </MotiView>

        {/* 액션 그리드 - 홈 스타일 */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          style={styles.actionGridContainer}
        >
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="settings" size={32} color="#6B7280" />
            </View>
            <Text style={styles.actionTitle}>설정</Text>
            <Text style={styles.actionSubtitle}>앱 관리</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="log-out" size={32} color="#6B7280" />
            </View>
            <Text style={styles.actionTitle}>로그아웃</Text>
            <Text style={styles.actionSubtitle}>계정 종료</Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>

      {/* 편집 모달 */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              실명 수정
            </Text>

            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder="실명을 입력하세요"
              autoFocus={true}
              maxLength={20}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelEdit}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, updating && styles.disabledButton]}
                onPress={saveEdit}
                disabled={updating || !editValue.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {updating ? '저장 중...' : '저장'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const MyPageScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);


  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              // Firebase Auth 로그아웃 먼저 처리
              await firebaseService.signOut();
              // 커스텀 persistence 데이터 삭제
              await authPersistenceService.clearAuthState();
              // Redux 상태 초기화
              dispatch(logout());
              devLog.log('✅ 로그아웃 완료 (Firebase Auth + 커스텀 persistence 삭제)');
            } catch (error) {
              devLog.error('로그아웃 오류:', error);
              // 오류가 있어도 커스텀 persistence 삭제 시도
              await authPersistenceService.clearAuthState();
              dispatch(logout()); // 오류가 있어도 앱에서는 로그아웃
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="마이페이지" showLogo={false} />
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 로그인 필요 섹션 */}
          <MotiView
            style={styles.loginCard}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            <View style={styles.loginIconContainer}>
              <Ionicons name="person-circle-outline" size={64} color="#9CA3AF" />
            </View>

            <Text style={styles.loginTitle}>로그인이 필요합니다</Text>
            <Text style={styles.loginSubtitle}>
              차징 앱의 모든 기능을 이용하려면{'\n'}로그인해주세요
            </Text>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login', { showBackButton: true })}
            >
              <Text style={styles.loginButtonText}>로그인하기</Text>
            </TouchableOpacity>
          </MotiView>

          {/* 비활성화된 그리드 */}
          <MotiView
            style={styles.disabledSection}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
          >
            <TouchableOpacity
              style={[styles.actionItem, styles.disabledActionItem]}
              disabled={true}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="settings" size={32} color="#D1D5DB" />
              </View>
              <Text style={[styles.actionTitle, styles.disabledText]}>설정</Text>
              <Text style={[styles.actionSubtitle, styles.disabledText]}>로그인 필요</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, styles.disabledActionItem]}
              disabled={true}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="log-out" size={32} color="#D1D5DB" />
              </View>
              <Text style={[styles.actionTitle, styles.disabledText]}>로그아웃</Text>
              <Text style={[styles.actionSubtitle, styles.disabledText]}>로그인 필요</Text>
            </TouchableOpacity>
          </MotiView>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <AuthenticatedMyPage user={user} onLogout={handleLogout} dispatch={dispatch} />
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

  // 로그인된 사용자 - 프로필 카드
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  editIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  providerBadge: {
    alignSelf: 'flex-start',
  },
  providerText: {
    fontSize: 12,
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // 액션 그리드 - 홈 스타일
  actionGridContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  actionItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: (Dimensions.get('window').width - 48) / 3, // 화면 너비의 1/3 (패딩 16*2 + 마진 16 고려)
  },
  actionIconContainer: {
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
  },
  disabledActionItem: {
    opacity: 0.5,
  },


  // 로그인 안된 사용자
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginIconContainer: {
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 비활성화된 섹션
  disabledSection: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  disabledText: {
    color: '#9CA3AF',
  },

  // 모달 스타일들
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#202632',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MyPageScreen;
