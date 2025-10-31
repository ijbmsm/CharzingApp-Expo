// 원본 ev-battery-database에서 현대/기아 차량 데이터를 추출
// 새로운 차량 정보는 이 파일에 추가하고 `yarn upload:simple` 실행

/* 
================================================================================
                            🚗 현재 업로드된 차량 목록 (총 84개 모델)
================================================================================

  "현대": {
    "ioniq-5": {
      "standard": {
        "2wd": ["2021-2022", "2023", "2024", "2024-refresh"],
        "awd": ["2021-2022", "2023"]
      },
      "long-range": {
        "2wd": ["2021-2022", "2023", "2024", "2024-refresh"],
        "awd": ["2021", "2022", "2023", "2024-refresh"]
      },
      "n-performance": {
        "awd": ["2023", "2024"]
      }
    },
    "ioniq-6": {
      "standard": {
        "2wd": ["2022", "2023", "2024"]
      },
      "long-range": {
        "2wd": ["2022", "2023", "2024"],
        "awd": ["2022", "2023", "2024"]
      },
      "n-performance": {
        "awd": ["2024"]
      }
    },
    "kona-electric": {
      "standard": {
        "2wd": ["2018", "2020", "2023"]
      },
      "long-range": {
        "2wd": ["2018", "2020", "2021", "2022", "2023"]
      }
    },
    "ioniq-9": {
      "항속형": {
        "2wd": ["2025"],
        "awd": ["2025"]
      },
      "성능형": {
        "awd": ["2025"]
      }
    },
    "casper-electric": {
      "premium": {
        "2wd": ["2024", "2025"]
      },
      "inspiration": {
        "2wd": ["2024", "2025"]
      },
      "cross": {
        "2wd": ["2025"]
      }
    },
    "nexo": {
      "hydrogen": {
        "2wd": ["2018", "2023", "2024-2nd-gen"]
      }
    }
  },
  "기아": {
    "ev6": {
      "standard": {
        "2wd": ["2021-2022", "2023", "2024"],
        "awd": ["2021-2022", "2023", "2024"]
      },
      "long-range": {
        "2wd": ["2021-2022", "2023", "2024"],
        "awd": ["2021-2022", "2023", "2024"]
      },
      "gt": {
        "awd": ["2022", "2023", "2024", "2023-gt", "2024-gt"]
      }
    },
    "ev9": {
      "standard": {
        "2wd": ["2023", "2024"]
      },
      "long-range": {
        "2wd": ["2023", "2024"],
        "awd": ["2023", "2024"]
      },
      "gt-line": {
        "awd": ["2024"]
      }
    },
    "ev3": {
      "standard": {
        "2wd": ["2024"]
      },
      "long-range": {
        "2wd": ["2024"]
      }
    },
    "ray-ev": {
      "standard": {
        "2wd": ["2011-2018", "2024"]
      }
    },
    "ev4": {
      "standard": {
        "2wd": ["2024"]
      },
      "long-range": {
        "2wd": ["2024"]
      }
    },
    "niro-ev": {
      "standard": {
        "2wd": ["2018-2021", "2022", "2023", "2024"]
      }
    }
  },
  "테슬라": {
    "model-s": {
      "90d": {
        "awd": ["2017"]
      },
      "100d": {
        "awd": ["2018"]
      },
      "p100d": {
        "awd": ["2018"]
      },
      "long-range": {
        "awd": ["2019-2020", "2021-2022", "2023-2024", "2025"]
      },
      "performance": {
        "awd": ["2019-2020"]
      },
      "plaid": {
        "awd": ["2021-2022", "2023-2024", "2025"]
      }
    },
    "model-3": {
      "standard-range-plus": {
        "rwd": ["2019"]
      },
      "rwd": {
        "rwd": ["2021-2023", "2024-highland"]
      },
      "long-range": {
        "awd": ["2019", "2021-2023", "2024-highland"]
      },
      "performance": {
        "awd": ["2019", "2021-2023", "2024-highland"]
      }
    },
    "model-x": {
      "75d": {
        "awd": ["2018"]
      },
      "100d": {
        "awd": ["2018"]
      },
      "long-range": {
        "awd": ["2019-2020", "2021-2023", "2024"]
      },
      "performance": {
        "awd": ["2019-2020"]
      },
      "plaid": {
        "awd": ["2021-2023", "2024"]
      }
    },
    "model-y": {
      "standard": {
        "rwd": ["2021-2022", "2023", "2024", "2025-juniper"]
      },
      "long-range": {
        "awd": ["2021-2022", "2023", "2024", "2025-juniper"]
      },
      "performance": {
        "awd": ["2021-2022", "2023", "2024"]
      }
    },
    "cybertruck": {
      "all-wheel-drive": {
        "awd": ["2025"]
      },
      "cyberbeast": {
        "awd": ["2025"]
      }
    }
  },
  "메르세데스-벤츠": {
    "eqc": {
      "400": {
        "4matic": ["2019-2023"]
      }
    },
    "eqa": {
      "250": {
        "fwd": ["2021-2022", "2021-2022-amg패키지", "2021-2022-amg패키지플러스", "2023-프로그레시브", "2023-amg라인", "2024-일렉트릭아트", "2024-amg라인"]
      }
    },
    "eqb": {
      "300": {
        "4matic": ["2022-2023-프로그레시브", "2022-2023-amg라인", "2024-일렉트릭아트", "2024-amg라인"]
      }
    },
    "eqe": {
      "350": {
        "rwd": ["2022"],
        "plus": ["2022-2023", "2024-2025"],
        "4matic": ["2024-2025"]
      },
      "amg-53": {
        "4matic": ["2022-2023", "2024-2025"]
      }
    },
    "eqe-suv": {
      "350": {
        "4matic": ["2023", "2024", "2025"]
      },
      "500": {
        "4matic": ["2023", "2024-2025"]
      },
      "amg-53": {
        "4matic": ["2024-2025"]
      }
    },
    "eqs": {
      "350": {
        "rwd": ["2022", "2025"]
      },
      "450": {
        "plus": ["2022-2023"],
        "4matic": ["2023", "2025"]
      },
      "580": {
        "4matic": ["2025"]
      },
      "amg-53": {
        "4matic": ["2022-2023", "2025"]
      }
    },
    "eqs-suv": {
      "450": {
        "4matic": ["2023-2025"]
      },
      "580": {
        "4matic": ["2023-2025"]
      }
    },
    "g-class-electric": {
      "g-580-eq-technology": {
        "awd": ["2025"]
      }
    }
  },
  "메르세데스-마이바흐": {
    "eqs-suv": {
      "680": {
        "4matic": ["2024-2025"]
      }
    }
  },
  "BMW": {
    "ix": {
      "xdrive40": {
        "awd": ["2022-2024"]
      },
      "xdrive45": {
        "awd": ["2025"]
      },
      "xdrive50": {
        "awd": ["2022-2024", "2026"]
      },
      "xdrive60": {
        "awd": ["2025", "2026"]
      },
      "m70": {
        "xdrive": ["2025", "2026"]
      }
    },
    "ix3": {
      "m-sport": {
        "rwd": ["2021-2025"]
      },
      "50": {
        "xdrive": ["2026"]
      }
    },
    "ix1": {
      "edrive20": {
        "rwd": ["2025-m-sport"]
      },
      "xdrive30": {
        "awd": ["2023-2024-xline", "2023-2024-m-sport", "2025-xline", "2025-m-sport"]
      },
      "m35i": {
        "xdrive": ["2024-2025"]
      }
    },
    "ix2": {
      "edrive20": {
        "rwd": ["2025-m-sport"]
      }
    },
    "i4": {
      "edrive40": {
        "rwd": ["2022-2024-m-sport", "2025-m-sport-lci"]
      },
      "m50": {
        "xdrive": ["2022-2024", "2025-lci"]
      }
    },
    "i5": {
      "edrive40": {
        "rwd": ["2024", "2025"]
      },
      "xdrive40": {
        "awd": ["2025"]
      },
      "m60": {
        "xdrive": ["2024", "2025"]
      }
    },
    "i7": {
      "edrive50": {
        "rwd": ["2024"]
      },
      "xdrive60": {
        "awd": ["2023", "2023-m-sport", "2024"]
      },
      "m70": {
        "xdrive": ["2024"]
      }
    }
  },
  "아우디": {
    "e-tron": {
      "50": {
        "quattro": ["2020-2023"]
      },
      "55": {
        "quattro": ["2020-2023"]
      }
    },
    "e-tron-sportback": {
      "50": {
        "quattro": ["2020-2023"]
      },
      "55": {
        "quattro": ["2020-2023"]
      }
    },
    "q8-e-tron": {
      "50": {
        "quattro": ["2024-2025"]
      },
      "55": {
        "quattro": ["2024-2025", "2024-2025-프리미엄"]
      },
      "sq8": {
        "quattro": ["2024"]
      }
    },
    "q8-sportback-e-tron": {
      "50": {
        "quattro": ["2024-2025"]
      },
      "55": {
        "quattro": ["2024-2025", "2024-2025-프리미엄"]
      },
      "sq8": {
        "quattro": ["2024"]
      }
    },
    "q4-e-tron": {
      "40": {
        "rwd": ["2022-2024"]
      },
      "45": {
        "rwd": ["2025"]
      }
    },
    "q4-sportback-e-tron": {
      "40": {
        "rwd": ["2022-2024"]
      },
      "45": {
        "rwd": ["2025"]
      }
    },
    "q6-e-tron": {
      "기본": {
        "quattro": ["2025-프리미엄"]
      },
      "퍼포먼스": {
        "quattro": ["2025", "2025-프리미엄"]
      },
      "sq6": {
        "quattro": ["2025"]
      }
    },
    "e-tron-gt": {
      "e-tron-gt": {
        "quattro": ["2021-2023"]
      },
      "s": {
        "quattro": ["2025"]
      },
      "rs": {
        "quattro": ["2021-2023", "2025", "2025-퍼포먼스"]
      }
    },
    "a6-e-tron": {
      "퍼포먼스": {
        "quattro": ["2025-어드밴스드", "2025-s라인", "2025-s라인-블랙에디션"]
      },
      "s6": {
        "quattro": ["2025"]
      }
    }
  },
  "포르쉐": {
    "taycan": {
      "base": {
        "rwd": ["2024", "2025"]
      },
      "4": {
        "awd": ["2025"]
      },
      "4s": {
        "awd": ["2021", "2024", "2025"]
      },
      "gts": {
        "awd": ["2022-2023", "2025"]
      },
      "turbo": {
        "awd": ["2021", "2024", "2025"]
      },
      "turbo-s": {
        "awd": ["2021", "2024", "2025"]
      },
      "turbo-gt": {
        "awd": ["2025", "2025-weissach-package"]
      }
    },
    "taycan-cross-turismo": {
      "4": {
        "awd": ["2021-2024", "2025"]
      },
      "4s": {
        "awd": ["2021-2024", "2025"]
      },
      "turbo": {
        "awd": ["2021-2024", "2025"]
      }
    }
  },
  "미니": {
    "cooper": {
      "e": {
        "fwd": ["2025"]
      },
      "se": {
        "fwd": ["2025"]
      },
      "jcw": {
        "fwd": ["2025"]
      }
    },
    "aceman": {
      "e": {
        "fwd": ["2025"]
      },
      "se": {
        "fwd": ["2025"]
      },
      "jcw": {
        "fwd": ["2025"]
      }
    },
    "countryman": {
      "e": {
        "fwd": ["2025"]
      },
      "se-all4": {
        "awd": ["2025"]
      }
    }
  }

📋 누락된 모델 요약:
✅ e-트론 GT 콰트로 (2021-2023) - 초기 기본 트림
✅ RS e-트론 GT (2021-2023) - 초기 고성능 트림  
✅ RS e-트론 GT 퍼포먼스 (2025) - 최고성능 버전
✅ A6 e-트론 (2025) - 3개 트림 전체

================================================================================
💡 새 차량 추가 시 주의사항:
- N 모델은 별도 모델 (예: ioniq-5-n)
- N-line은 기본 모델의 트림 (예: ev3 하위의 n-line 트림)
- GT 모델은 별도 모델 (예: ev6-gt)  
- GT-line은 기본 모델의 트림 (예: ev9 하위의 gt-line 트림)
- 새 차량은 아래 VEHICLE_BATTERY_DATABASE 배열에 추가
- 업로드: yarn upload:simple
================================================================================
*/

