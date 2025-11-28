import { getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseFacade } from '../services/firebase/config';
import { FirebaseInitializationStatus } from '../services/firebase/types';

// firebaseFacade를 다른 모듈에서 사용할 수 있도록 re-export
export { firebaseFacade };

/**
 * Firebase 서비스 안전한 getter 함수들 (향상된 에러 처리 포함)
 * 기존 API 호환성을 유지하면서 새로운 초기화 시스템 사용
 */

export const getDb = (): Firestore => {
  const app = getAppInstance();
  return getFirestore(app);
};

export const getAuthInstance = (): Auth => {
  const app = getAppInstance();
  return getAuth(app);
};

export const getStorageInstance = (): FirebaseStorage => {
  const app = getAppInstance();
  return getStorage(app, "gs://charzing-d1600.firebasestorage.app");
};

export const getFunctionsInstance = () => {
  const app = getAppInstance();
  return getFunctions(app, 'asia-northeast3');
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

/**
 * App instance getter (향상된 에러 처리)
 * 새로운 Firebase 초기화 시스템을 사용하여 더 상세한 상태 정보 제공
 */
const getAppInstance = (): FirebaseApp => {
  // 새로운 Firebase facade를 통한 상태 확인
  const status = firebaseFacade.getStatus();
  const app = firebaseFacade.getApp();
  
  if (status === FirebaseInitializationStatus.NOT_INITIALIZED) {
    throw new Error(
      'Firebase가 아직 초기화되지 않았습니다. App.tsx에서 Firebase 초기화가 완료될 때까지 기다려주세요.'
    );
  }
  
  if (status === FirebaseInitializationStatus.INITIALIZING) {
    throw new Error(
      'Firebase가 초기화 중입니다. 잠시 후 다시 시도해주세요.'
    );
  }
  
  if (status === FirebaseInitializationStatus.FAILED) {
    throw new Error(
      'Firebase 초기화에 실패했습니다. 네트워크 연결을 확인하고 앱을 다시 시작해주세요.'
    );
  }
  
  if (!app) {
    // Fallback: 기존 방식으로도 확인
    if (getApps().length === 0) {
      throw new Error(
        'Firebase app 인스턴스를 찾을 수 없습니다. 앱을 다시 시작해주세요.'
      );
    }
    return getApp();
  }
  
  return app;
};

export default getAppInstance;