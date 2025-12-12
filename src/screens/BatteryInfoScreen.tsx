import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
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

    try {
      // Firebase Storage URL 패턴 확인
      if (!url.includes('firebasestorage.googleapis.com')) {
        return url; // Firebase Storage URL이 아니면 그대로 반환
      }

      const urlObj = new URL(url);

      // 버킷 이름 추출 (URL path에서 /v0/b/{bucket}/o/ 패턴)
      const bucketMatch = urlObj.pathname.match(/\/v0\/b\/([^\/]+)\/o\//);
      if (!bucketMatch || !bucketMatch[1]) return url;
      const bucket = bucketMatch[1];

      // 경로에서 /o/ 이후의 인코딩된 파일 경로 추출
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
      if (!pathMatch || !pathMatch[1]) return url;

      // 이미 인코딩된 경로를 한번 디코딩
      let filePath = decodeURIComponent(pathMatch[1]);

      // 다시 인코딩 (정확한 인코딩 보장)
      const encodedPath = encodeURIComponent(filePath);

      // 새 URL 구성
      const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;

      console.log('🔄 URL 정규화:', { original: url, normalized: newUrl });
      return newUrl;
    } catch (error) {
      console.error('❌ URL 정규화 실패:', error);
      return url; // 파싱 실패 시 원본 반환
    }
  };

  // ⭐ 동적 이미지 URL 생성 함수
  const generateDynamicImageUrl = (vehicle: CompletedVehicle): string | null => {
    if (!vehicle.brandId || !vehicle.modelId) {
      console.warn('⚠️ [BatteryInfoScreen] brandId 또는 modelId 누락:', vehicle);
      return null;
    }

    // @charzing/vehicle-utils 패키지 사용
    const { generateVehicleImageUrl } = require('@charzing/vehicle-utils');
    const url = generateVehicleImageUrl({
      brandId: vehicle.brandId,
      modelId: vehicle.modelId,
      year: vehicle.year,
      trim: vehicle.trim
    });

    console.log(`🖼️ [BatteryInfoScreen] 동적 이미지 URL 생성:`, {
      brandId: vehicle.brandId,
      modelId: vehicle.modelId,
      year: vehicle.year,
      trim: vehicle.trim,
      generatedUrl: url
    });

    return url;
  };

  // 차량 선택 핸들러 - getUserVehiclesEnriched와 동일한 로직 사용
  const handleVehicleSelect = async (vehicle: CompletedVehicle) => {
    setBatteryInfo({
      vehicle,
      modelData: null,
      selectedVariant: null,
      loading: true,
    });

    setShowVehicleModal(false);

    try {
      const brandId = vehicle.brandId;
      const modelId = brandId === "MINI" ? vehicle.modelId : vehicle.modelId.toLowerCase();

      console.log(`🔍 [BatteryInfo] 데이터 조회:`, {
        brandId,
        modelId,
        trimId: vehicle.trimId,
        year: vehicle.year
      });

      // vehicles/{brandId}/models/{modelId} 문서에서 모델 데이터 가져오기
      const modelData = await firebaseService.getModelData(brandId, modelId);

      if (!modelData) {
        throw new Error("해당 차량의 데이터를 찾을 수 없습니다.");
      }

      // 트림 찾기
      const trim = modelData.trims?.find((t: any) => t.trimId === vehicle.trimId);

      if (!trim) {
        throw new Error(`트림을 찾을 수 없습니다: ${vehicle.trimId}`);
      }

      // ⭐ getUserVehiclesEnriched와 동일한 로직
      const defaultBattery = modelData.defaultBattery || {};

      // YearTemplate 매칭
      const templateForYear = modelData.yearTemplates?.find((template: any) =>
        template.trimId === vehicle.trimId &&
        template.years &&
        template.years.includes(vehicle.year)
      );

      // Model variant 매칭 (연도별)
      const variantForYear = trim.variants?.find(
        (v: any) => Array.isArray(v.years) && v.years.includes(vehicle.year)
      );
      const firstVariant = trim.variants?.[0] || {};

      let batteryManufacturer: string;
      let batteryType: string;
      let batteryCapacity: number;
      let range: number;
      let imageUrl: string;

      if (templateForYear) {
        // YearTemplate 존재 - YearTemplate 데이터 우선 사용
        const templateVar: any = templateForYear.variants?.[0] || {};

        // ✅ 복수 배터리 제조사 처리
        if (templateVar.batteryOptions && Array.isArray(templateVar.batteryOptions)) {
          batteryManufacturer = templateVar.batteryOptions
            .map((opt: any) => opt.supplier)
            .filter(Boolean)
            .join(', ') || '미제공';
        } else {
          batteryManufacturer = templateVar.supplier || (defaultBattery as any).supplier || (defaultBattery as any).manufacturer || '미제공';
        }

        batteryType = templateVar.cellType || defaultBattery.cellType || '미제공';
        batteryCapacity = templateVar.batteryCapacity || (defaultBattery as any).capacity || 0;
        range = templateVar.range || (defaultBattery as any).range || 0;

        // ✅ 이미지: template.images.main 최우선
        imageUrl = (templateForYear as any).images?.main ||
                  templateVar.imageUrl ||
                  (trim as any).imageUrl ||
                  modelData.imageUrl ||
                  '';

        console.log(`📋 [BatteryInfo] YearTemplate 데이터 사용:`, {
          source: 'yearTemplate',
          supplier: batteryManufacturer,
          hasBatteryOptions: !!templateVar.batteryOptions,
          range: range,
          imageUrl: imageUrl
        });
      } else {
        // YearTemplate 없음 - Model variant 데이터 사용 (연도 매칭)
        const selectedVar: any = variantForYear || firstVariant;

        // ✅ 복수 배터리 제조사 처리
        if (selectedVar.batteryOptions && Array.isArray(selectedVar.batteryOptions)) {
          batteryManufacturer = selectedVar.batteryOptions
            .map((opt: any) => opt.supplier)
            .filter(Boolean)
            .join(', ') || '미제공';
        } else {
          batteryManufacturer = selectedVar.supplier || (defaultBattery as any).supplier || (defaultBattery as any).manufacturer || '미제공';
        }

        batteryType = selectedVar.cellType || defaultBattery.cellType || '미제공';
        batteryCapacity = selectedVar.batteryCapacity || (defaultBattery as any).capacity || 0;
        range = selectedVar.range || (defaultBattery as any).range || 0;

        imageUrl = (variantForYear as any)?.imageUrl ||
                  (trim as any).imageUrl ||
                  modelData.imageUrl ||
                  '';

        console.log(`📋 [BatteryInfo] Model 데이터 사용 (${vehicle.year}년):`, {
          source: variantForYear ? 'modelVariant' : 'modelVariant_fallback',
          variantMatched: !!variantForYear,
          supplier: batteryManufacturer,
          hasBatteryOptions: !!selectedVar.batteryOptions,
          range: range,
          imageUrl: imageUrl
        });
      }

      // selectedVariant 구성 (UI 표시용)
      const selectedVariant: Record<string, unknown> = {
        trimId: vehicle.trimId,
        trimName: (trim as any).name || vehicle.trim,
        batteryCapacity,
        range,
        supplier: batteryManufacturer,
        cellType: batteryType,
        years: [vehicle.year.toString()],
        driveType: (trim as any).driveType || 'RWD',
        powerMax: (templateForYear as any)?.variants?.[0]?.specifications?.power || (variantForYear as any)?.specifications?.power || '정보 없음',
        topSpeed: 0,
        acceleration: 0,
        specifications: (templateForYear as any)?.variants?.[0]?.specifications || (variantForYear as any)?.specifications || {},
        _imageUrl: imageUrl, // ⭐ 이미지 URL 저장
        _source: templateForYear ? 'yearTemplate' : (variantForYear ? 'modelVariant' : 'modelVariant_fallback')
      };

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
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <Animatable.View
            animation="fadeInUp"
            duration={500}
            delay={200}
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
          </Animatable.View>
        )}

        {/* 배터리 정보 섹션 - 실제 Firebase 데이터 사용 */}
        {batteryInfo &&
          !batteryInfo.loading &&
          batteryInfo.modelData &&
          batteryInfo.selectedVariant && (
            <Animatable.View
              animation="fadeInUp"
              duration={500}
              delay={400}
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

              {/* 차량 이미지 카드 - ⭐ selectedVariant._imageUrl 사용 */}
              {(() => {
                const imageUrl = safeGetString(batteryInfo.selectedVariant, "_imageUrl");

                return imageUrl && imageUrl !== '정보 없음' ? (
                  <View style={styles.vehicleImageCard}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.vehicleImage}
                      resizeMode="contain"
                      onLoad={() => {
                        console.log("✅ [BatteryInfoScreen] 이미지 로드 성공:", imageUrl);
                      }}
                      onError={(error) => {
                        console.error("❌ [BatteryInfoScreen] 이미지 로드 실패:", {
                          url: imageUrl,
                          error: error.nativeEvent
                        });
                      }}
                    />
                  </View>
                ) : null;
              })()}

              {/* 배터리 메인 정보 - 배터리 제조사와 완충 시 주행거리 */}
              <View style={styles.batteryMainCard}>
                <View style={styles.batteryIconContainer}>
                  <Ionicons name="battery-full" size={32} color="#06B6D4" />
                </View>
                <View style={styles.batteryMainInfo}>
                  <Text style={styles.batteryLabel}>배터리 제조사</Text>
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
                  {/* 셀 타입 - 주석 처리 */}
                  {/* <Text style={styles.batteryType}>
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
                  </Text> */}
                </View>
                <View style={styles.batteryRangeInfo}>
                  <Text style={styles.batteryLabel}>완충 시 주행거리</Text>
                  <Text style={styles.batteryRangeValue}>
                    {safeGetString(batteryInfo.selectedVariant, "range")}km
                  </Text>
                </View>
              </View>

              {/* 차량 기본 정보 - 주석 처리 (완충 시 주행거리를 위로 이동) */}
              {/* <View style={styles.performanceCard}>
                <Text style={styles.detailsTitle}>차량 기본 정보</Text>
                <View style={styles.performanceGrid}>
                  <View style={styles.performanceItem}>
                    <Ionicons name="map" size={20} color="#06B6D4" />
                    <Text style={styles.performanceLabel}>완충 시 주행거리</Text>
                    <Text style={styles.performanceValue}>
                      {safeGetString(batteryInfo.selectedVariant, "range")}km
                    </Text>
                  </View> */}

                  {/* 전비 - 주석 처리 */}
                  {/* <View style={styles.performanceItem}>
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
                  </View> */}

                  {/* 배터리 용량 - 주석 처리 */}
                  {/* <View style={styles.performanceItem}>
                    <Ionicons name="battery-full" size={20} color="#06B6D4" />
                    <Text style={styles.performanceLabel}>배터리 용량</Text>
                    <Text style={styles.performanceValue}>
                      {safeGetString(
                        batteryInfo.selectedVariant,
                        "batteryCapacity"
                      )}
                      kWh
                    </Text>
                  </View> */}

                  {/* 충전 커넥터 규격 - 주석 처리 */}
                  {/* <View style={styles.performanceItem}>
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
                  </View> */}

                  {/* 배터리 보증 - 주석 처리 */}
                  {/* <View style={styles.performanceItem}>
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
              </View> */}

              {/* 성능 정보 - 모두 주석 처리 */}
              {/* <View style={[styles.performanceCard, { marginTop: 16 }]}>
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
              </View> */}
            </Animatable.View>
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
          <Animatable.View
            animation="fadeIn"
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
          </Animatable.View>
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
    marginTop: 16,
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
    color: "#06B6D4",
  }),
  batteryStatusBadge: {
    backgroundColor: "#06B6D4",
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
    marginTop: 8,
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
  batteryLabel: convertToLineSeedFont({
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  }),
  batteryManufacturer: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: "bold",
    color: "#06B6D4",
  }),
  batteryType: convertToLineSeedFont({
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  }),
  batteryRangeInfo: {
    alignItems: "flex-end",
  },
  batteryRangeValue: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: "bold",
    color: "#06B6D4",
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
    color: "#06B6D4",
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
    color: "#06B6D4",
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
