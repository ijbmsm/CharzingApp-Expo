import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
  TouchableOpacity,
  Linking,
  Modal,
  Image,
  Dimensions,
  FlatList,
} from "react-native";
import Pdf from "react-native-pdf";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import { convertToLineSeedFont } from "../styles/fonts";
import Header from "../components/Header";
import LoadingSpinner from "../components/LoadingSpinner";
import firebaseService, {
  VehicleDiagnosisReport,
  BatteryCell,
  InspectionImageItem,
  AdditionalInspectionInfo,
  PDFInspectionReport,
} from "../services/firebaseService";

import {
  handleError,
  handleFirebaseError,
  handleNetworkError,
  handleAuthError,
  showUserError,
} from "../services/errorHandler";
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
    "cells" | "images" | "additional" | "pdf" | "uploads" | null
  >(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedImageTitle, setSelectedImageTitle] = useState<string>("");
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const animatedValue = new Animated.Value(0);
  const isMountedRef = useRef(true);

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
      const reportData = await firebaseService.getVehicleDiagnosisReport(
        reportId
      );

      if (!reportData) {
        Alert.alert("오류", "리포트를 찾을 수 없습니다.");
        navigation.goBack();
        return;
      }

      setReport(reportData);

      // SOH 게이지 애니메이션 시작
      Animated.timing(animatedValue, {
        toValue: reportData.sohPercentage,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      // Firebase에서 셀 데이터가 없을 때 기본 데이터 생성
      if (!reportData.cellsData || reportData.cellsData.length === 0) {
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

      if (typeof timestamp === "object" && timestamp !== null && "toDate" in timestamp && typeof (timestamp as { toDate: () => Date }).toDate === "function") {
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

  const openModal = (content: "cells" | "images" | "additional" | "pdf" | "uploads") => {
    setModalContent(content);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalContent(null);
  };

  const openImageViewer = (imageUrl: string, title?: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageTitle(title || "검사 이미지");
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageUrl("");
    setSelectedImageTitle("");
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

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const slideSize = Dimensions.get("window").width - 80;
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
    return "#202632"; // 브랜드 다크 색상 - 주의/교체 필요
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
    <LinearGradient colors={["#F8FAFC", "#FFFFFF"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="진단 리포트"
          showLogo={false}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 차량 기본 정보 */}
          <Animatable.View
            animation="fadeInUp"
            duration={400}
            style={styles.vehicleSection}
          >
            <LinearGradient
              colors={["#FFFFFF", "#F8FAFC"]}
              style={styles.vehicleCard}
            >
              <View style={styles.vehicleHeader}>
                <View style={styles.vehicleInfo}>
                  <Text
                    style={[
                      styles.vehicleName,
                      convertToLineSeedFont(styles.vehicleName),
                    ]}
                  >
                    {report.vehicleBrand || ""} {report.vehicleName}
                  </Text>
                  <Text
                    style={[
                      styles.vehicleDetails,
                      convertToLineSeedFont(styles.vehicleDetails),
                    ]}
                  >
                    {report.vehicleYear}년 • 진단일:{" "}
                    {formatDate(report.diagnosisDate)}
                  </Text>
                  {report.vehicleVIN && (
                    <Text
                      style={[
                        styles.vehicleVin,
                        convertToLineSeedFont(styles.vehicleVin),
                      ]}
                    >
                      VIN: {report.vehicleVIN.slice(-8)}
                    </Text>
                  )}
                </View>
              </View>

              {/* 배터리 성능 (SOH) - 원형 프로그레스 */}
              <View style={styles.sohMainSection}>
                <Text
                  style={[
                    styles.sohMainLabel,
                    convertToLineSeedFont(styles.sohMainLabel),
                  ]}
                >
                  배터리 성능 (SOH)
                </Text>
                <View style={styles.circularProgressContainer}>
                  {/* 배경 원 (회색) */}
                  <View style={styles.circularProgressBackground}>
                    {/* 애니메이션 프로그레스 원 */}
                    <Animated.View
                      style={[
                        styles.circularProgressBar,
                        {
                          transform: [
                            {
                              rotate: animatedValue.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0deg', '360deg'],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={[
                          getHealthColor(report.sohPercentage),
                          getHealthColor(report.sohPercentage) + 'CC',
                          getHealthColor(report.sohPercentage) + '88',
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.progressGradient}
                      />
                    </Animated.View>

                    {/* 중앙 흰색 원 */}
                    <View style={styles.circularProgressInner}>
                      {/* SOH 값 표시 */}
                      <Text
                        style={[
                          styles.sohPercentValue,
                          { color: getHealthColor(report.sohPercentage) },
                          convertToLineSeedFont(styles.sohPercentValue),
                        ]}
                      >
                        {report.sohPercentage}
                      </Text>
                      <Text
                        style={[
                          styles.sohPercentUnit,
                          convertToLineSeedFont(styles.sohPercentUnit),
                        ]}
                      >
                        %
                      </Text>
                      <Text
                        style={[
                          styles.sohHealthStatus,
                          convertToLineSeedFont(styles.sohHealthStatus),
                        ]}
                      >
                        {report.sohPercentage >= 95
                          ? '매우 우수'
                          : report.sohPercentage >= 90
                          ? '양호'
                          : report.sohPercentage >= 85
                          ? '보통'
                          : '점검 필요'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 배터리 상태 요약 */}
              <View style={styles.batteryOverview}>

                <View style={styles.quickStats}>
                  <View style={styles.statItem}>
                    <Text
                      style={[
                        styles.statLabel,
                        convertToLineSeedFont(styles.statLabel),
                      ]}
                    >
                      총 셀 개수
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
                        styles.statValueNormal,
                        convertToLineSeedFont(styles.statValue),
                      ]}
                    >
                      {report.cellCount}개
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text
                      style={[
                        styles.statLabel,
                        convertToLineSeedFont(styles.statLabel),
                      ]}
                    >
                      불량 셀
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
                        report.defectiveCellCount > 0
                          ? styles.statValueDanger
                          : styles.statValueNormal,
                        convertToLineSeedFont(styles.statValue),
                      ]}
                    >
                      {report.defectiveCellCount}개
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text
                      style={[
                        styles.statLabel,
                        convertToLineSeedFont(styles.statLabel),
                      ]}
                    >
                      일반 충전
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
                        styles.statValueNormal,
                        convertToLineSeedFont(styles.statValue),
                      ]}
                    >
                      {report.normalChargeCount || 0}회
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text
                      style={[
                        styles.statLabel,
                        convertToLineSeedFont(styles.statLabel),
                      ]}
                    >
                      급속 충전
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
                        styles.statValueNormal,
                        convertToLineSeedFont(styles.statValue),
                      ]}
                    >
                      {report.fastChargeCount || 0}회
                    </Text>
                  </View>
                  {report.realDrivableDistance && (
                    <View style={styles.statItem}>
                      <Text
                        style={[
                          styles.statLabel,
                          convertToLineSeedFont(styles.statLabel),
                        ]}
                      >
                        주행가능거리
                      </Text>
                      <Text
                        style={[
                          styles.statValue,
                          styles.statValueNormal,
                          convertToLineSeedFont(styles.statValue),
                        ]}
                      >
                        {report.realDrivableDistance}km
                      </Text>
                    </View>
                  )}
                </View>

                {/* 최근 오류 코드 (선택적 필드) */}
                {(report as VehicleDiagnosisReport & { recentErrorCodes?: Array<{ code: string; description: string }> }).recentErrorCodes &&
                  (report as VehicleDiagnosisReport & { recentErrorCodes?: Array<{ code: string; description: string }> }).recentErrorCodes!.length > 0 && (
                    <View style={styles.errorSection}>
                      <Text
                        style={[
                          styles.errorTitle,
                          convertToLineSeedFont(styles.errorTitle),
                        ]}
                      >
                        최근 오류 코드
                      </Text>
                      <View style={styles.errorCodes}>
                        {(report as VehicleDiagnosisReport & { recentErrorCodes?: Array<{ code: string; description: string }> }).recentErrorCodes!
                          .slice(0, 3)
                          .map((error: { code: string; description: string }, index: number) => (
                            <View key={index} style={styles.errorCode}>
                              <Text
                                style={[
                                  styles.errorCodeText,
                                  convertToLineSeedFont(styles.errorCodeText),
                                ]}
                              >
                                {error.code}: {error.description}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </View>
                  )}

                {/* 평가 */}
                <View style={styles.evaluationSection}>
                  <Text
                    style={[
                      styles.evaluationTitle,
                      convertToLineSeedFont(styles.evaluationTitle),
                    ]}
                  >
                    평가
                  </Text>
                  <Text
                    style={[
                      styles.evaluationText,
                      convertToLineSeedFont(styles.evaluationText),
                    ]}
                  >
                    {report.sohPercentage >= 95
                      ? "배터리 상태가 매우 우수합니다. 현재와 같은 충전 패턴을 유지하시기 바랍니다."
                      : report.sohPercentage >= 90
                      ? "배터리 상태가 양호합니다. 급속 충전 빈도를 줄이면 더 오래 사용할 수 있습니다."
                      : report.sohPercentage >= 85
                      ? "배터리 성능이 저하되고 있습니다. 충전 패턴 개선과 정기 점검을 권장합니다."
                      : "배터리 교체를 검토해야 할 시점입니다. 전문가 상담을 받으시기 바랍니다."}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animatable.View>

          {/* 기능 버튼들 */}
          <Animatable.View
            animation="fadeInUp"
            duration={400}
            delay={200}
            style={styles.actionContainer}
          >
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => openModal("cells")}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="battery-charging" size={32} color="#6B7280" />
              </View>
              <Text
                style={[
                  styles.actionTitle,
                  convertToLineSeedFont(styles.actionTitle),
                ]}
              >
                배터리 셀맵
              </Text>
              <Text
                style={[
                  styles.actionSubtitle,
                  convertToLineSeedFont(styles.actionSubtitle),
                ]}
              >
                {report.cellCount}개 셀
              </Text>
            </TouchableOpacity>

            {/* 검사 이미지 카드 */}
            {report.comprehensiveInspection?.inspectionImages &&
              report.comprehensiveInspection.inspectionImages.length > 0 && (
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => openModal("images")}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="camera" size={32} color="#6B7280" />
                  </View>
                  <Text
                    style={[
                      styles.actionTitle,
                      convertToLineSeedFont(styles.actionTitle),
                    ]}
                  >
                    검사 이미지
                  </Text>
                  <Text
                    style={[
                      styles.actionSubtitle,
                      convertToLineSeedFont(styles.actionSubtitle),
                    ]}
                  >
                    {report.comprehensiveInspection.inspectionImages.length}개
                    사진
                  </Text>
                </TouchableOpacity>
              )}

            {/* 추가 검사 정보 */}
            {report.comprehensiveInspection?.additionalInfo &&
              report.comprehensiveInspection.additionalInfo.length > 0 && (
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => openModal("additional")}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="document-text" size={32} color="#6B7280" />
                  </View>
                  <Text
                    style={[
                      styles.actionTitle,
                      convertToLineSeedFont(styles.actionTitle),
                    ]}
                  >
                    추가 검사
                  </Text>
                  <Text
                    style={[
                      styles.actionSubtitle,
                      convertToLineSeedFont(styles.actionSubtitle),
                    ]}
                  >
                    {report.comprehensiveInspection.additionalInfo.length}개
                    항목
                  </Text>
                </TouchableOpacity>
              )}

            {/* PDF 리포트 */}
            {report.comprehensiveInspection?.pdfReports &&
              report.comprehensiveInspection.pdfReports.length > 0 && (
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => openModal("pdf")}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="document" size={32} color="#6B7280" />
                  </View>
                  <Text
                    style={[
                      styles.actionTitle,
                      convertToLineSeedFont(styles.actionTitle),
                    ]}
                  >
                    PDF 리포트
                  </Text>
                  <Text
                    style={[
                      styles.actionSubtitle,
                      convertToLineSeedFont(styles.actionSubtitle),
                    ]}
                  >
                    {report.comprehensiveInspection.pdfReports.length}개 문서
                  </Text>
                </TouchableOpacity>
              )}

            {/* 사고이력 */}
            {report.uploadedFiles && report.uploadedFiles.length > 0 && (
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
            )}
          </Animatable.View>

        </ScrollView>

        {/* 모달 */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={closeModal}
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    convertToLineSeedFont(styles.modalTitle),
                  ]}
                >
                  {modalContent === "cells" && "배터리 셀 맵"}
                  {modalContent === "images" && "검사 이미지"}
                  {modalContent === "additional" && "추가 검사 정보"}
                  {modalContent === "pdf" && "PDF 리포트"}
                  {modalContent === "uploads" && "사고이력"}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeModal}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {modalContent === "cells" && report?.cellsData && (
                  <View style={styles.modalSection}>
                    <Text
                      style={[
                        styles.modalSectionTitle,
                        convertToLineSeedFont(styles.modalSectionTitle),
                      ]}
                    >
                      배터리 셀 상태 ({report.cellCount}개)
                    </Text>

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
                                ? "#202632"
                                : "#06B6D4",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cellNumber,
                              {
                                color: cell.isDefective ? "#202632" : "#06B6D4",
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
                                color: cell.isDefective ? "#202632" : "#06B6D4",
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
                              borderColor: "#202632",
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
                  </View>
                )}

                {modalContent === "images" &&
                  report?.comprehensiveInspection?.inspectionImages && (
                    <View style={styles.modalSection}>
                      <Text
                        style={[
                          styles.modalSectionTitle,
                          convertToLineSeedFont(styles.modalSectionTitle),
                        ]}
                      >
                        검사 이미지 (
                        {report.comprehensiveInspection.inspectionImages.length}
                        개)
                      </Text>
                      <FlatList
                        data={report.comprehensiveInspection.inspectionImages}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={Dimensions.get("window").width - 64}
                        decelerationRate="fast"
                        contentContainerStyle={styles.imageCarouselContainer}
                        keyExtractor={(item) => item.id}
                        pagingEnabled={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        renderItem={({ item: imageItem, index }) => (
                          <View style={styles.imageCard}>
                            <TouchableOpacity
                              style={styles.imageCardImageWrapper}
                              onPress={() =>
                                openImageViewer(
                                  imageItem.imageUrl,
                                  imageItem.title
                                )
                              }
                              activeOpacity={0.8}
                            >
                              {isSVGFile(imageItem.imageUrl) ||
                              isImageLoadError(imageItem.imageUrl) ? (
                                <View
                                  style={[
                                    styles.imageCardImage,
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
                                <Image
                                  source={{ uri: imageItem.imageUrl }}
                                  style={styles.imageCardImage}
                                  resizeMode="cover"
                                  onError={() =>
                                    handleImageError(imageItem.imageUrl)
                                  }
                                />
                              )}
                              <View style={styles.imageCardOverlay}>
                                <Ionicons
                                  name="expand"
                                  size={20}
                                  color="#FFFFFF"
                                />
                              </View>
                            </TouchableOpacity>

                            <View style={styles.imageCardContent}>
                              <View style={styles.imageCardHeader}>
                                <Text
                                  style={[
                                    styles.imageCardTitle,
                                    convertToLineSeedFont(
                                      styles.imageCardTitle
                                    ),
                                  ]}
                                >
                                  {imageItem.title ||
                                    `검사 이미지 ${index + 1}`}
                                </Text>
                                <View
                                  style={[
                                    styles.imageCardBadge,
                                    {
                                      backgroundColor:
                                        imageItem.severity === "normal"
                                          ? "#E0F7FA"
                                          : "#F8F9FA",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.imageCardBadgeText,
                                      {
                                        color:
                                          imageItem.severity === "normal"
                                            ? "#06B6D4"
                                            : "#202632",
                                      },
                                      convertToLineSeedFont(
                                        styles.imageCardBadgeText
                                      ),
                                    ]}
                                  >
                                    {imageItem.severity === "normal"
                                      ? "정상"
                                      : imageItem.severity === "attention"
                                      ? "주의"
                                      : imageItem.severity === "warning"
                                      ? "경고"
                                      : imageItem.severity === "critical"
                                      ? "위험"
                                      : imageItem.severity}
                                  </Text>
                                </View>
                              </View>

                              {imageItem.description && (
                                <Text
                                  style={[
                                    styles.imageCardDescription,
                                    convertToLineSeedFont(
                                      styles.imageCardDescription
                                    ),
                                  ]}
                                >
                                  {imageItem.description}
                                </Text>
                              )}

                              {imageItem.location && (
                                <Text
                                  style={[
                                    styles.imageCardLocation,
                                    convertToLineSeedFont(
                                      styles.imageCardLocation
                                    ),
                                  ]}
                                >
                                  위치: {imageItem.location}
                                </Text>
                              )}
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
                              <View
                                style={[
                                  styles.inspectionBadge,
                                  {
                                    backgroundColor:
                                      info.severity === "normal"
                                        ? "#E0F7FA"
                                        : "#F8F9FA",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.inspectionBadgeText,
                                    {
                                      color:
                                        info.severity === "normal"
                                          ? "#06B6D4"
                                          : "#202632",
                                    },
                                    convertToLineSeedFont(
                                      styles.inspectionBadgeText
                                    ),
                                  ]}
                                >
                                  {info.severity === "normal"
                                    ? "정상"
                                    : info.severity === "attention"
                                    ? "주의"
                                    : info.severity === "warning"
                                    ? "경고"
                                    : info.severity === "critical"
                                    ? "위험"
                                    : info.severity}
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

                {modalContent === "pdf" &&
                  report?.comprehensiveInspection?.pdfReports && (
                    <View style={styles.modalSection}>
                      <Text
                        style={[
                          styles.modalSectionTitle,
                          convertToLineSeedFont(styles.modalSectionTitle),
                        ]}
                      >
                        PDF 리포트 (
                        {report.comprehensiveInspection.pdfReports.length}개)
                      </Text>
                      {report.comprehensiveInspection.pdfReports.map(
                        (pdfReport: PDFInspectionReport, index: number) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.modalInspectionItem}
                            onPress={() =>
                              openPDFFile(pdfReport.fileUrl, pdfReport.fileName)
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
                                {pdfReport.fileName}
                              </Text>
                              <Ionicons
                                name="download"
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
                              발행: {pdfReport.issuedBy}
                            </Text>
                            {pdfReport.keyFindings.length > 0 && (
                              <Text
                                style={[
                                  styles.inspectionLabel,
                                  convertToLineSeedFont(styles.inspectionLabel),
                                ]}
                              >
                                주요 발견사항:{" "}
                                {pdfReport.keyFindings.join(", ")}
                              </Text>
                            )}
                          </TouchableOpacity>
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
                      <View key={index} style={styles.pdfPreviewContainer}>
                        <TouchableOpacity
                          style={styles.modalInspectionItem}
                          onPress={() => openPDFFile(file.fileUrl, file.fileName)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.inspectionRow}>
                            <Text
                              style={[
                                styles.inspectionLocation,
                                convertToLineSeedFont(styles.inspectionLocation),
                              ]}
                            >
                              {file.fileName}
                            </Text>
                            <Ionicons name="download" size={20} color="#06B6D4" />
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
                        
                        {/* PDF 미리보기 */}
                        <View style={styles.pdfPreviewWrapper}>
                          <Pdf
                            source={{ uri: file.fileUrl }}
                            style={styles.pdfPreview}
                            page={1}
                            scale={1.5}
                            minScale={1.0}
                            maxScale={1.5}
                            renderActivityIndicator={() => (
                              <View style={styles.pdfLoadingContainer}>
                                <Text style={styles.pdfLoadingText}>PDF 로딩 중...</Text>
                              </View>
                            )}
                            onError={(error) => {
                              console.log("PDF 로딩 오류:", error);
                            }}
                            enablePaging={false}
                            spacing={0}
                          />
                          <TouchableOpacity
                            style={styles.pdfOverlay}
                            onPress={() => openPDFFile(file.fileUrl, file.fileName)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.pdfOverlayContent}>
                              <Ionicons name="eye" size={24} color="#FFFFFF" />
                              <Text style={styles.pdfOverlayText}>전체보기</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>

        {/* 전체화면 이미지 뷰어 */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={imageViewerVisible}
          onRequestClose={closeImageViewer}
        >
          <View style={styles.imageViewerOverlay}>
            <SafeAreaView style={styles.imageViewerContainer}>
              <View style={styles.imageViewerHeader}>
                <Text
                  style={[
                    styles.imageViewerTitle,
                    convertToLineSeedFont(styles.imageViewerTitle),
                  ]}
                >
                  {selectedImageTitle}
                </Text>
                <TouchableOpacity
                  style={styles.imageViewerCloseButton}
                  onPress={closeImageViewer}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.imageViewerContent}>
                {selectedImageUrl ? (
                  isSVGFile(selectedImageUrl) ||
                  isImageLoadError(selectedImageUrl) ? (
                    <View
                      style={[
                        styles.fullScreenImage,
                        styles.fullScreenPlaceholder,
                      ]}
                    >
                      <Ionicons
                        name={
                          isSVGFile(selectedImageUrl)
                            ? "document-text"
                            : "image"
                        }
                        size={80}
                        color="#06B6D4"
                      />
                      <Text style={styles.fullScreenPlaceholderText}>
                        {isSVGFile(selectedImageUrl)
                          ? "SVG 파일입니다"
                          : "이미지를 불러올 수 없습니다"}
                      </Text>
                      {isSVGFile(selectedImageUrl) && (
                        <TouchableOpacity
                          style={styles.viewFileButton}
                          onPress={() =>
                            openPDFFile(selectedImageUrl, selectedImageTitle)
                          }
                        >
                          <Text style={styles.viewFileButtonText}>
                            파일 보기
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <Image
                      source={{ uri: selectedImageUrl }}
                      style={styles.fullScreenImage}
                      resizeMode="contain"
                      onError={() => handleImageError(selectedImageUrl)}
                    />
                  )
                ) : null}
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
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
    color: "#202632",
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

  // SOH Main Section (Circular Progress)
  sohMainSection: {
    marginBottom: 32,
  },
  sohMainLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 24,
  },
  circularProgressContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  circularProgressBackground: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  circularProgressBar: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 20,
    borderColor: "transparent",
    borderTopColor: "#10B981", // 임시, 실제로는 동적으로 설정됨
  },
  progressGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 120,
  },
  circularProgressInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sohPercentValue: {
    fontSize: 64,
    fontWeight: "900",
    lineHeight: 72,
    letterSpacing: -2,
  },
  sohPercentUnit: {
    fontSize: 28,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: -8,
  },
  sohHealthStatus: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 8,
    letterSpacing: 0.5,
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
  backgroundCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: "#E5E7EB",
  },
  progressCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: "#10B981",
  },
  gaugeCenter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  gaugePercentage: {
    fontSize: 20,
    fontWeight: "700",
  },

  // Section Cards
  sectionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    color: "#202632",
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
    color: "#202632",
  },
  inspectionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#202632",
    marginHorizontal: 12,
  },
  inspectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inspectionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
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
  sohContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 20,
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
    color: "#202632",
  },
  statValueDanger: {
    color: "#202632",
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
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  evaluationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 12,
  },
  evaluationText: {
    fontSize: 14,
    color: "#1E3A8A",
    lineHeight: 20,
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
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    width: 64,
    height: 56,
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#202632",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#202632",
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
    color: "#202632",
    textAlign: "center",
  },
  voltageStatValueNormal: {
    color: "#06B6D4",
  },
  voltageStatValueDanger: {
    color: "#202632",
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
  imageCarouselContainer: {
    paddingHorizontal: 16,
  },
  imageCard: {
    width: Dimensions.get("window").width - 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  imageCardImageWrapper: {
    position: "relative",
  },
  imageCardImage: {
    width: "100%",
    height: 200,
  },
  imageCardPlaceholder: {
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#E2E8F0",
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
    padding:0,
  },
  imageCardHeader: {
    marginBottom: 12,
  },
  imageCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202632",
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    shadowOpacity: 0.1,
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
});

export default VehicleDiagnosisReportScreen;
