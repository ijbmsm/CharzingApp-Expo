// 전기차 브랜드 및 모델 데이터
export interface VehicleBrand {
  id: string;
  name: string;
  logo?: string;
}

export interface VehicleModel {
  id: string;
  name: string;
  years: string[];
}

export interface VehicleData {
  [brandId: string]: VehicleModel[];
}

// 브랜드 목록
export const VEHICLE_BRANDS: VehicleBrand[] = [
  { id: 'hyundai', name: '현대자동차' },
  { id: 'kia', name: '기아자동차' },
  { id: 'genesis', name: '제네시스' },
  { id: 'tesla', name: '테슬라' },
  { id: 'bmw', name: 'BMW' },
  { id: 'mercedes', name: '메르세데스-벤츠' },
  { id: 'audi', name: '아우디' },
  { id: 'porsche', name: '포르쉐' },
  { id: 'volkswagen', name: '폭스바겐' },
  { id: 'peugeot', name: '푸조' },
  { id: 'volvo', name: '볼보' },
  { id: 'polestar', name: '폴스타' },
  { id: 'chevrolet', name: '쉐보레' },
  { id: 'nissan', name: '닛산' },
  { id: 'lexus', name: '렉서스' },
  { id: 'jaguar', name: '재규어' },
  { id: 'byd', name: 'BYD' },
];

