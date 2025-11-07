const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Firebase Functions 디렉토리 제외
config.resolver.blockList = [
  /functions\/.*/, // functions 디렉토리 전체 제외
  /functions\/lib\/.*/, // functions/lib 디렉토리 제외
  /functions\/node_modules\/.*/, // functions/node_modules 제외
];

// React 19 JSX runtime 해결
config.resolver.alias = {
  'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
  'react/jsx-runtime': 'react/jsx-runtime.js',
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