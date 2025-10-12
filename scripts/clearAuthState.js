/**
 * AsyncStorage와 Redux Persist 인증 상태를 완전히 초기화하는 스크립트
 * 세션 만료 및 인증 상태 충돌 문제 해결용
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 인증 상태 초기화 시작...\n');

// 1. Metro bundler 중지
console.log('1️⃣ Metro bundler 중지 중...');
try {
  execSync('pkill -f "expo start" || true', { stdio: 'inherit' });
  execSync('pkill -f "react-native start" || true', { stdio: 'inherit' });
  console.log('✅ Metro bundler 중지 완료\n');
} catch (error) {
  console.log('⚠️ Metro bundler 중지 시 오류 발생 (정상적으로 실행 중이 아닐 수 있음)\n');
}

// 2. 시뮬레이터/에뮬레이터 앱 데이터 초기화 안내
console.log('2️⃣ 디바이스별 캐시 초기화 방법:');
console.log('📱 iOS 시뮬레이터:');
console.log('   - Device > Erase All Content and Settings');
console.log('   또는 특정 앱만: Device > Apps > CharzingApp > Remove App\n');

console.log('🤖 Android 에뮬레이터:');
console.log('   - Settings > Apps > CharzingApp > Storage > Clear Data');
console.log('   또는 에뮬레이터 재시작: emulator -avd [AVD_NAME] -wipe-data\n');

// 3. 개발 서버 캐시 정리
console.log('3️⃣ 개발 서버 캐시 정리 중...');
const cacheDirectories = [
  '.expo',
  'node_modules/.cache',
  '.metro',
  'ios/build',
  'android/build',
  'android/app/build'
];

cacheDirectories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      execSync(`rm -rf "${fullPath}"`, { stdio: 'inherit' });
      console.log(`✅ ${dir} 삭제 완료`);
    } catch (error) {
      console.log(`⚠️ ${dir} 삭제 실패: ${error.message}`);
    }
  } else {
    console.log(`⏭️ ${dir} 존재하지 않음`);
  }
});

// 4. React Native 캐시 정리
console.log('\n4️⃣ React Native 캐시 정리 중...');
try {
  execSync('npx react-native start --reset-cache &', { stdio: 'inherit' });
  setTimeout(() => {
    execSync('pkill -f "react-native start" || true', { stdio: 'inherit' });
  }, 3000);
  console.log('✅ React Native 캐시 리셋 완료');
} catch (error) {
  console.log('⚠️ React Native 캐시 리셋 실패:', error.message);
}

// 5. 인증 상태 초기화 코드 생성
console.log('\n5️⃣ 앱 내 인증 상태 초기화 코드 생성...');

const clearAuthCode = `
// 임시로 App.tsx에 추가하여 실행 후 제거할 코드
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistor } from './src/store';

// App.tsx의 useEffect에 추가
useEffect(() => {
  const clearAuthState = async () => {
    try {
      console.log('🧹 인증 상태 초기화 시작...');
      
      // 1. AsyncStorage 완전 초기화
      await AsyncStorage.clear();
      console.log('✅ AsyncStorage 초기화 완료');
      
      // 2. Redux Persist 초기화
      await persistor.purge();
      console.log('✅ Redux Persist 초기화 완료');
      
      // 3. Firebase Auth 로그아웃
      const auth = getAuth();
      if (auth.currentUser) {
        await auth.signOut();
        console.log('✅ Firebase Auth 로그아웃 완료');
      }
      
      console.log('🎉 인증 상태 초기화 완료 - 앱을 재시작하세요');
      
      // 선택사항: 앱 강제 종료
      // import { BackHandler } from 'react-native';
      // BackHandler.exitApp();
      
    } catch (error) {
      console.error('❌ 인증 상태 초기화 실패:', error);
    }
  };
  
  // 한 번만 실행하도록 주의
  // clearAuthState();
}, []);
`;

const codeFilePath = path.join(process.cwd(), 'temp_clear_auth_code.txt');
fs.writeFileSync(codeFilePath, clearAuthCode);
console.log(`✅ 초기화 코드가 생성되었습니다: ${codeFilePath}`);

// 6. 완료 안내
console.log('\n🎯 다음 단계:');
console.log('1. 시뮬레이터/에뮬레이터에서 앱 데이터 초기화');
console.log('2. temp_clear_auth_code.txt의 코드를 App.tsx에 임시 추가');
console.log('3. 앱 실행하여 인증 상태 초기화 확인');
console.log('4. 초기화 완료 후 임시 코드 제거');
console.log('5. 앱 재시작 후 정상 로그인 테스트');

console.log('\n⚠️ 주의사항:');
console.log('- 이 작업은 모든 로그인 상태와 캐시된 데이터를 삭제합니다');
console.log('- 실제 사용자 데이터(Firebase)는 영향받지 않습니다');
console.log('- 개발 중인 앱에서만 실행하세요');

console.log('\n🧹 인증 상태 초기화 스크립트 실행 완료!');