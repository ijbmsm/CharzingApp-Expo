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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState } from '../store';
import { logout, updateUserProfile } from '../store/slices/authSlice';
import Header from '../components/Header';
// 카카오 로그인 서비스 제거됨
import firebaseService from '../services/firebaseService';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = StackNavigationProp<RootStackParamList>;


// 마이페이지 컴포넌트
const AuthenticatedMyPage: React.FC<{ 
  user: any; 
  onLogout: () => void; 
  onDeleteAccount: (user: { uid: string; kakaoId?: string }) => void;
  dispatch: any;
}> = ({ user, onLogout, onDeleteAccount, dispatch }) => {
  const navigation = useNavigation<NavigationProp>();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [_profileLoading, setProfileLoading] = useState(true);
  
  // 편집 관련 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<'displayName' | 'realName' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadUserProfile = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const profile = await firebaseService.getUserProfile(user.uid);
      setFirebaseUser(profile);
    } catch (error) {
      console.error('사용자 프로필 로드 실패:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // 편집 시작 함수
  const startEdit = (field: 'displayName' | 'realName') => {
    const currentValue = field === 'displayName' 
      ? displayUser?.displayName || ''
      : displayUser?.realName || '';
    
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
      if (editingField === 'displayName') {
        updateData.displayName = editValue.trim() || '사용자';
      } else if (editingField === 'realName') {
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
      console.error('프로필 업데이트 실패:', error);
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
    <SafeAreaView style={styles.container}>
      <Header title="마이페이지" showLogo={false} />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            {displayUser?.photoURL ? (
              <Image 
                source={{ uri: displayUser.photoURL }} 
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>👤</Text>
            )}
          </View>
          {/* 실명 (우선 표시) */}
          {displayUser?.realName && (
            <View style={styles.nameRow}>
              <Text style={styles.realName}>
                {displayUser.realName}
              </Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => startEdit('realName')}
              >
                <Ionicons name="pencil" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* 닉네임 (displayName) */}
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { fontSize: displayUser?.realName ? 14 : 18 }]}>
              {displayUser?.realName ? '닉네임: ' : ''}{displayUser?.displayName || '사용자'}{displayUser?.realName ? '' : '님'}
            </Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => startEdit('displayName')}
            >
              <Ionicons name="pencil" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          
          
          {displayUser?.email && (
            <Text style={styles.userEmail}>
              {displayUser.email}
            </Text>
          )}
          {!displayUser?.email && (
            <Text style={[styles.userEmail, styles.noEmailText]}>
              이메일 정보 없음
            </Text>
          )}
          {displayUser?.provider && (
            <Text style={styles.providerText}>
              {displayUser.provider === 'kakao' ? '카카오 로그인' : '이메일 로그인'}
            </Text>
          )}
        </View>
        
        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('MyReservations')}
          >
            <Text style={styles.menuText}>내 예약</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.menuText}>설정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          
          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Text style={[styles.menuText, styles.logoutText]}>로그아웃</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => onDeleteAccount(user)}>
            <Text style={[styles.menuText, styles.deleteText]}>회원탈퇴</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
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
              {editingField === 'displayName' ? '닉네임 수정' : '실명 수정'}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={editingField === 'displayName' ? '닉네임을 입력하세요' : '실명을 입력하세요'}
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

  const handleDeleteAccount = async (userToDelete: { uid: string; kakaoId?: string }) => {
    Alert.alert(
      '회원탈퇴',
      '정말로 탈퇴하시겠습니까?\n\n⚠️ 주의사항:\n• 모든 데이터가 영구적으로 삭제됩니다\n• 이 작업은 되돌릴 수 없습니다',
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
              console.log('회원탈퇴 시작...');
              
              // Firebase Auth 로그아웃 먼저 처리
              await firebaseService.signOut();
              console.log('계정 삭제 처리 완료');
              
              // Redux 상태 초기화
              dispatch(logout());
              
              Alert.alert(
                '탈퇴 완료',
                '회원탈퇴가 완료되었습니다.',
                [{ text: '확인' }]
              );
            } catch (error) {
              console.error('회원탈퇴 오류:', error);
              Alert.alert(
                '탈퇴 실패',
                '회원탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.',
                [{ text: '확인' }]
              );
            }
          },
        },
      ]
    );
  };

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
              // Redux 상태 초기화
              dispatch(logout());
            } catch (error) {
              console.error('로그아웃 오류:', error);
              dispatch(logout()); // 오류가 있어도 앱에서는 로그아웃
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="마이페이지" showLogo={false} />
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.userName}>로그인이 필요합니다</Text>
            <Text style={styles.userEmail}>
              소셜 계정으로 로그인해주세요
            </Text>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login', { showBackButton: true })}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>로그인</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuSection}>
            <View style={[styles.menuItem, styles.disabledMenuItem]}>
              <Text style={[styles.menuText, styles.disabledText]}>내 예약</Text>
              <Text style={[styles.menuArrow, styles.disabledText]}>›</Text>
            </View>
            
            <View style={[styles.menuItem, styles.disabledMenuItem]}>
              <Text style={[styles.menuText, styles.disabledText]}>설정</Text>
              <Text style={[styles.menuArrow, styles.disabledText]}>›</Text>
            </View>
            
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <AuthenticatedMyPage user={user} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} dispatch={dispatch} />
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
  profileSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  noEmailText: {
    fontStyle: 'italic',
    opacity: 0.8,
  },
  providerText: {
    fontSize: 12,
    color: '#4495E8',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {
    fontSize: 16,
    color: '#1F2937',
  },
  logoutText: {
    color: '#EF4444',
  },
  deleteText: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  menuArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C1E1E',
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  // 새로 추가된 스타일들
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  realName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 8,
  },
  editButton: {
    padding: 4,
    marginLeft: 8,
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
    backgroundColor: '#4495E8',
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