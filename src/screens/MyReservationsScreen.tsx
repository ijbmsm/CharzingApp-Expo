import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import StepIndicator from 'react-native-step-indicator';
import Header from '../components/Header';
import { RootState } from '../store';
import firebaseService, { DiagnosisReservation } from '../services/firebaseService';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLoading } from '../contexts/LoadingContext';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const MyReservationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { showLoading, hideLoading } = useLoading();
  
  const [reservations, setReservations] = useState<DiagnosisReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true; // 마운트 상태 추적
    
    if (isAuthenticated && user?.uid) {
      loadReservations(true, isMounted);
    }
    
    // Cleanup 함수
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  const loadReservations = async (showGlobalLoading = false, isMounted = true) => {
    if (!user?.uid || !isMounted) return;
    
    try {
      if (showGlobalLoading && isMounted) {
        showLoading('예약 목록을 불러오는 중...');
      }
      if (isMounted) {
        setIsLoading(true);
      }
      
      const userReservations = await firebaseService.getUserDiagnosisReservations(user.uid);
      
      if (isMounted) {
        setReservations(userReservations);
      }
    } catch (error) {
      if (isMounted) {
        console.error('예약 목록 불러오기 실패:', error);
        Alert.alert('오류', '예약 목록을 불러올 수 없습니다.');
      }
    } finally {
      if (isMounted) {
        if (showGlobalLoading) {
          hideLoading();
        }
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReservations(false, true); // 마운트 상태를 true로 전달
    setIsRefreshing(false);
  };

  const handleReservationPress = (reservation: DiagnosisReservation) => {
    // Date 객체를 string으로 변환하여 serialization 문제 해결
    const convertFieldToISO = (field: any) => {
      if (field instanceof Date) {
        return field.toISOString();
      }
      if (field && typeof field === 'object' && 'toDate' in field && typeof field.toDate === 'function') {
        return (field as any).toDate().toISOString();
      }
      return field;
    };

    const serializableReservation = {
      ...reservation,
      requestedDate: convertFieldToISO(reservation.requestedDate),
      createdAt: convertFieldToISO(reservation.createdAt),
      updatedAt: convertFieldToISO(reservation.updatedAt),
    };
    
    navigation.navigate('ReservationDetail', { reservation: serializableReservation });
  };

  // 상태에 따른 단계 매핑 (HomeScreen과 동일)
  const getStepFromStatus = (status: DiagnosisReservation['status']): number => {
    switch (status) {
      case 'pending':
        return 0; // 접수완료
      case 'confirmed':
      case 'completed':
        return 2; // 완료
      case 'cancelled':
        return -1; // 취소됨 (표시하지 않음)
      default:
        return 0;
    }
  };

  const labels = ['접수완료', '예약됨', '완료'];
  
  const customStyles = {
    stepIndicatorSize: 30,
    currentStepIndicatorSize: 30,
    separatorStrokeWidth: 2,
    currentStepStrokeWidth: 2,
    stepStrokeCurrentColor: '#4495E8',
    stepStrokeWidth: 2,
    stepStrokeFinishedColor: '#4495E8',
    stepStrokeUnFinishedColor: '#E5E7EB',
    separatorFinishedColor: '#4495E8',
    separatorUnFinishedColor: '#E5E7EB',
    stepIndicatorFinishedColor: '#4495E8',
    stepIndicatorUnFinishedColor: '#FFFFFF',
    stepIndicatorCurrentColor: '#4495E8',
    stepIndicatorLabelFontSize: 0, // 숫자 숨기기
    currentStepIndicatorLabelFontSize: 0,
    stepIndicatorLabelCurrentColor: 'transparent',
    stepIndicatorLabelFinishedColor: 'transparent',
    stepIndicatorLabelUnFinishedColor: 'transparent',
    labelColor: '#9CA3AF',
    labelSize: 10,
    labelFontFamily: 'System',
    currentStepLabelColor: '#4495E8',
  };

  const renderStepIndicator = (params: any) => {
    const icons: Array<keyof typeof Ionicons.glyphMap> = ['document-text-outline', 'calendar-outline', 'checkmark-circle-outline'];
    const isActive = params.position <= params.stepStatus;
    
    return (
      <Ionicons 
        name={icons[params.position]} 
        size={16} 
        color={isActive ? '#FFFFFF' : '#9CA3AF'} 
      />
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

  const renderReservationItem = ({ item }: { item: DiagnosisReservation }) => {
    const currentStep = getStepFromStatus(item.status);
    
    return (
      <TouchableOpacity
        style={styles.reservationCard}
        onPress={() => handleReservationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>{formatDate(item.requestedDate)}</Text>
        </View>
        
        {/* StepIndicator 추가 (취소된 예약은 제외) */}
        {currentStep >= 0 && (
          <View style={styles.stepIndicatorContainer}>
            <StepIndicator
              customStyles={customStyles}
              currentPosition={currentStep}
              labels={labels}
              stepCount={3}
              renderStepIndicator={(params) => renderStepIndicator({...params, stepStatus: currentStep})}
            />
          </View>
        )}
        
        <View style={styles.cardContent}>
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.address}
              {item.detailAddress && ` ${item.detailAddress}`}
            </Text>
          </View>
          
          {item.adminNotes && (
            <View style={styles.notesContainer}>
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={styles.notesText} numberOfLines={2}>
                {item.adminNotes}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.createdText}>
            신청일: {formatDate(item.createdAt)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>예약 내역이 없습니다</Text>
      <Text style={styles.emptySubtitle}>
        배터리 진단 예약을 신청해보세요
      </Text>
      <TouchableOpacity
        style={styles.reserveButton}
        onPress={() => navigation.navigate('DiagnosisReservation')}
      >
        <Text style={styles.reserveButtonText}>진단 예약하기</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="내 예약" 
          showLogo={false} 
          showBackButton={true} 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.notAuthContainer}>
          <Ionicons name="person-outline" size={64} color="#D1D5DB" />
          <Text style={styles.notAuthTitle}>로그인이 필요합니다</Text>
          <Text style={styles.notAuthSubtitle}>
            예약 내역을 확인하려면 로그인해주세요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="내 예약" 
        showLogo={false} 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4495E8" />
          <Text style={styles.loadingText}>예약 내역을 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          renderItem={renderReservationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#4495E8']}
              tintColor="#4495E8"
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepIndicatorContainer: {
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardContent: {
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
    lineHeight: 20,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  createdText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  reserveButton: {
    backgroundColor: '#4495E8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reserveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notAuthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  notAuthSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MyReservationsScreen;