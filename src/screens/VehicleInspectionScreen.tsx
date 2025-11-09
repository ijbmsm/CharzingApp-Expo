import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../navigation/RootNavigator';
import { RootState } from '../store';
import { Timestamp } from 'firebase/firestore';
import firebaseService from '../services/firebaseService';

// Types
import {
  VehicleDiagnosisReport,
  DiagnosisDetail,
  InspectionImageItem,
  BatteryCell,
} from '../../adminWeb/index';

// Battery Cell Components
import BatteryCellGridModal from '../components/BatteryCellGridModal';
import DiagnosisDetailCard from '../components/DiagnosisDetailCard';
import InspectionImageCard from '../components/InspectionImageCard';

type NavigationProp = StackNavigationProp<RootStackParamList, 'VehicleInspection'>;

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
  provider?: 'kakao' | 'google' | 'apple';
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

type InspectionMode = 'reservation_list' | 'inspection';

type InspectionSection = 'vehicleInfo' | 'vinCheck' | 'batteryInfo' | 'diagnosis' | 'images';

interface SectionCompletion {
  completed: number;
  total: number;
  isAllRequiredComplete: boolean;
}

interface ExpandedSectionsState {
  vehicleInfo: boolean;
  vinCheck: boolean;
  batteryInfo: boolean;
  diagnosis: boolean;
  images: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const VehicleInspectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isMountedRef = useRef(true);

  // ============================================================================
  // STATE - Mode & User
  // ============================================================================
  const [inspectionMode, setInspectionMode] = useState<InspectionMode>('reservation_list');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // ============================================================================
  // STATE - Reservation List
  // ============================================================================
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // STATE - Accordion Sections
  // ============================================================================
  const [expandedSections, setExpandedSections] = useState<ExpandedSectionsState>({
    vehicleInfo: true,
    vinCheck: false,
    batteryInfo: false,
    diagnosis: false,
    images: false,
  });

  // Accordion Animation Values
  const accordionAnimations = useRef({
    vehicleInfo: new Animated.Value(1),
    vinCheck: new Animated.Value(0),
    batteryInfo: new Animated.Value(0),
    diagnosis: new Animated.Value(0),
    images: new Animated.Value(0),
  }).current;

  // ============================================================================
  // STATE - Section 1: Vehicle Basic Information
  // ============================================================================
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [dashboardCondition, setDashboardCondition] = useState('');

  // ============================================================================
  // STATE - Section 2: VIN & Vehicle Status Check
  // ============================================================================
  const [vehicleVIN, setVehicleVIN] = useState('');
  const [isVinVerified, setIsVinVerified] = useState(false);
  const [hasNoIllegalModification, setHasNoIllegalModification] = useState(false);
  const [hasNoFloodDamage, setHasNoFloodDamage] = useState(false);

