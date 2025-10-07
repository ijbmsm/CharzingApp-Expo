# CharzingApp-Expo 개발 히스토리

## 🚗 프로젝트 개요
전기차 배터리 진단 및 관리 앱 (React Native + Expo)

---

## 🔧 최근 구현 사항 (2024-09-22)

### 1. 카카오 지도 통합 및 개선
#### 문제점
- 카카오 지도 SDK 로딩 실패
- WebView에서 지도가 표시되지 않음
- 위치 권한 설정 누락

#### 해결책
```typescript
// src/components/KakaoMapView.tsx - 완전 리팩토링
function KakaoMapView({
  width = 300,
  height = 300,
  latitude = 37.5665,
  longitude = 126.9780,
  zoom = 3,
  onMapClick,
}: KakaoMapViewProps) {
  const KAKAO_MAP_JS_KEY = Constants.expoConfig?.extra?.KAKAO_JAVASCRIPT_KEY;
  
  const htmlContent = `
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_JS_KEY}&libraries=services"></script>
    <script>
      window.onload = function() {
        const map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(${latitude}, ${longitude}),
          level: ${zoom}
        });
        // 마커 및 클릭 이벤트 처리
      }
    </script>
  `;
}
```

#### app.json 권한 설정 추가
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "이 앱은 지도를 표시하고 주변 위치 기반 기능을 위해 현재 위치 접근이 필요합니다."
    }
  },
  "android": {
    "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
  }
}
```

---

### 2. 진단 예약 시스템 완전 구현

#### Firebase 데이터베이스 통합
```typescript
// src/services/firebaseService.ts
export interface DiagnosisReservation {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  address: string;
  detailAddress?: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  requestedDate: Date | FieldValue;
  estimatedDuration: string;
  serviceType: string;
  notes?: string;
  adminNotes?: string;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

class FirebaseService {
  // 진단 예약 생성
  async createDiagnosisReservation(reservationData: Omit<DiagnosisReservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>
  
  // 사용자 예약 목록 조회
  async getUserDiagnosisReservations(userId: string): Promise<DiagnosisReservation[]>
  
  // 예약 상태 업데이트 (관리자용)
  async updateDiagnosisReservationStatus(reservationId: string, status: DiagnosisReservation['status'], adminNotes?: string): Promise<void>
  
  // 예약 취소
  async cancelDiagnosisReservation(reservationId: string, reason?: string): Promise<void>
}
```

#### 진단 예약 화면 업데이트
```typescript
// src/screens/DiagnosisReservationScreen.tsx
const DiagnosisReservationScreen: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const submitReservation = async () => {
    const reservationData = {
      userId: user.uid,
      userName: user.displayName || '사용자',
      address: userAddress,
      detailAddress: detailAddress || '',
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      status: 'pending' as const,
      requestedDate: new Date(),
      estimatedDuration: '약 30분',
      serviceType: '방문 배터리 진단 및 상담',
    };

    const reservationId = await firebaseService.createDiagnosisReservation(reservationData);
    // 예약 완료 처리
  };
};
```

#### 홈 화면 실시간 상태 표시
```typescript
// src/screens/HomeScreen.tsx
export default function HomeScreen() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [latestReservation, setLatestReservation] = useState<DiagnosisReservation | null>(null);
  
  // 상태에 따른 단계 매핑
  const getStepFromStatus = (status: DiagnosisReservation['status']): number => {
    switch (status) {
      case 'pending': return 0; // 접수완료
      case 'confirmed':
      case 'in_progress': return 1; // 예약됨
      case 'completed': return 2; // 완료
      case 'cancelled': return -1; // 취소됨
    }
  };

  const currentStep = latestReservation ? getStepFromStatus(latestReservation.status) : -1;

  // 동적 UI 렌더링
  {!isLoading && !latestReservation && (
    <TouchableOpacity 
      style={styles.reserveButton}
      onPress={() => navigation.navigate('DiagnosisReservation')}
    >
      <Text>진단 예약하기</Text>
    </TouchableOpacity>
  )}
  
