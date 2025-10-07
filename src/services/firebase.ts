// Firebase 웹 SDK (Expo 호환)
import { getAuth } from 'firebase/auth';
import { getFirestore, collection } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';

// 이미 초기화된 Firebase 앱 사용
const app = getApp();

// Firebase 인스턴스들
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

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