  // ============================================================================
  // STATE - Section 3: Battery Information
  // ============================================================================
  const [batterySOH, setBatterySOH] = useState(100);
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
    soh: '',
    cellDefect: '',
    totalCharge: '',
    fastCharge: '',
    fastChargeRatio: '',
    recentErrorCode: '',
  });
  const [recentErrorCodeValue, setRecentErrorCodeValue] = useState(''); // 최근 오류 코드 (직접 입력)

  // ============================================================================
  // STATE - Section 5: Inspection Images
  // ============================================================================
  const [inspectionImages, setInspectionImages] = useState<InspectionImageItem[]>([]);

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
    if (inspectionMode === 'reservation_list') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSelectedDateFilter(today);
      loadReservationList();
    }
  }, [inspectionMode]);

  // 셀 개수 변경 시 배터리 셀 배열 초기화
  useEffect(() => {
    if (batteryCellCount > 0) {
      const newCells: BatteryCell[] = Array.from({ length: batteryCellCount }, (_, index) => ({
        id: index + 1,
        cellNumber: index + 1,
        isDefective: false,
        voltage: defaultCellVoltage,
      }));
      setBatteryCells(newCells);
    } else {
      setBatteryCells([]);
    }
  }, [batteryCellCount, defaultCellVoltage]);

  // ============================================================================
  // AUTO-CALCULATED VALUES (최대/최소 전압, 불량 셀 개수 자동 계산)
  // ============================================================================

  const defectiveCellCount = useMemo(() => {
    return batteryCells.filter(cell => cell.isDefective).length;
  }, [batteryCells]);

  const maxCellVoltage = useMemo(() => {
    if (batteryCells.length === 0) return 0;
    return Math.max(...batteryCells.map(cell => cell.voltage || 0));
  }, [batteryCells]);

  const minCellVoltage = useMemo(() => {
    if (batteryCells.length === 0) return 0;
    return Math.min(...batteryCells.map(cell => cell.voltage || 0));
  }, [batteryCells]);

  // 세부 진단 데이터 자동 계산
  const diagnosisDetails = useMemo<DiagnosisDetail[]>(() => {
    const totalCharge = normalChargeCount + fastChargeCount;
    const fastChargeRatio = totalCharge > 0 ? ((fastChargeCount / totalCharge) * 100).toFixed(1) : '0.0';

    return [
      {
        category: 'SOH',
        measuredValue: batterySOH > 0 ? `${batterySOH}%` : '',
        interpretation: diagnosisInterpretations.soh,
      },
      {
        category: '셀 불량 여부',
        measuredValue: defectiveCellCount > 0 ? `${defectiveCellCount}개` : '정상',
        interpretation: diagnosisInterpretations.cellDefect,
      },
      {
        category: '총 충전 횟수',
        measuredValue: totalCharge > 0 ? `${totalCharge}회` : '',
        interpretation: diagnosisInterpretations.totalCharge,
      },
      {
        category: '급속 충전 횟수',
        measuredValue: fastChargeCount > 0 ? `${fastChargeCount}회` : '',
        interpretation: diagnosisInterpretations.fastCharge,
      },
      {
        category: '급속 충전 비율',
        measuredValue: totalCharge > 0 ? `${fastChargeRatio}%` : '',
        interpretation: diagnosisInterpretations.fastChargeRatio,
      },
      {
        category: '최근 오류 코드',
        measuredValue: recentErrorCodeValue || '',
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
    if (Platform.OS !== 'web') {
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
      const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');

      const reservationsQuery = query(
        collection(db, 'diagnosisReservations'),
        where('status', '==', 'confirmed'),
        orderBy('requestedDate', 'asc')
      );

      const snapshot = await getDocs(reservationsQuery);
      const reservationsList: ReservationItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ReservationItem[];

      if (isMountedRef.current) {
        setReservations(reservationsList);
      }
    } catch (error) {
      console.error('예약 목록 로드 실패:', error);
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
        const resDate = reservation.requestedDate instanceof Timestamp
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
        if (reservation.userName?.toLowerCase().includes(normalizedSearch)) return true;
        if (reservation.userPhone?.replace(/-/g, '').includes(normalizedSearch.replace(/-/g, ''))) return true;
        const vehicleInfo = `${reservation.vehicleBrand || ''} ${reservation.vehicleModel || ''} ${reservation.vehicleYear || ''}`.toLowerCase();
        if (vehicleInfo.includes(normalizedSearch)) return true;
        return false;
      });
    }

    // Sort by time
    return filtered.sort((a, b) => {
      const dateA = a.requestedDate instanceof Timestamp ? a.requestedDate.toDate() : a.requestedDate;
      const dateB = b.requestedDate instanceof Timestamp ? b.requestedDate.toDate() : b.requestedDate;
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

  const handleSelectReservation = useCallback(async (reservation: ReservationItem) => {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');

      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', reservation.userId)));

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
          if (reservation.vehicleBrand) setVehicleBrand(reservation.vehicleBrand);
          if (reservation.vehicleModel) setVehicleName(reservation.vehicleModel);
          if (reservation.vehicleYear) setVehicleYear(reservation.vehicleYear);

          setInspectionMode('inspection');
        }
      }
    } catch (error) {
      console.error('예약 선택 실패:', error);
      if (isMountedRef.current) {
        Alert.alert('오류', '예약 정보를 불러오는데 실패했습니다.');
      }
    }
  }, []);

  const handleStartManualInspection = useCallback(() => {
    setSelectedUser(null);
    resetAllInspectionData();
    setInspectionMode('inspection');
  }, []);

  const resetAllInspectionData = () => {
    setVehicleBrand('');
    setVehicleName('');
    setVehicleYear('');
    setMileage('');
    setDashboardCondition('');
    setVehicleVIN('');
    setIsVinVerified(false);
    setHasNoIllegalModification(false);
    setHasNoFloodDamage(false);
    setBatteryCellCount(0);
    setBatteryCells([]);
    setDefaultCellVoltage(3.7);
    setNormalChargeCount(0);
    setFastChargeCount(0);
    setBatterySOH(100);
    setDiagnosisInterpretations({
      soh: '',
      cellDefect: '',
      totalCharge: '',
      fastCharge: '',
      fastChargeRatio: '',
      recentErrorCode: '',
    });
    setRecentErrorCodeValue('');
    setInspectionImages([]);
  };

  // ============================================================================
  // SECTION COMPLETION CALCULATION
  // ============================================================================

  const calculateVehicleInfoCompletion = useCallback((): SectionCompletion => {
    const requiredFields = [
      vehicleName.trim().length > 0,
      vehicleYear.trim().length > 0,
      mileage.trim().length > 0,
    ];
    const optionalFields = [
      vehicleBrand.trim().length > 0,
      dashboardCondition.trim().length > 0,
    ];

    const completedCount = requiredFields.filter(Boolean).length + optionalFields.filter(Boolean).length;
    const totalCount = requiredFields.length + optionalFields.length;
    const isAllRequiredComplete = requiredFields.every(Boolean);

    return { completed: completedCount, total: totalCount, isAllRequiredComplete };
  }, [vehicleName, vehicleYear, mileage, vehicleBrand, dashboardCondition]);

  const calculateVinCheckCompletion = useCallback((): SectionCompletion => {
    const requiredFields = [
      vehicleVIN.trim().length > 0,
      isVinVerified,
      hasNoIllegalModification,
      hasNoFloodDamage,
    ];

    const completedCount = requiredFields.filter(Boolean).length;
    const isAllRequiredComplete = requiredFields.every(Boolean);

    return { completed: completedCount, total: requiredFields.length, isAllRequiredComplete };
  }, [vehicleVIN, isVinVerified, hasNoIllegalModification, hasNoFloodDamage]);

  const calculateBatteryInfoCompletion = useCallback((): SectionCompletion => {
    const requiredFields = [batteryCellCount > 0];
    const optionalFields = [
      defectiveCellCount > 0,
      normalChargeCount > 0,
      fastChargeCount > 0,
      batterySOH > 0 && batterySOH !== 100,
      maxCellVoltage > 0,
      minCellVoltage > 0,
    ];

    const completedCount = requiredFields.filter(Boolean).length + optionalFields.filter(Boolean).length;
    const totalCount = requiredFields.length + optionalFields.length;
    const isAllRequiredComplete = requiredFields.every(Boolean);

    return { completed: completedCount, total: totalCount, isAllRequiredComplete };
  }, [batteryCellCount, defectiveCellCount, normalChargeCount, fastChargeCount, batterySOH, maxCellVoltage, minCellVoltage]);

  const calculateDiagnosisCompletion = useCallback((): SectionCompletion => {
    const filledCount = diagnosisDetails.filter(
      d => (d.measuredValue?.trim().length ?? 0) > 0 || (d.interpretation?.trim().length ?? 0) > 0
    ).length;

    return { completed: filledCount, total: diagnosisDetails.length, isAllRequiredComplete: true };
  }, [diagnosisDetails]);

  const calculateImagesCompletion = useCallback((): SectionCompletion => {
    const count = inspectionImages.length;
    return { completed: count, total: Math.max(count, 0), isAllRequiredComplete: true };
  }, [inspectionImages]);

  const isAllRequiredSectionsComplete = useCallback((): boolean => {
    const vehicleInfo = calculateVehicleInfoCompletion();
    const vinCheck = calculateVinCheckCompletion();
    const batteryInfo = calculateBatteryInfoCompletion();

    return vehicleInfo.isAllRequiredComplete && vinCheck.isAllRequiredComplete && batteryInfo.isAllRequiredComplete;
  }, [calculateVehicleInfoCompletion, calculateVinCheckCompletion, calculateBatteryInfoCompletion]);

  // ============================================================================
  // SECTION TOGGLE
  // ============================================================================

  const toggleSection = useCallback((section: InspectionSection) => {
    setExpandedSections(prev => {
      const isCurrentlyExpanded = prev[section];

      // 현재 열린 섹션을 다시 클릭하면 닫음
      if (isCurrentlyExpanded) {
        const newState: ExpandedSectionsState = {
          vehicleInfo: false,
          vinCheck: false,
          batteryInfo: false,
          diagnosis: false,
          images: false,
        };

        // 모든 섹션 애니메이션을 0으로
        Object.keys(prev).forEach((key) => {
          const sectionKey = key as InspectionSection;
          Animated.timing(accordionAnimations[sectionKey], {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }).start();
        });

        return newState;
      }

      // 모든 섹션 닫고, 선택한 섹션만 열기
      const newState: ExpandedSectionsState = {
        vehicleInfo: false,
        vinCheck: false,
        batteryInfo: false,
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
          useNativeDriver: false,
        }).start();
      });

      return newState;
    });
  }, [accordionAnimations]);

  // ============================================================================
  // IMAGE HANDLING
  // ============================================================================

  const handlePickImagesFromGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages: InspectionImageItem[] = result.assets.map((asset, index) => ({
          id: `${Date.now()}_${index}`,
          imageUrl: asset.uri,
          category: '',
          severity: '',
        }));

        setInspectionImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지를 선택하는데 실패했습니다.');
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        const newImage: InspectionImageItem = {
          id: `${Date.now()}`,
          imageUrl: result.assets[0].uri,
          category: '',
          severity: '',
        };

        setInspectionImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('사진 촬영 실패:', error);
      Alert.alert('오류', '사진을 촬영하는데 실패했습니다.');
    }
  }, []);

  const handleRemoveImage = useCallback((imageId: string) => {
    setInspectionImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  const handleUpdateImageCategory = useCallback((imageId: string, category: string) => {
    setInspectionImages(prev =>
      prev.map(img => (img.id === imageId ? { ...img, category } : img))
    );
  }, []);

  const handleUpdateImageSeverity = useCallback((imageId: string, severity: string) => {
    setInspectionImages(prev =>
      prev.map(img => (img.id === imageId ? { ...img, severity } : img))
    );
  }, []);

  // ============================================================================
  // DIAGNOSIS DETAILS HANDLING
  // ============================================================================

  const handleUpdateDiagnosisInterpretation = useCallback((index: number, value: string) => {
    const keys = ['soh', 'cellDefect', 'totalCharge', 'fastCharge', 'fastChargeRatio', 'recentErrorCode'] as const;
    const key = keys[index];
    if (key) {
      setDiagnosisInterpretations(prev => ({ ...prev, [key]: value }));
    }
  }, []);

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
      Alert.alert('알림', '먼저 셀 개수를 입력해주세요.');
    }
  }, [batteryCellCount]);

  const handleCloseCellModal = useCallback(() => {
    setIsCellModalVisible(false);
  }, []);

  const handleDefaultVoltageChange = useCallback((text: string) => {
    // 빈 문자열이면 0
    if (text === '') {
      setDefaultCellVoltage(0);
      return;
    }

    // 숫자와 소수점만 허용
    const filtered = text.replace(/[^0-9.]/g, '');

    // 소수점이 여러 개면 첫 번째만 유지
    const parts = filtered.split('.');
    const validText = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filtered;

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
        '필수 항목 미완료',
        '모든 필수 항목을 완료해주세요.\n\n필수 섹션:\n• 차량 기본 정보\n• 차대번호 및 상태 확인\n• 배터리 정보 (셀 개수)',
        [{ text: '확인' }]
      );
      return;
    }

    if (!selectedUser) {
      Alert.alert('오류', '사용자 정보가 없습니다.');
      return;
    }

    Alert.alert(
      '점검 보고서 제출',
      '점검 보고서를 제출하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          onPress: async () => {
            setIsSubmittingReport(true);
            setUploadProgress(0);

            try {
              // Upload images first
              let uploadedImageUrls: string[] = [];
              if (inspectionImages.length > 0) {
                for (let i = 0; i < inspectionImages.length; i++) {
                  const image = inspectionImages[i];
                  if (image) {
                    const uploadedUrl = await firebaseService.uploadVehicleInspectionImage(image.imageUrl, selectedUser.uid);
                    uploadedImageUrls.push(uploadedUrl);
                    setUploadProgress(((i + 1) / inspectionImages.length) * 80);
                  }
                }
              }

              // Prepare uploaded images with URLs
              const uploadedInspectionImages: InspectionImageItem[] = inspectionImages.map((img, idx) => ({
                ...img,
                imageUrl: uploadedImageUrls[idx] || img.imageUrl,
              }));

              // Prepare report data
              const reportData: Omit<VehicleDiagnosisReport, 'id' | 'createdAt' | 'updatedAt'> = {
                reservationId: null,
                userId: selectedUser.uid,
                userName: selectedUser.realName || selectedUser.displayName || '이름 없음',
                userPhone: selectedUser.phoneNumber || '',
                vehicleBrand,
                vehicleName,
                vehicleYear,
                vehicleVIN,
                mileage: parseInt(mileage) || 0,
                dashboardCondition,
                isVinVerified,
                hasNoIllegalModification,
                hasNoFloodDamage,
                diagnosisDate: new Date(),
                cellCount: batteryCellCount,
                defectiveCellCount,
                normalChargeCount,
                fastChargeCount,
                sohPercentage: batterySOH,
                maxVoltage: maxCellVoltage,
                minVoltage: minCellVoltage,
                cellsData: batteryCells,
                diagnosisDetails: diagnosisDetails.filter(d => d.category.trim().length > 0),
                comprehensiveInspection: {
                  inspectionImages: uploadedInspectionImages,
                },
                status: 'completed',
              };

              setUploadProgress(90);

              // Save to Firestore
              await firebaseService.createVehicleDiagnosisReport(reportData);

              setUploadProgress(100);

              Alert.alert(
                '제출 완료',
                '점검 보고서가 성공적으로 제출되었습니다.',
                [
                  {
                    text: '확인',
                    onPress: () => {
                      setInspectionMode('reservation_list');
                      resetAllInspectionData();
                      navigation.goBack();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('보고서 제출 실패:', error);
              Alert.alert('제출 실패', '보고서 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
            } finally {
              if (isMountedRef.current) {
                setIsSubmittingReport(false);
                setUploadProgress(0);
              }
            }
          },
        },
      ]
    );
  }, [
    isAllRequiredSectionsComplete,
    selectedUser,
    vehicleBrand,
    vehicleName,
    vehicleYear,
    vehicleVIN,
    mileage,
    dashboardCondition,
    isVinVerified,
    hasNoIllegalModification,
    hasNoFloodDamage,
    batteryCellCount,
    defectiveCellCount,
    normalChargeCount,
    fastChargeCount,
    batterySOH,
    maxCellVoltage,
    minCellVoltage,
    diagnosisDetails,
    inspectionImages,
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
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Date Filter Chips */}
        <View style={styles.dateFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateFilterChips}>
            <TouchableOpacity
              style={[styles.dateChip, selectedDateFilter === null && styles.dateChipActive]}
              onPress={() => setSelectedDateFilter(null)}
            >
              <Text style={[styles.dateChipText, selectedDateFilter === null && styles.dateChipTextActive]}>전체</Text>
            </TouchableOpacity>
            {getWeekDates().map((date, index) => {
              const isSelected = selectedDateFilter?.getTime() === date.getTime();
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateChip, isSelected && styles.dateChipActive]}
                  onPress={() => setSelectedDateFilter(date)}
                >
                  <Text style={[styles.dateChipText, isSelected && styles.dateChipTextActive]}>
                    {isToday ? '오늘' : `${date.getMonth() + 1}/${date.getDate()}`}
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
                  {searchQuery ? '검색 결과 없음' : selectedDateFilter ? '예약 없음' : '오늘 예약 없음'}
                </Text>
              </View>
            }
            renderItem={({ item: reservation }) => {
              const date = reservation.requestedDate instanceof Timestamp
                ? reservation.requestedDate.toDate()
                : reservation.requestedDate;
              const timeString = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

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
                      <Text style={styles.reservationValue}>{reservation.userName || '이름 없음'}</Text>
                    </View>
                    <View style={styles.reservationInfoRow}>
                      <Text style={styles.reservationLabel}>전화</Text>
                      <Text style={styles.reservationValue}>{reservation.userPhone}</Text>
                    </View>
                    {reservation.vehicleBrand && (
                      <View style={styles.reservationInfoRow}>
                        <Text style={styles.reservationLabel}>차량</Text>
                        <Text style={styles.reservationValue}>
                          {reservation.vehicleBrand} {reservation.vehicleModel} '{reservation.vehicleYear?.slice(-2)}
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
        <TouchableOpacity style={styles.fab} onPress={handleStartManualInspection} activeOpacity={0.8}>
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
          isRequired && !isAllRequiredComplete && styles.sectionHeaderIncomplete,
        ]}
        onPress={() => toggleSection(section)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color={isAllRequiredComplete ? '#10B981' : '#6B7280'}
          />
          <Text style={styles.sectionTitle}>{title}</Text>
          {isRequired && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>필수</Text>
            </View>
          )}
        </View>
        <View style={styles.sectionHeaderRight}>
          <Text
            style={[
              styles.sectionProgress,
              isAllRequiredComplete ? styles.sectionProgressComplete : styles.sectionProgressIncomplete,
            ]}
          >
            {completed}/{total}
          </Text>
          {isAllRequiredComplete && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
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
      <Animated.View style={[styles.sectionContent, { maxHeight: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }]}>
        {/* 차량명 * */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>차량명 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="아이오닉 5, EV6 등"
            placeholderTextColor="#9CA3AF"
            value={vehicleName}
            onChangeText={setVehicleName}
          />
        </View>

        {/* 년식 * */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>년식 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="2024"
            placeholderTextColor="#9CA3AF"
            value={vehicleYear}
            onChangeText={setVehicleYear}
            keyboardType="numeric"
          />
        </View>

        {/* 주행거리 * */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>주행거리 (km) *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="15000"
            placeholderTextColor="#9CA3AF"
            value={mileage}
            onChangeText={setMileage}
            keyboardType="numeric"
          />
        </View>

        {/* 브랜드 */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>브랜드</Text>
          <TextInput
            style={styles.textInput}
            placeholder="현대, 기아, 테슬라 등"
            placeholderTextColor="#9CA3AF"
            value={vehicleBrand}
            onChangeText={setVehicleBrand}
          />
        </View>

        {/* 계기상태 */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>계기상태</Text>
          <TextInput
            style={styles.textInput}
            placeholder="정상, 경고등 있음 등"
            placeholderTextColor="#9CA3AF"
            value={dashboardCondition}
            onChangeText={setDashboardCondition}
          />
        </View>
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER - Section 2: VIN & Vehicle Status Check
  // ============================================================================

  const renderVinCheckSection = () => {
    const animatedHeight = accordionAnimations.vinCheck.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 600],
    });

    const animatedOpacity = accordionAnimations.vinCheck.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    if (!expandedSections.vinCheck) return null;

    return (
      <Animated.View style={[styles.sectionContent, { maxHeight: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }]}>
        {/* 차대번호 * */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>차대번호 (VIN) *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="17자리 차대번호"
            placeholderTextColor="#9CA3AF"
            value={vehicleVIN}
            onChangeText={setVehicleVIN}
            autoCapitalize="characters"
            maxLength={17}
          />
        </View>

        {/* Checkboxes */}
        <View style={styles.checkboxGroup}>
          {/* 동일성 확인 * */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsVinVerified(!isVinVerified)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isVinVerified && styles.checkboxChecked]}>
              {isVinVerified && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>동일성 확인 *</Text>
          </TouchableOpacity>

          {/* 불법 구조변경 없음 * */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setHasNoIllegalModification(!hasNoIllegalModification)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, hasNoIllegalModification && styles.checkboxChecked]}>
              {hasNoIllegalModification && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>불법 구조변경 없음 *</Text>
          </TouchableOpacity>

          {/* 침수 이력 없음 * */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setHasNoFloodDamage(!hasNoFloodDamage)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, hasNoFloodDamage && styles.checkboxChecked]}>
              {hasNoFloodDamage && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>침수 이력 없음 *</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER - Section 3: Battery Information
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
      <Animated.View style={[styles.sectionContent, { maxHeight: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }]}>
        {/* 1. SOH * */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>SOH (%) *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="100"
            placeholderTextColor="#9CA3AF"
            value={batterySOH === 0 ? '' : batterySOH.toString()}
            onChangeText={(text) => setBatterySOH(text === '' ? 0 : parseFloat(text) || 0)}
            keyboardType="decimal-pad"
          />
        </View>

        {/* 2. 전압 정보 (자동 계산 - 읽기 전용) */}
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>최대 전압 (V)</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>
                {maxCellVoltage > 0 ? maxCellVoltage.toFixed(2) : '0.00'}
              </Text>
            </View>
          </View>

          <View style={styles.inputRowSpacer} />

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>최소 전압 (V)</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>
                {minCellVoltage > 0 ? minCellVoltage.toFixed(2) : '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. 셀 개수 * */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>셀 개수 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            value={batteryCellCount === 0 ? '' : batteryCellCount.toString()}
            onChangeText={(text) => setBatteryCellCount(text === '' ? 0 : parseInt(text) || 0)}
            keyboardType="numeric"
          />
        </View>

        {/* 4. 배터리 셀 관리 버튼 (셀 개수 > 0일 때만 표시) */}
        {batteryCellCount > 0 && (
          <TouchableOpacity style={styles.cellManagementButton} onPress={handleOpenCellModal} activeOpacity={0.7}>
            <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
            <Text style={styles.cellManagementButtonText}>배터리 셀 관리</Text>
            <Text style={styles.cellManagementButtonSubtext}>({batteryCells.length}개 셀)</Text>
          </TouchableOpacity>
        )}

        {/* 5. 불량 셀 개수 (자동 계산 - 읽기 전용) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>불량 셀 개수</Text>
          <View style={styles.readOnlyInput}>
            <Text style={styles.readOnlyText}>{defectiveCellCount}개</Text>
          </View>
        </View>

        {/* 6. 충전 횟수 Row */}
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>일반 충전</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0회"
              placeholderTextColor="#9CA3AF"
              value={normalChargeCount === 0 ? '' : normalChargeCount.toString()}
              onChangeText={(text) => setNormalChargeCount(text === '' ? 0 : parseInt(text) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputRowSpacer} />

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>급속 충전</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0회"
              placeholderTextColor="#9CA3AF"
              value={fastChargeCount === 0 ? '' : fastChargeCount.toString()}
              onChangeText={(text) => setFastChargeCount(text === '' ? 0 : parseInt(text) || 0)}
              keyboardType="numeric"
            />
          </View>
        </View>
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER - Section 4: Diagnosis Details
  // ============================================================================

  const renderDiagnosisSection = () => {
    const animatedHeight = accordionAnimations.diagnosis.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 2000],
    });

    const animatedOpacity = accordionAnimations.diagnosis.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    if (!expandedSections.diagnosis) return null;

    return (
      <Animated.View style={[styles.sectionContent, { maxHeight: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }]}>
        {diagnosisDetails.map((detail, index) => (
          <DiagnosisDetailCard
            key={index}
            detail={detail}
            index={index}
            isRecentErrorCode={index === 5}
            onUpdateMeasuredValue={index === 5 ? handleUpdateRecentErrorCode : undefined}
            onUpdateInterpretation={(idx, text) => handleUpdateDiagnosisInterpretation(idx, text)}
          />
        ))}
      </Animated.View>
    );
  };

  // ============================================================================
  // RENDER - Section 5: Inspection Images
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
      <Animated.View style={[styles.sectionContent, { maxHeight: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }]}>
        <View style={styles.imageButtonsRow}>
          <TouchableOpacity style={[styles.imageButton, { flex: 1 }]} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={20} color="#06B6D4" />
            <Text style={styles.imageButtonText}>사진 촬영</Text>
          </TouchableOpacity>

          <View style={styles.inputRowSpacer} />

          <TouchableOpacity style={[styles.imageButton, { flex: 1 }]} onPress={handlePickImagesFromGallery}>
            <Ionicons name="images" size={20} color="#06B6D4" />
            <Text style={styles.imageButtonText}>갤러리</Text>
          </TouchableOpacity>
        </View>

        {inspectionImages.length > 0 ? (
          <View style={styles.imagesGrid}>
            {inspectionImages.map((image) => (
              <InspectionImageCard
                key={image.id}
                image={image}
                onRemove={handleRemoveImage}
                onUpdateCategory={handleUpdateImageCategory}
                onUpdateSeverity={handleUpdateImageSeverity}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyImagesState}>
            <Ionicons name="image-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyImagesStateText}>사진을 추가해주세요</Text>
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
    const vinCheckCompletion = calculateVinCheckCompletion();
    const batteryInfoCompletion = calculateBatteryInfoCompletion();
    const diagnosisCompletion = calculateDiagnosisCompletion();
    const imagesCompletion = calculateImagesCompletion();

    return (
      <View style={styles.inspectionContainer}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Section 1: Vehicle Basic Information */}
          <View style={styles.accordionSection}>
            {renderSectionHeader('차량 기본 정보', 'vehicleInfo', vehicleInfoCompletion, true)}
            {renderVehicleInfoSection()}
          </View>

          {/* Section 2: VIN & Vehicle Status Check */}
          <View style={styles.accordionSection}>
            {renderSectionHeader('차대번호 및 상태 확인', 'vinCheck', vinCheckCompletion, true)}
            {renderVinCheckSection()}
          </View>

          {/* Section 3: Battery Information */}
          <View style={styles.accordionSection}>
            {renderSectionHeader('배터리 정보', 'batteryInfo', batteryInfoCompletion, true)}
            {renderBatteryInfoSection()}
          </View>

          {/* Section 4: Diagnosis Details */}
          <View style={styles.accordionSection}>
            {renderSectionHeader('세부 진단 결과', 'diagnosis', diagnosisCompletion, false)}
            {renderDiagnosisSection()}
          </View>

          {/* Section 5: Inspection Images */}
          <View style={styles.accordionSection}>
            {renderSectionHeader('사진 첨부', 'images', imagesCompletion, false)}
            {renderImagesSection()}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitButtonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmittingReport && styles.submitButtonDisabled]}
            onPress={handleSubmitInspectionReport}
            disabled={isSubmittingReport}
          >
            {isSubmittingReport ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                {uploadProgress > 0 && (
                  <Text style={styles.submitButtonText}>{uploadProgress.toFixed(0)}% 업로드 중...</Text>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (inspectionMode === 'inspection') {
              Alert.alert(
                '점검 취소',
                '진행 중인 점검을 취소하시겠습니까?\n입력한 내용이 모두 사라집니다.',
                [
                  { text: '계속 작업', style: 'cancel' },
                  {
                    text: '취소',
                    style: 'destructive',
                    onPress: () => {
                      setInspectionMode('reservation_list');
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
      {inspectionMode === 'reservation_list' ? renderReservationList() : renderInspectionChecklist()}

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
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#1F2937',
  },

  // Reservation List
  reservationListContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    gap: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#1F2937',
  },
  dateFilterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateFilterChips: {
    gap: scale(8),
  },
  dateChip: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(14),
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateChipActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  dateChipText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#6B7280',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  reservationList: {
    padding: scale(16),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyStateText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    marginTop: verticalScale(12),
  },
  reservationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: scale(16),
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reservationCardContent: {
    flex: 1,
  },
  reservationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  reservationLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#6B7280',
    width: scale(44),
  },
  reservationValue: {
    fontSize: moderateScale(14),
    color: '#1F2937',
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: scale(20),
    bottom: scale(20),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    backgroundColor: '#FFFFFF',
  },
  sectionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeaderIncomplete: {
    backgroundColor: '#FEF2F2',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    flex: 1,
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#1F2937',
  },
  requiredBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
  },
  requiredBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#DC2626',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  sectionProgress: {
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  sectionProgressComplete: {
    color: '#10B981',
  },
  sectionProgressIncomplete: {
    color: '#6B7280',
  },

  // Section Content
  sectionContent: {
    padding: scale(16),
  },
  inputGroup: {
    marginBottom: verticalScale(16),
  },
  inputLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#374151',
    marginBottom: verticalScale(6),
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(14),
    color: '#1F2937',
  },
  textInputMultiline: {
    height: verticalScale(80),
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  checkbox: {
    width: scale(22),
    height: scale(22),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxLabel: {
    fontSize: moderateScale(14),
    color: '#1F2937',
  },

  // Subsection
  subsectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1F2937',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(12),
  },

  // Diagnosis Cards
  diagnosisCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: scale(12),
    marginBottom: verticalScale(12),
  },
  diagnosisCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  diagnosisCardTitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: scale(6),
  },
  addButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#06B6D4',
  },

  // Images
  imageButtonsRow: {
    flexDirection: 'row',
    marginBottom: verticalScale(16),
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: scale(6),
  },
  imageButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#06B6D4',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(12),
  },
  imageCard: {
    width: (scale(375) - scale(32) - scale(24)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imagePreview: {
    width: '100%',
    height: verticalScale(120),
  },
  imageRemoveButton: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  imageMetaInputs: {
    padding: scale(8),
    gap: verticalScale(6),
  },
  imageMetaInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(6),
    fontSize: moderateScale(12),
    color: '#1F2937',
  },
  emptyImagesState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  emptyImagesStateText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    marginTop: verticalScale(8),
  },

  // Submit Button
  submitButtonContainer: {
    padding: scale(16),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: verticalScale(14),
    gap: scale(8),
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Read-only Input (자동 계산 값 표시용)
  readOnlyInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  readOnlyText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    fontWeight: '500',
  },

  // Battery Cell Management Button
  cellManagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: verticalScale(14),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(8),
    gap: scale(8),
  },
  cellManagementButtonText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cellManagementButtonSubtext: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default VehicleInspectionScreen;
