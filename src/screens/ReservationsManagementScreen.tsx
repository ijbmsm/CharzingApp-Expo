import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Timestamp, FieldValue } from 'firebase/firestore';

import { RootState } from '../store';
import firebaseService, { DiagnosisReservation } from '../services/firebaseService';
import { handleFirebaseError } from '../services/errorHandler';
import { RootStackParamList } from '../navigation/RootNavigator';

type Tab = 'pending' | 'my';

/**
 * 정비사/관리자 전용 예약 관리 화면
 * - "대기 중" (pending): 아직 할당되지 않은 예약
 * - "내 담당" (my): 내가 맡은 예약
 */
const ReservationsManagementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Redux state
  const user = useSelector((state: RootState) => state.auth.user);

  // State
  const [selectedTab, setSelectedTab] = useState<Tab>('pending');
  const [pendingReservations, setPendingReservations] = useState<DiagnosisReservation[]>([]);
  const [myReservations, setMyReservations] = useState<DiagnosisReservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(null);
  const [assigningReservationId, setAssigningReservationId] = useState<string | null>(null);

  // 메모리 누수 방지
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 예약 목록 로드 (정비사 전용)
  const loadReservations = useCallback(async () => {
    if (!isMountedRef.current || !user) return;

    try {
      setIsLoading(true);

      // pending과 내 담당 예약 모두 로드
      const [pending, assigned] = await Promise.all([
        firebaseService.getPendingReservations(),
        firebaseService.getMechanicAssignedReservations(user.uid),
      ]);

      if (isMountedRef.current) {
        setPendingReservations(pending);
        setMyReservations(assigned);
      }
    } catch (error) {
      console.error('예약 목록 로드 실패:', error);
      if (isMountedRef.current) {
        const errorMessage = handleFirebaseError(error, {
          actionName: 'load_reservations',
        });
        Alert.alert('오류', errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // 일주일치 날짜 생성
  const getWeekDates = useCallback(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  }, []);

  // 날짜 라벨 포맷
  const getDateLabel = useCallback((date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

    return `${month}월 ${day}일(${dayOfWeek})`;
  }, []);

  // 안전한 Date 변환 헬퍼
  const toSafeDate = useCallback((dateValue: Date | Timestamp | string | FieldValue | undefined): Date => {
    if (!dateValue) {
      return new Date();
    }
    if (dateValue instanceof Timestamp) {
      return dateValue.toDate();
    }
    if (dateValue instanceof Date) {
      return dateValue;
    }
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    return new Date();
  }, []);

  // 날짜 필터링된 예약 목록
  const getFilteredReservations = useCallback(() => {
    const sourceReservations = selectedTab === 'pending' ? pendingReservations : myReservations;

    if (!selectedDateFilter) {
      // 필터가 없으면 모든 예약을 시간순으로 정렬
      return sourceReservations.sort((a, b) => {
        const dateA = toSafeDate(a.requestedDate);
        const dateB = toSafeDate(b.requestedDate);
        return dateA.getTime() - dateB.getTime();
      });
    }

    // 선택된 날짜의 예약만 필터링
    const filtered = sourceReservations.filter((reservation) => {
      const resDate = toSafeDate(reservation.requestedDate);

      return (
        resDate.getFullYear() === selectedDateFilter.getFullYear() &&
        resDate.getMonth() === selectedDateFilter.getMonth() &&
        resDate.getDate() === selectedDateFilter.getDate()
      );
    });

    // 시간순 정렬
    return filtered.sort((a, b) => {
      const dateA = toSafeDate(a.requestedDate);
      const dateB = toSafeDate(b.requestedDate);
      const timeA = dateA.getHours() * 60 + dateA.getMinutes();
      const timeB = dateB.getHours() * 60 + dateB.getMinutes();
      return timeA - timeB;
    });
  }, [selectedTab, pendingReservations, myReservations, selectedDateFilter, toSafeDate]);

  // 예약 할당 (정비사만)
  const handleAssignReservation = useCallback(
    async (reservationId: string) => {
      if (!user) {
        Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
        return;
      }

      const userName = user.displayName || user.email || '이름 없음';

      try {
        setAssigningReservationId(reservationId);
        await firebaseService.assignReservationToMechanic(reservationId, user.uid, userName);

        if (isMountedRef.current) {
          Alert.alert('성공', '예약을 맡았습니다.');
          loadReservations();
        }
      } catch (error: unknown) {
        console.error('예약 할당 실패:', error);
        if (isMountedRef.current) {
          const errorMessage = error instanceof Error ? error.message : '예약 할당에 실패했습니다.';
          Alert.alert('오류', errorMessage);
        }
      } finally {
        if (isMountedRef.current) {
          setAssigningReservationId(null);
        }
      }
    },
    [user, loadReservations]
  );

  // Pending 탭 예약 카드 렌더링
  const renderPendingItem = useCallback(
    ({ item: reservation }: { item: DiagnosisReservation }) => {
      const date = toSafeDate(reservation.requestedDate);

      const dateString = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
      const timeString = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      const isAssigned = !!reservation.assignedTo;
      const isAssignedToMe = reservation.assignedTo === user?.uid;
      const isAssigning = assigningReservationId === reservation.id;

      return (
        <View style={styles.reservationCard}>
          {/* 상단 헤더 */}
          <View style={styles.reservationHeader}>
            <View style={styles.reservationHeaderLeft}>
              <Text style={styles.reservationName}>
                {reservation.userName || '이름 없음'}
              </Text>
              {isAssigned && (
                <View style={[styles.statusBadge, isAssignedToMe && styles.statusBadgeMe]}>
                  <Ionicons
                    name={isAssignedToMe ? 'checkmark-circle' : 'person'}
                    size={14}
                    color={isAssignedToMe ? '#10B981' : '#6B7280'}
                  />
                  <Text style={[styles.statusBadgeText, isAssignedToMe && styles.statusBadgeTextMe]}>
                    {isAssignedToMe ? '내가 담당' : `${reservation.assignedToName} 담당`}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.reservationPhone}>{reservation.userPhone}</Text>
          </View>

          {/* 예약 정보 */}
          <View style={styles.reservationInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{dateString} {timeString}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {reservation.vehicleBrand} {reservation.vehicleModel} ({reservation.vehicleYear})
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={1}>
                {reservation.address}
              </Text>
            </View>
          </View>

          {/* 할당 버튼 (정비사 & 미할당 예약만) */}
          {!isAssigned && (
            <TouchableOpacity
              style={[styles.assignButton, isAssigning && styles.assignButtonDisabled]}
              onPress={() => handleAssignReservation(reservation.id)}
              disabled={isAssigning}
              activeOpacity={0.7}
            >
              {isAssigning ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="#FFFFFF" />
                  <Text style={styles.assignButtonText}>내가 맡기</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [user, assigningReservationId, handleAssignReservation, toSafeDate]
  );

  // My 탭 예약 카드 렌더링
  const renderMyItem = useCallback(
    ({ item: reservation }: { item: DiagnosisReservation }) => {
      const date = toSafeDate(reservation.requestedDate);

      const dateString = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
      const timeString = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      const statusColors: Record<string, string> = {
        pending: '#F59E0B',
        confirmed: '#10B981',
        in_progress: '#3B82F6',
        completed: '#6B7280',
        cancelled: '#EF4444',
      };

      const statusLabels: Record<string, string> = {
        pending: '대기',
        confirmed: '확정',
        in_progress: '진행중',
        completed: '완료',
        cancelled: '취소',
      };

      return (
        <TouchableOpacity
          style={styles.reservationCard}
          onPress={() => navigation.navigate('ReservationDetail', { reservation })}
          activeOpacity={0.7}
        >
          {/* 상단 헤더 */}
          <View style={styles.reservationHeader}>
            <View style={styles.reservationHeaderLeft}>
              <Text style={styles.reservationName}>
                {reservation.userName}
              </Text>
            </View>
          </View>

          {/* 예약 정보 */}
          <View style={styles.reservationInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>예약자: {reservation.userName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{reservation.userPhone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{dateString} {timeString}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {reservation.vehicleBrand} {reservation.vehicleModel} ({reservation.vehicleYear})
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={2}>
                {reservation.address}
              </Text>
            </View>
          </View>

          {/* 우측 상단: 화살표 */}
          <View style={styles.arrowContainerTop}>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>

          {/* 우측 상단 아래: 담당자 정보 */}
          {reservation.assignedToName && (
            <View style={styles.assigneeInfoContainer}>
              <Ionicons name="people-outline" size={14} color="#6B7280" />
              <Text style={styles.assigneeInfoText}>{reservation.assignedToName}</Text>
            </View>
          )}

          {/* 우측 하단: 상태 뱃지 */}
          <View style={[styles.statusBadgeBottom, { backgroundColor: `${statusColors[reservation.status]}20` }]}>
            <Text style={[styles.statusBadgeText, { color: statusColors[reservation.status] }]}>
              {statusLabels[reservation.status]}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, toSafeDate]
  );

  const filteredReservations = getFilteredReservations();
  const hasReservations = pendingReservations.length > 0 || myReservations.length > 0;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>예약 관리</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadReservations}>
          <Ionicons name="refresh" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* 탭 바 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.tabActive]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
            대기 중
          </Text>
          {pendingReservations.length > 0 && (
            <View style={[styles.tabBadge, selectedTab === 'pending' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'pending' && styles.tabBadgeTextActive]}>
                {pendingReservations.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'my' && styles.tabActive]}
          onPress={() => setSelectedTab('my')}
        >
          <Text style={[styles.tabText, selectedTab === 'my' && styles.tabTextActive]}>
            내 담당
          </Text>
          {myReservations.length > 0 && (
            <View style={[styles.tabBadge, selectedTab === 'my' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'my' && styles.tabBadgeTextActive]}>
                {myReservations.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 날짜 필터 */}
      {hasReservations && (
        <View style={styles.dateFilterContainer}>
          <View style={styles.dateFilterHeader}>
            <Text style={styles.dateFilterLabel}>날짜:</Text>
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => setSelectedDateFilter(null)}
            >
              <Text style={styles.clearFilterText}>전체 보기</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateButtonsContainer}
          >
            {getWeekDates().map((date, index) => {
              const isSelected = selectedDateFilter?.getTime() === date.getTime();
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateButton, isSelected && styles.dateButtonActive]}
                  onPress={() => setSelectedDateFilter(date)}
                >
                  <Text style={[styles.dateButtonText, isSelected && styles.dateButtonTextActive]}>
                    {getDateLabel(date)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 예약 목록 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06B6D4" />
          <Text style={styles.loadingText}>예약 목록을 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          renderItem={selectedTab === 'pending' ? renderPendingItem : renderMyItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>예약이 없습니다</Text>
              <Text style={styles.emptyText}>
                {selectedDateFilter
                  ? '해당 날짜에 예약이 없습니다.'
                  : selectedTab === 'pending'
                  ? '대기 중인 예약이 없습니다.'
                  : '담당 예약이 없습니다.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(48),
    paddingBottom: verticalScale(8),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: scale(4),
  },
  headerTitle: {
    flex: 1,
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginRight: scale(32),
  },
  refreshButton: {
    padding: scale(4),
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(6),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    marginRight: scale(8),
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#06B6D4',
  },
  tabText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    marginLeft: scale(4),
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(4),
  },
  tabBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  tabBadgeTextActive: {
    color: '#06B6D4',
  },
  dateFilterContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
  },
  dateFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  dateFilterLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#6B7280',
  },
  clearFilterButton: {
    paddingVertical: verticalScale(2),
    paddingHorizontal: scale(6),
  },
  clearFilterText: {
    fontSize: moderateScale(11),
    color: '#06B6D4',
    fontWeight: '500',
  },
  dateButtonsContainer: {
    paddingVertical: verticalScale(2),
  },
  dateButton: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    marginRight: scale(6),
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateButtonActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  dateButtonText: {
    fontSize: moderateScale(11),
    fontWeight: '500',
    color: '#374151',
  },
  dateButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: scale(20),
  },
  reservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: scale(16),
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
    paddingRight: scale(40),
  },
  reservationHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reservationName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1F2937',
    marginRight: scale(8),
  },
  reservationPhone: {
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  statusBadgeMe: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: scale(4),
  },
  statusBadgeTextMe: {
    color: '#10B981',
  },
  reservationInfo: {
    gap: verticalScale(8),
    paddingRight: scale(140),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  infoText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#4B5563',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    paddingVertical: verticalScale(12),
    borderRadius: 8,
    marginTop: verticalScale(12),
    gap: scale(6),
  },
  assignButtonDisabled: {
    opacity: 0.6,
  },
  assignButtonText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  arrowContainerTop: {
    position: 'absolute',
    right: scale(16),
    top: scale(16),
  },
  assigneeInfoContainer: {
    position: 'absolute',
    right: scale(16),
    top: scale(46),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: '#F3F4F6',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: 8,
  },
  assigneeInfoText: {
    fontSize: moderateScale(12),
    color: '#4B5563',
    fontWeight: '500',
  },
  statusBadgeBottom: {
    position: 'absolute',
    right: scale(16),
    bottom: scale(16),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(12),
  },
  loadingText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
    gap: verticalScale(12),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#4B5563',
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ReservationsManagementScreen;
