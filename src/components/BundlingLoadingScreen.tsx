import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';

interface BundlingLoadingScreenProps {
  message?: string;
  showProgress?: boolean;
}

/**
 * 스플래시 화면과 동일한 디자인의 번들링 로딩 화면
 * Metro bundler 로딩 중에 표시되는 커스텀 화면
 */
export const BundlingLoadingScreen: React.FC<BundlingLoadingScreenProps> = ({
  message = '앱을 준비하고 있습니다...',
  showProgress = true
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 로고 Pulse 애니메이션만 (부드럽게)
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* 로고 컨테이너 (Pulse 애니메이션만) */}
      <View style={styles.logoWrapper}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Image
            source={require('../assets/charzingLogo/ios/AppIcon~ios-marketing.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 스플래시와 동일한 하얀색 배경
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  logo: {
    width: 120,
    height: 120,
  },
});

export default BundlingLoadingScreen;