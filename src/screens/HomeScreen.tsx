import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
  Animated,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import VehicleAccordionSelector from "../components/VehicleAccordionSelector";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import firebaseService, {
  DiagnosisReservation,
  VehicleDiagnosisReport,
  UserVehicle,
  VehicleDetails,
} from "../services/firebaseService";
import { getAuth } from "firebase/auth";
import logger from "../services/logService";
import analyticsService from "../services/analyticsService";
import devLog from "../utils/devLog";
import {
  handleError,
  handleFirebaseError,
  showUserError,
} from "../services/errorHandler";
import { convertToLineSeedFont } from "../styles/fonts";
import { MotiView } from "moti";
import {
  SkeletonVehicleCard,
  SkeletonText,
  SkeletonCard,
  SkeletonImage,
} from "../components/skeleton";

// 차량 카드 컴포넌트
interface VehicleCardProps {
  vehicle: UserVehicle;
  onEdit?: () => void; // 선택사항으로 만들어서 재사용성 높임
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onEdit }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [vehicleDetails, setVehicleDetails] =
    React.useState<VehicleDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(false); // 접기/펼치기 상태

  // 배터리 용량에서 숫자만 추출
  const getBatteryCapacity = (capacity?: string): string => {
    if (!capacity) return "알 수 없음";
    const match = capacity.match(/(\d+(?:\.\d+)?)/);
    return match ? `${match[1]}kWh` : capacity;
  };

  // Firebase에서 차량 상세 정보 가져오기
  React.useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        // 이미지 상태 초기화
        setImageLoaded(false);
        setImageError(false);

        const details = await firebaseService.getVehicleDetails(
          vehicle.make,
          vehicle.model,
          vehicle.year,
          vehicle.trim
        );
        setVehicleDetails(details);
      } catch (error) {
        handleFirebaseError(error, {
          screenName: "HomeScreen",
          actionName: "load_vehicle_details",
        });
        setVehicleDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [vehicle.id, vehicle.make, vehicle.model, vehicle.year, vehicle.trim]);

  return (
    <MotiView
      from={loading ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: loading ? 0 : 300 }}
      style={styles.vehicleCard}
    >
      {/* 차량 이미지 */}
      <View style={styles.vehicleImageContainer}>
        {(vehicleDetails?.imageUrl || vehicle.imageUrl) && !imageError ? (
          <Image
            source={{ uri: vehicleDetails?.imageUrl || vehicle.imageUrl }}
            style={[styles.vehicleImage, { opacity: imageLoaded ? 1 : 0 }]}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : null}

        {/* 이미지 로딩 중이거나 없을 때 */}
        {loading ||
        (!imageLoaded &&
          !imageError &&
          (vehicleDetails?.imageUrl || vehicle.imageUrl)) ? (
          <SkeletonImage
            width="100%"
            height="100%"
            borderRadius={12}
            style={styles.vehicleImagePlaceholder}
          />
        ) : !(vehicleDetails?.imageUrl || vehicle.imageUrl) || imageError ? (
          <View style={styles.vehicleImagePlaceholder}>
            <Ionicons name="car-outline" size={40} color="#9CA3AF" />
          </View>
        ) : null}
      </View>

      {/* 차량 정보 */}
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleCardHeader}>
          <View style={styles.vehicleCardNameContainer}>
            <Text style={styles.vehicleCardName}>
              {vehicle.nickname ||
                `${vehicle.make} ${vehicleDetails?.modelName || vehicle.model}`}
            </Text>
            <Text style={styles.vehicleCardDetails}>
              {vehicle.year}년 {vehicle.trim ? `${vehicle.trim} ` : ""}
              {vehicleDetails?.modelName || vehicle.model}
            </Text>
          </View>
        </View>

        {/* 배터리 및 성능 정보 (영수증 스타일) - 접기/펼치기 가능 */}
        {isExpanded && (
          <MotiView
            from={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "timing", duration: 300 }}
            style={{ overflow: "hidden" }}
          >
            <View style={styles.vehicleCardReceiptSection}>
              {/* 1. 배터리 제조사 */}
              <View style={styles.vehicleCardReceiptRow}>
                <Text style={styles.vehicleCardDetails}>배터리 제조사</Text>
                <Text style={styles.vehicleCardDetails}>
                  {loading
                    ? "로딩중..."
                    : vehicleDetails?.battery.manufacturer || "알 수 없음"}
                </Text>
              </View>

              {/* 2. 셀 타입 */}
              <View style={styles.vehicleCardReceiptRow}>
                <Text style={styles.vehicleCardDetails}>셀 타입</Text>
                <Text style={styles.vehicleCardDetails}>
                  {loading
                    ? "로딩중..."
                    : vehicleDetails?.battery.cellType || "알 수 없음"}
                </Text>
              </View>

              {/* 3. 배터리 용량 */}
              <View style={styles.vehicleCardReceiptRow}>
                <Text style={styles.vehicleCardDetails}>배터리 용량</Text>
                <Text style={styles.vehicleCardDetails}>
                  {loading
                    ? "로딩중..."
                    : vehicleDetails?.battery.capacity
                    ? `${vehicleDetails.battery.capacity}kWh`
                    : "알 수 없음"}
                </Text>
              </View>

              {/* 4. 완충 시 주행거리 */}
              <View style={styles.vehicleCardReceiptRow}>
                <Text style={styles.vehicleCardDetails}>완충 시 주행거리</Text>
                <Text style={styles.vehicleCardDetails}>
                  {loading
                    ? "로딩중..."
                    : vehicleDetails?.performance.range
                    ? `${vehicleDetails.performance.range}km`
                    : "알 수 없음"}
                </Text>
              </View>

              {/* 5. 전비 */}
              <View style={styles.vehicleCardReceiptRow}>
                <Text style={styles.vehicleCardDetails}>전비</Text>
                <Text style={styles.vehicleCardDetails}>
                  {loading
                    ? "로딩중..."
                    : vehicleDetails?.performance.efficiency
                    ? `${vehicleDetails.performance.efficiency}km/kWh`
                    : "알 수 없음"}
                </Text>
              </View>

              {/* 6. 충전 성능 */}
              <View style={styles.vehicleCardReceiptRow}>
                <Text style={styles.vehicleCardDetails}>충전 성능</Text>
                <Text style={styles.vehicleCardDetails}>
                  {loading
                    ? "로딩중..."
                    : vehicleDetails?.performance.chargingSpeed || "알 수 없음"}
                </Text>
              </View>

              {/* 7. 충전 커넥터 규격 */}
              <View style={styles.vehicleCardReceiptRow}>
                <Text style={styles.vehicleCardDetails}>충전 커넥터 규격</Text>
                <Text style={styles.vehicleCardDetails}>
                  {loading
                    ? "로딩중..."
                    : vehicleDetails?.performance.chargingConnector || "알 수 없음"}
                </Text>
              </View>

              {/* 8. 가속력 */}
              <View style={styles.vehicleCardReceiptRow}>
                <Text style={styles.vehicleCardDetails}>가속력</Text>
                <Text style={styles.vehicleCardDetails}>
                  {loading
                    ? "로딩중..."
                    : vehicleDetails?.performance.acceleration || "알 수 없음"}
                </Text>
              </View>

              {/* 9. 최고속도 */}
              <View style={styles.vehicleCardReceiptRow}>
                <Text style={styles.vehicleCardDetails}>최고속도</Text>
                <Text style={styles.vehicleCardDetails}>
                  {loading
                    ? "로딩중..."
                    : vehicleDetails?.performance.topSpeed
                    ? `${vehicleDetails.performance.topSpeed}km/h`
                    : "알 수 없음"}
                </Text>
              </View>

              {/* 10. 최대출력 */}
              <View style={styles.vehicleCardReceiptRow}>
                <Text style={styles.vehicleCardDetails}>최대출력</Text>
                <Text style={styles.vehicleCardDetails}>
                  {loading
                    ? "로딩중..."
                    : vehicleDetails?.performance.power
                    ? `${vehicleDetails.performance.power}kW`
                    : "알 수 없음"}
                </Text>
              </View>

              {/* 11. 최대토크 */}
              <View style={styles.vehicleCardReceiptRow}>
                <Text style={styles.vehicleCardDetails}>최대토크</Text>
                <Text style={styles.vehicleCardDetails}>
                  {loading
                    ? "로딩중..."
                    : vehicleDetails?.performance.torque
                    ? `${vehicleDetails.performance.torque}Nm`
                    : "알 수 없음"}
                </Text>
              </View>
            </View>
          </MotiView>
        )}

        {/* 차량 정보 펼치기/접기 버튼 - 항상 맨 아래 */}
        <TouchableOpacity
          style={styles.vehicleCardExpandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.vehicleCardExpandText}>
            {isExpanded ? "차량 정보 접기" : "차량 정보 보기"}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#666"
          />
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CompletedVehicle {
  make: string;
  model: string;
  trim: string;
  year: number;
  batteryCapacity?: number | string;
  imageUrl?: string;
}

export default function HomeScreen() {
  console.log("🏠 HomeScreen 렌더링됨 - 현재 시간:", new Date().toISOString());
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, isAuthenticated, autoLoginEnabled } = useSelector(
    (state: RootState) => state.auth
  );

  // 메모리 누수 방지를 위한 마운트 상태 추적 (컴포넌트 레벨)
  const isMountedRef = useRef(true);

  const [latestReservation, setLatestReservation] =
    useState<DiagnosisReservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleReport, setVehicleReport] =
    useState<VehicleDiagnosisReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleModalEditMode, setVehicleModalEditMode] = useState(false);
  const [userVehicles, setUserVehicles] = useState<UserVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 캐러셀 관련 상태
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const serviceCarouselRef = useRef<FlatList>(null);

  // 서비스 데이터
  const serviceOptions = [
    {
      id: "standard",
      title: "스탠다드",
      price: "10만원",
      features: ["기본 배터리 진단", "상태 리포트 제공", "전문가 상담"],
      isPremium: false,
      color: "#10B981",
    },
    {
      id: "premium",
      title: "프리미엄",
      price: "20만원",
      features: [
        "정밀 배터리 진단",
        "상세 분석 리포트",
        "개선 권장사항",
        "1:1 전문가 상담",
      ],
      isPremium: true,
      color: "#4F46E5",
    },
  ];

  // 차량 상세 모달 관련 상태
  const [showVehicleDetail, setShowVehicleDetail] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<UserVehicle | null>(
    null
  );
  const [deletingVehicle, setDeletingVehicle] = useState(false);

  // 모달 애니메이션 상태
  const fadeAnim = useRef(new Animated.Value(0)).current; // 배경 오버레이 페이드
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current; // 모달 슬라이드

  // 컴포넌트 언마운트 시 정리 및 Analytics 화면 추적
  useEffect(() => {
    // 홈 화면 조회 추적
    analyticsService.logScreenView("HomeScreen", "HomeScreen").catch(() => {});

    // 자동로그인 상태 디버깅
    devLog.log("🏠 HomeScreen 로드됨 - 자동로그인 상태:", {
      autoLoginEnabled,
      isAuthenticated,
      userUid: user?.uid,
      userProvider: user?.provider,
      userDisplayName: user?.displayName,
    });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 상태에 따른 단계 매핑
  const getStepFromStatus = (
    status: DiagnosisReservation["status"]
  ): number => {
    switch (status) {
      case "pending":
        return 0; // 접수완료
      case "confirmed":
        return 1; // 예약됨
      case "completed":
        return 2; // 완료
      case "cancelled":
        return -1; // 취소됨 (표시하지 않음)
      default:
        return 0;
    }
  };

  // 현재 진행 단계 (3일 이상 지난 예약은 무시)
  const currentStep = (() => {
    if (!latestReservation) return -1;

    // 예약이 3일 이상 지났는지 확인
    const reservationDate =
      latestReservation.createdAt instanceof Date
        ? latestReservation.createdAt
        : (latestReservation.createdAt as any)?.toDate?.() ||
          new Date(latestReservation.createdAt as any);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 3일 이상 지난 예약은 -1 반환 (예약 없음 상태로 처리)
    if (reservationDate < threeDaysAgo) {
      return -1;
    }

    return getStepFromStatus(latestReservation.status);
  })();

  // 완료된 예약에 대한 진단 리포트 조회 (메모리 누수 방지)
  const loadVehicleReport = async (
    reservationId: string,
    isMountedRef: { current: boolean }
  ) => {
    if (!isMountedRef.current) return;

    try {
      if (isMountedRef.current) {
        setReportLoading(true);
      }

      const report = await firebaseService.getReservationVehicleDiagnosisReport(
        reservationId
      );

      if (isMountedRef.current) {
        setVehicleReport(report);
      }
    } catch (error) {
      logger.error(
        "DIAGNOSIS_REPORT",
        "Failed to load vehicle diagnosis report",
        { reservationId, error },
        user?.uid
      );
      if (isMountedRef.current) {
        setVehicleReport(null);
      }
    } finally {
      if (isMountedRef.current) {
        setReportLoading(false);
      }
    }
  };

  // 사용자 차량 목록 조회 (메모리 누수 방지)
  const loadUserVehicles = async (isMountedRef: { current: boolean }) => {
    if (!isAuthenticated || !user) {
      if (isMountedRef.current) {
        setUserVehicles([]);
      }
      return;
    }

    if (!isMountedRef.current) return;

    try {
      console.log("🔄 loadUserVehicles 시작 - userId:", user.uid);
      if (isMountedRef.current) {
        setVehiclesLoading(true);
      }

      // Firebase Auth 초기화 상태 확인 (잠시 대기 후 재시도)
      const auth = getAuth();
      if (!auth.currentUser) {
        devLog.log(
          "⚠️ 차량 목록 로드: Firebase Auth currentUser 초기화 중, 잠시 대기..."
        );
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 재시도 후에도 없으면 로그인 실패로 간주 (Apple 사용자만)
        if (!auth.currentUser && user.provider === "apple") {
          devLog.log(
            "❌ Apple 사용자: Firebase Auth currentUser 최종 확인 실패, 차량 목록 로드 건너뜀"
          );
          if (isMountedRef.current) {
            setUserVehicles([]);
            setVehiclesLoading(false);

            // Apple 토큰 만료 안내 (한 번만 표시)
            setTimeout(() => {
              Alert.alert(
                "로그인 세션 만료",
                "Apple 로그인 세션이 만료되었습니다.\n데이터를 불러오려면 다시 로그인해주세요.",
                [
                  { text: "취소", style: "cancel" },
                  {
                    text: "다시 로그인",
                    onPress: () =>
                      navigation.navigate("Login", { showBackButton: true }),
                  },
                ]
              );
            }, 1000);
          }
          return;
        }
      }

      logger.userAction("load_user_vehicles", user.uid);
      const vehicles = await firebaseService.getUserVehicles(user.uid);

      console.log("✅ loadUserVehicles 완료 - 차량 수:", vehicles.length);
      console.log(
        "📋 로드된 차량 목록:",
        vehicles.map((v) => `${v.year} ${v.make} ${v.model}`)
      );

      if (isMountedRef.current) {
        setUserVehicles(vehicles);
        console.log("📱 HomeScreen 차량 상태 업데이트 완료");
        logger.debug(
          "VEHICLE",
          "User vehicles loaded successfully",
          { count: vehicles.length },
          user.uid
        );
      }
    } catch (error) {
      logger.error(
        "VEHICLE",
        "Failed to load user vehicles",
        { error },
        user?.uid
      );
      if (isMountedRef.current) {
        setUserVehicles([]);
      }
    } finally {
      if (isMountedRef.current) {
        setVehiclesLoading(false);
      }
    }
  };

  // 화면에 포커스될 때마다 차량 목록 새로고침
  useFocusEffect(
    React.useCallback(() => {
      console.log(
        "👁️ HomeScreen 포커스 이벤트 - isAuthenticated:",
        isAuthenticated,
        "user:",
        !!user
      );

      if (isAuthenticated && user && isMountedRef.current) {
        console.log("🔄 HomeScreen 포커스 - 차량 목록 새로고침 시작");

        // 차량 목록을 강제로 새로고침
        setVehiclesLoading(true);
        loadUserVehicles(isMountedRef);
      }
    }, [isAuthenticated, user])
  );

  // 차량 데이터 강제 새로고침 함수
  const forceRefreshVehicles = React.useCallback(async () => {
    if (isMountedRef.current) {
      setVehiclesLoading(true);
      try {
        await loadUserVehicles(isMountedRef);
        console.log("✅ 차량 목록 강제 새로고침 완료");
      } catch (error) {
        handleFirebaseError(error, {
          screenName: "HomeScreen",
          actionName: "refresh_vehicle_list",
        });
      } finally {
        if (isMountedRef.current) {
          setVehiclesLoading(false);
        }
      }
    }
  }, []);

  // 사용자의 최신 예약 정보 로드 (메모리 누수 방지 개선)
  useEffect(() => {
    const loadLatestReservation = async () => {
      if (!isAuthenticated || !user) {
        if (isMountedRef.current) {
          setLatestReservation(null);
          setVehicleReport(null);
        }
        return;
      }

      // Firebase Auth가 완전히 초기화될 때까지 잠시 대기
      const auth = getAuth();
      if (!auth.currentUser) {
        devLog.log("⚠️ Firebase Auth currentUser 아직 초기화 중, 잠시 대기...");
        // 1초 정도 대기 후 다시 시도
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 재시도 후에도 currentUser가 없으면 로그인 실패로 간주
        if (!auth.currentUser && isMountedRef.current) {
          devLog.log(
            "❌ Firebase Auth currentUser 최종 확인 실패, 예약 정보 로드 건너뜀"
          );
          setLatestReservation(null);
          setVehicleReport(null);
          return;
        }
      }

      if (isMountedRef.current) {
        setIsLoading(true);
      }

      try {
        const reservations = await firebaseService.getUserDiagnosisReservations(
          user.uid
        );

        if (!isMountedRef.current) return; // 언마운트되면 상태 업데이트 중단

        // 취소되지 않은 가장 최신 예약 찾기
        const activeReservation = reservations.find(
          (r) => r.status !== "cancelled"
        );
        setLatestReservation(activeReservation || null);

        // 완료된 예약이 있으면 진단 리포트 로드
        if (activeReservation && activeReservation.status === "completed") {
          loadVehicleReport(activeReservation.id, isMountedRef);
        } else {
          setVehicleReport(null);
        }
      } catch (error) {
        if (isMountedRef.current) {
          logger.error(
            "RESERVATION",
            "Failed to load reservation info",
            { error },
            user?.uid
          );
          setLatestReservation(null);
          setVehicleReport(null);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadLatestReservation();
    loadUserVehicles(isMountedRef);
  }, [isAuthenticated, user]);

  // Pull-to-refresh 함수
  const onRefresh = async () => {
    console.log("🔄 Pull-to-refresh 시작");
    if (!isMountedRef.current) return;

    try {
      if (isMountedRef.current) {
        setRefreshing(true);
        console.log("📱 새로고침 상태 활성화");
      }

      logger.userAction("refresh_home_screen", user?.uid);

      // 모든 데이터를 병렬로 새로고침
      const promises = [];

      // 예약 정보 새로고침
      if (isAuthenticated && user) {
        // Firebase Auth가 완전히 초기화될 때까지 잠시 대기
        const auth = getAuth();
        if (!auth.currentUser) {
          devLog.log(
            "⚠️ Firebase Auth currentUser 아직 초기화 중, 새로고침 잠시 대기..."
          );
          // 1초 정도 대기 후 다시 시도
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 재시도 후에도 currentUser가 없으면 건너뜀
          if (!auth.currentUser && isMountedRef.current) {
            devLog.log(
              "❌ Firebase Auth currentUser 최종 확인 실패, 새로고침 건너뜀"
            );
            setRefreshing(false);
            return;
          }
        }

        const reservationPromise = (async () => {
          try {
            const reservations =
              await firebaseService.getUserDiagnosisReservations(user.uid);

            if (!isMountedRef.current) return;

            // 취소되지 않은 가장 최신 예약 찾기
            const activeReservation = reservations.find(
              (r) => r.status !== "cancelled"
            );
            setLatestReservation(activeReservation || null);

            // 완료된 예약이 있으면 진단 리포트 로드
            if (activeReservation && activeReservation.status === "completed") {
              await loadVehicleReport(activeReservation.id, isMountedRef);
            } else if (isMountedRef.current) {
              setVehicleReport(null);
            }
          } catch (error) {
            logger.error(
              "RESERVATION",
              "Failed to refresh reservation info",
              { error },
              user?.uid
            );
          }
        })();

        // 차량 목록 새로고침
        const vehiclesPromise = loadUserVehicles(isMountedRef);

        promises.push(reservationPromise, vehiclesPromise);
      }

      await Promise.all(promises);

      console.log("✅ Pull-to-refresh 완료");
      logger.debug("UI", "Home screen refresh completed", undefined, user?.uid);
    } catch (error) {
      logger.error("UI", "Home screen refresh failed", { error }, user?.uid);
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  };

  // 차량 클릭 시 상세 모달 열기
  const openVehicleDetail = (vehicle: UserVehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleDetail(true);

    // 애니메이션 시작
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 차량 상세 모달 닫기
  const closeVehicleDetail = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowVehicleDetail(false);
      setSelectedVehicle(null);
    });
  };

  // 차량 수정
  const editVehicle = () => {
    setShowVehicleDetail(false);
    setVehicleModalEditMode(true);
    setShowVehicleModal(true);
  };

  // 차량 삭제
  const deleteVehicle = async () => {
    if (!selectedVehicle || !user) return;

    Alert.alert(
      "차량 삭제",
      `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}을(를) 삭제하시겠습니까?`,
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingVehicle(true);

              await firebaseService.deleteUserVehicle(selectedVehicle.id);

              // 즉시 차량 목록 새로고침
              await forceRefreshVehicles();

              setShowVehicleDetail(false);

              Alert.alert("완료", "차량이 삭제되었습니다.");
            } catch (error) {
              logger.vehicle("delete_failed", undefined, user?.uid, {
                error: error instanceof Error ? error.message : String(error),
              });
              Alert.alert("오류", "차량 삭제에 실패했습니다.");
            } finally {
              setDeletingVehicle(false);
            }
          },
        },
      ]
    );
  };

  // 인증이 필요한 기능 실행 헬퍼 (토큰 만료 감지 포함)
  const executeWithAuth = async (action: () => void, feature: string) => {
    if (!isAuthenticated) {
      navigation.navigate("Login", { showBackButton: true });
      return;
    }

    // Firebase Auth 상태 확인 (초기화 대기 포함)
    const auth = getAuth();
    if (!auth.currentUser) {
      devLog.log(
        `⚠️ ${feature}: Firebase Auth currentUser 초기화 중, 잠시 대기...`
      );

      // 잠시 대기 후 재확인
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!auth.currentUser && user?.provider === "apple") {
        // Apple 토큰 만료로 추정되는 상황
        Alert.alert(
          "로그인 필요",
          "Apple 로그인 세션이 만료되었습니다.\n다시 로그인해주세요.",
          [
            { text: "취소", style: "cancel" },
            {
              text: "로그인",
              onPress: () =>
                navigation.navigate("Login", { showBackButton: true }),
            },
          ]
        );
        return;
      } else if (!auth.currentUser && user?.provider !== "apple") {
        devLog.log(
          `⚠️ ${feature}: Firebase Auth currentUser 아직 없음, 하지만 진행`
        );
        // Apple이 아닌 경우는 Redux 인증 상태를 믿고 진행
      }
    }

    action();
  };

  // 진단 리포트 보기 핸들러
  const handleViewReport = () => {
    executeWithAuth(() => {
      if (vehicleReport) {
        // Analytics: 리포트 조회 추적
        analyticsService
          .logReportViewed(vehicleReport.id, "vehicle_diagnosis")
          .catch((error) => {
            // 무시
          });

        navigation.navigate("VehicleDiagnosisReport", {
          reportId: vehicleReport.id,
        });
      }
    }, "진단 리포트 보기");
  };

  // 진단 리포트 목록 보기 핸들러
  const handleViewReportList = () => {
    executeWithAuth(() => {
      navigation.navigate("DiagnosisReportList");
    }, "진단 리포트 목록");
  };

  // 내 예약 보기 핸들러
  const handleViewMyReservations = () => {
    executeWithAuth(() => {
      navigation.navigate("MyReservations");
    }, "내 예약 보기");
  };

  // 진단 예약하기 핸들러
  const handleDiagnosisReservation = () => {
    executeWithAuth(() => {
      // Analytics: 예약 시작 추적
      analyticsService.logReservationStarted("manual").catch((error) => {
        // 무시
      });

      // 새로운 통합 예약 화면으로 이동
      navigation.navigate("Reservation");
    }, "진단 예약");
  };

  // 차량 추가 카드 클릭 핸들러
  const handleAddVehicleCard = () => {
    if (!isAuthenticated) {
      navigation.navigate("Login", { showBackButton: true });
      return;
    }
    setVehicleModalEditMode(false);
    setShowVehicleModal(true);
  };

  // 차량 선택 핸들러
  const handleSelectVehicle = async (completedVehicle: CompletedVehicle) => {
    // Convert CompletedVehicle format to old Vehicle format for compatibility
    const vehicle = {
      make: completedVehicle.make,
      model: completedVehicle.model,
      year: completedVehicle.year,
      batteryCapacity: completedVehicle.batteryCapacity || "",
      range: "",
      trim: completedVehicle.trim,
    };
    try {
      if (!user) return;

      console.log("🚗 handleSelectVehicle 호출됨:", {
        vehicleModalEditMode,
        selectedVehicle: selectedVehicle?.id,
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      });

      if (vehicleModalEditMode && selectedVehicle) {
        // 수정 모드: 기존 차량 업데이트
        logger.vehicle(
          "edit_start",
          { make: vehicle.make, model: vehicle.model, year: vehicle.year },
          user?.uid
        );

        await firebaseService.updateUserVehicle(selectedVehicle.id, {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          trim: vehicle.trim,
          batteryCapacity:
            typeof vehicle.batteryCapacity === "number"
              ? `${vehicle.batteryCapacity}kWh`
              : vehicle.batteryCapacity || "",
          range:
            typeof vehicle.range === "number"
              ? `${vehicle.range}km`
              : vehicle.range || "",
        });

        logger.vehicle("edit_complete", undefined, user?.uid);

        setShowVehicleModal(false);
        setVehicleModalEditMode(false);

        // 즉시 차량 목록 새로고침 후 알림
        await forceRefreshVehicles();

        // 약간의 지연을 주어 UI 업데이트 확실하게 처리
        setTimeout(() => {
          Alert.alert(
            "차량 정보 변경 완료",
            `${vehicle.year} ${vehicle.make} ${vehicle.model}로 변경되었습니다.\n홈 화면이 업데이트되었습니다.`,
            [{ text: "확인", style: "default" }]
          );
        }, 100);
      } else {
        // 추가 모드: 새 차량 추가
        logger.vehicle(
          "add_start",
          { make: vehicle.make, model: vehicle.model, year: vehicle.year },
          user?.uid
        );

        const vehicleId = await firebaseService.addUserVehicle({
          userId: user.uid,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          trim: vehicle.trim,
          batteryCapacity:
            typeof vehicle.batteryCapacity === "number"
              ? `${vehicle.batteryCapacity}kWh`
              : vehicle.batteryCapacity || "",
          range:
            typeof vehicle.range === "number"
              ? `${vehicle.range}km`
              : vehicle.range || "",
          isActive: true,
        });

        logger.vehicle(
          "add_complete",
          { make: vehicle.make, model: vehicle.model, year: vehicle.year },
          user?.uid
        );

        setShowVehicleModal(false);

        // 즉시 차량 목록 새로고침 후 알림
        await forceRefreshVehicles();

        // 약간의 지연을 주어 UI 업데이트 확실하게 처리
        setTimeout(() => {
          Alert.alert(
            "차량 추가 완료",
            `${vehicle.year} ${vehicle.make} ${vehicle.model}이(가) 추가되었습니다.\n홈 화면이 업데이트되었습니다.`,
            [{ text: "확인", style: "default" }]
          );
        }, 100);
      }
    } catch (error) {
      logger.error("VEHICLE", "Vehicle operation failed", { error }, user?.uid);
      Alert.alert(
        "오류",
        vehicleModalEditMode
          ? "차량 수정에 실패했습니다."
          : "차량 추가에 실패했습니다."
      );
    }
  };

  // 서비스 카드 렌더링 함수
  const renderServiceCard = ({
    item,
    index,
  }: {
    item: (typeof serviceOptions)[0];
    index: number;
  }) => {
    const screenWidth = Dimensions.get("window").width;

    return (
      <View style={[styles.carouselCardContainer, { width: screenWidth }]}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 300, delay: index * 100 }}
          style={[
            styles.carouselServiceCard,
            item.isPremium && styles.carouselPremiumCard,
          ]}
        >
          {item.isPremium && (
            <View style={styles.carouselPremiumBadge}>
              <Text style={styles.carouselPremiumBadgeText}>PREMIUM</Text>
            </View>
          )}

          <View style={styles.carouselServiceCardHeader}>
            <Text
              style={[
                styles.carouselServiceCardTitle,
                item.isPremium && styles.carouselPremiumTitle,
              ]}
            >
              {item.title}
            </Text>
            <View
              style={[
                styles.carouselPriceContainer,
                item.isPremium && styles.carouselPremiumPriceContainer,
              ]}
            >
              <Text
                style={[
                  styles.carouselPriceAmount,
                  item.isPremium && styles.carouselPremiumPriceAmount,
                ]}
              >
                {item.price}
              </Text>
            </View>
          </View>

          <View style={styles.carouselServiceFeatures}>
            {item.features.map((feature, featureIndex) => (
              <View key={featureIndex} style={styles.carouselFeatureItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={item.color}
                />
                <Text style={styles.carouselFeatureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.carouselServiceSelectButton,
              item.isPremium && styles.carouselPremiumSelectButton,
            ]}
            onPress={handleDiagnosisReservation}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.carouselServiceSelectButtonText,
                item.isPremium && styles.carouselPremiumSelectButtonText,
              ]}
            >
              선택하기
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    );
  };

  // 캐러셀 인디케이터 렌더링
  const renderCarouselIndicator = () => {
    return (
      <View style={styles.carouselIndicator}>
        {serviceOptions.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.indicatorDot,
              index === currentServiceIndex && styles.indicatorDotActive,
            ]}
            onPress={() => {
              setCurrentServiceIndex(index);
              serviceCarouselRef.current?.scrollToIndex({
                index,
                animated: true,
              });
            }}
          />
        ))}
      </View>
    );
  };

  // 캐러셀 스크롤 이벤트 핸들러
  const handleCarouselScroll = (event: any) => {
    const screenWidth = Dimensions.get("window").width;
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / screenWidth);

    if (currentIndex !== currentServiceIndex) {
      setCurrentServiceIndex(currentIndex);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header showLogo={true} showNotification={true} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#202632"]} // Android
            tintColor="#202632" // iOS
          />
        }
      >
        {/* 메인 상태 섹션 - "내 지갑" 스타일 */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 200 }}
          style={styles.mainStatusSection}
        >
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>내 차량</Text>
            <TouchableOpacity
              style={styles.usageHistoryButton}
              onPress={() => {
                const hasVehicle = userVehicles.length > 0;
                if (hasVehicle && userVehicles[0]) {
                  // 차량이 있으면 편집 모드로
                  setSelectedVehicle(userVehicles[0]);
                  setVehicleModalEditMode(true);
                  setShowVehicleModal(true);
                } else {
                  // 차량이 없으면 추가 모드로
                  handleAddVehicleCard();
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={userVehicles.length > 0 ? "pencil" : "add"}
                size={16}
                color="#06B6D4"
              />
              <Text style={styles.addVehicleHeaderText}>
                {userVehicles.length > 0 ? "변경" : "차량 추가"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusContent}>
            {!isAuthenticated ? (
              <Text style={styles.statusMessage}>
                로그인 후 차량을 등록해보세요
              </Text>
            ) : vehiclesLoading ? (
              // 스켈레톤 로딩 표시
              <SkeletonVehicleCard />
            ) : userVehicles.length === 0 ? (
              <View style={styles.noVehicleContainer}>
                <Text style={styles.statusMessage}>
                  아직 등록된 차량이 없습니다
                </Text>
                <TouchableOpacity
                  style={styles.addVehicleButton}
                  onPress={handleAddVehicleCard}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addVehicleButtonText}>차량 추가</Text>
                </TouchableOpacity>
              </View>
            ) : userVehicles[0] ? (
              <VehicleCard
                vehicle={userVehicles[0]}
                onEdit={() => {
                  console.log("🚗 HomeScreen 차량 편집 버튼 클릭");
                  setVehicleModalEditMode(true);
                  setShowVehicleModal(true);
                }}
              />
            ) : null}
          </View>
        </MotiView>

        {/* 메인 진단 예약 버튼 - "충전하기" 스타일 */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 400 }}
          style={styles.mainActionButton}
        >
          <TouchableOpacity
            style={styles.diagnosisButton}
            onPress={handleDiagnosisReservation}
            activeOpacity={0.8}
          >
            <Text style={styles.diagnosisButtonText}>진단 예약하기</Text>
          </TouchableOpacity>
        </MotiView>

        {/* 프리미엄 서비스 프로모션 카드 */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 600 }}
          style={styles.promotionCard}
        >
          <View style={styles.promotionContent}>
            <View style={styles.promotionText}>
              <Text style={styles.promotionTitle}>
                프리미엄 진단으로 <Text style={styles.highlightText}>정밀</Text>
                하게!
              </Text>
              <Text style={styles.promotionSubtitle}>
                배터리 상태를 정밀하게 분석해드려요
              </Text>
            </View>
            <View style={styles.promotionIcon}>
              <Ionicons name="analytics" size={40} color="#06B6D4" />
            </View>
          </View>
        </MotiView>

        {/* 하단 액션 그리드 - 3개 아이콘 */}
        {isAuthenticated && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500, delay: 800 }}
            style={styles.actionGrid}
          >
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleViewReportList}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="document-text" size={32} color="#6B7280" />
              </View>
              <Text style={styles.actionTitle}>진단리포트</Text>
              <Text style={styles.actionSubtitle}>결과보기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleViewMyReservations}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="calendar" size={32} color="#6B7280" />
              </View>
              <Text style={styles.actionTitle}>내 예약</Text>
              <Text style={styles.actionSubtitle}>관리하기</Text>
            </TouchableOpacity>
          </MotiView>
        )}
      </ScrollView>

      {/* 차량 선택 아코디언 */}
      {showVehicleModal && (
        <VehicleAccordionSelector
          key={`home-vehicle-selector-${Date.now()}`}
          visible={showVehicleModal}
          onClose={() => {
            setShowVehicleModal(false);
            setVehicleModalEditMode(false);
          }}
          onComplete={handleSelectVehicle}
          editMode={vehicleModalEditMode}
        />
      )}

      {/* 차량 상세 모달 */}
      <Modal
        visible={showVehicleDetail}
        transparent={true}
        animationType="none"
        onRequestClose={closeVehicleDetail}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeVehicleDetail}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>차량 정보</Text>
              <TouchableOpacity
                onPress={closeVehicleDetail}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedVehicle && (
              <View style={styles.modalContent}>
                <View style={styles.vehicleDetailCard}>
                  <View style={styles.vehicleIconContainer}>
                    <Ionicons name="car-sport" size={48} color="#202632" />
                  </View>

                  <View style={styles.vehicleDetailInfo}>
                    <Text style={styles.vehicleDetailName}>
                      {selectedVehicle.year} {selectedVehicle.make}{" "}
                      {selectedVehicle.model}
                    </Text>

                    {selectedVehicle.nickname && (
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>별명</Text>
                        <Text style={styles.specValue}>
                          {selectedVehicle.nickname}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={editVehicle}
                  >
                    <Ionicons name="create-outline" size={20} color="#202632" />
                    <Text style={styles.editButtonText}>수정</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={deleteVehicle}
                    disabled={deletingVehicle}
                  >
                    {deletingVehicle ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#EF4444"
                      />
                    )}
                    <Text style={styles.deleteButtonText}>
                      {deletingVehicle ? "삭제 중..." : "삭제"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
    alignItems: "center",
  },
  welcomeTitle: convertToLineSeedFont({
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  }),
  welcomeSubtitle: convertToLineSeedFont({
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  }),
  vehicleSection: {
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 16,
  },
  featureGrid: {
    paddingHorizontal: 0,
    paddingBottom: 16,
    gap: 16,
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  vehicleLoadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
    minHeight: 100, // 최소 컨텐츠 높이 보장
  },
  vehicleLoadingPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
  },
  vehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  vehicleInfo: {
    flex: 1,
    paddingBottom: 0,
  },
  vehicleName: convertToLineSeedFont({
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  }),
  vehicleSpecs: convertToLineSeedFont({
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  }),
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
    marginTop: 16,
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  addMoreText: convertToLineSeedFont({
    fontSize: 14,
    color: "#202632",
    fontWeight: "500",
    marginLeft: 6,
  }),
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginHorizontal: 16,
    marginBottom: 0,
    minHeight: 150, // 최소 높이 설정
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  featureDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 30,
  },
  noReservationContainer: {
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: "center",
  },
  noReservationText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingTop: 0,
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#202632",
    borderRadius: 12,
    padding: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 20,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#202632",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#202632",
    lineHeight: 20,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    height: 60,
    gap: 8,
  },
  textContainer: {
    flex: 0.6,
    justifyContent: "center",
  },
  iconContainer: {
    flex: 0.4,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndicatorContainer: {
    marginTop: 16,
    width: "100%",
  },
  reserveButton: {
    backgroundColor: "#202632",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: "center",
  },
  reserveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  statusText: {
    fontSize: 12,
    color: "#202632",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
  reportButtonContainer: {
    marginTop: 16,
    width: "100%",
  },
  reportButton: {
    backgroundColor: "#F0F8FF",
    borderWidth: 1,
    borderColor: "#202632",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  reportButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#202632",
    marginLeft: 6,
    marginRight: 6,
  },
  reportLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reportLoadingText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
  },
  noReportContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noReportText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 6,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  vehicleDetailCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  vehicleIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  vehicleDetailInfo: {
    alignItems: "center",
  },
  vehicleDetailName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  specLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  specValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8FF",
    borderWidth: 1,
    borderColor: "#202632",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202632",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  // 차량 추가 컨텐츠 (차량 없을 때)
  addVehicleContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  addVehicleIconContainer: {
    position: "relative",
    marginBottom: 16,
  },
  addVehiclePlusBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#202632",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  addVehicleTextContainer: {
    alignItems: "center",
  },
  addVehicleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    textAlign: "center",
  },
  addVehicleSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 14,
    textAlign: "center",
  },
  // 새로운 홈 디자인 스타일
  mainStatusSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitle: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  }),
  usageHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  usageHistoryText: convertToLineSeedFont({
    fontSize: 14,
    color: "#6B7280",
  }),
  statusContent: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 0,
  },
  statusMessage: convertToLineSeedFont({
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  }),
  mainActionButton: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  diagnosisButton: {
    backgroundColor: "#06B6D4",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#06B6D4",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  diagnosisButtonText: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  }),
  promotionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,

  },
  promotionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promotionText: {
    flex: 1,
  },
  promotionTitle: convertToLineSeedFont({
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  }),
  highlightText: {
    color: "#1F2937",
  },
  promotionSubtitle: convertToLineSeedFont({
    fontSize: 13,
    color: "#1F2937",
  }),
  promotionIcon: {
    marginLeft: 16,
  },
  actionGrid: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginHorizontal: 16,
    marginBottom: 20,
  },
  actionItem: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: (Dimensions.get("window").width - 44) / 3, // 화면 너비의 1/3 (패딩 16*2 + 마진 12 고려)
  },
  actionIconContainer: {
    marginBottom: 8,
  },
  actionTitle: convertToLineSeedFont({
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
    textAlign: "center",
  }),
  actionSubtitle: convertToLineSeedFont({
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
  }),
  // 캐러셀 서비스 옵션 스타일
  serviceOptionsCarousel: {
    flex: 1,
  },
  serviceOptionsTitle: convertToLineSeedFont({
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  }),
  serviceCarousel: {
    flex: 1,
  },
  carouselCardContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  carouselServiceCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    position: "relative",
    height: 280,
    justifyContent: "space-between",
    flex: 1,
  },
  carouselPremiumCard: {
    borderColor: "#4F46E5",
    borderWidth: 2,
  },
  carouselPremiumBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 1,
  },
  carouselPremiumBadgeText: convertToLineSeedFont({
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  }),
  carouselServiceCardHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  carouselServiceCardTitle: convertToLineSeedFont({
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  }),
  carouselPremiumTitle: {
    color: "#4F46E5",
  },
  carouselPriceContainer: {
    backgroundColor: "#E0E7FF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  carouselPremiumPriceContainer: {
    backgroundColor: "#4F46E5",
  },
  carouselPriceAmount: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: "bold",
    color: "#4F46E5",
  }),
  carouselPremiumPriceAmount: {
    color: "#FFFFFF",
  },
  carouselServiceFeatures: {
    flex: 1,
    gap: 8,
    marginBottom: 16,
  },
  carouselFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  carouselFeatureText: convertToLineSeedFont({
    fontSize: 12,
    color: "#4B5563",
    flex: 1,
  }),
  carouselServiceSelectButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  carouselPremiumSelectButton: {
    backgroundColor: "#4F46E5",
  },
  carouselServiceSelectButtonText: convertToLineSeedFont({
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  }),
  carouselPremiumSelectButtonText: {
    color: "#FFFFFF",
  },
  // 캐러셀 인디케이터 스타일
  carouselIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  indicatorDotActive: {
    backgroundColor: "#4F46E5",
    width: 20,
  },
  // 새로운 차량 추가 관련 스타일
  noVehicleContainer: {
    alignItems: "center",
    gap: 12,
  },
  addVehicleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addVehicleButtonText: convertToLineSeedFont({
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  }),
  vehicleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editVehicleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  editVehicleButtonText: convertToLineSeedFont({
    fontSize: 12,
    fontWeight: "600",
    color: "#06B6D4",
  }),
  addVehicleHeaderText: convertToLineSeedFont({
    fontSize: 14,
    fontWeight: "600",
    color: "#06B6D4",
  }),
  // VehicleCard 스타일
  vehicleCard: {
    width: "100%",
    paddingBottom: 0,
    marginBottom: 0,
  },
  vehicleImageContainer: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
    position: "relative",
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  vehicleImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  vehicleBrandOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vehicleBrandText: convertToLineSeedFont({
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  }),
  vehicleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  vehicleCardNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  vehicleCardEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  vehicleCardName: convertToLineSeedFont({
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  }),
  vehicleCardDetails: convertToLineSeedFont({
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  }),
  vehicleCardSpecs: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  vehicleCardSpecItem: {
    flex: 1,
    minWidth: "30%",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  vehicleCardSpecLabel: convertToLineSeedFont({
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 4,
    textAlign: "center",
  }),
  vehicleCardSpecValue: convertToLineSeedFont({
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  }),
  vehicleCardSection: {
    marginBottom: 16,
  },
  vehicleCardSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  vehicleCardSectionTitle: convertToLineSeedFont({
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  }),
  vehicleCardSpecGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  // 영수증 스타일 레이아웃 스타일
  vehicleCardReceiptSection: {
    marginTop: 8,
  },
  vehicleCardReceiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  vehicleCardExpandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 0,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    gap: 6,
  },
  vehicleCardExpandText: convertToLineSeedFont({
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  }),
});
