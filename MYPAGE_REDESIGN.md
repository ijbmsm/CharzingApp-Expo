# MyPage 리디자인 계획서

**목표**: charzing 웹 프로젝트의 마이페이지 디자인을 CharzingApp-Expo에 동일하게 적용

---

## 📊 웹 프로젝트 분석 (charzing)

### 1. 마이페이지 구조
**파일**: `/Users/sungmin/Desktop/project/react/charzing/src/app/mypage/page.tsx`

#### 레이아웃 (웹 - PC 환경)
- **뒤로가기 버튼**: 홈으로 이동
- **사용자 이름**: 큰 타이틀로 표시
- **2컬럼 레이아웃** (데스크톱 전용)
  - 왼쪽: 회원정보 + 로그아웃 + 친구 초대
  - 오른쪽: 내 예약, 내 리포트, 내 쿠폰
- **1컬럼 레이아웃** (웹 모바일 뷰)
  - 모든 카드가 세로로 나열

#### ⚠️ 모바일 앱 차이점
**CharzingApp-Expo는 모바일 전용이므로:**
- ✅ **무조건 1컬럼 레이아웃**만 사용
- ✅ **모바일 특화 메뉴 추가 필요**:
  - 설정 (Settings)
  - 알림 설정 (현재 Settings 내부)
- ✅ **관리자/진단사 메뉴 유지**:
  - 예약 관리 (ReservationsManagement)
  - 차량 점검 (VehicleInspection)

#### 왼쪽 컬럼 (회원정보 섹션)

##### 1) 회원정보 카드
- **디자인**: 흰색 카드, 둥근 모서리 (rounded-2xl)
- **내용**:
  - 이메일
  - 전화번호 (있는 경우만)
  - 로그인 방식 (배지 형태)
- **프로필 수정 버튼**: 카드 하단에 border-top으로 구분

##### 2) 로그아웃 버튼
- **독립 카드**: 회원정보와 별도 카드
- **스타일**: 흰색 카드, 오른쪽 화살표 아이콘
- **동작**: 로그아웃 확인 모달 표시

##### 3) 친구 초대 카드
- **조건**: `profile.referralCode`가 있는 경우만 표시
- **스타일**: 그라데이션 배경 (cyan-50 to blue-50)
- **구성 요소**:
  - 아이콘 (선물 상자)
  - 제목: "친구에게 할인 쿠폰 선물하기"
  - 설명: "내 추천 코드로 가입하면 친구가 10,000원 할인을 받아요!"
  - 추천 코드 표시 (폰트: monospace, 볼드)
  - 복사 버튼 (복사 시 "완료!" 표시)

##### 4) 회원탈퇴 링크
- **위치**:
  - PC: 왼쪽 컬럼 하단
  - 모바일: 전체 페이지 하단
- **스타일**: 작은 텍스트, underline

#### 오른쪽 컬럼 (메뉴 섹션)

##### 메뉴 카드 (3개)
1. **내 예약**
   - 아이콘: 캘린더
   - 경로: `/mypage/reservations`

2. **내 리포트**
   - 아이콘: 문서
   - 경로: `/mypage/reports`

3. **내 쿠폰**
   - 아이콘: 티켓
   - 경로: `/mypage/coupons`

각 메뉴는:
- 아이콘 (40x40, 회색 원형 배경)
- 제목 (font-semibold)
- 설명 (작은 텍스트)
- 오른쪽 화살표

---

### 2. 추천인 코드 시스템

#### 데이터 구조
```typescript
interface UserProfile {
  referralCode?: string; // CHZ-XXXX 형식
}
```

#### 기능
- **코드 복사**: `navigator.clipboard.writeText()`
- **복사 완료 표시**: 2초 후 자동 복구

#### 생성 로직
- **Functions**: `/functions/src/utils/referralCode.ts`
- **형식**: `CHZ-{4~6자리}`
- **문자셋**: A-Z(I,O 제외), 1-9(0 제외)
- **중복 체크**: users 및 referralCodes 컬렉션

---

### 3. 쿠폰 시스템

#### Firestore 컬렉션
1. **coupons**: 쿠폰 마스터 데이터
2. **userCoupons**: 사용자별 발급된 쿠폰

#### 쿠폰 페이지
**파일**: `/Users/sungmin/Desktop/project/react/charzing/src/app/mypage/coupons/page.tsx`

##### 탭 구성
- **사용 가능** (active)
- **사용 완료** (used)
- **만료됨** (expired)

##### 쿠폰 카드 디자인
- 할인 금액 (큰 텍스트, cyan 색상)
- 쿠폰 이름
- 발급 사유 배지 (친구 추천, 이벤트 등)
- 설명
- 최소 주문 금액 표시 (있는 경우)
- 유효기간 / 사용일 / 만료일
- 사용하기 버튼 (active만)

---

## 📱 CharzingApp-Expo 현재 상태

