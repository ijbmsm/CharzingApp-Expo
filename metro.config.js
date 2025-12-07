const path = require('path');
const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// ✅ @charzing/vehicle-utils 로컬 패키지 watchFolders 추가
const vehicleUtilsPath = path.resolve(__dirname, '../charzing-vehicle-utils');
config.watchFolders = [vehicleUtilsPath];

// Firebase Functions 디렉토리 제외 (프로젝트 루트의 functions 폴더만)
config.resolver.blockList = [
  /^functions\//, // 프로젝트 루트의 functions 디렉토리만 제외
  /\/functions\/lib\//, // functions/lib 디렉토리 제외
  /\/functions\/node_modules\//, // functions/node_modules 제외
];

// React 19 JSX runtime 해결 + vehicle-utils 로컬 경로
config.resolver.alias = {
  'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
  'react/jsx-runtime': 'react/jsx-runtime.js',
  '@charzing/vehicle-utils': vehicleUtilsPath,
};

// Metro 서버 커스터마이즈
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    return (req, res, next) => {
      // 브랜딩 정보 출력
      if (req.url === '/') {
        console.log('🚗 차징 앱 번들링 중...');
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;