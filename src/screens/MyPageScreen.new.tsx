import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState } from '../store';
import { logout, updateUserProfile } from '../store/slices/authSlice';
import Header from '../components/Header';
import firebaseService from '../services/firebaseService';
import authPersistenceService from '../services/authPersistenceService';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import devLog from '../utils/devLog';

type NavigationProp = StackNavigationProp<RootStackParamList>;

// 인증된 사용자의 마이페이지
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
  const [editValue, setEditValue] = useState('');
  const [updating, setUpdating] = useState(false);

  // 로그아웃 모달 상태
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 추천 코드 복사 상태
  const [copied, setCopied] = useState(false);

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

  // 프로필 수정 시작
  const handleEditStart = () => {
    setEditValue(firebaseUser?.realName || displayUser?.realName || '');
    setShowEditModal(true);
  };

  // 프로필 수정 저장
  const handleEditSave = async () => {
    if (!user?.uid || !editValue.trim()) return;

    try {
      setUpdating(true);

      const updateData: any = {
        uid: user.uid,
        realName: editValue.trim(),
        updatedAt: new Date(),
      };

      await firebaseService.createOrUpdateUser(updateData);
      dispatch(updateUserProfile({ realName: editValue.trim() }));
      await loadUserProfile();

      setShowEditModal(false);
      setEditValue('');
      Alert.alert('성공', '프로필이 업데이트되었습니다.');
    } catch (error) {
      devLog.error('프로필 업데이트 실패:', error);
      Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  // 로그아웃 확인 모달 표시
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  // 로그아웃 확인
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  // 추천 코드 복사
  const handleCopyReferralCode = async () => {
    if (!displayUser?.referralCode) return;

    try {
      await Clipboard.setStringAsync(displayUser.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      devLog.error('추천 코드 복사 실패:', error);
      Alert.alert('오류', '복사에 실패했습니다.');
    }
  };

  const displayUser = firebaseUser || user;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="마이페이지" showLogo={false} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 사용자 이름 타이틀 */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>
            {displayUser?.realName || displayUser?.displayName || '이름 없음'}님
          </Text>
        </View>

        {/* 1) 회원정보 카드 */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>이메일</Text>
            <Text style={styles.infoValue}>
              {displayUser?.email || '-'}
            </Text>
          </View>

          {displayUser?.phoneNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>전화번호</Text>
              <Text style={styles.infoValue}>{displayUser.phoneNumber}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>로그인 방식</Text>
            <View style={styles.providerBadge}>
              <Text style={styles.providerText}>
                {displayUser?.provider === 'kakao' ? '카카오' :
                 displayUser?.provider === 'google' ? '구글' :
                 displayUser?.provider === 'apple' ? '애플' : '이메일'}
              </Text>
            </View>
          </View>

          {/* 프로필 수정 버튼 */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditStart}
            activeOpacity={0.7}
          >
            <Text style={styles.editButtonText}>프로필 수정</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* 2) 로그아웃 버튼 카드 */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleLogoutClick}
          activeOpacity={0.7}
        >
          <View style={styles.menuRow}>
            <Text style={styles.menuText}>로그아웃</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* 3) 친구 초대 카드 (조건부) */}
        {displayUser?.referralCode && (
          <View style={styles.referralCard}>
            {/* 아이콘 + 제목 */}
            <View style={styles.referralHeader}>
              <View style={styles.referralIconContainer}>
                <Ionicons name="gift" size={16} color="#0891B2" />
              </View>
              <Text style={styles.referralTitle}>
                친구에게 할인 쿠폰 선물하기
              </Text>
            </View>

            {/* 설명 */}
            <Text style={styles.referralDescription}>
              내 추천 코드로 가입하면 친구가{' '}
              <Text style={styles.referralHighlight}>10,000원 할인</Text>을 받아요!
            </Text>

            {/* 추천 코드 + 복사 버튼 */}
            <View style={styles.referralCodeContainer}>
              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCodeText}>
                  {displayUser.referralCode}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyReferralCode}
                activeOpacity={0.7}
              >
                {copied ? (
                  <>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    <Text style={styles.copyButtonText}>완료!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="copy-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.copyButtonText}>복사</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 4) 메뉴 섹션 */}
        <View style={styles.menuSection}>
          {/* 설정 */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="settings-outline" size={24} color="#6B7280" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>설정</Text>
              <Text style={styles.menuSubtitle}>앱 관리</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 일반 사용자: 내 예약 */}
          {displayUser?.role !== 'admin' && displayUser?.role !== 'mechanic' && (
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigation.navigate('MyReservations')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#6B7280" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>내 예약</Text>
                <Text style={styles.menuSubtitle}>예약 내역 확인</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {/* 내 리포트 */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation.navigate('DiagnosisReportList')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="document-text-outline" size={24} color="#6B7280" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>내 리포트</Text>
              <Text style={styles.menuSubtitle}>진단 리포트 확인</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 내 쿠폰 */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigation.navigate('MyCoupons')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="ticket-outline" size={24} color="#6B7280" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>내 쿠폰</Text>
              <Text style={styles.menuSubtitle}>보유 쿠폰 확인</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* 관리자/진단사: 예약 관리 */}
          {(displayUser?.role === 'admin' || displayUser?.role === 'mechanic') && (
            <>
              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('ReservationsManagement')}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="calendar" size={24} color="#06B6D4" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>예약 관리</Text>
                  <Text style={styles.menuSubtitle}>대기 중 · 내 담당</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('VehicleInspection')}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="car-sport" size={24} color="#06B6D4" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>차량 점검</Text>
                  <Text style={styles.menuSubtitle}>현장 점검 기록</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 5) 회원탈퇴 링크 */}
        <View style={styles.footerContainer}>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.footerLink}>회원탈퇴</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 프로필 수정 모달 */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>실명 수정</Text>

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
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditSave}
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

      {/* 로그아웃 확인 모달 */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>로그아웃</Text>
            <Text style={styles.modalMessage}>
              정말 로그아웃 하시겠습니까?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButton]}
                onPress={handleLogoutConfirm}
              >
                <Text style={styles.logoutButtonText}>로그아웃</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// 메인 컴포넌트
const MyPageScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    try {
      await firebaseService.signOut();
      await authPersistenceService.clearAuthState();
      dispatch(logout());
      devLog.log('✅ 로그아웃 완료');
    } catch (error) {
      devLog.error('로그아웃 오류:', error);
      await authPersistenceService.clearAuthState();
      dispatch(logout());
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="마이페이지" showLogo={false} />
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginCard}>
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
          </View>
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // 타이틀
  titleContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },

  // 카드 공통
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // 회원정보 카드
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  providerBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  providerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
  },

  // 프로필 수정 버튼
  editButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  editButtonText: {
    fontSize: 14,
    color: '#1F2937',
  },

  // 메뉴 행 (로그아웃 등)
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 14,
    color: '#1F2937',
  },

  // 친구 초대 카드
  referralCard: {
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  referralIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  referralTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  referralDescription: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 18,
  },
  referralHighlight: {
    fontWeight: '700',
    color: '#0891B2',
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referralCodeBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  referralCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0891B2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0891B2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 메뉴 섹션
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },

  // 회원탈퇴 링크
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerLink: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },

  // 로그인 필요 화면
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginTop: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  loginIconContainer: {
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 모달
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
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
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
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#06B6D4',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MyPageScreen;
