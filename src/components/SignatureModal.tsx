import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import SignatureCanvas from 'react-native-signature-canvas';

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  initialSignature?: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  visible,
  onClose,
  onSave,
  initialSignature,
}) => {
  const insets = useSafeAreaInsets();
  const signatureRef = useRef<any>(null);
  const [hasSignature, setHasSignature] = useState(!!initialSignature);
  const [signatureDataUrl, setSignatureDataUrl] = useState(initialSignature || '');

  React.useEffect(() => {
    if (visible && initialSignature) {
      setSignatureDataUrl(initialSignature);
      setHasSignature(true);
    }
  }, [visible, initialSignature]);

  const handleSignature = (signature: string) => {
    setSignatureDataUrl(signature);
    setHasSignature(true);
  };

  const handleClearSignature = () => {
    signatureRef.current?.clearSignature();
    setSignatureDataUrl('');
    setHasSignature(false);
  };

  const handleSave = () => {
    if (!signatureDataUrl || signatureDataUrl === '') {
      Alert.alert('알림', '서명을 작성해주세요.');
      return;
    }
    onSave(signatureDataUrl);
    onClose();
  };

  const handleCancel = () => {
    setSignatureDataUrl(initialSignature || '');
    setHasSignature(!!initialSignature);
    onClose();
  };

  const signatureStyle = `
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
    }
    .m-signature-pad {
      box-shadow: none;
      border: none;
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
    }
    .m-signature-pad--body {
      border: none;
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
    }
    .m-signature-pad--body canvas {
      height: 100% !important;
      width: 100% !important;
    }
    .m-signature-pad--footer {
      display: none;
    }
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCancel}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + verticalScale(10),
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>서명</Text>
          {hasSignature && (
            <TouchableOpacity onPress={handleClearSignature} activeOpacity={0.7}>
              <Text style={styles.clearButton}>지우기</Text>
            </TouchableOpacity>
          )}
          {!hasSignature && <View style={{ width: 60 }} />}
        </View>

        {/* Signature Canvas */}
        <View style={styles.signatureContainer}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleSignature}
            onEnd={() => {
              // 서명이 끝날 때마다 자동으로 데이터 읽기
              signatureRef.current?.readSignature();
            }}
            descriptionText=""
            webStyle={signatureStyle}
            backgroundColor="#FFFFFF"
            penColor="#000000"
          />
        </View>

        <Text style={styles.hint}>위 영역에 서명해주세요</Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>완료</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#1F2937',
  },
  clearButton: {
    fontSize: moderateScale(15),
    color: '#EF4444',
    fontWeight: '600',
  },
  signatureContainer: {
    flex: 1,
    margin: scale(20),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  hint: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: scale(12),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(16),
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
  saveButton: {
    backgroundColor: '#06B6D4',
  },
  saveButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SignatureModal;
