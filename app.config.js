
export default {
  expo: {
    name: "차징",
    slug: "CharzingApp-Expo",
    version: "1.1.2",

    // Reanimated 호환성을 위해 Old Architecture 사용
    newArchEnabled: false,

    orientation: "portrait",
    icon: "./src/assets/charzingLogo/ios/AppIcon~ios-marketing.png",
    scheme: "charzingapp",
    userInterfaceStyle: "automatic",

    description:
      "한국 1위 전기차 배터리 진단 전문 서비스. 중고 전기차 구매 전 전문가가 직접 방문하여 배터리 상태를 정확히 진단하고 24시간 내 상세한 리포트를 제공합니다.",

    githubUrl: "https://github.com/ijbmsm/CharzingApp-Expo",

    splash: {
      image: "./assets/images/splash.png",
      backgroundColor: "#FFFFFF",
      resizeMode: "contain",
      hideExponentText: true,
    },

    assetBundlePatterns: ["**/*"],

    fonts: [
      "./assets/fonts/LINESeedSansKR-Regular.ttf",
      "./assets/fonts/LINESeedSansKR-Bold.ttf",
    ],

    // ============================================================
    //  iOS 설정 (Kakao 관련 값 직접 넣지 않는다!)
    // ============================================================
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.charzingapp",
      jsEngine: "hermes",
      icon: "./src/assets/charzingLogo/ios/AppIcon~ios-marketing.png",
      buildNumber: "3",
      requireFullScreen: false,

      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "이 앱은 지도를 표시하고 주변 위치 기반 기능을 위해 현재 위치 접근이 필요합니다.",
        NSUserNotificationUsageDescription:
          "예약 상태 변경 및 진단 결과 알림을 위해 푸시 알림 권한이 필요합니다.",
        NSCameraUsageDescription:
          "진단 리포트 사진 촬영을 위해 카메라 접근 권한이 필요합니다.",
        NSPhotoLibraryUsageDescription:
          "진단 관련 사진을 저장하고 불러오기 위해 사진 라이브러리 접근 권한이 필요합니다.",

        CFBundleDisplayName: "차징",
        CFBundleName: "차징",

        // Kakao 관련 스킴을 직접 넣지 않는다 (자동 설정됨)
        CFBundleURLTypes: [
          {
            CFBundleURLName: "google-signin",
            CFBundleURLSchemes: ["com.googleusercontent.apps.91035459357-lc3tir17pmmomf793bnce1qmstns4rh7"]
          },
          {
            CFBundleURLName: "bundleidentifier",
            CFBundleURLSchemes: ["com.charzingapp"],
          },
        ],
      },

      associatedDomains: ["applinks:charzing.kr"],
      config: { usesNonExemptEncryption: false },
    },

    // ============================================================
    //  Android 설정
    // ============================================================
    android: {
      icon: "./src/assets/charzingLogo/android/play_store_512.png",
      adaptiveIcon: {
        foregroundImage:
          "./src/assets/charzingLogo/android/play_store_512.png",
        backgroundColor: "#FFFFFF",
      },

      package: "com.charzingapp",
      jsEngine: "hermes",
      versionCode: 4,

      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
        "WAKE_LOCK",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
      ],

      softwareKeyboardLayoutMode: "pan",

      androidNavigationBar: {
        visible: "translucent",
        backgroundColor: "#00000000",
      },

      intentFilters: [
        {
          action: "VIEW",
          data: [{ scheme: "https", host: "charzing.kr" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
        {
          action: "VIEW",
          data: [{ scheme: "charzingapp" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon/favicon-96x96.png",
    },

    // ============================================================
    //  플러그인 (⭐ Kakao → build-properties 순서 중요)
    // ============================================================
    plugins: [
      // ⚡ Kakao 플러그인은 가장 먼저
      [
        "@react-native-seoul/kakao-login",
        {
          kakaoAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
        },
      ],

      // Kotlin 2.0.21 강제 + Kakao Maven Repo 추가
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "2.0.21",
            extraMavenRepos: [
              "https://devrepo.kakao.com/nexus/content/groups/public/",
            ],
          },
          ios: {
            deploymentTarget: "15.1",
          },
        },
      ],

      "expo-apple-authentication",
      "expo-font",
      "expo-router",
      "expo-web-browser",

      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: "com.googleusercontent.apps.91035459357-lc3tir17pmmomf793bnce1qmstns4rh7",
          androidClientId: "91035459357-******.apps.googleusercontent.com",
        },
      ],
    ],

    // ============================================================
    //  extra
    // ============================================================
    extra: {
      KAKAO_NATIVE_APP_KEY: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
      KAKAO_REST_API_KEY: process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY,
      KAKAO_CLIENT_SECRET: process.env.EXPO_PUBLIC_KAKAO_CLIENT_SECRET,
      KAKAO_JAVASCRIPT_KEY: process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY,
      CLOUD_FUNCTION_URL: process.env.EXPO_PUBLIC_CLOUD_FUNCTION_URL,
      GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

      SENTRY_DSN:
        process.env.SENTRY_DSN || "https://2b93a60c59c8ba7748ac8f06159206d8@o4510316675989504.ingest.us.sentry.io/4510316677169152",
      eas: { projectId: "0a4659e9-07ec-460c-a1ce-6d6bf87b9aa7" },
    },

    owner: "sungminyou",
  },
};
