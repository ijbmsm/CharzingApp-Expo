import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';

export const MajorDevicesSection: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>주요 장치 점검 항목이 제거되었습니다.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: scale(16),
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(16),
  },
  emptyState: {
    paddingVertical: verticalScale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
