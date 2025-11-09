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
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Timestamp } from 'firebase/firestore';

import { RootState } from '../store';
import firebaseService, { DiagnosisReservation } from '../services/firebaseService';
import { handleFirebaseError } from '../services/errorHandler';

/**
 * 예약 승인 화면
 * - pending 상태의 예약 목록 표시
 * - 정비사가 예약을 할당받을 수 있음
 * - 이미 할당된 예약은 담당자 이름 표시
 */
const ReservationApprovalScreen: React.FC = () => {
  const navigation = useNavigation();
  // Redux state
  const user = useSelector((state: RootState) => state.auth.user);

  // State
  const [reservations, setReservations] = useState<DiagnosisReservation[]>([]);
  const [confirmedReservations, setConfirmedReservations] = useState<DiagnosisReservation[]>([]);
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

  // 예약 목록 로드
  const loadReservations = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);

      // pending과 confirmed 예약을 모두 가져옴
      const [pending, confirmed] = await Promise.all([
        firebaseService.getPendingReservations(),
        firebaseService.getAllConfirmedReservations(),
      ]);

      if (isMountedRef.current) {
        setReservations(pending);
        setConfirmedReservations(confirmed);
      }
    } catch (error) {
      console.error('예약 목록 로드 실패:', error);
      if (isMountedRef.current) {
        const errorMessage = handleFirebaseError(error, {
          actionName: 'load_pending_reservations',
        });
        Alert.alert('오류', errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // 날짜 필터링된 예약 목록
  const getFilteredReservations = useCallback(() => {
    // pending과 confirmed를 합침
    const allReservations = [...reservations, ...confirmedReservations];

    if (!selectedDateFilter) {
      // 필터가 없으면 모든 예약을 시간순으로 정렬
      return allReservations.sort((a, b) => {
        const dateA = a.requestedDate instanceof Timestamp ? a.requestedDate.toDate() : a.requestedDate as Date;
        const dateB = b.requestedDate instanceof Timestamp ? b.requestedDate.toDate() : b.requestedDate as Date;
        return dateA.getTime() - dateB.getTime();
      });
    }

    // 선택된 날짜의 예약만 필터링
    const filtered = allReservations.filter((reservation) => {
      const resDate = reservation.requestedDate instanceof Timestamp
        ? reservation.requestedDate.toDate()
        : reservation.requestedDate as Date;

      return (
        resDate.getFullYear() === selectedDateFilter.getFullYear() &&
        resDate.getMonth() === selectedDateFilter.getMonth() &&
        resDate.getDate() === selectedDateFilter.getDate()
      );
    });

    // 시간순 정렬
    return filtered.sort((a, b) => {
      const dateA = a.requestedDate instanceof Timestamp ? a.requestedDate.toDate() : a.requestedDate as Date;
      const dateB = b.requestedDate instanceof Timestamp ? b.requestedDate.toDate() : b.requestedDate as Date;
      const timeA = dateA.getHours() * 60 + dateA.getMinutes();
      const timeB = dateB.getHours() * 60 + dateB.getMinutes();
      return timeA - timeB;
    });
  }, [reservations, confirmedReservations, selectedDateFilter]);

  // 일주일치 날짜 생성 (재사용)
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

  // 날짜 라벨 생성 (재사용)
  const getDateLabel = useCallback((date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

    return `${month}월 ${day}일(${dayOfWeek})`;
  }, []);

  // 예약 할당 처리
  const handleAssignReservation = useCallback(
    async (reservationId: string) => {
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      if (!isMountedRef.current) return;

      try {
        setAssigningReservationId(reservationId);

        const userName = user.displayName || user.realName || '이름 없음';

        await firebaseService.assignReservationToMechanic(
          reservationId,
          user.uid,
          userName
        );

        if (isMountedRef.current) {
          Alert.alert('성공', '예약을 할당받았습니다.', [
            {
              text: '확인',
              onPress: () => {
                loadReservations();
              },
            },
          ]);
        }
      } catch (error) {
        console.error('예약 할당 실패:', error);
        if (isMountedRef.current) {
          const errorMessage = handleFirebaseError(error, {
            actionName: 'assign_reservation',
            additionalData: { reservationId },
          });
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

  // 예약 카드 렌더링
  const renderReservationItem = useCallback(
    ({ item: reservation }: { item: DiagnosisReservation }) => {
      const date = reservation.requestedDate instanceof Timestamp
        ? reservation.requestedDate.toDate()
        : reservation.requestedDate as Date;

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
            <Text style={styles.reservationTime}>{timeString}</Text>
          </View>

          {/* 예약 정보 */}
          <View style={styles.reservationInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{dateString}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{reservation.userPhone || '전화번호 없음'}</Text>
            </View>
            {reservation.vehicleBrand && (
              <View style={styles.infoRow}>
                <Ionicons name="car-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  {reservation.vehicleBrand} {reservation.vehicleModel} {reservation.vehicleYear}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={2}>
                {reservation.address}
                {reservation.detailAddress && ` ${reservation.detailAddress}`}
              </Text>
            </View>
          </View>

          {/* 액션 버튼 */}
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
    [user, assigningReservationId, handleAssignReservation]
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>예약 승인</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadReservations}>
          <Ionicons name="refresh" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* 날짜 필터 */}
      {(reservations.length > 0 || confirmedReservations.length > 0) && (
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
        <FlatList<DiagnosisReservation>
          data={getFilteredReservations()}
          keyExtractor={(item) => item.id}
          renderItem={renderReservationItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>예약이 없습니다</Text>
              <Text style={styles.emptyText}>
                {selectedDateFilter
                  ? '해당 날짜에 예약이 없습니다.'
                  : '대기 중인 예약이 없습니다.'}
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
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: scale(8),
  },
  headerTitle: {
    flex: 1,
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginRight: scale(40), // refreshButton 크기만큼 오프셋 (중앙 정렬용)
  },
  refreshButton: {
    padding: scale(8),
  },
  dateFilterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  dateFilterLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#6B7280',
  },
  clearFilterButton: {
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(8),
  },
  clearFilterText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#06B6D4',
  },
  dateButtonsContainer: {
    paddingRight: scale(20),
  },
  dateButton: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginRight: scale(10),
    minWidth: scale(110),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateButtonActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dateButtonText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#374151',
    letterSpacing: -0.3,
  },
  dateButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: scale(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  emptyContainer: {
    paddingTop: verticalScale(80),
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#374151',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    textAlign: 'center',
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
    flexWrap: 'wrap',
    gap: scale(8),
  },
  reservationName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(8),
    borderRadius: 6,
    gap: scale(4),
  },
  statusBadgeMe: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#6B7280',
  },
  statusBadgeTextMe: {
    color: '#10B981',
  },
  reservationTime: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#06B6D4',
  },
  reservationInfo: {
    gap: verticalScale(8),
    marginBottom: verticalScale(12),
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
    gap: scale(8),
  },
  assignButtonDisabled: {
    opacity: 0.6,
  },
  assignButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ReservationApprovalScreen;
