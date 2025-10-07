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