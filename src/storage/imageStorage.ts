import { Paths, Directory, File } from 'expo-file-system';
import sentryLogger from '../utils/sentryLogger';

/**
 * 이미지 임시저장 디렉토리
 * - 새 expo-file-system API 사용
 * - Lazy initialization (사용할 때 자동 생성)
 */
const DRAFT_DIR = new Directory(Paths.document, 'inspection_drafts');

/**
 * 이미지 Draft Storage Helper
 * - 로컬 이미지를 앱 전용 디렉토리에 복사
 * - 앱 재시작 후에도 유지됨
 * - Firebase URL은 그대로 보존
 * - Lazy initialization (첫 사용 시 디렉토리 자동 생성)
 */
let isInitialized = false;

/**
 * 디렉토리 초기화 (내부용 - 첫 사용 시 자동 호출)
 */
async function ensureDirectoryExists() {
  if (isInitialized) return;

  try {
    if (!DRAFT_DIR.exists) {
      await DRAFT_DIR.create();
      console.log('✅ Draft 이미지 디렉토리 생성:', DRAFT_DIR.uri);
    }
    isInitialized = true;
  } catch (error) {
    sentryLogger.logError('Draft 디렉토리 생성 실패', error as Error);
    throw error;
  }
}

export const imageStorage = {

  /**
   * 이미지 URI 배열을 draft용으로 저장
   * - file:// URI → 복사본 생성 (검증 포함)
   * - https:// URI (Firebase) → 그대로 반환
   * - 이미 inspection_drafts에 있는 파일 → 그대로 보존
   */
  saveImages: async (userId: string, imageUris: string[], category: string): Promise<string[]> => {
    await ensureDirectoryExists(); // 🔥 Lazy init

    try {
      const savedUris: string[] = [];

      for (let i = 0; i < imageUris.length; i++) {
        const uri = imageUris[i];

        // undefined 스킵
        if (!uri) continue;

        // Firebase URL은 그대로 보존
        if (uri.startsWith('https://') || uri.startsWith('http://')) {
          savedUris.push(uri);
          continue;
        }

        // 이미 inspection_drafts에 있는 파일은 그대로 유지
        if (uri.includes('inspection_drafts')) {
          const existingFile = new File(uri);
          if (existingFile.exists) {
            savedUris.push(uri);
            console.log(`✅ 기존 draft 이미지 유지: ${uri.slice(-50)}`);
            continue;
          } else {
            // 파일이 없으면 원본이 살아있을 수 있으므로 계속 진행
            console.warn(`⚠️ Draft 파일 없음, 재복사 시도: ${uri.slice(-50)}`);
          }
        }

        // 로컬 이미지 복사
        const filename = `${userId}_${category}_${Date.now()}_${i}.jpg`;
        const sourceFile = new File(uri);
        const destFile = new File(DRAFT_DIR, filename);

        // 🔥 소스 파일 존재 확인
        if (!sourceFile.exists) {
          console.error(`❌ 소스 파일 없음: ${uri.slice(-50)}`);
          sentryLogger.logError('Draft 이미지 소스 없음', new Error('Source file not found'), {
            userId,
            category,
            sourceUri: uri.slice(-100),
          });
          // 원본이 없으면 저장 불가 - 빈 상태로 계속
          continue;
        }

        try {
          await sourceFile.copy(destFile);

          // 🔥 복사 후 검증
          if (!destFile.exists) {
            throw new Error('복사 후 파일이 존재하지 않음');
          }

          savedUris.push(destFile.uri);
          console.log(`💾 이미지 복사 성공: ${uri.slice(-30)} → ${destFile.uri.slice(-50)}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`❌ 이미지 복사 실패: ${uri.slice(-50)}`, errorMsg);
          sentryLogger.logError('Draft 이미지 복사 실패', error as Error, {
            userId,
            category,
            sourceUri: uri.slice(-100),
            destUri: destFile.uri.slice(-100),
            sourceExists: sourceFile.exists,
          });
          // ❌ 복사 실패 시 원본 URI 반환하지 않음 (나중에 iOS가 삭제할 수 있음)
          // 대신 빈 상태로 계속 - 사용자에게 다시 촬영하도록 안내 필요
        }
      }

      return savedUris;
    } catch (error) {
      sentryLogger.logError('이미지 저장 전체 실패', error as Error, { userId, category });
      return []; // ❌ 실패 시 빈 배열 반환 (원본 URI 반환하지 않음)
    }
  },

  /**
   * 특정 사용자의 모든 draft 이미지 삭제
   */
  clearUserImages: async (userId: string) => {
    try {
      if (!DRAFT_DIR.exists) return;

      const items = DRAFT_DIR.list();
      const userFiles = items.filter((item) => item instanceof File && item.name.startsWith(userId));

      // 🔥 삭제 전 로깅 (디버깅용)
      const fileNames = userFiles.map((f) => (f as File).name);
      console.log(`🗑️ clearUserImages 호출:`, { userId, fileCount: userFiles.length, files: fileNames });
      sentryLogger.log('🗑️ clearUserImages 호출', { userId, fileCount: userFiles.length, files: fileNames.slice(0, 10) });

      for (const file of userFiles) {
        await file.delete();
      }

      console.log(`✅ Draft 이미지 삭제 완료 (${userFiles.length}개):`, userId);
    } catch (error) {
      sentryLogger.logError('Draft 이미지 삭제 실패', error as Error, { userId });
    }
  },

  /**
   * 7일 이상 된 모든 draft 이미지 삭제 (정리)
   * - 선택적 사용 (앱 시작 시가 아닌 필요할 때만)
   */
  cleanupOldImages: async () => {
    try {
      if (!DRAFT_DIR.exists) return;

      const items = DRAFT_DIR.list();
      const now = Date.now();
      let deletedCount = 0;

      for (const item of items) {
        if (!(item instanceof File)) continue;

        try {
          const info = item.info();
          if (info.modificationTime) {
            const ageInDays = (now - info.modificationTime) / (1000 * 60 * 60 * 24);

            if (ageInDays > 7) {
              await item.delete();
              deletedCount++;
            }
          }
        } catch (error) {
          // 파일 정보 조회 실패 시 스킵 (이미 삭제되었을 수 있음)
          continue;
        }
      }

      if (deletedCount > 0) {
        console.log(`🗑️ 오래된 draft 이미지 ${deletedCount}개 삭제`);
      }
    } catch (error) {
      sentryLogger.logError('오래된 이미지 정리 실패', error as Error);
    }
  },

  /**
   * 이미지 URI가 draft 경로인지 확인
   */
  isDraftImage: (uri: string): boolean => {
    return uri.startsWith(DRAFT_DIR.uri);
  },

  /**
   * 디렉토리 전체 삭제 (테스트/디버깅용)
   */
  clearAll: async () => {
    try {
      if (DRAFT_DIR.exists) {
        await DRAFT_DIR.delete();
      }
      await DRAFT_DIR.create();
      isInitialized = true;
      console.log('🗑️ 모든 draft 이미지 삭제');
    } catch (error) {
      sentryLogger.logError('Draft 디렉토리 삭제 실패', error as Error);
    }
  },
};
