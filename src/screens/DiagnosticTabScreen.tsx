import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import analyticsService from '../services/analyticsService';
import VehicleAccordionSelector from '../components/VehicleAccordionSelector';
import { getAvailableBrands, getAvailableModels, getVehicleBatteryHistory } from '../constants/ev-battery-database';
import { handleError, handleFirebaseError, handleNetworkError, handleAuthError, showUserError } from '../services/errorHandler';
// Remove VehicleImageLoader import - we'll use direct image mapping like VehicleSearchModal

const { height: screenHeight } = Dimensions.get('window');

// Simplified vehicle image function - returns default logo for all vehicles
const getVehicleImage = (make: string, fullModel: string, trim: string, year: number): any => {
  try {
    // console.log('🔍 Using default logo for:', {
    //   make,
    //   fullModel,
    //   trim,
    //   year
    // });

    // Return default logo image for all vehicles
    return require('../assets/images/logo.png');
  } catch (error) {
    // console.log(`❌ 이미지 로드 실패: ${fullModel} ${trim} ${year}`, error);
    return null;
  }
};


export default function DiagnosticTabScreen() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);

  useEffect(() => {
    // Analytics - 화면 첫 로드시에만 실행
    // console.log('📊 DiagnosticTabScreen mounted');
    analyticsService.logScreenView('DiagnosticTabScreen', 'DiagnosticTabScreen').catch(console.error);
  }, []);

  // 차량 상세 정보 가져오기
  const getVehicleDetails = (vehicle: any) => {
    const brands = getAvailableBrands();
    const brand = brands.find(b => b.name === vehicle.make);
    
    if (!brand) return null;
    
    const models = getAvailableModels(brand.id);
    let bestMatch = null;
    let bestMatchScore = 0;
    
    // 모든 모델을 확인하여 가장 적합한 매칭 찾기
    for (const model of models) {
      const batteryHistory = getVehicleBatteryHistory(brand.id, model.id);
      
      // 해당 연도의 데이터가 있는지 확인
      const yearData = batteryHistory.find(item => 
        item.startYear <= vehicle.year && 
        (!item.endYear || item.endYear >= vehicle.year)
      );
      
      if (yearData) {
        // 기본 모델명 추출
        let baseModelName = model.name
          .replace(/\s+(Standard|Long Range|N|AWD|2WD|RWD|FWD|Performance|Dual Motor|Tri Motor|Plaid|Cyberbeast|eDrive40|M50|xDrive40|xDrive50|M60|eDrive50|M70|iX1|iX2|iX3).*$/i, '')
          .replace(/\s+\d+kWh.*$/i, '')
          .trim();
        
        // 매칭 점수 계산
        let matchScore = 0;
        if (baseModelName === vehicle.model) {
          matchScore = 100; // 완전 일치
        } else if (baseModelName.includes(vehicle.model) || vehicle.model.includes(baseModelName)) {
          matchScore = 80; // 부분 일치
        } else if (model.name.toLowerCase().includes(vehicle.model.toLowerCase())) {
          matchScore = 60; // 대소문자 무시 부분 일치
        }
        
        // 연도 정확도 추가 점수
        if (yearData.startYear === vehicle.year) {
          matchScore += 10;
        }
        
        if (matchScore > bestMatchScore) {
          bestMatchScore = matchScore;
          bestMatch = {
            modelData: model,
            batteryData: yearData,
            brandData: brand
          };
        }
      }
    }
    
    return bestMatch;
  };

  const handleVehicleSelect = (vehicle: any) => {
    // console.log('차량 선택됨:', vehicle);
    
    // VehicleAccordionSelector의 데이터 구조에 맞게 변환
    const convertedVehicle = {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year
    };
    
    setSelectedVehicle(convertedVehicle);
    
    // 차량 상세 정보 가져오기
    const details = getVehicleDetails(convertedVehicle);
    setVehicleDetails(details);
    
    setShowVehicleModal(false);
  };

  const handleAddVehicle = () => {
    // console.log('차량 추가 버튼 클릭');
    setShowVehicleModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {!selectedVehicle ? (
          /* 빈 화면 상태 */
          <View style={styles.emptyContainer}>
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800, delay: 500 }}
              style={styles.welcomeContainer}
            >
              <Text style={styles.welcomeTitle}>내 차량을{'\n'}선택해 주세요</Text>
              <TouchableOpacity
                style={styles.addVehicleButton}
                onPress={handleAddVehicle}
              >
                <Ionicons name="add" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </MotiView>
          </View>
        ) : (
          /* 차량 선택 후 상태 */
          <View style={styles.selectedVehicleContainer}>
            {/* 뒤로가기 버튼 */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedVehicle(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            
            {/* 차량 이미지 - 전체 너비로 상단에 고정 */}
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
              style={styles.vehicleImageHeader}
            >
              {(() => {
                // console.log('🚗 Vehicle Image Debug:', {
                //   make: selectedVehicle.make,
                //   model: selectedVehicle.model,
                //   year: selectedVehicle.year,
                //   trim: selectedVehicle.trim
                // });

                const vehicleImage = getVehicleImage(
                  selectedVehicle.make,
                  selectedVehicle.model,
                  selectedVehicle.trim || '',
                  selectedVehicle.year
                );

                // console.log('🖼️ Vehicle Image Result:', {
                //   hasImage: !!vehicleImage,
                //   imageType: typeof vehicleImage
                // });
                
                if (vehicleImage) {
                  return (
                    <>
                      <View style={styles.vehicleImageContainer}>
                        <Image 
                          source={vehicleImage} 
                          style={styles.vehicleImage}
                          onLoad={(event) => {
                            // console.log('✅ Image loaded successfully:', {
                            //   width: event.nativeEvent.source.width,
                            //   height: event.nativeEvent.source.height
                            // });
                          }}
                          onError={(error) => console.log('❌ Image load failed:', error)}
                          onLoadStart={() => console.log('🔄 Image loading started')}
                          onLoadEnd={() => console.log('🏁 Image loading ended')}
                        />
                      </View>
                      {/* 차량명과 연식을 사진 밑에 타이틀로 표시 */}
                      <View style={styles.vehicleTitleContainer}>
                        <Text style={styles.vehicleTitle}>
                          {selectedVehicle.make} {selectedVehicle.model}
                        </Text>
                        <Text style={styles.vehicleYear}>{selectedVehicle.year}년형</Text>
                      </View>
                    </>
                  );
                  } else {
                    return (
                      <>
                        <View style={styles.vehicleImageContainer}>
                          <View style={styles.vehicleIconContainer}>
                            <Ionicons name="car" size={60} color="#6B7280" />
                          </View>
                        </View>
                        <View style={styles.vehicleTitleContainer}>
                          <Text style={styles.vehicleTitle}>
                            {selectedVehicle.make} {selectedVehicle.model}
                          </Text>
                          <Text style={styles.vehicleYear}>{selectedVehicle.year}년형</Text>
                        </View>
                      </>
                    );
                  }
                })()}
            </MotiView>
            
            {/* 스크롤 가능한 콘텐츠 영역 */}
            <ScrollView 
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.vehicleContentContainer}
            >
              {/* 차량 상세 정보 */}
              {vehicleDetails && (
                <MotiView
                  from={{ opacity: 0, translateY: 15 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: 200 }}
                  style={styles.vehicleDetailContainer}
                >
                  {/* 배터리 정보 */}
                  {vehicleDetails.batteryData.battery && (
                    <MotiView
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: 'timing', duration: 250, delay: 300 }}
                      style={styles.infoSection}
                    >
                      <View style={styles.infoHeader}>
                        <Ionicons name="battery-charging" size={18} color="#202632" />
                        <Text style={styles.infoTitle}>배터리 정보</Text>
                      </View>
                      <View style={styles.infoGrid}>
                        {vehicleDetails.batteryData.battery.capacity && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>총 용량</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.battery.capacity}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.battery.usableCapacity && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>사용 가능</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.battery.usableCapacity}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.battery.cellType && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>셀 타입</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.battery.cellType}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.battery.manufacturers && vehicleDetails.batteryData.battery.manufacturers.length > 0 && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>제조사</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.battery.manufacturers.join(', ')}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.battery.warranty && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>보증</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.battery.warranty}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.battery.voltage && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>전압</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.battery.voltage}</Text>
                          </View>
                        )}
                      </View>
                    </MotiView>
                  )}

                  {/* 성능 정보 */}
                  {vehicleDetails.batteryData.specs && (
                    <MotiView
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: 'timing', duration: 250, delay: 400 }}
                      style={styles.infoSection}
                    >
                      <View style={styles.infoHeader}>
                        <Ionicons name="speedometer" size={18} color="#202632" />
                        <Text style={styles.infoTitle}>성능 정보</Text>
                      </View>
                      <View style={styles.infoGrid}>
                        {vehicleDetails.batteryData.specs.range && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>주행거리</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.specs.range}km</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.specs.efficiency && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>전비</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.specs.efficiency}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.specs.powerMax && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>최대출력</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.specs.powerMax}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.specs.torqueMax && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>최대토크</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.specs.torqueMax}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.specs.acceleration && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>0-100km/h</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.specs.acceleration}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.specs.topSpeed && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>최고속도</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.specs.topSpeed}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.specs.driveType && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>구동방식</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.specs.driveType}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.specs.chargingDC && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>급속충전</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.specs.chargingDC}</Text>
                          </View>
                        )}
                        {vehicleDetails.batteryData.specs.seats && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>좌석수</Text>
                            <Text style={styles.infoValue}>{vehicleDetails.batteryData.specs.seats}인승</Text>
                          </View>
                        )}
                      </View>
                    </MotiView>
                  )}
                </MotiView>
              )}
              
              <MotiView
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 300, delay: 300 }}
                style={styles.actionContainer}
              >
                <TouchableOpacity
                  style={styles.diagnosisButton}
                  onPress={() => {
                    // TODO: 진단 예약 화면으로 이동
                    // console.log('진단 예약 시작');
                  }}
                >
                  <Text style={styles.diagnosisButtonText}>진단 예약하기</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </MotiView>
            </ScrollView>
          </View>
        )}
      </View>

      {/* 차량 선택 모달 */}
      <VehicleAccordionSelector
        visible={showVehicleModal}
        onComplete={(vehicle) => {
          // console.log('VehicleAccordionSelector 완료:', vehicle);
          handleVehicleSelect(vehicle);
        }}
        onClose={() => setShowVehicleModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  welcomeContainer: {
    alignItems: 'center',
    gap: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: 'LINESeedSansKR-Bold',
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  addVehicleButton: {
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  vehicleSelectedContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 32,
  },
  vehicleHeader: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 24,
  },
  vehicleIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  vehicleSpecs: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  diagnosisButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minWidth: '60%',
    justifyContent: 'center',
  },
  diagnosisButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  vehicleDetailContainer: {
    width: '100%',
    marginTop: 24,
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 32,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202632',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoItem: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 12,
    width: '48%',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#202632',
    fontWeight: '600',
  },
  // 선택된 차량 전체 컨테이너
  selectedVehicleContainer: {
    flex: 1,
    width: '100%', // 명시적으로 전체 너비 설정
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // 차량 이미지 관련 스타일
  vehicleImageHeader: {
    width: '100%',
    alignSelf: 'stretch', // 부모의 전체 너비를 차지하도록
  },
  vehicleImageContainer: {
    width: '100%',
    height: screenHeight * 0.25,
    backgroundColor: '#F8F9FA',
    borderRadius: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleTitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  vehicleContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  vehicleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  vehicleYear: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.3,
  },
});