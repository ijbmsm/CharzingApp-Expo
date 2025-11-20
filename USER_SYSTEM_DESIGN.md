# 회원/비회원 통합 시스템 설계 (User Management System)

> **작성일**: 2024-11-19
> **버전**: 1.0
> **목적**: 회원/비회원 모두 단일 시스템으로 통합 관리하며, 나중에 비회원→회원 전환 시 자동 연결

---

## 📋 목차

1. [핵심 원칙](#핵심-원칙)
2. [사용자 식별 체계](#사용자-식별-체계)
3. [데이터 구조](#데이터-구조)
4. [플로우 다이어그램](#플로우-다이어그램)
5. [구현 상세](#구현-상세)
6. [마이그레이션 로직](#마이그레이션-로직)
7. [관리자 기능](#관리자-기능)

---

## 🎯 핵심 원칙

### 1. 식별자는 **UID** (회원/비회원 모두)

```typescript
✅ 회원:    uid = Firebase Auth UID        // "abc123def456..."
✅ 비회원:  uid = `guest_${uuid.v4()}`    // "guest_2f9a3b1e-8f9c-4a8c..."
```

**이유**:
- 전화번호는 변경 가능 → 식별자로 부적합
- UUID는 절대 충돌 없음 → 안정성 최고
- 회원/비회원 구분 명확 (`guest_` 접두사)

### 2. 전화번호는 **연결키(linkKey)**로만 사용

```typescript
{
  uid: "guest_2f9a3b1e-...",  // 식별자
  phoneNumber: "01012345678",  // 연결키 (검색용)
  userType: "guest"
}
```

**이유**:
- 전화번호로 guest 계정 검색 가능
- 회원가입 시 자동 매칭 가능
- 전화번호 변경해도 uid는 그대로

### 3. 회원가입 시 **자동 연결**

```
비회원 예약 (guest_xxx) → 전화번호 저장
    ↓
회원가입 (Firebase Auth)
    ↓
전화번호 매칭 → guest 데이터 자동 이전
```

---

## 🆔 사용자 식별 체계

### 회원 (Registered User)

| 필드 | 값 | 설명 |
|------|-----|------|
| `uid` | Firebase Auth UID | `"abc123def456..."` |
| `userType` | `"registered"` | 회원 유형 |
| `phoneNumber` | `"01012345678"` | 전화번호 (선택) |
| `email` | `"user@example.com"` | 이메일 |
| `provider` | `"kakao"` / `"google"` / `"apple"` | 로그인 제공자 |
| `displayName` | `"홍길동"` | 이름 |
| `isRegistrationComplete` | `true` | 회원가입 완료 여부 |

**생성 시점**:
- 카카오/Google/Apple 로그인 시
- Firebase Authentication 자동 생성

### 비회원 (Guest User)

| 필드 | 값 | 설명 |
|------|-----|------|
| `uid` | `guest_${uuid.v4()}` | `"guest_2f9a3b1e-8f9c..."` |
| `userType` | `"guest"` | 비회원 유형 |
| `phoneNumber` | `"01012345678"` | 전화번호 (필수) |
| `displayName` | `"김영희"` | 이름 (필수) |
| `createdAt` | Timestamp | 생성 시간 |
| `active` | `true` | 활성 여부 (매칭 후 false) |
| `mergedInto` | `null` | 회원 전환 시 실제 uid |

**생성 시점**:
- 정비사가 진단 리포트 작성 시 수동 입력
- 예약 없이 직접 입력

---

## 📊 데이터 구조

### Firestore Collections

#### 1. `users/{uid}`

```typescript
// 회원 문서
{
  uid: "abc123def456",
  userType: "registered",
  email: "user@example.com",
  displayName: "홍길동",
  phoneNumber: "01012345678",
  provider: "kakao",
  isRegistrationComplete: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// 비회원 문서
{
  uid: "guest_2f9a3b1e-8f9c-4a8c-9fa2-123abc",
  userType: "guest",
  displayName: "김영희",
  phoneNumber: "01012345678",
  createdAt: Timestamp,
  active: true,        // 매칭 전: true, 매칭 후: false
  mergedInto: null     // 매칭 후: 실제 회원 uid
}
```

#### 2. `diagnosisReservations/{reservationId}`

```typescript
{
  reservationId: "res_123",
  userId: "guest_2f9a3b1e-...",  // guest uid 또는 회원 uid
  userName: "김영희",
  userPhone: "01012345678",
  // ... 예약 정보
  linkedFrom?: "guest_xxx"  // 매칭 후 원본 guest uid
}
```

#### 3. `vehicleDiagnosisReports/{reportId}`

```typescript
{
  reportId: "report_123",
  userId: "guest_2f9a3b1e-...",  // guest uid 또는 회원 uid
  userName: "김영희",
  userPhone: "01012345678",
  isGuest: true,  // userId가 guest_로 시작하면 true
  // ... 리포트 정보
  linkedFrom?: "guest_xxx"  // 매칭 후 원본 guest uid
}
```

---

## 🔄 플로우 다이어그램

### Flow 1: 비회원 리포트 작성

```
정비사 앱
    ↓
[수동 입력] 버튼 클릭
    ↓
이름 + 전화번호 입력
    ↓
UUID 생성: guest_${uuid.v4()}
    ↓
Firestore users 컬렉션에 저장:
{
  uid: "guest_2f9a3b1e-...",
  userType: "guest",
  displayName: "김영희",
  phoneNumber: "01012345678",
  active: true
}
    ↓
진단 리포트 작성
    ↓
Firestore 저장:
{
  userId: "guest_2f9a3b1e-...",
  userName: "김영희",
  userPhone: "01012345678",
  isGuest: true
}
```

### Flow 2: 비회원 → 회원 자동 전환

```
비회원 사용자가 앱 설치
    ↓
카카오/Google 로그인
    ↓
Firebase Auth 회원 생성
uid: "abc123def456"
    ↓
[Firebase Function 트리거]
onUserCreate() 실행
    ↓
전화번호 확인: "01012345678"
    ↓
Firestore 검색:
WHERE phoneNumber == "01012345678"
AND userType == "guest"
AND active == true
    ↓
guest 계정 발견!
uid: "guest_2f9a3b1e-..."
    ↓
[데이터 마이그레이션 시작]
    ↓
1. 예약 이전:
   UPDATE diagnosisReservations
   SET userId = "abc123def456",
       linkedFrom = "guest_2f9a3b1e-..."
   WHERE userId = "guest_2f9a3b1e-..."
    ↓
2. 리포트 이전:
   UPDATE vehicleDiagnosisReports
   SET userId = "abc123def456",
       linkedFrom = "guest_2f9a3b1e-...",
       isGuest = false
   WHERE userId = "guest_2f9a3b1e-..."
    ↓
3. 알림 이전:
   UPDATE inAppNotifications
   (users/{uid}/inAppNotifications)
    ↓
4. guest 계정 비활성화:
   UPDATE users/guest_2f9a3b1e-...
   SET active = false,
       mergedInto = "abc123def456",
       mergedAt = Timestamp
    ↓
[완료] 사용자는 자동으로 모든 기록 접근 가능
```

### Flow 3: 충돌 처리 (여러 guest 계정)

```
전화번호 "01012345678"로 검색
    ↓
발견된 guest 계정: 3개
- guest_aaa (2024-01-15)
- guest_bbb (2024-03-20)
- guest_ccc (2024-06-10)
    ↓
[옵션 1] 자동 연결 (모두)
→ 모든 guest 데이터 이전
    ↓
[옵션 2] 사용자 확인 팝업
→ "3개의 진단 기록 발견, 연결하시겠습니까?"
   [모두 연결] [선택 연결] [나중에]
    ↓
[옵션 3] 관리자 수동 매칭
→ 관리자 웹에서 확인 후 연결
```

---

## 💻 구현 상세

### 1. 앱: 비회원 입력 (VehicleInspection/index.tsx)

```typescript
import uuid from 'react-native-uuid';

const handleConfirmUserInfo = async () => {
  // 입력 검증
  if (!manualUserName.trim() || !manualUserPhone.trim()) {
    Alert.alert('입력 오류', '이름과 전화번호를 모두 입력해주세요.');
    return;
  }

  setIsUserInfoModalVisible(false);

  // 🔥 UUID 기반 guest ID 생성
  const guestUid = `guest_${uuid.v4()}`;
  const cleanPhone = manualUserPhone.replace(/[^0-9]/g, ''); // 010-1234-5678 → 01012345678

  // 🔥 Firestore에 guest 계정 생성
  await firebaseService.createGuestUser({
    uid: guestUid,
    userType: 'guest',
    displayName: manualUserName,
    phoneNumber: cleanPhone,
    active: true,
  });

  // 임시 사용자 설정 (AutoSave용)
  const tempUser = {
    uid: guestUid,
    displayName: manualUserName,
    phoneNumber: cleanPhone,
  };
  setSelectedUser(tempUser);

  // Draft 확인 및 불러오기 (기존 로직)
  const userDraft = await draftStorage.loadDraft(guestUid);
  // ... (나머지 동일)
};
```

### 2. Firebase Service: Guest 계정 생성

```typescript
// firebaseService.ts
async createGuestUser(guestData: {
  uid: string;
  userType: 'guest';
  displayName: string;
  phoneNumber: string;
  active: boolean;
}): Promise<void> {
  try {
    const userRef = doc(this.db, 'users', guestData.uid);

    await setDoc(userRef, {
      ...guestData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    devLog.log('✅ Guest 계정 생성 완료:', guestData.uid);
  } catch (error) {
    devLog.error('❌ Guest 계정 생성 실패:', error);
    throw error;
  }
}
```

### 3. Firebase Functions: 자동 매칭

```typescript
// functions/src/index.ts
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

/**
 * 회원가입 시 guest 계정 자동 매칭
 */
export const autoLinkGuestAccounts = functions
  .region('us-central1')
  .auth.user()
  .onCreate(async (user) => {
    try {
      const phoneNumber = user.phoneNumber;

      // 전화번호 없으면 스킵
      if (!phoneNumber) {
        console.log('전화번호 없음, 자동 매칭 스킵');
        return;
      }

      // 전화번호 정제
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

      console.log(`🔍 전화번호로 guest 계정 검색: ${cleanPhone}`);

      // 1️⃣ guest 계정 검색
      const guestSnapshot = await admin.firestore()
        .collection('users')
        .where('phoneNumber', '==', cleanPhone)
        .where('userType', '==', 'guest')
        .where('active', '==', true)
        .get();

      if (guestSnapshot.empty) {
        console.log('매칭 가능한 guest 계정 없음');
        return;
      }

      console.log(`✅ ${guestSnapshot.size}개의 guest 계정 발견`);

      // 2️⃣ 데이터 마이그레이션
      for (const guestDoc of guestSnapshot.docs) {
        const guestUid = guestDoc.id;

        console.log(`🔄 데이터 이전 시작: ${guestUid} → ${user.uid}`);

        await migrateUserData(guestUid, user.uid);

        // 3️⃣ guest 계정 비활성화
        await guestDoc.ref.update({
          active: false,
          mergedInto: user.uid,
          mergedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ guest 계정 비활성화 완료: ${guestUid}`);
      }

      console.log(`🎉 자동 매칭 완료: ${user.uid}`);

    } catch (error) {
      console.error('❌ 자동 매칭 실패:', error);

      // Sentry 로깅
      Sentry.captureException(error, {
        tags: {
          function: 'autoLinkGuestAccounts',
          userId: user.uid,
        },
      });
    }
  });

/**
 * 데이터 마이그레이션 (guest → 회원)
 */
async function migrateUserData(guestUid: string, realUid: string): Promise<void> {
  const db = admin.firestore();

  try {
    // 1️⃣ 예약 이전
    const reservations = await db
      .collection('diagnosisReservations')
      .where('userId', '==', guestUid)
      .get();

    console.log(`📋 예약 ${reservations.size}건 이전`);

    const batch1 = db.batch();
    reservations.forEach(doc => {
      batch1.update(doc.ref, {
        userId: realUid,
        linkedFrom: guestUid,
        linkedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch1.commit();

    // 2️⃣ 리포트 이전
    const reports = await db
      .collection('vehicleDiagnosisReports')
      .where('userId', '==', guestUid)
      .get();

    console.log(`📊 리포트 ${reports.size}건 이전`);

    const batch2 = db.batch();
    reports.forEach(doc => {
      batch2.update(doc.ref, {
        userId: realUid,
        isGuest: false,
        linkedFrom: guestUid,
        linkedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch2.commit();

    // 3️⃣ 알림 이전 (서브컬렉션)
    const notifications = await db
      .collection('users')
      .doc(guestUid)
      .collection('inAppNotifications')
      .get();

    console.log(`🔔 알림 ${notifications.size}건 이전`);

    const batch3 = db.batch();
    notifications.forEach(doc => {
      const newRef = db
        .collection('users')
        .doc(realUid)
        .collection('inAppNotifications')
        .doc(doc.id);

      batch3.set(newRef, doc.data());
    });
    await batch3.commit();

    console.log('✅ 모든 데이터 이전 완료');

  } catch (error) {
    console.error('❌ 데이터 마이그레이션 실패:', error);
    throw error;
  }
}
```

### 4. 리포트 제출 시 isGuest 필드 추가

```typescript
// useInspectionSubmit.ts
const reportData: Omit<VehicleDiagnosisReport, 'id' | 'createdAt' | 'updatedAt'> = {
  reservationId: null,
  userId: selectedUserId,
  userName: selectedUserName,
  userPhone: selectedUserPhone,
  isGuest: selectedUserId.startsWith('guest_'),  // 🔥 비회원 여부
  // ... 나머지 필드
};
```

---

## 🔍 관리자 기능

### 웹 관리자: 수동 매칭 UI

```typescript
// charzing-admin/app/users/link/page.tsx

const LinkGuestAccountPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [guestAccounts, setGuestAccounts] = useState([]);
  const [targetUser, setTargetUser] = useState(null);

  // guest 계정 검색
  const searchGuestAccounts = async () => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    const snapshot = await db
      .collection('users')
      .where('phoneNumber', '==', cleanPhone)
      .where('userType', '==', 'guest')
      .where('active', '==', true)
      .get();

    setGuestAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // 수동 매칭 실행
  const linkAccount = async (guestUid: string, realUid: string) => {
    await fetch('/api/admin/linkGuestAccount', {
      method: 'POST',
      body: JSON.stringify({ guestUid, realUid }),
    });

    alert('연결 완료!');
  };

  return (
    <div>
      <h1>Guest 계정 수동 매칭</h1>

      <input
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="전화번호 입력"
      />
      <button onClick={searchGuestAccounts}>검색</button>

      {guestAccounts.map(guest => (
        <div key={guest.id}>
          <p>{guest.displayName} ({guest.phoneNumber})</p>
          <p>생성일: {guest.createdAt?.toDate().toLocaleDateString()}</p>
          <button onClick={() => linkAccount(guest.id, targetUser.uid)}>
            연결하기
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## 📈 통계 및 모니터링

### Firestore 쿼리 인덱스

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "phoneNumber", "order": "ASCENDING" },
        { "fieldPath": "userType", "order": "ASCENDING" },
        { "fieldPath": "active", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### Sentry 로깅 포인트

1. **Guest 계정 생성**: `createGuestUser()` 성공/실패
2. **자동 매칭 시작**: `autoLinkGuestAccounts()` 트리거
3. **데이터 마이그레이션**: 각 단계별 성공/실패
4. **Guest 계정 비활성화**: 완료 로그

---

## ✅ 테스트 시나리오

### 시나리오 1: 비회원 리포트 작성

1. 정비사가 앱에서 [수동 입력] 클릭
2. 이름: "김철수", 전화번호: "010-1111-2222" 입력
3. guest ID 생성: `guest_abc123...`
4. 진단 리포트 작성 및 제출
5. Firestore 확인:
   - `users/guest_abc123`: 비회원 문서 생성됨
   - `vehicleDiagnosisReports/report_xxx`: `userId: guest_abc123`, `isGuest: true`

### 시나리오 2: 비회원 → 회원 자동 전환

1. 김철수가 앱 설치 후 카카오 로그인
2. 전화번호: "010-1111-2222" (동일)
3. Firebase Auth UID: `real_xyz789`
4. **자동 매칭 트리거**
5. Firestore 확인:
   - `users/guest_abc123`: `active: false`, `mergedInto: real_xyz789`
   - `vehicleDiagnosisReports/report_xxx`: `userId: real_xyz789`, `isGuest: false`, `linkedFrom: guest_abc123`
6. 김철수 앱에서 자동으로 이전 리포트 조회 가능

### 시나리오 3: 충돌 처리

1. 전화번호 "010-3333-4444"로 guest 계정 3개 존재
2. 사용자 회원가입
3. 자동 매칭: 3개 모두 이전
4. 관리자 웹에서 확인 가능

---

## 🚀 배포 체크리스트

- [ ] `uuid` 패키지 설치: `npm install react-native-uuid`
- [ ] Firestore 인덱스 배포: `firebase deploy --only firestore:indexes`
- [ ] Firebase Functions 배포: `firebase deploy --only functions:autoLinkGuestAccounts`
- [ ] 타입 정의 업데이트: `VehicleDiagnosisReport` 인터페이스에 `isGuest`, `linkedFrom` 추가
- [ ] 앱 빌드 및 테스트
- [ ] 관리자 웹 수동 매칭 UI 구현

---

## 📚 참고 자료

- Firebase Auth Triggers: https://firebase.google.com/docs/functions/auth-events
- Firestore Batch Writes: https://firebase.google.com/docs/firestore/manage-data/transactions
- UUID v4: https://www.npmjs.com/package/react-native-uuid
