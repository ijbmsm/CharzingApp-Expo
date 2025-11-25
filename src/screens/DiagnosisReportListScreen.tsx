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
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import firebaseService, { VehicleDiagnosisReport } from '../services/firebaseService';
import { convertToLineSeedFont } from '../styles/fonts';

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
    const diagnosisType = (report as any).diagnosisType || '스탠다드';

    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => navigation.navigate('VehicleDiagnosisReport', {reportId: report.id})}
        activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleTitleRow}>
              <Text style={[styles.vehicleModel, convertToLineSeedFont(styles.vehicleModel)]}>
                {report.vehicleBrand} {report.vehicleName}
              </Text>
              <View style={styles.typeBadge}>
                <Text style={[styles.typeText, convertToLineSeedFont(styles.typeText)]}>
                  {diagnosisType}
                </Text>
              </View>
            </View>
            <Text style={[styles.vehicleYear, convertToLineSeedFont(styles.vehicleYear)]}>
              {report.vehicleYear}년식
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
              SOH
            </Text>
            <Text style={[styles.infoValue, convertToLineSeedFont(styles.infoValue)]}>
              {report.sohPercentage}%
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, convertToLineSeedFont(styles.infoLabel)]}>
              진단일
            </Text>
            <Text style={[styles.infoValue, convertToLineSeedFont(styles.infoValue)]}>
              {formatDate(report.diagnosisDate && typeof report.diagnosisDate === 'object' && 'toDate' in report.diagnosisDate
                ? (report.diagnosisDate as any).toDate()
                : report.diagnosisDate instanceof Date
                  ? report.diagnosisDate
                  : new Date())}
            </Text>
          </View>
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
                    <MaterialCommunityIcons name="clipboard-text" size={28} color="#06B6D4" />
                    <Text style={[styles.summaryTitle, convertToLineSeedFont(styles.summaryTitle)]}>
                      내 진단 리포트
                    </Text>
                  </View>
                  <View style={styles.summaryStats}>
                    <View style={styles.summaryStatItem}>
                      <Text style={[styles.summaryStatNumber, convertToLineSeedFont(styles.summaryStatNumber)]}>
                        {vehicleReports.length}
                      </Text>
                      <Text style={[styles.summaryStatLabel, convertToLineSeedFont(styles.summaryStatLabel)]}>
                        전체
                      </Text>
                    </View>
                    <View style={styles.summaryStatItem}>
                      <Text style={[styles.summaryStatNumber, convertToLineSeedFont(styles.summaryStatNumber)]}>
                        {vehicleReports.filter(r => r.status === 'published').length}
                      </Text>
                      <Text style={[styles.summaryStatLabel, convertToLineSeedFont(styles.summaryStatLabel)]}>
                        완료
                      </Text>
                    </View>
                    <View style={styles.summaryStatItem}>
                      <Text style={[styles.summaryStatNumber, convertToLineSeedFont(styles.summaryStatNumber)]}>
                        {vehicleReports.filter(r => r.status === 'draft' || r.status === 'pending_review').length}
                      </Text>
                      <Text style={[styles.summaryStatLabel, convertToLineSeedFont(styles.summaryStatLabel)]}>
                        작성 중
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 리포트 목록 */}
                <Text style={[styles.sectionTitle, convertToLineSeedFont(styles.sectionTitle)]}>
                  진단 리포트 목록
                </Text>
                {vehicleReports.map(report => (
                  <VehicleReportCard key={report.id} report={report} />
                ))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={64} color="#D1D5DB" />
                <Text style={[styles.emptyTitle, convertToLineSeedFont(styles.emptyTitle)]}>
                  진단 리포트가 없습니다
                </Text>
                <Text style={[styles.emptyDescription, convertToLineSeedFont(styles.emptyDescription)]}>
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
    padding: 20,
  },
  // 요약 카드
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#06B6D4',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  // 섹션 타이틀
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  // 리포트 카드
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  vehicleModel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  typeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  vehicleYear: {
    fontSize: 14,
    color: '#6B7280',
  },
  // 정보 그리드
  infoGrid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DiagnosisReportListScreen;