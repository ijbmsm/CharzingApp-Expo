import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import SignatureModal from './SignatureModal';

interface DiagnosticianConfirmation {
  confirmed: boolean;
  diagnosticianName: string;
  signatureDataUrl: string;
  confirmedAt: string;
}

interface DiagnosticianConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: DiagnosticianConfirmation) => void;
  initialData?: DiagnosticianConfirmation;
}

const DiagnosticianConfirmationModal: React.FC<DiagnosticianConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialData,
}) => {
  const insets = useSafeAreaInsets();

  const [diagnosticianName, setDiagnosticianName] = useState(initialData?.diagnosticianName || '');
  const [signatureDataUrl, setSignatureDataUrl] = useState(initialData?.signatureDataUrl || '');
  const [isSignatureModalVisible, setIsSignatureModalVisible] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setDiagnosticianName(initialData?.diagnosticianName || '');
      setSignatureDataUrl(initialData?.signatureDataUrl || '');
    }
  }, [visible, initialData]);

  const handleSignatureSave = (signature: string) => {
    setSignatureDataUrl(signature);
  };

  const handleConfirm = () => {
    if (!diagnosticianName.trim()) {
      Alert.alert('알림', '진단사 성명을 입력해주세요.');
      return;
    }

    if (!signatureDataUrl) {
      Alert.alert('알림', '서명을 작성해주세요.');
      return;
    }

    const now = new Date();
    const confirmedAt = now.toISOString();

    onConfirm({
      confirmed: true,
      diagnosticianName: diagnosticianName.trim(),
      signatureDataUrl,
      confirmedAt,
    });
    onClose();
  };

  const handleCancel = () => {
    setDiagnosticianName(initialData?.diagnosticianName || '');
    setSignatureDataUrl(initialData?.signatureDataUrl || '');
    onClose();
  };

  const articles = [
    {
      title: '제1조 (진단 절차 준수)',
      content: '본인은 회사가 제공한 전기차 배터리 진단 지침·점검 항목 및 리포트 양식에 따라 요구된 모든 진단 절차를 정확히 수행하였으며, 어떠한 항목도 임의로 생략하거나 축소하지 않았음을 확인합니다.'
    },
    {
      title: '제2조 (허위 기재 금지)',
      content: '실제로 수행하지 않은 진단을 한 것처럼 허위 기재하지 않았음을 확인합니다.'
    },
    {
      title: '제3조 (데이터 정확성)',
      content: '진단 수치·사진·의견 등을 고의로 은폐·누락·변경하지 않았으며, 판단이 불가능한 항목은 자체 판단으로 확정하지 않고 정확히 사실대로 기재하였음을 확인합니다.'
    },
    {
      title: '제4조 (책임 인지)',
      content: '위 내용을 위반하거나 허위·부실 기재로 인해 발생하는 문제에 대해서는 진단사 본인이 책임을 질 수 있음을 인지합니다.'
    }
  ];

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={handleCancel}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === 'ios' ? 0 : insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Document Title */}
          <View style={styles.documentHeader}>
            <Text style={styles.documentTitle}>진단 수행 확인서</Text>
          </View>

          {/* Articles */}
          <View style={styles.articlesContainer}>
            {articles.map((article, index) => (
              <View key={index} style={styles.articleItem}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleContent}>{article.content}</Text>
              </View>
            ))}
          </View>

          {/* Agreement Statement */}
          <View style={styles.agreementStatement}>
            <Text style={styles.agreementText}>상기 내용을 확인하고 이에 동의합니다.</Text>
          </View>

          {/* Signature Section */}
          <View style={styles.signatureSection}>
            {/* Date */}
            <View style={styles.signatureItem}>
              <Text style={styles.signatureItemLabel}>일시:</Text>
              <Text style={styles.signatureItemValue}>{formattedDate}</Text>
            </View>

            {/* Name */}
            <View style={styles.signatureItem}>
              <Text style={styles.signatureItemLabel}>성명:</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="성명을 입력하세요"
                placeholderTextColor="#9CA3AF"
                value={diagnosticianName}
                onChangeText={setDiagnosticianName}
                autoCapitalize="words"
              />
            </View>

            {/* Signature */}
            <View style={styles.signatureItem}>
              <Text style={styles.signatureItemLabel}>서명:</Text>
              {signatureDataUrl ? (
                <TouchableOpacity
                  style={styles.signatureImageContainer}
                  onPress={() => setIsSignatureModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: signatureDataUrl }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.signaturePlaceholder}
                  onPress={() => setIsSignatureModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={18} color="#9CA3AF" />
                  <Text style={styles.signaturePlaceholderText}>터치하여 서명</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { paddingBottom: insets.bottom + scale(16) }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirm}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmButtonText}>확인</Text>
          </TouchableOpacity>
        </View>

        {/* Signature Modal */}
        <SignatureModal
          visible={isSignatureModalVisible}
          onClose={() => setIsSignatureModalVisible(false)}
          onSave={handleSignatureSave}
          initialSignature={signatureDataUrl}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(28),
  },
  // Document Title
  documentHeader: {
    alignItems: 'center',
    marginBottom: verticalScale(36),
  },
  documentTitle: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 2,
  },
  // Articles
  articlesContainer: {
    marginBottom: verticalScale(32),
  },
  articleItem: {
    marginBottom: verticalScale(20),
  },
  articleTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: verticalScale(8),
  },
  articleContent: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(20),
    color: '#374151',
    paddingLeft: scale(12),
  },
  // Agreement Statement
  agreementStatement: {
    alignItems: 'center',
    marginBottom: verticalScale(28),
    paddingVertical: verticalScale(16),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D1D5DB',
  },
  agreementText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1F2937',
  },
  // Signature Section (Simple Line Style)
  signatureSection: {
    gap: verticalScale(20),
  },
  signatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  signatureItemLabel: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#1F2937',
    minWidth: scale(50),
  },
  signatureItemValue: {
    fontSize: moderateScale(15),
    color: '#374151',
    flex: 1,
  },
  nameInput: {
    fontSize: moderateScale(15),
    color: '#1F2937',
    flex: 1,
    padding: 0,
  },
  signatureImageContainer: {
    height: verticalScale(60),
    flex: 1,
    justifyContent: 'center',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  signaturePlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    flex: 1,
  },
  signaturePlaceholderText: {
    fontSize: moderateScale(14),
    color: '#9CA3AF',
  },
  // Action Buttons
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: scale(12),
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
    paddingVertical: verticalScale(14),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    backgroundColor: '#1F2937',
  },
  confirmButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DiagnosticianConfirmationModal;
