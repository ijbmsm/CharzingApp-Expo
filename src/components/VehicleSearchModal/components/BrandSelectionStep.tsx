import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { convertToLineSeedFont } from '../../../styles/fonts';
import { type BrandData } from '../types';

interface BrandSelectionStepProps {
  brands: BrandData[];
  firestoreLoading: boolean;
  onBrandSelect: (brandName: string) => void;
}

const BrandSelectionStep: React.FC<BrandSelectionStepProps> = ({
  brands,
  firestoreLoading,
  onBrandSelect,
}) => {
  const renderBrandGrid = () => {
    return (
      <ScrollView 
        style={styles.brandScrollView}
        contentContainerStyle={styles.brandGridContainer}
        showsVerticalScrollIndicator={false}
      >
        {brands.map((brand) => (
          <TouchableOpacity
            key={brand.id}
            style={styles.brandItemWrapper}
            onPress={() => onBrandSelect(brand.name)}
            activeOpacity={0.7}
          >
            <View style={styles.brandItem}>
              <Image
                source={
                  brand.logoUrl
                    ? { uri: brand.logoUrl }
                    : require('../../../assets/images/logo.png')
                }
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandName, convertToLineSeedFont(styles.brandName)]}>
              {brand.name}
            </Text>
            {brand.modelsCount && (
              <Text style={[styles.brandModelCount, convertToLineSeedFont(styles.brandModelCount)]}>
                {brand.modelsCount}개 모델
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <Animatable.View
      animation="fadeIn"
      style={styles.container}
    >
      {firestoreLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Firebase에서 브랜드를 불러오는 중...</Text>
        </View>
      ) : brands.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color="#9CA3AF" />
          <Text style={styles.noResultsTitle}>Firebase 연결 실패</Text>
          <Text style={styles.noResultsSubtitle}>
            네트워크 연결을 확인하고 다시 시도해주세요.
          </Text>
        </View>
      ) : (
        renderBrandGrid()
      )}
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  brandScrollView: {
    flex: 1,
  },
  brandGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  brandItemWrapper: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandItem: {
    width: 85,
    height: 85,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandLogo: {
    width: 50,
    height: 50,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  brandModelCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default BrandSelectionStep;