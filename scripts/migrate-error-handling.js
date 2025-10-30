/**
 * 에러 처리 시스템 마이그레이션 스크립트
 * 29개 파일의 console.error/warn을 새로운 errorHandler로 교체
 */

const fs = require('fs');
const path = require('path');

// 처리할 파일들과 대체 규칙
const FILES_TO_PROCESS = [
  'src/screens/ReservationDetailScreen.tsx',
  'src/screens/ReservationScreen.tsx', 
  'src/screens/BatteryInfoScreen.tsx',
  'src/screens/DiagnosticTabScreen.tsx',
  'src/screens/DiagnosisReportListScreen.tsx',
  'src/components/KakaoMapView.tsx',
  'src/services/userService.ts',
  'src/services/firebase/config.ts',
  'src/services/firebase/FirebaseInitializationService.ts',
  'src/services/logService.ts',
  'src/services/firebase.ts',
  'src/services/auth/SmartAuthService.ts',
  'src/services/auth/TokenManager.ts',
  'src/services/auth/AuthRecoveryService.ts',
  'src/services/auth/UserProfileManager.ts',
  'src/utils/logger.ts',
  'src/utils/devLog.ts',
  'src/components/KakaoMapView_WebView_Backup.tsx',
  'src/components/SmartAuthProvider.tsx',
  'src/screens/SignupCompleteScreen.tsx',
  'src/screens/VehicleDiagnosisReportScreen.tsx',
  'src/screens/ModifyReservationScreen.tsx'
];

// 에러 핸들러 import 추가
const ERROR_HANDLER_IMPORT = "import { handleError, handleFirebaseError, handleNetworkError, handleAuthError, showUserError } from '../services/errorHandler';";

// 교체 패턴들
const REPLACEMENT_PATTERNS = [
  // Firebase 관련 에러
  {
    pattern: /console\.error\(['"`](.*Firebase.*|.*firebase.*|.*Firestore.*|.*firestore.*)['"`,]/g,
    replacement: "handleFirebaseError(error, { actionName: 'firebase_operation' }); // "
  },
  
  // 인증 관련 에러
  {
    pattern: /console\.error\(['"`](.*auth.*|.*Auth.*|.*로그인.*|.*login.*)['"`,]/g,
    replacement: "handleAuthError(error); // "
  },
  
  // 네트워크 관련 에러
  {
    pattern: /console\.error\(['"`](.*network.*|.*Network.*|.*네트워크.*|.*연결.*)['"`,]/g,
    replacement: "handleNetworkError(error); // "
  },
  
  // 일반적인 console.error 패턴
  {
    pattern: /console\.error\((['"`][^'"`,]+['"`]),?\s*error\);?/g,
    replacement: "handleError(error, 'unknown', 'medium', { actionName: 'generic_error' }); // $1"
  },
  
  // console.warn 패턴
  {
    pattern: /console\.warn\((['"`][^'"`,]+['"`]),?\s*([^)]+)\);?/g,
    replacement: "handleError($2, 'unknown', 'low', { customMessage: $1 }); // "
  }
];

function migrateFile(filePath) {
  const fullPath = path.join('/Users/sungmin/CharzingApp-Expo', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  파일이 존재하지 않음: ${filePath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // 이미 errorHandler가 import되어 있는지 확인
    const hasErrorHandlerImport = content.includes("from '../services/errorHandler'") || 
                                  content.includes("from './errorHandler'") ||
                                  content.includes("from '../../services/errorHandler'");

    let changesMade = false;

    // errorHandler import 추가 (아직 없다면)
    if (!hasErrorHandlerImport && content.includes('console.error')) {
      // import 섹션을 찾아서 추가
      const importMatch = content.match(/import[^;]+from\s+['"][^'"]+['"];?\s*\n/g);
      if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        
        // 상대 경로 조정
        let importPath = '../services/errorHandler';
        if (filePath.includes('services/')) {
          importPath = './errorHandler';
        } else if (filePath.includes('components/') || filePath.includes('utils/')) {
          importPath = '../services/errorHandler';
        } else if (filePath.includes('screens/')) {
          importPath = '../services/errorHandler';
        }

        const errorHandlerImport = `import { handleError, handleFirebaseError, handleNetworkError, handleAuthError, showUserError } from '${importPath}';\n`;
        content = content.slice(0, lastImportIndex) + errorHandlerImport + content.slice(lastImportIndex);
        changesMade = true;
      }
    }

    // 패턴 기반 교체 수행
    REPLACEMENT_PATTERNS.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        changesMade = true;
        console.log(`  📝 ${matches.length}개 패턴 교체: ${pattern.source.substring(0, 50)}...`);
      }
    });

    // 파일 저장
    if (changesMade) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ 마이그레이션 완료: ${filePath}`);
      return true;
    } else {
      console.log(`➖ 변경사항 없음: ${filePath}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ 마이그레이션 실패: ${filePath}`, error.message);
    return false;
  }
}

// 메인 실행 함수
function main() {
  console.log('🚀 에러 처리 시스템 마이그레이션 시작...\n');

  let successCount = 0;
  let totalCount = 0;

  FILES_TO_PROCESS.forEach(filePath => {
    totalCount++;
    console.log(`\n[${totalCount}/${FILES_TO_PROCESS.length}] ${filePath} 처리 중...`);
    
    if (migrateFile(filePath)) {
      successCount++;
    }
  });

  console.log(`\n📊 마이그레이션 완료:`);
  console.log(`   ✅ 성공: ${successCount}개 파일`);
  console.log(`   ➖ 변경없음: ${totalCount - successCount}개 파일`);
  console.log(`   📁 총계: ${totalCount}개 파일`);
  
  if (successCount > 0) {
    console.log(`\n🎉 에러 처리 시스템 마이그레이션이 완료되었습니다!`);
    console.log(`   프로덕션 배포 시 민감한 정보가 보호됩니다.`);
  }
}

// 실행
main();