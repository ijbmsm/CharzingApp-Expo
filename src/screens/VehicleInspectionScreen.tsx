import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
  Animated,
  Easing,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSelector } from "react-redux";
import { RootStackParamList } from "../navigation/RootNavigator";
import { RootState } from "../store";
import { Timestamp } from "firebase/firestore";
import firebaseService from "../services/firebaseService";
import sentryLogger from "../utils/sentryLogger";

// Types
import {
  VehicleDiagnosisReport,
  DiagnosisDetail,
  BatteryCell,
  MajorDevicesInspection,
  PaintThicknessInspection,
  TireTreadInspection,
  VehiclePhotoInspection,
  OtherInspectionItem,
} from "../../adminWeb/index";

// Components
import BatteryCellGridModal from "../components/BatteryCellGridModal";
import OtherInspectionBottomSheet from "../components/OtherInspectionBottomSheet";
import InputButton from "../components/InputButton";
import VehicleModelBottomSheet from "../components/VehicleModelBottomSheet";
import DashboardInfoBottomSheet from "../components/DashboardInfoBottomSheet";
import VinCheckBottomSheet from "../components/VinCheckBottomSheet";
import MajorDeviceBottomSheet from "../components/MajorDeviceBottomSheet";
import PaintThicknessBottomSheet from "../components/PaintThicknessBottomSheet";
import TireTreadBottomSheet from "../components/TireTreadBottomSheet";
import VehiclePhotoBottomSheet from "../components/VehiclePhotoBottomSheet";

type NavigationProp = StackNavigationProp<
  RootStackParamList,
  "VehicleInspection"
>;

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  realName?: string;
  phoneNumber?: string;
  photoURL?: string;
  provider?: "kakao" | "google" | "apple";
}

interface ReservationItem {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  requestedDate: Date | Timestamp;
  status: string;
}

type InspectionMode = "reservation_list" | "inspection";

type InspectionSection =
  | "vehicleInfo"
  | "vehicleStatus"
  | "batteryInfo"
  | "majorDevices"
  | "diagnosis"
  | "images";

interface SectionCompletion {
  completed: number;
  total: number;
  isAllRequiredComplete: boolean;
}

