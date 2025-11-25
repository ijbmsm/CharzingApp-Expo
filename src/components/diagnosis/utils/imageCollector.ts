import { VehicleDiagnosisReport } from '../../../services/firebaseService';

export interface ImageItem {
  uri: string;
  label: string;
  hasProblem: boolean;
  problemDescription?: string;
}

/**
 * 진단 리포트에서 모든 이미지를 순서대로 수집
 *
 * 순서:
 * 1. 차량 외관 (앞, 뒤, 좌측, 우측)
 * 2. 계기판 사진
 * 3. 차대번호 사진
 * 4. 서스펜션 암
 * 5. 배터리 팩 하부
 * 6. 주요 장치 검사 이미지들
 * 7. 차량 내부 검사 이미지들
 * 8. 기타 검사 항목
 */
export const getAllImagesInOrder = (report: VehicleDiagnosisReport): ImageItem[] => {
  const images: ImageItem[] = [];

  // 1. 차량 외관 사진
  if (report.vehicleExteriorInspection?.vehicleExterior) {
    const exterior = report.vehicleExteriorInspection.vehicleExterior;

    if (exterior.front) {
      images.push({ uri: exterior.front, label: '차량 외관 - 앞', hasProblem: false });
    }
    if (exterior.rear) {
      images.push({ uri: exterior.rear, label: '차량 외관 - 뒤', hasProblem: false });
    }
    if (exterior.leftSide) {
      images.push({ uri: exterior.leftSide, label: '차량 외관 - 좌측', hasProblem: false });
    }
    if (exterior.rightSide) {
      images.push({ uri: exterior.rightSide, label: '차량 외관 - 우측', hasProblem: false });
    }
  }

  // 2. 계기판 사진
  if (report.dashboardImageUris) {
    report.dashboardImageUris.forEach((uri: string, index: number) => {
      images.push({
        uri,
        label: `계기판 ${index + 1}`,
        hasProblem: false,
      });
    });
  }

  // 3. 차대번호 사진
  if (report.vehicleVinImageUris) {
    report.vehicleVinImageUris.forEach((uri: string, index: number) => {
      images.push({
        uri,
        label: `차대번호 ${index + 1}`,
        hasProblem: false,
      });
    });
  }

  // 4. 서스펜션 암
  if (report.vehicleUndercarriageInspection?.suspensionArms) {
    const arms = report.vehicleUndercarriageInspection.suspensionArms;

    if (arms.driverFrontWheel) {
      images.push({ uri: arms.driverFrontWheel, label: '서스펜션 암 - 운전석 앞', hasProblem: false });
    }
    if (arms.driverRearWheel) {
      images.push({ uri: arms.driverRearWheel, label: '서스펜션 암 - 운전석 뒤', hasProblem: false });
    }
    if (arms.passengerFrontWheel) {
      images.push({ uri: arms.passengerFrontWheel, label: '서스펜션 암 - 동승석 앞', hasProblem: false });
    }
    if (arms.passengerRearWheel) {
      images.push({ uri: arms.passengerRearWheel, label: '서스펜션 암 - 동승석 뒤', hasProblem: false });
    }
  }

  // 5. 배터리 팩 하부
  if (report.vehicleUndercarriageInspection?.underBatteryPack) {
    const battery = report.vehicleUndercarriageInspection.underBatteryPack;

    if (battery.front) {
      images.push({ uri: battery.front, label: '배터리 팩 하부 - 앞', hasProblem: false });
    }
    if (battery.rear) {
      images.push({ uri: battery.rear, label: '배터리 팩 하부 - 뒤', hasProblem: false });
    }
    if (battery.leftSide) {
      images.push({ uri: battery.leftSide, label: '배터리 팩 하부 - 좌측', hasProblem: false });
    }
    if (battery.rightSide) {
      images.push({ uri: battery.rightSide, label: '배터리 팩 하부 - 우측', hasProblem: false });
    }
  }

  // 6. 주요 장치 검사 이미지들 (VehicleUndercarriageInspection에 있음)
  if (report.vehicleUndercarriageInspection) {
    const devices = report.vehicleUndercarriageInspection;

    // 조향 장치
    if (devices.steering) {
      Object.entries(devices.steering).forEach(([key, item]) => {
        if (item && item.imageUris && item.imageUris.length > 0) {
          item.imageUris.forEach((uri: string, index: number) => {
            images.push({
              uri,
              label: `조향 - ${item.name || key}${item.imageUris!.length > 1 ? ` (${index + 1})` : ''}`,
              hasProblem: item.status === 'problem',
              problemDescription: item.issueDescription,
            });
          });
        }
      });
    }

    // 제동 장치
    if (devices.braking) {
      Object.entries(devices.braking).forEach(([key, item]) => {
        if (item && item.imageUris && item.imageUris.length > 0) {
          item.imageUris.forEach((uri: string, index: number) => {
            images.push({
              uri,
              label: `제동 - ${item.name || key}${item.imageUris!.length > 1 ? ` (${index + 1})` : ''}`,
              hasProblem: item.status === 'problem',
              problemDescription: item.issueDescription,
            });
          });
        }
      });
    }
  }

  // 7. 차량 내부 검사 이미지들
  if (report.vehicleInteriorInspection) {
    const interior = report.vehicleInteriorInspection;

    // 내장재
    if (interior.interior) {
      Object.entries(interior.interior).forEach(([key, item]) => {
        if (item && item.imageUris && item.imageUris.length > 0) {
          item.imageUris.forEach((uri: string, index: number) => {
            images.push({
              uri,
              label: `내장재 - ${item.name || key}${item.imageUris!.length > 1 ? ` (${index + 1})` : ''}`,
              hasProblem: item.status === 'problem',
              problemDescription: item.issueDescription,
            });
          });
        }
      });
    }

    // 에어컨 및 모터
    if (interior.airconMotor) {
      Object.entries(interior.airconMotor).forEach(([key, item]) => {
        if (item && item.imageUris && item.imageUris.length > 0) {
          item.imageUris.forEach((uri: string, index: number) => {
            images.push({
              uri,
              label: `에어컨/모터 - ${item.name || key}${item.imageUris!.length > 1 ? ` (${index + 1})` : ''}`,
              hasProblem: item.status === 'problem',
              problemDescription: item.issueDescription,
            });
          });
        }
      });
    }

    // 등화장치
    if (interior.lighting) {
      Object.entries(interior.lighting).forEach(([key, item]) => {
        if (item && item.imageUris && item.imageUris.length > 0) {
          item.imageUris.forEach((uri: string, index: number) => {
            images.push({
              uri,
              label: `등화장치 - ${item.name || key}${item.imageUris!.length > 1 ? ` (${index + 1})` : ''}`,
              hasProblem: item.status === 'problem',
              problemDescription: item.issueDescription,
            });
          });
        }
      });
    }

    // 유리
    if (interior.glass) {
      Object.entries(interior.glass).forEach(([key, item]) => {
        if (item && item.imageUris && item.imageUris.length > 0) {
          item.imageUris.forEach((uri: string, index: number) => {
            images.push({
              uri,
              label: `유리 - ${item.name || key}${item.imageUris!.length > 1 ? ` (${index + 1})` : ''}`,
              hasProblem: item.status === 'problem',
              problemDescription: item.issueDescription,
            });
          });
        }
      });
    }
  }

  // 8. 기타 검사 이미지 (comprehensiveInspection)
  if (report.comprehensiveInspection?.inspectionImages) {
    report.comprehensiveInspection.inspectionImages.forEach((imageItem) => {
      if (imageItem.imageUrl) {
        const hasProblem = imageItem.severity && ['주의', '경고', '심각'].includes(imageItem.severity);
        images.push({
          uri: imageItem.imageUrl,
          label: imageItem.category || '기타 검사',
          hasProblem: !!hasProblem,
          problemDescription: imageItem.notes,
        });
      }
    });
  }

  return images;
};
