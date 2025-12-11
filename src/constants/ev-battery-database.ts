// 전기차 종합 데이터베이스 (심플 버전)
export interface VehicleBrand {
  id: string;
  name: string;
  logo?: string;
}

export interface VehicleModel {
  id: string;
  name: string;
  years?: string[];
}

export interface BatteryInfo {
  manufacturers: string[];
  capacity?: string; // 배터리 용량
  usableCapacity?: string; // 실사용 가능 용량
  warranty?: string; // 배터리 보증
  cellType?: string; // 셀 타입 (NCM622, NCM811, LFP 등)
  variant?: string; // 트림/버전
  voltage?: string; // 전압
  note?: string; // 추가 정보
}

export interface VehicleSpecs {
  // 주행거리
  range?: string; // 인증 주행거리 (km)
  
  // 성능
  powerMax?: string; // 최대출력 (kW)
  torqueMax?: string; // 최대토크 (Nm)
  acceleration?: string; // 0-100km/h (초)
  topSpeed?: string; // 최고속도 (km/h)
  driveType?: string; // 구동방식 (FWD/RWD/AWD)
  efficiency?: string; // 전비 (km/kWh)
  chargingDC?: string; // 급속충전 (kW)
  seats?: number; // 좌석수
  
  // 가격 정보는 제거됨
}

export interface VehicleTrim {
  trimId: string;
  trimName: string;
  wheels?: string[]; // 휠 옵션 (17인치, 19인치 등)
  efficiency?: { [wheel: string]: string }; // 휠별 전비
  range?: { [wheel: string]: string }; // 휠별 주행거리
  note?: string; // 트림 특이사항
}

export interface YearRangeBattery {
  startYear: number;
  endYear?: number;
  battery: BatteryInfo;
  specs?: VehicleSpecs;
  trims?: VehicleTrim[]; // 트림 정보 추가
}

export interface VehicleBatteryData {
  brandId: string;
  modelId: string;
  modelName?: string;
  modelNameEn?: string;
  batteries: YearRangeBattery[];
}