interface ExpandedSectionsState {
  vehicleInfo: boolean;
  vehicleStatus: boolean;
  batteryInfo: boolean;
  majorDevices: boolean;
  diagnosis: boolean;
  images: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * 차량 사진 데이터가 하나라도 있는지 확인
 */
const isVehiclePhotoComplete = (data: VehiclePhotoInspection): boolean => {
  const overallCount = [
    data.overallPhotos.front,
    data.overallPhotos.leftSide,
    data.overallPhotos.rear,
    data.overallPhotos.rightSide,
  ].filter(Boolean).length;

  const suspensionCount = [
    data.suspensionStructure.driverFrontWheel,
    data.suspensionStructure.driverRearWheel,
    data.suspensionStructure.passengerRearWheel,
    data.suspensionStructure.passengerFrontWheel,
  ].filter(Boolean).length;

  const batteryCount = [
    data.undercarriageBattery.front,
    data.undercarriageBattery.leftSide,
    data.undercarriageBattery.rear,
    data.undercarriageBattery.rightSide,
  ].filter(Boolean).length;

  return overallCount + suspensionCount + batteryCount > 0;
};

/**
 * 차량 사진 개수 계산 (전체 + 하부)
 */
const getVehiclePhotoCount = (data: VehiclePhotoInspection): number => {
  const overallCount = [
    data.overallPhotos.front,
    data.overallPhotos.leftSide,
    data.overallPhotos.rear,
    data.overallPhotos.rightSide,
  ].filter(Boolean).length;

  const suspensionCount = [
    data.suspensionStructure.driverFrontWheel,
    data.suspensionStructure.driverRearWheel,
    data.suspensionStructure.passengerRearWheel,
    data.suspensionStructure.passengerFrontWheel,
  ].filter(Boolean).length;

  const batteryCount = [
    data.undercarriageBattery.front,
    data.undercarriageBattery.leftSide,
    data.undercarriageBattery.rear,
    data.undercarriageBattery.rightSide,
  ].filter(Boolean).length;

  return overallCount + suspensionCount + batteryCount;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const VehicleInspectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isMountedRef = useRef(true);
  const insets = useSafeAreaInsets();

  // ============================================================================
  // STATE - Mode & User
  // ============================================================================
  const [inspectionMode, setInspectionMode] =
    useState<InspectionMode>("reservation_list");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // ============================================================================
  // STATE - Reservation List
  // ============================================================================
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  // ============================================================================
  // STATE - Accordion Sections
  // ============================================================================
  const [expandedSections, setExpandedSections] =
    useState<ExpandedSectionsState>({
      vehicleInfo: true,
      vehicleStatus: false,
      batteryInfo: false,
      majorDevices: false,
      diagnosis: false,
      images: false,
    });

  // Accordion Animation Values
  const accordionAnimations = useRef({
    vehicleInfo: new Animated.Value(1),
    vehicleStatus: new Animated.Value(0),
    batteryInfo: new Animated.Value(0),
    majorDevices: new Animated.Value(0),
    diagnosis: new Animated.Value(0),
    images: new Animated.Value(0),
  }).current;

  // ============================================================================
  // STATE - Section 1: Vehicle Basic Information
  // ============================================================================
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleGrade, setVehicleGrade] = useState(""); // 등급/트림 (옵셔널)
  const [vehicleYear, setVehicleYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [dashboardImageUris, setDashboardImageUris] = useState<string[]>([]);
  const [dashboardStatus, setDashboardStatus] = useState<'good' | 'problem' | undefined>(undefined);
  const [dashboardIssueDescription, setDashboardIssueDescription] = useState("");

  // Modal States
  const [isVehicleModelModalVisible, setIsVehicleModelModalVisible] = useState(false);
  const [isDashboardInfoModalVisible, setIsDashboardInfoModalVisible] = useState(false);
  const [isVinCheckModalVisible, setIsVinCheckModalVisible] = useState(false);

  // Vin Check Issues
  const [vinCheckIssues, setVinCheckIssues] = useState({
    vinIssue: '',
    modificationIssue: '',
    floodIssue: '',
  });

  // ============================================================================
  // STATE - Section 2: VIN & Vehicle Status Check
  // ============================================================================
  const [vehicleVinImageUris, setVehicleVinImageUris] = useState<string[]>([]);
  const [isVinVerified, setIsVinVerified] = useState<boolean | undefined>(undefined);
  const [hasNoIllegalModification, setHasNoIllegalModification] =
    useState<boolean | undefined>(undefined);
  const [hasNoFloodDamage, setHasNoFloodDamage] = useState<boolean | undefined>(undefined);
  const [carKeyCount, setCarKeyCount] = useState<string>(''); // 차키 개수

  // ============================================================================
  // STATE - Section 2.5: Vehicle Status (외판 도막, 타이어, 차량 사진)
  // ============================================================================
  const [paintThicknessData, setPaintThicknessData] = useState<PaintThicknessInspection[]>([]);
  const [tireTreadData, setTireTreadData] = useState<TireTreadInspection[]>([]);
  const [vehiclePhotoData, setVehiclePhotoData] = useState<VehiclePhotoInspection>({
    overallPhotos: {
      front: undefined,
      leftSide: undefined,
      rear: undefined,
      rightSide: undefined,
    },
    suspensionStructure: {
      driverFrontWheel: undefined,
      driverRearWheel: undefined,
      passengerRearWheel: undefined,
      passengerFrontWheel: undefined,
    },
    undercarriageBattery: {
      front: undefined,
      leftSide: undefined,
      rear: undefined,
      rightSide: undefined,
    },
  });
  const [isPaintThicknessModalVisible, setIsPaintThicknessModalVisible] = useState(false);
  const [isTireTreadModalVisible, setIsTireTreadModalVisible] = useState(false);
  const [isVehiclePhotoModalVisible, setIsVehiclePhotoModalVisible] = useState(false);

  // ============================================================================
  // STATE - Section 3: Battery Information
  // ============================================================================
  const [batterySOH, setBatterySOH] = useState("100");
  const [batteryCellCount, setBatteryCellCount] = useState(0);
  const [normalChargeCount, setNormalChargeCount] = useState(0);
  const [fastChargeCount, setFastChargeCount] = useState(0);

  // Battery Cells (배터리 셀 상세 정보)
  const [batteryCells, setBatteryCells] = useState<BatteryCell[]>([]);
  const [defaultCellVoltage, setDefaultCellVoltage] = useState(3.7); // 기본 전압

  // Battery Cell Modal
  const [isCellModalVisible, setIsCellModalVisible] = useState(false);

  // ============================================================================
  // STATE - Section 4: Diagnosis Details
  // ============================================================================
  // 세부 진단 항목 (고정된 6개 항목, interpretation만 사용자가 입력)
  const [diagnosisInterpretations, setDiagnosisInterpretations] = useState({
    soh: "",
    cellDefect: "",
    totalCharge: "",
    fastCharge: "",
    fastChargeRatio: "",
    recentErrorCode: "",
  });
  const [recentErrorCodeValue, setRecentErrorCodeValue] = useState(""); // 최근 오류 코드 (직접 입력)

  // ============================================================================
  // STATE - Section 4: Major Devices (조향, 제동, 전기)
  // ============================================================================
  const [steeringData, setSteeringData] = useState<MajorDevicesInspection['steering']>({});
  const [brakingData, setBrakingData] = useState<MajorDevicesInspection['braking']>({});
  const [electricalData, setElectricalData] = useState<MajorDevicesInspection['electrical']>({});
  const [isSteeringModalVisible, setIsSteeringModalVisible] = useState(false);
  const [isBrakingModalVisible, setIsBrakingModalVisible] = useState(false);
  const [isElectricalModalVisible, setIsElectricalModalVisible] = useState(false);

  // ============================================================================
  // STATE - Section 5: 기타 (Other Inspection)
  // ============================================================================
  const [otherInspectionItems, setOtherInspectionItems] = useState<OtherInspectionItem[]>([]);
  const [isOtherInspectionModalVisible, setIsOtherInspectionModalVisible] = useState(false);
  const [selectedOtherInspectionItem, setSelectedOtherInspectionItem] = useState<OtherInspectionItem | null>(null);

  // ============================================================================
  // STATE - Submission
  // ============================================================================
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    requestImagePermissions();
  }, []);

  useEffect(() => {
    if (inspectionMode === "reservation_list") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSelectedDateFilter(today);
      loadReservationList();
    }
  }, [inspectionMode]);

  // 셀 개수 변경 시 배터리 셀 배열 초기화
  useEffect(() => {
    if (batteryCellCount > 0) {
      const newCells: BatteryCell[] = Array.from(
        { length: batteryCellCount },
        (_, index) => ({
          id: index + 1,
          cellNumber: index + 1,
          isDefective: false,
          voltage: defaultCellVoltage,
        })
      );
      setBatteryCells(newCells);
    } else {
      setBatteryCells([]);
    }
  }, [batteryCellCount, defaultCellVoltage]);

  // ============================================================================
  // AUTO-CALCULATED VALUES (최대/최소 전압, 불량 셀 개수 자동 계산)
  // ============================================================================

  const defectiveCellCount = useMemo(() => {
    return batteryCells.filter((cell) => cell.isDefective).length;
  }, [batteryCells]);

  const maxCellVoltage = useMemo(() => {
    if (batteryCells.length === 0) return 0;
    return Math.max(...batteryCells.map((cell) => {
      const voltage = typeof cell.voltage === 'string' ? parseFloat(cell.voltage || '0') : (cell.voltage || 0);
      return voltage;
    }));
  }, [batteryCells]);

  const minCellVoltage = useMemo(() => {
    if (batteryCells.length === 0) return 0;
    return Math.min(...batteryCells.map((cell) => {
      const voltage = typeof cell.voltage === 'string' ? parseFloat(cell.voltage || '0') : (cell.voltage || 0);
      return voltage;
    }));
  }, [batteryCells]);

  // 세부 진단 데이터 자동 계산
  const diagnosisDetails = useMemo<DiagnosisDetail[]>(() => {
    const totalCharge = normalChargeCount + fastChargeCount;
    const fastChargeRatio =
      totalCharge > 0
        ? ((fastChargeCount / totalCharge) * 100).toFixed(1)
        : "0.0";

    return [
      {
        category: "SOH",
        measuredValue: batterySOH && batterySOH !== "" ? `${batterySOH}%` : "",
        interpretation: diagnosisInterpretations.soh,
      },
      {
        category: "셀 불량 여부",
        measuredValue:
          defectiveCellCount > 0 ? `${defectiveCellCount}개` : "정상",
        interpretation: diagnosisInterpretations.cellDefect,
      },
      {
        category: "총 충전 횟수",
        measuredValue: totalCharge > 0 ? `${totalCharge}회` : "",
        interpretation: diagnosisInterpretations.totalCharge,
      },
      {
        category: "급속 충전 횟수",
        measuredValue: fastChargeCount > 0 ? `${fastChargeCount}회` : "",
        interpretation: diagnosisInterpretations.fastCharge,
      },
      {
        category: "급속 충전 비율",
        measuredValue: totalCharge > 0 ? `${fastChargeRatio}%` : "",
        interpretation: diagnosisInterpretations.fastChargeRatio,
      },
      {
        category: "최근 오류 코드",
        measuredValue: recentErrorCodeValue || "",
        interpretation: diagnosisInterpretations.recentErrorCode,
      },
    ];
  }, [
    batterySOH,
    defectiveCellCount,
    normalChargeCount,
    fastChargeCount,
    diagnosisInterpretations,
    recentErrorCodeValue,
  ]);

  // ============================================================================
  // PERMISSION
  // ============================================================================

  const requestImagePermissions = useCallback(async () => {
    if (Platform.OS !== "web") {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
  }, []);

  // ============================================================================
  // RESERVATION LIST FUNCTIONS
  // ============================================================================

  const loadReservationList = useCallback(async () => {
    if (!currentUser) return;

    setIsLoadingReservations(true);
    try {
      const { collection, query, where, getDocs, orderBy } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../services/firebase");

      const reservationsQuery = query(
        collection(db, "diagnosisReservations"),
        where("status", "==", "confirmed"),
        orderBy("requestedDate", "asc")
      );

      const snapshot = await getDocs(reservationsQuery);
      const reservationsList: ReservationItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ReservationItem[];

      if (isMountedRef.current) {
        setReservations(reservationsList);
      }
    } catch (error) {
      console.error("예약 목록 로드 실패:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingReservations(false);
      }
    }
  }, [currentUser]);

  const getFilteredReservations = useCallback(() => {
    let filtered = [...reservations];

    // Date filter
    if (selectedDateFilter) {
      filtered = filtered.filter((reservation) => {
        const resDate =
          reservation.requestedDate instanceof Timestamp
            ? reservation.requestedDate.toDate()
            : reservation.requestedDate;
        return (
          resDate.getFullYear() === selectedDateFilter.getFullYear() &&
          resDate.getMonth() === selectedDateFilter.getMonth() &&
          resDate.getDate() === selectedDateFilter.getDate()
        );
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const normalizedSearch = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((reservation) => {
        if (reservation.userName?.toLowerCase().includes(normalizedSearch))
          return true;
        if (
          reservation.userPhone
            ?.replace(/-/g, "")
            .includes(normalizedSearch.replace(/-/g, ""))
        )
          return true;
        const vehicleInfo =
          `${reservation.vehicleBrand || ""} ${reservation.vehicleModel || ""} ${reservation.vehicleYear || ""}`.toLowerCase();
        if (vehicleInfo.includes(normalizedSearch)) return true;
        return false;
      });
    }

    // Sort by time
    return filtered.sort((a, b) => {
      const dateA =
        a.requestedDate instanceof Timestamp
          ? a.requestedDate.toDate()
          : a.requestedDate;
      const dateB =
        b.requestedDate instanceof Timestamp
          ? b.requestedDate.toDate()
          : b.requestedDate;
      const timeA = dateA.getHours() * 60 + dateA.getMinutes();
      const timeB = dateB.getHours() * 60 + dateB.getMinutes();
      return timeA - timeB;
    });
  }, [reservations, selectedDateFilter, searchQuery]);

  const getWeekDates = useCallback(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  const handleSelectReservation = useCallback(
    async (reservation: ReservationItem) => {
      try {
        const { collection, query, where, getDocs } = await import(
          "firebase/firestore"
        );
        const { db } = await import("../services/firebase");

        const userDoc = await getDocs(
          query(
            collection(db, "users"),
            where("__name__", "==", reservation.userId)
          )
        );

        if (!userDoc.empty && userDoc.docs[0]) {
          const userData = userDoc.docs[0].data();
          if (isMountedRef.current) {
            setSelectedUser({
              uid: reservation.userId,
              email: userData.email,
              displayName: userData.displayName,
              realName: userData.realName,
              phoneNumber: userData.phoneNumber,
              photoURL: userData.photoURL,
              provider: userData.provider,
            });

            // Auto-fill vehicle info
            if (reservation.vehicleBrand)
              setVehicleBrand(reservation.vehicleBrand);
            if (reservation.vehicleModel)
              setVehicleName(reservation.vehicleModel);
            if (reservation.vehicleYear)
              setVehicleYear(reservation.vehicleYear);

            setInspectionMode("inspection");
          }
        }
      } catch (error) {
        console.error("예약 선택 실패:", error);
        if (isMountedRef.current) {
          Alert.alert("오류", "예약 정보를 불러오는데 실패했습니다.");
        }
      }
    },
    []
  );

  const handleStartManualInspection = useCallback(() => {
    setSelectedUser(null);
    resetAllInspectionData();
    setInspectionMode("inspection");
  }, []);

  const resetAllInspectionData = () => {
    setVehicleBrand("");
    setVehicleName("");
    setVehicleYear("");
    setMileage("");
    setDashboardImageUris([]);
    setDashboardStatus(undefined);
    setDashboardIssueDescription("");
    setVehicleVinImageUris([]);
    setIsVinVerified(undefined);
    setHasNoIllegalModification(undefined);
    setHasNoFloodDamage(undefined);
    setBatteryCellCount(0);
    setBatteryCells([]);
    setDefaultCellVoltage(3.7);
    setNormalChargeCount(0);
    setFastChargeCount(0);
    setBatterySOH("100");
    setDiagnosisInterpretations({
      soh: "",
      cellDefect: "",
      totalCharge: "",
      fastCharge: "",
      fastChargeRatio: "",
      recentErrorCode: "",
    });
    setRecentErrorCodeValue("");
    setOtherInspectionItems([]);
    setVinCheckIssues({
      vinIssue: '',
      modificationIssue: '',
      floodIssue: '',
    });
    setSteeringData({});
    setBrakingData({});
    setElectricalData({});
    setPaintThicknessData([]);
    setTireTreadData([]);
    setVehiclePhotoData({
      overallPhotos: {
        front: undefined,
        leftSide: undefined,
        rear: undefined,
        rightSide: undefined,
      },
      suspensionStructure: {
        driverFrontWheel: undefined,
        driverRearWheel: undefined,
        passengerRearWheel: undefined,
        passengerFrontWheel: undefined,
      },
      undercarriageBattery: {
        front: undefined,
        leftSide: undefined,
        rear: undefined,
        rightSide: undefined,
      },
    });
  };

  // ============================================================================
  // SECTION COMPLETION CALCULATION
  // ============================================================================

  const calculateVehicleInfoCompletion = useCallback((): SectionCompletion => {
    // InputButton 기준으로 개수 세기
    const requiredItems = [
      // 차량 모델 (브랜드, 차량명, 년식)
      vehicleBrand.trim().length > 0 && vehicleName.trim().length > 0 && vehicleYear.trim().length > 0,
      // 계기판 정보 (주행거리, 사진, 상태)
      mileage.trim().length > 0 && dashboardImageUris.length > 0 && dashboardStatus !== undefined,
      // 차대번호 및 상태 확인 (사진, 3가지 확인 항목)
      vehicleVinImageUris.length > 0 &&
      isVinVerified !== undefined &&
      hasNoIllegalModification !== undefined &&
      hasNoFloodDamage !== undefined,
      // 차키 개수
      carKeyCount.trim().length > 0 && parseInt(carKeyCount) > 0,
    ];

    const completedCount = requiredItems.filter(Boolean).length;
    const totalCount = requiredItems.length;
    const isAllRequiredComplete = requiredItems.every(Boolean);

    return {
      completed: completedCount,
      total: totalCount,
      isAllRequiredComplete,
    };
  }, [vehicleBrand, vehicleName, vehicleYear, mileage, dashboardImageUris, dashboardStatus, vehicleVinImageUris, isVinVerified, hasNoIllegalModification, hasNoFloodDamage, carKeyCount]);

  const calculateBatteryInfoCompletion = useCallback((): SectionCompletion => {
    const requiredFields = [
      batteryCellCount > 0,
      batterySOH !== "",
    ];
    const optionalFields = [
      normalChargeCount > 0,
      fastChargeCount > 0,
    ];

    const completedCount =
      requiredFields.filter(Boolean).length +
      optionalFields.filter(Boolean).length;
    const totalCount = requiredFields.length + optionalFields.length;
    const isAllRequiredComplete = requiredFields.every(Boolean);

    return {
      completed: completedCount,
      total: totalCount,
      isAllRequiredComplete,
    };
  }, [
    batteryCellCount,
    batterySOH,
    normalChargeCount,
    fastChargeCount,
  ]);

  const calculateMajorDevicesCompletion = useCallback((): SectionCompletion => {
    const steeringItems = Object.values(steeringData).filter(item => item && item.status !== undefined);
    const brakingItems = Object.values(brakingData).filter(item => item && item.status !== undefined);
    const electricalItems = Object.values(electricalData).filter(item => item && item.status !== undefined);

    const completedCount = (steeringItems.length > 0 ? 1 : 0) + (brakingItems.length > 0 ? 1 : 0) + (electricalItems.length > 0 ? 1 : 0);

    return {
      completed: completedCount,
      total: 3, // 조향 + 제동 + 전기
      isAllRequiredComplete: completedCount > 0, // 최소 1개 이상 입력 필요
    };
  }, [steeringData, brakingData, electricalData]);

  const calculateImagesCompletion = useCallback((): SectionCompletion => {
    const count = otherInspectionItems.length;
    return {
      completed: count,
      total: Math.max(count, 0),
      isAllRequiredComplete: true, // 선택 사항이므로 항상 true
    };
  }, [otherInspectionItems]);

  const isAllRequiredSectionsComplete = useCallback((): boolean => {
    const vehicleInfo = calculateVehicleInfoCompletion();
    const batteryInfo = calculateBatteryInfoCompletion();
    const majorDevices = calculateMajorDevicesCompletion();

    // 자동차 상태: 최소 1개 이상 입력 필요
    const vehicleStatusComplete = (paintThicknessData.length > 0 || tireTreadData.length > 0 || isVehiclePhotoComplete(vehiclePhotoData));

    return (
      vehicleInfo.isAllRequiredComplete &&
      batteryInfo.isAllRequiredComplete &&
      vehicleStatusComplete &&
      majorDevices.completed > 0
    );
  }, [
    calculateVehicleInfoCompletion,
    calculateBatteryInfoCompletion,
    calculateMajorDevicesCompletion,
    paintThicknessData,
    tireTreadData,
    vehiclePhotoData,
  ]);

  // ============================================================================
  // SECTION TOGGLE
  // ============================================================================

  const toggleSection = useCallback(
    (section: InspectionSection) => {
      setExpandedSections((prev) => {
        const isCurrentlyExpanded = prev[section];

        // 현재 열린 섹션을 다시 클릭하면 닫음
        if (isCurrentlyExpanded) {
          const newState: ExpandedSectionsState = {
            vehicleInfo: false,
            vehicleStatus: false,
            batteryInfo: false,
            majorDevices: false,
            diagnosis: false,
            images: false,
          };

          // 모든 섹션 애니메이션을 0으로
          Object.keys(prev).forEach((key) => {
            const sectionKey = key as InspectionSection;
            Animated.timing(accordionAnimations[sectionKey], {
              toValue: 0,
              duration: 300,
              easing: Easing.out(Easing.ease),
              useNativeDriver: false,
            }).start();
          });

          return newState;
        }

        // 모든 섹션 닫고, 선택한 섹션만 열기
        const newState: ExpandedSectionsState = {
          vehicleInfo: false,
          vehicleStatus: false,
          batteryInfo: false,
          majorDevices: false,
          diagnosis: false,
          images: false,
          [section]: true,
        };

        // 애니메이션 실행
        Object.keys(prev).forEach((key) => {
          const sectionKey = key as InspectionSection;
          Animated.timing(accordionAnimations[sectionKey], {
            toValue: newState[sectionKey] ? 1 : 0,
            duration: 300,
            easing: newState[sectionKey] ? Easing.out(Easing.cubic) : Easing.in(Easing.ease),
            useNativeDriver: false,
          }).start();
        });

        return newState;
      });
    },
    [accordionAnimations]
  );

  // ============================================================================
  // IMAGE HANDLING
  // ============================================================================

  // ============================================================================
  // OTHER INSPECTION HANDLING
  // ============================================================================

  const handleAddOtherInspection = useCallback(() => {
    setSelectedOtherInspectionItem(null);
    setIsOtherInspectionModalVisible(true);
  }, []);

  const handleEditOtherInspection = useCallback((item: OtherInspectionItem) => {
    setSelectedOtherInspectionItem(item);
    setIsOtherInspectionModalVisible(true);
  }, []);

  const handleConfirmOtherInspection = useCallback((data: OtherInspectionItem) => {
    if (selectedOtherInspectionItem) {
      // 수정
      setOtherInspectionItems((prev) =>
        prev.map((item) => (item.id === data.id ? data : item))
      );
    } else {
      // 새로 추가
      setOtherInspectionItems((prev) => [...prev, data]);
    }
  }, [selectedOtherInspectionItem]);

  const handleRemoveOtherInspection = useCallback((id: string) => {
    Alert.alert(
      '삭제',
      '이 항목을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setOtherInspectionItems((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ]
    );
  }, []);

  // ============================================================================
  // DIAGNOSIS DETAILS HANDLING
  // ============================================================================

  const handleUpdateDiagnosisInterpretation = useCallback(
    (index: number, value: string) => {
      const keys = [
        "soh",
        "cellDefect",
        "totalCharge",
        "fastCharge",
        "fastChargeRatio",
        "recentErrorCode",
      ] as const;
      const key = keys[index];
      if (key) {
        setDiagnosisInterpretations((prev) => ({ ...prev, [key]: value }));
      }
    },
    []
  );

  const handleUpdateRecentErrorCode = useCallback((value: string) => {
    setRecentErrorCodeValue(value);
  }, []);

  // ============================================================================
  // BATTERY CELL HANDLING
  // ============================================================================

  const handleOpenCellModal = useCallback(() => {
    if (batteryCellCount > 0) {
      setIsCellModalVisible(true);
    } else {
      Alert.alert("알림", "먼저 셀 개수를 입력해주세요.");
    }
  }, [batteryCellCount]);

  const handleCloseCellModal = useCallback(() => {
    setIsCellModalVisible(false);
  }, []);

  const handleDefaultVoltageChange = useCallback((text: string) => {
    // 빈 문자열이면 0
    if (text === "") {
      setDefaultCellVoltage(0);
      return;
    }

    // 숫자와 소수점만 허용
    const filtered = text.replace(/[^0-9.]/g, "");

    // 소수점이 여러 개면 첫 번째만 유지
    const parts = filtered.split(".");
    const validText =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : filtered;

    // 유효한 숫자로 변환
    const numValue = parseFloat(validText);
    setDefaultCellVoltage(isNaN(numValue) ? 0 : numValue);
  }, []);

  const handleCellsUpdate = useCallback((updatedCells: BatteryCell[]) => {
    setBatteryCells(updatedCells);
  }, []);

  // ============================================================================
  // SUBMIT INSPECTION REPORT
  // ============================================================================

  const handleSubmitInspectionReport = useCallback(async () => {
    if (!isAllRequiredSectionsComplete()) {
      Alert.alert(
        "필수 항목 미완료",
        "모든 필수 항목을 완료해주세요.\n\n필수 섹션:\n• 차량 기본 정보\n• 차대번호 및 상태 확인\n• 배터리 정보 (셀 개수)",
        [{ text: "확인" }]
      );
      return;
    }

    if (!selectedUser) {
      Alert.alert("오류", "사용자 정보가 없습니다.");
      return;
    }

    Alert.alert("점검 보고서 제출", "점검 보고서를 제출하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "제출",
        onPress: async () => {
          setIsSubmittingReport(true);
          setUploadProgress(0);

          try {
            // Sentry: 업로드 시작 로그
            sentryLogger.logDiagnosisReportUploadStart(
              selectedUser.uid,
              {
                brand: vehicleBrand,
                name: vehicleName,
                year: vehicleYear,
              }
            );

            // 1. 먼저 reportId 생성
            const reportId = firebaseService.generateReportId();
            setUploadProgress(5);

            // 2. 차대번호 이미지들 업로드
            let uploadedVinImageUrls: string[] = [];
            if (vehicleVinImageUris.length > 0) {
              for (let i = 0; i < vehicleVinImageUris.length; i++) {
                const imageUri = vehicleVinImageUris[i];
                if (imageUri) {
                  const uploadedUrl = await firebaseService.uploadReportImage(
                    imageUri,
                    reportId,
                    `vin_${i + 1}`
                  );
                  uploadedVinImageUrls.push(uploadedUrl);
                }
              }
              setUploadProgress(10);
            }

            // 3. 계기판 이미지들 업로드
            let uploadedDashboardImageUrls: string[] = [];
            if (dashboardImageUris.length > 0) {
              for (let i = 0; i < dashboardImageUris.length; i++) {
                const imageUri = dashboardImageUris[i];
                if (imageUri) {
                  const uploadedUrl = await firebaseService.uploadReportImage(
                    imageUri,
                    reportId,
                    `dashboard_${i + 1}`
                  );
                  uploadedDashboardImageUrls.push(uploadedUrl);
                }
              }
              setUploadProgress(20);
            }

            // 4. 기타 항목 이미지들 업로드
            const uploadedOtherInspectionItems: OtherInspectionItem[] = [];
            if (otherInspectionItems.length > 0) {
              for (let itemIndex = 0; itemIndex < otherInspectionItems.length; itemIndex++) {
                const item = otherInspectionItems[itemIndex];
                if (!item) continue;

                const uploadedImageUrls: string[] = [];

                for (let imgIndex = 0; imgIndex < item.imageUris.length; imgIndex++) {
                  const imageUri = item.imageUris[imgIndex];
                  if (imageUri) {
                    const uploadedUrl = await firebaseService.uploadReportImage(
                      imageUri,
                      reportId,
                      `other_${itemIndex + 1}_${imgIndex + 1}`
                    );
                    uploadedImageUrls.push(uploadedUrl);
                  }
                }

                uploadedOtherInspectionItems.push({
                  id: item.id,
                  category: item.category,
                  description: item.description,
                  imageUris: uploadedImageUrls,
                });

                const progress = 25 + ((itemIndex + 1) / otherInspectionItems.length) * 55;
                setUploadProgress(progress);
              }
            }

            setUploadProgress(85);

            // Prepare report data
            const reportData: Omit<
              VehicleDiagnosisReport,
              "id" | "createdAt" | "updatedAt"
            > = {
              reservationId: null,
              userId: selectedUser.uid,
              userName:
                selectedUser.realName ||
                selectedUser.displayName ||
                "이름 없음",
              userPhone: selectedUser.phoneNumber || "",
              vehicleBrand,
              vehicleName,
              vehicleGrade: vehicleGrade || undefined, // 등급/트림 (옵셔널)
              vehicleYear,
              vehicleVinImageUris: uploadedVinImageUrls,
              mileage: parseInt(mileage) || 0,
              dashboardImageUris: uploadedDashboardImageUrls,
              dashboardStatus,
              dashboardIssueDescription: dashboardStatus === 'problem' ? dashboardIssueDescription : undefined,
              isVinVerified,
              hasNoIllegalModification,
              hasNoFloodDamage,
              carKeyCount: parseInt(carKeyCount) || 0,
              diagnosisDate: new Date(),
              cellCount: batteryCellCount,
              defectiveCellCount,
              normalChargeCount,
              fastChargeCount,
              sohPercentage: batterySOH !== "" ? parseFloat(batterySOH) : 0,
              maxVoltage: maxCellVoltage,
              minVoltage: minCellVoltage,
              cellsData: batteryCells.map(cell => ({
                ...cell,
                voltage: typeof cell.voltage === 'string' ? parseFloat(cell.voltage || '0') : (cell.voltage || 0),
              })),
              diagnosisDetails: [], // 세부 진단 결과 탭 제거로 빈 배열
              comprehensiveInspection: {
                paintThickness: paintThicknessData.length > 0 ? paintThicknessData : undefined,
                tireTread: tireTreadData.length > 0 ? tireTreadData : undefined,
                vehiclePhotos: isVehiclePhotoComplete(vehiclePhotoData) ? vehiclePhotoData : undefined,
                otherInspection: uploadedOtherInspectionItems.length > 0 ? uploadedOtherInspectionItems : undefined,
              },
              majorDevicesInspection: {
                steering: steeringData,
                braking: brakingData,
                electrical: electricalData,
              },
              status: "pending_review", // 검수 대기 상태
            };

            setUploadProgress(90);

            // Save to Firestore
            await firebaseService.createVehicleDiagnosisReport(reportId, reportData);

            setUploadProgress(100);

            // Sentry: 업로드 성공 로그
            sentryLogger.logDiagnosisReportUploadSuccess(
              selectedUser.uid,
              reportId,
              {
                brand: vehicleBrand,
                name: vehicleName,
                year: vehicleYear,
              },
              {
                cellCount: batteryCellCount,
                defectiveCellCount,
                sohPercentage: batterySOH !== "" ? parseFloat(batterySOH) : 0,
                mileage: parseInt(mileage) || undefined,
              }
            );

            Alert.alert(
              "제출 완료",
              "점검 보고서가 성공적으로 제출되었습니다.",
              [
                {
                  text: "확인",
                  onPress: () => {
                    setInspectionMode("reservation_list");
                    resetAllInspectionData();
                    navigation.goBack();
                  },
                },
              ]
            );
          } catch (error) {
            console.error("보고서 제출 실패:", error);

            // Sentry: 업로드 에러 로그
            sentryLogger.logDiagnosisReportUploadError(
              selectedUser.uid,
              error instanceof Error ? error : new Error(String(error)),
              {
                brand: vehicleBrand,
                name: vehicleName,
                year: vehicleYear,
              },
              "차량 진단 리포트 업로드 중 오류 발생"
            );

            Alert.alert(
              "제출 실패",
              "보고서 제출 중 오류가 발생했습니다. 다시 시도해주세요."
            );
          } finally {
            if (isMountedRef.current) {
              setIsSubmittingReport(false);
              setUploadProgress(0);
            }
          }
        },
      },
    ]);
  }, [
    isAllRequiredSectionsComplete,
    selectedUser,
    vehicleBrand,
    vehicleName,
    vehicleYear,
    vehicleVinImageUris,
    mileage,
    dashboardImageUris,
    dashboardStatus,
    dashboardIssueDescription,
    isVinVerified,
    hasNoIllegalModification,
    hasNoFloodDamage,
    carKeyCount,
    batteryCellCount,
    defectiveCellCount,
    normalChargeCount,
    fastChargeCount,
    batterySOH,
    maxCellVoltage,
    minCellVoltage,
    diagnosisDetails,
    otherInspectionItems,
    navigation,
  ]);

  // ============================================================================
  // RENDER - Reservation List
  // ============================================================================

  const renderReservationList = () => {
    const filteredReservations = getFilteredReservations();

    return (
      <View style={styles.reservationListContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Date Filter Chips */}
        <View style={styles.dateFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateFilterChips}
          >
            <TouchableOpacity
              style={[
                styles.dateChip,
                selectedDateFilter === null && styles.dateChipActive,
              ]}
              onPress={() => setSelectedDateFilter(null)}
            >
              <Text
                style={[
                  styles.dateChipText,
                  selectedDateFilter === null && styles.dateChipTextActive,
                ]}
              >
                전체
              </Text>
            </TouchableOpacity>
            {getWeekDates().map((date, index) => {
              const isSelected =
                selectedDateFilter?.getTime() === date.getTime();
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateChip, isSelected && styles.dateChipActive]}
                  onPress={() => setSelectedDateFilter(date)}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      isSelected && styles.dateChipTextActive,
                    ]}
                  >
                    {isToday
                      ? "오늘"
                      : `${date.getMonth() + 1}/${date.getDate()}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Reservation List */}
        {isLoadingReservations ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#06B6D4" />
          </View>
        ) : (
          <FlatList<ReservationItem>
            data={filteredReservations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.reservationList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>
                  {searchQuery
                    ? "검색 결과 없음"
                    : selectedDateFilter
                      ? "예약 없음"
                      : "오늘 예약 없음"}
                </Text>
              </View>
            }
            renderItem={({ item: reservation }) => {
              const date =
                reservation.requestedDate instanceof Timestamp
                  ? reservation.requestedDate.toDate()
                  : reservation.requestedDate;
              const timeString = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

              return (
                <TouchableOpacity
                  style={styles.reservationCard}
                  onPress={() => handleSelectReservation(reservation)}
                  activeOpacity={0.7}
                >
                  <View style={styles.reservationCardContent}>
                    <View style={styles.reservationInfoRow}>
                      <Text style={styles.reservationLabel}>시간</Text>
                      <Text style={styles.reservationValue}>{timeString}</Text>
                    </View>
                    <View style={styles.reservationInfoRow}>
                      <Text style={styles.reservationLabel}>이름</Text>
                      <Text style={styles.reservationValue}>
                        {reservation.userName || "이름 없음"}
                      </Text>
                    </View>
                    <View style={styles.reservationInfoRow}>
                      <Text style={styles.reservationLabel}>전화</Text>
                      <Text style={styles.reservationValue}>
                        {reservation.userPhone}
                      </Text>
                    </View>
                    {reservation.vehicleBrand && (
                      <View style={styles.reservationInfoRow}>
                        <Text style={styles.reservationLabel}>차량</Text>
                        <Text style={styles.reservationValue}>
                          {reservation.vehicleBrand} {reservation.vehicleModel}{" "}
                          '{reservation.vehicleYear?.slice(-2)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* FAB - Manual Inspection */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleStartManualInspection}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================================================
  // RENDER - Accordion Section Header
  // ============================================================================

  const renderSectionHeader = (
    title: string,
    section: InspectionSection,
    completion: SectionCompletion,
    isRequired: boolean
  ) => {
    const isExpanded = expandedSections[section];
    const { completed, total, isAllRequiredComplete } = completion;

    return (
      <TouchableOpacity
        style={[
          styles.sectionHeader,
          isExpanded && styles.sectionHeaderExpanded,
          isRequired &&
            !isAllRequiredComplete &&
            styles.sectionHeaderIncomplete,
        ]}
        onPress={() => toggleSection(section)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons
            name={isExpanded ? "chevron-down" : "chevron-forward"}
            size={20}
            color={isAllRequiredComplete ? "#10B981" : "#6B7280"}
          />
          <Text style={styles.sectionTitle}>{title}</Text>
          {isRequired && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>필수</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeaderRight}>
          {section === 'images' ? (
            <Text
              style={[
                styles.sectionProgress,
                styles.sectionProgressIncomplete,
              ]}
            >
              선택
            </Text>
          ) : (
            <>
              <Text
                style={[
                  styles.sectionProgress,
                  isAllRequiredComplete
                    ? styles.sectionProgressComplete
                    : styles.sectionProgressIncomplete,
                ]}
              >
                {completed}/{total}
              </Text>
              {isAllRequiredComplete && (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================================================
  // RENDER - Section 1: Vehicle Basic Information
  // ============================================================================

  const renderVehicleInfoSection = () => {
    const animatedHeight = accordionAnimations.vehicleInfo.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1000], // 최대 높이
    });

    const animatedOpacity = accordionAnimations.vehicleInfo.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    if (!expandedSections.vehicleInfo) return null;

    return (
      <Animated.View
        style={[
          styles.sectionContent,
          {
            maxHeight: animatedHeight,
            opacity: animatedOpacity,
            overflow: "hidden",
          },
        ]}
      >
        <View style={styles.inputButtonGroup}>
          {/* 차량 모델 * */}
          <InputButton
            label="차량 모델 *"
            isCompleted={!!(vehicleBrand && vehicleName && vehicleYear)}
            onPress={() => setIsVehicleModelModalVisible(true)}
            value={
              vehicleBrand && vehicleName && vehicleYear
                ? `${vehicleBrand} ${vehicleName}${vehicleGrade ? ` ${vehicleGrade}` : ''} (${vehicleYear})`
                : undefined
            }
          />

          {/* 계기판 정보 * */}
          <InputButton
            label="계기판 정보 *"
            isCompleted={!!(mileage && dashboardImageUris.length > 0 && dashboardStatus)}
            onPress={() => setIsDashboardInfoModalVisible(true)}
            value={
              mileage && dashboardStatus
                ? `${mileage}km, ${dashboardStatus === 'good' ? '양호' : '문제 있음'}`
                : undefined
            }
          />

          {/* 차대번호 및 상태 확인 * */}
          <InputButton
            label="차대번호 및 상태 확인 *"
            isCompleted={!!(
              vehicleVinImageUris.length > 0 &&
              isVinVerified !== undefined &&
              hasNoIllegalModification !== undefined &&
              hasNoFloodDamage !== undefined
            )}
            onPress={() => setIsVinCheckModalVisible(true)}
            value={
              isVinVerified !== undefined && hasNoIllegalModification !== undefined && hasNoFloodDamage !== undefined
                ? (() => {
                    const problemCount = [
                      !isVinVerified,
                      !hasNoIllegalModification,
                      !hasNoFloodDamage,
                    ].filter(Boolean).length;
                    return problemCount === 0 ? '양호' : `문제 ${problemCount}개`;
                  })()
                : undefined
            }
          />

          {/* 차키 개수 */}
          <View style={[
            styles.carKeyCountContainer,
            carKeyCount && parseInt(carKeyCount) > 0 && styles.carKeyCountContainerCompleted
          ]}>
            <Text style={[
              styles.carKeyCountLabel,
              carKeyCount && parseInt(carKeyCount) > 0 && styles.carKeyCountLabelCompleted
            ]}>
              차키 수 *
            </Text>
            <View style={styles.carKeyCountInputRow}>
              <Text style={styles.carKeyCountText}>총</Text>
              <TouchableOpacity
                style={styles.carKeyCountButton}
                onPress={() => {
                  const currentValue = parseInt(carKeyCount || '0');
                  if (currentValue > 0) {
                    setCarKeyCount((currentValue - 1).toString());
                  }
                }}
              >
                <Text style={styles.carKeyCountButtonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.carKeyCountInput}
                value={carKeyCount}
                onChangeText={(text) => {
                  // 숫자만 입력 가능
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setCarKeyCount(numericValue);
                }}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.carKeyCountButton}
                onPress={() => {
                  const currentValue = parseInt(carKeyCount || '0');
                  setCarKeyCount((currentValue + 1).toString());
                }}
              >
                <Text style={styles.carKeyCountButtonText}>+</Text>
              </TouchableOpacity>
              <Text style={styles.carKeyCountText}>개</Text>
            </View>
          </View>
        </View>

        {/* 차량 모델 선택 모달 */}
        <VehicleModelBottomSheet
          visible={isVehicleModelModalVisible}
          onClose={() => setIsVehicleModelModalVisible(false)}
          onConfirm={(brand, model, grade, year) => {
            setVehicleBrand(brand);
            setVehicleName(model);
            setVehicleGrade(grade);
            setVehicleYear(year);
          }}
          initialBrand={vehicleBrand}
          initialModel={vehicleName}
          initialGrade={vehicleGrade}
          initialYear={vehicleYear}
        />

        {/* 계기판 정보 모달 */}
        <DashboardInfoBottomSheet
          visible={isDashboardInfoModalVisible}
          onClose={() => setIsDashboardInfoModalVisible(false)}
          onConfirm={(mileageValue, imageUris, status, issueDescription) => {
            setMileage(mileageValue);
            setDashboardImageUris(imageUris);
            setDashboardStatus(status);
            setDashboardIssueDescription(issueDescription || '');
          }}
          initialMileage={mileage}
          initialImageUris={dashboardImageUris}
          initialStatus={dashboardStatus}
          initialIssueDescription={dashboardIssueDescription}
        />

        {/* 차대번호 및 상태 확인 모달 */}
        <VinCheckBottomSheet
          visible={isVinCheckModalVisible}
          onClose={() => setIsVinCheckModalVisible(false)}
          onConfirm={(imageUris, vinVerified, noIllegalMod, noFlood, issues) => {
            setVehicleVinImageUris(imageUris);
            setIsVinVerified(vinVerified);
            setHasNoIllegalModification(noIllegalMod);
            setHasNoFloodDamage(noFlood);
            setVinCheckIssues({
              vinIssue: issues.vinIssue || '',
              modificationIssue: issues.modificationIssue || '',
              floodIssue: issues.floodIssue || '',
            });
          }}
          initialImageUris={vehicleVinImageUris}
          initialIsVinVerified={isVinVerified}
          initialHasNoIllegalModification={hasNoIllegalModification}
          initialHasNoFloodDamage={hasNoFloodDamage}
          initialVinIssue={vinCheckIssues.vinIssue}
          initialModificationIssue={vinCheckIssues.modificationIssue}
          initialFloodIssue={vinCheckIssues.floodIssue}
        />
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER - Section 2: Vehicle Status
  // ============================================================================

  const renderVehicleStatusSection = () => {
    const animatedHeight = accordionAnimations.vehicleStatus.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 500], // 최대 높이
    });

    const animatedOpacity = accordionAnimations.vehicleStatus.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    if (!expandedSections.vehicleStatus) return null;

    return (
      <Animated.View
        style={[
          styles.sectionContent,
          {
            maxHeight: animatedHeight,
            opacity: animatedOpacity,
            overflow: "hidden",
          },
        ]}
      >
        <View style={styles.inputButtonGroup}>
          {/* 전체 사진 촬영 - 차량 사진 (가장 위로) */}
          <InputButton
            label="전체 사진 촬영"
            isCompleted={isVehiclePhotoComplete(vehiclePhotoData)}
            onPress={() => setIsVehiclePhotoModalVisible(true)}
            value={
              isVehiclePhotoComplete(vehiclePhotoData)
                ? `${getVehiclePhotoCount(vehiclePhotoData)}/12 장 촬영`
                : undefined
            }
          />

          {/* 외판 도막 두께 측정 */}
          <InputButton
            label="외판 도막 두께 측정"
            isCompleted={paintThicknessData.length > 0}
            onPress={() => setIsPaintThicknessModalVisible(true)}
            value={
              paintThicknessData.length > 0
                ? `${paintThicknessData.length}개 부위 측정`
                : undefined
            }
          />

          {/* 타이어 트레드 깊이 */}
          <InputButton
            label="타이어 트레드 깊이"
            isCompleted={tireTreadData.length > 0}
            onPress={() => setIsTireTreadModalVisible(true)}
            value={
              tireTreadData.length > 0
                ? `${tireTreadData.length}개 타이어 측정`
                : undefined
            }
          />
        </View>

        {/* 외판 도막 두께 측정 모달 */}
        <PaintThicknessBottomSheet
          visible={isPaintThicknessModalVisible}
          onClose={() => setIsPaintThicknessModalVisible(false)}
          onConfirm={(data) => setPaintThicknessData(data)}
          initialData={paintThicknessData}
        />

        {/* 타이어 트레드 깊이 모달 */}
        <TireTreadBottomSheet
          visible={isTireTreadModalVisible}
          onClose={() => setIsTireTreadModalVisible(false)}
          onConfirm={(data) => setTireTreadData(data)}
          initialData={tireTreadData}
        />

        {/* 차량 사진 모달 */}
        <VehiclePhotoBottomSheet
          visible={isVehiclePhotoModalVisible}
          onClose={() => setIsVehiclePhotoModalVisible(false)}
          onConfirm={(data) => setVehiclePhotoData(data)}
          initialData={vehiclePhotoData}
        />
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER - Section 3: Major Devices Modals
  // ============================================================================

  const renderMajorDevicesModals = () => {
    const steeringItems = [
      { key: 'powerSteeringOilLeak', label: '동력조향 작동 오일 누유' },
      { key: 'steeringGear', label: '스티어링 기어' },
      { key: 'steeringPump', label: '스티어링 펌프' },
      { key: 'tierodEndBallJoint', label: '타이로드엔드 및 볼 조인트' },
    ];

    const brakingItems = [
      { key: 'brakeOilLevel', label: '브레이크 오일 유량 상태' },
      { key: 'brakeOilLeak', label: '브레이크 오일 누유' },
      { key: 'boosterCondition', label: '배력장치 상태' },
    ];

    const electricalItems = [
      { key: 'generatorOutput', label: '발전기 출력' },
      { key: 'startMotor', label: '시동 모터' },
      { key: 'wiperMotor', label: '와이퍼 모터 기능' },
      { key: 'blowerMotor', label: '실내송풍 모터' },
      { key: 'radiatorFanMotor', label: '라디에이터 팬 모터' },
    ];

    return (
      <>
        <MajorDeviceBottomSheet
          visible={isSteeringModalVisible}
          onClose={() => setIsSteeringModalVisible(false)}
          title="조향 검사"
          items={steeringItems}
          onConfirm={(data) => {
            setSteeringData(data);
          }}
          initialData={steeringData}
        />

        <MajorDeviceBottomSheet
          visible={isBrakingModalVisible}
          onClose={() => setIsBrakingModalVisible(false)}
          title="제동 검사"
          items={brakingItems}
          onConfirm={(data) => {
            setBrakingData(data);
          }}
          initialData={brakingData}
        />

        <MajorDeviceBottomSheet
          visible={isElectricalModalVisible}
          onClose={() => setIsElectricalModalVisible(false)}
          title="전기 검사"
          items={electricalItems}
          onConfirm={(data) => {
            setElectricalData(data);
          }}
          initialData={electricalData}
        />
      </>
    );
  };

  // ============================================================================
  // RENDER - Section 2: Battery Information
  // ============================================================================

  const renderBatteryInfoSection = () => {
    const animatedHeight = accordionAnimations.batteryInfo.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1200],
    });

    const animatedOpacity = accordionAnimations.batteryInfo.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    if (!expandedSections.batteryInfo) return null;

    return (
      <Animated.View
        style={[
          styles.sectionContent,
          {
            maxHeight: animatedHeight,
            opacity: animatedOpacity,
            overflow: "hidden",
          },
        ]}
      >
        <View style={styles.batteryInfoContainer}>
          {/* 1. SOH * */}
          <View style={styles.batteryInputGroup}>
            <Text style={styles.inputLabel}>SOH (%) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="100"
              placeholderTextColor="#9CA3AF"
              value={batterySOH}
              onChangeText={(text) => {
                if (text === "") {
                  setBatterySOH("");
                  return;
                }
                // 숫자와 소수점만 허용
                const filtered = text.replace(/[^0-9.]/g, "");
                // 소수점이 여러 개면 첫 번째만 유지
                const parts = filtered.split(".");
                const validText = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : filtered;
                setBatterySOH(validText);
              }}
              keyboardType="default"
            />
          </View>

          {/* 3. 셀 개수 * */}
          <View style={styles.batteryInputGroup}>
            <Text style={styles.inputLabel}>셀 개수 *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              value={batteryCellCount === 0 ? "" : batteryCellCount.toString()}
              onChangeText={(text) =>
                setBatteryCellCount(text === "" ? 0 : parseInt(text) || 0)
              }
              keyboardType="numeric"
            />
          </View>

          {/* 4. 배터리 셀 관리 버튼 (셀 개수 > 0일 때만 표시) */}
          {batteryCellCount > 0 && (
            <TouchableOpacity
              style={styles.cellManagementButton}
              onPress={handleOpenCellModal}
              activeOpacity={0.7}
            >
              <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
              <Text style={styles.cellManagementButtonText}>배터리 셀 관리</Text>
              <Text style={styles.cellManagementButtonSubtext}>
                ({batteryCells.length}개 셀)
              </Text>
            </TouchableOpacity>
          )}

          {/* 5. 불량 셀 개수 (자동 계산 - 읽기 전용) */}
          <View style={styles.batteryInputGroup}>
            <Text style={styles.inputLabel}>불량 셀 개수</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{defectiveCellCount}개</Text>
            </View>
          </View>

          {/* 2. 전압 정보 (자동 계산 - 읽기 전용) */}
          <View style={[styles.inputRow, { marginBottom: 0 }]}>
            <View style={[styles.batteryInputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>최대 전압 (V)</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>
                  {maxCellVoltage > 0 ? maxCellVoltage.toFixed(2) : "0.00"}
                </Text>
              </View>
            </View>

            <View style={styles.inputRowSpacer} />

            <View style={[styles.batteryInputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>최소 전압 (V)</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>
                  {minCellVoltage > 0 ? minCellVoltage.toFixed(2) : "0.00"}
                </Text>
              </View>
            </View>
          </View>

          {/* 6. 충전 횟수 Row */}
          <View style={[styles.inputRow, { marginBottom: 0 }]}>
            <View style={[styles.batteryInputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>일반 충전</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0회"
                placeholderTextColor="#9CA3AF"
                value={
                  normalChargeCount === 0 ? "" : normalChargeCount.toString()
                }
                onChangeText={(text) =>
                  setNormalChargeCount(text === "" ? 0 : parseInt(text) || 0)
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputRowSpacer} />

            <View style={[styles.batteryInputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>급속 충전</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0회"
                placeholderTextColor="#9CA3AF"
                value={fastChargeCount === 0 ? "" : fastChargeCount.toString()}
                onChangeText={(text) =>
                  setFastChargeCount(text === "" ? 0 : parseInt(text) || 0)
                }
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER - Section 3: Major Devices
  // ============================================================================

  const renderMajorDevicesSection = () => {
    const animatedHeight = accordionAnimations.majorDevices.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 500],
    });

    const animatedOpacity = accordionAnimations.majorDevices.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    if (!expandedSections.majorDevices) {
      return null;
    }

    const getSteeringValue = () => {
      const count = Object.values(steeringData).filter(item => item && item.status !== undefined).length;
      return count > 0 ? `${count}/4 입력됨` : undefined;
    };

    const getBrakingValue = () => {
      const count = Object.values(brakingData).filter(item => item && item.status !== undefined).length;
      return count > 0 ? `${count}/3 입력됨` : undefined;
    };

    const getElectricalValue = () => {
      const count = Object.values(electricalData).filter(item => item && item.status !== undefined).length;
      return count > 0 ? `${count}/5 입력됨` : undefined;
    };

    return (
      <Animated.View
        style={[
          styles.sectionContent,
          {
            maxHeight: animatedHeight,
            opacity: animatedOpacity,
            overflow: "hidden",
          },
        ]}
      >
        <View style={styles.inputButtonGroup}>
          <InputButton
            label="조향"
            isCompleted={getSteeringValue() !== undefined}
            onPress={() => setIsSteeringModalVisible(true)}
            value={getSteeringValue()}
          />

          <InputButton
            label="제동"
            isCompleted={getBrakingValue() !== undefined}
            onPress={() => setIsBrakingModalVisible(true)}
            value={getBrakingValue()}
          />

          <InputButton
            label="전기"
            isCompleted={getElectricalValue() !== undefined}
            onPress={() => setIsElectricalModalVisible(true)}
            value={getElectricalValue()}
          />
        </View>
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER - Section 4: 기타 (Inspection Images)
  // ============================================================================

  const renderImagesSection = () => {
    const animatedHeight = accordionAnimations.images.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1500],
    });

    const animatedOpacity = accordionAnimations.images.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    if (!expandedSections.images) return null;

    return (
      <Animated.View
        style={[
          styles.sectionContent,
          {
            maxHeight: animatedHeight,
            opacity: animatedOpacity,
            overflow: "hidden",
          },
        ]}
      >
        {/* 추가 버튼 */}
        <TouchableOpacity
          style={styles.otherAddButton}
          onPress={handleAddOtherInspection}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={24} color="#06B6D4" />
          <Text style={styles.otherAddButtonText}>항목 추가</Text>
        </TouchableOpacity>

        {/* 기타 항목 리스트 */}
        {otherInspectionItems.length > 0 ? (
          <View style={styles.otherItemsList}>
            {otherInspectionItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.otherItemCard}
                onPress={() => handleEditOtherInspection(item)}
                activeOpacity={0.7}
              >
                <View style={styles.otherItemHeader}>
                  <Text style={styles.otherItemCategory}>
                    {item.category || '카테고리 없음'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveOtherInspection(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                {item.description && (
                  <Text style={styles.otherItemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                {item.imageUris.length > 0 && (
                  <Text style={styles.otherItemImageCount}>
                    이미지 {item.imageUris.length}장
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyOtherState}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyOtherStateText}>
              추가 버튼을 눌러 항목을 추가해주세요
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER - Inspection Checklist
  // ============================================================================

  const renderInspectionChecklist = () => {
    const vehicleInfoCompletion = calculateVehicleInfoCompletion();
    const batteryInfoCompletion = calculateBatteryInfoCompletion();
    const majorDevicesCompletion = calculateMajorDevicesCompletion();
    const imagesCompletion = calculateImagesCompletion();

    return (
      <View style={styles.inspectionContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Vehicle Basic Information */}
          <View style={styles.accordionSection}>
            {renderSectionHeader(
              "차량 기본 정보",
              "vehicleInfo",
              vehicleInfoCompletion,
              true
            )}
            {renderVehicleInfoSection()}
          </View>

          {/* Section 2: Battery Information */}
          <View style={styles.accordionSection}>
            {renderSectionHeader(
              "배터리 정보",
              "batteryInfo",
              batteryInfoCompletion,
              true
            )}
            {renderBatteryInfoSection()}
          </View>

          {/* Section 3: Vehicle Status */}
          <View style={styles.accordionSection}>
            {renderSectionHeader(
              "자동차 상태",
              "vehicleStatus",
              {
                completed: (paintThicknessData.length > 0 ? 1 : 0) + (tireTreadData.length > 0 ? 1 : 0) + (isVehiclePhotoComplete(vehiclePhotoData) ? 1 : 0),
                total: 3,
                isAllRequiredComplete: (paintThicknessData.length > 0 || tireTreadData.length > 0 || isVehiclePhotoComplete(vehiclePhotoData)) // 최소 1개 이상 입력 필요
              },
              true
            )}
            {renderVehicleStatusSection()}
          </View>

          {/* Section 4: Major Devices */}
          <View style={styles.accordionSection}>
            {renderSectionHeader(
              "주요 장치",
              "majorDevices",
              majorDevicesCompletion,
              true
            )}
            {renderMajorDevicesSection()}
          </View>

          {/* Section 5: 기타 (이미지 + 텍스트) */}
          <View style={styles.accordionSection}>
            {renderSectionHeader(
              "기타",
              "images",
              imagesCompletion,
              false
            )}
            {renderImagesSection()}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.submitButtonContainer, { paddingBottom: insets.bottom + scale(2) }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmittingReport && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitInspectionReport}
            disabled={isSubmittingReport}
          >
            {isSubmittingReport ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                {uploadProgress > 0 && (
                  <Text style={styles.submitButtonText}>
                    {uploadProgress.toFixed(0)}% 업로드 중...
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.submitButtonText}>점검 보고서 제출</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (inspectionMode === "inspection") {
              Alert.alert(
                "점검 취소",
                "진행 중인 점검을 취소하시겠습니까?\n입력한 내용이 모두 사라집니다.",
                [
                  { text: "계속 작업", style: "cancel" },
                  {
                    text: "취소",
                    style: "destructive",
                    onPress: () => {
                      setInspectionMode("reservation_list");
                      resetAllInspectionData();
                    },
                  },
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>차량 점검</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {inspectionMode === "reservation_list"
        ? renderReservationList()
        : renderInspectionChecklist()}

      {/* Battery Cell Modal */}
      <BatteryCellGridModal
        visible={isCellModalVisible}
        cells={batteryCells}
        defaultVoltage={defaultCellVoltage}
        defectiveCellCount={defectiveCellCount}
        maxCellVoltage={maxCellVoltage}
        minCellVoltage={minCellVoltage}
        onClose={handleCloseCellModal}
        onCellsUpdate={handleCellsUpdate}
        onDefaultVoltageChange={handleDefaultVoltageChange}
      />

      {/* Major Devices Modal */}
      {renderMajorDevicesModals()}

      {/* Other Inspection Modal */}
      <OtherInspectionBottomSheet
        visible={isOtherInspectionModalVisible}
        onClose={() => {
          setIsOtherInspectionModalVisible(false);
          setSelectedOtherInspectionItem(null);
        }}
        onConfirm={handleConfirmOtherInspection}
        initialData={selectedOtherInspectionItem}
      />
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#1F2937",
  },

  // Reservation List
  reservationListContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    gap: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: "#1F2937",
  },
  dateFilterContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dateFilterChips: {
    gap: scale(8),
  },
  dateChip: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(14),
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateChipActive: {
    backgroundColor: "#06B6D4",
    borderColor: "#06B6D4",
  },
  dateChipText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#6B7280",
  },
  dateChipTextActive: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(60),
  },
  reservationList: {
    padding: scale(16),
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(60),
  },
  emptyStateText: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    marginTop: verticalScale(12),
  },
  reservationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: scale(16),
    marginBottom: verticalScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reservationCardContent: {
    flex: 1,
  },
  reservationInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },
  reservationLabel: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#6B7280",
    width: scale(44),
  },
  reservationValue: {
    fontSize: moderateScale(14),
    color: "#1F2937",
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: scale(20),
    bottom: scale(20),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: "#06B6D4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Inspection Container
  inspectionContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(16),
  },

  // Accordion Section
  accordionSection: {
    marginBottom: verticalScale(12),
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    backgroundColor: "#FFFFFF",
  },
  sectionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionHeaderIncomplete: {
    backgroundColor: "#FEF2F2",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    flex: 1,
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: "#1F2937",
  },
  requiredBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    backgroundColor: "#FEE2E2",
    borderRadius: 4,
  },
  requiredBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#DC2626",
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  sectionProgress: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  sectionProgressComplete: {
    color: "#10B981",
  },
  sectionProgressIncomplete: {
    color: "#6B7280",
  },

  // Section Content
  sectionContent: {
    padding: scale(16),
  },
  inputGroup: {
    marginBottom: verticalScale(16),
  },
  inputButtonGroup: {
    gap: scale(16),
  },
  batteryInfoContainer: {
    gap: scale(16),
  },
  batteryInputGroup: {
    // marginBottom 없음 - gap으로 처리
  },
  inputLabel: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#374151",
    marginBottom: verticalScale(6),
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(14),
    color: "#1F2937",
  },
  textInputMultiline: {
    height: verticalScale(80),
    textAlignVertical: "top",
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: verticalScale(16),
  },
  inputRowSpacer: {
    width: scale(12),
  },

  // Checkboxes
  checkboxGroup: {
    gap: verticalScale(12),
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  checkbox: {
    width: scale(22),
    height: scale(22),
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  checkboxLabel: {
    fontSize: moderateScale(14),
    color: "#1F2937",
  },

  // Subsection
  subsectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#1F2937",
    marginTop: verticalScale(8),
    marginBottom: verticalScale(12),
  },

  // Diagnosis Cards
  diagnosisCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: scale(12),
    marginBottom: verticalScale(12),
  },
  diagnosisCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  diagnosisCardTitle: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#6B7280",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(12),
    borderWidth: 1,
    borderColor: "#06B6D4",
    borderRadius: 8,
    borderStyle: "dashed",
    gap: scale(6),
  },
  addButtonText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#06B6D4",
  },

  // Images
  imageButtonsRow: {
    flexDirection: "row",
    marginBottom: verticalScale(16),
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(12),
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    gap: scale(6),
  },
  imageButtonText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#06B6D4",
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(12),
  },
  imageCard: {
    width: (scale(375) - scale(32) - scale(24)) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  imagePreview: {
    width: "100%",
    height: verticalScale(120),
  },
  imageRemoveButton: {
    position: "absolute",
    top: scale(8),
    right: scale(8),
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  imageMetaInputs: {
    padding: scale(8),
    gap: verticalScale(6),
  },
  imageMetaInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(6),
    fontSize: moderateScale(12),
    color: "#1F2937",
  },
  emptyImagesState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(40),
  },
  emptyImagesStateText: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    marginTop: verticalScale(8),
  },

  // Submit Button
  submitButtonContainer: {
    paddingTop: scale(16),
    paddingHorizontal: scale(16),
    backgroundColor: "transparent",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#06B6D4",
    borderRadius: 12,
    paddingVertical: verticalScale(14),
    gap: scale(8),
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Read-only Input (자동 계산 값 표시용)
  readOnlyInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  readOnlyText: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    fontWeight: "500",
  },

  // Battery Cell Management Button
  cellManagementButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#06B6D4",
    borderRadius: 12,
    paddingVertical: verticalScale(14),
    gap: scale(8),
  },
  cellManagementButtonText: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cellManagementButtonSubtext: {
    fontSize: moderateScale(13),
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
  },
  // 계기판 상태 선택 버튼
  dashboardStatusButton: {
    flex: 1, // Row에서 동일한 너비로 분배
    height: 70,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dashboardStatusButtonSelected: {
    borderColor: '#06B6D4',
    backgroundColor: '#F0FDFF',
  },
  dashboardStatusButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  dashboardStatusButtonTextSelected: {
    color: '#06B6D4',
  },

  // 계기판 직사각형 이미지
  dashboardImageContainer: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  dashboardImage: {
    width: '100%',
    height: '100%',
  },
  dashboardImageRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  dashboardImagePlaceholder: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dashboardImagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  dashboardStatusRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // Other Inspection Section
  otherAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#06B6D4',
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 16,
  },
  otherAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06B6D4',
  },
  otherItemsList: {
    gap: 12,
  },
  otherItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  otherItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  otherItemCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  otherItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  otherItemImageCount: {
    fontSize: 12,
    color: '#06B6D4',
    fontWeight: '600',
  },
  emptyOtherState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyOtherStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // 차키 개수 스타일 (InputButton과 동일한 스타일)
  carKeyCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6', // InputButton과 동일
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 18,
    height: 80,
    marginTop: 16,
  },
  carKeyCountContainerCompleted: {
    backgroundColor: '#E0F2FE', // InputButton 완료 상태와 동일
  },
  carKeyCountLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
  },
  carKeyCountLabelCompleted: {
    color: '#06B6D4', // InputButton 완료 상태와 동일
  },
  carKeyCountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carKeyCountText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  carKeyCountButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carKeyCountButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  carKeyCountInput: {
    width: 50,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#1F2937',
    textAlign: 'center',
  },
});

export default VehicleInspectionScreen;
