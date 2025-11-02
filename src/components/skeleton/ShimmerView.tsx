import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, DimensionValue, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerViewProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

const ShimmerView: React.FC<ShimmerViewProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  children
}) => {
  const translateX = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 300,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [translateX]);

  return (
    <View style={[{ width, height, borderRadius, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['#F5F5F5', '#EEEEEE', '#F5F5F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
          }}
        />
      </Animated.View>
      {children && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent'
        }}>
          {children}
        </View>
      )}
    </View>
  );
};

export default ShimmerView;