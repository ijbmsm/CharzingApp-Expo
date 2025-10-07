import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import firebaseService, { DiagnosisReservation, VehicleDiagnosisReport } from '../services/firebaseService';
import { RootStackParamList } from '../navigation/RootNavigator';

// Date 필드가 string으로 변환된 reservation 타입
type SerializableReservation = Omit<DiagnosisReservation, 'requestedDate' | 'createdAt' | 'updatedAt'> & {
  requestedDate: string | Date | any;
  createdAt: string | Date | any;
  updatedAt: string | Date | any;
};

type RouteProps = {
  reservation: SerializableReservation;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ReservationDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { reservation } = route.params as RouteProps;
  
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleReport, setVehicleReport] = useState<VehicleDiagnosisReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [currentReservation, setCurrentReservation] = useState(reservation);
  const [shouldResetOnBack, setShouldResetOnBack] = useState(false);

  // 완료된 예약에 대한 진단 리포트 조회
  useEffect(() => {
    if (currentReservation.status === 'completed') {
      loadVehicleReport();
    }
  }, [currentReservation.id, currentReservation.status]);

  const loadVehicleReport = async () => {
    try {
      setReportLoading(true);
      const report = await firebaseService.getReservationVehicleDiagnosisReport(currentReservation.id);
      setVehicleReport(report);
    } catch (error) {
      console.error('진단 리포트 조회 실패:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleViewReport = () => {
    if (vehicleReport) {
      navigation.navigate('VehicleDiagnosisReport', { reportId: vehicleReport.id });
    } else {
      Alert.alert('알림', '진단 리포트를 찾을 수 없습니다.');
    }
  };

  // 예약 수정/취소 가능 여부 확인
  const getModifyPermission = () => {
    // currentReservation 데이터를 DiagnosisReservation 형태로 변환
    const reservationData: DiagnosisReservation = {
      ...currentReservation,
      requestedDate: typeof currentReservation.requestedDate === 'string' 
        ? new Date(currentReservation.requestedDate)
        : currentReservation.requestedDate,
      createdAt: typeof currentReservation.createdAt === 'string' 
        ? new Date(currentReservation.createdAt)
        : currentReservation.createdAt,
      updatedAt: typeof currentReservation.updatedAt === 'string' 
        ? new Date(currentReservation.updatedAt)
        : currentReservation.updatedAt,
    };
    
    return firebaseService.canModifyReservation(reservationData);
  };

  const handleModifyReservation = () => {
    const permission = getModifyPermission();
    
    if (!permission.canModify) {
      Alert.alert('수정 불가', permission.reason || '예약을 수정할 수 없습니다.');
      return;
    }

    // 예약 수정 화면으로 이동
    navigation.navigate('ModifyReservation', { reservation: currentReservation });
  };

  const handleCancelReservation = () => {
    const permission = getModifyPermission();
    
    if (!permission.canCancel) {
      Alert.alert('취소 불가', permission.reason || '예약을 취소할 수 없습니다.');
      return;
    }

    Alert.alert(
      '예약 취소',
      '정말로 예약을 취소하시겠습니까?',
      [
        { text: '아니오', style: 'cancel' },
        { 
          text: '예, 취소합니다', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await firebaseService.cancelDiagnosisReservation(currentReservation.id, '사용자 취소');
              
              // 현재 화면의 예약 상태를 업데이트
              setCurrentReservation(prev => ({ ...prev, status: 'cancelled' }));
              setShouldResetOnBack(true);
              
              Alert.alert('알림', '예약이 취소되었습니다.');
            } catch (error) {
              console.error('예약 취소 실패:', error);
              Alert.alert('오류', '예약 취소에 실패했습니다. 다시 시도해주세요.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusText = (status: DiagnosisReservation['status']) => {
    switch (status) {
      case 'pending': return '접수완료';
      case 'confirmed': return '예약확정';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  const getStatusColor = (status: DiagnosisReservation['status']) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusDescription = (status: DiagnosisReservation['status']) => {
    switch (status) {
      case 'pending': return '예약 요청이 접수되었습니다. 곧 연락드리겠습니다.';
      case 'confirmed': return '예약이 확정되었습니다. 예정된 시간에 방문해드립니다.';
      case 'completed': return '진단이 완료되었습니다.';
      case 'cancelled': return '예약이 취소되었습니다.';
      default: return '';
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${year}년 ${month}월 ${day}일 (${weekDay}) ${hours}:${minutes}`;
  };


  const handleBackPress = () => {
    if (shouldResetOnBack) {
      // 예약이 취소/완료된 경우 스택을 리셋하고 홈으로 이동
      // 현재 뒤로가기 애니메이션이 끝난 후 즉시 리셋
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      }, 100);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="예약 상세" 
        showLogo={false} 
        showBackButton={true} 
        onBackPress={handleBackPress}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 상태 헤더 */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentReservation.status) }]}>
            <Text style={styles.statusText}>{getStatusText(currentReservation.status)}</Text>
          </View>
          <Text style={styles.statusDescription}>
            {getStatusDescription(currentReservation.status)}
          </Text>
          
          {/* 진단 리포트 버튼 - 완료된 예약에만 표시 */}
          {currentReservation.status === 'completed' && (
            <View style={styles.reportButtonContainer}>
              {reportLoading ? (
                <View style={styles.reportLoadingContainer}>
                  <ActivityIndicator size="small" color="#4495E8" />
                  <Text style={styles.reportLoadingText}>리포트 확인 중...</Text>
                </View>
              ) : vehicleReport ? (
                <TouchableOpacity
                  style={styles.reportButton}
                  onPress={handleViewReport}
                  activeOpacity={0.8}
                >
                  <View style={styles.reportButtonContent}>
                    <Ionicons name="document-text" size={20} color="#4495E8" />
                    <Text style={styles.reportButtonText}>진단 리포트 보기</Text>
                    <Ionicons name="chevron-forward" size={16} color="#4495E8" />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.noReportContainer}>
                  <Ionicons name="document-outline" size={16} color="#9CA3AF" />
                  <Text style={styles.noReportText}>진단 리포트 준비 중</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 예약 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>예약 정보</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>예약 일시</Text>
              <Text style={styles.infoValue}>{formatDate(currentReservation.requestedDate)}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>방문 주소</Text>
              <Text style={styles.infoValue}>
                {currentReservation.address}
                {currentReservation.detailAddress && `\n${currentReservation.detailAddress}`}
              </Text>
            </View>
          </View>
          
          {currentReservation.userName && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>예약자</Text>
                <Text style={styles.infoValue}>{currentReservation.userName}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 관리자 메모 */}
        {currentReservation.adminNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>관리자 메모</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{currentReservation.adminNotes}</Text>
            </View>
          </View>
        )}

        {/* 예약 내역 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>예약 내역</Text>
          
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>신청일</Text>
            <Text style={styles.historyValue}>{formatDate(currentReservation.createdAt)}</Text>
          </View>
          
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>마지막 업데이트</Text>
            <Text style={styles.historyValue}>{formatDate(currentReservation.updatedAt)}</Text>
          </View>
        </View>

        {/* 수정/취소 버튼 */}
        {(() => {
          const permission = getModifyPermission();
          return (permission.canModify || permission.canCancel) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>예약 관리</Text>
              
              <View style={styles.buttonContainer}>
                {permission.canModify && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.modifyButton]}
                    onPress={handleModifyReservation}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={20} color="#4495E8" />
                    <Text style={[styles.actionButtonText, styles.modifyButtonText]}>
                      예약 수정
                    </Text>
                  </TouchableOpacity>
                )}
                
                {permission.canCancel && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancelReservation}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-outline" size={20} color="#EF4444" />
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                      예약 취소
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {permission.reason && (
                <View style={styles.restrictionContainer}>
                  <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
                  <Text style={styles.restrictionText}>{permission.reason}</Text>
                </View>
              )}
            </View>
          );
        })()}
      </ScrollView>

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
    paddingHorizontal: 16,
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  reportButtonContainer: {
    marginTop: 16,
    width: '100%',
  },
  reportButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#4495E8',
    borderRadius: 12,
    padding: 16,
  },
  reportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4495E8',
    marginLeft: 8,
    marginRight: 8,
  },
  reportLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reportLoadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  noReportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noReportText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    lineHeight: 22,
  },
  notesContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // 수정/취소 버튼 스타일
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  modifyButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#4495E8',
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modifyButtonText: {
    color: '#4495E8',
  },
  cancelButtonText: {
    color: '#EF4444',
  },
  restrictionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#9CA3AF',
  },
  restrictionText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default ReservationDetailScreen;