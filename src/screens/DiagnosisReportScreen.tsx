import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import firebaseService, { DiagnosisReport } from '../services/firebaseService';
import devLog from '../utils/devLog';

type Props = NativeStackScreenProps<RootStackParamList, 'DiagnosisReport'>;

const {width} = Dimensions.get('window');

const DiagnosisReportScreen: React.FC<Props> = ({navigation, route}) => {
  const {reportId} = route.params || {};
  const [report, setReport] = useState<DiagnosisReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const reportData = await firebaseService.getDiagnosisReport(reportId);
      
      if (!reportData) {
        Alert.alert('오류', '리포트를 찾을 수 없습니다.');
        navigation.goBack();
        return;
      }
      
      setReport(reportData);
    } catch (error) {
      devLog.error('리포트 로드 실패:', error);
      Alert.alert('오류', '리포트를 불러올 수 없습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilePress = async (fileUrl: string, fileName: string) => {
    try {
      const canOpen = await Linking.canOpenURL(fileUrl);
      if (canOpen) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('오류', '파일을 열 수 없습니다.');
      }
    } catch (error) {
      devLog.error('파일 열기 실패:', error);
      Alert.alert('오류', '파일을 열 수 없습니다.');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return 'image-outline';
    } else if (type === 'application/pdf') {
      return 'document-text-outline';
    }
    return 'document-outline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return '#3B82F6';
      case 'processing': return '#F59E0B';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploaded': return '업로드됨';
      case 'processing': return '처리 중';
      case 'completed': return '완료';
      default: return '알 수 없음';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="진단 리포트" 
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
          title="진단 리포트" 
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

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="진단 리포트" 
        showLogo={false} 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 리포트 헤더 */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
              <Text style={styles.statusText}>{getStatusText(report.status)}</Text>
            </View>
          </View>
          
          {report.description && (
            <Text style={styles.reportDescription}>{report.description}</Text>
          )}
          
          <Text style={styles.dateText}>
            업로드: {formatDate(report.createdAt instanceof Date ? report.createdAt : undefined)}
          </Text>
        </View>

        {/* 첨부 파일 목록 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>첨부 파일</Text>
          {report.files.map((file, index) => (
            <TouchableOpacity
              key={index}
              style={styles.fileItem}
              onPress={() => handleFilePress(file.url, file.name)}
            >
              <View style={styles.fileInfo}>
                <Ionicons 
                  name={getFileIcon(file.type)} 
                  size={24} 
                  color="#4495E8" 
                />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.fileType}>
                    {file.type === 'application/pdf' ? 'PDF 문서' : '이미지 파일'}
                  </Text>
                </View>
              </View>
              <Ionicons name="download-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          ))}
        </View>

        {/* 리포트 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>리포트 정보</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>상태</Text>
              <Text style={styles.infoValue}>{getStatusText(report.status)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>파일 수</Text>
              <Text style={styles.infoValue}>{report.files.length}개</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>생성일</Text>
              <Text style={styles.infoValue}>
                {(report.createdAt instanceof Date ? report.createdAt : new Date()).toLocaleDateString('ko-KR')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>수정일</Text>
              <Text style={styles.infoValue}>
                {(report.updatedAt instanceof Date ? report.updatedAt : new Date()).toLocaleDateString('ko-KR')}
              </Text>
            </View>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reportDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  fileType: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
});

export default DiagnosisReportScreen;