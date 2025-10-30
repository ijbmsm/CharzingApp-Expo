import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

// Firebase Admin 초기화 (중복 초기화 방지)
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

// 업로드할 차량 데이터
const vehicleData = [
  {
    documentId: 'hyundai-ioniq-5-standard',
    data: {
      brandId: 'hyundai',
      modelName: '아이오닉 5',
      baseModelId: 'ioniq-5-standard'
    },
    variants: [
      {
        variantId: 'standard-rwd-2021-2022',
        data: {
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
            seats: 5
          }
        }
      },
      {
        variantId: 'standard-2wd-refresh-2024',
        data: {
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
            seats: 5
          }
        }
      }
    ]
  },
  {
    documentId: 'hyundai-ioniq-5-standard-awd',
    data: {
      brandId: 'hyundai',
      modelName: '아이오닉 5 Standard AWD',
      baseModelId: 'ioniq-5-standard-awd'
    },
    variants: [
      {
        variantId: 'standard-awd-2021-2022',
        data: {
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
            seats: 5
          }
        }
      },
      {
        variantId: 'standard-awd-2023',
        data: {
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
            seats: 5
          }
        }
      }
    ]
  },
  {
    documentId: 'hyundai-ioniq-5-longrange',
    data: {
      brandId: 'hyundai',
      modelName: '아이오닉 5 Long Range',
      baseModelId: 'ioniq-5-longrange'
    },
    variants: [
      {
        variantId: 'longrange-rwd-2021-2022',
        data: {
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
            seats: 5
          }
        }
      },
      {
        variantId: 'longrange-rwd-2023',
        data: {
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
            seats: 5
          }
        }
      },
      {
        variantId: 'longrange-rwd-2024',
        data: {
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
            seats: 5
          }
        }
      }
    ]
  },
  {
    documentId: 'hyundai-ioniq-5-longrange-awd',
    data: {
      brandId: 'hyundai',
      modelName: '아이오닉 5 Long Range AWD',
      baseModelId: 'ioniq-5-longrange-awd'
    },
    variants: [
      {
        variantId: 'longrange-awd-2021',
        data: {
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
            seats: 5
          }
        }
      },
      {
        variantId: 'longrange-awd-2023',
        data: {
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
            seats: 5
          }
        }
      },
      {
        variantId: 'longrange-awd-2024',
        data: {
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
            seats: 5
          }
        }
      }
    ]
  },
  {
    documentId: 'hyundai-ioniq-5-n',
    data: {
      brandId: 'hyundai',
      modelName: '아이오닉 5 N',
      baseModelId: 'ioniq-5-n'
    },
    variants: [
      {
        variantId: 'n-performance-awd-2023',
        data: {
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
            seats: 5
          }
        }
      },
      {
        variantId: 'n-performance-awd-2024',
        data: {
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
            seats: 5
          }
        }
      }
    ]
  },
  {
    documentId: 'hyundai-ioniq-5-n-awd',
    data: {
      brandId: 'hyundai',
      modelName: '아이오닉 5 N AWD',
      baseModelId: 'ioniq-5-n-awd'
    },
    variants: [
      {
        variantId: 'n-performance-awd-2024',
        data: {
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
            seats: 5
          }
        }
      }
    ]
  },
  {
    documentId: 'hyundai-kona-ev-standard-2025',
    data: {
      brandId: 'hyundai',
      modelName: '코나 EV Standard',
      baseModelId: 'kona-ev-standard-2025'
    },
    variants: [
      {
        variantId: 'standard-2024',
        data: {
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
            seats: 5
          }
        }
      }
    ]
  },
  {
    documentId: 'hyundai-kona-ev-longrange-2025',
    data: {
      brandId: 'hyundai',
      modelName: '코나 EV Long Range',
      baseModelId: 'kona-ev-longrange-2025'
    },
    variants: [
      {
        variantId: 'longrange-2024',
        data: {
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
            seats: 5
          }
        }
      }
    ]
  },
  {
    documentId: 'hyundai-kona-ev-n-line-2025',
    data: {
      brandId: 'hyundai',
      modelName: '코나 EV N라인',
      baseModelId: 'kona-ev-n-line-2025'
    },
    variants: [
      {
        variantId: 'n-line-2024',
        data: {
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
            seats: 5
          }
        }
      }
    ]
  }
];

export const uploadVehiclesToFirestore = onRequest(async (req, res) => {
  try {
    console.log('차량 데이터 업로드 시작...');
    
    let successCount = 0;
    let errorCount = 0;
    const results: any[] = [];

    for (const vehicle of vehicleData) {
      try {
        const { documentId, data, variants } = vehicle;
        
        // 메인 문서 생성
        const vehicleRef = db.collection('vehicles').doc(documentId);
        await vehicleRef.set({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // variants 서브컬렉션 생성
        for (const variant of variants) {
          const variantRef = vehicleRef.collection('variants').doc(variant.variantId);
          await variantRef.set({
            ...variant.data,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        successCount++;
        results.push({
          documentId,
          status: 'success',
          variants: variants.length
        });
        
        console.log(`✅ ${documentId} 업로드 완료 (variants: ${variants.length}개)`);
        
      } catch (error) {
        errorCount++;
        results.push({
          documentId: vehicle.documentId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        console.error(`❌ ${vehicle.documentId} 업로드 실패:`, error);
      }
    }
    
    const summary = {
      total: vehicleData.length,
      success: successCount,
      errors: errorCount,
      results
    };
    
    console.log('업로드 완료:', summary);
    
    res.status(200).json({
      message: '차량 데이터 업로드 완료',
      summary
    });
    
  } catch (error) {
    console.error('업로드 중 오류 발생:', error);
    res.status(500).json({
      error: '업로드 실패',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});