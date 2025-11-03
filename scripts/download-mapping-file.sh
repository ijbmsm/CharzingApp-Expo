#!/bin/bash

# Play Console 업로드용 ProGuard/R8 매핑 파일 다운로드 스크립트
# EAS Build에서 빌드된 앱의 매핑 파일을 다운로드합니다.

set -e

echo "🔍 EAS Build 매핑 파일 다운로드 스크립트"
echo "========================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 출력 디렉토리
OUTPUT_DIR="./android-mapping-files"
mkdir -p "$OUTPUT_DIR"

echo "📦 최근 Android 빌드 목록 조회 중..."
echo ""

# 최근 5개의 Android 빌드 목록 조회
eas build:list --platform android --limit 5 --json > /tmp/eas-builds.json

# jq로 빌드 목록 파싱
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq가 설치되어 있지 않습니다.${NC}"
    echo "jq 설치: brew install jq"
    exit 1
fi

# 빌드 목록 출력
echo "최근 5개의 Android 빌드:"
echo "------------------------"
jq -r '.[] | "\(.id) - \(.status) - \(.createdAt) - \(.buildProfile)"' /tmp/eas-builds.json | nl
echo ""

# 빌드 ID 입력 받기
echo -e "${YELLOW}다운로드할 빌드 번호를 선택하세요 (1-5):${NC}"
read -r BUILD_NUMBER

# 선택한 빌드 ID 추출
BUILD_ID=$(jq -r ".[$((BUILD_NUMBER-1))].id" /tmp/eas-builds.json)

if [ "$BUILD_ID" = "null" ] || [ -z "$BUILD_ID" ]; then
    echo -e "${RED}❌ 잘못된 빌드 번호입니다.${NC}"
    exit 1
fi

echo ""
echo "📥 빌드 ID: $BUILD_ID"
echo "매핑 파일 다운로드 중..."

# 매핑 파일 다운로드 시도
if eas build:view "$BUILD_ID" --json > /tmp/build-details.json; then
    # 빌드 정보에서 아티팩트 URL 추출
    ARTIFACTS=$(jq -r '.artifacts' /tmp/build-details.json)

    if [ "$ARTIFACTS" = "null" ]; then
        echo -e "${YELLOW}⚠️  이 빌드에는 매핑 파일이 없습니다.${NC}"
        echo ""
        echo "매핑 파일이 생성되려면 다음 조건이 필요합니다:"
        echo "1. android/app/build.gradle에서 minifyEnabled true 설정"
        echo "2. Production 프로필로 빌드"
        echo ""
        echo "현재 설정을 확인하려면 android/app/build.gradle을 확인하세요."
        exit 1
    fi

    # 매핑 파일 URL 찾기
    MAPPING_URL=$(echo "$ARTIFACTS" | jq -r '.buildArtifacts[] | select(.type == "MAPPING") | .url' 2>/dev/null || echo "")

    if [ -z "$MAPPING_URL" ] || [ "$MAPPING_URL" = "null" ]; then
        echo -e "${YELLOW}⚠️  매핑 파일 URL을 찾을 수 없습니다.${NC}"
        echo ""
        echo "대안: 직접 EAS 웹사이트에서 다운로드하세요:"
        echo "https://expo.dev/accounts/sungminyou/projects/CharzingApp-Expo/builds/$BUILD_ID"
        exit 1
    fi

    # 매핑 파일 다운로드
    OUTPUT_FILE="$OUTPUT_DIR/mapping-$BUILD_ID.txt"
    if curl -L "$MAPPING_URL" -o "$OUTPUT_FILE"; then
        echo ""
        echo -e "${GREEN}✅ 매핑 파일 다운로드 완료!${NC}"
        echo ""
        echo "파일 위치: $OUTPUT_FILE"
        echo "파일 크기: $(du -h "$OUTPUT_FILE" | cut -f1)"
        echo ""
        echo -e "${GREEN}🎉 이 파일을 Play Console에 업로드하세요.${NC}"
        echo ""
        echo "업로드 방법:"
        echo "1. Play Console → 앱 → 프로덕션 → 출시 선택"
        echo "2. '난독화 파일' 섹션에서 '업로드' 클릭"
        echo "3. $OUTPUT_FILE 파일 드래그 앤 드롭"
    else
        echo -e "${RED}❌ 매핑 파일 다운로드 실패${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ 빌드 정보 조회 실패${NC}"
    exit 1
fi

# 임시 파일 정리
rm -f /tmp/eas-builds.json /tmp/build-details.json

echo ""
echo "========================================="
echo "완료!"
