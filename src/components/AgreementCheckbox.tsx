import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AgreementCheckboxProps } from '../types/signup';

const COLORS = {
  PRIMARY: '#4495E8',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  BORDER: '#E5E7EB',
  BACKGROUND: '#FFFFFF',
  ERROR: '#EF4444',
} as const;

const SIZES = {
  CHECKBOX: 24,
  ICON: 18,
  TEXT: 15,
  LINK_TEXT: 13,
} as const;

export default function AgreementCheckbox({
  checked,
  onToggle,
  title,
  required,
  onViewDetails,
}: AgreementCheckboxProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={[
          styles.checkbox,
          checked && styles.checkboxChecked
        ]}>
          {checked && (
            <Ionicons
              name="checkmark"
              size={SIZES.ICON}
              color={COLORS.BACKGROUND}
            />
          )}
        </View>
        <Text style={styles.title}>
          {title}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </TouchableOpacity>

      {onViewDetails && (
        <TouchableOpacity
          onPress={onViewDetails}
          style={styles.detailsButton}
          activeOpacity={0.7}
        >
          <Text style={styles.detailsText}>내용 보기</Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={COLORS.TEXT_SECONDARY}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: SIZES.CHECKBOX,
    height: SIZES.CHECKBOX,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  title: {
    fontSize: SIZES.TEXT,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  required: {
    color: COLORS.ERROR,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  detailsText: {
    fontSize: SIZES.LINK_TEXT,
    color: COLORS.TEXT_SECONDARY,
    marginRight: 2,
  },
});
