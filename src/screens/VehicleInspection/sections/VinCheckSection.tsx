import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { InspectionFormData } from '../types';

export const VinCheckSection: React.FC = () => {
  const { control, watch } = useFormContext<InspectionFormData>();

  const isVinVerified = watch('vinCheck.isVinVerified');
  const hasNoIllegalModification = watch('vinCheck.hasNoIllegalModification');
  const hasNoFloodDamage = watch('vinCheck.hasNoFloodDamage');

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>차대번호 및 상태 확인</Text>

      {/* 차대번호 동일성 확인 */}
      <Controller
        control={control}
        name="vinCheck.isVinVerified"
        render={({ field: { value, onChange } }) => (
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => onChange(!value)}
            >
              <View style={[styles.checkboxBox, value && styles.checkboxBoxChecked]}>
                {value && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>차대번호 동일성 확인</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {!isVinVerified && (
        <Controller
          control={control}
          name="vinCheck.vinIssue"
          render={({ field: { value, onChange } }) => (
            <View style={styles.issueInputContainer}>
              <Text style={styles.issueLabel}>문제 내용:</Text>
              <View style={styles.textInputWrapper}>
                <Text
                  style={styles.textInput}
                  onPress={() => {
                    // TODO: Open text input modal
                  }}
                >
                  {value || '문제 내용을 입력하세요'}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* 불법 구조변경 없음 */}
      <Controller
        control={control}
        name="vinCheck.hasNoIllegalModification"
        render={({ field: { value, onChange } }) => (
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => onChange(!value)}
            >
              <View style={[styles.checkboxBox, value && styles.checkboxBoxChecked]}>
                {value && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>불법 구조변경 없음</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {!hasNoIllegalModification && (
        <Controller
          control={control}
          name="vinCheck.modificationIssue"
          render={({ field: { value, onChange } }) => (
            <View style={styles.issueInputContainer}>
              <Text style={styles.issueLabel}>문제 내용:</Text>
              <View style={styles.textInputWrapper}>
                <Text
                  style={styles.textInput}
                  onPress={() => {
                    // TODO: Open text input modal
                  }}
                >
                  {value || '문제 내용을 입력하세요'}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* 침수 이력 없음 */}
      <Controller
        control={control}
        name="vinCheck.hasNoFloodDamage"
        render={({ field: { value, onChange } }) => (
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => onChange(!value)}
            >
              <View style={[styles.checkboxBox, value && styles.checkboxBoxChecked]}>
                {value && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>침수 이력 없음</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {!hasNoFloodDamage && (
        <Controller
          control={control}
          name="vinCheck.floodIssue"
          render={({ field: { value, onChange } }) => (
            <View style={styles.issueInputContainer}>
              <Text style={styles.issueLabel}>문제 내용:</Text>
              <View style={styles.textInputWrapper}>
                <Text
                  style={styles.textInput}
                  onPress={() => {
                    // TODO: Open text input modal
                  }}
                >
                  {value || '문제 내용을 입력하세요'}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  checkboxContainer: {
    marginBottom: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxBoxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  issueInputContainer: {
    marginLeft: 36,
    marginBottom: 16,
    marginTop: -4,
  },
  issueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  textInputWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  textInput: {
    fontSize: 14,
    color: '#333',
    minHeight: 40,
  },
});
