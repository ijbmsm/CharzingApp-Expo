import React, { ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import Header from './Header';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  showBackButton?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback, 
  title = "로그인 필요",
  showBackButton = true 
}) => {
  const navigation = useNavigation();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  // 로딩 중일 때는 children을 보여줌 (스플래시에서 처리됨)
  if (isLoading) {
    return <>{children}</>;
  }

  // 인증되지 않은 경우 로그인 안내 화면 표시
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title={title}
          showLogo={false}
          showBackButton={showBackButton}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.content}>
          <View style={styles.loginPrompt}>
            <Ionicons name="lock-closed-outline" size={64} color="#9CA3AF" />
            <Text style={styles.promptTitle}>로그인이 필요합니다</Text>
            <Text style={styles.promptDescription}>
              {title} 기능을 사용하려면{'\n'}카카오 계정으로 로그인해주세요.
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login' as never)}
            >
              <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>카카오 로그인</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.laterButton}
              onPress={() => {
                if (showBackButton) {
                  navigation.goBack();
                } else {
                  // 탭에서는 홈으로 이동
                  navigation.dispatch(
                    CommonActions.navigate({
                      name: 'Main',
                      params: {
                        screen: 'Home'
                      }
                    })
                  );
                }
              }}
            >
              <Text style={styles.laterButtonText}>
                {showBackButton ? '나중에 로그인하기' : '홈으로 가기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 인증된 경우 children 보여줌
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginPrompt: {
    alignItems: 'center',
    maxWidth: 300,
  },
  promptTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  promptDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C1E1E',
  },
  laterButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default AuthGuard;