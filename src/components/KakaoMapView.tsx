import React, { useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
// 📦 WebView는 HTML 기반 지도를 앱 화면에 띄워주는 도구입니다.
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import devLog from '../utils/devLog';

// 💡 KakaoMapView 컴포넌트가 받을 수 있는 props
type KakaoMapViewProps = {
  width?: number;
  height?: number;
  latitude?: number;
  longitude?: number;
  zoom?: number;
  onMapClick?: (latitude: number, longitude: number, showAlert?: boolean) => void | Promise<void>;
};

function KakaoMapView({
  width,
  height = 300,
  latitude = 37.5665,
  longitude = 126.9780,
  zoom = 3,
  onMapClick,
}: KakaoMapViewProps) {
  // 🔑 카카오 지도 API를 사용하려면 필요한 키입니다
  const KAKAO_MAP_JS_KEY = Constants.expoConfig?.extra?.KAKAO_JAVASCRIPT_KEY;
  
  // 지도 로딩 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // 📱 WebView에서 받은 메시지 처리
  const handleMessage = (event: any) => {
    try {
      const message = event.nativeEvent.data;
      
      // 지도 로딩 완료 메시지 처리
      if (message === 'MAP_LOADED') {
        devLog.log('🗺️ 지도 로딩 완료');
        setIsLoading(false);
        setHasError(false);
        return;
      }
      
      // 지도 로딩 실패 메시지 처리
      if (message.startsWith('MAP_ERROR:')) {
        devLog.error('🗺️ 지도 로딩 실패:', message);
        setIsLoading(false);
        setHasError(true);
        setErrorMessage(message.replace('MAP_ERROR:', ''));
        
        // 자동 재시도 (3회까지)
        if (retryCount < 3) {
          setTimeout(() => {
            handleRetry();
          }, 2000);
        }
        return;
      }
      
      // 일반 로그 메시지인 경우 (중요한 것만 출력)
      if (typeof message === 'string' && !message.startsWith('{')) {
        if (message.includes('MAP_LOADED') || message.includes('ERROR') || message.includes('오류')) {
          devLog.log('🗺️ Kakao Map:', message);
        }
        return;
      }
      
      // JSON 메시지인 경우 (지도 클릭 등)
      const data = JSON.parse(message);
      if (data.type === 'mapClick' && onMapClick) {
        devLog.log('🖱️ 지도 클릭:', data.latitude, data.longitude);
        onMapClick(data.latitude, data.longitude);
      }
    } catch (error) {
      devLog.log('🗺️ Kakao Map:', event.nativeEvent.data);
    }
  };

  // 재시도 함수
  const handleRetry = () => {
    devLog.log('🔄 지도 재시도 시작:', retryCount + 1);
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    setHasError(false);
    setIsLoading(true);
    
    // 잠시 후 재시도 상태 해제
    setTimeout(() => {
      setIsRetrying(false);
    }, 1000);
  };

  // 🌐 WebView로 띄울 HTML 코드 (간단한 방식)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Kakao Map</title>
        <style>
          html, body, #map {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
        </style>
        <!-- autoload=false 꼭 추가 -->
        <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_JS_KEY}&autoload=false"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          function sendMessage(message) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(message);
            }
          }

          window.onload = function() {
            devLog.log("🗺️ Window onload 이벤트");

            // kakao.maps.load 안에서 실행
            kakao.maps.load(function () {
              devLog.log("🗺️ kakao.maps.load 함수 실행");

              var container = document.getElementById('map');
              if (!container) {
                devLog.error("지도 컨테이너를 찾을 수 없습니다");
                sendMessage('MAP_ERROR:지도 컨테이너를 찾을 수 없습니다');
                return;
              }

              var options = {
                center: new kakao.maps.LatLng(${latitude}, ${longitude}),
                level: ${zoom}
              };

              try {
                var map = new kakao.maps.Map(container, options);

                var marker = new kakao.maps.Marker({
                  position: new kakao.maps.LatLng(${latitude}, ${longitude})
                });
                marker.setMap(map);

                // 지도 클릭 이벤트
                kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
                  var latlng = mouseEvent.latLng;
                  
                  // 기존 마커 제거하고 새 마커 생성
                  marker.setMap(null);
                  marker = new kakao.maps.Marker({
                    position: latlng
                  });
                  marker.setMap(map);
                  
                  // React Native로 좌표 전송
                  sendMessage(JSON.stringify({
                    type: 'mapClick',
                    latitude: latlng.getLat(),
                    longitude: latlng.getLng()
                  }));
                });

                devLog.log("🗺️ 지도 생성 완료");
                sendMessage('MAP_LOADED');
              } catch (e) {
                devLog.error("지도 생성 중 오류:", e);
                sendMessage('MAP_ERROR:지도 생성 중 오류: ' + e.message);
              }
            });
          };
        </script>
      </body>
    </html>
  `;


  // 📱 이 함수형 컴포넌트는 View 안에 WebView를 렌더링합니다.
  return (
    <View style={[styles.container, { width, height }]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onLoad={() => {
          // WebView 로드는 성공했지만 지도는 아직 로딩 중일 수 있음
        }}
        onError={(e) => {
          devLog.error("❌ WebView error: ", e.nativeEvent);
          setIsLoading(false);
          setHasError(true);
          setErrorMessage('WebView 로딩 실패');
        }}
        onHttpError={(e) => {
          devLog.error("❌ WebView HTTP error: ", e.nativeEvent);
          setIsLoading(false);
          setHasError(true);
          setErrorMessage('네트워크 오류');
        }}
        injectedJavaScript={`(function() {
          // 콘솔 로그를 React Native로 전달
          const originalLog = console.log;
          console.log = function(message) {
            originalLog.apply(console, arguments);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(String(message));
            }
          };
          
          const originalError = console.error;
          console.error = function(message) {
            originalError.apply(console, arguments);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage('ERROR: ' + String(message));
            }
          };
        })();`}
        onMessage={handleMessage}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        bounces={false}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
      
      {/* 로딩 오버레이 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4495E8" />
          <Text style={styles.loadingText}>지도를 불러오는 중...</Text>
        </View>
      )}
      
      {/* 에러 오버레이 */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>지도를 불러올 수 없습니다</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <Text style={styles.errorSubtext}>네트워크 연결을 확인해주세요</Text>
          {retryCount < 3 && (
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={handleRetry}
              disabled={isRetrying}
            >
              <Text style={styles.retryButtonText}>
                {isRetrying ? '재시도 중...' : '다시 시도'}
              </Text>
            </TouchableOpacity>
          )}
          {retryCount >= 3 && (
            <Text style={styles.errorSubtext}>여러 번 시도했지만 실패했습니다</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 240, 240, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 240, 240, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4495E8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default KakaoMapView;