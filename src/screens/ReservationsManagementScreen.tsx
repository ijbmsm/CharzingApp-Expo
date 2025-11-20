import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { draftStorage } from '../storage/mmkv';

type Tab = 'pending' | 'my' | 'drafts';

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
  const [drafts, setDrafts] = useState<Array<{
    userId: string;
    userName: string;
    userPhone: string;
    savedAt: Date;
    dataSize: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(null);
  const [assigningReservationId, setAssigningReservationId] = useState<string | null>(null);
  const [showAllReservations, setShowAllReservations] = useState(false);

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

    // 1️⃣ "내 담당" 탭 + "전체 보기" OFF → 진행중인 예약만 표시
    let filtered = sourceReservations;

    if (selectedTab === 'my' && !showAllReservations) {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      filtered = sourceReservations.filter((reservation) => {
        // 완료/취소된 예약 제외
        if (reservation.status === 'completed' || reservation.status === 'cancelled') {
          return false;
        }

        // 예약 시간이 24시간 이상 지난 것 제외
        const resDate = toSafeDate(reservation.requestedDate);
        if (resDate < oneDayAgo) {
          return false;
        }

        return true;
      });
    }

    // 2️⃣ 날짜 필터가 없으면 모든 예약을 시간순으로 정렬
    if (!selectedDateFilter) {
      return filtered.sort((a, b) => {
        const dateA = toSafeDate(a.requestedDate);
        const dateB = toSafeDate(b.requestedDate);

        // "전체 보기" ON → 최신순 (내림차순), OFF → 과거순 (오름차순)
        if (selectedTab === 'my' && showAllReservations) {
          return dateB.getTime() - dateA.getTime(); // 내림차순
        }
        return dateA.getTime() - dateB.getTime(); // 오름차순
      });
    }

    // 3️⃣ 선택된 날짜의 예약만 필터링
    const dateFiltered = filtered.filter((reservation) => {
      const resDate = toSafeDate(reservation.requestedDate);

      return (
        resDate.getFullYear() === selectedDateFilter.getFullYear() &&
        resDate.getMonth() === selectedDateFilter.getMonth() &&
        resDate.getDate() === selectedDateFilter.getDate()
      );
    });

    // 시간순 정렬 (날짜 필터 선택 시에는 항상 오름차순)
    return dateFiltered.sort((a, b) => {
      const dateA = toSafeDate(a.requestedDate);
      const dateB = toSafeDate(b.requestedDate);
      const timeA = dateA.getHours() * 60 + dateA.getMinutes();
      const timeB = dateB.getHours() * 60 + dateB.getMinutes();
      return timeA - timeB;
    });
  }, [selectedTab, pendingReservations, myReservations, selectedDateFilter, showAllReservations, toSafeDate]);

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
          {/* 상단 헤더 - 이름만 */}
          <View style={styles.reservationHeader}>
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

          {/* 날짜/시간 - 강조 */}
          <View style={styles.dateTimeSection}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar" size={18} color="#06B6D4" />
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
            <View style={styles.timeRow}>
              <Ionicons name="time" size={18} color="#06B6D4" />
              <Text style={styles.timeText}>{timeString}</Text>
            </View>
          </View>

          {/* 예약 정보 */}
          <View style={[styles.reservationInfo, { paddingRight: 0 }]}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{reservation.userPhone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {reservation.vehicleBrand} {reservation.vehicleModel}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{reservation.vehicleYear}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={2}>
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
          {/* 상단 헤더 - 이름만 */}
          <View style={styles.reservationHeader}>
            <Text style={styles.reservationName}>
              {reservation.userName}
            </Text>
          </View>

          {/* 날짜/시간 - 강조 */}
          <View style={styles.dateTimeSection}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar" size={18} color="#06B6D4" />
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
            <View style={styles.timeRow}>
              <Ionicons name="time" size={18} color="#06B6D4" />
              <Text style={styles.timeText}>{timeString}</Text>
            </View>
          </View>

          {/* 예약 정보 */}
          <View style={[styles.reservationInfo, { paddingRight: 0 }]}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{reservation.userPhone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {reservation.vehicleBrand} {reservation.vehicleModel}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{reservation.vehicleYear}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={2}>
                {reservation.address}
              </Text>
            </View>
          </View>

          {/* 하단: 상태 + 담당자 */}
          <View style={styles.cardFooter}>
            {/* 좌측: 상태 뱃지 */}
            <View style={[styles.statusBadgeFooter, { backgroundColor: `${statusColors[reservation.status]}20` }]}>
              <Text style={[styles.statusBadgeText, { color: statusColors[reservation.status] }]}>
                {statusLabels[reservation.status]}
              </Text>
            </View>

            {/* 우측: 담당자 정보 */}
            {reservation.assignedToName && (
              <View style={styles.assigneeInfoFooter}>
                <Ionicons name="people-outline" size={14} color="#6B7280" />
                <Text style={styles.assigneeInfoText}>{reservation.assignedToName}</Text>
              </View>
            )}
          </View>

          {/* 우측 상단: 화살표 */}
          <View style={styles.arrowContainerTop}>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, toSafeDate]
  );

  const filteredReservations = getFilteredReservations();
  const hasReservations = pendingReservations.length > 0 || myReservations.length > 0;

  // "내 담당" 탭 배지 카운트 (필터링 적용)
  const myReservationsBadgeCount = useMemo(() => {
    if (!showAllReservations) {
      // "전체 보기" OFF → 진행중인 예약만 카운트
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      return myReservations.filter((reservation) => {
        // 완료/취소된 예약 제외
        if (reservation.status === 'completed' || reservation.status === 'cancelled') {
          return false;
        }

        // 예약 시간이 24시간 이상 지난 것 제외
        const resDate = toSafeDate(reservation.requestedDate);
        if (resDate < oneDayAgo) {
          return false;
        }

        return true;
      }).length;
    }

    // "전체 보기" ON → 전체 카운트
    return myReservations.length;
  }, [myReservations, showAllReservations, toSafeDate]);

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
          {myReservationsBadgeCount > 0 && (
            <View style={[styles.tabBadge, selectedTab === 'my' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'my' && styles.tabBadgeTextActive]}>
                {myReservationsBadgeCount}
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
            <View style={styles.filterButtonsRow}>
              {/* "내 담당" 탭일 때만 "전체 보기" 토글 표시 */}
              {selectedTab === 'my' && (
                <TouchableOpacity
                  style={[
                    styles.showAllToggleButton,
                    showAllReservations && styles.showAllToggleButtonActive
                  ]}
                  onPress={() => setShowAllReservations(!showAllReservations)}
                >
                  <Ionicons
                    name={showAllReservations ? 'eye-off-outline' : 'eye-outline'}
                    size={14}
                    color={showAllReservations ? '#FFFFFF' : '#06B6D4'}
                  />
                  <Text style={[
                    styles.showAllToggleText,
                    showAllReservations && styles.showAllToggleTextActive
                  ]}>
                    {showAllReservations ? '진행중만' : '전체 보기'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => setSelectedDateFilter(null)}
              >
                <Text style={styles.clearFilterText}>모든 날짜</Text>
              </TouchableOpacity>
            </View>
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
                  : selectedTab === 'my' && !showAllReservations
                  ? '진행중인 담당 예약이 없습니다.\n완료/취소/지난 예약을 보려면 "전체 보기"를 눌러주세요.'
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
  filterButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  showAllToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(8),
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#06B6D4',
    gap: scale(4),
  },
  showAllToggleButtonActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  showAllToggleText: {
    fontSize: moderateScale(11),
    color: '#06B6D4',
    fontWeight: '600',
  },
  showAllToggleTextActive: {
    color: '#FFFFFF',
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
  dateTimeSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: scale(12),
    marginBottom: verticalScale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  dateText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#1F2937',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  timeText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#1F2937',
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(12),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusBadgeFooter: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: 12,
  },
  assigneeInfoFooter: {
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
  // 아래 스타일들은 더 이상 사용하지 않음 (레거시)
  assigneeInfoContainer: {
    position: 'absolute',
    right: scale(16),
    top: scale(90),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: '#F3F4F6',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: 8,
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