const VEHICLE_BATTERY_DATABASE = [
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
          cellType: 'NCM',
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
          cellType: 'NCM',
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
          cellType: 'NCM',
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
          cellType: 'NCM',
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
          cellType: 'NCM',
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
          cellType: 'NCM',
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
        startYear: 2025,
        battery: {
          manufacturers: ['SK온'],
          capacity: '63kWh',
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
          efficiency: '5.2',
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
        startYear: 2025,
        battery: {
          manufacturers: ['SK온'],
          capacity: '84kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '494',
          powerMax: '168kW',
          torqueMax: '350Nm',
          acceleration: '7.3',
          topSpeed: '185',
          driveType: 'RWD',
          efficiency: '5.9',
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
        startYear: 2025,
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
          efficiency: '5.5',
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
        startYear: 2025,
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
          efficiency: '5.9',
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
        startYear: 2025,
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
          efficiency: '5.5',
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
          warranty: '10년/20만km',
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
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Standard',
          chargingConnector:'DC콤보 7핀(급속)',
        },
        specs: {
          range: '401',
          powerMax: '150kW',
          torqueMax: '255Nm',
          acceleration: '7.8',
          topSpeed: '167',
          driveType: 'FWD',
          efficiency: '5.3',
          chargingDC: '77',
          seats: 5,
        }
      }
    ]
  },
  // 2023 코나 일렉트릭 (신형)
  {
    brandId: 'hyundai',
    modelId: 'kona-electric',
    modelName: '코나 일렉트릭 2023',
    batteries: [
      {
        startYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '48.6kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '311',
          powerMax: '99kW',
          torqueMax: '255Nm',
          acceleration: '9.3',
          topSpeed: '178',
          driveType: 'FWD',
          efficiency: '5.5',
          seats: 5,
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.8kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Long Range'
        },
        specs: {
          range: '417',
          powerMax: '150kW',
          torqueMax: '255Nm',
          acceleration: '8.1',
          topSpeed: '178',
          driveType: 'FWD',
          efficiency: '5.5',
          seats: 5,
        }
      }
    ]
  },
  // 2018 코나 일렉트릭 (초기 모델)
  {
    brandId: 'hyundai',
    modelId: 'kona-electric',
    modelName: '코나 일렉트릭 2018',
    batteries: [
      {
        startYear: 2018,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '39.2kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '254',
          powerMax: '100kW',
          torqueMax: '395Nm',
          acceleration: '9.3',
          topSpeed: '155',
          driveType: 'FWD',
          efficiency: '5.8',
          seats: 5,
        }
      },
      {
        startYear: 2018,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '64kWh',
          warranty: '10년/20만km',
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
          efficiency: '5.4',
          seats: 5,
        }
      }
    ]
  },
  // 2020 코나 일렉트릭
  {
    brandId: 'hyundai',
    modelId: 'kona-electric',
    modelName: '코나 일렉트릭 2020',
    batteries: [
      {
        startYear: 2020,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '39.2kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: 'Standard'
        },
        specs: {
          range: '254',
          powerMax: '100kW',
          torqueMax: '395Nm',
          acceleration: '9.3',
          topSpeed: '155',
          driveType: 'FWD',
          efficiency: '5.8',
          seats: 5,
        }
      },
      {
        startYear: 2020,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '64kWh',
          warranty: '10년/20만km',
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
          efficiency: '5.4',
          seats: 5,
        }
      }
    ]
  },
  // 2021 코나 일렉트릭 (페이스리프트, Standard 단종)
  {
    brandId: 'hyundai',
    modelId: 'kona-electric',
    modelName: '코나 일렉트릭 2021',
    batteries: [
      {
        startYear: 2021,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '64kWh',
          warranty: '10년/20만km',
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
          efficiency: '5.4',
          seats: 5,
        }
      }
    ]
  },
  // 2022 코나 일렉트릭
  {
    brandId: 'hyundai',
    modelId: 'kona-electric',
    modelName: '코나 일렉트릭 2022',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '64kWh',
          warranty: '10년/20만km',
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
          efficiency: '5.4',
          seats: 5,
        }
      }
    ]
  },
  // 2025 아이오닉 9 (대형 SUV)
  {
    brandId: 'hyundai',
    modelId: 'ioniq-9-2025',
    modelName: '아이오닉 9 2025',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['SK온'],
          capacity: '110.3kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: '항속형 2WD'
        },
        specs: {
          range: '532',
          powerMax: '160kW',
          torqueMax: '350Nm',
          acceleration: '9.4',
          topSpeed: '190',
          driveType: 'RWD',
          efficiency: '4.3',
          seats: 7,
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['SK온'],
          capacity: '110.3kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: '항속형 AWD'
        },
        specs: {
          range: '501',
          powerMax: '226kW',
          torqueMax: '605Nm',
          acceleration: '6.7',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 7,
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['SK온'],
          capacity: '110.3kWh',
          warranty: '10년/20만km',
          cellType: 'NCM',
          variant: '성능형 AWD'
        },
        specs: {
          range: '501',
          powerMax: '314kW',
          torqueMax: '700Nm',
          acceleration: '5.2',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 7,
        }
      }
    ]
  },
  
  // 캐스퍼 일렉트릭 2024년식
  {
    brandId: 'hyundai',
    modelId: 'casper-electric',
    modelName: '캐스퍼 일렉트릭 2024',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['HLIGP (LG에너지솔루션-현대차 합작)'],
          capacity: '42kWh',
          warranty: '10년/16만km',
          cellType: 'NCM',
          variant: 'Premium'
        },
        specs: {
          range: '278',
          powerMax: '71.1kW',
          torqueMax: '147Nm',
          acceleration: '11.7',
          topSpeed: '-',
          driveType: 'FWD',
          efficiency: '5.8',
          seats: 4
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['HLIGP (LG에너지솔루션-현대차 합작)'],
          capacity: '49kWh',
          warranty: '10년/16만km',
          cellType: 'NCM',
          variant: 'Inspiration'
        },
        specs: {
          range: '315',
          powerMax: '84.5kW',
          torqueMax: '147Nm',
          acceleration: '10.6',
          topSpeed: '-',
          driveType: 'FWD',
          efficiency: '5.8',
          seats: 4
        }
      }
    ]
  },
  
  // 캐스퍼 일렉트릭 2025년식 (연식 변경)
  {
    brandId: 'hyundai',
    modelId: 'casper-electric',
    modelName: '캐스퍼 일렉트릭 2025',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['HLIGP (LG에너지솔루션-현대차 합작)'],
          capacity: '42kWh',
          warranty: '10년/16만km',
          cellType: 'NCM',
          variant: 'Premium'
        },
        specs: {
          range: '278',
          powerMax: '71.1kW',
          torqueMax: '147Nm',
          acceleration: '-',
          topSpeed: '-',
          driveType: 'FWD',
          efficiency: '5.8',
          seats: 4
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['HLIGP (LG에너지솔루션-현대차 합작)'],
          capacity: '49kWh',
          warranty: '10년/16만km',
          cellType: 'NCM',
          variant: 'Inspiration'
        },
        specs: {
          range: '315',
          powerMax: '84.5kW',
          torqueMax: '147Nm',
          acceleration: '-',
          topSpeed: '-',
          driveType: 'FWD',
          efficiency: '5.8',
          seats: 4
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['HLIGP (LG에너지솔루션-현대차 합작)'],
          capacity: '49kWh',
          warranty: '10년/16만km',
          cellType: 'NCM',
          variant: 'Cross'
        },
        specs: {
          range: '285',
          powerMax: '84.5kW',
          torqueMax: '147Nm',
          acceleration: '-',
          topSpeed: '-',
          driveType: 'FWD',
          efficiency: '5.1',
          seats: 4
        }
      }
    ]
  },

  // ===== 테슬라 =====
  // 테슬라 모델 S (2017-2020)
  {
    brandId: 'tesla',
    modelId: 'model-s',
    modelName: '테슬라 모델 S',
    batteries: [
      {
        startYear: 2017,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '90kWh',
          warranty: '8년/무제한 주행거리',
          cellType: 'NCA',
          variant: '90D'
        },
        specs: {
          range: '378',
          powerMax: '307kW',
          torqueMax: '660Nm',
          acceleration: '4.4',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '4.3',
          seats: 5
        }
      },
      {
        startYear: 2018,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: '100D'
        },
        specs: {
          range: '451',
          powerMax: '518HP',
          torqueMax: '98.4kg.m',
          acceleration: '4.3',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '4.3',
          seats: 5
        }
      },
      {
        startYear: 2018,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'P100D'
        },
        specs: {
          range: '424',
          powerMax: '778HP',
          torqueMax: '98.4kg.m',
          acceleration: '2.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '4.2',
          seats: 5
        }
      },
      {
        startYear: 2019,
        endYear: 2020,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Long Range'
        },
        specs: {
          range: '483',
          powerMax: '518HP',
          torqueMax: '66.0kg.m',
          acceleration: '3.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '4.3',
          seats: 5
        }
      },
      {
        startYear: 2019,
        endYear: 2020,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Performance'
        },
        specs: {
          range: '450',
          powerMax: '778HP',
          torqueMax: '98.4kg.m',
          acceleration: '2.6',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '4.0',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Long Range'
        },
        specs: {
          range: '555',
          powerMax: '670HP',
          torqueMax: '-',
          acceleration: '3.2',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '4.8',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Plaid'
        },
        specs: {
          range: '474',
          powerMax: '1020HP',
          torqueMax: '1300Nm',
          acceleration: '2.1',
          topSpeed: '322',
          driveType: 'AWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2023,
        endYear: 2024,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Long Range'
        },
        specs: {
          range: '555',
          powerMax: '670HP',
          torqueMax: '-',
          acceleration: '3.2',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '4.8',
          seats: 5
        }
      },
      {
        startYear: 2023,
        endYear: 2024,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Plaid'
        },
        specs: {
          range: '474',
          powerMax: '1020HP',
          torqueMax: '1300Nm',
          acceleration: '2.1',
          topSpeed: '322',
          driveType: 'AWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: '4680',
          variant: 'Long Range'
        },
        specs: {
          range: '555',
          powerMax: '670HP',
          torqueMax: '66kg.m',
          acceleration: '3.2',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '4.8',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: '4680',
          variant: 'Plaid'
        },
        specs: {
          range: '474',
          powerMax: '1020HP',
          torqueMax: '1300Nm',
          acceleration: '2.1',
          topSpeed: '322',
          driveType: 'AWD',
          efficiency: '4.6',
          seats: 5
        }
      }
    ]
  },

  // 테슬라 모델 3 (2019년~)
  {
    brandId: 'tesla',
    modelId: 'model-3',
    modelName: '테슬라 모델 3',
    batteries: [
      {
        startYear: 2019,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '50kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'Standard Range Plus'
        },
        specs: {
          range: '352',
          powerMax: '241HP',
          torqueMax: '375Nm',
          acceleration: '5.6',
          topSpeed: '225',
          driveType: 'RWD',
          efficiency: '5.8',
          seats: 5
        }
      },
      {
        startYear: 2019,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCA',
          variant: 'Long Range'
        },
        specs: {
          range: '446',
          powerMax: '346HP',
          torqueMax: '53.0kg.m',
          acceleration: '4.6',
          topSpeed: '233',
          driveType: 'AWD',
          efficiency: '4.7',
          seats: 5
        }
      },
      {
        startYear: 2019,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCA',
          variant: 'Performance'
        },
        specs: {
          range: '415',
          powerMax: '450HP',
          torqueMax: '65.2kg.m',
          acceleration: '3.4',
          topSpeed: '261',
          driveType: 'AWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '60kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'RWD',
          supplierVariants: [
            {
              supplier: 'CATL',
              vinPrefix: '5YJ',
              region: '중국 생산',
              cellType: 'LFP'
            }
          ]
        },
        specs: {
          range: '383',
          powerMax: '283HP',
          torqueMax: '-',
          acceleration: '6.1',
          topSpeed: '225',
          driveType: 'RWD',
          efficiency: '5.8',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션', 'Panasonic'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM/NCA',
          variant: 'Long Range',
          supplierVariants: [
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRW',
              region: '한국/독일 생산',
              cellType: 'NCM'
            },
            {
              supplier: 'Panasonic',
              vinPrefix: '5YJ',
              region: '미국 생산',
              cellType: 'NCA'
            }
          ]
        },
        specs: {
          range: '488',
          powerMax: '365HP',
          torqueMax: '-',
          acceleration: '4.4',
          topSpeed: '233',
          driveType: 'AWD',
          efficiency: '5.1',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션', 'Panasonic'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM/NCA',
          variant: 'Performance',
          supplierVariants: [
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRW',
              region: '한국/독일 생산',
              cellType: 'NCM'
            },
            {
              supplier: 'Panasonic',
              vinPrefix: '5YJ',
              region: '미국 생산',
              cellType: 'NCA'
            }
          ]
        },
        specs: {
          range: '480',
          powerMax: '490HP',
          torqueMax: '-',
          acceleration: '3.3',
          topSpeed: '261',
          driveType: 'AWD',
          efficiency: '4.8',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '67.2kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'RWD (Highland)',
          supplierVariants: [
            {
              supplier: 'CATL',
              vinPrefix: '5YJ',
              region: '중국 생산',
              cellType: 'LFP'
            }
          ]
        },
        specs: {
          range: '382',
          powerMax: '283HP',
          torqueMax: '420Nm',
          acceleration: '6.1',
          topSpeed: '201',
          driveType: 'RWD',
          efficiency: '5.7',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션', 'Panasonic'],
          capacity: '89.5kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM/NCA',
          variant: 'Long Range (Highland)',
          supplierVariants: [
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRW',
              region: '한국/독일 생산',
              cellType: 'NCM'
            },
            {
              supplier: 'Panasonic',
              vinPrefix: '5YJ',
              region: '미국 생산',
              cellType: 'NCA'
            }
          ]
        },
        specs: {
          range: '488',
          powerMax: '412HP',
          torqueMax: '480Nm',
          acceleration: '4.4',
          topSpeed: '201',
          driveType: 'AWD',
          efficiency: '4.8',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션', 'Panasonic'],
          capacity: '89.5kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM/NCA',
          variant: 'Performance (Highland)',
          supplierVariants: [
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRW',
              region: '한국/독일 생산',
              cellType: 'NCM'
            },
            {
              supplier: 'Panasonic',
              vinPrefix: '5YJ',
              region: '미국 생산',
              cellType: 'NCA'
            }
          ]
        },
        specs: {
          range: '430',
          powerMax: '627HP',
          torqueMax: '741Nm',
          acceleration: '3.1',
          topSpeed: '261',
          driveType: 'AWD',
          efficiency: '4.8',
          seats: 5
        }
      }
    ]
  },

  // 테슬라 모델 X (2018년~)
  {
    brandId: 'tesla',
    modelId: 'model-x',
    modelName: '테슬라 모델 X',
    batteries: [
      {
        startYear: 2018,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '75kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: '75D'
        },
        specs: {
          range: '275',
          powerMax: '328HP',
          torqueMax: '53.7kg.m',
          acceleration: '5.2',
          topSpeed: '209',
          driveType: 'AWD',
          efficiency: '4.0',
          seats: 5
        }
      },
      {
        startYear: 2018,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: '100D'
        },
        specs: {
          range: '386',
          powerMax: '417HP',
          torqueMax: '67.1kg.m',
          acceleration: '4.9',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.9',
          seats: 5
        }
      },
      {
        startYear: 2019,
        endYear: 2020,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '95kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Long Range'
        },
        specs: {
          range: '460',
          powerMax: '525HP',
          torqueMax: '73.4kg.m',
          acceleration: '4.6',
          topSpeed: '249',
          driveType: 'AWD',
          efficiency: '3.9',
          seats: 5
        }
      },
      {
        startYear: 2019,
        endYear: 2020,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '95kWh',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Performance'
        },
        specs: {
          range: '430',
          powerMax: '772HP',
          torqueMax: '90.6kg.m',
          acceleration: '2.9',
          topSpeed: '262',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Long Range'
        },
        specs: {
          range: '439',
          powerMax: '670HP',
          torqueMax: '-',
          acceleration: '3.9',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: 'NCA',
          variant: 'Plaid'
        },
        specs: {
          range: '439',
          powerMax: '1020HP',
          torqueMax: '-',
          acceleration: '2.6',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: '4680',
          variant: 'Long Range'
        },
        specs: {
          range: '439',
          powerMax: '670HP',
          torqueMax: '-',
          acceleration: '3.9',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '4.2',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['Panasonic'],
          capacity: '100kWh+',
          warranty: '8년/24만km',
          cellType: '4680',
          variant: 'Plaid'
        },
        specs: {
          range: '439',
          powerMax: '1020HP',
          torqueMax: '-',
          acceleration: '2.6',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      }
    ]
  },

  // 테슬라 모델 Y (2021년~)
  {
    brandId: 'tesla',
    modelId: 'model-y',
    modelName: '테슬라 모델 Y',
    batteries: [
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['CATL'],
          capacity: '50kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'Standard',
          supplierVariants: [
            {
              supplier: 'CATL',
              vinPrefix: 'LRW',
              region: '상하이 기가팩토리',
              cellType: 'LFP'
            },
            {
              supplier: 'CATL',
              vinPrefix: 'LRF',
              region: '상하이 기가팩토리',
              cellType: 'LFP'
            }
          ]
        },
        specs: {
          range: '350',
          powerMax: '201HP',
          torqueMax: '-',
          acceleration: '6.1',
          topSpeed: '217',
          driveType: 'RWD',
          efficiency: '5.1',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['LG에너지솔루션', 'Panasonic'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCA',
          variant: 'Long Range',
          supplierVariants: [
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRW',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            },
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRF',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            },
            {
              supplier: 'Panasonic',
              vinPrefix: '5YJ',
              region: '미국 기가팩토리',
              cellType: 'NCA'
            },
            {
              supplier: 'Panasonic',
              vinPrefix: '7SA',
              region: '미국 기가팩토리',
              cellType: 'NCA'
            }
          ]
        },
        specs: {
          range: '511',
          powerMax: '346HP',
          torqueMax: '-',
          acceleration: '5.0',
          topSpeed: '217',
          driveType: 'AWD',
          efficiency: '5.4',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['LG에너지솔루션', 'Panasonic'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCA',
          variant: 'Performance',
          supplierVariants: [
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRW',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            },
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRF',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            },
            {
              supplier: 'Panasonic',
              vinPrefix: '5YJ',
              region: '미국 기가팩토리',
              cellType: 'NCA'
            },
            {
              supplier: 'Panasonic',
              vinPrefix: '7SA',
              region: '미국 기가팩토리',
              cellType: 'NCA'
            }
          ]
        },
        specs: {
          range: '480',
          powerMax: '456HP',
          torqueMax: '-',
          acceleration: '3.7',
          topSpeed: '241',
          driveType: 'AWD',
          efficiency: '5.2',
          seats: 5
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '57.5kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'Standard',
          supplierVariants: [
            {
              supplier: 'CATL',
              vinPrefix: 'LRW',
              region: '상하이 기가팩토리',
              cellType: 'LFP'
            },
            {
              supplier: 'CATL',
              vinPrefix: 'LRF',
              region: '상하이 기가팩토리',
              cellType: 'LFP'
            }
          ]
        },
        specs: {
          range: '350',
          powerMax: '295HP',
          torqueMax: '-',
          acceleration: '6.9',
          topSpeed: '217',
          driveType: 'RWD',
          efficiency: '5.1',
          seats: 5
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Long Range',
          supplierVariants: [
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRW',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            },
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRF',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            }
          ]
        },
        specs: {
          range: '511',
          powerMax: '346HP',
          torqueMax: '-',
          acceleration: '5.0',
          topSpeed: '217',
          driveType: 'AWD',
          efficiency: '5.4',
          seats: 5
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '75kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Performance',
          supplierVariants: [
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRW',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            },
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRF',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            }
          ]
        },
        specs: {
          range: '480',
          powerMax: '450HP',
          torqueMax: '-',
          acceleration: '3.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.2',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '57.5kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'Standard',
          supplierVariants: [
            {
              supplier: 'CATL',
              vinPrefix: 'LRW',
              region: '상하이 기가팩토리',
              cellType: 'LFP'
            },
            {
              supplier: 'CATL',
              vinPrefix: 'LRF',
              region: '상하이 기가팩토리',
              cellType: 'LFP'
            }
          ]
        },
        specs: {
          range: '350',
          powerMax: '295HP',
          torqueMax: '-',
          acceleration: '6.9',
          topSpeed: '217',
          driveType: 'RWD',
          efficiency: '5.1',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '79kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Long Range',
          supplierVariants: [
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRW',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            },
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRF',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            }
          ]
        },
        specs: {
          range: '432',
          powerMax: '346HP',
          torqueMax: '-',
          acceleration: '5.0',
          topSpeed: '217',
          driveType: 'AWD',
          efficiency: '4.9',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '79kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Performance',
          supplierVariants: [
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRW',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            },
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRF',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            }
          ]
        },
        specs: {
          range: '432',
          powerMax: '456HP',
          torqueMax: '-',
          acceleration: '3.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '4.9',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '62.5kWh',
          warranty: '8년/16만km',
          cellType: 'LFP',
          variant: 'Standard',
          supplierVariants: [
            {
              supplier: 'CATL',
              vinPrefix: 'LRW',
              region: '상하이 기가팩토리',
              cellType: 'LFP'
            },
            {
              supplier: 'CATL',
              vinPrefix: 'LRF',
              region: '상하이 기가팩토리',
              cellType: 'LFP'
            }
          ]
        },
        specs: {
          range: '350',
          powerMax: '347HP',
          torqueMax: '-',
          acceleration: '5.9',
          topSpeed: '217',
          driveType: 'RWD',
          efficiency: '5.7',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '78.4kWh',
          warranty: '8년/19.2만km',
          cellType: 'NCM',
          variant: 'Long Range',
          supplierVariants: [
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRW',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            },
            {
              supplier: 'LG에너지솔루션',
              vinPrefix: 'LRF',
              region: '상하이 기가팩토리',
              cellType: 'NCM'
            }
          ]
        },
        specs: {
          range: '476',
          powerMax: '299HP',
          torqueMax: '-',
          acceleration: '4.8',
          topSpeed: '201',
          driveType: 'AWD',
          efficiency: '5.0',
          seats: 5
        }
      }
    ]
  },

  // 테슬라 사이버트럭 (2025년~)
  {
    brandId: 'tesla',
    modelId: 'cybertruck',
    modelName: '테슬라 사이버트럭',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Tesla'],
          capacity: '123kWh',
          warranty: '8년/24만km',
          cellType: '4680',
          variant: 'All-Wheel Drive'
        },
        specs: {
          range: '547',
          powerMax: '600HP',
          torqueMax: '-',
          acceleration: '4.1',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '4.4',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Tesla'],
          capacity: '123kWh',
          warranty: '8년/24만km',
          cellType: '4680',
          variant: 'Cyberbeast'
        },
        specs: {
          range: '496',
          powerMax: '845HP',
          torqueMax: '-',
          acceleration: '2.7',
          topSpeed: '209',
          driveType: 'AWD',
          efficiency: '4.0',
          seats: 5
        }
      }
    ]
  },

  // ===== 메르세데스-벤츠 =====
  // 벤츠 EQC 400 4MATIC (2019년~2023년)
  {
    brandId: 'mercedes-benz',
    modelId: 'eqc-400-4matic',
    modelName: '메르세데스-벤츠 EQC 400 4MATIC',
    batteries: [
      {
        startYear: 2019,
        endYear: 2023,
        battery: {
          manufacturers: ['LG'],
          capacity: '80kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '400 4MATIC'
        },
        specs: {
          range: '309',
          powerMax: '408HP',
          torqueMax: '759Nm',
          acceleration: '5.1',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '3.1',
          seats: 5
        }
      }
    ]
  },

  // 벤츠 EQA 250 (2021년~)
  {
    brandId: 'mercedes-benz',
    modelId: 'eqa-250',
    modelName: '메르세데스-벤츠 EQA 250',
    batteries: [
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['CATL'],
          capacity: '66.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '250'
        },
        specs: {
          range: '306',
          powerMax: '190HP',
          torqueMax: '375Nm',
          acceleration: '8.9',
          topSpeed: '160',
          driveType: 'FWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['CATL'],
          capacity: '66.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '250 AMG 패키지'
        },
        specs: {
          range: '306',
          powerMax: '190HP',
          torqueMax: '375Nm',
          acceleration: '8.9',
          topSpeed: '160',
          driveType: 'FWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2021,
        endYear: 2022,
        battery: {
          manufacturers: ['CATL'],
          capacity: '66.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '250 AMG 패키지 플러스'
        },
        specs: {
          range: '306',
          powerMax: '190HP',
          torqueMax: '375Nm',
          acceleration: '8.9',
          topSpeed: '160',
          driveType: 'FWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2023,
        endYear: 2023,
        battery: {
          manufacturers: ['SK on'],
          capacity: '66.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '250 프로그레시브'
        },
        specs: {
          range: '306',
          powerMax: '190HP',
          torqueMax: '375Nm',
          acceleration: '8.9',
          topSpeed: '160',
          driveType: 'FWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2023,
        endYear: 2023,
        battery: {
          manufacturers: ['SK on'],
          capacity: '66.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '250 AMG 라인'
        },
        specs: {
          range: '306',
          powerMax: '190HP',
          torqueMax: '375Nm',
          acceleration: '8.9',
          topSpeed: '160',
          driveType: 'FWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK on'],
          capacity: '66.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '250 일렉트릭 아트'
        },
        specs: {
          range: '378',
          powerMax: '190HP',
          torqueMax: '375Nm',
          acceleration: '8.9',
          topSpeed: '160',
          driveType: 'FWD',
          efficiency: '4.9',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK on'],
          capacity: '66.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '250 AMG 라인'
        },
        specs: {
          range: '378',
          powerMax: '190HP',
          torqueMax: '375Nm',
          acceleration: '8.9',
          topSpeed: '160',
          driveType: 'FWD',
          efficiency: '4.9',
          seats: 5
        }
      }
    ]
  },

  // 벤츠 EQB 300 4MATIC (2022년~)
  {
    brandId: 'mercedes-benz',
    modelId: 'eqb-300-4matic',
    modelName: '메르세데스-벤츠 EQB 300 4MATIC',
    batteries: [
      {
        startYear: 2022,
        endYear: 2023,
        battery: {
          manufacturers: ['SK on'],
          capacity: '66.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '300 4MATIC 프로그레시브'
        },
        specs: {
          range: '313',
          powerMax: '228HP',
          torqueMax: '390Nm',
          acceleration: '8.0',
          topSpeed: '160',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 7
        }
      },
      {
        startYear: 2022,
        endYear: 2023,
        battery: {
          manufacturers: ['SK on'],
          capacity: '66.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '300 4MATIC AMG 라인'
        },
        specs: {
          range: '313',
          powerMax: '228HP',
          torqueMax: '390Nm',
          acceleration: '8.0',
          topSpeed: '160',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 7
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK on'],
          capacity: '66.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '300 4MATIC 일렉트릭 아트'
        },
        specs: {
          range: '302',
          powerMax: '228HP',
          torqueMax: '390Nm',
          acceleration: '8.0',
          topSpeed: '160',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 7
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['SK on'],
          capacity: '66.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '300 4MATIC AMG 라인'
        },
        specs: {
          range: '302',
          powerMax: '228HP',
          torqueMax: '390Nm',
          acceleration: '8.0',
          topSpeed: '160',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 7
        }
      }
    ]
  },

  // 벤츠 EQE (2022년~)
  {
    brandId: 'mercedes-benz',
    modelId: 'eqe',
    modelName: '메르세데스-벤츠 EQE',
    batteries: [
      {
        startYear: 2022,
        battery: {
          manufacturers: ['CATL'],
          capacity: '90.6kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '350'
        },
        specs: {
          range: '471',
          powerMax: '292HP',
          torqueMax: '565Nm',
          acceleration: '6.4',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '4.9',
          seats: 5
        }
      },
      {
        startYear: 2022,
        endYear: 2023,
        battery: {
          manufacturers: ['Farasis Energy'],
          capacity: '90.6kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '350+'
        },
        specs: {
          range: '471',
          powerMax: '292HP',
          torqueMax: '565Nm',
          acceleration: '6.4',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '4.9',
          seats: 5
        }
      },
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['Farasis Energy'],
          capacity: '90.6kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '350+'
        },
        specs: {
          range: '486',
          powerMax: '292HP',
          torqueMax: '568Nm',
          acceleration: '6.2',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '5.1',
          seats: 5
        }
      },
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['Farasis Energy'],
          capacity: '90.6kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '350 4MATIC'
        },
        specs: {
          range: '432',
          powerMax: '292HP',
          torqueMax: '751Nm',
          acceleration: '6.0',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '4.5',
          seats: 5
        }
      }
    ]
  },

  // 벤츠 AMG EQE 53 4MATIC+ (성능 모델)
  {
    brandId: 'mercedes-benz',
    modelId: 'amg-eqe-53-4matic',
    modelName: '메르세데스-벤츠 AMG EQE 53 4MATIC+',
    batteries: [
      {
        startYear: 2022,
        endYear: 2023,
        battery: {
          manufacturers: ['Farasis Energy'],
          capacity: '90.6kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: 'AMG EQE 53 4MATIC+'
        },
        specs: {
          range: '354',
          powerMax: '625HP',
          torqueMax: '950Nm',
          acceleration: '3.5',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '3.6',
          seats: 5
        }
      },
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['Farasis Energy'],
          capacity: '90.6kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: 'AMG EQE 53 4MATIC+'
        },
        specs: {
          range: '370',
          powerMax: '625HP',
          torqueMax: '950Nm',
          acceleration: '3.5',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '3.6',
          seats: 5
        }
      }
    ]
  },

  // 벤츠 EQE SUV (2023년~)
  {
    brandId: 'mercedes-benz',
    modelId: 'eqe-suv',
    modelName: '메르세데스-벤츠 EQE SUV',
    batteries: [
      {
        startYear: 2023,
        endYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '88.8kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '350 4MATIC SUV'
        },
        specs: {
          range: '404',
          powerMax: '292HP',
          torqueMax: '751Nm',
          acceleration: '6.0',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2024,
        endYear: 2024,
        battery: {
          manufacturers: ['CATL', 'Farasis Energy'],
          capacity: '88.8kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '350 4MATIC SUV'
        },
        specs: {
          range: '404',
          powerMax: '292HP',
          torqueMax: '751Nm',
          acceleration: '6.0',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Farasis Energy'],
          capacity: '88.8kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '350 4MATIC SUV'
        },
        specs: {
          range: '404',
          powerMax: '292HP',
          torqueMax: '751Nm',
          acceleration: '6.0',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2023,
        endYear: 2023,
        battery: {
          manufacturers: ['Farasis Energy'],
          capacity: '88.8kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '500 4MATIC SUV'
        },
        specs: {
          range: '401',
          powerMax: '408HP',
          torqueMax: '853Nm',
          acceleration: '5.0',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '88.8kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '500 4MATIC SUV'
        },
        specs: {
          range: '401',
          powerMax: '408HP',
          torqueMax: '853Nm',
          acceleration: '5.0',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      }
    ]
  },

  // 벤츠 AMG EQE 53 4MATIC+ SUV (성능 모델)
  {
    brandId: 'mercedes-benz',
    modelId: 'amg-eqe-53-4matic-suv',
    modelName: '메르세데스-벤츠 AMG EQE 53 4MATIC+ SUV',
    batteries: [
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['Farasis Energy'],
          capacity: '90.6kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: 'AMG EQE 53 4MATIC+ SUV'
        },
        specs: {
          range: '352',
          powerMax: '625HP',
          torqueMax: '950Nm',
          acceleration: '3.5',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '3.6',
          seats: 5
        }
      }
    ]
  },

  // 벤츠 EQS (2022년~)
  {
    brandId: 'mercedes-benz',
    modelId: 'eqs',
    modelName: '메르세데스-벤츠 EQS',
    batteries: [
      {
        startYear: 2022,
        endYear: 2022,
        battery: {
          manufacturers: ['Farasis Energy'],
          capacity: '96.5kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '350'
        },
        specs: {
          range: '440',
          powerMax: '292HP',
          torqueMax: '566Nm',
          acceleration: '6.6',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '4.0',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '112.3kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '350'
        },
        specs: {
          range: '464',
          powerMax: '292HP',
          torqueMax: '566Nm',
          acceleration: '6.6',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2022,
        endYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '107.8kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '450+'
        },
        specs: {
          range: '478',
          powerMax: '333HP',
          torqueMax: '568Nm',
          acceleration: '6.2',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '3.8',
          seats: 5
        }
      },
      {
        startYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '107.8kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '450 4MATIC'
        },
        specs: {
          range: '468',
          powerMax: '333HP',
          torqueMax: '568Nm',
          acceleration: '6.4',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '3.6',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '118kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '450 4MATIC'
        },
        specs: {
          range: '500',
          powerMax: '360HP',
          torqueMax: '800Nm',
          acceleration: '5.0',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '118kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '580 4MATIC'
        },
        specs: {
          range: '500',
          powerMax: '544HP',
          torqueMax: '858Nm',
          acceleration: '4.5',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      }
    ]
  },

  // 벤츠 EQS SUV (2023년~)
  {
    brandId: 'mercedes-benz',
    modelId: 'eqs-suv',
    modelName: '메르세데스-벤츠 EQS SUV',
    batteries: [
      {
        startYear: 2023,
        endYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '118kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '450 4MATIC SUV'
        },
        specs: {
          range: '459',
          powerMax: '360HP',
          torqueMax: '800Nm',
          acceleration: '6.0',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '3.6',
          seats: 7
        }
      },
      {
        startYear: 2023,
        endYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '118kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '580 4MATIC SUV'
        },
        specs: {
          range: '459',
          powerMax: '544HP',
          torqueMax: '858Nm',
          acceleration: '4.5',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '3.5',
          seats: 7
        }
      }
    ]
  },

  // 메르세데스-마이바흐 EQS 680 SUV (럭셔리 모델)
  {
    brandId: 'mercedes-maybach',
    modelId: 'maybach-eqs-680-suv',
    modelName: '메르세데스-마이바흐 EQS 680 SUV',
    batteries: [
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '118kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: '680 4MATIC SUV'
        },
        specs: {
          range: '471',
          powerMax: '658HP',
          torqueMax: '950Nm',
          acceleration: '4.4',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '3.5',
          seats: 4
        }
      }
    ]
  },

  // 메르세데스-벤츠 G 580 with EQ Technology (전기 G클래스)
  {
    brandId: 'mercedes-benz',
    modelId: 'g-580-eq-technology',
    modelName: '메르세데스-벤츠 G 580 with EQ Technology',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '116kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: 'G 580 with EQ Technology'
        },
        specs: {
          range: '392',
          powerMax: '587HP',
          torqueMax: '1164Nm',
          acceleration: '4.7',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '3.0',
          seats: 5
        }
      }
    ]
  },

  // 벤츠 AMG EQS 53 4MATIC+ (성능 모델)
  {
    brandId: 'mercedes-benz',
    modelId: 'amg-eqs-53-4matic',
    modelName: '메르세데스-벤츠 AMG EQS 53 4MATIC+',
    batteries: [
      {
        startYear: 2022,
        endYear: 2023,
        battery: {
          manufacturers: ['CATL'],
          capacity: '107.8kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: 'AMG EQS 53 4MATIC+'
        },
        specs: {
          range: '397',
          powerMax: '761HP',
          torqueMax: '1020Nm',
          acceleration: '3.8',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.1',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '118.0kWh',
          warranty: '10년/25만km',
          cellType: 'NCM',
          variant: 'AMG EQS 53 4MATIC+'
        },
        specs: {
          range: '400',
          powerMax: '761HP',
          torqueMax: '1020Nm',
          acceleration: '3.4',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.3',
          seats: 5
        }
      }
    ]
  },

  // ===== BMW =====
  // BMW iX (2025년~)
  {
    brandId: 'bmw',
    modelId: 'ix',
    modelName: 'BMW iX',
    batteries: [
      {
        startYear: 2022,
        endYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '76.6kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive40'
        },
        specs: {
          range: '313',
          powerMax: '326HP',
          torqueMax: '630Nm',
          acceleration: '6.1',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2022,
        endYear: 2024,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '111.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive50'
        },
        specs: {
          range: '464',
          powerMax: '523HP',
          torqueMax: '765Nm',
          acceleration: '4.6',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '94.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive45'
        },
        specs: {
          range: '490',
          powerMax: '408HP',
          torqueMax: '700Nm',
          acceleration: '5.1',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '111.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive60'
        },
        specs: {
          range: '509',
          powerMax: '544HP',
          torqueMax: '765Nm',
          acceleration: '4.6',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '4.0',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '111.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'M70 xDrive'
        },
        specs: {
          range: '421',
          powerMax: '659HP',
          torqueMax: '1015Nm',
          acceleration: '3.8',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.3',
          seats: 5
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '94.8kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive50'
        },
        specs: {
          range: '465',
          powerMax: '408HP',
          torqueMax: '680Nm',
          acceleration: '5.2',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '111.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive60'
        },
        specs: {
          range: '580',
          powerMax: '544HP',
          torqueMax: '765Nm',
          acceleration: '4.5',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.8',
          seats: 5
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '111.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'M70 xDrive'
        },
        specs: {
          range: '530',
          powerMax: '659HP',
          torqueMax: '1015Nm',
          acceleration: '3.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 5
        }
      }
    ]
  },

  // BMW iX3 (2022년~)
  {
    brandId: 'bmw',
    modelId: 'ix3',
    modelName: 'BMW iX3',
    batteries: [
      {
        startYear: 2021,
        endYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '74kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'M 스포츠'
        },
        specs: {
          range: '344',
          powerMax: '286HP',
          torqueMax: '400Nm',
          acceleration: '6.8',
          topSpeed: '180',
          driveType: 'RWD',
          efficiency: '4.1',
          seats: 5
        }
      },
      {
        startYear: 2026,
        battery: {
          manufacturers: ['??'],
          capacity: '108.7kWh',
          warranty: '??년/??만km',
          cellType: 'NMC',
          variant: '50 xDrive'
        },
        specs: {
          range: '??',
          powerMax: '469HP',
          torqueMax: '641Nm',
          acceleration: '4.9',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '??',
          seats: 5
        }
      }
    ]
  },

  // BMW iX1 (2023년~)
  {
    brandId: 'bmw',
    modelId: 'ix1',
    modelName: 'BMW iX1',
    batteries: [
      {
        startYear: 2023,
        endYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive30 xLine'
        },
        specs: {
          range: '310',
          powerMax: '313HP',
          torqueMax: '494Nm',
          acceleration: '5.6',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '4.2',
          seats: 5
        }
      },
      {
        startYear: 2023,
        endYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive30 M Sport'
        },
        specs: {
          range: '310',
          powerMax: '313HP',
          torqueMax: '494Nm',
          acceleration: '5.6',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '4.2',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive M35i'
        },
        specs: {
          range: '355',
          powerMax: '313HP',
          torqueMax: '494Nm',
          acceleration: '5.6',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'eDrive20 M Sport'
        },
        specs: {
          range: '340',
          powerMax: '204HP',
          torqueMax: '255Nm',
          acceleration: '8.6',
          topSpeed: '170',
          driveType: 'FWD',
          efficiency: '4.8',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive30 xLine'
        },
        specs: {
          range: '310',
          powerMax: '313HP',
          torqueMax: '494Nm',
          acceleration: '5.6',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '4.2',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive30 M Sport'
        },
        specs: {
          range: '310',
          powerMax: '313HP',
          torqueMax: '494Nm',
          acceleration: '5.6',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '4.2',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive M35i'
        },
        specs: {
          range: '355',
          powerMax: '313HP',
          torqueMax: '494Nm',
          acceleration: '5.6',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '4.6',
          seats: 5
        }
      }
    ]
  },

  // BMW iX2 (2025년~)
  {
    brandId: 'bmw',
    modelId: 'ix2',
    modelName: 'BMW iX2',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'eDrive20 M Sport'
        },
        specs: {
          range: '350',
          powerMax: '204HP',
          torqueMax: '250Nm',
          acceleration: '8.6',
          topSpeed: '170',
          driveType: 'FWD',
          efficiency: '4.8',
          seats: 5
        }
      }
    ]
  },

  // BMW i4 (2022년~)
  {
    brandId: 'bmw',
    modelId: 'i4',
    modelName: 'BMW i4',
    batteries: [
      {
        startYear: 2022,
        endYear: 2024,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '83.9kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'eDrive40 M Sport'
        },
        specs: {
          range: '429',
          powerMax: '340HP',
          torqueMax: '430Nm',
          acceleration: '5.7',
          topSpeed: '190',
          driveType: 'RWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2022,
        endYear: 2024,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '83.9kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'M50'
        },
        specs: {
          range: '378',
          powerMax: '544HP',
          torqueMax: '815Nm',
          acceleration: '3.9',
          topSpeed: '225',
          driveType: 'AWD',
          efficiency: '3.9',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '84kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'eDrive40 M Sport'
        },
        specs: {
          range: '420',
          powerMax: '340HP',
          torqueMax: '430Nm',
          acceleration: '5.7',
          topSpeed: '190',
          driveType: 'RWD',
          efficiency: '4.5',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '84kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'M50 xDrive'
        },
        specs: {
          range: '370',
          powerMax: '544HP',
          torqueMax: '815Nm',
          acceleration: '3.9',
          topSpeed: '225',
          driveType: 'AWD',
          efficiency: '3.8',
          seats: 5
        }
      }
    ]
  },

  // BMW i5 (2024년~)
  {
    brandId: 'bmw',
    modelId: 'i5',
    modelName: 'BMW i5',
    batteries: [
      {
        startYear: 2024,
        endYear: 2024,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '81.2kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'eDrive40'
        },
        specs: {
          range: '441',
          powerMax: '340HP',
          torqueMax: '430Nm',
          acceleration: '6.0',
          topSpeed: '193',
          driveType: 'RWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2024,
        endYear: 2024,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '81.2kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'M60 xDrive'
        },
        specs: {
          range: '384',
          powerMax: '601HP',
          torqueMax: '815Nm',
          acceleration: '3.8',
          topSpeed: '230',
          driveType: 'AWD',
          efficiency: '3.9',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '81.2kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'eDrive40'
        },
        specs: {
          range: '441',
          powerMax: '340HP',
          torqueMax: '430Nm',
          acceleration: '6.0',
          topSpeed: '193',
          driveType: 'RWD',
          efficiency: '4.6',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '81.2kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive40'
        },
        specs: {
          range: '412',
          powerMax: '394HP',
          torqueMax: '580Nm',
          acceleration: '5.4',
          topSpeed: '215',
          driveType: 'AWD',
          efficiency: '4.2',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '81.2kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'M60 xDrive'
        },
        specs: {
          range: '384',
          powerMax: '601HP',
          torqueMax: '815Nm',
          acceleration: '3.8',
          topSpeed: '230',
          driveType: 'AWD',
          efficiency: '3.9',
          seats: 5
        }
      }
    ]
  },

  // BMW i7 (2023년~)
  {
    brandId: 'bmw',
    modelId: 'i7',
    modelName: 'BMW i7',
    batteries: [
      {
        startYear: 2023,
        endYear: 2023,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '105.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive60'
        },
        specs: {
          range: '438',
          powerMax: '544HP',
          torqueMax: '745Nm',
          acceleration: '4.7',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '3.8',
          seats: 5
        }
      },
      {
        startYear: 2023,
        endYear: 2023,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '105.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive60 M Sport'
        },
        specs: {
          range: '438',
          powerMax: '544HP',
          torqueMax: '745Nm',
          acceleration: '4.7',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '3.8',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '105.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'eDrive50'
        },
        specs: {
          range: '455',
          powerMax: '455HP',
          torqueMax: '650Nm',
          acceleration: '5.5',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '3.8',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '105.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'xDrive60'
        },
        specs: {
          range: '391',
          powerMax: '544HP',
          torqueMax: '745Nm',
          acceleration: '4.7',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '3.3',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '105.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'M70 xDrive'
        },
        specs: {
          range: '391',
          powerMax: '659HP',
          torqueMax: '1100Nm',
          acceleration: '3.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.3',
          seats: 5
        }
      }
    ]
  },

  // ===== 아우디 =====
  // 아우디 e-트론 (2020년~2023년)
  {
    brandId: 'audi',
    modelId: 'e-tron',
    modelName: '아우디 e-트론',
    batteries: [
      {
        startYear: 2020,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '71kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '50 콰트로'
        },
        specs: {
          range: '210',
          powerMax: '308HP',
          torqueMax: '540Nm',
          acceleration: '6.8',
          topSpeed: '190',
          driveType: 'AWD',
          efficiency: '2.9',
          seats: 5
        }
      },
      {
        startYear: 2020,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션', 'Samsung SDI'],
          capacity: '95kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '55 콰트로'
        },
        specs: {
          range: '307',
          powerMax: '408HP',
          torqueMax: '664Nm',
          acceleration: '5.7',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '3.1',
          seats: 5
        }
      }
    ]
  },

  // 아우디 e-트론 스포트백 (2020년~2023년)
  {
    brandId: 'audi',
    modelId: 'e-tron-sportback',
    modelName: '아우디 e-트론 스포트백',
    batteries: [
      {
        startYear: 2020,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '71kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '50 스포트백 콰트로'
        },
        specs: {
          range: '220',
          powerMax: '308HP',
          torqueMax: '540Nm',
          acceleration: '6.8',
          topSpeed: '190',
          driveType: 'AWD',
          efficiency: '3.0',
          seats: 5
        }
      },
      {
        startYear: 2020,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션', 'Samsung SDI'],
          capacity: '95kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '55 스포트백 콰트로'
        },
        specs: {
          range: '307',
          powerMax: '408HP',
          torqueMax: '664Nm',
          acceleration: '5.7',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '3.2',
          seats: 5
        }
      }
    ]
  },

  // 아우디 Q8 e-트론 (2024년~2025년)
  {
    brandId: 'audi',
    modelId: 'q8-e-tron',
    modelName: '아우디 Q8 e-트론',
    batteries: [
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '95kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '50 e-트론 콰트로'
        },
        specs: {
          range: '298',
          powerMax: '340HP',
          torqueMax: '664Nm',
          acceleration: '6.0',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '3.0',
          seats: 5
        }
      },
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '114kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '55 e-트론 콰트로'
        },
        specs: {
          range: '368',
          powerMax: '408HP',
          torqueMax: '664Nm',
          acceleration: '5.6',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '3.0',
          seats: 5
        }
      },
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '114kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '55 e-트론 콰트로 프리미엄'
        },
        specs: {
          range: '368',
          powerMax: '408HP',
          torqueMax: '664Nm',
          acceleration: '5.6',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '3.0',
          seats: 5
        }
      }
    ]
  },

  // 아우디 Q8 스포트백 e-트론 (2024년~2025년)
  {
    brandId: 'audi',
    modelId: 'q8-sportback-e-tron',
    modelName: '아우디 Q8 스포트백 e-트론',
    batteries: [
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '95kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '50 스포트백 e-트론 콰트로'
        },
        specs: {
          range: '313',
          powerMax: '340HP',
          torqueMax: '664Nm',
          acceleration: '6.0',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '3.2',
          seats: 5
        }
      },
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '114kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '55 스포트백 e-트론 콰트로'
        },
        specs: {
          range: '368',
          powerMax: '408HP',
          torqueMax: '664Nm',
          acceleration: '5.6',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '3.0',
          seats: 5
        }
      },
      {
        startYear: 2024,
        endYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '114kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '55 스포트백 e-트론 콰트로 프리미엄'
        },
        specs: {
          range: '368',
          powerMax: '408HP',
          torqueMax: '664Nm',
          acceleration: '5.6',
          topSpeed: '200',
          driveType: 'AWD',
          efficiency: '3.0',
          seats: 5
        }
      }
    ]
  },

  // 아우디 SQ8 e-트론 (2024년~)
  {
    brandId: 'audi',
    modelId: 'sq8-e-tron',
    modelName: '아우디 SQ8 e-트론',
    batteries: [
      {
        startYear: 2024,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '114kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'SQ8 e-트론 SUV'
        },
        specs: {
          range: '303',
          powerMax: '503HP',
          torqueMax: '973Nm',
          acceleration: '4.5',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '2.7',
          seats: 5
        }
      },
      {
        startYear: 2024,
        battery: {
          manufacturers: ['Samsung SDI'],
          capacity: '114kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'SQ8 스포트백 e-트론'
        },
        specs: {
          range: '303',
          powerMax: '503HP',
          torqueMax: '973Nm',
          acceleration: '4.5',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '2.7',
          seats: 5
        }
      }
    ]
  },

  // 아우디 Q4 e-트론 (2022년~)
  {
    brandId: 'audi',
    modelId: 'q4-e-tron',
    modelName: '아우디 Q4 e-트론',
    batteries: [
      {
        startYear: 2022,
        endYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Q4 40 e-트론'
        },
        specs: {
          range: '368',
          powerMax: '204HP',
          torqueMax: '310Nm',
          acceleration: '8.5',
          topSpeed: '160',
          driveType: 'RWD',
          efficiency: '4.8',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Q4 45 e-트론'
        },
        specs: {
          range: '406',
          powerMax: '286HP',
          torqueMax: '545Nm',
          acceleration: '6.7',
          topSpeed: '180',
          driveType: 'RWD',
          efficiency: '5.2',
          seats: 5
        }
      }
    ]
  },

  // 아우디 Q4 스포트백 e-트론 (2022년~)
  {
    brandId: 'audi',
    modelId: 'q4-sportback-e-tron',
    modelName: '아우디 Q4 스포트백 e-트론',
    batteries: [
      {
        startYear: 2022,
        endYear: 2024,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Q4 스포트백 40 e-트론'
        },
        specs: {
          range: '370',
          powerMax: '204HP',
          torqueMax: '310Nm',
          acceleration: '8.5',
          topSpeed: '160',
          driveType: 'RWD',
          efficiency: '4.8',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '82kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Q4 스포트백 45 e-트론'
        },
        specs: {
          range: '406',
          powerMax: '286HP',
          torqueMax: '545Nm',
          acceleration: '6.7',
          topSpeed: '180',
          driveType: 'RWD',
          efficiency: '5.2',
          seats: 5
        }
      }
    ]
  },

  // 아우디 Q6 e-트론 (2025년~)
  {
    brandId: 'audi',
    modelId: 'q6-e-tron',
    modelName: '아우디 Q6 e-트론',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI', 'CATL'],
          capacity: '100kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Q6 콰트로 프리미엄'
        },
        specs: {
          range: '400',
          powerMax: '388HP',
          torqueMax: '855Nm',
          acceleration: '5.9',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '3.8',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI', 'CATL'],
          capacity: '100kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Q6 퍼포먼스'
        },
        specs: {
          range: '468',
          powerMax: '306HP',
          torqueMax: '485Nm',
          acceleration: '6.7',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '4.3',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['Samsung SDI', 'CATL'],
          capacity: '100kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'Q6 퍼포먼스 프리미엄'
        },
        specs: {
          range: '468',
          powerMax: '306HP',
          torqueMax: '485Nm',
          acceleration: '6.7',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '4.3',
          seats: 5
        }
      }
    ]
  },

  // 아우디 SQ6 e-트론 (2025년~)
  {
    brandId: 'audi',
    modelId: 'sq6-e-tron',
    modelName: '아우디 SQ6 e-트론',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '100kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'SQ6 e-트론'
        },
        specs: {
          range: '412',
          powerMax: '490HP',
          torqueMax: '855Nm',
          acceleration: '4.4',
          topSpeed: '210',
          driveType: 'AWD',
          efficiency: '3.8',
          seats: 5
        }
      }
    ]
  },

  // 아우디 e-트론 GT (2021년~)
  {
    brandId: 'audi',
    modelId: 'e-tron-gt',
    modelName: '아우디 e-트론 GT',
    batteries: [
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'e-트론 GT 콰트로'
        },
        specs: {
          range: '362',
          powerMax: '530HP',
          torqueMax: '640Nm',
          acceleration: '4.1',
          topSpeed: '245',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 4
        }
      },
      {
        startYear: 2021,
        endYear: 2023,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'RS e-트론 GT'
        },
        specs: {
          range: '336',
          powerMax: '646HP',
          torqueMax: '830Nm',
          acceleration: '3.3',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.4',
          seats: 4
        }
      }
    ]
  },

  // 아우디 S e-트론 GT (2025년~)
  {
    brandId: 'audi',
    modelId: 's-e-tron-gt',
    modelName: '아우디 S e-트론 GT',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '97kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'S e-트론 GT'
        },
        specs: {
          range: '420',
          powerMax: '592HP',
          torqueMax: '670Nm',
          acceleration: '3.6',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 4
        }
      }
    ]
  },

  // 아우디 RS e-트론 GT (2025년~)
  {
    brandId: 'audi',
    modelId: 'rs-e-tron-gt',
    modelName: '아우디 RS e-트론 GT',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '105kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'RS e-트론 GT'
        },
        specs: {
          range: '387',
          powerMax: '748HP',
          torqueMax: '985Nm',
          acceleration: '2.8',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 4
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG에너지솔루션'],
          capacity: '105kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'RS e-트론 GT 퍼포먼스'
        },
        specs: {
          range: '384',
          powerMax: '912HP',
          torqueMax: '1005Nm',
          acceleration: '2.5',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.4',
          seats: 4
        }
      }
    ]
  },

  // 아우디 S6 e-트론 (2025년~)
  {
    brandId: 'audi',
    modelId: 's6-e-tron',
    modelName: '아우디 S6 e-트론',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '100kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'S6 e-트론'
        },
        specs: {
          range: '440',
          powerMax: '503HP',
          torqueMax: '855Nm',
          acceleration: '4.1',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '4.2',
          seats: 5
        }
      }
    ]
  },

  // 아우디 A6 e-트론 (2025년~)
  {
    brandId: 'audi',
    modelId: 'a6-e-tron',
    modelName: '아우디 A6 e-트론',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '100kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '퍼포먼스 어드밴스드'
        },
        specs: {
          range: '469',
          powerMax: '367HP',
          torqueMax: '565Nm',
          acceleration: '5.4',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '4.5',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '100kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '퍼포먼스 S-라인'
        },
        specs: {
          range: '469',
          powerMax: '367HP',
          torqueMax: '565Nm',
          acceleration: '5.4',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '4.5',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '100kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: '퍼포먼스 S-라인 블랙 에디션'
        },
        specs: {
          range: '469',
          powerMax: '367HP',
          torqueMax: '565Nm',
          acceleration: '5.4',
          topSpeed: '210',
          driveType: 'RWD',
          efficiency: '4.5',
          seats: 5
        }
      }
    ]
  },

  // ===== 포르쉐 =====
  {
    brandId: 'porsche',
    modelId: 'taycan',
    modelName: '타이칸',
    batteries: [
      // 2021년형 - 4S
      {
        startYear: 2021,
        endYear: 2021,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM712',
          variant: '4S'
        },
        specs: {
          range: '251',
          powerMax: '523HP',
          torqueMax: '653Nm',
          acceleration: '4.0',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.0',
          seats: 4
        }
      },
      // 2021년형 - 터보
      {
        startYear: 2021,
        endYear: 2021,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM712',
          variant: '터보'
        },
        specs: {
          range: '309',
          powerMax: '680HP',
          torqueMax: '867Nm',
          acceleration: '3.2',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '2.9',
          seats: 4
        }
      },
      // 2021년형 - 터보 S
      {
        startYear: 2021,
        endYear: 2021,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM712',
          variant: '터보 S'
        },
        specs: {
          range: '284',
          powerMax: '761HP',
          torqueMax: '1071Nm',
          acceleration: '2.8',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '2.8',
          seats: 4
        }
      },
      // 2022년형 - GTS
      {
        startYear: 2022,
        endYear: 2023,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: 'GTS'
        },
        specs: {
          range: '485',
          powerMax: '598HP',
          torqueMax: '850Nm',
          acceleration: '3.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.2',
          seats: 4
        }
      },
      // 2024년형 - 기본
      {
        startYear: 2024,
        endYear: 2024,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '79.2kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '기본'
        },
        specs: {
          range: '266',
          powerMax: '402HP',
          torqueMax: '352Nm',
          acceleration: '5.4',
          topSpeed: '230',
          driveType: 'RWD',
          efficiency: '3.2',
          seats: 4
        }
      },
      // 2024년형 - 4S
      {
        startYear: 2024,
        endYear: 2024,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '4S'
        },
        specs: {
          range: '251',
          powerMax: '523HP',
          torqueMax: '653Nm',
          acceleration: '4.0',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.0',
          seats: 4
        }
      },
      // 2024년형 - 터보
      {
        startYear: 2024,
        endYear: 2024,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '터보'
        },
        specs: {
          range: '284',
          powerMax: '670HP',
          torqueMax: '867Nm',
          acceleration: '3.2',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '2.9',
          seats: 4
        }
      },
      // 2024년형 - 터보 S
      {
        startYear: 2024,
        endYear: 2024,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '터보 S'
        },
        specs: {
          range: '289',
          powerMax: '750HP',
          torqueMax: '1071Nm',
          acceleration: '2.8',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '2.8',
          seats: 4
        }
      },
      // 2025년형 - 기본
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '89kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '기본'
        },
        specs: {
          range: '458',
          powerMax: '402HP',
          torqueMax: '418Nm',
          acceleration: '4.8',
          topSpeed: '230',
          driveType: 'RWD',
          efficiency: '4.6',
          seats: 4
        }
      },
      // 2025년형 - 4
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '89kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '4'
        },
        specs: {
          range: '456',
          powerMax: '429HP',
          torqueMax: '622Nm',
          acceleration: '4.6',
          topSpeed: '230',
          driveType: 'AWD',
          efficiency: '4.2',
          seats: 4
        }
      },
      // 2025년형 - 4S
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '105kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '4S'
        },
        specs: {
          range: '477',
          powerMax: '590HP',
          torqueMax: '724Nm',
          acceleration: '3.7',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '4.1',
          seats: 4
        }
      },
      // 2025년형 - GTS
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '105kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: 'GTS'
        },
        specs: {
          range: '602',
          powerMax: '690HP',
          torqueMax: '790Nm',
          acceleration: '3.1',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '5.2',
          seats: 4
        }
      },
      // 2025년형 - 터보
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '105kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '터보'
        },
        specs: {
          range: '430',
          powerMax: '871HP',
          torqueMax: '908Nm',
          acceleration: '2.7',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 4
        }
      },
      // 2025년형 - 터보 S
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '105kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '터보 S'
        },
        specs: {
          range: '425',
          powerMax: '938HP',
          torqueMax: '1132Nm',
          acceleration: '2.4',
          topSpeed: '260',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 4
        }
      },
      // 2025년형 - 터보 GT
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '105kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '터보 GT'
        },
        specs: {
          range: '423',
          powerMax: '1018HP',
          torqueMax: '1265Nm',
          acceleration: '2.3',
          topSpeed: '298',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 4
        }
      },
      // 2025년형 - 터보 GT with Weissach Package
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '105kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '터보 GT with Weissach Package'
        },
        specs: {
          range: '423',
          powerMax: '1018HP',
          torqueMax: '1265Nm',
          acceleration: '2.3',
          topSpeed: '298',
          driveType: 'AWD',
          efficiency: '3.7',
          seats: 4
        }
      }
    ]
  },

  // 포르쉐 타이칸 크로스 투리스모
  {
    brandId: 'porsche',
    modelId: 'taycan-cross-turismo',
    modelName: '타이칸 크로스 투리스모',
    batteries: [
      // 2021년형 - 4
      {
        startYear: 2021,
        endYear: 2024,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '4'
        },
        specs: {
          range: '289',
          powerMax: '476HP',
          torqueMax: '500Nm',
          acceleration: '4.7',
          topSpeed: '220',
          driveType: 'AWD',
          efficiency: '2.9',
          seats: 5
        }
      },
      // 2021년형 - 4S
      {
        startYear: 2021,
        endYear: 2024,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '4S'
        },
        specs: {
          range: '287',
          powerMax: '571HP',
          torqueMax: '650Nm',
          acceleration: '3.8',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '2.9',
          seats: 5
        }
      },
      // 2021년형 - 터보
      {
        startYear: 2021,
        endYear: 2024,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '93.4kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '터보'
        },
        specs: {
          range: '274',
          powerMax: '680HP',
          torqueMax: '850Nm',
          acceleration: '3.1',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '2.8',
          seats: 5
        }
      },
      // 2025년형 - 4
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '105kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '4'
        },
        specs: {
          range: '406',
          powerMax: '435HP',
          torqueMax: '622Nm',
          acceleration: '4.7',
          topSpeed: '220',
          driveType: 'AWD',
          efficiency: '3.8',
          seats: 5
        }
      },
      // 2025년형 - 4S
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '105kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '4S'
        },
        specs: {
          range: '451',
          powerMax: '598HP',
          torqueMax: '724Nm',
          acceleration: '3.8',
          topSpeed: '240',
          driveType: 'AWD',
          efficiency: '4.3',
          seats: 5
        }
      },
      // 2025년형 - 터보
      {
        startYear: 2025,
        battery: {
          manufacturers: ['LG 에너지솔루션'],
          capacity: '105kWh',
          warranty: '8년/16만km',
          cellType: 'NCM811',
          variant: '터보'
        },
        specs: {
          range: '406',
          powerMax: '884HP',
          torqueMax: '908Nm',
          acceleration: '2.8',
          topSpeed: '250',
          driveType: 'AWD',
          efficiency: '3.9',
          seats: 5
        }
      }
    ]
  },

  // ===== 미니 =====
  // 미니 쿠퍼 E
  {
    brandId: 'mini',
    modelId: 'cooper',
    modelName: '미니 쿠퍼',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['SVOLT'],
          capacity: '40.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'E'
        },
        specs: {
          range: '305',
          powerMax: '181HP',
          torqueMax: '290Nm',
          acceleration: '7.3',
          topSpeed: '170',
          driveType: 'FWD',
          efficiency: '5.7',
          seats: 4
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['SVOLT'],
          capacity: '54.2kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'SE'
        },
        specs: {
          range: '402',
          powerMax: '215HP',
          torqueMax: '330Nm',
          acceleration: '6.7',
          topSpeed: '180',
          driveType: 'FWD',
          efficiency: '5.3',
          seats: 4
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['SVOLT'],
          capacity: '58.1kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'JCW'
        },
        specs: {
          range: '291',
          powerMax: '258HP',
          torqueMax: '350Nm',
          acceleration: '5.9',
          topSpeed: '200',
          driveType: 'FWD',
          efficiency: '5.0',
          seats: 4
        }
      }
    ]
  },

  // 미니 에이스맨
  {
    brandId: 'mini',
    modelId: 'aceman',
    modelName: '미니 에이스맨',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['SVOLT'],
          capacity: '42.5kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'E'
        },
        specs: {
          range: '312',
          powerMax: '181HP',
          torqueMax: '290Nm',
          acceleration: '7.9',
          topSpeed: '160',
          driveType: 'FWD',
          efficiency: '5.4',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['SVOLT'],
          capacity: '54.2kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'SE'
        },
        specs: {
          range: '312',
          powerMax: '214HP',
          torqueMax: '330Nm',
          acceleration: '7.1',
          topSpeed: '170',
          driveType: 'FWD',
          efficiency: '5.3',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['SVOLT'],
          capacity: '56.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'JCW'
        },
        specs: {
          range: '309',
          powerMax: '258HP',
          torqueMax: '350Nm',
          acceleration: '6.4',
          topSpeed: '200',
          driveType: 'FWD',
          efficiency: '5.4',
          seats: 5
        }
      }
    ]
  },

  // 미니 컨트리맨
  {
    brandId: 'mini',
    modelId: 'countryman',
    modelName: '미니 컨트리맨',
    batteries: [
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'E'
        },
        specs: {
          range: '326',
          powerMax: '190HP',
          torqueMax: '290Nm',
          acceleration: '8.6',
          topSpeed: '170',
          driveType: 'FWD',
          efficiency: '4.9',
          seats: 5
        }
      },
      {
        startYear: 2025,
        battery: {
          manufacturers: ['CATL'],
          capacity: '64.7kWh',
          warranty: '8년/16만km',
          cellType: 'NCM',
          variant: 'SE ALL4'
        },
        specs: {
          range: '349',
          powerMax: '308HP',
          torqueMax: '494Nm',
          acceleration: '5.4',
          topSpeed: '180',
          driveType: 'AWD',
          efficiency: '4.6',
          seats: 5
        }
      }
    ]
  }
];

module.exports = { VEHICLE_BATTERY_DATABASE };