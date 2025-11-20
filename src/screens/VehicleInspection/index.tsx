import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Animated,
  Easing,
  BackHandler,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { FormProvider } from 'react-hook-form';
import { Timestamp } from 'firebase/firestore';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { RootState } from '../../store';
import firebaseService from '../../services/firebaseService';
import sentryLogger from '../../utils/sentryLogger';
import { draftStorage } from '../../storage/mmkv';
import { imageStorage } from '../../storage/imageStorage';
import { useAutoSave } from '../../hooks/useAutoSave';

// Hooks
import { useInspectionForm } from './hooks/useInspectionForm';
import { useInspectionSubmit } from './hooks/useInspectionSubmit';

// Types
import { InspectionSection, ExpandedSectionsState, SectionCompletion } from './types';

// Section Components
import { VehicleInfoSection } from './sections/VehicleInfoSection';
import { BatteryInfoSection } from './sections/BatteryInfoSection';
import { MajorDevicesSection } from './sections/MajorDevicesSection';
import { VehicleExteriorSection } from './sections/VehicleExteriorSection';
import { VehicleUndercarriageSection } from './sections/VehicleUndercarriageSection';
import { VehicleInteriorSection } from './sections/VehicleInteriorSection';
import { OtherSection } from './sections/OtherSection';

// Standalone Components
import DiagnosticianConfirmationModal from '../../components/DiagnosticianConfirmationModal';
import InputButton from '../../components/InputButton';

type NavigationProp = StackNavigationProp<RootStackParamList, 'VehicleInspection'>;
type RouteParams = RouteProp<RootStackParamList, 'VehicleInspection'>;

interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  realName?: string;
  phoneNumber?: string;
}

interface ReservationItem {
  id: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  requestedDate: Date | Timestamp;
  status: 'pending' | 'confirmed' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled'; // ⭐ pending_review 추가
}

type InspectionMode = 'reservation_list' | 'inspection';

const VehicleInspectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const insets = useSafeAreaInsets();

  // Mode & User
  const [inspectionMode, setInspectionMode] = useState<InspectionMode>('reservation_list');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null); // ⭐ 예약 정보 저장
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // 수동 검사 사용자 정보 입력 모달
  const [isUserInfoModalVisible, setIsUserInfoModalVisible] = useState(false);
  const [manualUserName, setManualUserName] = useState('');
  const [manualUserPhone, setManualUserPhone] = useState('');

  // 진단사 수행 확인 모달
  const [isDiagnosticianModalVisible, setIsDiagnosticianModalVisible] = useState(false);

  // 🔍 디버깅: 상태 변화 추적
  useEffect(() => {
    console.log('🔍 inspectionMode 변경:', inspectionMode);
  }, [inspectionMode]);

  useEffect(() => {
    console.log('🔍 selectedUser 변경:', selectedUser ? { uid: selectedUser.uid, name: selectedUser.displayName } : null);
  }, [selectedUser]);

  // React Hook Form (draft는 복구 시 reset으로 주입)
  const methods = useInspectionForm(undefined);
  const { watch, reset } = methods;
  const { isSubmitting, submitInspection } = useInspectionSubmit();

  // 자동저장 (사용자 선택 후에만 활성화)
  const { isSaving } = useAutoSave({
    methods,
    userId: selectedUser?.uid || '',
    userInfo: {
      userName: selectedUser?.displayName || selectedUser?.realName || '이름 없음',
      userPhone: selectedUser?.phoneNumber || '전화번호 없음',
    },
    delay: 500, // 500ms debounce
    enabled: autoSaveEnabled && !!selectedUser && inspectionMode === 'inspection',
    onSave: (savedAt) => {
      console.log('✅ AutoSave 완료:', savedAt);
      setLastSaved(savedAt);
    },
    onError: (error) => {
      console.error('❌ AutoSave 에러:', error);
    },
  });

  // Reservation List
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);

  // Drafts List
  const [drafts, setDrafts] = useState<Array<{
    userId: string;
    userName: string;
    userPhone: string;
    savedAt: Date;
    dataSize: number;
  }>>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);

  // Accordion Sections (처음에는 모두 닫힘)
  const [expandedSections, setExpandedSections] = useState<ExpandedSectionsState>({
    vehicleInfo: false,
    batteryInfo: false,
    majorDevices: false,
    vehicleExterior: false,
    vehicleUndercarriage: false,
    vehicleInterior: false,
    other: false,
  });

  const accordionAnimations = useRef({
    vehicleInfo: new Animated.Value(0),
    batteryInfo: new Animated.Value(0),
    majorDevices: new Animated.Value(0),
    vehicleExterior: new Animated.Value(0),
    vehicleUndercarriage: new Animated.Value(0),
    vehicleInterior: new Animated.Value(0),
    other: new Animated.Value(0),
  }).current;

  // Load Reservations and Drafts
  useEffect(() => {
    if (inspectionMode === 'reservation_list') {
      loadReservations();
      loadDrafts();
    }
  }, [inspectionMode]);

  // 🔥 ReservationDetail에서 전달된 예약을 자동으로 선택
  useEffect(() => {
    const params = route.params;
    if (params?.reservation) {
      console.log('🎯 예약 정보를 받아서 자동으로 진단 시작:', params.reservation);

      // ReservationItem 타입으로 변환
      const reservation: ReservationItem = {
        id: params.reservation.id,
        userId: params.reservation.userId,
        userName: params.reservation.userName,
        userPhone: params.reservation.userPhone,
        vehicleBrand: params.reservation.vehicleBrand,
        vehicleModel: params.reservation.vehicleModel,
        vehicleYear: params.reservation.vehicleYear,
        requestedDate:
          typeof params.reservation.requestedDate === 'string'
            ? new Date(params.reservation.requestedDate)
            : params.reservation.requestedDate instanceof Timestamp
            ? params.reservation.requestedDate
            : params.reservation.requestedDate as Date,
        status: params.reservation.status,
      };

      // 자동으로 예약 선택
      handleSelectReservation(reservation);
    }
  }, []);

  const loadReservations = async () => {
    try {
      setIsLoadingReservations(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allReservations = await firebaseService.getMechanicAssignedReservations(currentUser?.uid || '');
      const todayReservations = allReservations.filter((r) => {
        if (r.requestedDate instanceof Timestamp) {
          const resDate = r.requestedDate.toDate();
          resDate.setHours(0, 0, 0, 0);
          return resDate.getTime() === today.getTime();
        } else if (r.requestedDate instanceof Date) {
          const resDate = new Date(r.requestedDate);
          resDate.setHours(0, 0, 0, 0);
          return resDate.getTime() === today.getTime();
        }
        return false;
      }) as ReservationItem[];
      setReservations(todayReservations);
    } catch (error) {
      sentryLogger.logError('예약 목록 로딩 실패', error instanceof Error ? error : new Error(String(error)));
      Alert.alert('오류', '예약 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingReservations(false);
    }
  };

  const loadDrafts = async () => {
    try {
      setIsLoadingDrafts(true);
      const allDrafts = await draftStorage.getAllDraftsWithUserInfo();
      setDrafts(allDrafts);
      console.log('📋 임시저장 목록:', allDrafts.length, '개');
    } catch (error) {
      console.error('❌ 임시저장 목록 로딩 실패:', error);
      sentryLogger.logError('임시저장 목록 로딩 실패', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  // Draft가 의미 있는 데이터를 포함하는지 확인
  const isDraftMeaningful = (draft: any): boolean => {
    if (!draft) return false;

    // 1️⃣ 기본 필드 체크
    const vehicleInfo = draft.vehicleInfo || {};
    const batteryInfo = draft.batteryInfo || {};
    const hasBasicFields = !!(
      vehicleInfo.vehicleBrand ||
      vehicleInfo.vehicleName ||
      vehicleInfo.mileage ||
      vehicleInfo.carKeyCount ||
      batteryInfo.sohPercentage ||
      batteryInfo.cellCount
    );

    // 2️⃣ 이미지 체크 (재귀적으로 모든 섹션 검사)
    const hasImages = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;

      // imageUris, imageUri 필드 체크
      if (Array.isArray(obj.imageUris) && obj.imageUris.length > 0) return true;
      if (typeof obj.imageUri === 'string' && obj.imageUri.length > 0) return true;

      // 중첩 객체 재귀 검사
      return Object.values(obj).some(value => {
        if (Array.isArray(value)) {
          return value.some(item => hasImages(item));
        }
        if (typeof value === 'object' && value !== null) {
          return hasImages(value);
        }
        return false;
      });
    };

    const hasAnyImages = hasImages(draft);

    // 3️⃣ 기본 필드 OR 이미지 중 하나라도 있으면 의미 있음
    return hasBasicFields || hasAnyImages;
  };

  const handleSelectReservation = async (reservation: ReservationItem) => {
    // ⭐ 예약 정보 저장 (reservationId 전달용)
    setSelectedReservation(reservation);

    const user = {
      uid: reservation.userId || '',
      displayName: reservation.userName,
      phoneNumber: reservation.userPhone,
    };
    setSelectedUser(user);

    // 🔥 Flow Tracing: Draft 불러오기 시작
    sentryLogger.logDraftLoadStart(user.uid);

    // Draft 확인 및 불러오기
    const userDraft = await draftStorage.loadDraft(user.uid);

    if (userDraft && isDraftMeaningful(userDraft)) {
      // 🔥 Flow Tracing: Draft 불러오기 성공
      const draftTimestamp = await draftStorage.getDraftSavedTime(user.uid);
      sentryLogger.logDraftLoadSuccess(
        user.uid,
        JSON.stringify(userDraft).length,
        draftTimestamp?.toISOString() || ''
      );

      // 🔥 Problem 3 Fix: 30초 규칙 - 마지막 열람 시간 체크
      const lastOpened = await draftStorage.getLastOpened(user.uid);
      const now = Date.now();
      const elapsedSeconds = lastOpened ? (now - lastOpened) / 1000 : Infinity;

      console.log(`📊 재진입 간격: ${elapsedSeconds.toFixed(1)}초`);

      if (elapsedSeconds < 30) {
        // ✅ Case 1: 빠른 재진입 (<30초) → 자동 이어쓰기 (팝업 없음)
        console.log('⚡ 빠른 재진입 - 자동 이어쓰기');

        // 🔥 Flow Tracing: 자동 이어쓰기
        sentryLogger.logDraftAutoResume(user.uid, elapsedSeconds);

        reset(userDraft);

        if (draftTimestamp) {
          setLastSaved(draftTimestamp);
        }

        setInspectionMode('inspection');
        await draftStorage.saveLastOpened(user.uid);
      } else {
        // ✅ Case 2: 오래 후 재진입 (≥30초) → 팝업 표시
        console.log('🕐 오래 후 재진입 - 팝업 표시');

        // 🔥 Flow Tracing: 팝업 표시
        sentryLogger.logDraftPopupShown(user.uid, elapsedSeconds);

        Alert.alert(
          '임시저장 복구',
          '이전에 작성하던 진단 리포트가 있습니다. 불러올까요?',
          [
            {
              text: '새로 작성',
              onPress: async () => {
                // 🔥 UI Interaction: 버튼 클릭
                sentryLogger.logButtonClick(user.uid, 'draft_popup_new', 'VehicleInspection');

                // 🔥 Flow Tracing: Draft 삭제 (사용자 선택)
                sentryLogger.logDraftDeleted(user.uid, 'user_choice');

                // 🔥 AutoSave 일시 비활성화 (빈 폼 저장 방지)
                setAutoSaveEnabled(false);

                await draftStorage.clearDraft(user.uid);
                await imageStorage.clearUserImages(user.uid);
                reset(undefined);
                setLastSaved(null);
                setInspectionMode('inspection');
                await draftStorage.saveLastOpened(user.uid);

                // 100ms 후 AutoSave 재활성화
                setTimeout(() => setAutoSaveEnabled(true), 100);
              },
            },
            {
              text: '이어서 작성',
              onPress: async () => {
                // 🔥 UI Interaction: 버튼 클릭
                sentryLogger.logButtonClick(user.uid, 'draft_popup_resume', 'VehicleInspection');

                reset(userDraft);

                if (draftTimestamp) {
                  setLastSaved(draftTimestamp);
                }

                setInspectionMode('inspection');
                await draftStorage.saveLastOpened(user.uid);
              },
            },
          ]
        );
      }
    } else {
      // 빈 Draft는 자동 삭제
      if (userDraft) {
        // 🔥 Flow Tracing: Draft 삭제 (만료/빈 폼)
        sentryLogger.logDraftDeleted(user.uid, 'expired');
        await draftStorage.clearDraft(user.uid);
      }
      setLastSaved(null);
      setInspectionMode('inspection');
      await draftStorage.saveLastOpened(user.uid);
    }
  };

  const handleStartManualInspection = () => {
    // 사용자 정보 입력 모달 열기
    setIsUserInfoModalVisible(true);
  };

  const handleConfirmUserInfo = async () => {
    // 입력 검증
    if (!manualUserName.trim() || !manualUserPhone.trim()) {
      Alert.alert('입력 오류', '이름과 전화번호를 모두 입력해주세요.');
      return;
    }

    // 모달 닫기
    setIsUserInfoModalVisible(false);

    try {
      // 🔥 Guest user 생성 (UUID 기반)
      const { uid: guestUid, user: guestUser } = await firebaseService.createGuestUser(
        manualUserName.trim(),
        manualUserPhone.trim()
      );

      console.log('✅ Guest user 생성 완료:', { uid: guestUid, name: guestUser.displayName });

      // Guest user 정보로 selectedUser 설정
      const tempUser = {
        uid: guestUid,
        displayName: guestUser.displayName,
        phoneNumber: guestUser.phoneNumber,
      };
      setSelectedUser(tempUser);

      // 🔥 Draft 확인 및 불러오기
      const userDraft = await draftStorage.loadDraft(guestUid);
      if (userDraft && isDraftMeaningful(userDraft)) {
        // 🔥 Problem 3 Fix: 30초 규칙 - 마지막 열람 시간 체크
        const lastOpened = await draftStorage.getLastOpened(guestUid);
        const now = Date.now();
        const elapsedSeconds = lastOpened ? (now - lastOpened) / 1000 : Infinity;

        console.log(`📊 재진입 간격: ${elapsedSeconds.toFixed(1)}초`);

        if (elapsedSeconds < 30) {
          // ✅ Case 1: 빠른 재진입 (<30초) → 자동 이어쓰기 (팝업 없음)
          console.log('⚡ 빠른 재진입 - 자동 이어쓰기');
          reset(userDraft);

          const draftTimestamp = await draftStorage.getDraftSavedTime(guestUid);
          if (draftTimestamp) {
            setLastSaved(draftTimestamp);
          }

          setInspectionMode('inspection');
          await draftStorage.saveLastOpened(guestUid);
        } else {
          // ✅ Case 2: 오래 후 재진입 (≥30초) → 팝업 표시
          console.log('🕐 오래 후 재진입 - 팝업 표시');
          Alert.alert(
            '임시저장 복구',
            '이전에 작성하던 진단 리포트가 있습니다. 불러올까요?',
            [
              {
                text: '새로 작성',
                onPress: async () => {
                  // 🔥 AutoSave 일시 비활성화 (빈 폼 저장 방지)
                  setAutoSaveEnabled(false);

                  await draftStorage.clearDraft(guestUid);
                  await imageStorage.clearUserImages(guestUid);
                  reset(undefined);
                  setLastSaved(null);
                  setInspectionMode('inspection');
                  await draftStorage.saveLastOpened(guestUid);

                  // 100ms 후 AutoSave 재활성화
                  setTimeout(() => setAutoSaveEnabled(true), 100);
                },
              },
              {
                text: '이어서 작성',
                onPress: async () => {
                  reset(userDraft);

                  const draftTimestamp = await draftStorage.getDraftSavedTime(guestUid);
                  if (draftTimestamp) {
                    setLastSaved(draftTimestamp);
                  }

                  setInspectionMode('inspection');
                  await draftStorage.saveLastOpened(guestUid);
                },
              },
            ]
          );
        }
      } else {
        // 빈 Draft는 자동 삭제
        if (userDraft) {
          await draftStorage.clearDraft(guestUid);
        }
        setLastSaved(null);
        setInspectionMode('inspection');
        await draftStorage.saveLastOpened(guestUid);
      }
    } catch (error) {
      console.error('❌ Guest user 생성 실패:', error);
      Alert.alert('오류', 'Guest 계정 생성에 실패했습니다. 다시 시도해주세요.');
      return;
    }
  };

  const handleSelectDraft = async (draft: {
    userId: string;
    userName: string;
    userPhone: string;
    savedAt: Date;
    dataSize: number;
  }) => {
    const user = {
      uid: draft.userId,
      displayName: draft.userName,
      phoneNumber: draft.userPhone,
    };
    setSelectedUser(user);

    // Draft 불러오기 (이미 존재한다는 것을 알고 있음)
    const userDraft = await draftStorage.loadDraft(user.uid);
    if (userDraft) {
      reset(userDraft);

      const draftTimestamp = await draftStorage.getDraftSavedTime(user.uid);
      if (draftTimestamp) {
        setLastSaved(draftTimestamp);
      }

      setInspectionMode('inspection');
      await draftStorage.saveLastOpened(user.uid);

      console.log('📋 임시저장 불러오기:', draft.userName);
    }
  };

  const handleBackToList = useCallback(() => {
    // 실제 뒤로가기 동작
    setInspectionMode('reservation_list');
    setSelectedUser(null);
    reset(undefined);
  }, [reset]);

  const handleBackPress = useCallback(() => {
    const { isDirty } = methods.formState;

    if (isDirty) {
      Alert.alert(
        '작성 중인 내용이 있습니다',
        '작성 중인 내용은 자동 저장되었습니다. 나가시겠습니까?',
        [
          { text: '계속 작성', style: 'cancel' },
          {
            text: '나가기',
            style: 'destructive',
            onPress: handleBackToList
          }
        ]
      );
    } else {
      handleBackToList();
    }
  }, [methods.formState, handleBackToList]);

  // Android 백버튼 처리
  useEffect(() => {
    if (inspectionMode === 'inspection') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          handleBackPress();
          return true; // 기본 동작 방지
        }
      );
      return () => backHandler.remove();
    }
    return undefined; // inspection 모드가 아닐 때
  }, [inspectionMode, handleBackPress]);

  // 🔥 Problem 3 Fix: 화면 나갈 때 타임스탬프 저장 (30초 규칙용)
  useEffect(() => {
    return () => {
      if (selectedUser?.uid) {
        draftStorage.saveLastOpened(selectedUser.uid);
      }
    };
  }, [selectedUser]);

  // Accordion Animation
  const toggleSection = (section: InspectionSection) => {
    const isExpanded = !expandedSections[section];

    // 🔥 한 번에 하나만 펼치기: 클릭한 섹션만 토글, 나머지는 모두 닫기
    const newExpandedState: ExpandedSectionsState = {
      vehicleInfo: false,
      batteryInfo: false,
      majorDevices: false,
      vehicleExterior: false,
      vehicleUndercarriage: false,
      vehicleInterior: false,
      other: false,
      [section]: isExpanded, // 클릭한 섹션만 토글
    };
    setExpandedSections(newExpandedState);

    // 🔥 UI Interaction: 아코디언 토글
    if (selectedUser?.uid) {
      sentryLogger.logAccordionToggle(selectedUser.uid, section, isExpanded);
    }

    // 모든 섹션의 애니메이션 업데이트
    Object.keys(accordionAnimations).forEach((key) => {
      const sectionKey = key as InspectionSection;
      const targetValue = newExpandedState[sectionKey] ? 1 : 0;

      Animated.timing(accordionAnimations[sectionKey], {
        toValue: targetValue,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    });
  };

  // Section Completion Calculations
  const calculateVehicleInfoCompletion = useCallback((): SectionCompletion => {
    const vehicleInfo = watch('vehicleInfo');

    // 4개 주요 항목 체크 (VehicleInfoSection의 isCompleted 로직과 동일하게)
    const items = [
      // 1. 차량 모델 (브랜드, 차량명, 연식, 주행거리)
      !!(vehicleInfo.vehicleBrand && vehicleInfo.vehicleName && vehicleInfo.vehicleYear && vehicleInfo.mileage),
      // 2. 차키 수
      !!(vehicleInfo.carKeyCount && parseInt(vehicleInfo.carKeyCount) > 0),
      // 3. 계기판 정보 (이미지 + 상태)
      !!(vehicleInfo.dashboardImageUris && vehicleInfo.dashboardImageUris.length > 0 && vehicleInfo.dashboardStatus),
      // 4. 차대번호 (이미지만, VinCheckBottomSheet 안에서 3개 체크박스는 별도 검증)
      !!(vehicleInfo.vehicleVinImageUris && vehicleInfo.vehicleVinImageUris.length > 0),
    ];

    return {
      completed: items.filter(Boolean).length,
      total: 4,
      isAllRequiredComplete: items.every(Boolean),
    };
  }, [watch('vehicleInfo')]);

  const calculateBatteryInfoCompletion = useCallback((): SectionCompletion => {
    const batteryInfo = watch('batteryInfo');

    const items = [
      !!batteryInfo.batterySOH,
      batteryInfo.batteryCellCount > 0,
      batteryInfo.batteryCells && batteryInfo.batteryCells.length > 0,
    ];

    return {
      completed: items.filter(Boolean).length,
      total: 3,
      isAllRequiredComplete: items.every(Boolean),
    };
  }, [watch('batteryInfo')]);

  const calculateMajorDevicesCompletion = useCallback((): SectionCompletion => {
    const majorDevices = watch('majorDevices');
    const hasElectrical = Object.values(majorDevices.electrical || {}).filter((item) => item && item.status).length > 0;

    return {
      completed: hasElectrical ? 1 : 0,
      total: 1,
      isAllRequiredComplete: hasElectrical,
    };
  }, [watch('majorDevices')]);

  const calculateVehicleExteriorCompletion = useCallback((): SectionCompletion => {
    const vehicleExterior = watch('vehicleExterior');

    const hasExteriorPhotos = Object.values(vehicleExterior.vehicleExterior || {}).filter((item) => typeof item === 'string' && item).length > 0;
    const hasBodyPanel = Array.isArray(vehicleExterior.bodyPanel) && vehicleExterior.bodyPanel.length > 0;
    const hasTiresWheels = Object.values(vehicleExterior.tiresAndWheels || {}).filter((item) => item && typeof item === 'object' && 'wheelStatus' in item && item.wheelStatus).length > 0;

    const items = [hasExteriorPhotos, hasBodyPanel, hasTiresWheels];

    return {
      completed: items.filter(Boolean).length,
      total: 3,
      isAllRequiredComplete: items.every(Boolean),
    };
  }, [watch('vehicleExterior')]);

  const calculateVehicleUndercarriageCompletion = useCallback((): SectionCompletion => {
    const vehicleUndercarriage = watch('vehicleUndercarriage');

    const hasSuspension = Object.values(vehicleUndercarriage.suspensionArms || {}).filter(Boolean).length > 0;
    const hasBatteryPack = Object.values(vehicleUndercarriage.underBatteryPack || {}).filter(Boolean).length > 0;
    const hasSteering = Object.values(vehicleUndercarriage.steering || {}).filter((item) => item && item.status).length > 0;
    const hasBraking = Object.values(vehicleUndercarriage.braking || {}).filter((item) => item && item.status).length > 0;

    const items = [hasSuspension, hasBatteryPack, hasSteering, hasBraking];

    return {
      completed: items.filter(Boolean).length,
      total: 4,
      isAllRequiredComplete: items.every(Boolean),
    };
  }, [watch('vehicleUndercarriage')]);

  const calculateVehicleInteriorCompletion = useCallback((): SectionCompletion => {
    const vehicleInterior = watch('vehicleInterior');

    const hasInterior = Object.values(vehicleInterior.interior || {}).filter((item) => item && item.status).length > 0;
    const hasAirconMotor = Object.values(vehicleInterior.airconMotor || {}).filter((item) => item && item.status).length > 0;
    const hasOptions = Object.values(vehicleInterior.options || {}).filter((item) => item && item.status).length > 0;
    const hasLighting = Object.values(vehicleInterior.lighting || {}).filter((item) => item && item.status).length > 0;
    const hasGlass = Object.values(vehicleInterior.glass || {}).filter((item) => item && item.status).length > 0;

    const items = [hasInterior, hasAirconMotor, hasOptions, hasLighting, hasGlass];

    return {
      completed: items.filter(Boolean).length,
      total: 5,
      isAllRequiredComplete: items.every(Boolean),
    };
  }, [watch('vehicleInterior')]);

  const calculateOtherCompletion = useCallback((): SectionCompletion => {
    const other = watch('other');
    const hasItems = other?.items && other.items.length > 0;

    return {
      completed: hasItems ? 1 : 0,
      total: 1,
      isAllRequiredComplete: true, // 선택사항이므로 항상 true
    };
  }, [watch('other')]);

  const isAllRequiredSectionsComplete = useMemo(() => {
    return (
      calculateVehicleInfoCompletion().isAllRequiredComplete &&
      calculateBatteryInfoCompletion().isAllRequiredComplete &&
      calculateMajorDevicesCompletion().isAllRequiredComplete &&
      calculateVehicleExteriorCompletion().isAllRequiredComplete &&
      calculateVehicleUndercarriageCompletion().isAllRequiredComplete &&
      calculateVehicleInteriorCompletion().isAllRequiredComplete
    );
  }, [
    // 🔥 함수 대신 실제 watch 값들을 dependency로 사용
    watch('vehicleInfo'),
    watch('batteryInfo'),
    watch('majorDevices'),
    watch('vehicleExterior'),
    watch('vehicleUndercarriage'),
    watch('vehicleInterior'),
  ]);

  const handleSubmit = async () => {
    if (!selectedUser) {
      Alert.alert('오류', '사용자 정보가 없습니다.');
      return;
    }

    // 🔥 최신 completion 값들을 직접 계산
    const vehicleInfoCompletion = calculateVehicleInfoCompletion();
    const batteryInfoCompletion = calculateBatteryInfoCompletion();
    const majorDevicesCompletion = calculateMajorDevicesCompletion();
    const vehicleExteriorCompletion = calculateVehicleExteriorCompletion();
    const vehicleUndercarriageCompletion = calculateVehicleUndercarriageCompletion();
    const vehicleInteriorCompletion = calculateVehicleInteriorCompletion();

    // 디버깅 정보
    console.log('📊 섹션별 완료 상태:', {
      vehicleInfo: vehicleInfoCompletion,
      batteryInfo: batteryInfoCompletion,
      majorDevices: majorDevicesCompletion,
      vehicleExterior: vehicleExteriorCompletion,
      vehicleUndercarriage: vehicleUndercarriageCompletion,
      vehicleInterior: vehicleInteriorCompletion,
    });

    // 미완성 섹션 리스트 생성
    const incompleteSections: Array<{ name: string; key: InspectionSection; completion: SectionCompletion }> = [];

    if (!vehicleInfoCompletion.isAllRequiredComplete) {
      incompleteSections.push({ name: '차량 기본 정보', key: 'vehicleInfo', completion: vehicleInfoCompletion });
    }
    if (!batteryInfoCompletion.isAllRequiredComplete) {
      incompleteSections.push({ name: '배터리 정보', key: 'batteryInfo', completion: batteryInfoCompletion });
    }
    if (!majorDevicesCompletion.isAllRequiredComplete) {
      incompleteSections.push({ name: '주요 장치', key: 'majorDevices', completion: majorDevicesCompletion });
    }
    if (!vehicleExteriorCompletion.isAllRequiredComplete) {
      incompleteSections.push({ name: '차량 외부 점검', key: 'vehicleExterior', completion: vehicleExteriorCompletion });
    }
    if (!vehicleUndercarriageCompletion.isAllRequiredComplete) {
      incompleteSections.push({ name: '차량 하부 점검', key: 'vehicleUndercarriage', completion: vehicleUndercarriageCompletion });
    }
    if (!vehicleInteriorCompletion.isAllRequiredComplete) {
      incompleteSections.push({ name: '차량 내부 점검', key: 'vehicleInterior', completion: vehicleInteriorCompletion });
    }

    if (incompleteSections.length > 0) {
      // 상세 정보 포함된 리스트 생성
      const sectionList = incompleteSections
        .map((s) => `• ${s.name} (${s.completion.completed}/${s.completion.total})`)
        .join('\n');

      Alert.alert(
        '미완성 항목',
        `다음 항목을 완료해주세요:\n\n${sectionList}`,
        [
          {
            text: '확인',
            onPress: () => {
              // 첫 번째 미완성 섹션 자동으로 펼치기
              const firstIncomplete = incompleteSections[0]!.key;
              if (!expandedSections[firstIncomplete]) {
                toggleSection(firstIncomplete);
              }
            },
          },
        ]
      );
      return;
    }

    const formData = methods.getValues();
    const success = await submitInspection(
      formData,
      selectedUser.uid,
      selectedUser.displayName || '',
      selectedUser.phoneNumber || '',
      selectedReservation?.id,              // ⭐ reservationId 전달
      currentUser?.uid,                     // ⭐ mechanicId 전달 (작성자)
      currentUser?.displayName || currentUser?.realName // ⭐ mechanicName 전달
    );

    if (success) {
      // ⭐ 예약 상태를 'pending_review'로 변경 (검수 대기)
      if (selectedReservation?.id) {
        try {
          await firebaseService.updateDiagnosisReservationStatus(
            selectedReservation.id,
            'pending_review'
          );
          console.log('✅ 예약 상태 업데이트 완료: pending_review');
        } catch (error) {
          console.error('❌ 예약 상태 업데이트 실패:', error);
          // 예약 상태 업데이트 실패는 치명적이지 않으므로 계속 진행
        }
      }

      // 제출 성공 시 draft 삭제
      await draftStorage.clearDraft(selectedUser.uid);
      await imageStorage.clearUserImages(selectedUser.uid);

      sentryLogger.log('✅ Draft 삭제 (제출 성공)', {
        userId: selectedUser.uid,
        userName: selectedUser.displayName,
      });

      handleBackToList();
    }
  };

  // Render Reservation List
  if (inspectionMode === 'reservation_list') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>차량 진단</Text>
          <View style={styles.headerRight} />
        </View>

        {isLoadingReservations ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#06B6D4" />
          </View>
        ) : (
          <FlatList<ReservationItem>
            data={reservations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.reservationList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              drafts.length > 0 ? (
                <View style={styles.draftsSection}>
                  <View style={styles.draftsSectionHeader}>
                    <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                    <Text style={styles.draftsSectionTitle}>임시저장 ({drafts.length}건)</Text>
                  </View>
                  {drafts.map((draft) => {
                    const now = new Date();
                    const elapsed = Math.floor((now.getTime() - draft.savedAt.getTime()) / 1000);
                    let timeAgo = '';
                    if (elapsed < 60) {
                      timeAgo = '방금';
                    } else if (elapsed < 3600) {
                      timeAgo = `${Math.floor(elapsed / 60)}분 전`;
                    } else if (elapsed < 86400) {
                      timeAgo = `${Math.floor(elapsed / 3600)}시간 전`;
                    } else {
                      timeAgo = `${Math.floor(elapsed / 86400)}일 전`;
                    }

                    return (
                      <TouchableOpacity
                        key={draft.userId}
                        style={styles.draftCard}
                        onPress={() => handleSelectDraft(draft)}
                      >
                        <View style={styles.draftCardContent}>
                          <View style={styles.draftInfoRow}>
                            <Text style={styles.draftLabel}>이름</Text>
                            <Text style={styles.draftValue}>{draft.userName}</Text>
                          </View>
                          <View style={styles.draftInfoRow}>
                            <Text style={styles.draftLabel}>전화</Text>
                            <Text style={styles.draftValue}>{draft.userPhone}</Text>
                          </View>
                          <View style={styles.draftInfoRow}>
                            <Text style={styles.draftLabel}>저장</Text>
                            <Text style={styles.draftTimeAgo}>{timeAgo}</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                      </TouchableOpacity>
                    );
                  })}
                  <View style={styles.draftsDivider} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>오늘 예약 없음</Text>
              </View>
            }
            renderItem={({ item: reservation }) => {
              const date =
                reservation.requestedDate instanceof Timestamp
                  ? reservation.requestedDate.toDate()
                  : reservation.requestedDate;
              const timeString = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

              return (
                <TouchableOpacity style={styles.reservationCard} onPress={() => handleSelectReservation(reservation)}>
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

        <TouchableOpacity style={styles.fab} onPress={handleStartManualInspection}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 사용자 정보 입력 모달 */}
        <Modal
          visible={isUserInfoModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsUserInfoModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboardView}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>사용자 정보 입력</Text>
                  <TouchableOpacity onPress={() => setIsUserInfoModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#1F2937" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalDescription}>
                  진단 리포트를 작성할 사용자의 정보를 입력해주세요.
                </Text>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>이름 *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="이름을 입력하세요"
                    placeholderTextColor="#9CA3AF"
                    value={manualUserName}
                    onChangeText={setManualUserName}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>전화번호 *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="010-1234-5678"
                    placeholderTextColor="#9CA3AF"
                    value={manualUserPhone}
                    onChangeText={setManualUserPhone}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setIsUserInfoModalVisible(false)}
                  >
                    <Text style={styles.modalButtonCancelText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handleConfirmUserInfo}
                  >
                    <Text style={styles.modalButtonConfirmText}>확인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Render Inspection Form
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
          isRequired && !isAllRequiredComplete && styles.sectionHeaderIncomplete,
        ]}
        onPress={() => toggleSection(section)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={24} color="#1F2937" />
          <Text style={styles.sectionHeaderTitle}>{title}</Text>
          {isRequired && <Text style={styles.requiredBadge}>필수</Text>}
        </View>
        <View style={styles.sectionHeaderRight}>
          <Text style={[styles.completionText, isAllRequiredComplete && styles.completionTextComplete]}>
            {completed}/{total}
          </Text>
          {isAllRequiredComplete && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FormProvider {...methods}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>진단 리포트 작성</Text>

          {/* 우측 상태 표시 */}
          <View style={styles.saveStatus}>
            {(() => {
              if (isSaving) {
                return (
                  <>
                    <ActivityIndicator size="small" color="#9CA3AF" />
                    <Text style={styles.saveStatusText}>저장중</Text>
                  </>
                );
              } else if (lastSaved) {
                // Google Docs/Notion 패턴: 저장 후 계속 표시 (isDirty 체크 없음!)
                const getTimeAgo = (date: Date) => {
                  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
                  if (seconds < 60) return '방금';
                  const minutes = Math.floor(seconds / 60);
                  if (minutes < 60) return `${minutes}분 전`;
                  const hours = Math.floor(minutes / 60);
                  return `${hours}시간 전`;
                };

                return (
                  <>
                    <Ionicons name="checkmark-circle" size={scale(14)} color="#9CA3AF" />
                    <View style={styles.saveStatusTextContainer}>
                      <Text style={styles.saveStatusText}>저장됨</Text>
                      <Text style={styles.saveStatusTime}>{getTimeAgo(lastSaved)}</Text>
                    </View>
                  </>
                );
              }
              return null;
            })()}
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + verticalScale(100) }}
        >
          {/* 사용자 정보 */}
          {selectedUser && (
            <View style={styles.userInfoSection}>
              <View style={styles.userInfoBadge}>
                {selectedUser.uid === currentUser?.uid || selectedUser.uid === 'temp_user' ? (
                  <>
                    <Ionicons name="person-outline" size={14} color="#EF4444" />
                    <Text style={[styles.userInfoBadgeText, { color: '#EF4444' }]}>비회원</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="person" size={14} color="#06B6D4" />
                    <Text style={[styles.userInfoBadgeText, { color: '#06B6D4' }]}>회원</Text>
                  </>
                )}
              </View>
              <View style={styles.userInfoDetails}>
                <View style={styles.userInfoRow}>
                  <Ionicons name="person-circle-outline" size={16} color="#6B7280" />
                  <Text style={styles.userInfoText}>{selectedUser.displayName || '이름 없음'}</Text>
                </View>
                <View style={styles.userInfoRow}>
                  <Ionicons name="call-outline" size={16} color="#6B7280" />
                  <Text style={styles.userInfoText}>{selectedUser.phoneNumber || '전화번호 없음'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Section 1: Vehicle Info */}
          {renderSectionHeader('차량 기본 정보', 'vehicleInfo', calculateVehicleInfoCompletion(), true)}
          <Animated.View
            style={[
              styles.sectionContent,
              {
                maxHeight: accordionAnimations.vehicleInfo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 2000],
                }),
                opacity: accordionAnimations.vehicleInfo,
              },
            ]}
          >
            {expandedSections.vehicleInfo && <VehicleInfoSection />}
          </Animated.View>

          {/* Section 2: Battery Info */}
          {renderSectionHeader('배터리 정보', 'batteryInfo', calculateBatteryInfoCompletion(), true)}
          <Animated.View
            style={[
              styles.sectionContent,
              {
                maxHeight: accordionAnimations.batteryInfo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 2000],
                }),
                opacity: accordionAnimations.batteryInfo,
              },
            ]}
          >
            {expandedSections.batteryInfo && <BatteryInfoSection />}
          </Animated.View>

          {/* Section 3: Major Devices */}
          {renderSectionHeader('주요 장치', 'majorDevices', calculateMajorDevicesCompletion(), true)}
          <Animated.View
            style={[
              styles.sectionContent,
              {
                maxHeight: accordionAnimations.majorDevices.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 2000],
                }),
                opacity: accordionAnimations.majorDevices,
              },
            ]}
          >
            {expandedSections.majorDevices && <MajorDevicesSection />}
          </Animated.View>

          {/* Section 4: Vehicle Exterior */}
          {renderSectionHeader('차량 외부 점검', 'vehicleExterior', calculateVehicleExteriorCompletion(), true)}
          <Animated.View
            style={[
              styles.sectionContent,
              {
                maxHeight: accordionAnimations.vehicleExterior.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 2000],
                }),
                opacity: accordionAnimations.vehicleExterior,
              },
            ]}
          >
            {expandedSections.vehicleExterior && <VehicleExteriorSection />}
          </Animated.View>

          {/* Section 5: Vehicle Undercarriage */}
          {renderSectionHeader('차량 하부 점검', 'vehicleUndercarriage', calculateVehicleUndercarriageCompletion(), true)}
          <Animated.View
            style={[
              styles.sectionContent,
              {
                maxHeight: accordionAnimations.vehicleUndercarriage.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 2000],
                }),
                opacity: accordionAnimations.vehicleUndercarriage,
              },
            ]}
          >
            {expandedSections.vehicleUndercarriage && <VehicleUndercarriageSection />}
          </Animated.View>

          {/* Section 6: Vehicle Interior ⭐ NEW */}
          {renderSectionHeader('차량 실내 점검', 'vehicleInterior', calculateVehicleInteriorCompletion(), true)}
          <Animated.View
            style={[
              styles.sectionContent,
              {
                maxHeight: accordionAnimations.vehicleInterior.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 2000],
                }),
                opacity: accordionAnimations.vehicleInterior,
              },
            ]}
          >
            {expandedSections.vehicleInterior && <VehicleInteriorSection />}
          </Animated.View>

          {/* Section 7: Other */}
          {renderSectionHeader('기타 점검', 'other', calculateOtherCompletion(), false)}
          <Animated.View
            style={[
              styles.sectionContent,
              {
                maxHeight: accordionAnimations.other.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 2000],
                }),
                opacity: accordionAnimations.other,
              },
            ]}
          >
            {expandedSections.other && <OtherSection />}
          </Animated.View>

          {/* 진단 수행 확인 */}
          <View style={styles.diagnosticianConfirmationSection}>
            <TouchableOpacity
              style={styles.diagnosticianConfirmationButton}
              onPress={() => setIsDiagnosticianModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.diagnosticianButtonContent}>
                <View style={styles.diagnosticianButtonLeft}>
                  <Ionicons
                    name={watch('diagnosticianConfirmation')?.confirmed ? "checkmark-circle" : "clipboard-outline"}
                    size={24}
                    color={watch('diagnosticianConfirmation')?.confirmed ? "#10B981" : "#6B7280"}
                  />
                  <View style={styles.diagnosticianButtonTextContainer}>
                    <Text style={styles.diagnosticianButtonLabel}>진단 수행 확인</Text>
                    {watch('diagnosticianConfirmation')?.confirmed ? (
                      <Text style={styles.diagnosticianButtonValue}>
                        {watch('diagnosticianConfirmation').diagnosticianName} · {new Date(watch('diagnosticianConfirmation').confirmedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                      </Text>
                    ) : (
                      <Text style={styles.diagnosticianButtonPlaceholder}>진단사 서명 및 확인이 필요합니다</Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.submitContainer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>리포트 제출</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 진단사 수행 확인 모달 */}
        <DiagnosticianConfirmationModal
          visible={isDiagnosticianModalVisible}
          onClose={() => setIsDiagnosticianModalVisible(false)}
          onConfirm={(data) => {
            methods.setValue('diagnosticianConfirmation', data, { shouldValidate: true });
          }}
          initialData={watch('diagnosticianConfirmation')}
        />
      </SafeAreaView>
    </FormProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(6),
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    width: scale(100),
    alignItems: 'flex-start',
  },
  headerRight: {
    width: scale(100),
  },
  headerTitle: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  saveStatus: {
    width: scale(100),
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: scale(4),
  },
  saveStatusTextContainer: {
    alignItems: 'flex-end',
  },
  saveStatusText: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    fontWeight: '500',
  },
  saveStatusTime: {
    fontSize: moderateScale(10),
    color: '#9CA3AF',
    marginTop: verticalScale(1),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reservationList: {
    padding: scale(16),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(64),
  },
  emptyStateText: {
    fontSize: moderateScale(16),
    color: '#9CA3AF',
    marginTop: verticalScale(16),
  },
  reservationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(16),
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: verticalScale(12),
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
  draftsSection: {
    marginBottom: verticalScale(16),
  },
  draftsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(12),
  },
  draftsSectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#6B7280',
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(16),
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    marginBottom: verticalScale(12),
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  draftCardContent: {
    flex: 1,
  },
  draftInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  draftLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#92400E',
    width: scale(44),
  },
  draftValue: {
    fontSize: moderateScale(14),
    color: '#78350F',
    flex: 1,
  },
  draftTimeAgo: {
    fontSize: moderateScale(14),
    color: '#D97706',
    fontWeight: '600',
    flex: 1,
  },
  draftsDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: verticalScale(8),
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
  },
  content: {
    paddingVertical:scale(16),
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    backgroundColor: '#FFFFFF',
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
  sectionHeaderTitle: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#1F2937',
  },
  requiredBadge: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: 4,
    marginLeft: scale(8),
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  completionText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#6B7280',
  },
  completionTextComplete: {
    color: '#10B981',
  },
  sectionContent: {
    overflow: 'hidden',
  },
  diagnosticianConfirmationSection: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(24),
  },
  diagnosticianConfirmationButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  diagnosticianButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diagnosticianButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    flex: 1,
  },
  diagnosticianButtonTextContainer: {
    flex: 1,
  },
  diagnosticianButtonLabel: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: verticalScale(4),
  },
  diagnosticianButtonValue: {
    fontSize: moderateScale(14),
    color: '#10B981',
    fontWeight: '600',
  },
  diagnosticianButtonPlaceholder: {
    fontSize: moderateScale(13),
    color: '#9CA3AF',
  },
  submitContainer: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  autoSaveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: verticalScale(12),
  },
  autoSaveText: {
    fontSize: moderateScale(13),
    color: '#10B981',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 사용자 정보 섹션 (스크롤 가능)
  userInfoSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: scale(16),
    marginTop: verticalScale(16),
    marginBottom: verticalScale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginBottom: verticalScale(8),
  },
  userInfoBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  userInfoDetails: {
    gap: verticalScale(6),
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  userInfoText: {
    fontSize: moderateScale(13),
    color: '#6B7280',
    fontWeight: '500',
  },
  // 사용자 정보 입력 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: scale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#1F2937',
  },
  modalDescription: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    marginBottom: verticalScale(20),
    lineHeight: 20,
  },
  modalInputGroup: {
    marginBottom: verticalScale(16),
  },
  modalInputLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: verticalScale(8),
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(16),
    color: '#1F2937',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: scale(12),
    marginTop: verticalScale(8),
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalButtonConfirm: {
    backgroundColor: '#06B6D4',
  },
  modalButtonCancelText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonConfirmText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default VehicleInspectionScreen;