export const VEHICLE_BATTERY_DATABASE: VehicleBatteryData[] = [
  // ===== 현대자동차 =====
  {
    brandId: 'hyundai',
    modelId: 'ioniq-5-standard',
    modelName: '아이오닉 5 Standard',
    batteries: [
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '336',
          powerMax: '125kW',
          torqueMax: '350Nm',
          acceleration: '8.5',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.1',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '336',
          powerMax: '125kW',
          torqueMax: '350Nm',
          acceleration: '8.5',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.1',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '342',
          powerMax: '125kW',
          torqueMax: '350Nm',
          acceleration: '8.5',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.1',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '63kWh',
          warranty: '8년/16만km',
          cellType: '리튬 이온',
          variant: 'Standard 2WD Refresh'
        },
        specs: {
          range: '368',
          powerMax: '124.9kW',
          torqueMax: '350Nm',
          acceleration: '8.5',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.1',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'ioniq-5-standard-awd',
    modelName: '아이오닉 5 Standard AWD',
    batteries: [
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '319',
          powerMax: '173kW',
          torqueMax: '605Nm',
          acceleration: '6.1',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '319',
          powerMax: '173kW',
          torqueMax: '605Nm',
          acceleration: '6.1',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'ioniq-5-longrange',
    modelName: '아이오닉 5 Long Range',
    batteries: [
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '72.6kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '429',
          powerMax: '160kW',
          torqueMax: '350Nm',
          acceleration: '7.4',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.1',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '458',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.2',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        endYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '458',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.4',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.2',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: '리튬 이온',
          variant: 'Long Range 2WD Refresh'
        },
        specs: {
          range: '485',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.4',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.2',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'ioniq-5-longrange-awd',
    modelName: '아이오닉 5 Long Range AWD',
    batteries: [
      {
        startYear: 2021,
        endYear: 2021,
        battery: {
          manufacturers: ['현대자동차'],
          capacity: '72.6kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '390',
          powerMax: '225kW',
          torqueMax: '605Nm',
          acceleration: '5.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.7',
          seats: 5,
        }
      },
      {
        startYear: 2022,
        endYear: 2022,
        battery: {
          manufacturers: ['현대자동차'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: '리튬 이온',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '458',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.1',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.9',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        endYear: 2023,
        battery: {
          manufacturers: ['현대자동차'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '417',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.1',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.7',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        endYear: 2024,
        battery: {
          manufacturers: ['현대자동차'],
          capacity: '84.0kWh',
          warranty: '10년/20만km',
          cellType: '리튬 이온 (4세대)',
          variant: 'Long Range AWD (더 뉴)'
        },
        specs: {
          range: '485',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.1',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.9',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['현대자동차'],
          capacity: '84.0kWh',
          warranty: '10년/20만km',
          cellType: '리튬 이온',
          variant: 'Long Range AWD (더 뉴)'
        },
        specs: {
          range: '451',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.1',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'ioniq-5-n',
    modelName: '아이오닉 5 N',
    batteries: [
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'N Performance AWD'
        },
        specs: {
          range: '351',
          powerMax: '478kW',
          torqueMax: '770Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'N Performance AWD'
        },
        specs: {
          range: '351',
          powerMax: '478kW',
          torqueMax: '770Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'ioniq-5-n-awd',
    modelName: '아이오닉 5 N AWD',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: '리튬 이온',
          variant: 'N Performance AWD'
        },
        specs: {
          range: '411',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '3.4',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '4.4',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'ioniq-6-standard',
    modelName: '아이오닉 6 Standard',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '53kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '429',
          powerMax: '111kW',
          acceleration: '8.8',
          driveType: 'RWD',
          efficiency: '6.2',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '53kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '429',
          powerMax: '111kW',
          acceleration: '8.8',
          driveType: 'RWD',
          efficiency: '6.2',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '53kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '429',
          powerMax: '111kW',
          acceleration: '8.8',
          driveType: 'RWD',
          efficiency: '6.2',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '53kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '429',
          powerMax: '111kW',
          acceleration: '8.8',
          driveType: 'RWD',
          efficiency: '6.2',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'ioniq-6-longrange-rwd',
    modelName: '아이오닉 6 Long Range 2WD',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '524',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.4',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '6.2',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '524',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.4',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '6.2',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '524',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.4',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '6.2',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '524',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.4',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '6.2',
          chargingDC: '233',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'ioniq-6-longrange-awd',
    modelName: '아이오닉 6 Long Range AWD',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '455',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.1',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '5.4',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '455',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.1',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '5.4',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '455',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.1',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '5.4',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '455',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.1',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '5.4',
          chargingDC: '233',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'ioniq-6-n',
    modelName: '아이오닉 6 N',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'N Performance AWD'
        },
        specs: {
          range: '425',
          powerMax: '478kW',
          torqueMax: '740Nm',
          acceleration: '3.4',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '5.8',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'N Performance AWD'
        },
        specs: {
          range: '435',
          powerMax: '478kW',
          torqueMax: '740Nm',
          acceleration: '3.4',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '5.6',
          chargingDC: '233',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'kona-electric-standard',
    modelName: '코나 일렉트릭 Standard',
    batteries: [
      {
        startYear: 2018,
        endYear: 2020,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '39.2kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '312',
          powerMax: '100kW',
          torqueMax: '395Nm',
          acceleration: '9.3',
          topSpeed: '155',
          driveType: 'FWD',
          efficiency: '5.7',
          chargingDC: '44',
          seats: 5,
        }
      },
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '39.2kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '312',
          powerMax: '100kW',
          torqueMax: '395Nm',
          acceleration: '9.3',
          topSpeed: '155',
          driveType: 'FWD',
          efficiency: '5.7',
          chargingDC: '44',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '48.6kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'Standard'
        },
        specs: {
          range: '342',
          powerMax: '115kW',
          torqueMax: '255Nm',
          acceleration: '8.8',
          topSpeed: '172',
          driveType: 'FWD',
          efficiency: '5.5',
          chargingDC: '43',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '48.6kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'Standard'
        },
        specs: {
          range: '342',
          powerMax: '115kW',
          torqueMax: '255Nm',
          acceleration: '8.8',
          topSpeed: '172',
          driveType: 'FWD',
          efficiency: '5.5',
          chargingDC: '43',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '48.6kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'Standard'
        },
        specs: {
          range: '342',
          powerMax: '115kW',
          torqueMax: '255Nm',
          acceleration: '8.8',
          topSpeed: '172',
          driveType: 'FWD',
          efficiency: '5.5',
          chargingDC: '43',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'kona-electric-longrange',
    modelName: '코나 일렉트릭 Long Range',
    batteries: [
      {
        startYear: 2018,
        endYear: 2020,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '64kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '406',
          powerMax: '150kW',
          torqueMax: '395Nm',
          acceleration: '7.6',
          topSpeed: '167',
          driveType: 'FWD',
          efficiency: '5.6',
          chargingDC: '77',
          seats: 5,
        }
      },
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '64kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '406',
          powerMax: '150kW',
          torqueMax: '395Nm',
          acceleration: '7.6',
          topSpeed: '167',
          driveType: 'FWD',
          efficiency: '5.6',
          chargingDC: '77',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '419',
          powerMax: '156kW',
          torqueMax: '255Nm',
          acceleration: '7.8',
          topSpeed: '172',
          driveType: 'FWD',
          efficiency: '5.5',
          chargingDC: '77',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '419',
          powerMax: '156kW',
          torqueMax: '255Nm',
          acceleration: '7.8',
          topSpeed: '172',
          driveType: 'FWD',
          efficiency: '5.5',
          chargingDC: '77',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '419',
          powerMax: '156kW',
          torqueMax: '255Nm',
          acceleration: '7.8',
          topSpeed: '172',
          driveType: 'FWD',
          efficiency: '5.5',
          chargingDC: '77',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'ioniq-9-longrange-rwd',
    modelName: '아이오닉 9 Long Range 2WD',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '110.3kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '620',
          powerMax: '160kW',
          torqueMax: '350Nm',
          acceleration: '8.8',
          topSpeed: '190',
          driveType: 'RWD',
          efficiency: '5.7',
          chargingDC: '233',
          seats: 7,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'ioniq-9-longrange-awd',
    modelName: '아이오닉 9 Long Range AWD',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '110.3kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '580',
          powerMax: '320kW',
          torqueMax: '700Nm',
          acceleration: '5.2',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '5.3',
          chargingDC: '233',
          seats: 7,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'nexo',
    modelName: '넥쏘',
    batteries: [
      {
        startYear: 2018,
        battery: {
          manufacturers: ['현대자동차'],
          capacity: '1.56kWh',
          warranty: '10년/16만km',
          cellType: 'Fuel Cell',
          variant: 'Hydrogen'
        },
        specs: {
          range: '609',
          powerMax: '120kW',
          torqueMax: '395Nm',
          acceleration: '9.5',
          topSpeed: '179',
          driveType: 'FWD',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['현대자동차'],
          capacity: '1.56kWh',
          warranty: '10년/16만km',
          cellType: 'Fuel Cell',
          variant: 'Hydrogen'
        },
        specs: {
          range: '609',
          powerMax: '120kW',
          torqueMax: '395Nm',
          acceleration: '9.5',
          topSpeed: '179',
          driveType: 'FWD',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['현대자동차'],
          capacity: '1.56kWh',
          warranty: '10년/16만km',
          cellType: 'Fuel Cell',
          variant: 'Hydrogen'
        },
        specs: {
          range: '609',
          powerMax: '120kW',
          torqueMax: '395Nm',
          acceleration: '9.5',
          topSpeed: '179',
          driveType: 'FWD',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['현대자동차'],
          capacity: '2.64kWh',
          warranty: '10년/16만km',
          cellType: 'Fuel Cell',
          variant: 'Hydrogen 2nd Gen'
        },
        specs: {
          range: '609',
          powerMax: '150kW',
          torqueMax: '395Nm',
          acceleration: '9.5',
          topSpeed: '179',
          driveType: 'FWD',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['현대자동차'],
          capacity: '2.64kWh',
          warranty: '10년/16만km',
          cellType: 'Fuel Cell',
          variant: 'Hydrogen 2nd Gen'
        },
        specs: {
          range: '609',
          powerMax: '150kW',
          torqueMax: '395Nm',
          acceleration: '9.5',
          topSpeed: '179',
          driveType: 'FWD',
          seats: 5,
        }
      }
    ]
  },
  
  // ===== 기아자동차 =====
  {
    brandId: 'kia',
    modelId: 'ev6',
    modelName: 'EV6',
    batteries: [
      // Standard 2WD
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '370',
          powerMax: '125kW',
          torqueMax: '350Nm',
          acceleration: '8.5',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.2',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '370',
          powerMax: '125kW',
          torqueMax: '350Nm',
          acceleration: '8.5',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.2',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '63kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '390',
          powerMax: '125kW',
          torqueMax: '350Nm',
          acceleration: '8.5',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.4',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '63kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '390',
          powerMax: '125kW',
          torqueMax: '350Nm',
          acceleration: '8.5',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.4',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['SK온'],
          capacity: '62.9kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '382',
          powerMax: '125kW',
          torqueMax: '350Nm',
          acceleration: '8.5',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.3',
          chargingDC: '233',
          seats: 5,
        }
      },
      // Standard AWD
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '351',
          powerMax: '173kW',
          torqueMax: '605Nm',
          acceleration: '6.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '351',
          powerMax: '173kW',
          torqueMax: '605Nm',
          acceleration: '6.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '63kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '368',
          powerMax: '173kW',
          torqueMax: '605Nm',
          acceleration: '6.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '5.1',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '63kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '368',
          powerMax: '173kW',
          torqueMax: '605Nm',
          acceleration: '6.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '5.1',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['SK온'],
          capacity: '62.9kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '360',
          powerMax: '173kW',
          torqueMax: '605Nm',
          acceleration: '6.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '5.0',
          chargingDC: '233',
          seats: 5,
        }
      },
      // Long Range RWD
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '475',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.3',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '475',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.3',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '481',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.4',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '481',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.4',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '473',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.3',
          chargingDC: '233',
          seats: 5,
        }
      },
      // Long Range AWD
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '424',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.7',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '424',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.7',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '430',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '430',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '422',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.7',
          chargingDC: '233',
          seats: 5,
        }
      },
      // GT
      {
        startYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'GT'
        },
        specs: {
          range: '365',
          powerMax: '430kW',
          torqueMax: '740Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '4.1',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'GT'
        },
        specs: {
          range: '365',
          powerMax: '430kW',
          torqueMax: '740Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '4.1',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'GT'
        },
        specs: {
          range: '371',
          powerMax: '430kW',
          torqueMax: '740Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '4.2',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'GT'
        },
        specs: {
          range: '371',
          powerMax: '430kW',
          torqueMax: '740Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '4.2',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'GT'
        },
        specs: {
          range: '365',
          powerMax: '430kW',
          torqueMax: '740Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '4.1',
          chargingDC: '233',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev6-standard-awd',
    modelName: 'EV6 Standard AWD',
    batteries: [
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '351',
          powerMax: '173kW',
          torqueMax: '605Nm',
          acceleration: '6.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '351',
          powerMax: '173kW',
          torqueMax: '605Nm',
          acceleration: '6.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '58kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '351',
          powerMax: '173kW',
          torqueMax: '605Nm',
          acceleration: '6.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          chargingDC: '233',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev6-longrange-rwd',
    modelName: 'EV6 Long Range 2WD',
    batteries: [
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '475',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.3',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '475',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.3',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '506',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.5',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '506',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.5',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '494',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.4',
          chargingDC: '233',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev6-longrange-awd',
    modelName: 'EV6 Long Range AWD',
    batteries: [
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '416',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '416',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.8',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '450',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '5.0',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '450',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '5.0',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '461',
          powerMax: '239kW',
          torqueMax: '605Nm',
          acceleration: '5.2',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.9',
          chargingDC: '233',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev6-gt',
    modelName: 'EV6 GT',
    batteries: [
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'GT AWD'
        },
        specs: {
          range: '342',
          powerMax: '430kW',
          torqueMax: '740Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '3.9',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'GT AWD'
        },
        specs: {
          range: '355',
          powerMax: '478kW',
          torqueMax: '770Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '3.8',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'GT AWD'
        },
        specs: {
          range: '355',
          powerMax: '478kW',
          torqueMax: '770Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '3.8',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'GT AWD'
        },
        specs: {
          range: '460',
          powerMax: '430kW',
          torqueMax: '740Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '4.7',
          chargingDC: '233',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'GT AWD'
        },
        specs: {
          range: '460',
          powerMax: '430kW',
          torqueMax: '740Nm',
          acceleration: '3.5',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '4.7',
          chargingDC: '233',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev9-standard',
    modelName: 'EV9 Standard',
    batteries: [
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '76.1kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '381',
          powerMax: '160kW',
          torqueMax: '350Nm',
          acceleration: '8.2',
          topSpeed: '180',
          driveType: 'RWD',
          efficiency: '4.4',
          chargingDC: '210',
          seats: 6,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '76.1kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '374',
          powerMax: '160kW',
          torqueMax: '350Nm',
          acceleration: '8.2',
          topSpeed: '180',
          driveType: 'RWD',
          efficiency: '4.2',
          chargingDC: '210',
          seats: 7,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '76.1kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '374',
          powerMax: '160kW',
          torqueMax: '350Nm',
          acceleration: '8.2',
          topSpeed: '180',
          driveType: 'RWD',
          efficiency: '4.2',
          chargingDC: '210',
          seats: 7,
        }
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev9-longrange-rwd',
    modelName: 'EV9 Long Range 2WD',
    batteries: [
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '99.8kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '501',
          powerMax: '150kW',
          torqueMax: '350Nm',
          acceleration: '9.4',
          topSpeed: '180',
          driveType: 'RWD',
          efficiency: '4.6',
          chargingDC: '210',
          seats: 7,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '99.8kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '501',
          powerMax: '150kW',
          torqueMax: '350Nm',
          acceleration: '9.4',
          topSpeed: '180',
          driveType: 'RWD',
          efficiency: '4.2',
          chargingDC: '210',
          seats: 7,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '99.8kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range 2WD'
        },
        specs: {
          range: '501',
          powerMax: '150kW',
          torqueMax: '350Nm',
          acceleration: '9.4',
          topSpeed: '180',
          driveType: 'RWD',
          efficiency: '4.2',
          chargingDC: '210',
          seats: 7,
        }
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev9-longrange-awd',
    modelName: 'EV9 Long Range AWD',
    batteries: [
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '99.8kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '445',
          powerMax: '283kW',
          torqueMax: '700Nm',
          acceleration: '5.3',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '4.1',
          chargingDC: '210',
          seats: 7,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '99.8kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '445',
          powerMax: '283kW',
          torqueMax: '700Nm',
          acceleration: '5.3',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '3.8',
          chargingDC: '210',
          seats: 7,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '99.8kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '445',
          powerMax: '283kW',
          torqueMax: '700Nm',
          acceleration: '5.3',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '3.8',
          chargingDC: '210',
          seats: 7,
        }
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev9-gtline-awd',
    modelName: 'EV9 GT-line AWD',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '99.8kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'GT-line AWD'
        },
        specs: {
          range: '443',
          powerMax: '283kW',
          torqueMax: '700Nm',
          acceleration: '5.3',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '3.8',
          chargingDC: '210',
          seats: 7,
        }
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev3-standard',
    modelName: 'EV3 Standard',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '58.3kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '350',
          powerMax: '150kW',
          torqueMax: '283Nm',
          acceleration: '7.5',
          topSpeed: '170',
          driveType: 'FWD',
          efficiency: '5.4',
          chargingDC: '128',
          seats: 5,
        },
        trims: [
          {
            trimId: 'air',
            trimName: 'Air',
            wheels: ['17인치'],
            efficiency: { '17인치': '5.4' },
            range: { '17인치': '350' }
          },
          {
            trimId: 'earth',
            trimName: 'Earth',
            wheels: ['17인치', '19인치'],
            efficiency: { '17인치': '5.4', '19인치': '5.1' },
            range: { '17인치': '350', '19인치': '330' }
          },
          {
            trimId: 'gt-line',
            trimName: 'GT-Line',
            wheels: ['19인치'],
            efficiency: { '19인치': '5.1' },
            range: { '19인치': '330' }
          }
        ]
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '58.3kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '350',
          powerMax: '115kW',
          torqueMax: '283Nm',
          acceleration: '7.5',
          topSpeed: '170',
          driveType: 'FWD',
          efficiency: '5.4',
          chargingDC: '128',
          seats: 5,
        },
        trims: [
          {
            trimId: 'air',
            trimName: 'Air',
            wheels: ['17인치'],
            efficiency: { '17인치': '5.4' },
            range: { '17인치': '350' }
          },
          {
            trimId: 'earth',
            trimName: 'Earth',
            wheels: ['17인치', '19인치'],
            efficiency: { '17인치': '5.4', '19인치': '5.1' },
            range: { '17인치': '350', '19인치': '330' }
          },
          {
            trimId: 'gt-line',
            trimName: 'GT-Line',
            wheels: ['19인치'],
            efficiency: { '19인치': '5.1' },
            range: { '19인치': '330' }
          }
        ]
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev3-longrange',
    modelName: 'EV3 Long Range',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '81.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '501',
          powerMax: '150kW',
          torqueMax: '283Nm',
          acceleration: '7.7',
          topSpeed: '170',
          driveType: 'FWD',
          efficiency: '5.7',
          chargingDC: '128',
          seats: 5,
        },
        trims: [
          {
            trimId: 'air',
            trimName: 'Air',
            wheels: ['17인치'],
            efficiency: { '17인치': '5.7' },
            range: { '17인치': '501' }
          },
          {
            trimId: 'earth',
            trimName: 'Earth',
            wheels: ['17인치', '19인치'],
            efficiency: { '17인치': '5.7', '19인치': '5.4' },
            range: { '17인치': '501', '19인치': '475' }
          },
          {
            trimId: 'gt-line',
            trimName: 'GT-Line',
            wheels: ['19인치'],
            efficiency: { '19인치': '5.4' },
            range: { '19인치': '475' }
          }
        ]
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '81.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '501',
          powerMax: '150kW',
          torqueMax: '283Nm',
          acceleration: '7.7',
          topSpeed: '170',
          driveType: 'FWD',
          efficiency: '5.7',
          chargingDC: '128',
          seats: 5,
        },
        trims: [
          {
            trimId: 'air',
            trimName: 'Air',
            wheels: ['17인치'],
            efficiency: { '17인치': '5.7' },
            range: { '17인치': '501' }
          },
          {
            trimId: 'earth',
            trimName: 'Earth',
            wheels: ['17인치', '19인치'],
            efficiency: { '17인치': '5.7', '19인치': '5.4' },
            range: { '17인치': '501', '19인치': '475' }
          },
          {
            trimId: 'gt-line',
            trimName: 'GT-Line',
            wheels: ['19인치'],
            efficiency: { '19인치': '5.4' },
            range: { '19인치': '475' }
          }
        ]
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ray-ev',
    modelName: 'Ray EV',
    batteries: [
      {
        startYear: 2011,
        endYear: 2018,
        battery: {
          manufacturers: ['LG화학'],
          capacity: '16kWh',
          warranty: '5년/10만km',
          cellType: 'Lithium-ion',
          variant: 'Standard'
        },
        specs: {
          range: '91',
          powerMax: '50kW',
          torqueMax: '167Nm',
          acceleration: '15.9',
          topSpeed: '130',
          driveType: 'FWD',
          efficiency: '5.0',
          chargingDC: '50',
          seats: 4,
        },
        trims: [
          {
            trimId: 'standard',
            trimName: '기본형',
            wheels: ['15인치'],
            efficiency: { '15인치': '5.0' },
            range: { '15인치': '91' }
          }
        ]
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '35.2kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'Standard'
        },
        specs: {
          range: '205',
          powerMax: '64.3kW',
          torqueMax: '147Nm',
          acceleration: '12.3',
          topSpeed: '140',
          driveType: 'FWD',
          efficiency: '5.1',
          chargingDC: '150',
          seats: 4,
        },
        trims: [
          {
            trimId: 'standard',
            trimName: '기본형',
            wheels: ['15인치'],
            efficiency: { '15인치': '5.1' },
            range: { '15인치': '205' }
          },
          {
            trimId: 'van-1',
            trimName: '밴 1인승',
            wheels: ['15인치'],
            efficiency: { '15인치': '5.1' },
            range: { '15인치': '205' },
            note: '상용차 버전, 1인승'
          },
          {
            trimId: 'van-2',
            trimName: '밴 2인승',
            wheels: ['15인치'],
            efficiency: { '15인치': '5.1' },
            range: { '15인치': '205' },
            note: '상용차 버전, 2인승'
          }
        ]
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '35.2kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'Standard'
        },
        specs: {
          range: '205',
          powerMax: '64.3kW',
          torqueMax: '147Nm',
          acceleration: '12.3',
          topSpeed: '140',
          driveType: 'FWD',
          efficiency: '5.1',
          chargingDC: '150',
          seats: 4,
        },
        trims: [
          {
            trimId: 'standard',
            trimName: '기본형',
            wheels: ['15인치'],
            efficiency: { '15인치': '5.1' },
            range: { '15인치': '205' }
          },
          {
            trimId: 'van-1',
            trimName: '밴 1인승',
            wheels: ['15인치'],
            efficiency: { '15인치': '5.1' },
            range: { '15인치': '205' },
            note: '상용차 버전, 1인승'
          },
          {
            trimId: 'van-2',
            trimName: '밴 2인승',
            wheels: ['15인치'],
            efficiency: { '15인치': '5.1' },
            range: { '15인치': '205' },
            note: '상용차 버전, 2인승'
          }
        ]
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev4-standard',
    modelName: 'EV4 Standard',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '58.3kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '382',
          powerMax: '150kW',
          torqueMax: '283Nm',
          acceleration: '7.4',
          topSpeed: '170',
          driveType: 'FWD',
          efficiency: '5.8',
          chargingDC: '150',
          seats: 5,
        },
        trims: [
          {
            trimId: 'air',
            trimName: 'Air',
            wheels: ['17인치'],
            efficiency: { '17인치': '5.8' },
            range: { '17인치': '382' }
          },
          {
            trimId: 'earth',
            trimName: 'Earth',
            wheels: ['17인치', '19인치'],
            efficiency: { '17인치': '5.8', '19인치': '5.4' },
            range: { '17인치': '382', '19인치': '354' }
          },
          {
            trimId: 'gt-line',
            trimName: 'GT-Line',
            wheels: ['19인치'],
            efficiency: { '19인치': '5.4' },
            range: { '19인치': '354' }
          }
        ]
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'ev4-longrange',
    modelName: 'EV4 Long Range',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '81.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '533',
          powerMax: '150kW',
          torqueMax: '283Nm',
          acceleration: '7.7',
          topSpeed: '170',
          driveType: 'FWD',
          efficiency: '5.8',
          chargingDC: '150',
          seats: 5,
        },
        trims: [
          {
            trimId: 'air',
            trimName: 'Air',
            wheels: ['17인치'],
            efficiency: { '17인치': '5.8' },
            range: { '17인치': '533' }
          },
          {
            trimId: 'earth',
            trimName: 'Earth',
            wheels: ['17인치', '19인치'],
            efficiency: { '17인치': '5.8', '19인치': '5.5' },
            range: { '17인치': '533', '19인치': '502' }
          },
          {
            trimId: 'gt-line',
            trimName: 'GT-Line',
            wheels: ['19인치'],
            efficiency: { '19인치': '5.4' },
            range: { '19인치': '495' }
          }
        ]
      }
    ]
  },
  {
    brandId: 'kia',
    modelId: 'niro-ev',
    modelName: '니로 EV',
    batteries: [
      {
        startYear: 2018,
        endYear: 2021,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '64kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '385',
          powerMax: '150kW',
          torqueMax: '395Nm',
          acceleration: '7.8',
          topSpeed: '167',
          driveType: 'FWD',
          efficiency: '5.4',
          chargingDC: '77',
          seats: 5,
        }
      },
      {
        startYear: 2022,
        endYear: 2022,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '64kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '385',
          powerMax: '150kW',
          torqueMax: '395Nm',
          acceleration: '7.8',
          topSpeed: '167',
          driveType: 'FWD',
          efficiency: '5.4',
          chargingDC: '77',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '401',
          powerMax: '150kW',
          torqueMax: '255Nm',
          acceleration: '7.8',
          topSpeed: '167',
          driveType: 'FWD',
          efficiency: '5.6',
          chargingDC: '77',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '401',
          powerMax: '150kW',
          torqueMax: '255Nm',
          acceleration: '7.8',
          topSpeed: '167',
          driveType: 'FWD',
          efficiency: '5.6',
          chargingDC: '77',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '401',
          powerMax: '150kW',
          torqueMax: '255Nm',
          acceleration: '7.8',
          topSpeed: '167',
          driveType: 'FWD',
          efficiency: '5.6',
          chargingDC: '77',
          seats: 5,
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '401',
          powerMax: '150kW',
          torqueMax: '255Nm',
          acceleration: '7.8',
          topSpeed: '167',
          driveType: 'FWD',
          efficiency: '5.6',
          chargingDC: '77',
          seats: 5,
        }
      }
    ]
  },
  
  // ===== 제네시스 =====
  {
    brandId: 'genesis',
    modelId: 'gv60-standard-rwd',
    modelName: 'GV60 Standard 2WD',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '451',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.8',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.1',
          chargingDC: '350',
          seats: 5
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '451',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.8',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.1',
          chargingDC: '350',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '451',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.8',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.1',
          chargingDC: '350',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard 2WD'
        },
        specs: {
          range: '451',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.8',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.1',
          chargingDC: '350',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'genesis',
    modelId: 'gv60-standard-awd',
    modelName: 'GV60 Standard AWD',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '400',
          powerMax: '234kW',
          torqueMax: '605Nm',
          acceleration: '5.5',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.5',
          chargingDC: '350',
          seats: 5
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '400',
          powerMax: '234kW',
          torqueMax: '605Nm',
          acceleration: '5.5',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.5',
          chargingDC: '350',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '400',
          powerMax: '234kW',
          torqueMax: '605Nm',
          acceleration: '5.5',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.5',
          chargingDC: '350',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard AWD'
        },
        specs: {
          range: '400',
          powerMax: '234kW',
          torqueMax: '605Nm',
          acceleration: '5.5',
          topSpeed: '185',
          driveType: 'AWD',
          efficiency: '4.5',
          chargingDC: '350',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'genesis',
    modelId: 'gv60-performance',
    modelName: 'GV60 Performance',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Performance AWD'
        },
        specs: {
          range: '368',
          powerMax: '360kW',
          torqueMax: '700Nm',
          acceleration: '4.0',
          topSpeed: '235',
          driveType: 'AWD',
          efficiency: '4.1',
          chargingDC: '350',
          seats: 5
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Performance AWD'
        },
        specs: {
          range: '368',
          powerMax: '360kW',
          torqueMax: '700Nm',
          acceleration: '4.0',
          topSpeed: '235',
          driveType: 'AWD',
          efficiency: '4.1',
          chargingDC: '350',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Performance AWD'
        },
        specs: {
          range: '368',
          powerMax: '360kW',
          torqueMax: '700Nm',
          acceleration: '4.0',
          topSpeed: '235',
          driveType: 'AWD',
          efficiency: '4.1',
          chargingDC: '350',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Performance AWD'
        },
        specs: {
          range: '368',
          powerMax: '360kW',
          torqueMax: '700Nm',
          acceleration: '4.0',
          topSpeed: '235',
          driveType: 'AWD',
          efficiency: '4.1',
          chargingDC: '350',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'genesis',
    modelId: 'gv70-electrified',
    modelName: 'Electrified GV70',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Electrified AWD'
        },
        specs: {
          range: '400',
          powerMax: '320kW',
          torqueMax: '605Nm',
          acceleration: '4.2',
          topSpeed: '230',
          driveType: 'AWD',
          efficiency: '5.2',
          chargingDC: '233',
          seats: 5
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Electrified AWD'
        },
        specs: {
          range: '400',
          powerMax: '320kW',
          torqueMax: '605Nm',
          acceleration: '4.2',
          topSpeed: '230',
          driveType: 'AWD',
          efficiency: '5.2',
          chargingDC: '233',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Electrified AWD'
        },
        specs: {
          range: '400',
          powerMax: '320kW',
          torqueMax: '605Nm',
          acceleration: '4.2',
          topSpeed: '230',
          driveType: 'AWD',
          efficiency: '5.2',
          chargingDC: '300',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '77.4kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Electrified AWD'
        },
        specs: {
          range: '400',
          powerMax: '320kW',
          torqueMax: '605Nm',
          acceleration: '4.2',
          topSpeed: '230',
          driveType: 'AWD',
          efficiency: '5.2',
          chargingDC: '300',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'genesis',
    modelId: 'g80-electrified',
    modelName: 'Electrified G80',
    batteries: [
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['SK온'],
          capacity: '87.2kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Electrified AWD'
        },
        specs: {
          range: '427',
          powerMax: '272kW',
          torqueMax: '700Nm',
          acceleration: '4.9',
          topSpeed: '225',
          driveType: 'AWD',
          efficiency: '4.9',
          chargingDC: '233',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '94.5kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Electrified AWD'
        },
        specs: {
          range: '475',
          powerMax: '272kW',
          torqueMax: '700Nm',
          acceleration: '4.9',
          topSpeed: '225',
          driveType: 'AWD',
          efficiency: '5.0',
          chargingDC: '233',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK온'],
          capacity: '94.5kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Electrified AWD'
        },
        specs: {
          range: '475',
          powerMax: '272kW',
          torqueMax: '700Nm',
          acceleration: '4.9',
          topSpeed: '225',
          driveType: 'AWD',
          efficiency: '5.0',
          chargingDC: '233',
          seats: 5
        }
      }
    ]
  },
  
  // ===== 테슬라 =====
  {
    brandId: 'tesla',
    modelId: 'model-3-rwd',
    modelName: 'Model 3 RWD',
    batteries: [
      {
        startYear: 2017,
        endYear: 2020,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '54kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCA',
          variant: 'Standard Range Plus'
        },
        specs: {
          range: '386',
          powerMax: '175kW',
          torqueMax: '375Nm',
          acceleration: '5.6',
          topSpeed: '225',
          driveType: 'RWD',
          efficiency: '6.1',
          chargingDC: '170',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '60kWh',
          warranty: '8년/19.2만km',
          cellType: 'LFP',
          variant: 'Standard Range Plus'
        },
        specs: {
          range: '438',
          powerMax: '208kW',
          torqueMax: '420Nm',
          acceleration: '6.1',
          topSpeed: '201',
          driveType: 'RWD',
          efficiency: '6.4',
          chargingDC: '170',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '60kWh',
          warranty: '8년/19.2만km',
          cellType: 'LFP',
          variant: 'RWD'
        },
        specs: {
          range: '438',
          powerMax: '208kW',
          torqueMax: '420Nm',
          acceleration: '6.1',
          topSpeed: '201',
          driveType: 'RWD',
          efficiency: '6.4',
          chargingDC: '170',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '60kWh',
          warranty: '8년/19.2만km',
          cellType: 'LFP',
          variant: 'RWD'
        },
        specs: {
          range: '438',
          powerMax: '208kW',
          torqueMax: '420Nm',
          acceleration: '6.1',
          topSpeed: '201',
          driveType: 'RWD',
          efficiency: '6.4',
          chargingDC: '170',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'tesla',
    modelId: 'model-3-longrange',
    modelName: 'Model 3 Long Range AWD',
    batteries: [
      {
        startYear: 2017,
        endYear: 2020,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCA',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '518',
          powerMax: '340kW',
          torqueMax: '639Nm',
          acceleration: '4.6',
          topSpeed: '233',
          driveType: 'AWD',
          efficiency: '5.8',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '547',
          powerMax: '366kW',
          torqueMax: '639Nm',
          acceleration: '4.4',
          topSpeed: '233',
          driveType: 'AWD',
          efficiency: '5.9',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '547',
          powerMax: '366kW',
          torqueMax: '639Nm',
          acceleration: '4.4',
          topSpeed: '201',
          driveType: 'AWD',
          efficiency: '5.9',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '547',
          powerMax: '366kW',
          torqueMax: '639Nm',
          acceleration: '4.4',
          topSpeed: '201',
          driveType: 'AWD',
          efficiency: '5.9',
          chargingDC: '250',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'tesla',
    modelId: 'model-3-performance',
    modelName: 'Model 3 Performance',
    batteries: [
      {
        startYear: 2018,
        endYear: 2020,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCA',
          variant: 'Performance AWD'
        },
        specs: {
          range: '507',
          powerMax: '377kW',
          torqueMax: '639Nm',
          acceleration: '3.3',
          topSpeed: '261',
          driveType: 'AWD',
          efficiency: '5.6',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Performance AWD'
        },
        specs: {
          range: '507',
          powerMax: '460kW',
          torqueMax: '639Nm',
          acceleration: '3.1',
          topSpeed: '261',
          driveType: 'AWD',
          efficiency: '5.5',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Performance AWD'
        },
        specs: {
          range: '507',
          powerMax: '460kW',
          torqueMax: '639Nm',
          acceleration: '3.1',
          topSpeed: '262',
          driveType: 'AWD',
          efficiency: '5.5',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Performance AWD'
        },
        specs: {
          range: '507',
          powerMax: '460kW',
          torqueMax: '639Nm',
          acceleration: '3.1',
          topSpeed: '262',
          driveType: 'AWD',
          efficiency: '5.5',
          chargingDC: '250',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'tesla',
    modelId: 'model-y-rwd',
    modelName: 'Model Y RWD',
    batteries: [
      {
        startYear: 2020,
        endYear: 2021,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCA',
          variant: 'Standard Range'
        },
        specs: {
          range: '394',
          powerMax: '190kW',
          torqueMax: '375Nm',
          acceleration: '6.9',
          topSpeed: '193',
          driveType: 'RWD',
          efficiency: '4.7',
          chargingDC: '170',
          seats: 5
        }
      },
      {
        startYear: 2022,
        endYear: 2023,
        battery: {
          manufacturers: ['BYD'],
          capacity: '60kWh',
          warranty: '8년/19.2만km',
          cellType: 'LFP',
          variant: 'RWD'
        },
        specs: {
          range: '350',
          powerMax: '220kW',
          torqueMax: '420Nm',
          acceleration: '6.9',
          topSpeed: '217',
          driveType: 'RWD',
          efficiency: '5.2',
          chargingDC: '170',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['BYD'],
          capacity: '60kWh',
          warranty: '8년/19.2만km',
          cellType: 'LFP',
          variant: 'RWD'
        },
        specs: {
          range: '350',
          powerMax: '220kW',
          torqueMax: '420Nm',
          acceleration: '6.9',
          topSpeed: '217',
          driveType: 'RWD',
          efficiency: '5.2',
          chargingDC: '170',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['BYD'],
          capacity: '60kWh',
          warranty: '8년/19.2만km',
          cellType: 'LFP',
          variant: 'RWD'
        },
        specs: {
          range: '350',
          powerMax: '220kW',
          torqueMax: '420Nm',
          acceleration: '6.9',
          topSpeed: '217',
          driveType: 'RWD',
          efficiency: '5.2',
          chargingDC: '170',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'tesla',
    modelId: 'model-y-longrange',
    modelName: 'Model Y Long Range AWD',
    batteries: [
      {
        startYear: 2020,
        endYear: 2021,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCA',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '507',
          powerMax: '351kW',
          torqueMax: '660Nm',
          acceleration: '5.1',
          topSpeed: '217',
          driveType: 'AWD',
          efficiency: '5.7',
          chargingDC: '250',
          seats: 7
        }
      },
      {
        startYear: 2022,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '514',
          powerMax: '378kW',
          torqueMax: '660Nm',
          acceleration: '5.0',
          topSpeed: '217',
          driveType: 'AWD',
          efficiency: '5.5',
          chargingDC: '250',
          seats: 7
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '514',
          powerMax: '378kW',
          torqueMax: '660Nm',
          acceleration: '5.0',
          topSpeed: '217',
          driveType: 'AWD',
          efficiency: '5.5',
          chargingDC: '250',
          seats: 7
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '514',
          powerMax: '378kW',
          torqueMax: '660Nm',
          acceleration: '5.0',
          topSpeed: '217',
          driveType: 'AWD',
          efficiency: '5.5',
          chargingDC: '250',
          seats: 7
        }
      }
    ]
  },
  {
    brandId: 'tesla',
    modelId: 'model-y-performance',
    modelName: 'Model Y Performance',
    batteries: [
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Performance AWD'
        },
        specs: {
          range: '487',
          powerMax: '450kW',
          torqueMax: '660Nm',
          acceleration: '3.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.2',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Performance AWD'
        },
        specs: {
          range: '487',
          powerMax: '450kW',
          torqueMax: '660Nm',
          acceleration: '3.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.2',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Performance AWD'
        },
        specs: {
          range: '487',
          powerMax: '450kW',
          torqueMax: '660Nm',
          acceleration: '3.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.2',
          chargingDC: '250',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'tesla',
    modelId: 'model-s-longrange',
    modelName: 'Model S Long Range',
    batteries: [
      {
        startYear: 2021,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '652',
          powerMax: '493kW',
          torqueMax: '700Nm',
          acceleration: '3.2',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.8',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2022,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '652',
          powerMax: '493kW',
          torqueMax: '700Nm',
          acceleration: '3.2',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.8',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '652',
          powerMax: '493kW',
          torqueMax: '700Nm',
          acceleration: '3.2',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.8',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '652',
          powerMax: '493kW',
          torqueMax: '700Nm',
          acceleration: '3.2',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.8',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Long Range AWD'
        },
        specs: {
          range: '652',
          powerMax: '493kW',
          torqueMax: '700Nm',
          acceleration: '3.2',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.8',
          chargingDC: '250',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'tesla',
    modelId: 'model-s-plaid',
    modelName: 'Model S Plaid',
    batteries: [
      {
        startYear: 2021,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Plaid AWD'
        },
        specs: {
          range: '600',
          powerMax: '760kW',
          torqueMax: '1420Nm',
          acceleration: '2.1',
          topSpeed: '322',
          driveType: 'AWD',
          efficiency: '5.4',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2022,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Plaid AWD'
        },
        specs: {
          range: '600',
          powerMax: '760kW',
          torqueMax: '1420Nm',
          acceleration: '2.1',
          topSpeed: '322',
          driveType: 'AWD',
          efficiency: '5.4',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Plaid AWD'
        },
        specs: {
          range: '600',
          powerMax: '760kW',
          torqueMax: '1420Nm',
          acceleration: '2.1',
          topSpeed: '322',
          driveType: 'AWD',
          efficiency: '5.4',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Plaid AWD'
        },
        specs: {
          range: '600',
          powerMax: '760kW',
          torqueMax: '1420Nm',
          acceleration: '2.1',
          topSpeed: '322',
          driveType: 'AWD',
          efficiency: '5.4',
          chargingDC: '250',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Plaid AWD'
        },
        specs: {
          range: '600',
          powerMax: '760kW',
          torqueMax: '1420Nm',
          acceleration: '2.1',
          topSpeed: '322',
          driveType: 'AWD',
          efficiency: '5.4',
          chargingDC: '250',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'tesla',
    modelId: 'cybertruck-dual',
    modelName: '사이버트럭 Dual Motor AWD',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '123kWh',
          warranty: '8년/24만km',
          cellType: '4680',
          variant: 'Dual Motor AWD'
        },
        specs: {
          range: '547',
          powerMax: '448kW',
          torqueMax: '930Nm',
          acceleration: '4.1',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '4.0',
          chargingDC: '250',
          seats: 6
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '123kWh',
          warranty: '8년/24만km',
          cellType: '4680',
          variant: 'Dual Motor AWD'
        },
        specs: {
          range: '547',
          powerMax: '448kW',
          torqueMax: '930Nm',
          acceleration: '4.1',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '4.0',
          chargingDC: '250',
          seats: 6
        }
      }
    ]
  },
  {
    brandId: 'tesla',
    modelId: 'cybertruck-cyberbeast',
    modelName: '사이버트럭 Cyberbeast',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '123kWh',
          warranty: '8년/24만km',
          cellType: '4680',
          variant: 'Cyberbeast Tri-Motor AWD'
        },
        specs: {
          range: '515',
          powerMax: '630kW',
          torqueMax: '1355Nm',
          acceleration: '2.9',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '3.8',
          chargingDC: '250',
          seats: 6
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['파나소닉'],
          capacity: '123kWh',
          warranty: '8년/24만km',
          cellType: '4680',
          variant: 'Cyberbeast Tri-Motor AWD'
        },
        specs: {
          range: '515',
          powerMax: '630kW',
          torqueMax: '1355Nm',
          acceleration: '2.9',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '3.8',
          chargingDC: '250',
          seats: 6
        }
      }
    ]
  },
  
  // ===== BMW =====
  {
    brandId: 'bmw',
    modelId: 'i4-edrive40',
    modelName: 'i4 eDrive40',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['삼성SDI'],
          capacity: '83.9kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'eDrive40'
        },
        specs: {
          range: '484',
          powerMax: '250kW',
          torqueMax: '430Nm',
          acceleration: '5.7',
          topSpeed: '190',
          driveType: 'RWD',
          efficiency: '5.8',
          chargingDC: '205',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'bmw',
    modelId: 'i4-m50',
    modelName: 'i4 M50',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['삼성SDI'],
          capacity: '83.9kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'M50'
        },
        specs: {
          range: '394',
          powerMax: '400kW',
          torqueMax: '795Nm',
          acceleration: '3.9',
          topSpeed: '225',
          driveType: 'AWD',
          efficiency: '4.7',
          chargingDC: '205',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'bmw',
    modelId: 'ix-xdrive40',
    modelName: 'iX xDrive40',
    batteries: [
      {
        startYear: 2021,
        battery: {
          manufacturers: ['CATL'],
          capacity: '76.6kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive40'
        },
        specs: {
          range: '425',
          powerMax: '240kW',
          torqueMax: '630Nm',
          acceleration: '6.1',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '5.5',
          chargingDC: '195',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'bmw',
    modelId: 'ix-xdrive50',
    modelName: 'iX xDrive50',
    batteries: [
      {
        startYear: 2021,
        battery: {
          manufacturers: ['삼성SDI'],
          capacity: '111.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive50'
        },
        specs: {
          range: '630',
          powerMax: '385kW',
          torqueMax: '765Nm',
          acceleration: '4.6',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '5.6',
          chargingDC: '195',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'bmw',
    modelId: 'ix-m60',
    modelName: 'iX M60',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['삼성SDI'],
          capacity: '111.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'M60'
        },
        specs: {
          range: '566',
          powerMax: '455kW',
          torqueMax: '795Nm',
          acceleration: '3.8',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.2',
          chargingDC: '195',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'bmw',
    modelId: 'i7-edrive50',
    modelName: 'i7 eDrive50',
    batteries: [
      {
        startYear: 2023,
        battery: {
          manufacturers: ['삼성SDI'],
          capacity: '101.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'eDrive50'
        },
        specs: {
          range: '611',
          powerMax: '335kW',
          torqueMax: '586Nm',
          acceleration: '5.5',
          topSpeed: '205',
          driveType: 'RWD',
          efficiency: '6.0',
          chargingDC: '195',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'bmw',
    modelId: 'i7-xdrive60',
    modelName: 'i7 xDrive60',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['삼성SDI'],
          capacity: '101.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive60'
        },
        specs: {
          range: '625',
          powerMax: '400kW',
          torqueMax: '745Nm',
          acceleration: '4.7',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '5.8',
          chargingDC: '195',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'bmw',
    modelId: 'i7-m70',
    modelName: 'i7 M70',
    batteries: [
      {
        startYear: 2023,
        battery: {
          manufacturers: ['삼성SDI'],
          capacity: '101.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'M70'
        },
        specs: {
          range: '560',
          powerMax: '485kW',
          torqueMax: '1100Nm',
          acceleration: '3.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.5',
          chargingDC: '195',
          seats: 5
        }
      }
    ]
  },
  
  // ===== 메르세데스-벤츠 =====
  {
    brandId: 'mercedes',
    modelId: 'eqe',
    modelName: 'EQE 350+',
    batteries: [
      {
        startYear: 2023,
        endYear: 2023,
        battery: {
          manufacturers: ['Farasis'],
          capacity: '89kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '350+'
        },
        specs: {
          range: '628',
          powerMax: '215kW',
          torqueMax: '565Nm',
          acceleration: '6.4',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '4.3',
          chargingDC: '170',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['Farasis'],
          capacity: '96kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '350+'
        },
        specs: {
          range: '653',
          powerMax: '215kW',
          torqueMax: '565Nm',
          acceleration: '6.4',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '4.4',
          chargingDC: '170',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'mercedes',
    modelId: 'eqs-450plus',
    modelName: 'EQS 450+',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['CATL'],
          capacity: '107.8kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '450+'
        },
        specs: {
          range: '638',
          powerMax: '245kW',
          torqueMax: '565Nm',
          acceleration: '6.2',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '5.5',
          chargingDC: '200',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'mercedes',
    modelId: 'eqs-amg53',
    modelName: 'EQS AMG 53 4MATIC+',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['CATL'],
          capacity: '107.8kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: 'AMG 53 4MATIC+'
        },
        specs: {
          range: '445',
          powerMax: '560kW',
          torqueMax: '1020Nm',
          acceleration: '3.4',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '4.1',
          chargingDC: '200',
          seats: 5
        }
      }
    ]
  },
  
  // ===== BYD =====
  {
    brandId: 'byd',
    modelId: 'seal-standard',
    modelName: '씰 Standard Range',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['BYD'],
          capacity: '61.4kWh',
          warranty: '8년/16만km',
          cellType: 'LFP (Blade Battery)',
          variant: 'Dynamic RWD'
        },
        specs: {
          range: '460',
          powerMax: '150kW',
          torqueMax: '310Nm',
          acceleration: '7.9',
          topSpeed: '160',
          driveType: 'RWD',
          efficiency: '7.5',
          chargingDC: '88',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'byd',
    modelId: 'seal-performance',
    modelName: '씰 Performance AWD',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['BYD'],
          capacity: '82.5kWh',
          warranty: '8년/16만km',
          cellType: 'LFP (Blade Battery)',
          variant: 'Performance AWD'
        },
        specs: {
          range: '520',
          powerMax: '390kW',
          torqueMax: '670Nm',
          acceleration: '3.8',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '6.3',
          chargingDC: '150',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'byd',
    modelId: 'atto-3',
    modelName: '아토 3 (ATTO 3)',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['BYD'],
          capacity: '60.48kWh',
          warranty: '8년/12만km',
          cellType: 'LFP (Blade Battery)',
          variant: 'Standard'
        },
        specs: {
          range: '321',
          powerMax: '150kW',
          torqueMax: '310Nm',
          acceleration: '7.3',
          topSpeed: '160',
          driveType: 'FWD',
          efficiency: '5.3',
          chargingDC: '88',
          seats: 5
        }
      }
    ]
  },
  {
    brandId: 'byd',
    modelId: 'sealion-7-standard',
    modelName: '씨라이언 7 Standard Range 2WD',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['BYD'],
          capacity: '71.8kWh',
          cellType: 'LFP (Blade Battery)'
        },
        specs: {
          range: '481',
          powerMax: '170kW',
          acceleration: '8.5',
          topSpeed: '175',
          driveType: 'FWD',
          seats: 7,
        }
      }
    ]
  },
  {
    brandId: 'byd',
    modelId: 'sealion-7-longrange',
    modelName: '씨라이언 7 Long Range AWD',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['BYD'],
          capacity: '87.04kWh',
          cellType: 'LFP (Blade Battery)'
        },
        specs: {
          range: '542',
          powerMax: '390kW',
          acceleration: '4.5',
          topSpeed: '175',
          driveType: 'AWD',
          seats: 7,
        }
      }
    ]
  },
  {
    brandId: 'byd',
    modelId: 'dolphin-standard',
    modelName: '돌핀 Standard',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['BYD'],
          capacity: '44.9kWh',
          cellType: 'LFP (Blade Battery)'
        },
        specs: {
          range: '345',
          powerMax: '70kW',
          acceleration: '10.9',
          topSpeed: '150',
          driveType: 'FWD',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'byd',
    modelId: 'dolphin-longrange',
    modelName: '돌핀 Long Range',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['BYD'],
          capacity: '60.48kWh',
          cellType: 'LFP (Blade Battery)'
        },
        specs: {
          range: '427',
          powerMax: '130kW',
          acceleration: '7.5',
          topSpeed: '160',
          driveType: 'FWD',
          seats: 5,
        }
      }
    ]
  },
  
  // ===== 폴스타 =====
  {
    brandId: 'polestar',
    modelId: 'polestar-2-standard',
    modelName: '폴스타 2 Standard Range Single Motor',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '69kWh'
        },
        specs: {
          range: '417',
          powerMax: '200kW',
          acceleration: '6.2',
          topSpeed: '205',
          driveType: 'RWD',
        }
      }
    ]
  },
  {
    brandId: 'polestar',
    modelId: 'polestar-2-longrange',
    modelName: '폴스타 2 Long Range Dual Motor',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '78kWh'
        },
        specs: {
          range: '487',
          powerMax: '310kW',
          acceleration: '4.5',
          topSpeed: '205',
          driveType: 'AWD',
        }
      }
    ]
  },
  
  // ===== 볼보 =====
  {
    brandId: 'volvo',
    modelId: 'ex30-single',
    modelName: 'EX30 Single Motor',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['BYD'],
          capacity: '51kWh',
          cellType: 'LFP'
        },
        specs: {
          range: '344',
          powerMax: '200kW',
          acceleration: '5.3',
          topSpeed: '180',
          driveType: 'RWD',
        }
      }
    ]
  },
  {
    brandId: 'volvo',
    modelId: 'ex30-performance',
    modelName: 'EX30 Twin Motor Performance',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '69kWh'
        },
        specs: {
          range: '476',
          powerMax: '315kW',
          acceleration: '3.6',
          topSpeed: '180',
          driveType: 'AWD',
        }
      }
    ]
  },
  
  // ===== 폭스바겐 =====
  {
    brandId: 'volkswagen',
    modelId: 'id4-pro',
    modelName: 'ID.4 Pro',
    batteries: [
      {
        startYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '77kWh'
        },
        specs: {
          range: '405',
          powerMax: '150kW',
          acceleration: '8.5',
          topSpeed: '160',
          driveType: 'RWD',
        }
      }
    ]
  },
  {
    brandId: 'volkswagen',
    modelId: 'id4-gtx',
    modelName: 'ID.4 GTX',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '77kWh'
        },
        specs: {
          range: '380',
          powerMax: '250kW',
          acceleration: '6.2',
          topSpeed: '180',
          driveType: 'AWD',
        }
      }
    ]
  },
  
  // ===== 포르쉐 =====
  {
    brandId: 'porsche',
    modelId: 'taycan-base',
    modelName: '타이칸 Base RWD',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '79.2kWh'
        },
        specs: {
          range: '431',
          powerMax: '240kW',
          acceleration: '5.4',
          topSpeed: '230',
          driveType: 'RWD',
        }
      }
    ]
  },
  {
    brandId: 'porsche',
    modelId: 'taycan-4s',
    modelName: '타이칸 4S',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '93.4kWh'
        },
        specs: {
          range: '464',
          powerMax: '360kW',
          acceleration: '4.0',
          topSpeed: '250',
          driveType: 'AWD',
        }
      }
    ]
  },
  {
    brandId: 'porsche',
    modelId: 'taycan-turbo-s',
    modelName: '타이칸 Turbo S',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '93.4kWh'
        },
        specs: {
          range: '412',
          powerMax: '560kW',
          acceleration: '2.8',
          topSpeed: '260',
          driveType: 'AWD',
        }
      }
    ]
  },
  
  // ===== 아우디 =====
  {
    brandId: 'audi',
    modelId: 'e-tron-gt-quattro',
    modelName: 'e-tron GT quattro',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '93.4kWh'
        },
        specs: {
          range: '488',
          powerMax: '390kW',
          acceleration: '4.1',
          topSpeed: '245',
          driveType: 'AWD',
        }
      }
    ]
  },
  {
    brandId: 'audi',
    modelId: 'e-tron-gt-rs',
    modelName: 'e-tron GT RS',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '93.4kWh'
        },
        specs: {
          range: '472',
          powerMax: '475kW',
          acceleration: '3.3',
          topSpeed: '250',
          driveType: 'AWD',
        }
      }
    ]
  },
  // ===== 현대자동차 - 2025 코나 EV =====
  {
    brandId: 'hyundai',
    modelId: 'kona-ev-standard-2025',
    modelName: '코나 EV Standard',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '48.6kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '311',
          powerMax: '99kW',
          torqueMax: '255Nm',
          topSpeed: '155',
          driveType: 'FWD',
          efficiency: '5.5',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'kona-ev-longrange-2025',
    modelName: '코나 EV Long Range',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '417',
          powerMax: '150kW',
          torqueMax: '255Nm',
          topSpeed: '172',
          driveType: 'FWD',
          efficiency: '5.5',
          seats: 5,
        }
      }
    ]
  },
  {
    brandId: 'hyundai',
    modelId: 'kona-ev-n-line-2025',
    modelName: '코나 EV N라인',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'N라인'
        },
        specs: {
          range: '417',
          powerMax: '150kW',
          torqueMax: '255Nm',
          topSpeed: '172',
          driveType: 'FWD',
          efficiency: '4.7',
          seats: 5,
        }
      }
    ]
  }
];

