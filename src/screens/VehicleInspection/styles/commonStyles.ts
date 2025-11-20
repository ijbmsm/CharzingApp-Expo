import { StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

/**
 * VehicleInspection 공통 디자인 시스템
 * HomeScreen 스타일을 레퍼런스로 제작
 */

export const colors = {
  // 배경
  background: '#F9FAFB',
  cardBackground: '#FFFFFF',

  // 주 색상
  primary: '#202632',
  secondary: '#06B6D4',

  // 텍스트
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textPlaceholder: '#9CA3AF',
  textWhite: '#FFFFFF',

  // 상태
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',

  // 보더/구분선
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // 버튼
  buttonPrimary: '#202632',
  buttonSecondary: '#FFFFFF',
  buttonDisabled: '#D1D5DB',
};

export const commonStyles = StyleSheet.create({
  // Modal/BottomSheet 기본
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header (모든 BottomSheet 공통)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: scale(4),
  },

  // Content Area
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: scale(20),
  },

  // Item Container (각 검사 항목)
  itemContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: scale(16),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemLabel: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: verticalScale(12),
  },

  // Image Upload Button
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.secondary,
  },
  imageButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: scale(8),
  },
  imageButtonTextActive: {
    color: colors.secondary,
  },

  // Status Buttons (양호/문제 있음)
  statusButtonGroup: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: verticalScale(12),
  },
  statusButton: {
    flex: 1,
    paddingVertical: verticalScale(14),
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonGood: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  statusButtonProblem: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  statusButtonText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusButtonTextActive: {
    color: colors.textWhite,
  },

  // Issue Description Input
  issueContainer: {
    marginTop: verticalScale(8),
  },
  issueLabel: {
    fontSize: moderateScale(13),
    color: colors.textSecondary,
    marginBottom: verticalScale(8),
    fontWeight: '500',
  },
  issueInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: scale(12),
    minHeight: verticalScale(80),
    fontSize: moderateScale(14),
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },

  // Bottom Action Buttons
  bottomActions: {
    flexDirection: 'row',
    padding: scale(20),
    paddingBottom: scale(8),
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: scale(12),
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  primaryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.textWhite,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingVertical: verticalScale(16),
    borderWidth: 2,
    borderColor: colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.buttonPrimary,
  },

  // Helper
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: verticalScale(12),
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: verticalScale(20),
  },
});
