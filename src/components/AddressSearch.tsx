import React, { useState } from "react";
import { 
  View, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import devLog from '../utils/devLog';

type AddressSearchProps = {
  onAddressSelect?: (address: string, zonecode: string) => void;
  placeholder?: string;
  value?: string;
};

interface AddressResult {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  category_group_code: string;
  category_group_name: string;
  category_name: string;
  phone: string;
  distance: string;
  search_type?: 'address' | 'keyword';
}

interface KakaoLocalResponse {
  documents: AddressResult[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

export default function AddressSearch({
  onAddressSelect,
  placeholder = "주소를 검색하세요",
  value = "",
}: AddressSearchProps) {
  
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const KAKAO_REST_API_KEY = Constants.expoConfig?.extra?.KAKAO_REST_API_KEY;

  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (!KAKAO_REST_API_KEY) {
      Alert.alert('오류', 'API 키가 설정되지 않았습니다.');
      return;
    }

    setIsLoading(true);
    try {
      devLog.log('📍 주소 검색 시작:', query);
      
      // 주소 검색과 키워드 검색을 병렬로 실행
      const [addressResponse, keywordResponse] = await Promise.all([
        // 주소 검색
        fetch(
          `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}&size=5`,
          {
            method: 'GET',
            headers: {
              'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        ),
        // 키워드 검색 (건물명, 장소명 등)
        fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=10`,
          {
            method: 'GET',
            headers: {
              'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )
      ]);

      if (!addressResponse.ok || !keywordResponse.ok) {
        throw new Error('API 호출 실패');
      }

      const addressData: KakaoLocalResponse = await addressResponse.json();
      const keywordData: KakaoLocalResponse = await keywordResponse.json();
      
      devLog.log('📍 주소 검색 결과:', addressData.documents.length, '건');
      devLog.log('📍 키워드 검색 결과:', keywordData.documents.length, '건');
      
      // 결과 합치기 (중복 제거)
      const allResults: AddressResult[] = [];
      const seenAddresses = new Set<string>();
      
      // 주소 검색 결과 먼저 추가 (우선순위 높음)
      addressData.documents.forEach(item => {
        const key = item.address_name || item.road_address_name;
        if (!seenAddresses.has(key)) {
          allResults.push({
            ...item,
            search_type: 'address'
          });
          seenAddresses.add(key);
        }
      });
      
      // 키워드 검색 결과 추가 (중복 제거)
      keywordData.documents.forEach(item => {
        const key = item.address_name || item.road_address_name;
        if (!seenAddresses.has(key)) {
          allResults.push({
            ...item,
            search_type: 'keyword'
          });
          seenAddresses.add(key);
        }
      });
      
      setSearchResults(allResults.slice(0, 15)); // 최대 15개만 표시
      
    } catch (error) {
      devLog.error('📍 주소 검색 오류:', error);
      Alert.alert('검색 오류', '주소 검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (text: string) => {
    setSearchQuery(text);
    
    // 2글자 이상 입력 시 자동 검색
    if (text.length >= 2) {
      searchAddress(text);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddressSelect = (address: AddressResult) => {
    const selectedAddress = address.road_address_name || address.address_name;
    const zonecode = ''; // 카카오 API에서는 우편번호를 제공하지 않음
    
    devLog.log('📍 주소 선택됨:', selectedAddress);
    
    // 모달 닫기
    setModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    
    if (onAddressSelect) {
      onAddressSelect(selectedAddress, zonecode);
    }
  };

  const openModal = () => {
    setModalVisible(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderAddressItem = ({ item }: { item: AddressResult }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      onPress={() => handleAddressSelect(item)}
    >
      <View style={styles.addressInfo}>
        <View style={styles.addressHeader}>
          {/* 장소명이 있는 경우 우선 표시 */}
          {item.place_name && (
            <Text style={styles.placeName}>{item.place_name}</Text>
          )}
          
          {/* 검색 타입 표시 */}
          {item.search_type && (
            <Text style={styles.searchTypeText}>
              {item.search_type === 'address' ? '주소' : '장소'}
            </Text>
          )}
        </View>
        
        {/* 도로명 주소 또는 지번 주소 */}
        <Text style={styles.mainAddress}>
          {item.road_address_name || item.address_name}
        </Text>
        
        {/* 도로명과 지번이 모두 있는 경우 지번 표시 */}
        {item.road_address_name && item.address_name !== item.road_address_name && (
          <Text style={styles.subAddress}>지번: {item.address_name}</Text>
        )}
        
        {/* 카테고리와 전화번호를 한 줄에 배치 */}
        <View style={styles.detailRow}>
          {/* 카테고리 정보 */}
          {item.category_name && (
            <Text style={styles.categoryText}>
              {item.category_name.split(' > ').pop()} {/* 마지막 카테고리만 표시 */}
            </Text>
          )}
          
          {/* 전화번호 */}
          {item.phone && (
            <Text style={styles.phoneText}>{item.phone}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <>
      {/* 주소 입력 필드 */}
      <TouchableOpacity style={styles.addressInputContainer} onPress={openModal}>
        <View style={styles.addressInput}>
          <Text style={[styles.addressText, !value && styles.placeholderText]}>
            {value || placeholder}
          </Text>
          <Ionicons name="search" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      {/* 주소 검색 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* 모달 헤더 */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>주소 검색</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 검색 입력창 */}
          <View style={styles.searchContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="주소를 입력하세요"
                value={searchQuery}
                onChangeText={handleInputChange}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 로딩 인디케이터 */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4495E8" />
              <Text style={styles.loadingText}>검색 중...</Text>
            </View>
          )}

          {/* 검색 결과 */}
          <View style={styles.resultsContainer}>
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderAddressItem}
                keyExtractor={(item, index) => `${item.address_name}-${index}`}
                style={styles.resultsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsContent}
              />
            ) : (
              !isLoading && searchQuery.length >= 2 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search" size={48} color="#E5E7EB" />
                  <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
                  <Text style={styles.emptySubText}>다른 키워드로 검색해보세요</Text>
                </View>
              )
            )}
            
            {searchQuery.length < 2 && (
              <View style={styles.instructionContainer}>
                <Ionicons name="location-outline" size={48} color="#E5E7EB" />
                <Text style={styles.instructionText}>주소를 입력해주세요</Text>
                <Text style={styles.instructionSubText}>2글자 이상 입력하면 자동으로 검색됩니다</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // 주소 입력 필드
  addressInputContainer: {
    marginBottom: 8,
  },
  addressInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    minHeight: 48,
  },
  addressText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },

  // 모달 컨테이너
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },

  // 검색 컨테이너
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },

  // 로딩
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },

  // 검색 결과
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  mainAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  subAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 2,
  },
  phoneText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 2,
  },
  searchTypeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
    textAlign: 'center',
  },

  // 초기 상태
  instructionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 16,
  },
  instructionSubText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
    textAlign: 'center',
  },
});