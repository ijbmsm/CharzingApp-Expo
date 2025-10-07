#!/bin/bash

echo "🚀 프로덕션 빌드 시작..."

# 환경 변수 설정
export NODE_ENV=production

# 캐시 클리어
echo "🧹 캐시 정리..."
npx expo r -c
rm -rf node_modules/.cache

echo "📦 Dependencies 설치..."
npm install

echo "🏗 프로덕션 빌드 실행 (같은 Firebase/Bundle ID 사용)..."

# iOS 프로덕션 빌드
if [ "$1" == "ios" ] || [ "$1" == "all" ]; then
    echo "🍎 iOS 프로덕션 빌드..."
    eas build --platform ios --profile production
fi

# Android 프로덕션 빌드
if [ "$1" == "android" ] || [ "$1" == "all" ]; then
    echo "🤖 Android 프로덕션 빌드..."
    eas build --platform android --profile production
fi

echo "✅ 빌드 완료! (동일한 DB/설정 사용)"