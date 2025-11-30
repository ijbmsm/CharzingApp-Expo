// Toss Payments 공식 카드사 코드 (2025-11-30 업데이트)
// 출처: https://docs.tosspayments.com/codes/org-codes#카드사-코드
export const CARD_COMPANY_MAP: Record<string, string> = {
  // 주요 은행/카드사
  '11': 'KB국민카드',
  '15': '카카오뱅크',
  '21': '하나카드',
  '24': '토스뱅크',          // ⭐ 수정됨 (기존: 수협카드)
  '30': '한국산업은행',
  '31': 'BC카드',
  '33': '우리BC카드',
  '34': '수협은행',          // ⭐ 추가됨 (Sh수협은행)
  '35': '전북은행',
  '36': '씨티카드',
  '37': '우체국예금보험',
  '38': '새마을금고',
  '39': '저축은행중앙회',
  '3A': '케이뱅크',          // ⭐ 수정됨 (기존: '38')
  '3K': '기업BC',
  '41': '신한카드',
  '42': '제주은행',
  '46': '광주은행',
  '51': '삼성카드',
  '61': '현대카드',
  '62': '신협',
  '71': '롯데카드',
  '91': 'NH농협카드',
  'W1': '우리카드',
} as const;

export function getCardCompanyName(code: string): string {
  return CARD_COMPANY_MAP[code] || '기타';
}
