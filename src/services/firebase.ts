// Firebase 웹 SDK (Expo 호환)
import { Auth } from 'firebase/auth';
import { getFirestore, collection } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { firebaseFacade } from './firebase/config';

// 이미 초기화된 Firebase 앱 사용
const app = getApp();

// 🔧 수정: Auth는 별도 persistence 설정으로 초기화되므로 직접 가져오지 않음
// Firebase 인스턴스들 (Auth 제외)
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth는 Firebase Facade에서 persistence와 함께 초기화된 후 가져옴
export const getAuthInstance = (): Auth => {
  const auth = firebaseFacade.getAuth();
  if (!auth) {
    throw new Error('Firebase Auth가 아직 초기화되지 않았습니다. Firebase Facade를 먼저 초기화하세요.');
  }
  return auth;
};

// Firestore 컬렉션 참조
export const collections = {
  users: collection(db, 'users'),
  // 필요한 컬렉션 추가
};

// Expo Notifications로 FCM 대체 (Expo managed workflow에서 사용)
export const getFCMToken = async () => {
  try {
    // Expo에서는 expo-notifications 사용
    console.log('Expo 환경에서는 expo-notifications를 사용하세요');
    return null;
  } catch (error) {
    console.error('FCM Token Error:', error);
    return null;
  }
};

// Expo Notifications 권한 요청
export const requestNotificationPermission = async () => {
  try {
    // Expo에서는 expo-notifications 사용
    console.log('Expo 환경에서는 expo-notifications를 사용하세요');
    return false;
  } catch (error) {
    console.error('Notification Permission Error:', error);
    return false;
  }
};