import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';

interface LoadingSpinnerProps {
  visible: boolean;
  message?: string;
  size?: 'small' | 'large';
  overlay?: boolean;
  backgroundColor?: string;
  onClose?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible,
  message = '로딩 중...',
  size = 'large',
  overlay = true,
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  onClose,
}) => {
  if (!visible) return null;

  if (overlay) {
    return (
      <Modal
        transparent={true}
        animationType="fade"
        visible={visible}
        statusBarTranslucent={true}
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={[styles.overlay, { backgroundColor }]}>
            <TouchableWithoutFeedback>
              <View style={styles.container}>
                <ActivityIndicator size={size} color="#4495E8" />
                {message && <Text style={styles.message}>{message}</Text>}
                {onClose && (
                  <Text style={styles.closeHint}>탭하여 닫기</Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color="#4495E8" />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 120,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  inlineMessage: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  closeHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default LoadingSpinner;