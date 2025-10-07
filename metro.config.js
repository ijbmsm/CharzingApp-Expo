const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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

module.exports = config;