import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// ✅ Interactive SVG 컴포넌트 import
import InteractiveTopSvg from '../components/InteractiveTopSvg';
// 나머지는 V2 방식 (향후 interactive 버전으로 전환)
import BottomSvg from '../../assets/vehicle-outline-svg/하부.svg';
import LeftSvg from '../../assets/vehicle-outline-svg/좌측.svg';
import RightSvg from '../../assets/vehicle-outline-svg/우측.svg';

export default function OutlineTestScreen() {
  const navigation = useNavigation();
  const [highlightedParts, setHighlightedParts] = useState<string[]>([]);
  const [problemParts, setProblemParts] = useState<string[]>([]); // 리포트에서 로드한 문제 부위 (고정)
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  // 리포트 ID (테스트용)
  const REPORT_ID = 'report_1763632309560_guest_0d796dcd-651d-475b-ad45-234d0491048c';

  // 리포트 데이터 로드
  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const reportRef = doc(db, 'vehicleDiagnosisReports', REPORT_ID);
      const reportSnap = await getDoc(reportRef);

      if (reportSnap.exists()) {
        const data = reportSnap.data();
        setReportData(data);

        console.log('📋 리포트 데이터:', {
          hasExterior: !!data.vehicleExteriorInspection,
          exteriorKeys: data.vehicleExteriorInspection ? Object.keys(data.vehicleExteriorInspection) : [],
          sampleData: data.vehicleExteriorInspection ?
            Object.entries(data.vehicleExteriorInspection).slice(0, 3) : []
        });

        // 리포트 부위명 → SVG ID 매핑 함수
        const mapLocationToSvgId = (location: string): string[] => {
          const mapped: string[] = [];

          // 키워드 기반 매칭
          if (location.includes('사이드실패널')) mapped.push('사이드실패널(8)');
          if (location.includes('리어펜더')) mapped.push('리어펜더(6)');
          if (location.includes('A필러')) mapped.push('필러패널(14)');
          if (location.includes('B필러')) mapped.push('필러패널(14)');
          if (location.includes('C필러')) mapped.push('필러패널(14)');
          if (location.includes('후드') || location.includes('보닛')) mapped.push('후드(1)');
          if (location.includes('루프패널')) mapped.push('루프패널(7)');
          if (location.includes('트렁크')) mapped.push('트렁크리드(4)');
          if (location.includes('프론트펜더')) mapped.push('리어펜더(6)'); // 임시
          if (location.includes('도어')) mapped.push('도어(3)');
          if (location.includes('타이어')) mapped.push('타이어(좌)');

          return mapped;
        };

        // vehicleExteriorInspection에서 problem 상태인 부위들 추출
        const exterior = data.vehicleExteriorInspection;
        const problems: string[] = [];

        if (exterior) {
          // bodyPanel 배열에서 problem 상태인 부위 추출
          if (Array.isArray(exterior.bodyPanel)) {
            exterior.bodyPanel.forEach((panel: any) => {
              if (panel.status === 'problem' && panel.location) {
                const svgIds = mapLocationToSvgId(panel.location);
                problems.push(...svgIds);
                console.log('🔴 Problem body panel:', panel.location, '→', svgIds);
              }
            });
          }

          // tiresAndWheels에서 problem 상태인 타이어 추출
          if (exterior.tiresAndWheels) {
            Object.entries(exterior.tiresAndWheels).forEach(([tireName, tire]: [string, any]) => {
              if (tire.wheelStatus === 'problem') {
                problems.push('타이어(좌)'); // 임시로 좌측 타이어로 매핑
                console.log('🔴 Problem tire:', tireName);
              }
            });
          }

          setProblemParts(problems);
          setHighlightedParts(problems); // 초기에는 문제 부위만 표시
          console.log('🔴 Total problem parts (SVG IDs):', problems);
        } else {
          console.log('⚠️ vehicleExteriorInspection 데이터가 없습니다.');
        }
      } else {
        console.log('⚠️ 리포트를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ 리포트 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 부위 클릭 핸들러 (문제 부위는 해제 불가)
  const handlePartPress = (partName: string) => {
    // 리포트의 문제 부위는 클릭해도 해제되지 않음
    if (problemParts.includes(partName)) {
      console.log('⚠️ 리포트의 문제 부위는 해제할 수 없습니다:', partName);
      return;
    }

    setHighlightedParts(prev => {
      if (prev.includes(partName)) {
        return prev.filter(p => p !== partName);
      } else {
        return [...prev, partName];
      }
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>차량 외관 진단</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>리포트 데이터 로딩 중...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 리포트 정보 */}
          {reportData && (
            <View style={styles.reportInfoCard}>
              <Text style={styles.reportInfoTitle}>차량 정보</Text>
              <Text style={styles.reportInfoText}>
                {reportData.vehicle?.make} {reportData.vehicle?.model} {reportData.vehicle?.year}
              </Text>
              <View style={styles.damageCountBadge}>
                <View style={styles.damageDot} />
                <Text style={styles.damageCountText}>손상 부위 {problemParts.length}개</Text>
              </View>
            </View>
          )}

          {/* 차량 외관 뷰 - 한 카드 안에 세로로 나란히 */}
          <View style={styles.viewsContainer}>
            {/* 상부 */}
            <View style={styles.viewItem}>
              <View style={styles.svgViewportInline}>
                <View style={styles.rotateLeft}>
                  <InteractiveTopSvg
                    width="100%"
                    height="100%"
                    highlightedParts={highlightedParts}
                    onPartPress={handlePartPress}
                  />
                </View>
              </View>
            </View>

            {/* 좌측 */}
            <View style={styles.viewItem}>
              <View style={styles.svgViewportInline}>
                <View style={styles.rotateLeft}>
                  <LeftSvg
                    width="100%"
                    height="100%"
                    viewBox="932 1200 1240 1770"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </View>
              </View>
            </View>

            {/* 우측 */}
            <View style={styles.viewItem}>
              <View style={styles.svgViewportInline}>
                <View style={styles.rotateRight}>
                  <RightSvg
                    width="100%"
                    height="100%"
                    viewBox="2290 1200 1240 1770"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </View>
              </View>
            </View>

            {/* 하부 */}
            <View style={styles.viewItem}>
              <View style={styles.svgViewportInline}>
                <View style={styles.rotateRight}>
                  <BottomSvg
                    width="100%"
                    height="100%"
                    viewBox="3054 1200 1240 1770"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 문제 부위 목록 */}
          {problemParts.length > 0 && (
            <View style={styles.problemSection}>
              <Text style={styles.problemTitle}>발견된 문제 부위</Text>
              <View style={styles.problemList}>
                {problemParts.map((part, index) => (
                  <View key={index} style={styles.problemItem}>
                    <View style={styles.problemDot} />
                    <Text style={styles.problemText}>{part}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 범례 */}
          <View style={styles.legendSection}>
            <Text style={styles.legendTitle}>범례</Text>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>손상 부위</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  reportInfoCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reportInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  reportInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  damageCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  damageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  damageCountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  viewsContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  viewItem: {
    width: '100%',
  },
  svgViewportInline: {
    width: '100%',
    height: 160,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  rotateLeft: {
    transform: [{ rotate: '-90deg' }, { translateY: -40 }],
    width: 240,
    height: 240,
  },
  rotateRight: {
    transform: [{ rotate: '90deg' }, { translateY: -40 }],
    width: 240,
    height: 240,
  },
  problemSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  problemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 12,
  },
  problemList: {
    gap: 8,
  },
  problemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  problemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  problemText: {
    fontSize: 14,
    color: '#7F1D1D',
  },
  legendSection: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