// 브랜드별 차종 및 연식
export const VEHICLE_MODELS: VehicleData = {
  hyundai: [
    {
      id: 'ioniq-electric',
      name: '아이오닉 일렉트릭',
      years: ['2016', '2017', '2018', '2019', '2020']
    },
    {
      id: 'kona-electric',
      name: '코나 일렉트릭',
      years: ['2018', '2019', '2020', '2021', '2023', '2024', '2025']
    },
    {
      id: 'ioniq-5',
      name: '아이오닉 5',
      years: ['2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'ioniq-6',
      name: '아이오닉 6',
      years: ['2022', '2023', '2024', '2025']
    },
    {
      id: 'ioniq-9',
      name: '아이오닉 9',
      years: ['2024', '2025']
    },
    {
      id: 'porter-electric',
      name: '포터 일렉트릭',
      years: ['2019', '2020', '2021', '2022', '2023', '2024', '2025']
    }
  ],
  
  kia: [
    {
      id: 'ray-ev',
      name: '레이 EV',
      years: ['2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2023', '2024', '2025']
    },
    {
      id: 'soul-ev',
      name: '쏘울 EV',
      years: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']
    },
    {
      id: 'niro-ev',
      name: '니로 EV',
      years: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'ev6',
      name: 'EV6',
      years: ['2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'ev9',
      name: 'EV9',
      years: ['2023', '2024', '2025']
    },
    {
      id: 'ev3',
      name: 'EV3',
      years: ['2024', '2025']
    }
  ],
  
  genesis: [
    {
      id: 'g80-electrified',
      name: 'G80 Electrified',
      years: ['2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'gv60',
      name: 'GV60',
      years: ['2022', '2023', '2024', '2025']
    },
    {
      id: 'gv70-electrified',
      name: 'GV70 Electrified',
      years: ['2022', '2023', '2024', '2025']
    }
  ],
  
  tesla: [
    {
      id: 'model-s',
      name: 'Model S',
      years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'model-x',
      name: 'Model X',
      years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'model-3',
      name: 'Model 3',
      years: ['2019', '2020', '2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'model-y',
      name: 'Model Y',
      years: ['2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'cybertruck',
      name: 'Cybertruck',
      years: ['2025']
    }
  ],
  
  bmw: [
    {
      id: 'i3',
      name: 'i3',
      years: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022']
    },
    {
      id: 'ix3',
      name: 'iX3',
      years: ['2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'ix',
      name: 'iX',
      years: ['2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'i4',
      name: 'i4',
      years: ['2022', '2023', '2024', '2025']
    },
    {
      id: 'i7',
      name: 'i7',
      years: ['2022', '2023', '2024', '2025']
    },
    {
      id: 'ix1',
      name: 'iX1',
      years: ['2023', '2024', '2025']
    },
    {
      id: 'i5',
      name: 'i5',
      years: ['2023', '2024', '2025']
    },
    {
      id: 'ix2',
      name: 'iX2',
      years: ['2024', '2025']
    }
  ],
  
  mercedes: [
    {
      id: 'eqc',
      name: 'EQC',
      years: ['2019', '2020', '2021', '2022', '2023']
    },
    {
      id: 'eqa',
      name: 'EQA',
      years: ['2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'eqs',
      name: 'EQS',
      years: ['2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'eqb',
      name: 'EQB',
      years: ['2022', '2023', '2024', '2025']
    },
    {
      id: 'eqe',
      name: 'EQE',
      years: ['2022', '2023', '2024', '2025']
    },
    {
      id: 'eqe-suv',
      name: 'EQE SUV',
      years: ['2023', '2024', '2025']
    },
    {
      id: 'eqs-suv',
      name: 'EQS SUV',
      years: ['2023', '2024', '2025']
    }
  ],
  
  audi: [
    {
      id: 'e-tron',
      name: 'e-tron',
      years: ['2019', '2020', '2021', '2022', '2023', '2024']
    },
    {
      id: 'e-tron-gt',
      name: 'e-tron GT',
      years: ['2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'q4-e-tron',
      name: 'Q4 e-tron',
      years: ['2022', '2023', '2024', '2025']
    },
    {
      id: 'q8-e-tron',
      name: 'Q8 e-tron',
      years: ['2024', '2025']
    },
    {
      id: 'q6-e-tron',
      name: 'Q6 e-tron',
      years: ['2025']
    }
  ],
  
  porsche: [
    {
      id: 'taycan',
      name: 'Taycan',
      years: ['2020', '2021', '2022', '2023', '2024', '2025']
    }
  ],
  
  volkswagen: [
    {
      id: 'id4',
      name: 'ID.4',
      years: ['2022', '2023', '2024', '2025']
    }
  ],
  
  peugeot: [
    {
      id: 'e-208',
      name: 'e-208',
      years: ['2020', '2021', '2022', '2023', '2024', '2025']
    },
    {
      id: 'e-2008',
      name: 'e-2008',
      years: ['2020', '2021', '2022', '2023', '2024', '2025']
    }
  ],
  
  volvo: [
    {
      id: 'xc40-recharge',
      name: 'XC40 Recharge/EX40',
      years: ['2022', '2023', '2024', '2025']
    },
    {
      id: 'c40-recharge',
      name: 'C40 Recharge/EC40',
      years: ['2022', '2023', '2024', '2025']
    },
    {
      id: 'ex30',
      name: 'EX30',
      years: ['2025']
    }
  ],
  
  polestar: [
    {
      id: 'polestar-2',
      name: 'Polestar 2',
      years: ['2022', '2023', '2024', '2025']
    },
    {
      id: 'polestar-3',
      name: 'Polestar 3',
      years: ['2023', '2024', '2025']
    },
    {
      id: 'polestar-4',
      name: 'Polestar 4',
      years: ['2024', '2025']
    }
  ],
  
  chevrolet: [
    {
      id: 'spark-ev',
      name: '스파크 EV',
      years: ['2013', '2014', '2015', '2016', '2017']
    },
    {
      id: 'bolt-ev',
      name: '볼트 EV',
      years: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']
    },
    {
      id: 'bolt-euv',
      name: '볼트 EUV',
      years: ['2022', '2023', '2024']
    }
  ],
  
  nissan: [
    {
      id: 'leaf',
      name: '리프',
      years: ['2014', '2015', '2016', '2017', '2018', '2019', '2020']
    }
  ],
  
  lexus: [
    {
      id: 'ux-300e',
      name: 'UX 300e',
      years: ['2022', '2023']
    }
  ],
  
  jaguar: [
    {
      id: 'i-pace',
      name: 'I-PACE',
      years: ['2018', '2019', '2020']
    }
  ],
  
  byd: [
    {
      id: 'atto-3',
      name: '아토 3 (ATTO 3)',
      years: ['2025']
    },
    {
      id: 'seal',
      name: '씰 (SEAL)',
      years: ['2025']
    },
    {
      id: 'sealion-7',
      name: '씨라이언 7 (SEALION 7)',
      years: ['2025']
    },
    {
      id: 'dolphin',
      name: '돌핀 (DOLPHIN)',
      years: ['2025']
    }
  ]
};

// 차량 선택을 위한 유틸리티 함수들
export const getBrandById = (brandId: string): VehicleBrand | undefined => {
  return VEHICLE_BRANDS.find(brand => brand.id === brandId);
};

export const getModelsByBrand = (brandId: string): VehicleModel[] => {
  return VEHICLE_MODELS[brandId] || [];
};

export const getModelById = (brandId: string, modelId: string): VehicleModel | undefined => {
  const models = getModelsByBrand(brandId);
  return models.find(model => model.id === modelId);
};

// 서비스 타입 정의 (웹과 동일한 구조)
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
    price: 100000,
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
    price: 200000,
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

// 예약 인터페이스 정의 (웹과 동일한 구조)
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