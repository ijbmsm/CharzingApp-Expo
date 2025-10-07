import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import firebaseService, { VehicleDiagnosisReport, BatteryCell } from '../services/firebaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDiagnosisReport'>;

const VehicleDiagnosisReportScreen: React.FC<Props> = ({ navigation, route }) => {
  const { reportId } = route.params || {};
  const [report, setReport] = useState<VehicleDiagnosisReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    if (!reportId) {
      Alert.alert('오류', '리포트 ID가 없습니다.');
      navigation.goBack();
      return;
    }

    try {
      setIsLoading(true);
      const reportData = await firebaseService.getVehicleDiagnosisReport(reportId);
      
      if (!reportData) {
        Alert.alert('오류', '리포트를 찾을 수 없습니다.');
        navigation.goBack();
        return;
      }
      
      setReport(reportData);
      
      // SOH 게이지 애니메이션 시작
      Animated.timing(animatedValue, {
        toValue: reportData.sohPercentage,
        duration: 1500,
        useNativeDriver: false,
      }).start();
      
      // Firebase에서 셀 데이터가 없을 때 기본 데이터 생성
      if (!reportData.cellsData || reportData.cellsData.length === 0) {
        // 기본 셀 데이터 생성 (총 cellCount 개수만큼, 모두 정상 상태)
        const tempCells: BatteryCell[] = [];
        for (let i = 1; i <= reportData.cellCount; i++) {
          tempCells.push({
            id: i,
            isDefective: false, // 기본값은 모두 정상
          });
        }
        
        reportData.cellsData = tempCells;
      }
    } catch (error) {
      console.error('리포트 로드 실패:', error);
      Alert.alert('오류', '리포트를 불러올 수 없습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getHealthColor = (soh: number) => {
    if (soh >= 90) return '#10B981'; // 녹색 - 매우 좋음
    if (soh >= 80) return '#F59E0B'; // 주황색 - 보통
    if (soh >= 70) return '#EF4444'; // 빨간색 - 주의
    return '#7F1D1D'; // 진한 빨간색 - 교체 필요
  };

  const getHealthText = (soh: number) => {
    if (soh >= 90) return '매우 좋음';
    if (soh >= 80) return '양호';
    if (soh >= 70) return '주의';
    return '교체 권장';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="차량 진단 리포트" 
          showLogo={false} 
          showBackButton={true} 
          onBackPress={() => navigation.goBack()}
        />
        <LoadingSpinner visible={true} message="리포트를 불러오는 중..." overlay={false} />
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="차량 진단 리포트" 
          showLogo={false} 
          showBackButton={true} 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>리포트를 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="차량 진단 리포트" 
        showLogo={false} 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 상단 기본 정보 */}
        <View style={styles.headerSection}>
          <View style={styles.vehicleInfo}>
            <MaterialCommunityIcons name="car-electric" size={40} color="#4495E8" />
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleName}>{report.vehicleName}</Text>
              <Text style={styles.vehicleYear}>{report.vehicleYear}</Text>
              <Text style={styles.diagnosisDate}>진단일: {formatDate(report.diagnosisDate instanceof Date ? report.diagnosisDate : new Date())}</Text>
            </View>
          </View>
        </View>

        {/* SOH 상태 카드 */}
        <View style={styles.sohCard}>
          <View style={styles.sohHeader}>
            <Text style={styles.sohTitle}>SOH(State of Health)</Text>
            <View style={[styles.healthBadge, { backgroundColor: getHealthColor(report.sohPercentage) }]}>
              <Text style={styles.healthBadgeText}>{getHealthText(report.sohPercentage)}</Text>
            </View>
          </View>
          
          {/* 원형 게이지 */}
          <View style={styles.gaugeContainer}>
            <View style={styles.circularGauge}>
              {/* 배경 원 */}
              <View style={styles.backgroundCircle} />
              
              {/* 진행률 원 - SVG 대신 애니메이션으로 구현 */}
              {report.sohPercentage > 0 && (
                <Animated.View 
                  style={[
                    styles.progressCircle,
                    {
                      borderTopColor: getHealthColor(report.sohPercentage),
                      borderRightColor: getHealthColor(report.sohPercentage),
                      borderBottomColor: report.sohPercentage > 50 ? getHealthColor(report.sohPercentage) : '#E5E7EB',
                      borderLeftColor: report.sohPercentage > 25 ? getHealthColor(report.sohPercentage) : '#E5E7EB',
                      opacity: animatedValue.interpolate({
                        inputRange: [0, 100],
                        outputRange: [0.3, 1],
                      }),
                      transform: [
                        {
                          rotate: animatedValue.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0deg', `${(report.sohPercentage / 100) * 360}deg`],
                          }),
                        },
                      ],
                    }
                  ]}
                />
              )}
              
              {/* 중앙 텍스트 */}
              <View style={styles.gaugeCenter}>
                <Text 
                  style={[
                    styles.gaugePercentage, 
                    { color: getHealthColor(report.sohPercentage) }
                  ]}
                >
                  {report.sohPercentage}%
                </Text>
                <Text style={styles.gaugeLabel}>SOH</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 기본 정보 그리드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="battery-half-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>셀 개수</Text>
              <Text style={styles.infoValue}>{report.cellCount}개</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="warning-outline" size={20} color="#EF4444" />
              <Text style={styles.infoLabel}>불량 개수</Text>
              <Text style={styles.infoValue}>{report.defectiveCellCount}개</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="flash-outline" size={20} color="#10B981" />
              <Text style={styles.infoLabel}>일반 충전</Text>
              <Text style={styles.infoValue}>{report.normalChargeCount}회</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="flash" size={20} color="#F59E0B" />
              <Text style={styles.infoLabel}>급속 충전</Text>
              <Text style={styles.infoValue}>{report.fastChargeCount}회</Text>
            </View>
          </View>
        </View>

        {/* 셀 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>셀 정보</Text>
          <View style={styles.cellContainer}>
            {report.cellsData && report.cellsData.map((cell) => (
              <View
                key={cell.id}
                style={[
                  styles.cellItem,
                  {
                    backgroundColor: cell.isDefective ? '#FEE2E2' : '#DCFCE7',
                    borderColor: cell.isDefective ? '#EF4444' : '#10B981',
                  }
                ]}
              >
                <Text style={[
                  styles.cellNumber,
                  {
                    color: cell.isDefective ? '#EF4444' : '#059669',
                  }
                ]}>
                  {cell.id}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.cellLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>정상 셀</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>불량 셀</Text>
            </View>
          </View>
        </View>

        {/* 세부 진단 결과 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>세부 진단 결과</Text>
          <View style={styles.table}>
            {/* 테이블 헤더 */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.categoryColumn]}>구분</Text>
              <Text style={[styles.tableHeaderText, styles.valueColumn]}>측정값</Text>
              <Text style={[styles.tableHeaderText, styles.interpretationColumn]}>해석</Text>
            </View>
            
            {/* 테이블 로우들 */}
            {report.diagnosisDetails.map((detail, index) => (
              <View key={index} style={[
                styles.tableRow,
                index % 2 === 1 && styles.tableRowAlternate
              ]}>
                <Text style={[styles.tableCellText, styles.categoryColumn, styles.categoryCell]}>
                  {detail.category}
                </Text>
                <Text style={[styles.tableCellText, styles.valueColumn, styles.valueCell]}>
                  {detail.category === 'SOH' && !detail.measuredValue.includes('%') 
                    ? `${detail.measuredValue}%` 
                    : detail.measuredValue}
                </Text>
                <Text style={[styles.tableCellText, styles.interpretationColumn, styles.interpretationCell]}>
                  {detail.interpretation}
                </Text>
              </View>
            ))}
          </View>
        </View>
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
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetails: {
    flex: 1,
    marginLeft: 16,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  diagnosisDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sohCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sohHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sohTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  healthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularGauge: {
    width: 120,
    height: 120,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#E5E7EB',
  },
  progressCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#10B981',
  },
  gaugeCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugePercentage: {
    fontSize: 24,
    fontWeight: '700',
  },
  gaugeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  table: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  tableRowAlternate: {
    backgroundColor: '#FAFBFC',
  },
  tableCellText: {
    fontSize: 13,
    color: '#1F2937',
    textAlign: 'left',
  },
  categoryColumn: {
    flex: 1.2,
    paddingHorizontal: 8,
  },
  valueColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  interpretationColumn: {
    flex: 2,
    paddingHorizontal: 8,
  },
  categoryCell: {
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  valueCell: {
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  interpretationCell: {
    color: '#6B7280',
    lineHeight: 18,
    textAlign: 'center',
  },
  // 셀 정보 섹션 스타일
  cellContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cellItem: {
    width: 40,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  cellNumber: {
    fontSize: 10,
    fontWeight: '600',
  },
  cellLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default VehicleDiagnosisReportScreen;