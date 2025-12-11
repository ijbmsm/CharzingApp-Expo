import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

interface InteractiveTopSvgProps {
  width?: string | number;
  height?: string | number;
  highlightedParts: string[];
  onPartPress: (partId: string) => void;
}

export default function InteractiveTopSvg({
  width = '100%',
  height = '100%',
  highlightedParts,
  onPartPress,
}: InteractiveTopSvgProps) {
  const getFillColor = (partId: string) => {
    return highlightedParts.includes(partId) ? '#EF4444' : 'none';
  };

  const getFillOpacity = (partId: string) => {
    return highlightedParts.includes(partId) ? 0.3 : 0;
  };

  return (
    <Svg
      width={width}
      height={height}
      viewBox="1608 1200 1240 1770"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 트렁크리드(4) */}
      <G
        strokeLinecap="round"
        onPress={() => onPartPress('트렁크리드(4)')}
      >
        <Path d="M1665.08,2715.32 L1670.56,2712.45" fill={getFillColor('트렁크리드(4)')} fillOpacity={getFillOpacity('트렁크리드(4)')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M2792.23,2717.45" fill={getFillColor('트렁크리드(4)')} fillOpacity={getFillOpacity('트렁크리드(4)')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M1926.60,2846.97 Q1979.55,2948.11 2236.57,2947.44" fill={getFillColor('트렁크리드(4)')} fillOpacity={getFillOpacity('트렁크리드(4)')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M2547.56,2846.92 Q2494.62,2948.07 2237.61,2947.44" fill={getFillColor('트렁크리드(4)')} fillOpacity={getFillOpacity('트렁크리드(4)')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M1926.67,2846.47 Q1917.70,2813.80 1935.15,2626.21" fill={getFillColor('트렁크리드(4)')} fillOpacity={getFillOpacity('트렁크리드(4)')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M2547.49,2846.43 Q2556.45,2813.75 2538.97,2626.17" fill={getFillColor('트렁크리드(4)')} fillOpacity={getFillOpacity('트렁크리드(4)')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M1934.06,2626.32 Q2061.20,2676.30 2236.57,2674.71" fill={getFillColor('트렁크리드(4)')} fillOpacity={getFillOpacity('트렁크리드(4)')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M2540.07,2626.27 Q2412.93,2676.28 2237.57,2674.71" fill={getFillColor('트렁크리드(4)')} fillOpacity={getFillOpacity('트렁크리드(4)')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
      </G>

      {/* 루프패널(7) */}
      <G
        strokeLinecap="round"
        onPress={() => onPartPress('루프패널(7)')}
      >
        <Path d="M2236.57,2530.03 Q2417.53,2526.97 2504.65,2480.57 Q2477.73,2201.04 2489.93,1927.07 Q2376.91,1916.24 2236.57,1915.24 Q2235.60,1915.23 2232.78,1915.26 Q2229.95,1915.29 2228.41,1915.31 Q2090.52,1917.02 1981.32,1925.96 Q1994.42,2201.83 1969.96,2481.40 Q2055.69,2527.57 2236.57,2530.03 Z" fill={getFillColor('루프패널(7)')} fillOpacity={getFillOpacity('루프패널(7)')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
      </G>

      {/* 베이스 */}
      <G
        strokeLinecap="round"
        onPress={() => onPartPress('베이스')}
      >
        <Path d="M1981.02,1923.78 Q1980.78,1889.74 1940.46,1708.91 Q1939.71,1705.57 1938.96,1702.19" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M2491.55,1922.41 Q2491.60,1888.36 2530.95,1707.32 Q2531.68,1703.98 2532.42,1700.59" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M1940.18,1704.75 Q1909.48,1710.78 1861.71,1726.92" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M2530.93,1703.54 Q2561.89,1708.78 2609.88,1725.97" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M1863.84,1725.97 Q1841.06,1749.03 1838.94,1771.91" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M2608.05,1724.80 Q2630.56,1746.91 2632.81,1769.77" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M1838.62,1771.67 Q1897.66,1765.65 1945.44,1737.64" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M2633.13,1769.53 Q2574.05,1763.83 2526.12,1736.08" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M1936.95,2625.54 Q1954.53,2568.66 1970.21,2477.90" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M2539.39,2623.92 Q2521.51,2567.13 2505.33,2476.46" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M1930.09,2851.18 Q1900.86,2794.43 1895.79,1761.17" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
        <Path d="M2547.47,2849.52 Q2576.38,2792.61 2575.90,1759.34" fill={getFillColor('베이스')} fillOpacity={getFillOpacity('베이스')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
      </G>

      {/* 후드(1) */}
      <G
        strokeLinecap="round"
        onPress={() => onPartPress('후드(1)')}
      >
        <Path d="M2236.57,1627.51 Q1976.75,1632.25 1940.87,1701.59 Q1939.75,1705.90 1939.04,1705.89 Q1932.68,1705.84 1898.92,1714.63 Q1897.69,1451.51 1898.98,1401.01 Q1898.99,1400.56 1898.97,1399.68 Q1898.96,1398.79 1899.43,1394.93 Q1934.87,1221.24 2236.57,1214.97 Q2539.28,1221.90 2574.35,1395.66 Q2574.81,1399.53 2574.79,1400.41 Q2574.77,1401.29 2574.78,1401.74 Q2575.96,1452.24 2574.43,1714.25 Q2543.03,1704.76 2532.64,1703.67 Q2532.59,1703.97 2532.24,1702.23 Q2496.51,1632.82 2236.70,1627.51" fill={getFillColor('후드(1)')} fillOpacity={getFillOpacity('후드(1)')} stroke="#000000" strokeWidth="7" strokeOpacity="1.00" strokeLinejoin="round"/>
      </G>
    </Svg>
  );
}
