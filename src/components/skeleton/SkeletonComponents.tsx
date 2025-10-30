import React from 'react';
import { View, ViewStyle, DimensionValue } from 'react-native';
import ShimmerView from './ShimmerView';

interface SkeletonTextProps {
  width?: DimensionValue;
  height?: DimensionValue;
  lines?: number;
  lineSpacing?: number;
  style?: ViewStyle;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  width = '100%',
  height = 16,
  lines = 1,
  lineSpacing = 8,
  style
}) => {
  if (lines === 1) {
    return <ShimmerView width={width} height={height} style={style} />;
  }

  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <ShimmerView
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height={height}
          style={{ marginBottom: index < lines - 1 ? lineSpacing : 0 }}
        />
      ))}
    </View>
  );
};

interface SkeletonCardProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  padding?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  width = '100%',
  height = 120,
  borderRadius = 12,
  padding = 16,
  children,
  style
}) => {
  return (
    <View style={[{
      width,
      height,
      borderRadius,
      backgroundColor: '#FFFFFF',
      padding,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    }, style]}>
      {children || <ShimmerView width="100%" height="100%" borderRadius={borderRadius - 8} />}
    </View>
  );
};

interface SkeletonAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 40,
  style
}) => {
  return (
    <ShimmerView
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};

interface SkeletonButtonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonButton: React.FC<SkeletonButtonProps> = ({
  width = 120,
  height = 44,
  borderRadius = 8,
  style
}) => {
  return (
    <ShimmerView
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
};

interface SkeletonImageProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  width = 100,
  height = 100,
  borderRadius = 8,
  style
}) => {
  return (
    <ShimmerView
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
};

// 차량 카드 전용 스켈레톤
interface SkeletonVehicleCardProps {
  style?: ViewStyle;
}

export const SkeletonVehicleCard: React.FC<SkeletonVehicleCardProps> = ({ style }) => {
  return (
    <View style={[{
      width: '100%',
      backgroundColor: 'transparent',
      paddingBottom: 0,
      marginBottom: 0,
    }, style]}>
      {/* 차량 이미지 컨테이너 */}
      <View style={{
        width: '100%',
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#F9FAFB',
        position: 'relative',
      }}>
        <SkeletonImage width="100%" height="100%" borderRadius={12} />
        {/* 브랜드 오버레이 스켈레톤 */}
        <View style={{
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: 'rgba(0,0,0,0.1)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <SkeletonText width={40} height={12} />
        </View>
      </View>

      {/* 차량 정보 */}
      <View style={{ marginBottom: 16 }}>
        {/* 차량 이름과 편집 버튼 */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}>
          <View style={{ flex: 1 }}>
            <SkeletonText width="85%" height={20} style={{ marginBottom: 6 }} />
            <SkeletonText width="65%" height={16} />
          </View>
          <SkeletonImage width={28} height={28} borderRadius={14} />
        </View>
      </View>
      
      {/* 확장 버튼 */}
      <View style={{ 
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
      }}>
        <SkeletonButton width={120} height={36} />
      </View>
    </View>
  );
};

// 예약 카드 전용 스켈레톤
interface SkeletonReservationCardProps {
  style?: ViewStyle;
}

export const SkeletonReservationCard: React.FC<SkeletonReservationCardProps> = ({ style }) => {
  return (
    <SkeletonCard
      width="100%"
      height={160}
      style={[{ marginBottom: 12 }, style] as unknown as ViewStyle}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <SkeletonText width="30%" height={16} />
        <SkeletonText width="40%" height={14} />
      </View>
      
      {/* 스텝 인디케이터 영역 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 8
      }}>
        {[0, 1, 2].map((index) => (
          <React.Fragment key={index}>
            <ShimmerView width={30} height={30} borderRadius={15} />
            {index < 2 && <ShimmerView width={40} height={2} />}
          </React.Fragment>
        ))}
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonText width="60%" height={12} />
        <ShimmerView width={16} height={16} borderRadius={8} />
      </View>
    </SkeletonCard>
  );
};

// 진단 리포트 카드 전용 스켈레톤
interface SkeletonReportCardProps {
  style?: ViewStyle;
}

export const SkeletonReportCard: React.FC<SkeletonReportCardProps> = ({ style }) => {
  return (
    <SkeletonCard
      width="100%"
      height={140}
      style={[{ marginBottom: 16 }, style] as unknown as ViewStyle}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <SkeletonText width="50%" height={16} />
        <SkeletonText width="25%" height={14} />
      </View>
      
      <SkeletonText lines={2} height={14} style={{ marginBottom: 12 }} />
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonText width="35%" height={12} />
        <SkeletonButton width={80} height={32} />
      </View>
    </SkeletonCard>
  );
};