### 현재 마이페이지
**파일**: `/src/screens/MyPageScreen.tsx`

#### 구조
- **프로필 카드**: 아바타 + 사용자 정보
- **3열 그리드**: 설정, 내 예약, 로그아웃 등

#### 문제점
1. 친구 초대 기능 없음
2. 내 쿠폰 메뉴 없음
3. 회원탈퇴 링크 없음
4. 디자인이 웹과 다름 (아바타 중심)

---

## 🎯 구현 계획

### Phase 1: 타입 추가

#### 1.1 UserProfile 타입 업데이트
**파일**: `/src/services/firebaseService.ts`

```typescript
export interface UserProfile {
  // ... 기존 필드
  referralCode?: string; // ✅ 추가
}
```

#### 1.2 UserCoupon 타입 생성
**파일**: `/src/types/coupon.ts` (새 파일)

```typescript
import { Timestamp } from 'firebase/firestore';

export interface UserCoupon {
  id: string;
  userId: string;
  couponId: string;
  couponName: string;
  couponDescription: string;
  discountType: 'fixed' | 'percentage';
  discountAmount?: number;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  issueReason: 'referral' | 'event' | 'compensation' | 'admin';
  referralCode?: string;
  status: 'active' | 'used' | 'expired';
  issuedAt: Timestamp;
  expiresAt: Timestamp;
  usedAt?: Timestamp;
  usedInReservationId?: string;
  usedInPaymentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### Phase 2: MyPageScreen 리디자인 (모바일 앱용 1컬럼)

#### 2.1 전체 레이아웃
- **무조건 1컬럼** (세로 스크롤)
- 기존 프로필 카드 제거 (아바타 제거)
- 사용자 이름을 상단 타이틀로 표시

#### 2.2 카드 순서 (위에서 아래로)

##### 1) 회원정보 카드
- **디자인**: 흰색 카드, `borderRadius: 16`
- **내용**:
  - 이메일
  - 전화번호 (있는 경우만)
  - 로그인 방식 (배지)
- **프로필 수정 버튼**: 카드 하단 (border-top 구분)

##### 2) 로그아웃 버튼 카드 (독립)
- **디자인**: 흰색 카드, 오른쪽 화살표
- **동작**: 로그아웃 확인 모달

##### 3) 친구 초대 카드 (조건부)
- **조건**: `profile.referralCode` 있을 때만
- **디자인**: 그라데이션 배경 (`#E0F2FE` → `#DBEAFE`)
- **기능**:
  - 추천 코드 표시
  - 복사 버튼 (`Clipboard.setStringAsync()`)
  - 복사 완료 시 "완료!" 표시 (2초)

##### 4) 메뉴 섹션 (흰색 카드 그룹)

**일반 사용자 메뉴**:
1. **설정** → `/Settings`
   - 아이콘: settings (Ionicons)
   - 설명: "앱 관리"

2. **내 예약** → `/MyReservations`
   - 아이콘: calendar
   - 설명: "예약 내역 확인"

3. **내 리포트** → `/DiagnosisReportList`
   - 아이콘: document-text
   - 설명: "진단 리포트 확인"

4. **내 쿠폰** → `/MyCoupons` (새 화면)
   - 아이콘: ticket
   - 설명: "보유 쿠폰 확인"

**관리자/진단사 전용 메뉴** (role === 'admin' || role === 'mechanic'):
5. **예약 관리** → `/ReservationsManagement`
   - 아이콘: calendar (cyan 색상)
   - 설명: "대기 중 · 내 담당"

6. **차량 점검** → `/VehicleInspection`
   - 아이콘: car-sport (cyan 색상)
   - 설명: "현장 점검 기록"

##### 5) 회원탈퇴 링크
- **위치**: 전체 페이지 최하단
- **스타일**: 작은 텍스트, underline, 회색

---

### Phase 3: 내 쿠폰 화면 구현

#### 3.1 새 화면 생성
**파일**: `/src/screens/MyCouponsScreen.tsx`

#### 3.2 기능
- 3개 탭: 사용 가능, 사용 완료, 만료됨
- Firestore 쿼리:
  - `userCoupons` 컬렉션
  - `where('userId', '==', user.uid)`
  - 탭별 필터링

#### 3.3 쿠폰 카드 디자인
- 웹과 동일한 디자인 (React Native 스타일로 변환)

---

### Phase 4: 네비게이션 설정

#### 4.1 RootNavigator 업데이트
**파일**: `/src/navigation/RootNavigator.tsx`

```typescript
export type RootStackParamList = {
  // ... 기존 화면들
  MyCoupons: undefined; // ✅ 추가
};
```

---

### Phase 5: Firebase Service 업데이트

#### 5.1 쿠폰 조회 함수 추가
**파일**: `/src/services/firebaseService.ts`

