import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import firebaseService, { VehicleDiagnosisReport } from '../services/firebaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'DiagnosisReportList'>;


const DiagnosisReportListScreen: React.FC<Props> = ({navigation}) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [vehicleReports, setVehicleReports] = useState<VehicleDiagnosisReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // 마운트 상태 추적
    
    const loadReportsWithMountCheck = async () => {
      if (!isMounted) return;
      await loadReports(isMounted);
    };
    
    loadReportsWithMountCheck();
    
    // Cleanup 함수
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  const loadReports = async (isMounted = true) => {
    if (!isAuthenticated || !user?.uid) {
      if (isMounted) {
        setVehicleReports([]);
        setIsLoading(false);
      }
      return;
    }

    try {
      if (isMounted) {
        setIsLoading(true);
      }
      
      const userVehicleReports = await firebaseService.getUserVehicleDiagnosisReports(user.uid);
      
      if (isMounted) {
        setVehicleReports(userVehicleReports);
      }
    } catch (error) {
      if (isMounted) {
        console.error('리포트 목록 로드 실패:', error);
        Alert.alert('오류', '리포트 목록을 불러올 수 없습니다.');
        setVehicleReports([]);
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };


  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const VehicleReportCard: React.FC<{report: VehicleDiagnosisReport}> = ({report}) => {
    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => navigation.navigate('VehicleDiagnosisReport', {reportId: report.id})}
        activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleModel}>{report.vehicleName}</Text>
            <Text style={styles.reportType}>{report.vehicleYear}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, {backgroundColor: '#06B6D4'}]}>
              <Text style={styles.statusText}>진단 완료</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="battery-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>SOH</Text>
              <Text style={styles.infoValue}>{report.sohPercentage}%</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="car-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>주행거리</Text>
              <Text style={styles.infoValue}>{report.realDrivableDistance}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            진단일: {formatDate(report.diagnosisDate && typeof report.diagnosisDate === 'object' && 'toDate' in report.diagnosisDate
              ? (report.diagnosisDate as any).toDate()
              : report.diagnosisDate instanceof Date
                ? report.diagnosisDate
                : new Date())}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="진단 리포트 목록"
        showBackButton={true}
        showLogo={false}
        showNotification={true}
        onBackPress={() => navigation.goBack()}
      />
      
      {isLoading ? (
        <LoadingSpinner visible={true} message="리포트 목록을 불러오는 중..." overlay={false} />
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {vehicleReports.length > 0 ? (
              <>
                {/* 요약 카드 */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <MaterialCommunityIcons name="file-document-multiple" size={24} color="#06B6D4" />
                    <Text style={styles.summaryTitle}>내 진단 리포트</Text>
                  </View>
                  <Text style={styles.summaryDescription}>
                    총 {vehicleReports.length}개의 진단 리포트가 있습니다.
                  </Text>
                  <View style={styles.summaryStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>
                        {vehicleReports.filter(r => r.status === 'draft').length}
                      </Text>
                      <Text style={styles.statLabel}>작성 중</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>
                        {vehicleReports.filter(r => r.status === 'published').length}
                      </Text>
                      <Text style={styles.statLabel}>완료</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>
                        {vehicleReports.length}
                      </Text>
                      <Text style={styles.statLabel}>전체</Text>
                    </View>
                  </View>
                </View>

                {/* 차량 진단 리포트 목록 */}
                <View style={styles.listSection}>
                  <Text style={styles.sectionTitle}>진단 리포트 목록</Text>
                  {vehicleReports.map(report => (
                    <VehicleReportCard key={report.id} report={report} />
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>진단 리포트가 없습니다</Text>
                <Text style={styles.emptyDescription}>
                  아직 진단 리포트가 없습니다.{"\n"}
                  진단 예약을 통해 리포트를 받아보세요.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: scale(16),
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: scale(16),
    marginBottom: verticalScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  summaryTitle: {
    fontSize: moderateScale(15, 1),
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: scale(8),
  },
  summaryDescription: {
    fontSize: moderateScale(12, 1),
    color: '#6B7280',
    marginBottom: verticalScale(12),
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: moderateScale(20, 1),
    fontWeight: '700',
    color: '#06B6D4',
    marginBottom: verticalScale(4),
  },
  statLabel: {
    fontSize: moderateScale(11, 1),
    color: '#6B7280',
  },
  listSection: {
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(14, 1),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: verticalScale(12),
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: scale(14),
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(10),
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: moderateScale(14, 1),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: verticalScale(4),
  },
  reportType: {
    fontSize: moderateScale(12, 1),
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: 16,
  },
  statusText: {
    fontSize: moderateScale(11, 1),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardContent: {
    marginBottom: verticalScale(10),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: moderateScale(12, 1),
    color: '#6B7280',
    marginLeft: scale(6),
    marginRight: scale(6),
  },
  infoValue: {
    fontSize: moderateScale(12, 1),
    fontWeight: '600',
    color: '#1F2937',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  viewReportText: {
    fontSize: moderateScale(12, 1),
    color: '#06B6D4',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(50),
    paddingHorizontal: scale(20),
  },
  emptyTitle: {
    fontSize: moderateScale(15, 1),
    fontWeight: '600',
    color: '#6B7280',
    marginTop: verticalScale(12),
    marginBottom: verticalScale(6),
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: moderateScale(12, 1),
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  dateText: {
    fontSize: moderateScale(11, 1),
    color: '#6B7280',
  },
});

export default DiagnosisReportListScreen;