import { getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase 서비스 안전한 getter 함수들
export const getDb = (): Firestore => {
  if (getApps().length === 0) {
    throw new Error('Firebase app is not initialized. Make sure App.tsx initializes Firebase first.');
  }
  return getFirestore(getApp());
};

export const getAuthInstance = (): Auth => {
  if (getApps().length === 0) {
    throw new Error('Firebase app is not initialized. Make sure App.tsx initializes Firebase first.');
  }
  return getAuth(getApp());
};

export const getStorageInstance = (): FirebaseStorage => {
  if (getApps().length === 0) {
    throw new Error('Firebase app is not initialized. Make sure App.tsx initializes Firebase first.');
  }
  return getStorage(getApp(), "gs://charzing-d1600.firebasestorage.app");
};

// 직접 사용할 수 있는 안전한 인스턴스들 (lazy loading)
export const db = new Proxy({} as any, {
  get(target, prop) {
    const dbInstance = getDb();
    const value = (dbInstance as any)[prop];
    return typeof value === 'function' 
      ? value.bind(dbInstance)
      : value;
  }
});

export const auth = new Proxy({} as any, {
  get(target, prop) {
    const authInstance = getAuthInstance();
    const value = (authInstance as any)[prop];
    return typeof value === 'function' 
      ? value.bind(authInstance)
      : value;
  }
});

export const storage = new Proxy({} as any, {
  get(target, prop) {
    const storageInstance = getStorageInstance();
    const value = (storageInstance as any)[prop];
    return typeof value === 'function' 
      ? value.bind(storageInstance)
      : value;
  }
});

// App instance getter
const getAppInstance = (): FirebaseApp => {
  if (getApps().length === 0) {
    throw new Error('Firebase app is not initialized. Make sure App.tsx initializes Firebase first.');
  }
  return getApp();
};

export default getAppInstance;