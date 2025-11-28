#!/bin/bash

# ============================================================
# CharzingApp Android 로컬 빌드 스크립트
# ============================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🤖 CharzingApp Android 빌드 시작${NC}"
echo ""

# 프로젝트 루트로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# 환경변수 로드
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓ .env.production 파일 로드${NC}"
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo -e "${RED}✗ .env.production 파일이 없습니다${NC}"
    echo "  eas env:pull --environment production --path .env.production"
    exit 1
fi

# 빌드 타입 선택
BUILD_TYPE=${1:-"release"}
OUTPUT_TYPE=${2:-"aab"}  # aab 또는 apk

echo -e "${YELLOW}빌드 타입: ${BUILD_TYPE}${NC}"
echo -e "${YELLOW}출력 타입: ${OUTPUT_TYPE}${NC}"
echo ""

# node_modules 확인
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules 설치 중...${NC}"
    yarn install
fi

# Android 디렉토리로 이동
cd android

# 캐시 정리 (선택사항)
if [ "$3" == "--clean" ]; then
    echo -e "${YELLOW}🧹 Gradle 캐시 정리 중...${NC}"
    ./gradlew clean
fi

# 빌드 실행
if [ "$OUTPUT_TYPE" == "apk" ]; then
    echo -e "${GREEN}📱 APK 빌드 중... (테스트용)${NC}"
    ./gradlew assembleRelease
    OUTPUT_PATH="app/build/outputs/apk/release/app-release.apk"
else
    echo -e "${GREEN}📦 AAB 빌드 중... (Play Store용)${NC}"
    ./gradlew bundleRelease
    OUTPUT_PATH="app/build/outputs/bundle/release/app-release.aab"
fi

# 빌드 완료
if [ -f "$OUTPUT_PATH" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)
    echo ""
    echo -e "${GREEN}✅ 빌드 성공!${NC}"
    echo -e "   파일: ${OUTPUT_PATH}"
    echo -e "   크기: ${FILE_SIZE}"

    # 출력 파일 프로젝트 루트로 복사
    cp "$OUTPUT_PATH" "$PROJECT_ROOT/build-$(date +%Y%m%d_%H%M%S).${OUTPUT_TYPE}"
    echo -e "   복사됨: build-$(date +%Y%m%d_%H%M%S).${OUTPUT_TYPE}"
else
    echo -e "${RED}✗ 빌드 실패${NC}"
    exit 1
fi
