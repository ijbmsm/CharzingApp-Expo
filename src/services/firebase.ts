// Firebase 웹 SDK (Expo 호환)
import { Auth } from 'firebase/auth';
import { Firestore, getFirestore, collection, connectFirestoreEmulator } from 'firebase/firestore';
import { FirebaseStorage, getStorage, connectStorageEmulator } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { firebaseFacade } from './firebase/config';
import Constants from 'expo-constants';

// 에뮬레이터 사용 여부 (Expo 환경변수)
const USE_EMULATOR = Constants.expoConfig?.extra?.useEmulator === true;

// Lazy initialization으로 Firebase가 준비될 때까지 대기
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

// 에뮬레이터 연결 상태 추적
let _firestoreEmulatorConnected = false;
let _storageEmulatorConnected = false;

// 🔧 수정: Auth는 별도 persistence 설정으로 초기화되므로 직접 가져오지 않음
// Firebase 인스턴스들 (Auth 제외) - Lazy initialization
export const db = new Proxy({} as Firestore, {
  get(target, prop) {
    if (!_db) {
      const app = getApp();
      _db = getFirestore(app);
      // 🔧 에뮬레이터 연결 (개발 환경에서만)
      if (USE_EMULATOR && !_firestoreEmulatorConnected) {
        connectFirestoreEmulator(_db, 'localhost', 8080);
        _firestoreEmulatorConnected = true;
        console.log('🔧 Firestore Emulator 연결됨 (localhost:8080)');
      }
    }
    return (_db as any)[prop];
  }
});

export const storage = new Proxy({} as FirebaseStorage, {
  get(target, prop) {
    if (!_storage) {
      const app = getApp();
      _storage = getStorage(app);
      // 🔧 에뮬레이터 연결 (개발 환경에서만)
      if (USE_EMULATOR && !_storageEmulatorConnected) {
        connectStorageEmulator(_storage, 'localhost', 9199);
        _storageEmulatorConnected = true;
        console.log('🔧 Storage Emulator 연결됨 (localhost:9199)');
      }
    }
    return (_storage as any)[prop];
  }
});

// Auth는 Firebase Facade에서 persistence와 함께 초기화된 후 가져옴
export const getAuthInstance = (): Auth => {
  const auth = firebaseFacade.getAuth();
  if (!auth) {
    throw new Error('Firebase Auth가 아직 초기화되지 않았습니다. Firebase Facade를 먼저 초기화하세요.');
  }
  return auth;
};

// Firestore 컬렉션 참조 - Lazy initialization
export const collections = {
  get users() {
    return collection(db, 'users');
  },
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