import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  TouchableOpacity,
  Linking,
  Modal,
  Image,
  Dimensions,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import { convertToLineSeedFont } from "../styles/fonts";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import firebaseService, {
  VehicleDiagnosisReport,
  BatteryCell,
  InspectionImageItem,
  AdditionalInspectionInfo,
  MajorDevicesInspection,
  MajorDeviceItem,
} from "../services/firebaseService";

import {
  handleError,
  handleFirebaseError,
  handleNetworkError,
  handleAuthError,
  showUserError,
} from "../services/errorHandler";
import { VehicleHistorySection } from "../components/diagnosis/sections/VehicleHistorySection";
import { AccidentRepairSection } from "../components/diagnosis/sections/AccidentRepairSection";
import { VehicleInteriorSection } from "../components/diagnosis/sections/VehicleInteriorSection";
import { DiagnosisReportImageCarousel } from "../components/diagnosis/DiagnosisReportImageCarousel";
import { VehicleBasicInfoSection } from "../components/diagnosis/sections/VehicleBasicInfoSection";
import { BatteryDiagnosisSection } from "../components/diagnosis/sections/BatteryDiagnosisSection";
import { MajorDevicesSection } from "../components/diagnosis/sections/MajorDevicesSection";
import { VehicleExteriorSection } from "../components/diagnosis/sections/VehicleExteriorSection";
import { VehicleStatusSection } from "../components/diagnosis/sections/VehicleStatusSection";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "VehicleDiagnosisReport"
>;

const VehicleDiagnosisReportScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { reportId } = route.params || {};
  const [report, setReport] = useState<VehicleDiagnosisReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<
    "cells" | "images" | "additional" | "uploads" | "vehicleUndercarriage" | null
  >(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageData, setSelectedImageData] =
    useState<InspectionImageItem | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );
  const [containerWidth, setContainerWidth] = useState(
    Dimensions.get("window").width
  );

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const animatedValue = new Animated.Value(0);
  const isMountedRef = useRef(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    if (!reportId) {
      Alert.alert("오류", "리포트 ID가 없습니다.");
      navigation.goBack();
      return;
    }

    try {
      setIsLoading(true);
      const reportData =
        await firebaseService.getVehicleDiagnosisReport(reportId);

      if (!reportData) {
        Alert.alert("오류", "리포트를 찾을 수 없습니다.");
        navigation.goBack();
        return;
      }

      setReport(reportData);

      // SOH 게이지 애니메이션 시작 (null인 경우 0)
      const sohValue = reportData.sohPercentage ?? 0;
      Animated.timing(animatedValue, {
        toValue: sohValue,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      // Firebase에서 셀 데이터가 없을 때 기본 데이터 생성 (cellCount가 있는 경우에만)
      if ((!reportData.cellsData || reportData.cellsData.length === 0) && reportData.cellCount) {
        // 기본 셀 데이터 생성 (총 cellCount 개수만큼, 모두 정상 상태)
        const tempCells: BatteryCell[] = [];
        for (let i = 1; i <= reportData.cellCount; i++) {
          tempCells.push({
            id: i,
            isDefective: false, // 기본값은 모두 정상
          });
        }

        reportData.cellsData = tempCells;
      }
    } catch (error) {
      handleError(error, "unknown", "medium", { actionName: "generic_error" }); // '리포트 로드 실패:'
      Alert.alert("오류", "리포트를 불러올 수 없습니다.");
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: unknown): string => {
    if (!timestamp) return "";

    try {
      let date: Date;

      if (
        typeof timestamp === "object" &&
        timestamp !== null &&
        "toDate" in timestamp &&
        typeof (timestamp as { toDate: () => Date }).toDate === "function"
      ) {
        date = (timestamp as { toDate: () => Date }).toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === "string") {
        date = new Date(timestamp);
      } else {
        return "";
      }

      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const openModal = (
    content: "cells" | "images" | "additional" | "uploads" | "vehicleUndercarriage"
  ) => {
    setModalContent(content);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalContent(null);
  };

  const openImageViewer = (imageData: InspectionImageItem) => {
    console.log("🖼️ 이미지 뷰어 열기:", imageData);
    setSelectedImageData(imageData);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    console.log("🔒 이미지 뷰어 닫기");
    setImageViewerVisible(false);
    setSelectedImageData(null);
  };

  const handleImageError = (imageUrl: string) => {
    setImageLoadErrors((prev) => new Set([...prev, imageUrl]));
  };

  const isImageLoadError = (imageUrl: string) => {
    return imageLoadErrors.has(imageUrl);
  };

  const isSVGFile = (url: string) => {
    return url.toLowerCase().includes(".svg");
  };

  const handleScroll = (event: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const slideSize = containerWidth;
    const currentIndex = Math.round(
      event.nativeEvent.contentOffset.x / slideSize
    );
    setCurrentImageIndex(currentIndex);
  };

  const openPDFFile = async (fileUrl: string, fileName: string) => {
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert("알림", "파일을 열 수 없습니다.");
      }
    } catch (error) {
      console.error("PDF 파일 열기 오류:", error);
      Alert.alert("오류", "PDF 파일을 여는 중 오류가 발생했습니다.");
    }
  };

  const getHealthColor = (soh: number) => {
    if (soh >= 80) return "#06B6D4"; // 브랜드 색상 - 좋음/보통
    return "#06B6D4"; // 브랜드 다크 색상 - 주의/교체 필요
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="차량 진단 리포트"
          showLogo={false}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <LoadingSpinner
          visible={true}
          message="리포트를 불러오는 중..."
          overlay={false}
        />
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="차량 진단 리포트"
          showLogo={false}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>리포트를 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 이미지 슬라이더 (노치까지) */}
        <DiagnosisReportImageCarousel
          report={report}
          animationDelay={0}
          onBackPress={() => navigation.goBack()}
        />

        {/* 나머지 콘텐츠 (여백 포함) */}
        <View style={styles.contentPadding}>
          {/* 차량 기본 정보 */}
          <VehicleBasicInfoSection report={report} />

          {/* 차량 상태 확인 */}
          <VehicleStatusSection
            isVinVerified={report.isVinVerified}
            hasNoIllegalModification={report.hasNoIllegalModification}
            hasNoFloodDamage={report.hasNoFloodDamage}
            dashboardStatus={report.dashboardStatus}
            dashboardIssueDescription={report.dashboardIssueDescription}
            vehicleVinImageUris={report.vehicleVinImageUris}
            dashboardImageUris={report.dashboardImageUris}
          />

          {/* 배터리 진단 정보 */}
          <BatteryDiagnosisSection report={report} />

          {/* 주요 장치 검사 */}
          <MajorDevicesSection data={report.majorDevicesInspection} />

          {/* 차량 외부 점검 */}
          <VehicleExteriorSection data={report.vehicleExteriorInspection} />

          {/* 차량 내부 검사 */}
          <VehicleInteriorSection data={report.vehicleInteriorInspection} />

          {/* 차량 이력 정보 */}
          <VehicleHistorySection data={report.vehicleHistoryInfo} />

          {/* 사고/수리 이력 */}
          <AccidentRepairSection data={report.accidentRepairHistory} />

          <Animatable.View
            animation="fadeInUp"
            duration={400}
            delay={900}
            style={styles.actionContainer}
          >
            {/* 사고이력 - 숨김 처리 */}
            {/* {report.uploadedFiles && report.uploadedFiles.length > 0 && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => openModal("uploads")}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="warning" size={32} color="#6B7280" />
                </View>
                <Text
                  style={[
                    styles.actionTitle,
                    convertToLineSeedFont(styles.actionTitle),
                  ]}
                >
                  사고이력
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    convertToLineSeedFont(styles.actionSubtitle),
                  ]}
                >
                  {report.uploadedFiles.length}개 파일
                </Text>
              </TouchableOpacity>
            )} */}
          </Animatable.View>
        </View>
      </ScrollView>

      {/* 모달 */}
      <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={closeModal}
          presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        >
          <View style={styles.modalContainer}>
            {/* Header - VehicleHistoryDetailModal 스타일 통합 */}
            <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'android' ? insets.top + 12 : 12 }]}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeModal}
              >
                <Ionicons name="close" size={28} color="#1F2937" />
              </TouchableOpacity>
              <Text
                style={[
                  styles.modalTitle,
                  convertToLineSeedFont(styles.modalTitle),
                ]}
              >
                {modalContent === "cells" && `배터리 셀 상태 (${report?.cellCount || 0}개)`}
                {modalContent === "vehicleUndercarriage" && "차량 하부 점검"}
                {modalContent === "images" && "검사 이미지"}
                {modalContent === "additional" && "추가 검사 정보"}
                {modalContent === "uploads" && "사고이력"}
              </Text>
              <View style={styles.modalPlaceholder} />
            </View>

            <ScrollView
              style={styles.modalScrollContent}
              contentContainerStyle={{ paddingVertical: 16, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
                {modalContent === "cells" && report?.cellsData && (
                  <>
                    {/* 전압 통계 정보 */}
                    {(() => {
                      const voltages = report.cellsData
                        .map((cell) =>
                          cell.voltage ? Number(cell.voltage) : 3.7
                        )
                        .filter((v) => v > 0);

                      if (voltages.length > 0) {
                        // 데이터베이스에서 제공하는 값 우선 사용, 없으면 계산
                        const maxVoltage =
                          report.maxVoltage || Math.max(...voltages);
                        const minVoltage =
                          report.minVoltage || Math.min(...voltages);
                        const avgVoltage =
                          voltages.reduce((sum, v) => sum + v, 0) /
                          voltages.length;
                        const avgVoltageDiff =
                          voltages.reduce(
                            (sum, v) => sum + Math.abs(v - avgVoltage),
                            0
                          ) / voltages.length;

                        return (
                          <View style={styles.voltageStatsContainer}>
                            <View style={styles.voltageStatRow}>
                              <View style={styles.voltageStatItem}>
                                <Text
                                  style={[
                                    styles.voltageStatLabel,
                                    convertToLineSeedFont(
                                      styles.voltageStatLabel
                                    ),
                                  ]}
                                >
                                  최고 전압
                                </Text>
                                <Text
                                  style={[
                                    styles.voltageStatValue,
                                    convertToLineSeedFont(
                                      styles.voltageStatValue
                                    ),
                                  ]}
                                >
                                  {maxVoltage.toFixed(2)}V
                                </Text>
                              </View>
                              <View style={styles.voltageStatItem}>
                                <Text
                                  style={[
                                    styles.voltageStatLabel,
                                    convertToLineSeedFont(
                                      styles.voltageStatLabel
                                    ),
                                  ]}
                                >
                                  최저 전압
                                </Text>
                                <Text
                                  style={[
                                    styles.voltageStatValue,
                                    convertToLineSeedFont(
                                      styles.voltageStatValue
                                    ),
                                  ]}
                                >
                                  {minVoltage.toFixed(2)}V
                                </Text>
                              </View>
                            </View>
                            <View style={styles.voltageStatRow}>
                              <View style={styles.voltageStatItem}>
                                <Text
                                  style={[
                                    styles.voltageStatLabel,
                                    convertToLineSeedFont(
                                      styles.voltageStatLabel
                                    ),
                                  ]}
                                >
                                  평균 전압
                                </Text>
                                <Text
                                  style={[
                                    styles.voltageStatValue,
                                    convertToLineSeedFont(
                                      styles.voltageStatValue
                                    ),
                                  ]}
                                >
                                  {avgVoltage.toFixed(2)}V
                                </Text>
                              </View>
                              <View style={styles.voltageStatItem}>
                                <Text
                                  style={[
                                    styles.voltageStatLabel,
                                    convertToLineSeedFont(
                                      styles.voltageStatLabel
                                    ),
                                  ]}
                                >
                                  평균 전압차
                                </Text>
                                <Text
                                  style={[
                                    styles.voltageStatValue,
                                    avgVoltageDiff > 0.05
                                      ? styles.voltageStatValueDanger
                                      : styles.voltageStatValueNormal,
                                    convertToLineSeedFont(
                                      styles.voltageStatValue
                                    ),
                                  ]}
                                >
                                  {avgVoltageDiff.toFixed(3)}V
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      }
                      return null;
                    })()}

                    <View style={styles.cellLegend}>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            {
                              backgroundColor: "#E0F7FA",
                              borderColor: "#06B6D4",
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.legendText,
                            convertToLineSeedFont(styles.legendText),
                          ]}
                        >
                          정상 셀
                        </Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            {
                              backgroundColor: "#F8F9FA",
                              borderColor: "#06B6D4",
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.legendText,
                            convertToLineSeedFont(styles.legendText),
                          ]}
                        >
                          불량 셀
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cellGrid}>
                      {report.cellsData.map((cell) => (
                        <View
                          key={cell.id}
                          style={[
                            styles.cellItem,
                            {
                              backgroundColor: cell.isDefective
                                ? "#F8F9FA"
                                : "#E0F7FA",
                              borderColor: cell.isDefective
                                ? "#06B6D4"
                                : "#06B6D4",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cellNumber,
                              {
                                color: cell.isDefective ? "#06B6D4" : "#06B6D4",
                              },
                              convertToLineSeedFont(styles.cellNumber),
                            ]}
                          >
                            {cell.id}
                          </Text>
                          <Text
                            style={[
                              styles.cellVoltage,
                              {
                                color: cell.isDefective ? "#06B6D4" : "#06B6D4",
                              },
                              convertToLineSeedFont(styles.cellVoltage),
                            ]}
                          >
                            {cell.voltage
                              ? Number(cell.voltage).toFixed(1)
                              : "3.7"}
                            V
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* 차량 하부 점검 모달 내용 */}
                {modalContent === "vehicleUndercarriage" &&
                  report?.vehicleUndercarriageInspection && (
                    <View style={styles.modalSection}>
                      {/* 조향 (Steering) */}
                      {report.vehicleUndercarriageInspection.steering &&
                        Object.keys(report.vehicleUndercarriageInspection.steering).length > 0 && (
                          <View style={{ marginBottom: 24 }}>
                            <Text
                              style={[
                                styles.modalSectionTitle,
                                convertToLineSeedFont(styles.modalSectionTitle),
                              ]}
                            >
                              조향
                            </Text>
                            {Object.entries(report.vehicleUndercarriageInspection.steering).map(
                              ([key, item]) =>
                                item && (
                                  <View key={key} style={styles.majorDeviceItem}>
                                    <Text
                                      style={[
                                        styles.majorDeviceItemName,
                                        convertToLineSeedFont(styles.majorDeviceItemName),
                                      ]}
                                    >
                                      {item.name}
                                    </Text>
                                    {item.imageUris && item.imageUris.length > 0 && (
                                      <View style={{ gap: 8 }}>
                                        {item.imageUris.map((uri, idx) => (
                                          <Image
                                            key={idx}
                                            source={{ uri }}
                                            style={styles.majorDeviceItemImage}
                                            resizeMode="cover"
                                          />
                                        ))}
                                      </View>
                                    )}
                                    <View style={styles.majorDeviceItemStatus}>
                                      <View
                                        style={[
                                          styles.majorDeviceStatusBadge,
                                          item.status === "good"
                                            ? styles.majorDeviceStatusGood
                                            : styles.majorDeviceStatusProblem,
                                        ]}
                                      >
                                        <Ionicons
                                          name={
                                            item.status === "good"
                                              ? "checkmark-circle"
                                              : "alert-circle"
                                          }
                                          size={16}
                                          color={item.status === "good" ? "#06B6D4" : "#EF4444"}
                                        />
                                        <Text
                                          style={[
                                            styles.majorDeviceStatusText,
                                            item.status === "good"
                                              ? styles.majorDeviceStatusTextGood
                                              : styles.majorDeviceStatusTextProblem,
                                            convertToLineSeedFont(styles.majorDeviceStatusText),
                                          ]}
                                        >
                                          {item.status === "good" ? "양호" : "문제 있음"}
                                        </Text>
                                      </View>
                                    </View>
                                    {item.status === "problem" && item.issueDescription && (
                                      <View style={styles.majorDeviceIssueContainer}>
                                        <Text
                                          style={[
                                            styles.majorDeviceIssueLabel,
                                            convertToLineSeedFont(styles.majorDeviceIssueLabel),
                                          ]}
                                        >
                                          문제 내용:
                                        </Text>
                                        <Text
                                          style={[
                                            styles.majorDeviceIssueText,
                                            convertToLineSeedFont(styles.majorDeviceIssueText),
                                          ]}
                                        >
                                          {item.issueDescription}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                )
                            )}
                          </View>
                        )}

                      {/* 제동 (Braking) */}
                      {report.vehicleUndercarriageInspection.braking &&
                        Object.keys(report.vehicleUndercarriageInspection.braking).length > 0 && (
                          <View style={{ marginBottom: 24 }}>
                            <Text
                              style={[
                                styles.modalSectionTitle,
                                convertToLineSeedFont(styles.modalSectionTitle),
                              ]}
                            >
                              제동
                            </Text>
                            {Object.entries(report.vehicleUndercarriageInspection.braking).map(
                              ([key, item]) =>
                                item && (
                                  <View key={key} style={styles.majorDeviceItem}>
                                    <Text
                                      style={[
                                        styles.majorDeviceItemName,
                                        convertToLineSeedFont(styles.majorDeviceItemName),
                                      ]}
                                    >
                                      {item.name}
                                    </Text>
                                    {item.imageUris && item.imageUris.length > 0 && (
                                      <View style={{ gap: 8 }}>
                                        {item.imageUris.map((uri, idx) => (
                                          <Image
                                            key={idx}
                                            source={{ uri }}
                                            style={styles.majorDeviceItemImage}
                                            resizeMode="cover"
                                          />
                                        ))}
                                      </View>
                                    )}
                                    <View style={styles.majorDeviceItemStatus}>
                                      <View
                                        style={[
                                          styles.majorDeviceStatusBadge,
                                          item.status === "good"
                                            ? styles.majorDeviceStatusGood
                                            : styles.majorDeviceStatusProblem,
                                        ]}
                                      >
                                        <Ionicons
                                          name={
                                            item.status === "good"
                                              ? "checkmark-circle"
                                              : "alert-circle"
                                          }
                                          size={16}
                                          color={item.status === "good" ? "#06B6D4" : "#EF4444"}
                                        />
                                        <Text
                                          style={[
                                            styles.majorDeviceStatusText,
                                            item.status === "good"
                                              ? styles.majorDeviceStatusTextGood
                                              : styles.majorDeviceStatusTextProblem,
                                            convertToLineSeedFont(styles.majorDeviceStatusText),
                                          ]}
                                        >
                                          {item.status === "good" ? "양호" : "문제 있음"}
                                        </Text>
                                      </View>
                                    </View>
                                    {item.status === "problem" && item.issueDescription && (
                                      <View style={styles.majorDeviceIssueContainer}>
                                        <Text
                                          style={[
                                            styles.majorDeviceIssueLabel,
                                            convertToLineSeedFont(styles.majorDeviceIssueLabel),
                                          ]}
                                        >
                                          문제 내용:
                                        </Text>
                                        <Text
                                          style={[
                                            styles.majorDeviceIssueText,
                                            convertToLineSeedFont(styles.majorDeviceIssueText),
                                          ]}
                                        >
                                          {item.issueDescription}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                )
                            )}
                          </View>
                        )}

                      {/* 서스펜션 암 사진 */}
                      {report.vehicleUndercarriageInspection.suspensionArms &&
                        Object.keys(report.vehicleUndercarriageInspection.suspensionArms).length > 0 && (
                          <View style={{ marginBottom: 24 }}>
                            <Text
                              style={[
                                styles.modalSectionTitle,
                                convertToLineSeedFont(styles.modalSectionTitle),
                              ]}
                            >
                              서스펜션 암 검사
                            </Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                              {Object.entries(report.vehicleUndercarriageInspection.suspensionArms).map(
                                ([position, imageUri]) =>
                                  imageUri && (
                                    <View key={position} style={{ width: "48%" }}>
                                      <Text
                                        style={[
                                          styles.majorDeviceItemName,
                                          convertToLineSeedFont(styles.majorDeviceItemName),
                                          { marginBottom: 8 },
                                        ]}
                                      >
                                        {position === "driverFrontWheel"
                                          ? "운전석 앞 휠"
                                          : position === "driverRearWheel"
                                          ? "운전석 뒤 휠"
                                          : position === "passengerRearWheel"
                                          ? "조수석 뒤 휠"
                                          : "조수석 앞 휠"}
                                      </Text>
                                      <Image
                                        source={{ uri: imageUri }}
                                        style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 8 }}
                                        resizeMode="cover"
                                      />
                                    </View>
                                  )
                              )}
                            </View>
                          </View>
                        )}

                      {/* 하부 배터리 팩 사진 */}
                      {report.vehicleUndercarriageInspection.underBatteryPack &&
                        Object.keys(report.vehicleUndercarriageInspection.underBatteryPack).length > 0 && (
                          <View style={{ marginBottom: 24 }}>
                            <Text
                              style={[
                                styles.modalSectionTitle,
                                convertToLineSeedFont(styles.modalSectionTitle),
                              ]}
                            >
                              하부 배터리 팩 사진
                            </Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                              {Object.entries(report.vehicleUndercarriageInspection.underBatteryPack).map(
                                ([position, imageUri]) =>
                                  imageUri && (
                                    <View key={position} style={{ width: "48%" }}>
                                      <Text
                                        style={[
                                          styles.majorDeviceItemName,
                                          convertToLineSeedFont(styles.majorDeviceItemName),
                                          { marginBottom: 8 },
                                        ]}
                                      >
                                        {position === "front"
                                          ? "전면"
                                          : position === "leftSide"
                                          ? "좌측"
                                          : position === "rear"
                                          ? "후면"
                                          : "우측"}
                                      </Text>
                                      <Image
                                        source={{ uri: imageUri }}
                                        style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 8 }}
                                        resizeMode="cover"
                                      />
                                    </View>
                                  )
                              )}
                            </View>
                          </View>
                        )}
                    </View>
                  )}

                {modalContent === "images" &&
                  report?.comprehensiveInspection?.inspectionImages && (
                    <View
                      style={{ flex: 1 }}
                      onLayout={(e) => {
                        setContainerWidth(e.nativeEvent.layout.width);
                      }}
                    >
                      <FlatList
                        data={report.comprehensiveInspection.inspectionImages}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        getItemLayout={(data, index) => ({
                          length: containerWidth,
                          offset: containerWidth * index,
                          index,
                        })}
                        renderItem={({ item: imageItem, index }) => (
                          <View
                            style={[
                              styles.imageCardWrapper,
                              { width: containerWidth },
                            ]}
                          >
                            <TouchableOpacity
                              style={styles.imageCard}
                              onPress={() => {
                                openImageViewer(imageItem);
                              }}
                              activeOpacity={0.8}
                              delayPressIn={0}
                            >
                              {isSVGFile(imageItem.imageUrl) ||
                              isImageLoadError(imageItem.imageUrl) ? (
                                <View
                                  style={[
                                    styles.imageCardImageFull,
                                    styles.imageCardPlaceholder,
                                  ]}
                                >
                                  <Ionicons
                                    name={
                                      isSVGFile(imageItem.imageUrl)
                                        ? "document-text"
                                        : "image"
                                    }
                                    size={40}
                                    color="#06B6D4"
                                  />
                                  <Text style={styles.imageCardPlaceholderText}>
                                    {isSVGFile(imageItem.imageUrl)
                                      ? "SVG 파일"
                                      : "이미지 파일"}
                                  </Text>
                                </View>
                              ) : (
                                <View
                                  style={styles.imageCardImageFull}
                                  pointerEvents="none"
                                >
                                  <Image
                                    source={{ uri: imageItem.imageUrl }}
                                    style={{ width: "100%", height: "100%" }}
                                    resizeMode="cover"
                                    onError={() =>
                                      handleImageError(imageItem.imageUrl)
                                    }
                                  />
                                </View>
                              )}

                              {/* 확대 아이콘 */}
                              <View
                                style={styles.imageCardOverlay}
                                pointerEvents="none"
                              >
                                <Ionicons
                                  name="expand"
                                  size={24}
                                  color="#FFFFFF"
                                />
                              </View>
                            </TouchableOpacity>

                            {/* 카테고리 및 상태 정보 */}
                            <View style={styles.imageCardInfo}>
                              <View style={styles.imageCardDivider} />
                              <Text
                                style={[
                                  styles.imageCardCategoryText,
                                  convertToLineSeedFont(
                                    styles.imageCardCategoryText
                                  ),
                                ]}
                              >
                                {imageItem.category}
                              </Text>
                              <Text
                                style={[
                                  styles.imageCardSeverityText,
                                  convertToLineSeedFont(
                                    styles.imageCardSeverityText
                                  ),
                                ]}
                              >
                                {imageItem.severity}
                              </Text>
                            </View>
                          </View>
                        )}
                      />

                      {/* 네비게이션 인디케이터 */}
                      {report.comprehensiveInspection.inspectionImages.length >
                        1 && (
                        <View style={styles.indicatorContainer}>
                          {report.comprehensiveInspection.inspectionImages.map(
                            (_, index) => (
                              <View
                                key={index}
                                style={[
                                  styles.indicator,
                                  {
                                    backgroundColor:
                                      currentImageIndex === index
                                        ? "#06B6D4"
                                        : "#E5E7EB",
                                    width: currentImageIndex === index ? 16 : 8,
                                  },
                                ]}
                              />
                            )
                          )}
                        </View>
                      )}
                    </View>
                  )}

                {modalContent === "additional" &&
                  report?.comprehensiveInspection?.additionalInfo && (
                    <View style={styles.modalSection}>
                      <Text
                        style={[
                          styles.modalSectionTitle,
                          convertToLineSeedFont(styles.modalSectionTitle),
                        ]}
                      >
                        추가 검사 정보 (
                        {report.comprehensiveInspection.additionalInfo.length}
                        개)
                      </Text>
                      {report.comprehensiveInspection.additionalInfo.map(
                        (info: AdditionalInspectionInfo, index: number) => (
                          <View key={index} style={styles.modalInspectionItem}>
                            <View style={styles.inspectionRow}>
                              <Text
                                style={[
                                  styles.inspectionLocation,
                                  convertToLineSeedFont(
                                    styles.inspectionLocation
                                  ),
                                ]}
                              >
                                {info.title}
                              </Text>
                              <View style={styles.inspectionBadge}>
                                <Text
                                  style={[
                                    styles.inspectionBadgeText,
                                    convertToLineSeedFont(
                                      styles.inspectionBadgeText
                                    ),
                                  ]}
                                >
                                  {info.severity}
                                </Text>
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.inspectionLabel,
                                convertToLineSeedFont(styles.inspectionLabel),
                              ]}
                            >
                              {info.content}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  )}

                {modalContent === "uploads" && report?.uploadedFiles && (
                  <View style={styles.modalSection}>
                    <Text
                      style={[
                        styles.modalSectionTitle,
                        convertToLineSeedFont(styles.modalSectionTitle),
                      ]}
                    >
                      사고이력 ({report.uploadedFiles.length}개)
                    </Text>
                    {report.uploadedFiles.map((file, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.modalInspectionItem}
                        onPress={() =>
                          openPDFFile(file.fileUrl, file.fileName)
                        }
                        activeOpacity={0.7}
                      >
                        <View style={styles.inspectionRow}>
                          <Text
                            style={[
                              styles.inspectionLocation,
                              convertToLineSeedFont(
                                styles.inspectionLocation
                              ),
                            ]}
                          >
                            {file.fileName}
                          </Text>
                          <Ionicons
                            name="open-outline"
                            size={20}
                            color="#06B6D4"
                          />
                        </View>
                        <Text
                          style={[
                            styles.inspectionLabel,
                            convertToLineSeedFont(styles.inspectionLabel),
                          ]}
                        >
                          크기: {(file.fileSize / 1024 / 1024).toFixed(1)}MB
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>

            {/* 전체화면 이미지 뷰어 - 모달 내부 오버레이 */}
            {imageViewerVisible && selectedImageData && (
              <View style={styles.fullScreenImageViewerOverlay}>
                <View style={[styles.fullScreenImageViewerContainer, { paddingTop: insets.top }]}>
                  <View style={styles.fullScreenImageViewerHeader}>
                    <TouchableOpacity
                      style={styles.fullScreenImageViewerCloseButton}
                      onPress={closeImageViewer}
                    >
                      <Ionicons name="close" size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fullScreenImageViewerContent}>
                    <Image
                      source={{ uri: selectedImageData.imageUrl }}
                      style={styles.fullScreenImageViewerImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },

  // Vehicle Section
  vehicleSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  vehicleCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#06B6D4",
    marginBottom: 6,
  },
  vehicleDetails: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  vehicleVin: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // SOH Main Section (Card Design - Matching statItem style)
  sohMainSection: {
    marginBottom: 12,
  },
  sohCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sohContent: {
    flex: 1,
    justifyContent: "center",
  },
  sohMainLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#06B6D4",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sohSubLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF",
    letterSpacing: 0.2,
  },
  sohValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sohValueText: {
    fontSize: 48,
    fontWeight: "700",
  },
  sohUnitText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#9CA3AF",
    marginLeft: 2,
  },

  // SOH Section
  sohSection: {
    alignItems: "center",
  },
  sohTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 20,
  },
  gaugeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  circularGauge: {
    width: 100,
    height: 100,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  // Section Cards
  sectionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionGradient: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#06B6D4",
    marginLeft: 12,
  },
  sectionContent: {
    marginTop: 20,
  },

  // Info Grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  infoValueDanger: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },

  // Cell Visualization
  cellVisualization: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },

  // Inspection Items
  inspectionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    marginBottom: 8,
  },
  inspectionLocation: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#06B6D4",
  },
  inspectionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#06B6D4",
    marginHorizontal: 12,
  },
  inspectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
  },
  inspectionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  // PDF Files
  pdfItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    marginBottom: 8,
  },
  pdfIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfFileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  pdfFileSize: {
    fontSize: 12,
    color: "#6B7280",
  },

  // Battery Overview
  batteryOverview: {
    paddingTop: 20,
  },
  sohLabel: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
    textAlign: "center",
  },
  sohDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sohValue: {
    fontSize: 60,
    fontWeight: "700",
  },
  sohBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sohStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  quickStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statItem: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    textAlign: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  statValueNormal: {
    color: "#06B6D4",
  },
  statValueDanger: {
    color: "#06B6D4",
  },
  errorSection: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 12,
  },
  errorCodes: {
    gap: 8,
  },
  errorCode: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorCodeText: {
    fontSize: 13,
    color: "#7F1D1D",
    fontWeight: "500",
  },
  evaluationSection: {
    marginTop: 6,
  },
  evaluationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  evaluationText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    letterSpacing: -0.2,
  },

  // Detail Button
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  detailButtonText: {
    fontSize: 12,
    color: "#06B6D4",
    fontWeight: "500",
    marginRight: 4,
  },

  // Action Items (HomeScreen 스타일과 동일)
  actionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 20,
    paddingHorizontal: 4,
  },
  actionItem: {
    width: "48%",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  fileListContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Cell Grid Enhanced
  cellGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginVertical: 16,
  },
  cellItem: {
    width: 58,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
  },
  cellNumber: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  cellVoltage: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalPlaceholder: {
    width: 40,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
  },
  modalSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#06B6D4",
    marginBottom: 16,
  },
  modalInspectionItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inspectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inspectionLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  cellLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
  },

  // Voltage Statistics
  voltageStatsContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  voltageStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  voltageStatItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  voltageStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    textAlign: "center",
  },
  voltageStatValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#06B6D4",
    textAlign: "center",
  },
  voltageStatValueNormal: {
    color: "#06B6D4",
  },
  voltageStatValueDanger: {
    color: "#06B6D4",
  },

  // Inspection Image Styles
  inspectionImageContainer: {
    width: 80,
    height: 80,
    marginRight: 12,
  },
  inspectionImageWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  inspectionImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 10,
    color: "#06B6D4",
    fontWeight: "500",
    marginTop: 4,
  },
  imageOverlay: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  inspectionContentContainer: {
    flex: 1,
  },
  inspectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  // Full Screen Image Viewer
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  imageViewerContainer: {
    flex: 1,
  },
  imageViewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  imageViewerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 16,
  },
  imageViewerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  fullScreenImage: {
    width: Dimensions.get("window").width - 40,
    height: Dimensions.get("window").height - 200,
  },
  fullScreenPlaceholder: {
    backgroundColor: "rgba(248, 250, 252, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(6, 182, 212, 0.3)",
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreenPlaceholderText: {
    fontSize: 18,
    color: "#06B6D4",
    fontWeight: "500",
    marginTop: 16,
    textAlign: "center",
  },
  viewFileButton: {
    backgroundColor: "#06B6D4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  viewFileButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Image Carousel Styles
  imageCardWrapper: {
    paddingHorizontal: 0,
  },

  imageCard: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    position: "relative",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  imageCardImageWrapper: {
    position: "relative",
  },
  imageCardImage: {
    width: "100%",
    height: "auto",
  },
  imageCardImageFull: {
    width: "100%",
    height: "100%",
  },
  imageCardPlaceholder: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#000000",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  imageCardPlaceholderText: {
    fontSize: 14,
    color: "#06B6D4",
    fontWeight: "500",
    marginTop: 8,
  },
  imageCardInfo: {
    paddingTop: 20,
    paddingHorizontal: 0,
  },
  imageCardDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  imageCardCategoryText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#06B6D4",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  imageCardSeverityText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
    lineHeight: 20,
  },
  imageCardOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  imageCardContent: {
    padding: 0,
  },
  imageCardHeader: {
    marginBottom: 12,
  },
  imageCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#06B6D4",
    marginBottom: 8,
  },
  imageCardBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCardBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  imageCardDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  imageCardLocation: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },

  // Full Screen Image Viewer (Independent Overlay)
  fullScreenImageViewerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.98)",
    zIndex: 999999,
    elevation: 999999,
  },
  fullScreenImageViewerContainer: {
    flex: 1,
  },
  fullScreenImageViewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fullScreenImageViewerInfo: {
    flex: 1,
  },
  fullScreenImageViewerBadges: {
    flexDirection: "row",
    gap: 8,
  },
  fullScreenCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(6, 182, 212, 0.9)",
  },
  fullScreenCategoryBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  fullScreenSeverityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(107, 114, 128, 0.9)",
  },
  fullScreenSeverityBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  fullScreenImageViewerCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImageViewerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  fullScreenImageViewerImage: {
    width: "100%",
    height: "80%",
  },

  // Technical Data Section
  technicalDataSection: {
    marginBottom: 20,
  },
  dataTable: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  dataLabel: {
    flex: 1,
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  dataValue: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600",
  },
  dataValueDanger: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "600",
  },

  // Analysis Section
  analysisSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  analysisContent: {
    marginTop: 12,
  },
  analysisItem: {
    marginBottom: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#06B6D4",
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
  },

  // Professional Table
  professionalTable: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tableCellText: {
    flex: 1,
    fontSize: 12,
    color: "#4B5563",
    textAlign: "center",
  },
  tableCellNumber: {
    flex: 1,
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "600",
    textAlign: "center",
  },
  tableCellStatus: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  // File Info
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  // Section Styles (추가)
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTouchable: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  // 이미지 캐러셀 인디케이터
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 6,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },

  // PDF 미리보기 스타일
  pdfPreviewContainer: {
    marginBottom: 16,
  },
  pdfPreviewWrapper: {
    position: "relative",
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pdfPreview: {
    width: "100%",
    height: Dimensions.get("window").height * 0.4,
  },
  pdfOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  pdfOverlayContent: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pdfOverlayText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  pdfLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  pdfLoadingText: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Major Device Styles
  majorDeviceItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  majorDeviceItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  majorDeviceItemImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  majorDeviceItemStatus: {
    marginBottom: 8,
  },
  majorDeviceStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  majorDeviceStatusGood: {
    backgroundColor: "#F0FDF4",
  },
  majorDeviceStatusProblem: {
    backgroundColor: "#FEF2F2",
  },
  majorDeviceStatusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  majorDeviceStatusTextGood: {
    color: "#06B6D4",
  },
  majorDeviceStatusTextProblem: {
    color: "#EF4444",
  },
  majorDeviceIssueContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  majorDeviceIssueLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
    marginBottom: 6,
  },
  majorDeviceIssueText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});

export default VehicleDiagnosisReportScreen;
