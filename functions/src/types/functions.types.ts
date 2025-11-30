export interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  reservationId?: string;
  reservationInfo?: {
    requestedDate: string;
    vehicle: {
      make: string;
      model: string;
      year: number;
    };
    address: string;
    detailAddress: string;
    serviceType: string;
    notes?: string;
  };
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
