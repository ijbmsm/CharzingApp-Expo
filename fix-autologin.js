// 자동로그인 강제 활성화 스크립트
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function fixAutoLogin() {
  try {
    console.log('🔧 자동로그인 강제 활성화 시작...');
    
    // 현재 persist 상태 가져오기
    const authState = await AsyncStorage.getItem('persist:auth');
    
    if (authState) {
      const parsedAuthState = JSON.parse(authState);
      console.log('📱 현재 상태:', {
        autoLoginEnabled: parsedAuthState.autoLoginEnabled,
        isAuthenticated: parsedAuthState.isAuthenticated,
      });
      
      // autoLoginEnabled를 true로 강제 설정
      parsedAuthState.autoLoginEnabled = 'true'; // Redux persist는 문자열로 저장
      
      // 다시 저장
      await AsyncStorage.setItem('persist:auth', JSON.stringify(parsedAuthState));
      
      console.log('✅ 자동로그인 강제 활성화 완료');
      console.log('📱 새 상태:', {
        autoLoginEnabled: parsedAuthState.autoLoginEnabled,
        isAuthenticated: parsedAuthState.isAuthenticated,
      });
      
    } else {
      console.log('❌ Redux persist 상태가 없습니다. 먼저 로그인해주세요.');
    }
    
  } catch (error) {
    console.error('❌ 자동로그인 활성화 실패:', error);
  }
}

// React Native 환경에서 실행할 수 있도록 export
if (typeof module !== 'undefined') {
  module.exports = { fixAutoLogin };
} else {
  // 브라우저 환경에서는 바로 실행
  fixAutoLogin();
}