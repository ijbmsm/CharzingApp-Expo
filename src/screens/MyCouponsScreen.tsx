import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserCoupon } from '../types/coupon';
import { convertToLineSeedFont } from '../styles/fonts';
import devLog from '../utils/devLog';
import { RootStackParamList } from '../navigation/RootNavigator';

type CouponTab = 'active' | 'used' | 'expired';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MyCouponsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector((state: RootState) => state.auth.user);

  const [currentTab, setCurrentTab] = useState<CouponTab>('active');
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(false);

  // 쿠폰 조회
  useEffect(() => {
    if (!user) return;

    const fetchCoupons = async () => {
      setLoading(true);
      try {
        const now = Timestamp.now();
        const couponsRef = collection(db, 'userCoupons');

        // 상태별 쿼리
        let q;
        if (currentTab === 'active') {
          q = query(
            couponsRef,
            where('userId', '==', user.uid),
            where('status', '==', 'active'),
            where('expiresAt', '>', now),
            orderBy('expiresAt', 'asc')
          );
        } else if (currentTab === 'used') {
          q = query(
            couponsRef,
            where('userId', '==', user.uid),
            where('status', '==', 'used'),
            orderBy('usedAt', 'desc')
          );
        } else {
          // expired: expiresAt이 지난 것
          q = query(
            couponsRef,
            where('userId', '==', user.uid),
            where('expiresAt', '<', now),
            orderBy('expiresAt', 'desc')
          );
        }

        const snapshot = await getDocs(q);
        const couponList: UserCoupon[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (
            data &&
            typeof data.userId === 'string' &&
            typeof data.couponId === 'string' &&
            typeof data.couponName === 'string' &&
            typeof data.couponDescription === 'string' &&
            typeof data.discountType === 'string' &&
            typeof data.issueReason === 'string' &&
            typeof data.status === 'string' &&
            data.issuedAt instanceof Timestamp &&
            data.expiresAt instanceof Timestamp
          ) {
            couponList.push({
              id: doc.id,
              userId: data.userId,
              couponId: data.couponId,
              couponName: data.couponName,
              couponDescription: data.couponDescription,
              discountType: data.discountType as 'fixed' | 'percentage',
              discountAmount: typeof data.discountAmount === 'number' ? data.discountAmount : undefined,
              discountPercentage: typeof data.discountPercentage === 'number' ? data.discountPercentage : undefined,
              maxDiscountAmount: typeof data.maxDiscountAmount === 'number' ? data.maxDiscountAmount : undefined,
              minOrderAmount: typeof data.minOrderAmount === 'number' ? data.minOrderAmount : undefined,
              issueReason: data.issueReason as 'referral' | 'event' | 'compensation' | 'admin',
              referralCode: typeof data.referralCode === 'string' ? data.referralCode : undefined,
              status: data.status as 'active' | 'used' | 'expired',
              issuedAt: data.issuedAt,
              expiresAt: data.expiresAt,
              usedAt: data.usedAt instanceof Timestamp ? data.usedAt : undefined,
              usedInReservationId: typeof data.usedInReservationId === 'string' ? data.usedInReservationId : undefined,
              usedInPaymentId: typeof data.usedInPaymentId === 'string' ? data.usedInPaymentId : undefined,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
            });
          }
        });

        setCoupons(couponList);
        devLog.info(`✅ 쿠폰 ${couponList.length}개 조회 완료 (${currentTab})`);
      } catch (error) {
        devLog.error('❌ 쿠폰 조회 실패:', error);
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [user, currentTab]);

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const getDiscountText = (coupon: UserCoupon) => {
    if (coupon.discountType === 'fixed' && coupon.discountAmount) {
      return `${coupon.discountAmount.toLocaleString()}원`;
    } else if (coupon.discountType === 'percentage' && coupon.discountPercentage) {
      return `${coupon.discountPercentage}%`;
    }
    return '';
  };

  const getIssueReasonText = (reason: string) => {
    switch (reason) {
      case 'referral':
        return '친구 추천';
      case 'event':
        return '이벤트';
      case 'compensation':
        return '보상';
      case 'admin':
        return '관리자 지급';
      default:
        return '';
    }
  };

  const renderEmptyState = () => {
    let message = '';
    if (currentTab === 'active') message = '사용 가능한 쿠폰이 없습니다';
    if (currentTab === 'used') message = '사용 완료된 쿠폰이 없습니다';
    if (currentTab === 'expired') message = '만료된 쿠폰이 없습니다';

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="ticket-outline" size={40} color="#9CA3AF" />
        </View>
        <Text style={[styles.emptyText, convertToLineSeedFont('Regular')]}>{message}</Text>
      </View>
    );
  };

  const renderCouponCard = (coupon: UserCoupon) => {
    return (
      <View key={coupon.id} style={styles.couponCard}>
        {/* 상단: 할인 금액 + 뱃지 */}
        <View style={styles.couponHeader}>
          <View style={styles.couponHeaderLeft}>
            <Text style={[styles.discountAmount, convertToLineSeedFont('Bold')]}>
              {getDiscountText(coupon)}
              {coupon.discountType === 'fixed' && ' 할인'}
              {coupon.discountType === 'percentage' && ' 할인'}
            </Text>
            <Text style={[styles.couponName, convertToLineSeedFont('Bold')]}>{coupon.couponName}</Text>
          </View>
          <View style={styles.issueBadge}>
            <Text style={[styles.issueBadgeText, convertToLineSeedFont('Regular')]}>
              {getIssueReasonText(coupon.issueReason)}
            </Text>
          </View>
        </View>

        {/* 설명 */}
        <Text style={[styles.couponDescription, convertToLineSeedFont('Regular')]}>{coupon.couponDescription}</Text>

        {/* 최소 주문 금액 */}
        {coupon.minOrderAmount && (
          <View style={styles.minOrderRow}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={[styles.minOrderText, convertToLineSeedFont('Regular')]}>
              최소 주문 금액: {coupon.minOrderAmount.toLocaleString()}원
            </Text>
          </View>
        )}

        {/* 하단: 유효기간 */}
        <View style={styles.couponFooter}>
          <Text style={[styles.dateText, convertToLineSeedFont('Regular')]}>
            {currentTab === 'active' && `${formatDate(coupon.expiresAt)}까지`}
            {currentTab === 'used' && coupon.usedAt && `${formatDate(coupon.usedAt)} 사용`}
            {currentTab === 'expired' && `${formatDate(coupon.expiresAt)} 만료`}
          </Text>
          {currentTab === 'active' && (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('Reservation');
              }}
            >
              <Text style={[styles.useButton, convertToLineSeedFont('Bold')]}>사용하기 →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, convertToLineSeedFont('Bold')]}>내 쿠폰</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'active' && styles.tabActive]}
          onPress={() => setCurrentTab('active')}
        >
          <Text
            style={[styles.tabText, currentTab === 'active' && styles.tabTextActive, convertToLineSeedFont('Bold')]}
          >
            사용 가능
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'used' && styles.tabActive]}
          onPress={() => setCurrentTab('used')}
        >
          <Text style={[styles.tabText, currentTab === 'used' && styles.tabTextActive, convertToLineSeedFont('Bold')]}>
            사용 완료
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'expired' && styles.tabActive]}
          onPress={() => setCurrentTab('expired')}
        >
          <Text
            style={[styles.tabText, currentTab === 'expired' && styles.tabTextActive, convertToLineSeedFont('Bold')]}
          >
            만료됨
          </Text>
        </TouchableOpacity>
      </View>

      {/* 쿠폰 목록 */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#06B6D4" />
          </View>
        ) : coupons.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.couponList}>{coupons.map((coupon) => renderCouponCard(coupon))}</View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#06B6D4',
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
  tabText: {
    fontSize: 13,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  couponList: {
    gap: 12,
  },
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  couponHeaderLeft: {
    flex: 1,
  },
  discountAmount: {
    fontSize: 28,
    color: '#06B6D4',
    marginBottom: 4,
  },
  couponName: {
    fontSize: 14,
    color: '#111827',
  },
  issueBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  issueBadgeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  couponDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  minOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  minOrderText: {
    fontSize: 12,
    color: '#6B7280',
  },
  couponFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  useButton: {
    fontSize: 12,
    color: '#06B6D4',
  },
});
