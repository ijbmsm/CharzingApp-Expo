const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'charzing-d1600.firebasestorage.app'
  });
}

const db = admin.firestore();

const audiData = {
  name: '아우디',
  englishName: 'AUDI',
  logoUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/brand-logos%2Faudi-logo.png?alt=media',
  models: {
    'e-tron': {
      name: 'e-tron',
      englishName: 'e-tron',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2Fe-tron%2F2021%2Faudi_e_tron_2021.jpg?alt=media',
      defaultBattery: {
        capacity: 95,
        supplier: 'LG에너지솔루션',
        type: 'NCM',
        voltage: 400,
        range: 307
      },
      trims: [
        {
          trimId: 'e-tron-50-quattro',
          name: 'e-tron 50 quattro',
          driveType: 'AWD',
          yearRange: { start: 2020, end: 2023 },
          variants: [
            {
              years: ['2020', '2021', '2022', '2023'],
              batteryCapacity: 71,
              range: 210,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '308마력',
                torque: '540Nm',
                acceleration: '6.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 150kW (DC)',
                efficiency: '29.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'e-tron-55-quattro',
          name: 'e-tron 55 quattro',
          driveType: 'AWD',
          yearRange: { start: 2020, end: 2023 },
          variants: [
            {
              years: ['2020', '2021', '2022', '2023'],
              batteryCapacity: 95,
              range: 307,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '408마력',
                torque: '664Nm',
                acceleration: '5.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 150kW (DC)',
                efficiency: '31.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'e-tron-sportback': {
      name: 'e-tron Sportback',
      englishName: 'e-tron Sportback',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2Fe-tron-sportback%2F2021%2Faudi_e_tron_sportback_2021.jpg?alt=media',
      defaultBattery: {
        capacity: 95,
        supplier: 'LG에너지솔루션',
        type: 'NCM',
        voltage: 400,
        range: 307
      },
      trims: [
        {
          trimId: 'e-tron-sportback-50-quattro',
          name: 'e-tron Sportback 50 quattro',
          driveType: 'AWD',
          yearRange: { start: 2020, end: 2023 },
          variants: [
            {
              years: ['2020', '2021', '2022', '2023'],
              batteryCapacity: 71,
              range: 220,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '308마력',
                torque: '540Nm',
                acceleration: '6.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 150kW (DC)',
                efficiency: '30.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'e-tron-sportback-55-quattro',
          name: 'e-tron Sportback 55 quattro',
          driveType: 'AWD',
          yearRange: { start: 2020, end: 2023 },
          variants: [
            {
              years: ['2020', '2021', '2022', '2023'],
              batteryCapacity: 95,
              range: 307,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '408마력',
                torque: '664Nm',
                acceleration: '5.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 150kW (DC)',
                efficiency: '32.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'q8-e-tron': {
      name: 'Q8 e-tron',
      englishName: 'Q8 e-tron',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FQ8-e-tron%2F2024%2Faudi_q8_e_tron_2024.jpg?alt=media',
      defaultBattery: {
        capacity: 114,
        supplier: 'Samsung SDI',
        type: 'NCM',
        voltage: 400,
        range: 368
      },
      trims: [
        {
          trimId: 'q8-e-tron-50-quattro',
          name: 'Q8 e-tron 50 quattro',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2025 },
          variants: [
            {
              years: ['2024', '2025'],
              batteryCapacity: 95,
              range: 298,
              supplier: 'Samsung SDI',
              specifications: {
                motor: '듀얼 모터',
                power: '340마력',
                torque: '664Nm',
                acceleration: '6.0초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 170kW (DC)',
                efficiency: '30.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'q8-e-tron-55-quattro',
          name: 'Q8 e-tron 55 quattro',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2025 },
          variants: [
            {
              years: ['2024', '2025'],
              batteryCapacity: 114,
              range: 368,
              supplier: 'Samsung SDI',
              specifications: {
                motor: '듀얼 모터',
                power: '408마력',
                torque: '664Nm',
                acceleration: '5.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 170kW (DC)',
                efficiency: '30.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'q8-e-tron-55-quattro-premium',
          name: 'Q8 e-tron 55 quattro Premium',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2025 },
          variants: [
            {
              years: ['2024', '2025'],
              batteryCapacity: 114,
              range: 368,
              supplier: 'Samsung SDI',
              specifications: {
                motor: '듀얼 모터',
                power: '408마력',
                torque: '664Nm',
                acceleration: '5.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 170kW (DC)',
                efficiency: '30.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'sq8-e-tron',
          name: 'SQ8 e-tron',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2024 },
          variants: [
            {
              years: ['2024'],
              batteryCapacity: 114,
              range: 303,
              supplier: 'Samsung SDI',
              specifications: {
                motor: '듀얼 모터 (S 퍼포먼스)',
                power: '503마력',
                torque: '973Nm',
                acceleration: '4.5초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 170kW (DC)',
                efficiency: '27.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'q8-sportback-e-tron': {
      name: 'Q8 Sportback e-tron',
      englishName: 'Q8 Sportback e-tron',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FQ8-sportback-e-tron%2F2024%2Faudi_q8_sportback_e_tron_2024.jpg?alt=media',
      defaultBattery: {
        capacity: 114,
        supplier: 'Samsung SDI',
        type: 'NCM',
        voltage: 400,
        range: 368
      },
      trims: [
        {
          trimId: 'q8-sportback-e-tron-50-quattro',
          name: 'Q8 Sportback e-tron 50 quattro',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2025 },
          variants: [
            {
              years: ['2024', '2025'],
              batteryCapacity: 95,
              range: 313,
              supplier: 'Samsung SDI',
              specifications: {
                motor: '듀얼 모터',
                power: '340마력',
                torque: '664Nm',
                acceleration: '6.0초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 170kW (DC)',
                efficiency: '32.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'q8-sportback-e-tron-55-quattro',
          name: 'Q8 Sportback e-tron 55 quattro',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2025 },
          variants: [
            {
              years: ['2024', '2025'],
              batteryCapacity: 114,
              range: 368,
              supplier: 'Samsung SDI',
              specifications: {
                motor: '듀얼 모터',
                power: '408마력',
                torque: '664Nm',
                acceleration: '5.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 170kW (DC)',
                efficiency: '30.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'q8-sportback-e-tron-55-quattro-premium',
          name: 'Q8 Sportback e-tron 55 quattro Premium',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2025 },
          variants: [
            {
              years: ['2024', '2025'],
              batteryCapacity: 114,
              range: 368,
              supplier: 'Samsung SDI',
              specifications: {
                motor: '듀얼 모터',
                power: '408마력',
                torque: '664Nm',
                acceleration: '5.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 170kW (DC)',
                efficiency: '30.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'sq8-sportback-e-tron',
          name: 'SQ8 Sportback e-tron',
          driveType: 'AWD',
          yearRange: { start: 2024, end: 2024 },
          variants: [
            {
              years: ['2024'],
              batteryCapacity: 114,
              range: 303,
              supplier: 'Samsung SDI',
              specifications: {
                motor: '듀얼 모터 (S 퍼포먼스)',
                power: '503마력',
                torque: '973Nm',
                acceleration: '4.5초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 170kW (DC)',
                efficiency: '27.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'q4-e-tron': {
      name: 'Q4 e-tron',
      englishName: 'Q4 e-tron',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FQ4-e-tron%2F2022%2Faudi_q4_e_tron_2022.jpg?alt=media',
      defaultBattery: {
        capacity: 82,
        supplier: 'LG에너지솔루션',
        type: 'NCM',
        voltage: 400,
        range: 368
      },
      trims: [
        {
          trimId: 'q4-e-tron-40',
          name: 'Q4 e-tron 40',
          driveType: 'RWD',
          yearRange: { start: 2022, end: 2024 },
          variants: [
            {
              years: ['2022', '2023', '2024'],
              batteryCapacity: 82,
              range: 368,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '단일 후륜 모터',
                power: '204마력',
                torque: '310Nm',
                acceleration: '8.5초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 125kW (DC)',
                efficiency: '48.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'q4-e-tron-45',
          name: 'Q4 e-tron 45',
          driveType: 'RWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 82,
              range: 406,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '단일 후륜 모터',
                power: '286마력',
                torque: '545Nm',
                acceleration: '6.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 125kW (DC)',
                efficiency: '52.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'q4-sportback-e-tron': {
      name: 'Q4 Sportback e-tron',
      englishName: 'Q4 Sportback e-tron',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FQ4-sportback-e-tron%2F2022%2Faudi_q4_sportback_e_tron_2022.jpg?alt=media',
      defaultBattery: {
        capacity: 82,
        supplier: 'LG에너지솔루션',
        type: 'NCM',
        voltage: 400,
        range: 370
      },
      trims: [
        {
          trimId: 'q4-sportback-e-tron-40',
          name: 'Q4 Sportback e-tron 40',
          driveType: 'RWD',
          yearRange: { start: 2022, end: 2024 },
          variants: [
            {
              years: ['2022', '2023', '2024'],
              batteryCapacity: 82,
              range: 370,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '단일 후륜 모터',
                power: '204마력',
                torque: '310Nm',
                acceleration: '8.5초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 125kW (DC)',
                efficiency: '48.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'q4-sportback-e-tron-45',
          name: 'Q4 Sportback e-tron 45',
          driveType: 'RWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 82,
              range: 406,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '단일 후륜 모터',
                power: '286마력',
                torque: '545Nm',
                acceleration: '6.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 125kW (DC)',
                efficiency: '52.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'q6-e-tron': {
      name: 'Q6 e-tron',
      englishName: 'Q6 e-tron',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FQ6-e-tron%2F2025%2Faudi_q6_e_tron_2025.jpg?alt=media',
      defaultBattery: {
        capacity: 100,
        supplier: 'Samsung SDI',
        type: 'NCM',
        voltage: 800,
        range: 468
      },
      trims: [
        {
          trimId: 'q6-e-tron-basic-quattro-premium',
          name: 'Q6 e-tron 기본 quattro Premium',
          driveType: 'AWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 100,
              range: 400,
              supplier: 'Samsung SDI',
              specifications: {
                motor: '듀얼 모터',
                power: '388마력',
                torque: '855Nm',
                acceleration: '5.9초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '38.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'q6-e-tron-performance',
          name: 'Q6 e-tron Performance',
          driveType: 'RWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 100,
              range: 468,
              supplier: 'Samsung SDI',
              specifications: {
                motor: '단일 후륜 모터',
                power: '306마력',
                torque: '485Nm',
                acceleration: '6.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '43.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'q6-e-tron-performance-premium',
          name: 'Q6 e-tron Performance Premium',
          driveType: 'RWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 100,
              range: 468,
              supplier: 'Samsung SDI',
              specifications: {
                motor: '단일 후륜 모터',
                power: '306마력',
                torque: '485Nm',
                acceleration: '6.7초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '43.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'sq6-e-tron': {
      name: 'SQ6 e-tron',
      englishName: 'SQ6 e-tron',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FSQ6-e-tron%2F2025%2Faudi_sq6_e_tron_2025.jpg?alt=media',
      defaultBattery: {
        capacity: 100,
        supplier: 'CATL',
        type: 'NCM',
        voltage: 800,
        range: 412
      },
      trims: [
        {
          trimId: 'sq6-e-tron-quattro',
          name: 'SQ6 e-tron quattro',
          driveType: 'AWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 100,
              range: 412,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터 (S 퍼포먼스)',
                power: '490마력',
                torque: '855Nm',
                acceleration: '4.4초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '38.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'e-tron-gt': {
      name: 'e-tron GT',
      englishName: 'e-tron GT',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2Fe-tron-GT%2F2021%2Faudi_e_tron_gt_2021.jpg?alt=media',
      defaultBattery: {
        capacity: 93.4,
        supplier: 'LG에너지솔루션',
        type: 'NCM',
        voltage: 800,
        range: 362
      },
      trims: [
        {
          trimId: 'e-tron-gt-quattro',
          name: 'e-tron GT quattro',
          driveType: 'AWD',
          yearRange: { start: 2021, end: 2023 },
          variants: [
            {
              years: ['2021', '2022', '2023'],
              batteryCapacity: 93.4,
              range: 362,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '듀얼 모터',
                power: '530마력',
                torque: '640Nm',
                acceleration: '4.1초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '37.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'rs-e-tron-gt',
          name: 'RS e-tron GT',
          driveType: 'AWD',
          yearRange: { start: 2021, end: 2023 },
          variants: [
            {
              years: ['2021', '2022', '2023'],
              batteryCapacity: 93.4,
              range: 336,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '듀얼 모터 (RS 퍼포먼스)',
                power: '646마력',
                torque: '830Nm',
                acceleration: '3.3초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '34.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    's-e-tron-gt': {
      name: 'S e-tron GT',
      englishName: 'S e-tron GT',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FS-e-tron-GT%2F2025%2Faudi_s_e_tron_gt_2025.jpg?alt=media',
      defaultBattery: {
        capacity: 97,
        supplier: 'LG에너지솔루션',
        type: 'NCM',
        voltage: 800,
        range: 420
      },
      trims: [
        {
          trimId: 's-e-tron-gt-quattro',
          name: 'S e-tron GT quattro',
          driveType: 'AWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 97,
              range: 420,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '듀얼 모터 (S 퍼포먼스)',
                power: '592마력',
                torque: '670Nm',
                acceleration: '3.6초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '37.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'rs-e-tron-gt': {
      name: 'RS e-tron GT',
      englishName: 'RS e-tron GT',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FRS-e-tron-GT%2F2025%2Faudi_rs_e_tron_gt_2025.jpg?alt=media',
      defaultBattery: {
        capacity: 105,
        supplier: 'LG에너지솔루션',
        type: 'NCM',
        voltage: 800,
        range: 387
      },
      trims: [
        {
          trimId: 'rs-e-tron-gt-quattro',
          name: 'RS e-tron GT quattro',
          driveType: 'AWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 105,
              range: 387,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '듀얼 모터 (RS 퍼포먼스)',
                power: '748마력',
                torque: '985Nm',
                acceleration: '2.8초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '37.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'rs-e-tron-gt-performance',
          name: 'RS e-tron GT Performance',
          driveType: 'AWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 105,
              range: 384,
              supplier: 'LG에너지솔루션',
              specifications: {
                motor: '듀얼 모터 (RS 퍼포먼스 Pro)',
                power: '912마력',
                torque: '1005Nm',
                acceleration: '2.5초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 320kW (DC)',
                efficiency: '34.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    'a6-e-tron': {
      name: 'A6 e-tron',
      englishName: 'A6 e-tron',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FA6-e-tron%2F2025%2Faudi_a6_e_tron_2025.jpg?alt=media',
      defaultBattery: {
        capacity: 100,
        supplier: 'CATL',
        type: 'NCM',
        voltage: 800,
        range: 469
      },
      trims: [
        {
          trimId: 'a6-e-tron-performance-advanced',
          name: 'A6 e-tron Performance Advanced',
          driveType: 'RWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 100,
              range: 469,
              supplier: 'CATL',
              specifications: {
                motor: '단일 후륜 모터',
                power: '367마력',
                torque: '565Nm',
                acceleration: '5.4초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '45.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'a6-e-tron-performance-s-line',
          name: 'A6 e-tron Performance S-Line',
          driveType: 'RWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 100,
              range: 469,
              supplier: 'CATL',
              specifications: {
                motor: '단일 후륜 모터',
                power: '367마력',
                torque: '565Nm',
                acceleration: '5.4초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '45.0kWh/100km'
              }
            }
          ]
        },
        {
          trimId: 'a6-e-tron-performance-s-line-black-edition',
          name: 'A6 e-tron Performance S-Line Black Edition',
          driveType: 'RWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 100,
              range: 469,
              supplier: 'CATL',
              specifications: {
                motor: '단일 후륜 모터',
                power: '367마력',
                torque: '565Nm',
                acceleration: '5.4초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '45.0kWh/100km'
              }
            }
          ]
        }
      ]
    },
    's6-e-tron': {
      name: 'S6 e-tron',
      englishName: 'S6 e-tron',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/charzing-d1600.firebasestorage.app/o/vehicle-images%2FAUDI%2FS6-e-tron%2F2025%2Faudi_s6_e_tron_2025.jpg?alt=media',
      defaultBattery: {
        capacity: 100,
        supplier: 'CATL',
        type: 'NCM',
        voltage: 800,
        range: 440
      },
      trims: [
        {
          trimId: 's6-e-tron-quattro',
          name: 'S6 e-tron quattro',
          driveType: 'AWD',
          yearRange: { start: 2025, end: 2025 },
          variants: [
            {
              years: ['2025'],
              batteryCapacity: 100,
              range: 440,
              supplier: 'CATL',
              specifications: {
                motor: '듀얼 모터 (S 퍼포먼스)',
                power: '503마력',
                torque: '855Nm',
                acceleration: '4.1초 (0-100km/h)',
                chargingSpeed: '11kW (AC), 270kW (DC)',
                efficiency: '42.0kWh/100km'
              }
            }
          ]
        }
      ]
    }
  }
};

async function uploadAudiData() {
  console.log('아우디 차량 데이터 업로드 시작...');
  
  try {
    const brandRef = db.collection('vehicles').doc('AUDI');
    
    // 브랜드 문서 생성/업데이트
    await brandRef.set({
      name: audiData.name,
      englishName: audiData.englishName,
      logoUrl: audiData.logoUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ 아우디 브랜드 문서 생성 완료');

    // 모델 업로드
    for (const [modelId, modelData] of Object.entries(audiData.models)) {
      console.log(`\n📝 ${modelData.name} 모델 업로드 중...`);
      
      const modelRef = brandRef.collection('models').doc(modelId);
      
      await modelRef.set({
        name: modelData.name,
        englishName: modelData.englishName,
        imageUrl: modelData.imageUrl,
        defaultBattery: modelData.defaultBattery,
        trims: modelData.trims,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ ${modelData.name} 업로드 완료 (트림 ${modelData.trims.length}개)`);
    }

    console.log('\n🎉 아우디 차량 데이터 업로드 완료!');
    console.log(`총 ${Object.keys(audiData.models).length}개 모델 업로드됨`);
    
  } catch (error) {
    console.error('❌ 아우디 데이터 업로드 중 오류:', error);
  }
}

// 스크립트 실행
uploadAudiData();