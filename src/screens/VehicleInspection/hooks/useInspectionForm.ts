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
        normalChargeCount: 0,
        fastChargeCount: 0,
        batteryCells: [],
        defaultCellVoltage: 3.7,
      },
      majorDevices: {
        electrical: {},
      },
      vehicleExterior: {
        vehicleExterior: {},
        bodyPanel: [],
        tiresAndWheels: {},
      },
      vehicleUndercarriage: {
        suspensionArms: {},
        underBatteryPack: {},
        steering: {},
        braking: {},
      },
      vehicleInterior: {
        interior: {},
        airconMotor: {},
        options: {},
        lighting: {},
        glass: {},
      },
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
