# Google Sign-In 설정 가이드

## 개요
Android에서 Google 로그인을 사용하기 위해 Google Client ID를 설정해야 합니다.

## 1. Firebase Console에서 Web Client ID 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. `charzing-d1600` 프로젝트 선택
3. 좌측 메뉴에서 "프로젝트 설정" (톱니바퀴 아이콘) 클릭
4. "일반" 탭에서 "내 앱" 섹션 확인
5. "웹 앱" 항목이 있는지 확인, 없다면 "앱 추가" → "웹" 선택
6. 웹 앱의 구성에서 "웹 클라이언트 ID" 복사

## 2. Google Cloud Console에서 OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. `charzing-d1600` 프로젝트 선택
3. "API 및 서비스" → "사용자 인증 정보" 이동
4. "사용자 인증 정보 만들기" → "OAuth 2.0 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션"
6. 이름: "Charzing Web Client"
7. 승인된 JavaScript 원본: 
   - `http://localhost:8081` (개발용)
   - `https://charzing-d1600.firebaseapp.com` (프로덕션용)
8. 생성된 클라이언트 ID 복사

## 3. 앱 설정 업데이트

### app.json 수정
\`\`\`json
{
  "extra": {
    "GOOGLE_WEB_CLIENT_ID": "91035459357-YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com"
  }
}
\`\`\`

현재 설정된 placeholder를 실제 Client ID로 교체:
- 현재: `91035459357-PLACEHOLDER.apps.googleusercontent.com`
- 변경: `91035459357-YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com`

## 4. Firebase Functions 설정 업데이트

\`\`\`typescript
// functions/src/index.ts에서
const GOOGLE_WEB_CLIENT_ID = '91035459357-YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com';
\`\`\`

## 5. Android 설정

### google-services.json 확인
1. Firebase Console → 프로젝트 설정 → Android 앱
2. `google-services.json` 다운로드
3. `android/app/google-services.json`에 배치

### SHA-1 지문 등록 (필수)
1. Android 앱의 SHA-1 지문을 Firebase에 등록해야 함
2. 개발용 키스토어 지문 생성:
   \`\`\`bash
   cd android
   ./gradlew signingReport
   \`\`\`
3. SHA1 지문을 Firebase Console → Android 앱 설정에 추가

## 6. 테스트

### Android에서 Google 로그인 테스트
1. Android 에뮬레이터 또는 실제 기기에서 앱 실행
2. 로그인 화면에서 "Google로 시작하기" 버튼 클릭
3. Google 계정 선택 및 권한 승인
4. 성공적으로 로그인되는지 확인

### iOS에서 Apple 로그인 테스트
1. iOS 시뮬레이터 또는 실제 기기에서 앱 실행
2. 로그인 화면에서 "Apple로 시작하기" 버튼 클릭
3. Apple ID로 로그인 및 권한 승인
4. 성공적으로 로그인되는지 확인

## 7. 배포 후 설정

Firebase Functions 재배포:
\`\`\`bash
cd functions
npm run deploy
\`\`\`

## 트러블슈팅

### 일반적인 오류들

1. **"Google Web Client ID가 설정되지 않았습니다"**
   - app.json에서 PLACEHOLDER를 실제 Client ID로 교체

2. **"Google Sign-In failed"**
   - SHA-1 지문이 Firebase에 등록되었는지 확인
   - google-services.json이 최신인지 확인

3. **"Invalid audience"**
   - Firebase Functions의 GOOGLE_WEB_CLIENT_ID가 올바른지 확인
   - 클라이언트와 서버의 Client ID가 동일한지 확인

4. **"Sign in cancelled"**
   - 정상적인 사용자 취소 (에러 아님)

## 현재 상태

✅ Android에서 Firebase Functions import 오류 해결
✅ Google 로그인 서비스 구현 완료
✅ Firebase Functions에 googleLogin 함수 배포 완료
⚠️  Google Web Client ID 설정 필요 (PLACEHOLDER 교체)
⚠️  SHA-1 지문 등록 필요
⚠️  실제 기기에서 테스트 필요

## 다음 단계

1. Firebase Console에서 실제 Web Client ID 생성
2. app.json과 Firebase Functions에 실제 Client ID 설정
3. Android SHA-1 지문 등록
4. 양쪽 플랫폼에서 로그인 테스트
5. 필요시 추가 OAuth 설정 조정