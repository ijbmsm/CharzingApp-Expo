import React from 'react';
import { View, ViewStyle, DimensionValue } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
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
  return (
    <View style={[{ width, height, borderRadius, overflow: 'hidden' }, style]}>
      <MotiView
        from={{ translateX: -300 }}
        animate={{ translateX: 300 }}
        transition={{
          type: 'timing',
          duration: 2000,
          loop: true,
          repeatReverse: false,
          easing: Easing.linear,
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
      </MotiView>
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