  {!isLoading && latestReservation && currentStep >= 0 && (
    <StepIndicator
      currentPosition={currentStep}
      labels={['접수완료', '예약됨', '완료']}
      stepCount={3}
    />
  )}
}
```

---

### 3. 구현된 기능 요약

#### ✅ 완료된 기능들
1. **카카오 지도 WebView 완전 작동**
   - SDK 로딩 최적화
   - 지도 클릭 이벤트 처리
   - 역지오코딩 (좌표→주소 변환)
   - 한국 지역 유효성 검증

2. **진단 예약 전체 플로우**
   - 위치 선택 → 주소 자동 입력
   - Firebase에 예약 데이터 저장
   - 사용자 인증 연동
   - 예약 상태 추적

3. **홈 화면 실시간 상태 표시**
   - 예약 없음: "예약하기" 버튼
   - 예약 있음: 진행 단계 표시
   - 상태별 메시지 표시
   - 자동 새로고침

#### 🎯 사용자 플로우
```
홈 화면 → 예약 상태 확인
    ↓ (예약 없음)
진단 예약하기 버튼 클릭
    ↓
위치 선택 (카카오 지도)
    ↓
주소 자동 변환 및 확인
    ↓
예약하기 → Firebase 저장
    ↓
홈으로 돌아가기
    ↓
실시간 상태 표시 (접수완료 → 예약됨 → 완료)
```

#### 🔧 관리자 기능
- Firebase Console에서 예약 상태 변경
- `pending` → `confirmed` → `in_progress` → `completed`
- 앱에서 실시간 반영

---

### 4. 기술 스택 & 아키텍처

#### Frontend
- **React Native** with **Expo** managed workflow
- **TypeScript** 완전 지원
- **Redux Toolkit** 상태 관리
- **React Navigation** v6

#### Backend & Database
- **Firebase Firestore** 실시간 데이터베이스
- **Firebase Authentication** (카카오 연동)
- **Cloud Functions** (서버리스 백엔드)

#### Maps & Location
- **Kakao Maps JavaScript SDK** (WebView 통합)
- **Expo Location** 위치 서비스
- **카카오 REST API** 지오코딩

#### UI/UX Components
- **react-native-step-indicator** 진행 상태 표시
- **react-native-webview** 지도 렌더링
- **@expo/vector-icons** 아이콘
- Custom 컴포넌트 구조

---

### 5. 파일 구조
```
src/
├── components/
│   ├── KakaoMapView.tsx          # 카카오 지도 WebView 컴포넌트
│   ├── Header.tsx                # 공통 헤더
│   └── AutoSlider.tsx            # 배너 슬라이더
├── screens/
│   ├── HomeScreen.tsx            # 홈 화면 (실시간 상태 표시)
│   └── DiagnosisReservationScreen.tsx  # 진단 예약 화면
├── services/
│   └── firebaseService.ts        # Firebase 서비스 계층
├── store/
│   └── slices/authSlice.ts       # Redux 인증 상태
└── navigation/
    └── RootNavigator.tsx         # 네비게이션 구조
```

---

### 6. 날짜/시간 선택 시스템 완전 구현 (2024-09-22 추가)

#### 새로운 예약 플로우
```
홈 화면 → 진단 예약하기
    ↓
위치 선택 (카카오 지도) → 다음
    ↓
날짜/시간 선택 (캘린더) → 다음
    ↓
예약 확인 → 예약 확정하기
    ↓
홈 화면 (실시간 상태 표시)
```

#### react-native-calendars 통합
```typescript
// src/screens/DateTimeSelectionScreen.tsx
import { Calendar } from 'react-native-calendars';

const DateTimeSelectionScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  
  // 예약 가능한 시간대 생성 (9시-18시)
  const generateTimeSlots = (date: string): TimeSlot[] => {
    const timeSlots: TimeSlot[] = [];
    for (let hour = 9; hour <= 17; hour++) {
      timeSlots.push({
        id: `${date}-${hour}`,
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: !isPast && !isBooked, // 과거 시간 및 예약된 시간 제외
      });
    }
    return timeSlots;
  };
};
```

#### 예약 확인 화면
```typescript
// src/screens/DiagnosisReservationConfirmScreen.tsx
const DiagnosisReservationConfirmScreen: React.FC = () => {
  const handleConfirmReservation = async () => {
    // 선택된 날짜와 시간을 조합하여 requestedDate 생성
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hour] = selectedTime.split(':').map(Number);
    const requestedDateTime = new Date(year, month - 1, day, hour, 0, 0);
    
    const reservationData = {
      // ... 기존 데이터
      requestedDate: requestedDateTime, // 정확한 예약 시간
    };
    
    await firebaseService.createDiagnosisReservation(reservationData);
  };
};
```

#### 네비게이션 구조 업데이트
```typescript
// RootStackParamList 타입 확장
export type RootStackParamList = {
  DateTimeSelection: {
    userLocation: { latitude: number; longitude: number };
    userAddress: string;
    detailAddress?: string;
  };
  DiagnosisReservationConfirm: {
    userLocation: { latitude: number; longitude: number };
    userAddress: string;
    detailAddress?: string;
    selectedDate: string;
    selectedTime: string;
  };
};
```

#### 구현된 새로운 기능들
1. **Calendar 컴포넌트 통합**
   - 30일 앞까지 예약 가능
   - 과거 날짜 선택 불가
   - 한국식 날짜 표시 (2024년 9월 22일 (일))

2. **시간대 선택 시스템**
   - 9시-18시 (1시간 단위)
   - 과거 시간 자동 비활성화
   - 랜덤 예약 불가 시간 시뮬레이션

3. **3단계 예약 플로우**
   - 1단계: 위치 선택
   - 2단계: 날짜/시간 선택
   - 3단계: 예약 확인 및 완료

### 7. 다음 개발 예정 사항

#### 🚧 개선 가능한 부분
1. **시간대 실시간 관리**
   - Firebase에서 예약된 시간 실시간 조회
   - 관리자가 운영시간 설정 가능

2. **PDF 리포트 시스템**
   - 이메일로 받은 PDF를 앱으로 import
   - `expo-document-picker` 활용

3. **관리자 대시보드**
   - 예약 관리 화면
   - 상태 변경 인터페이스

4. **푸시 알림**
   - 예약 상태 변경 시 알림
   - Firebase Cloud Messaging

5. **예약 상세 관리**
   - 예약 취소 기능
   - 예약 일정 변경

---

### 8. 명령어 모음

#### 개발 서버 실행
```bash
npx expo start --clear
npx expo run:ios
```

#### 타입 체크
```bash
npx tsc --noEmit
```

#### 빌드
```bash
npx expo build:ios
npx expo build:android
```

---

### 9. 트러블슈팅 가이드

#### 카카오 지도 안 보일 때
1. `app.json`에서 `KAKAO_JAVASCRIPT_KEY` 확인
2. iOS 시뮬레이터 위치를 서울로 설정
3. WebView 콘솔 로그 확인

#### Firebase 연결 안 될 때
1. `src/firebase/config.ts` 설정 확인
2. Firebase Console에서 프로젝트 상태 확인
3. 인증 상태 Redux store에서 확인

#### 위치 권한 문제
1. iOS: `Info.plist`에서 `NSLocationWhenInUseUsageDescription` 확인
2. Android: `permissions` 배열 확인
3. 에뮬레이터/시뮬레이터 위치 설정 확인

---

### 10. 성과 및 배운 점

#### 🎉 성공적인 구현
- **복잡한 WebView 통합**: 카카오 지도 JavaScript SDK를 React Native에서 완전히 활용
- **실시간 데이터 동기화**: Firebase와 Redux를 통한 상태 관리
- **사용자 경험 최적화**: 로딩 상태, 에러 처리, 직관적인 UI
- **완전한 예약 플로우**: 3단계 예약 시스템 (위치 → 날짜/시간 → 확인)

#### 💡 기술적 학습
- WebView와 React Native 간 메시지 통신
- Firebase Firestore 실시간 업데이트
- TypeScript 고급 타입 활용
- 지도 API 통합 및 지오코딩
- react-native-calendars 라이브러리 활용
- 복잡한 네비게이션 파라미터 타입 관리

#### 🛠 아키텍처 개선
- 서비스 계층 분리로 코드 재사용성 향상
- 컴포넌트 재사용성을 고려한 props 설계
- 상태 관리의 체계적 구조화

---

*마지막 업데이트: 2024-09-22*
*작성자: Claude (Anthropic AI)*