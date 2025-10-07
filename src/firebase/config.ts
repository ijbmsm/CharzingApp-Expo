import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCa5WLhZwAowvna4vrLbweOtW8w8oEoS88",
  authDomain: "charzing-d1600.firebaseapp.com",
  projectId: "charzing-d1600",
  storageBucket: "charzing-d1600.firebasestorage.app",
  messagingSenderId: "91035459357",
  appId: "1:91035459357:android:a146043ea80a3d5d48cbf4"
};

// Firebase 앱 가져오기 또는 AsyncStorage와 함께 초기화
let app: FirebaseApp;
let auth: any;

try {
  if (getApps().length > 0) {
    // App.tsx에서 이미 초기화된 경우 (정상적인 경우)
    app = getApp();
    auth = getAuth(app);
    console.log('🔥 config에서 기존 Firebase 앱 가져오기 (App.tsx에서 Auth와 함께 초기화됨)');
  } else {
    // App.tsx보다 먼저 실행되는 경우 - AsyncStorage와 함께 초기화
    console.log('🔧 config가 App.tsx보다 먼저 실행됨, AsyncStorage와 함께 초기화');
    app = initializeApp(firebaseConfig);
    
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      console.log('✅ config에서 Firebase Auth AsyncStorage persistence 설정 완료');
    } catch (authError) {
      console.log('🔄 config에서 Auth 초기화 실패, 기본 Auth 사용:', authError);
      auth = getAuth(app);
    }
  }
} catch (error) {
  console.log('🔥 Firebase 앱 가져오기 실패, 새로 초기화:', error);
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

// Firebase 서비스 내보내기 (이미 초기화된 앱 사용)
export const db = getFirestore(app);
export { auth }; // 위에서 초기화된 auth 인스턴스 사용
export const storage = getStorage(app, "gs://charzing-d1600.firebasestorage.app");

console.log('🔥 Firebase 서비스 준비 완료!');
console.log('🔥 Firebase Storage 버킷:', storage.app.options.storageBucket);

export default app;