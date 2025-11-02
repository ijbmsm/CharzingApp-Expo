// 🔧 디버깅을 위한 환경변수 출력
console.log('🔍 app.config.js에서 환경변수 확인:', {
  'EXPO_PUBLIC_KAKAO_REST_API_KEY': !!process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY,
  'EXPO_PUBLIC_KAKAO_CLIENT_SECRET': !!process.env.EXPO_PUBLIC_KAKAO_CLIENT_SECRET,
  'EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY': !!process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY,
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID': !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  'EXPO_PUBLIC_CLOUD_FUNCTION_URL': !!process.env.EXPO_PUBLIC_CLOUD_FUNCTION_URL
});

console.log('🔍 실제 값들:', {
  'KAKAO_REST_API_KEY': process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY?.substring(0, 8) + '...',
  'KAKAO_CLIENT_SECRET': process.env.EXPO_PUBLIC_KAKAO_CLIENT_SECRET?.substring(0, 8) + '...',
  'KAKAO_JAVASCRIPT_KEY': process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY?.substring(0, 8) + '...'
});

export default {
  expo: {
    name: "차징",
    slug: "CharzingApp-Expo",
    version: "1.0.1",
    sdkVersion: "54.0.0",
    orientation: "portrait",
    icon: "./assets/CharzingLogo3.png",
    scheme: "charzingapp",
    userInterfaceStyle: "automatic",
    description: "한국 1위 전기차 배터리 진단 전문 서비스. 중고 전기차 구매 전 전문가가 직접 방문하여 배터리 상태를 정확히 진단하고 24시간 내 상세한 리포트를 제공합니다.",
    githubUrl: "https://github.com/ijbmsm/CharzingApp-Expo",
    splash: {
      image: "./assets/images/splash.png",
      backgroundColor: "#202632",
      resizeMode: "contain",
      hideExponentText: true
    },
    assetBundlePatterns: [
      "**/*"
    ],
    fonts: [
      "./assets/fonts/LINESeedSansKR-Regular.ttf",
      "./assets/fonts/LINESeedSansKR-Bold.ttf"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.charzingapp",
      jsEngine: "hermes",
      icon: "./assets/CharzingLogo3.png",
      buildNumber: "2",
      requireFullScreen: false,
      infoPlist: {
        KAKAO_APP_KEY: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
        KAKAO_APP_SCHEME: "charzingapp",
        NSLocationWhenInUseUsageDescription: "이 앱은 지도를 표시하고 주변 위치 기반 기능을 위해 현재 위치 접근이 필요합니다.",
        NSUserNotificationUsageDescription: "예약 상태 변경 및 진단 결과 알림을 위해 푸시 알림 권한이 필요합니다.",
        NSCameraUsageDescription: "진단 리포트 사진 촬영을 위해 카메라 접근 권한이 필요합니다.",
        NSPhotoLibraryUsageDescription: "진단 관련 사진을 저장하고 불러오기 위해 사진 라이브러리 접근 권한이 필요합니다.",
        CFBundleDisplayName: "차징",
        CFBundleName: "차징",
        CFBundleURLTypes: [
          {
            CFBundleURLName: "google-signin",
            CFBundleURLSchemes: ["com.googleusercontent.apps.91035459357-lc3tir17pmmomf793bnce1qmstns4rh7"]
          },
          {
            CFBundleURLName: "bundleidentifier",
            CFBundleURLSchemes: ["com.charzingapp"]
          },
          {
            CFBundleURLName: "kakao-login",
            CFBundleURLSchemes: ["charzingapp"]
          }
        ]
      },
      config: {
        usesNonExemptEncryption: false
      },
      associatedDomains: ["applinks:charzing.kr"]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/CharzingLogo3.png",
        backgroundColor: "#ffffff"
      },
      icon: "./assets/CharzingLogo3.png",
      package: "com.charzingapp",
      jsEngine: "hermes",
      versionCode: 2,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
        "WAKE_LOCK",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      softwareKeyboardLayoutMode: "pan",
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "https",
              host: "charzing.kr"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        },
        {
          action: "VIEW",
          data: [
            {
              scheme: "charzingapp"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon/favicon-32x32.png"
    },
    plugins: [
      "expo-dev-client",
      "expo-apple-authentication",
      "expo-font",
      "expo-router",
      "expo-web-browser",
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: "com.googleusercontent.apps.91035459357-lc3tir17pmmomf793bnce1qmstns4rh7",
          androidClientId: "91035459357-lc3tir17pmmomf793bnce1qmstns4rh7.apps.googleusercontent.com"
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            extraMavenRepos: ["https://devrepo.kakao.com/nexus/content/groups/public/"]
          }
        }
      ]
    ],
    extra: {
      KAKAO_NATIVE_APP_KEY: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
      KAKAO_REST_API_KEY: process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY,
      KAKAO_CLIENT_SECRET: process.env.EXPO_PUBLIC_KAKAO_CLIENT_SECRET,
      KAKAO_JAVASCRIPT_KEY: process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY,
      CLOUD_FUNCTION_URL: process.env.EXPO_PUBLIC_CLOUD_FUNCTION_URL,
      GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      router: {},
      eas: {
        projectId: "0a4659e9-07ec-460c-a1ce-6d6bf87b9aa7"
      }
    },
    owner: "sungminyou"
  }
};