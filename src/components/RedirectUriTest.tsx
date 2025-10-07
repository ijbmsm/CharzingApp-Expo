import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as AuthSession from 'expo-auth-session';

const RedirectUriTest: React.FC = () => {
  useEffect(() => {
    const redirectUri = AuthSession.makeRedirectUri({
      native: 'com.charzingapp://auth',   // 네이티브 앱용 스킴
    });
    
    console.log('🔗 카카오 개발자 콘솔에 등록할 Redirect URI:');
    console.log(redirectUri);
    
    // 기본 설정으로도 확인
    const redirectUriDefault = AuthSession.makeRedirectUri();
    
    console.log('🔗 기본 Redirect URI:');
    console.log(redirectUriDefault);
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>Redirect URI 체크 중... 콘솔을 확인하세요.</Text>
    </View>
  );
};

export default RedirectUriTest;