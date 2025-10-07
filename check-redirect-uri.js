import * as AuthSession from 'expo-auth-session';

const redirectUri = AuthSession.makeRedirectUri({
  useProxy: true,   // Expo Go/Dev 환경에서 안전하게 동작
});
console.log('🔗 카카오 개발자 콘솔에 등록할 Redirect URI:');
console.log(redirectUri);