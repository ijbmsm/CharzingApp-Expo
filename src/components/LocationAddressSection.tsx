import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddressSearch from './AddressSearch';

interface LocationAddressSectionProps {
  // UI 표시 모드
  mode: 'full' | 'summary'; // full: 전체 지도+입력, summary: 요약 표시

  // 위치 데이터
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  userAddress: string;
  detailAddress: string;

  // 상태
  isLoadingAddress: boolean;
  locationPermission: boolean;

  // 이벤트 핸들러
  onAddressChange: (address: string) => void;
  onDetailAddressChange: (detailAddress: string) => void;
  onMapClick: (latitude: number, longitude: number, showAlert?: boolean) => void | Promise<void>;
  onResetLocation: () => void;
}

const LocationAddressSection: React.FC<LocationAddressSectionProps> = ({
  mode,
  userLocation,
  userAddress,
  detailAddress,
  isLoadingAddress,
  locationPermission,
  onAddressChange,
  onDetailAddressChange,
  onMapClick,
  onResetLocation,
}) => {
  // 부드러운 전환을 위한 애니메이션
  const animationValue = useRef(new Animated.Value(mode === 'full' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: mode === 'full' ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // layout 애니메이션이므로 false
    }).start();
  }, [mode, animationValue]);
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>진단 위치</Text>
      
      {/* Summary 모드 */}
      {mode === 'summary' && (
        <View style={styles.summaryCard}>
          <Ionicons name="location-outline" size={20} color="#4495E8" />
          <View style={styles.summaryText}>
            <Text style={styles.summaryMain}>{userAddress}</Text>
            {detailAddress && (
              <Text style={styles.summaryDetail}>{detailAddress}</Text>
            )}
          </View>
        </View>
      )}

      {/* Full 모드 */}
      {mode === 'full' && (
        <View style={styles.fullCard}>
          {/* 상단 주소 표시 */}
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={20} color="#4495E8" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryMain}>
                {userAddress || "지도에서 위치를 선택하거나 주소를 입력해주세요"}
              </Text>
              {detailAddress && (
                <Text style={styles.summaryDetail}>{detailAddress}</Text>
              )}
            </View>
          </View>

          {/* 주소 입력 필드들 */}
          <View style={styles.addressInputSection}>
            <Text style={styles.inputLabel}>주소</Text>
            {isLoadingAddress ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>📍 주소를 가져오는 중...</Text>
              </View>
            ) : (
              <AddressSearch
                placeholder="주소를 검색하세요"
                value={userAddress}
                onAddressSelect={(address, zonecode) => {
                  console.log('주소 선택됨:', address, zonecode);
                  onAddressChange(address);
                }}
              />
            )}

            <Text style={styles.inputLabel}>상세주소</Text>
            <TextInput
              style={styles.detailAddressInput}
              placeholder="아파트, 동·호수, 건물명 등"
              value={detailAddress}
              onChangeText={onDetailAddressChange}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // 공통 컨테이너
  container: {
    padding: 16,
  },
  // Summary mode styles
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryText: {
    marginLeft: 12,
    flex: 1,
  },
  summaryMain: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  summaryDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  // Full mode styles
  fullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  mapLocationButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  mapLocationButtonDisabled: {
    backgroundColor: 'rgba(243, 244, 246, 0.9)',
  },
  addressInputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    minHeight: 48, // 상세주소와 동일한 기본 높이
    maxHeight: 120, // 최대 높이 제한
    textAlignVertical: 'center', // 세로 가운데 정렬
  },
  detailAddressInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    height: 48, // 고정 높이
    textAlignVertical: 'center', // 세로 가운데 정렬
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default LocationAddressSection;