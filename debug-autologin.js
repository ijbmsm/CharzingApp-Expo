// 자동로그인 디버그 스크립트
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function checkAutoLoginStatus() {
  try {
    console.log('🔍 자동로그인 상태 체크 시작...');
    
    // Redux persist 상태 확인
    const authState = await AsyncStorage.getItem('persist:auth');
    
    if (authState) {
      const parsedAuthState = JSON.parse(authState);
      console.log('📱 Redis Persist 상태:', {
        autoLoginEnabled: parsedAuthState.autoLoginEnabled,
        isAuthenticated: parsedAuthState.isAuthenticated,
        userUid: parsedAuthState.user ? JSON.parse(parsedAuthState.user)?.uid : null,
        userProvider: parsedAuthState.user ? JSON.parse(parsedAuthState.user)?.provider : null,
        userDisplayName: parsedAuthState.user ? JSON.parse(parsedAuthState.user)?.displayName : null,
      });
    } else {
      console.log('❌ Redux persist 상태 없음');
    }
    
    // AsyncStorage 전체 키 확인
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('📦 AsyncStorage 모든 키들:', allKeys);
    
    // Firebase 관련 키들 확인
    const firebaseKeys = allKeys.filter(key => 
      key.includes('firebase') || 
      key.includes('auth') || 
      key.includes('persist')
    );
    
    for (const key of firebaseKeys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`🔑 ${key}:`, value ? value.substring(0, 100) + '...' : 'null');
    }
    
  } catch (error) {
    console.error('❌ 자동로그인 상태 체크 실패:', error);
  }
}

// React Native 환경에서 실행할 수 있도록 export
if (typeof module !== 'undefined') {
  module.exports = { checkAutoLoginStatus };
} else {
  // 브라우저 환경에서는 바로 실행
  checkAutoLoginStatus();
}