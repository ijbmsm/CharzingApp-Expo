#!/bin/bash

# 개발 환경에서만 작동하는 로그로 변경하는 스크립트

echo "🔧 로그를 개발 환경 전용으로 변경 중..."

# 주요 파일들 목록
files=(
  "src/services/notificationService.ts"
  "src/services/firebaseService.ts"
  "src/services/analyticsService.ts"
  "src/screens/MyPageScreen.tsx"
  "src/screens/DiagnosisReportScreen.tsx"
  "src/screens/DiagnosisReservationScreen.tsx"
  "src/components/KakaoMapView.tsx"
  "src/components/AddressSearch.tsx"
)

# 각 파일에 devLog import 추가 및 console 교체
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 처리 중: $file"
    
    # devLog import가 없으면 추가
    if ! grep -q "import devLog" "$file"; then
      # import 구문 다음에 devLog import 추가
      if grep -q "^import" "$file"; then
        # 마지막 import 문 다음에 추가
        last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        sed -i '' "${last_import_line}a\\
import devLog from '../utils/devLog';
" "$file"
      else
        # import가 없으면 파일 상단에 추가
        sed -i '' '1i\
import devLog from "../utils/devLog";
' "$file"
      fi
    fi
    
    # console.log를 devLog.log로 교체
    sed -i '' 's/console\.log(/devLog.log(/g' "$file"
    sed -i '' 's/console\.error(/devLog.error(/g' "$file"
    sed -i '' 's/console\.warn(/devLog.warn(/g' "$file"
    sed -i '' 's/console\.info(/devLog.info(/g' "$file"
    
    echo "✅ 완료: $file"
  else
    echo "⚠️ 파일 없음: $file"
  fi
done

echo "🎉 로그 개발 환경 전용 변경 완료!"
echo "ℹ️ 운영 환경에서는 모든 devLog가 자동으로 비활성화됩니다."