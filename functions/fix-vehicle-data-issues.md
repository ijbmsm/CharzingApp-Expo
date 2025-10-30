# 차량 데이터 조회 문제 해결 방안

## 🔍 문제점 요약

1. **Firebase Storage 이미지 접근 불가**: Storage bucket 설정 오류
2. **데이터 소스 불일치**: Mobile app은 Firebase Functions, Web app은 정적 데이터 사용
3. **데이터 형식 변환 문제**: Firebase 데이터와 앱 기대 형식 불일치

## 🛠 해결 방안

### 1. Firebase Storage 설정 수정

**파일**: `src/firebase/config.ts`
```typescript
// 현재 설정에 storageBucket 추가
const firebaseConfig = {
  // ... 기존 설정
  storageBucket: "charzing-d1600.appspot.com" // 추가 필요
};
```

### 2. 이미지 URL 생성 로직 수정

**파일**: `src/components/VehicleSearchModal.tsx:27-65`
```typescript
const getVehicleImage = async (brandId: string, modelId: string): Promise<string | null> => {
  try {
    const { firebaseService } = await import('../services/firebaseService');
    const storage = firebaseService.getStorage();
    
    // 이미지 경로 패턴: vehicles/{brandId}/{modelId}/main.jpg
    const imagePath = `vehicles/${brandId}/${modelId}/main.jpg`;
    const imageRef = storage.ref(imagePath);
    
    const downloadURL = await imageRef.getDownloadURL();
    return downloadURL;
  } catch (error) {
    console.log(`차량 이미지를 찾을 수 없음: ${brandId}/${modelId}`, error);
    
    // 대체 이미지 경로들 시도
    const fallbackPaths = [
      `vehicles/${brandId}/${modelId}/default.jpg`,
      `vehicles/${brandId}/default.jpg`,
      `vehicles/default.jpg`
    ];
    
    for (const fallbackPath of fallbackPaths) {
      try {
        const fallbackRef = storage.ref(fallbackPath);
        const fallbackURL = await fallbackRef.getDownloadURL();
        return fallbackURL;
      } catch (fallbackError) {
        continue;
      }
    }
    
    return null; // 모든 이미지를 찾을 수 없는 경우
  }
};
```

### 3. 데이터 형식 통일화

**파일**: `src/components/VehicleSearchModal.tsx:173-261`

현재 Firebase Function 응답을 정적 데이터 형식으로 변환하는 로직 개선:

```typescript
const generateHierarchicalVehicleDataFromFirebase = async () => {
  // ... 기존 코드 ...
  
  // 데이터 형식 변환 개선
  const transformTrimData = (firebaseTrim: any) => {
    return {
      id: firebaseTrim.id,
      trimName: firebaseTrim.trimName,
      year: firebaseTrim.year,
      // 배터리 용량을 숫자로 변환
      batteryCapacity: parseFloat(firebaseTrim.batteryCapacity?.replace('kWh', '') || '0'),
      // 주행거리를 숫자로 변환
      range: parseInt(firebaseTrim.range || '0'),
      powerType: 'BEV',
      drivetrain: firebaseTrim.drivetrain,
      // 추가 세부 정보
      battery: {
        capacity: firebaseTrim.batteryCapacity,
        manufacturers: firebaseTrim.battery?.manufacturers || [],
        cellType: firebaseTrim.battery?.cellType || 'Unknown',
        warranty: firebaseTrim.battery?.warranty || 'N/A'
      },
      specs: {
        range: firebaseTrim.range,
        powerMax: firebaseTrim.specs?.powerMax || 'N/A',
        torqueMax: firebaseTrim.specs?.torqueMax || 'N/A',
        acceleration: firebaseTrim.specs?.acceleration || 'N/A',
        topSpeed: firebaseTrim.specs?.topSpeed || 'N/A',
        efficiency: firebaseTrim.specs?.efficiency || 'N/A'
      }
    };
  };
};
```

### 4. 정적 데이터와 Firebase 데이터 통합

