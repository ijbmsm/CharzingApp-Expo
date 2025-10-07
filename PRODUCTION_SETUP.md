# CharzingApp Production Setup Guide

## 🏗️ 아키텍처 개요

이 프로젝트는 **웹과 앱이 백엔드를 공유하는 프로덕션 환경**을 위해 설계되었습니다.

### 핵심 구조
- **클라이언트**: Expo (React Native) + 웹 (React)
- **백엔드**: Firebase Cloud Functions
- **데이터베이스**: Firestore
- **인증**: Firebase Auth + 카카오 OAuth

## 🚀 배포 전 체크리스트

### 1. Firebase 프로젝트 설정

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 연결
firebase use --add

# 프로젝트 ID 확인
firebase projects:list
```

### 2. 환경 변수 설정

**app.json 업데이트:**
```json
{
  "expo": {
    "extra": {
      "KAKAO_REST_API_KEY": "실제_카카오_REST_API_키",
      "CLOUD_FUNCTION_URL": "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net"
    }
  }
}
```

### 3. Cloud Functions 배포

```bash
# Functions 디렉토리로 이동
cd functions

# 의존성 설치
npm install

# TypeScript 빌드
npm run build

# Functions 배포
firebase deploy --only functions
```

### 4. 카카오 개발자 콘솔 설정

1. **카카오 개발자 계정** 생성
2. **앱 등록** 및 **REST API Key** 발급
3. **Redirect URI** 등록:
   ```
   앱: charzingapp://kakao-login
   웹: https://your-domain.com/kakao-callback
   ```

## 📱 클라이언트 사용법

### 1. 카카오 로그인
```typescript
import { kakaoLoginService } from './src/services/kakaoLoginService';

const handleLogin = async () => {
  try {
    const result = await kakaoLoginService.login();
    
    if (result.success) {
      console.log('로그인 성공:', result.user);
      
      if (result.needsRegistration) {
        // 추가 정보 입력 화면으로 이동
        navigation.navigate('SignupComplete');
      } else {
        // 메인 화면으로 이동
        navigation.navigate('Home');
      }
    }
  } catch (error) {
    console.error('로그인 실패:', error);
  }
};
```

### 2. 사용자 프로필 관리
```typescript
import { userService } from './src/services/userService';

// 프로필 조회
const profile = await userService.getCurrentUserProfile();

// 프로필 업데이트
await userService.updateUserProfile({
  displayName: '사용자명',
  phoneNumber: '010-1234-5678',
  address: '서울시 강남구',
});

// 회원가입 완료
await userService.completeRegistration({
  displayName: '사용자명',
  phoneNumber: '010-1234-5678',
  address: '서울시 강남구',
});
```

### 3. 로그아웃 및 회원탈퇴
```typescript
// 로그아웃
await kakaoLoginService.logout();

// 회원탈퇴
await kakaoLoginService.deleteAccount();
```

## 🌐 웹 버전 개발 가이드

웹 버전을 개발할 때는 동일한 Cloud Functions를 사용합니다:

### 웹용 카카오 로그인
```typescript
// 웹에서는 JavaScript SDK 사용
const kakaoAuth = () => {
  Kakao.Auth.authorize({
    redirectUri: 'https://your-domain.com/kakao-callback',
  });
};

// 콜백 처리
const handleKakaoCallback = async (code: string) => {
  const response = await fetch(
    'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/createCustomTokenFromKakao',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorizationCode: code,
        redirectUri: 'https://your-domain.com/kakao-callback',
        clientId: 'YOUR_KAKAO_REST_API_KEY',
      }),
    }
  );
  
  const data = await response.json();
  // Firebase Custom Token으로 로그인
  await signInWithCustomToken(auth, data.customToken);
};
```

## 🔧 Cloud Functions API 명세

### 1. 카카오 로그인 → Firebase Custom Token
**Endpoint:** `POST /createCustomTokenFromKakao`

**Request:**
```json
{
  "authorizationCode": "카카오_인증_코드",
  "redirectUri": "리다이렉트_URI",
  "clientId": "카카오_REST_API_키"
}
```

**Response:**
```json
{
  "success": true,
  "customToken": "Firebase_Custom_Token",
  "userInfo": {
    "id": "카카오_사용자_ID",
    "email": "user@example.com",
    "nickname": "사용자명"
  },
  "isNewUser": true
}
```

### 2. 사용자 프로필 업데이트
**Endpoint:** `POST /updateUserProfile` (Firebase Callable Function)

**Request:**
```json
{
  "displayName": "사용자명",
  "phoneNumber": "010-1234-5678",
  "address": "서울시 강남구",
  "isRegistrationComplete": true
}
```

### 3. 회원탈퇴
**Endpoint:** `POST /deleteUserAccount` (Firebase Callable Function)

모든 사용자 데이터를 안전하게 삭제합니다.

## 📊 데이터베이스 구조

### Firestore Collections

**users/{uid}**
```json
{
  "kakaoId": "카카오_사용자_ID",
  "email": "user@example.com",
  "displayName": "사용자명",
  "phoneNumber": "010-1234-5678",
  "address": "서울시 강남구",
  "photoURL": "프로필_이미지_URL",
  "provider": "kakao",
  "isRegistrationComplete": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "lastLoginAt": "2024-01-01T00:00:00Z"
}
```

## 🔒 보안 고려사항

### 1. CORS 설정
Cloud Functions에서 허용된 도메인만 접근 가능하도록 설정:

```typescript
const corsHandler = cors({
  origin: [
    'https://your-production-domain.com',
    'http://localhost:8082', // 개발 환경
  ],
  credentials: true,
});
```

### 2. Firebase Security Rules
Firestore 보안 규칙 예시:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자신의 데이터만 읽기/쓰기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🚀 배포 스크립트

**package.json에 추가:**
```json
{
  "scripts": {
    "deploy:functions": "cd functions && npm run build && firebase deploy --only functions",
    "deploy:firestore": "firebase deploy --only firestore",
    "deploy:all": "npm run deploy:functions && npm run deploy:firestore"
  }
}
```

## 📝 개발/운영 환경 분리

### 개발 환경
```bash
# 로컬 에뮬레이터 실행
firebase emulators:start

# Expo 개발 서버 (포트 8082)
npx expo start --port 8082
```

### 프로덕션 환경
```bash
# Functions 배포
firebase deploy --only functions

# Expo 빌드
eas build --platform all
```

## 🔍 모니터링

### 1. Firebase Console
- Functions 로그 확인
- 사용량 모니터링
- 오류 추적

### 2. 클라이언트 로깅
```typescript
// 개발 환경에서만 상세 로그
if (__DEV__) {
  console.log('상세 로그');
}
```

이제 웹과 앱이 완전히 공유하는 프로덕션 백엔드가 준비되었습니다! 🎉