import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
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
            <View style={[styles.statusBadge, {backgroundColor: '#10B981'}]}>
              <Text style={styles.statusText}>진단 완료</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="battery-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>SOH</Text>
              <Text style={styles.infoValue}>{report.sohPercentage}%</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="car-outline" size={20} color="#666" />
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
          <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
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
                    <MaterialCommunityIcons name="file-document-multiple" size={24} color="#4495E8" />
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
                        {vehicleReports.filter(r => r.status === 'completed').length}
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
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  summaryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4495E8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  listSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  reportType: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  cardContent: {
    marginBottom: 12,
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
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  viewReportText: {
    fontSize: 14,
    color: '#4495E8',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
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
  dateText: {
    fontSize: 12,
    color: '#666',
  },
});

export default DiagnosisReportListScreen;