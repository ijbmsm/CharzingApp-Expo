#!/bin/bash

# ============================================================
# CharzingApp iOS 로컬 빌드 스크립트
# ============================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🍎 CharzingApp iOS 빌드 시작${NC}"
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
    exit 1
fi

# node_modules 확인
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules 설치 중...${NC}"
    yarn install
fi

# iOS 디렉토리로 이동
cd ios

# Pod 설치 확인
if [ ! -d "Pods" ] || [ "Podfile" -nt "Pods/Manifest.lock" ]; then
    echo -e "${YELLOW}📦 CocoaPods 설치 중...${NC}"
    pod install
fi

# 빌드 설정
SCHEME="app"
WORKSPACE="app.xcworkspace"
CONFIGURATION="Release"
ARCHIVE_PATH="$PROJECT_ROOT/build/CharzingApp.xcarchive"
EXPORT_PATH="$PROJECT_ROOT/build"

# 캐시 정리 (선택사항)
if [ "$1" == "--clean" ]; then
    echo -e "${YELLOW}🧹 빌드 캐시 정리 중...${NC}"
    xcodebuild clean -workspace "$WORKSPACE" -scheme "$SCHEME" -configuration "$CONFIGURATION"
fi

echo -e "${GREEN}📦 Archive 생성 중...${NC}"
echo "   이 작업은 몇 분 소요될 수 있습니다..."
echo ""

# Archive 생성
xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS" \
    CODE_SIGN_STYLE="Manual" \
    | xcpretty || xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS"

# Archive 확인
if [ -d "$ARCHIVE_PATH" ]; then
    echo ""
    echo -e "${GREEN}✅ Archive 생성 성공!${NC}"
    echo -e "   경로: ${ARCHIVE_PATH}"
    echo ""
    echo -e "${YELLOW}📤 IPA 추출을 위해 Xcode에서 Archive를 열어주세요:${NC}"
    echo "   open $ARCHIVE_PATH"
    echo ""
    echo "   또는 Xcode > Window > Organizer에서 확인"
else
    echo -e "${RED}✗ Archive 생성 실패${NC}"
    exit 1
fi