// 유틸리티 함수들

// 브랜드 목록 조회
export const getAvailableBrands = () => {
  const brands = new Map<string, string>();
  
  VEHICLE_BATTERY_DATABASE.forEach(vehicle => {
    const brandName = vehicle.brandId === 'hyundai' ? '현대자동차' :
                     vehicle.brandId === 'kia' ? '기아자동차' :
                     vehicle.brandId === 'genesis' ? '제네시스' :
                     vehicle.brandId === 'tesla' ? '테슬라' :
                     vehicle.brandId === 'bmw' ? 'BMW' :
                     vehicle.brandId === 'mercedes' ? '메르세데스-벤츠' :
                     vehicle.brandId === 'byd' ? 'BYD' :
                     vehicle.brandId === 'polestar' ? '폴스타' :
                     vehicle.brandId === 'volvo' ? '볼보' :
                     vehicle.brandId === 'volkswagen' ? '폭스바겐' :
                     vehicle.brandId === 'porsche' ? '포르쉐' :
                     vehicle.brandId === 'audi' ? '아우디' :
                     vehicle.brandId;
    
    brands.set(vehicle.brandId, brandName);
  });
  
  return Array.from(brands.entries()).map(([id, name]) => ({
    id,
    name
  })).sort((a, b) => a.name.localeCompare(b.name));
};