```typescript
/**
 * 사용자 쿠폰 조회
 */
async getUserCoupons(
  userId: string,
  status?: 'active' | 'used' | 'expired'
): Promise<UserCoupon[]> {
  // Firestore 쿼리 구현
}
```

---

## 📋 상세 TODO 리스트

### ✅ 준비 작업
- [x] 웹 프로젝트 마이페이지 분석
- [x] 추천인 코드 시스템 분석
- [x] 쿠폰 시스템 분석
- [x] 구현 계획 수립

### 🔲 Phase 1: 타입 추가
- [ ] UserProfile에 referralCode 추가
- [ ] /src/types/coupon.ts 생성
- [ ] UserCoupon 타입 정의
- [ ] RootStackParamList에 MyCoupons 추가

### 🔲 Phase 2: MyPageScreen 리디자인 (1컬럼 레이아웃)
- [ ] 기존 프로필 카드 제거 (아바타 제거)
- [ ] 사용자 이름 타이틀 추가
- [ ] 회원정보 카드 구현 (이메일, 전화번호, 로그인 방식)
- [ ] 프로필 수정 버튼을 회원정보 카드 하단에 배치
- [ ] 로그아웃 버튼을 독립 카드로 분리
- [ ] 친구 초대 카드 구현 (그라데이션 배경, 조건부 렌더링)
- [ ] 추천 코드 복사 기능 구현 (`Clipboard.setStringAsync()`)
- [ ] 메뉴 섹션 구현 (웹 스타일로 변경)
  - [ ] 설정 카드 (아이콘 + 제목 + 설명)
  - [ ] 내 예약 카드
  - [ ] 내 리포트 카드
  - [ ] 내 쿠폰 카드 (새로 추가)
  - [ ] 예약 관리 카드 (관리자/진단사만)
  - [ ] 차량 점검 카드 (관리자/진단사만)
- [ ] 회원탈퇴 링크 추가 (페이지 하단)

### 🔲 Phase 3: 내 쿠폰 화면 구현
- [ ] /src/screens/MyCouponsScreen.tsx 생성
- [ ] 3개 탭 구현 (사용 가능, 사용 완료, 만료됨)
- [ ] Firestore 쿠폰 조회 로직 구현
- [ ] 쿠폰 카드 컴포넌트 구현
- [ ] 빈 상태 UI 구현
- [ ] 사용하기 버튼 연결

### 🔲 Phase 4: Firebase Service 업데이트
- [ ] getUserCoupons() 함수 추가
- [ ] 쿠폰 상태별 쿼리 로직 구현
- [ ] 에러 핸들링 추가

### 🔲 Phase 5: 최종 검증
- [ ] TypeScript 타입 체크 (`npx tsc --noEmit`)
- [ ] 모든 화면 테스트
- [ ] 로그인/로그아웃 플로우 테스트
- [ ] 추천 코드 복사 기능 테스트
- [ ] 쿠폰 조회 테스트

---

## 🎨 디자인 가이드

### 색상
- **Primary**: `#06B6D4` (Cyan)
- **Background**: `#F9FAFB` (Gray-50)
- **Card**: `#FFFFFF`
- **Text Primary**: `#1F2937` (Gray-900)
- **Text Secondary**: `#6B7280` (Gray-600)

### 스타일
- **카드 둥근 모서리**: `borderRadius: 16`
- **카드 여백**: `padding: 20`
- **카드 간격**: `marginBottom: 16`
- **그림자**: `shadowOpacity: 0.1`, `elevation: 5`

### 아이콘 크기
- **메뉴 아이콘**: 24x24
- **작은 아이콘**: 16x16

---

## 🚨 주의사항

1. **any 타입 사용 금지**: 모든 타입을 명확히 정의
2. **우회 금지**: 웹과 정확히 동일한 로직 구현
3. **코드 전부 고쳐쓰기 금지**: 기존 코드 최대한 재사용
4. **지레짐작 금지**: 모든 기능을 실제로 구현하고 테스트

---

## 📝 참고 파일

### 웹 프로젝트
- `/Users/sungmin/Desktop/project/react/charzing/src/app/mypage/page.tsx`
- `/Users/sungmin/Desktop/project/react/charzing/src/app/mypage/coupons/page.tsx`
- `/Users/sungmin/Desktop/project/react/charzing/src/types/coupon.ts`
- `/Users/sungmin/Desktop/project/react/charzing/src/lib/authService.ts`

### 앱 프로젝트
- `/Users/sungmin/CharzingApp-Expo/src/screens/MyPageScreen.tsx`
- `/Users/sungmin/CharzingApp-Expo/src/services/firebaseService.ts`
- `/Users/sungmin/CharzingApp-Expo/functions/src/types/coupon.types.ts`
- `/Users/sungmin/CharzingApp-Expo/functions/src/utils/referralCode.ts`

---

**작성일**: 2025-12-22
**작성자**: Claude Code
