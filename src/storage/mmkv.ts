import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage Wrapper
 * - AsyncStorage 기반 저장소
 */
class StorageWrapper {
  constructor() {
    console.log('✅ Storage: AsyncStorage 사용');
  }

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async getAllKeys(): Promise<readonly string[]> {
    return await AsyncStorage.getAllKeys();
  }

  async contains(key: string): Promise<boolean> {
    const keys = await AsyncStorage.getAllKeys();
    return keys.includes(key);
  }
}

// 싱글턴
export const storage = new StorageWrapper();

// Draft 데이터 구조 인터페이스
export interface DraftWithMetadata {
  data: unknown;
  savedAt: string;
  version: string;
  userInfo: {
    userId: string;
    userName: string;
    userPhone: string;
  };
}

// Draft Storage Helper
export const draftStorage = {
  /**
   * 사용자별 draft 저장 (사용자 정보 포함)
   */
  saveDraft: async (
    userId: string,
    data: unknown,
    userInfo: { userName: string; userPhone: string }
  ): Promise<boolean> => {
    try {
      const draftWithTimestamp: DraftWithMetadata = {
        data,
        savedAt: new Date().toISOString(),
        version: '1.0',
        userInfo: {
          userId,
          userName: userInfo.userName,
          userPhone: userInfo.userPhone,
        },
      };
      await storage.setItem(`inspection_draft_${userId}`, JSON.stringify(draftWithTimestamp));
      console.log('💾 Draft 저장 성공:', { userId, userName: userInfo.userName });
      return true;
    } catch (error) {
      console.error('❌ Draft 저장 실패:', error);
      return false;
    }
  },

  /**
   * 사용자별 draft 불러오기 (7일 이상 된 draft는 삭제)
   */
  loadDraft: async (userId: string): Promise<any | null> => {
    try {
      const draft = await storage.getItem(`inspection_draft_${userId}`);
      if (!draft) {
        console.log('📭 Draft 없음:', userId);
        return null;
      }

      const parsed = JSON.parse(draft);
      const savedAt = new Date(parsed.savedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24);

      // 7일 이상 된 draft 삭제
      if (daysDiff > 7) {
        console.log('🗑️ 오래된 Draft 삭제:', userId);
        await storage.removeItem(`inspection_draft_${userId}`);
        return null;
      }

      console.log('📬 Draft 불러오기 성공:', { userId, savedAt: parsed.savedAt, dataSize: JSON.stringify(parsed.data).length });
      return parsed.data;
    } catch (error) {
      console.error('❌ Draft 불러오기 실패:', error);
      return null;
    }
  },

  /**
   * draft 삭제
   */
  clearDraft: async (userId: string): Promise<boolean> => {
    try {
      await storage.removeItem(`inspection_draft_${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Draft 삭제 실패:', error);
      return false;
    }
  },

  /**
   * 모든 draft 키 목록
   */
  getAllDraftKeys: async (): Promise<string[]> => {
    try {
      const keys = await storage.getAllKeys();
      return keys.filter((k: string) => k.startsWith('inspection_draft_'));
    } catch (error) {
      console.error('❌ Draft 키 목록 조회 실패:', error);
      return [];
    }
  },

  /**
   * draft 존재 여부 확인
   */
  hasDraft: async (userId: string): Promise<boolean> => {
    return await storage.contains(`inspection_draft_${userId}`);
  },

  /**
   * draft 저장 시간 조회
   */
  getDraftSavedTime: async (userId: string): Promise<Date | null> => {
    try {
      const draft = await storage.getItem(`inspection_draft_${userId}`);
      if (!draft) return null;

      const parsed = JSON.parse(draft);
      return new Date(parsed.savedAt);
    } catch (error) {
      return null;
    }
  },

  /**
   * 마지막 열람 시간 저장 (30초 규칙용)
   */
  saveLastOpened: async (userId: string): Promise<void> => {
    try {
      const key = `last_opened_${userId}`;
      await storage.setItem(key, Date.now().toString());
    } catch (error) {
      console.error('❌ lastOpened 저장 실패:', error);
    }
  },

  /**
   * 마지막 열람 시간 조회 (30초 규칙용)
   */
  getLastOpened: async (userId: string): Promise<number | null> => {
    try {
      const key = `last_opened_${userId}`;
      const value = await storage.getItem(key);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.error('❌ lastOpened 조회 실패:', error);
      return null;
    }
  },

  /**
   * 모든 임시저장 목록 조회 (사용자 정보 포함)
   */
  getAllDraftsWithUserInfo: async (): Promise<Array<{
    userId: string;
    userName: string;
    userPhone: string;
    savedAt: Date;
    dataSize: number;
  }>> => {
    try {
      const draftKeys = await draftStorage.getAllDraftKeys();
      const drafts: Array<{
        userId: string;
        userName: string;
        userPhone: string;
        savedAt: Date;
        dataSize: number;
      }> = [];

      for (const key of draftKeys) {
        const draftStr = await storage.getItem(key);
        if (!draftStr) continue;

        try {
          const parsed: DraftWithMetadata = JSON.parse(draftStr);
          const savedAt = new Date(parsed.savedAt);
          const now = new Date();
          const daysDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24);

          // 7일 이상 된 draft는 스킵 (자동 정리)
          if (daysDiff > 7) {
            console.log('🗑️ 오래된 Draft 자동 삭제:', key);
            await storage.removeItem(key);
            continue;
          }

          drafts.push({
            userId: parsed.userInfo.userId,
            userName: parsed.userInfo.userName,
            userPhone: parsed.userInfo.userPhone,
            savedAt: savedAt,
            dataSize: JSON.stringify(parsed.data).length,
          });
        } catch (parseError) {
          console.error('❌ Draft 파싱 실패:', key, parseError);
        }
      }

      // 최신순 정렬
      drafts.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());

      console.log(`📋 임시저장 목록 조회: ${drafts.length}건`);
      return drafts;
    } catch (error) {
      console.error('❌ 임시저장 목록 조회 실패:', error);
      return [];
    }
  },
};