// 특정 브랜드의 모델 목록 조회
export const getAvailableModels = (brandId: string): VehicleModel[] => {
  const models = VEHICLE_BATTERY_DATABASE
    .filter(vehicle => vehicle.brandId === brandId)
    .map(vehicle => {
      // 해당 차량의 모든 출시 연도를 수집
      const yearSet = new Set<string>();
      
      vehicle.batteries.forEach(battery => {
        const startYear = battery.startYear;
        const endYear = battery.endYear || new Date().getFullYear();
        
        // startYear부터 endYear까지의 모든 연도 추가
        for (let year = startYear; year <= endYear; year++) {
          yearSet.add(year.toString());
        }
      });
      
      // 연도를 내림차순으로 정렬 (최신순)
      const years = Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a));
      
      return {
        id: vehicle.modelId,
        name: vehicle.modelName || vehicle.modelId,
        years: years
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  
  return models;
};

// 차량의 배터리 히스토리 조회
export const getVehicleBatteryHistory = (brandId: string, modelId: string) => {
  const vehicle = VEHICLE_BATTERY_DATABASE.find(
    v => v.brandId === brandId && v.modelId === modelId
  );
  
  if (!vehicle) return [];
  
  return vehicle.batteries.map(item => ({
    startYear: item.startYear,
    endYear: item.endYear,
    battery: item.battery,
    specs: item.specs,
    trims: item.trims
  }));
};

// 특정 모델의 사용 가능한 연식 조회 (ReservationScreen용)
export const getAvailableYearsForModel = (brandId: string, modelId: string): string[] => {
  const batteryHistory = getVehicleBatteryHistory(brandId, modelId);
  
  if (batteryHistory.length === 0) return [];
  
  const years = batteryHistory.map(item => item.startYear.toString());
  return Array.from(new Set(years)).sort((a, b) => parseInt(b) - parseInt(a)); // 내림차순 정렬
};

// 모든 모델의 연식 정보를 통합해서 조회 (같은 모델명의 다른 트림들 포함)
export const getAvailableYearsForBaseName = (brandId: string, baseName: string): string[] => {
  const models = getAvailableModels(brandId);
  const allYears = new Set<string>();
  
  models.forEach(model => {
    // 기본 모델명 추출 (트림 정보 제거)
    let baseModelName = model.name
      .replace(/\s+(Standard|Long Range|N|AWD|2WD|RWD|FWD|Performance|Dual Motor|Tri Motor|Plaid|Cyberbeast|eDrive40|M50|xDrive40|xDrive50|M60|eDrive50|M70|iX1|iX2|iX3).*$/i, '')
      .replace(/\s+\d+kWh.*$/i, '')
      .trim();
    
    // 기본 모델명이 일치하면 해당 모델의 연식 추가
    if (baseModelName === baseName) {
      const modelYears = getAvailableYearsForModel(brandId, model.id);
      modelYears.forEach(year => allYears.add(year));
    }
  });
  
  return Array.from(allYears).sort((a, b) => parseInt(b) - parseInt(a));
};

// 특정 차량의 모든 트림 조회
export const getVehicleTrims = (
  brandId: string, 
  modelId: string
): string[] => {
  const vehicle = VEHICLE_BATTERY_DATABASE.find(
    v => v.brandId === brandId && v.modelId === modelId
  );
  
  if (!vehicle) return [];
  
  const trims = new Set<string>();
  vehicle.batteries.forEach(item => {
    if (item.battery.variant) {
      trims.add(item.battery.variant);
    }
  });
  
  return Array.from(trims);
};

// 가격대별 차량 검색 - 가격 정보 제거로 인해 비활성화됨
// export const getVehiclesByPrice = (maxPrice: number, minPrice: number = 0) => {
//   const results: Array<{
//     brandId: string;
//     modelId: string;
//     modelName?: string;
//     variant?: string;
//     specs?: VehicleSpecs;
//   }> = [];
//   
//   VEHICLE_BATTERY_DATABASE.forEach(vehicle => {
//     vehicle.batteries.forEach(item => {
//       if (item.specs?.priceKRW) {
//         const price = parseInt(item.specs.priceKRW);
//         if (price >= minPrice && price <= maxPrice) {
//           results.push({
//             brandId: vehicle.brandId,
//             modelId: vehicle.modelId,
//             modelName: vehicle.modelName,
//             variant: item.battery.variant,
//             specs: item.specs
//           });
//         }
//       }
//     });
//   });
//   
//   return results.sort((a, b) => parseInt(a.priceKRW) - parseInt(b.priceKRW));
// };

// 주행거리별 차량 검색
export const getVehiclesByRange = (minRange: number) => {
  const results: Array<{
    brandId: string;
    modelId: string;
    modelName?: string;
    variant?: string;
    range: string;
    specs?: VehicleSpecs;
  }> = [];
  
  VEHICLE_BATTERY_DATABASE.forEach(vehicle => {
    vehicle.batteries.forEach(item => {
      if (item.specs?.range && parseInt(item.specs.range) >= minRange) {
        results.push({
          brandId: vehicle.brandId,
          modelId: vehicle.modelId,
          modelName: vehicle.modelName,
          variant: item.battery.variant,
          range: item.specs.range,
          specs: item.specs
        });
      }
    });
  });
  
  return results.sort((a, b) => parseInt(b.range) - parseInt(a.range));
};

// 전비(효율)별 차량 검색
export const getVehiclesByEfficiency = (minEfficiency: number) => {
  const results: Array<{
    brandId: string;
    modelId: string;
    modelName?: string;
    variant?: string;
    efficiency: string;
    specs?: VehicleSpecs;
  }> = [];
  
  VEHICLE_BATTERY_DATABASE.forEach(vehicle => {
    vehicle.batteries.forEach(item => {
      if (item.specs?.efficiency) {
        const effValue = parseFloat(item.specs.efficiency);
        if (effValue >= minEfficiency) {
          results.push({
            brandId: vehicle.brandId,
            modelId: vehicle.modelId,
            modelName: vehicle.modelName,
            variant: item.battery.variant,
            efficiency: item.specs.efficiency,
            specs: item.specs
          });
        }
      }
    });
  });
  
  return results.sort((a, b) => parseFloat(b.efficiency) - parseFloat(a.efficiency));
};

// 배터리 제조사별 차량 검색
export const getVehiclesByBatteryManufacturer = (manufacturerName: string) => {
  const results: Array<{
    brandId: string;
    modelId: string;
    modelName?: string;
    variant?: string;
    battery: BatteryInfo;
    specs?: VehicleSpecs;
  }> = [];
  
  VEHICLE_BATTERY_DATABASE.forEach(vehicle => {
    vehicle.batteries.forEach(item => {
      if (item.battery.manufacturers.some(m => m.includes(manufacturerName))) {
        results.push({
          brandId: vehicle.brandId,
          modelId: vehicle.modelId,
          modelName: vehicle.modelName,
          variant: item.battery.variant,
          battery: item.battery,
          specs: item.specs
        });
      }
    });
  });
  
  return results;
};

// 성능별 차량 검색 (0-100km/h 가속)
export const getVehiclesByAcceleration = (maxSeconds: number) => {
  const results: Array<{
    brandId: string;
    modelId: string;
    modelName?: string;
    variant?: string;
    acceleration: string;
    specs?: VehicleSpecs;
  }> = [];
  
  VEHICLE_BATTERY_DATABASE.forEach(vehicle => {
    vehicle.batteries.forEach(item => {
      if (item.specs?.acceleration) {
        const accelValue = parseFloat(item.specs.acceleration);
        if (accelValue <= maxSeconds) {
          results.push({
            brandId: vehicle.brandId,
            modelId: vehicle.modelId,
            modelName: vehicle.modelName,
            variant: item.battery.variant,
            acceleration: item.specs.acceleration,
            specs: item.specs
          });
        }
      }
    });
  });
  
  return results.sort((a, b) => parseFloat(a.acceleration) - parseFloat(b.acceleration));
};

// 서비스 타입 정의
export interface ReservationType {
  id: 'standard' | 'premium';
  name: string;
  price: number;
  description: string;
  features: string[];
}

export const RESERVATION_TYPES: ReservationType[] = [
  {
    id: 'standard',
    name: '스탠다드',
    price: 1000, // 개발용 (운영: 100000)
    description: '여러 차량 비교가 필요할 때 경제적인 선택',
    features: [
      'OBD2 단자를 통한 진단',
      '공식 서비스 센터 측정 방식',
      'BMS 정보 기반 배터리 상태 분석',
      '자체 배터리 리포트 제공',
      '1의 자리 단위 SOH 제공(예, 93%)',
      '배터리 외 기본 항목 진단 제공'
    ]
  },
  {
    id: 'premium',
    name: '프리미엄',
    price: 2000, // 개발용 (운영: 200000)
    description: '정확한 배터리 성능 분석이 필요할 때',
    features: [
      'OBD2 단자를 통한 진단',
      '독립 실제 측정을 통한 진단',
      'TUV 독일 인증 받은 장비 및 기술',
      '소수점 첫째 자리 SOH 제공(예, 93.7%)',
      '성능 보증 배터리 리포트 제공',
      '배터리 센서, BMS 점검 포함',
      '배터리 외 기본 항목 진단 제공'
    ]
  }
];

// 예약 인터페이스 정의
export interface ReservationFormData {
  // 차량 정보
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  
  // 서비스 정보
  serviceType: string;
  servicePrice: number;
  
  // 위치 정보
  address: string;
  detailAddress?: string;
  latitude: number;
  longitude: number;
  
  // 예약 정보
  requestedDate: Date;
  
  // 연락처 정보
  userName: string;
  userPhone: string;
  notes?: string;
}