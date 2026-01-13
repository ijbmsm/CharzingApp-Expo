export interface ReservationInfo {
  vehicle: {
    make: string;      // 브랜드
    model: string;     // 모델명
    year: number;      // 연식
  };
  vehiclePlateNumber?: string;  // 차량번호
  address: string;
  detailAddress?: string;
  requestedDate: string;  // ISO string
  serviceType: 'standard' | 'premium';
  notes?: string;
  referralCodeUsed?: string;  // 추천 코드 (선택)
}

export interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  reservationId?: string;        // 기존 예약 연결용 (옵션)
  reservationInfo?: ReservationInfo;  // 새 예약 생성용 (옵션)
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
}

export interface ConfirmPaymentResponse {
  success: true;
  paymentId: string;
  reservationId?: string;  // 새로 생성된 예약 ID
  receiptUrl: string | null;
  message?: string;
  // ⭐ 영수증 표시용 추가 필드
  approvedAt?: string; // ISO 날짜 문자열
  method?: string; // PaymentMethod
  card?: {
    company: string; // 카드사 (예: "신한")
    number: string; // 카드번호 마스킹 (예: "1234-****-****-5678")
    cardType: string; // 카드 타입 (신용/체크/기프트)
    installmentPlanMonths: number; // 할부 개월 (0이면 일시불)
  };
}

export interface CancelPaymentRequest {
  paymentId: string;
  cancelReason: string;
  cancelAmount?: number;
}

export interface CancelPaymentResponse {
  success: true;
  status: 'CANCELED' | 'PARTIAL_CANCELED';
  balanceAmount: number;
  cancelAmount: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type FunctionResponse<T> = T | ErrorResponse;
