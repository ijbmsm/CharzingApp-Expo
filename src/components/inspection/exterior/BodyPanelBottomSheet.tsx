import React from 'react';
import PaintThicknessBottomSheet from './PaintThicknessBottomSheet';
import { PaintThicknessInspection } from '../../../services/firebaseService';

interface BodyPanelBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: PaintThicknessInspection[]) => void;
  initialData: PaintThicknessInspection[];
}

/**
 * BodyPanelBottomSheet - 외판 수리/교체 확인 및 도막 측정
 *
 * PaintThicknessBottomSheet의 wrapper 컴포넌트입니다.
 * VehicleExteriorSection에서 사용하기 위해 props 이름을 통일했습니다.
 */
export const BodyPanelBottomSheet: React.FC<BodyPanelBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
}) => {
  return (
    <PaintThicknessBottomSheet
      visible={visible}
      onClose={onClose}
      onConfirm={onSave}
      initialData={initialData}
    />
  );
};
