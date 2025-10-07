import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Header from '../components/Header';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';

type DiagnosticScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const DiagnosticScreen: React.FC = () => {
  const navigation = useNavigation<DiagnosticScreenNavigationProp>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();

  const handleReservation = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login', { showBackButton: true });
      return;
    }
    navigation.navigate('DiagnosisReservation');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="진단 예약" showLogo={false} />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Text style={styles.title}>전기차 배터리 진단 예약</Text>
        <Text style={styles.description}>
          차징 직원이 직접 방문하여 전기차 배터리 상태를 정확히 진단해드립니다.
        </Text>
        
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>방문 진단</Text>
            <Text style={styles.infoDescription}>
              차직 직원이 직접 방문하여 전기차 배터리의 전반적인 상태를 점검합니다.
            </Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>상세 진단 리포트</Text>
            <Text style={styles.infoDescription}>
              진단 완료 후 배터리 상태, 성능, 안전성에 대한 상세한 리포트를 제공합니다.
            </Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💰 합리적인 가격</Text>
            <Text style={styles.infoDescription}>
              투명하고 합리적인 진단 비용으로 안전한 전기차 구매/판매를 지원합니다.
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.reserveButton} onPress={handleReservation}>
          <Text style={styles.reserveButtonText}>진단 예약하기</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  reserveButton: {
    backgroundColor: '#4495E8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  reserveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoSection: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default DiagnosticScreen;