**새 파일**: `src/services/vehicleDataService.ts`
```typescript
export class VehicleDataService {
  private static instance: VehicleDataService;
  private useFirebase: boolean = true;

  static getInstance(): VehicleDataService {
    if (!VehicleDataService.instance) {
      VehicleDataService.instance = new VehicleDataService();
    }
    return VehicleDataService.instance;
  }

  // Firebase와 정적 데이터를 통합하여 제공
  async getVehicleBatteryHistory(brandId: string, modelId: string, variant?: string) {
    if (this.useFirebase) {
      try {
        // Firebase Functions 사용
        const { firebaseService } = await import('./firebaseService');
        const firebaseData = await firebaseService.getVehicleTrims(brandId, modelId);
        
        if (firebaseData.success && firebaseData.trims.length > 0) {
          return this.transformFirebaseToStaticFormat(firebaseData.trims);
        }
      } catch (error) {
        console.warn('Firebase 데이터 조회 실패, 정적 데이터로 fallback:', error);
      }
    }
    
    // 정적 데이터 fallback
    return getVehicleBatteryHistory(brandId, modelId, variant);
  }

  private transformFirebaseToStaticFormat(firebaseTrims: any[]) {
    // Firebase 데이터를 정적 데이터 형식으로 변환
    return firebaseTrims.map(trim => ({
      year: trim.year,
      batteryCapacity: parseFloat(trim.batteryCapacity?.replace('kWh', '') || '0'),
      range: parseInt(trim.range || '0'),
      variant: trim.trimName,
      powerType: 'BEV',
      drivetrain: trim.drivetrain,
      // 추가 Firebase 데이터
      manufacturers: trim.battery?.manufacturers || [],
      cellType: trim.battery?.cellType,
      warranty: trim.battery?.warranty,
      specs: trim.specs
    }));
  }
}
```

### 5. BatteryInfoScreen 업데이트

**파일**: `src/screens/BatteryInfoScreen.tsx`
```typescript
// 정적 데이터 대신 통합 서비스 사용
import { VehicleDataService } from '../services/vehicleDataService';

const BatteryInfoScreen = () => {
  // ... 기존 코드 ...
  
  useEffect(() => {
    const loadVehicleData = async () => {
      if (selectedBrand && selectedModel) {
        const vehicleService = VehicleDataService.getInstance();
        const batteryHistory = await vehicleService.getVehicleBatteryHistory(
          selectedBrand, 
          selectedModel, 
          selectedVariant
        );
        setBatteryHistory(batteryHistory);
      }
    };
    
    loadVehicleData();
  }, [selectedBrand, selectedModel, selectedVariant]);
};
```

### 6. 웹 프로젝트 통합

**파일**: `/Users/sungmin/Desktop/project/react/charzing/src/app/vehicle-info/page.tsx`
```typescript
// Firebase 통합을 위한 새로운 서비스 추가
import { VehicleDataService } from '../services/vehicleDataService';

export default function VehicleInfoPage() {
  // ... 기존 코드 ...
  
  useEffect(() => {
    const loadVehicleData = async () => {
      if (selectedBrand && selectedModel) {
        const vehicleService = VehicleDataService.getInstance();
        const batteryHistory = await vehicleService.getVehicleBatteryHistory(
          selectedBrand, 
          selectedModel, 
          selectedVariant
        );
        setBatteryHistory(batteryHistory);
      }
    };
    
    loadVehicleData();
  }, [selectedBrand, selectedModel, selectedVariant]);
}
```

## 🚀 구현 순서

1. **Firebase Storage 설정 수정** - Firebase config에 storageBucket 추가
2. **이미지 URL 생성 로직 개선** - 다중 fallback 경로 지원
3. **통합 서비스 구현** - VehicleDataService 클래스 생성
4. **Firebase 데이터 형식 변환** - 정적 데이터 형식으로 통일
5. **앱별 통합 적용** - Mobile app과 Web app에 통합 서비스 적용
6. **테스트 및 검증** - 실제 데이터 조회 동작 확인

## 📋 예상 효과

- ✅ Firebase Storage 이미지 정상 로드
- ✅ Mobile과 Web 앱 간 데이터 일관성 확보  
- ✅ Firebase 장애 시 정적 데이터로 자동 fallback
- ✅ 데이터 형식 통일로 코드 복잡성 감소
- ✅ 새로운 차량 데이터 추가 시 Firebase만 업데이트하면 모든 앱에 반영