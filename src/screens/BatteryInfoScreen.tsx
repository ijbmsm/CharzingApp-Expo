import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useFocusEffect } from "@react-navigation/native";
import Header from "../components/Header";
import VehicleAccordionSelector from "../components/VehicleAccordionSelector";
import firebaseService from "../services/firebaseService";
import { convertToLineSeedFont } from "../styles/fonts";
import { CompletedVehicle } from "../components/VehicleAccordionSelector";
import { SkeletonCard, SkeletonText, SkeletonImage } from '../components/skeleton';

import { handleError, handleFirebaseError, handleNetworkError, handleAuthError, showUserError } from '../services/errorHandler';
// Firebase에서 받아오는 실제 데이터 구조 - 유연한 타입으로 정의
interface BatteryInfoData {
  vehicle: CompletedVehicle;
  modelData: {
    name: string;
    englishName: string;
    imageUrl: string;
    defaultBattery: Record<string, unknown>;
    trims: Record<string, unknown>[];
    createdAt?: unknown;
    updatedAt?: unknown;
  } | null;
  selectedVariant: Record<string, unknown> | null;
  loading: boolean;
  error?: string;
}

// 타입 안전 접근을 위한 헬퍼 함수들
const safeGetString = (
  obj: Record<string, unknown>,
  key: string,
  defaultValue = "정보 없음"
): string => {
  const value = obj[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return defaultValue;
};

const safeGetNumber = (
  obj: Record<string, unknown>,
  key: string,
  defaultValue?: number
): number | undefined => {
  const value = obj[key];
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

const safeGetArray = (obj: Record<string, unknown>, key: string): unknown[] => {
  const value = obj[key];
  return Array.isArray(value) ? value : [];
};

export default function BatteryInfoScreen() {
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfoData | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 연도 매칭 헬퍼 함수 - years 배열의 두 가지 형식 모두 지원
  // 1. ["2022", "2023", "2024"] - 정상
  // 2. ["2018 2019 2020 2021"] - 하나의 문자열에 여러 연도 (잘못된 데이터)
  const isYearMatch = (years: unknown[], targetYear: number | string): boolean => {
    if (!Array.isArray(years)) return false;
    const yearStr = targetYear.toString();

    return years.some((y: any) => {
      if (typeof y === 'string') {
        // 정확히 일치하거나, 공백으로 구분된 문자열 안에 포함된 경우
        return y === yearStr || y.split(' ').includes(yearStr);
      } else if (typeof y === 'number') {
        return y.toString() === yearStr;
      }
      return false;
    });
  };

  // 이미지 URL 정규화 (토큰 제거하고 alt=media 사용)
  const normalizeImageUrl = (url: string | undefined): string => {
    if (!url) return '';

    // 이미 올바른 형식이면 그대로 반환
    if (url.includes('alt=media')) return url;

    // Firebase Storage URL에서 토큰 제거하고 alt=media 추가
    try {
      const urlObj = new URL(url);
      // 토큰 파라미터 제거
      urlObj.searchParams.delete('token');
      // alt=media 추가 (공개 읽기용)
      urlObj.searchParams.set('alt', 'media');
      return urlObj.toString();
    } catch {
      return url; // URL 파싱 실패 시 원본 반환
    }
  };

  // 차량 선택 핸들러 - 실제 Firebase 구조에 맞게 데이터 조회
  const handleVehicleSelect = async (vehicle: CompletedVehicle) => {
    // console.log("🔋 배터리 정보 조회할 차량 선택:", vehicle);

    setBatteryInfo({
      vehicle,
      modelData: null,
      selectedVariant: null,
      loading: true,
    });

    setShowVehicleModal(false);

    try {
      // VehicleAccordionSelector에서 넘어오는 데이터는 이미 올바른 영어 ID를 포함
      // vehicle.brandId와 vehicle.modelId 사용 (한글명 말고)
      // 브랜드별로 다른 modelId 대소문자 규칙 적용
      const brandId = vehicle.brandId; // "PORSCHE" 형태 그대로 유지
      // MINI는 대문자 모델 ID 사용, 나머지는 소문자
      const modelId =
        brandId === "MINI" ? vehicle.modelId : vehicle.modelId.toLowerCase();

      // console.log(
      //   `🔍 실제 Firebase 경로: vehicles/${brandId}/models/${modelId}`
      // );

      // vehicles/{brandId}/models/{modelId} 문서에서 모델 데이터 가져오기
      const modelData = await firebaseService.getModelData(brandId, modelId);

      if (!modelData) {
        throw new Error("해당 차량의 데이터를 찾을 수 없습니다.");
      }

      // 브랜드별로 다른 Firebase 구조 지원 - 타입 안전하게 처리
      let selectedVariant: Record<string, unknown> | null = null;

      // console.log(
      //   `🔍 트림 찾기: trimId=${vehicle.trimId}, trimName=${vehicle.trim}`
      // );
      // console.log(
      //   `🔍 실제 Firebase 트림 데이터 구조:`,
      //   JSON.stringify(modelData.trims, null, 2)
      // );

      // 방법 1: Hyundai/KIA 구조 - trims 자체에 trimId가 있고 variants는 연식별
      for (const trim of modelData.trims) {
        // Type guard for Hyundai structure - 더 정확한 검증
        if (
          typeof trim === "object" &&
          trim !== null &&
          "trimId" in trim &&
          "name" in trim &&
          "driveType" in trim &&
          "yearRange" in trim &&
          "variants" in trim
        ) {
          if (safeGetString(trim, "trimId") === vehicle.trimId) {
            // variants에서 연식에 맞는 variant 찾기
            const variants = safeGetArray(trim, "variants");
            for (const variant of variants) {
              if (
                typeof variant === "object" &&
                variant !== null &&
                variant.constructor === Object
              ) {
                const variantRecord = variant as Record<string, unknown>;
                const years = safeGetArray(variantRecord, "years");
                if (isYearMatch(years, vehicle.year)) {
                  // Hyundai 구조에서는 variant에 trimId/trimName이 없으므로 추가
                  selectedVariant = {
                    ...variantRecord,
                    trimId: safeGetString(
                      trim as Record<string, unknown>,
                      "trimId"
                    ),
                    trimName: safeGetString(
                      trim as Record<string, unknown>,
                      "name"
                    ),
                    driveType: safeGetString(
                      trim as Record<string, unknown>,
                      "driveType",
                      "RWD"
                    ),
                  };
                  break;
                }
              }
            }
            if (selectedVariant) break;
          }
        }
      }

      // 방법 2: Audi 구조 - trims[].variants[]에 trimId가 있음
      if (!selectedVariant) {
        for (const trimGroup of modelData.trims) {
          // Type guard for Audi structure
          if (
            typeof trimGroup === "object" &&
            trimGroup !== null &&
            "variants" in trimGroup &&
            !("trimId" in trimGroup)
          ) {
            const variants = safeGetArray(trimGroup, "variants");
            for (const variant of variants) {
              if (
                typeof variant === "object" &&
                variant !== null &&
                variant.constructor === Object
              ) {
                const variantRecord = variant as Record<string, unknown>;
                if (safeGetString(variantRecord, "trimId") === vehicle.trimId) {
                  const years = safeGetArray(variantRecord, "years");
                  if (isYearMatch(years, vehicle.year)) {
                    selectedVariant = variantRecord;
                    break;
                  }
                }
              }
            }
            if (selectedVariant) break;
          }
        }
      }

      // console.log(`🔍 매칭된 selectedVariant:`, selectedVariant);

      if (!selectedVariant) {
        // 사용 가능한 variants 로그 (디버깅용) - 타입 안전하게
        interface VariantInfo {
          source: "trim" | "variant";
          trimId: string;
          trimName: string;
          years: string[];
        }

        const allVariants: VariantInfo[] = [];

        // Hyundai 스타일 트림들
        modelData.trims.forEach((trim) => {
          if (
            typeof trim === "object" &&
            trim !== null &&
            "trimId" in trim &&
            "name" in trim &&
            "driveType" in trim &&
            "yearRange" in trim &&
            "variants" in trim
          ) {
            const variants = safeGetArray(trim, "variants");
            variants.forEach((variant) => {
              if (
                typeof variant === "object" &&
                variant !== null &&
                variant.constructor === Object
              ) {
                const variantRecord = variant as Record<string, unknown>;
                const years = safeGetArray(variantRecord, "years") as string[];
                allVariants.push({
                  source: "trim",
                  trimId: safeGetString(
                    trim as Record<string, unknown>,
                    "trimId"
                  ),
                  trimName: safeGetString(
                    trim as Record<string, unknown>,
                    "name"
                  ),
                  years,
                });
              }
            });
          }
        });

        // Audi 스타일 variants
        modelData.trims.forEach((trimGroup) => {
          if (
            typeof trimGroup === "object" &&
            trimGroup !== null &&
            "variants" in trimGroup &&
            !("trimId" in trimGroup)
          ) {
            const variants = safeGetArray(trimGroup, "variants");
            variants.forEach((variant) => {
              if (
                typeof variant === "object" &&
                variant !== null &&
                variant.constructor === Object
              ) {
                const variantRecord = variant as Record<string, unknown>;
                const years = safeGetArray(variantRecord, "years") as string[];
                allVariants.push({
                  source: "variant",
                  trimId: safeGetString(variantRecord, "trimId"),
                  trimName: safeGetString(variantRecord, "trimName"),
                  years,
                });
              }
            });
          }
        });

        // console.log(`🔍 사용 가능한 variants:`, allVariants);
        throw new Error(
          `해당 트림과 연식의 데이터를 찾을 수 없습니다. trimId: ${vehicle.trimId}, year: ${vehicle.year}`
        );
      }

      setBatteryInfo((prev) =>
        prev
          ? {
              ...prev,
              modelData,
              selectedVariant,
              loading: false,
            }
          : null
      );
    } catch (error) {
      handleError(error, 'unknown', 'medium', { actionName: 'generic_error' }); // "차량 상세 정보 조회 실패:"
      setBatteryInfo((prev) =>
        prev
          ? {
              ...prev,
              modelData: null,
              selectedVariant: null,
              loading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "차량 정보를 불러오는데 실패했습니다.",
            }
          : null
      );
    }
  };

  // 새로고침 핸들러
  const onRefresh = async () => {
    if (!batteryInfo?.vehicle) return;

    setRefreshing(true);
    await handleVehicleSelect(batteryInfo.vehicle);
    setRefreshing(false);
  };

  // 새 차량 선택 핸들러
  const handleSelectNewVehicle = () => {
    // console.log('🔄 차량 변경 버튼 클릭됨');
    setShowVehicleModal(true);
  };

  // 차량 선택 모달 닫기 핸들러
  const handleCloseModal = () => {
    // console.log('🔄 차량 선택 모달 닫힘');
    setShowVehicleModal(false);
  };

  // 화면이 포커스될 때 배터리 정보 초기화 (다른 화면에서 차량이 변경되었을 수 있음)
  useFocusEffect(
    React.useCallback(() => {
      // console.log('🔋 BatteryInfoScreen 포커스됨 - 배터리 정보 초기화');
      setBatteryInfo(null);
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Header title="배터리 정보" showLogo={false} />
        {batteryInfo && (
          <TouchableWithoutFeedback
            onPress={handleSelectNewVehicle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.headerChangeButton}>
              <Ionicons name="swap-horizontal" size={20} color="#06B6D4" />
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 차량 선택 전 안내 */}
        {!batteryInfo && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500, delay: 200 }}
            style={styles.noVehicleContainer}
          >
            <View style={styles.noVehicleIconContainer}>
              <Ionicons
                name="battery-charging-outline"
                size={48}
                color="#9CA3AF"
              />
            </View>
            <Text style={styles.noVehicleTitle}>차량을 선택해주세요</Text>
            <Text style={styles.noVehicleSubtitle}>
              차량의 배터리 정보와 사양을 확인할 수 있습니다
            </Text>
            <TouchableOpacity
              style={styles.selectVehicleButton}
              onPress={handleSelectNewVehicle}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.selectVehicleButtonText}>차량 선택하기</Text>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* 배터리 정보 섹션 - 실제 Firebase 데이터 사용 */}
        {batteryInfo &&
          !batteryInfo.loading &&
          batteryInfo.modelData &&
          batteryInfo.selectedVariant && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500, delay: 400 }}
              style={styles.batteryInfoSection}
            >
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.vehicleImageModel}>
                    {batteryInfo.modelData.name}
                  </Text>
                  <Text style={styles.vehicleImageTrim}>
                    {batteryInfo.vehicle.trim} • {batteryInfo.vehicle.year}
                  </Text>
                </View>
              </View>

              {/* 차량 이미지 카드 - variant imageUrl 우선 사용 */}
              {(() => {
                const variantImageUrl = safeGetString(batteryInfo.selectedVariant, "imageUrl", "");
                const rawImageUrl = variantImageUrl !== "정보 없음" && variantImageUrl
                  ? variantImageUrl
                  : batteryInfo.modelData?.imageUrl;

                const imageUrl = normalizeImageUrl(rawImageUrl);

                return imageUrl ? (
                  <View style={styles.vehicleImageCard}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.vehicleImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : null;
              })()}

              {/* 배터리 메인 정보 - 실제 Firebase 데이터 */}
              <View style={styles.batteryMainCard}>
                <View style={styles.batteryIconContainer}>
                  <Ionicons name="battery-full" size={32} color="#06B6D4" />
                </View>
                <View style={styles.batteryMainInfo}>
                  <Text style={styles.batteryManufacturer}>
                    {safeGetString(batteryInfo.selectedVariant, "supplier") !==
                    "정보 없음"
                      ? safeGetString(batteryInfo.selectedVariant, "supplier")
                      : safeGetString(
                          batteryInfo.modelData.defaultBattery,
                          "manufacturer"
                        ) !== "정보 없음"
                      ? safeGetString(
                          batteryInfo.modelData.defaultBattery,
                          "manufacturer"
                        )
                      : safeGetString(
                          batteryInfo.modelData.defaultBattery,
                          "supplier"
                        )}
                  </Text>
                  <Text style={styles.batteryType}>
                    {safeGetString(
                      batteryInfo.modelData.defaultBattery,
                      "cellType"
                    ) !== "정보 없음"
                      ? safeGetString(
                          batteryInfo.modelData.defaultBattery,
                          "cellType"
                        )
                      : safeGetString(
                          batteryInfo.modelData.defaultBattery,
                          "type"
                        )}{" "}
                    배터리
                  </Text>
                </View>
              </View>

              {/* 차량 기본 정보 */}
              <View style={styles.performanceCard}>
                <Text style={styles.detailsTitle}>차량 기본 정보</Text>
                <View style={styles.performanceGrid}>
                  <View style={styles.performanceItem}>
                    <Ionicons name="map" size={20} color="#06B6D4" />
                    <Text style={styles.performanceLabel}>완충 시 주행거리</Text>
                    <Text style={styles.performanceValue}>
                      {safeGetString(batteryInfo.selectedVariant, "range")}km
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Ionicons name="leaf" size={20} color="#06B6D4" />
                    <Text style={styles.performanceLabel}>전비</Text>
                    <Text style={styles.performanceValue}>
                      {typeof batteryInfo.selectedVariant.specifications ===
                        "object" &&
                      batteryInfo.selectedVariant.specifications !== null
                        ? safeGetString(
                            batteryInfo.selectedVariant
                              .specifications as Record<string, unknown>,
                            "efficiency"
                          )
                        : "정보 없음"}
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Ionicons name="battery-full" size={20} color="#06B6D4" />
                    <Text style={styles.performanceLabel}>배터리 용량</Text>
                    <Text style={styles.performanceValue}>
                      {safeGetString(
                        batteryInfo.selectedVariant,
                        "batteryCapacity"
                      )}
                      kWh
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Ionicons name="battery-charging" size={20} color="#06B6D4" />
                    <Text style={styles.performanceLabel}>충전 커넥터 규격</Text>
                    <Text style={styles.performanceValue}>
                      {typeof batteryInfo.selectedVariant.specifications ===
                        "object" &&
                      batteryInfo.selectedVariant.specifications !== null
                        ? safeGetString(
                            batteryInfo.selectedVariant
                              .specifications as Record<string, unknown>,
                            "chargingConnector"
                          )
                        : safeGetString(batteryInfo.selectedVariant, "chargingConnector", "정보 없음")}
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Ionicons name="shield-checkmark" size={20} color="#06B6D4" />
                    <Text style={styles.performanceLabel}>배터리 보증</Text>
                    <Text style={styles.performanceValue}>
                      {safeGetString(
                        batteryInfo.modelData.defaultBattery,
                        "warranty"
                      )}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 성능 정보 - 브랜드별 다른 구조 지원 */}
              <View style={[styles.performanceCard, { marginTop: 16 }]}>
                <Text style={styles.detailsTitle}>성능 사양</Text>
                <View style={styles.performanceGrid}>
                  <View style={styles.performanceItem}>
                    <Ionicons name="rocket" size={20} color="#06B6D4" />
                    <Text style={styles.performanceLabel}>가속력</Text>
                    <Text style={styles.performanceValue}>
                      {typeof batteryInfo.selectedVariant.specifications ===
                        "object" &&
                      batteryInfo.selectedVariant.specifications !== null
                        ? safeGetString(
                            batteryInfo.selectedVariant
                              .specifications as Record<string, unknown>,
                            "acceleration"
                          )
                        : typeof batteryInfo.selectedVariant.acceleration ===
                          "number"
                        ? `${batteryInfo.selectedVariant.acceleration}초`
                        : "정보 없음"}
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Ionicons name="speedometer" size={20} color="#06B6D4" />
                    <Text style={styles.performanceLabel}>최고속도</Text>
                    <Text style={styles.performanceValue}>
                      {(() => {
                        // specifications에서 먼저 확인
                        if (
                          typeof batteryInfo.selectedVariant.specifications ===
                            "object" &&
                          batteryInfo.selectedVariant.specifications !== null
                        ) {
                          const topSpeed = safeGetNumber(
                            batteryInfo.selectedVariant
                              .specifications as Record<string, unknown>,
                            "topSpeed"
                          );
                          if (topSpeed) return `${topSpeed}km/h`;
                        }
                        // variant 레벨에서 확인
                        const topSpeed = safeGetNumber(
                          batteryInfo.selectedVariant,
                          "topSpeed"
                        );
                        return topSpeed ? `${topSpeed}km/h` : "정보 없음";
                      })()}
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Ionicons name="flash" size={20} color="#06B6D4" />
                    <Text style={styles.performanceLabel}>최대출력</Text>
                    <Text style={styles.performanceValue}>
                      {safeGetString(
                        batteryInfo.selectedVariant,
                        "powerMax"
                      ) !== "정보 없음"
                        ? safeGetString(batteryInfo.selectedVariant, "powerMax")
                        : typeof batteryInfo.selectedVariant.specifications ===
                            "object" &&
                          batteryInfo.selectedVariant.specifications !== null
                        ? safeGetString(
                            batteryInfo.selectedVariant
                              .specifications as Record<string, unknown>,
                            "power"
                          )
                        : "정보 없음"}
                    </Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Ionicons name="trending-up" size={20} color="#06B6D4" />
                    <Text style={styles.performanceLabel}>최대 토크</Text>
                    <Text style={styles.performanceValue}>
                      {typeof batteryInfo.selectedVariant.specifications ===
                        "object" &&
                      batteryInfo.selectedVariant.specifications !== null
                        ? safeGetString(
                            batteryInfo.selectedVariant
                              .specifications as Record<string, unknown>,
                            "torque"
                          )
                        : "정보 없음"}
                    </Text>
                  </View>
                </View>
              </View>
            </MotiView>
          )}

        {/* 로딩 상태 - 스켈레톤 */}
        {batteryInfo?.loading && (
          <View style={styles.skeletonContainer}>
            {/* 차량 이미지 스켈레톤 */}
            <SkeletonCard style={styles.vehicleCard}>
              <SkeletonImage width="100%" height={200} borderRadius={16} />
            </SkeletonCard>
            
            {/* 배터리 정보 스켈레톤 */}
            <SkeletonCard style={styles.batteryCard}>
              <SkeletonText width="60%" height={20} style={{ marginBottom: 12 }} />
              <SkeletonText lines={3} height={16} />
            </SkeletonCard>
            
            {/* 성능 지표 스켈레톤 */}
            <SkeletonCard style={styles.performanceCard}>
              <SkeletonText width="50%" height={18} style={{ marginBottom: 16 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <SkeletonText width="25%" height={40} />
                <SkeletonText width="25%" height={40} />
                <SkeletonText width="25%" height={40} />
              </View>
            </SkeletonCard>
          </View>
        )}

        {/* 에러 상태 */}
        {batteryInfo?.error && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.errorContainer}
          >
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>정보를 불러올 수 없습니다</Text>
            <Text style={styles.errorText}>{batteryInfo.error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() =>
                batteryInfo && handleVehicleSelect(batteryInfo.vehicle)
              }
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </MotiView>
        )}
      </ScrollView>

      {/* 차량 선택 모달 */}
      <VehicleAccordionSelector
        visible={showVehicleModal}
        onClose={handleCloseModal}
        onComplete={handleVehicleSelect}
        editMode={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerContainer: {
    position: "relative",
  },
  headerChangeButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0F2FE",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  batteryInfoSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: convertToLineSeedFont({
    fontSize: 20,
    fontWeight: "bold",
    color: "#202632",
  }),
  batteryStatusBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  batteryStatusText: convertToLineSeedFont({
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  }),
  noVehicleContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  noVehicleIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  noVehicleTitle: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  }),
  noVehicleSubtitle: convertToLineSeedFont({
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  }),
  selectVehicleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#06B6D4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  selectVehicleButtonText: convertToLineSeedFont({
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  }),
  batteryMainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  batteryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  batteryMainInfo: {
    flex: 1,
  },
  batteryManufacturer: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: "bold",
    color: "#202632",
    marginBottom: 2,
  }),
  batteryType: convertToLineSeedFont({
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  }),
  batteryCapacity: convertToLineSeedFont({
    fontSize: 24,
    fontWeight: "700",
    color: "#06B6D4",
  }),
  batteryDetailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailsTitle: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: "bold",
    color: "#202632",
    marginBottom: 16,
  }),
  specGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  specItem: {
    flex: 1,
    minWidth: "45%",
  },
  specLabel: convertToLineSeedFont({
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
    fontWeight: "500",
  }),
  specValue: convertToLineSeedFont({
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  }),
  performanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  performanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  performanceItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  performanceLabel: convertToLineSeedFont({
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  }),
  performanceValue: convertToLineSeedFont({
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  }),
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    marginHorizontal: 16,
  },
  loadingText: convertToLineSeedFont({
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
  }),
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
    marginHorizontal: 16,
  },
  errorTitle: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: "bold",
    color: "#EF4444",
    marginTop: 16,
    marginBottom: 8,
  }),
  errorText: convertToLineSeedFont({
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  }),
  retryButton: {
    backgroundColor: "#06B6D4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: convertToLineSeedFont({
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  }),

  // 차량 이미지 스타일
  selectedVehicleImage: {
    width: 60,
    height: 36,
    marginRight: 12,
    borderRadius: 8,
  },
  vehicleImageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  vehicleImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#F8FAFC",
  },
  vehicleImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  vehicleImageModel: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: "700",
    color: "#202632",
    marginBottom: 4,
  }),
  vehicleImageTrim: convertToLineSeedFont({
    fontSize: 14,
    color: "#6B7280",
  }),
  
  // 스켈레톤 관련 스타일
  skeletonContainer: {
    padding: 16,
  },
  vehicleCard: {
    marginBottom: 16,
  },
  batteryCard: {
    marginBottom: 16,
  },
});
