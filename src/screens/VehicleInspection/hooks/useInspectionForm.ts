import { useForm } from 'react-hook-form';
import { InspectionFormData } from '../types';

const getDefaultValues = (): InspectionFormData => ({
      vehicleInfo: {
        vehicleBrand: '',
        vehicleName: '',
        vehicleGrade: '',
        vehicleYear: '',
        vehicleVinImageUris: [],
        mileage: '',
        dashboardImageUris: [],
        dashboardStatus: '',
        dashboardIssueDescription: '',
        carKeyCount: '2',
      },
      vinCheck: {
        registrationImageUris: [],
        vinImageUris: [],
        isVinVerified: false,
        hasNoIllegalModification: false,
        hasNoFloodDamage: false,
        vinIssue: '',
        modificationIssue: '',
        floodIssue: '',
      },
      batteryInfo: {
        batterySOH: '100',
        batteryCellCount: 0,
        batteryCells: [],
        defaultCellVoltage: 3.7,
      },

      // ========== 검사 v2 구조 ==========
      // 4. 외부 검사
      exterior: {
        basePhotos: {},
        bodyPanel: {},
        frame: {},
        glass: {},
        lamp: {},
      },
      // 5. 내부 검사
      interior: {
        basePhotos: {},
        materials: {},
        functions: {},
      },
      // 6. 타이어 & 휠
      tireAndWheel: {
        tire: {},
        wheel: {},
      },
      // 7. 하체 검사
      undercarriage: {
        batteryPack: {},
        suspensionBasePhotos: {},
        suspension: {},
        brakeBasePhotos: {},
        brake: {},
      },
      // 8. 기타 사항
      other: {
        items: [],
      },
      diagnosticianConfirmation: {
        confirmed: false,
        diagnosticianName: '',
        signatureDataUrl: '',
        confirmedAt: '',
      },
});

export const useInspectionForm = (initialValues?: Partial<InspectionFormData>) => {
  const defaultValues = getDefaultValues();
  const mergedValues = initialValues
    ? { ...defaultValues, ...initialValues }
    : defaultValues;

  const methods = useForm<InspectionFormData>({
    defaultValues: mergedValues,
    mode: 'onChange', // 실시간 validation
  });

  return methods;
};
