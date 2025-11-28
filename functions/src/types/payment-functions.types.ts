export interface ReservationInfo {
  vehicle: {
    make: string;      // 브랜드
    model: string;     // 모델명
    year: number;      // 연식
  };
  address: string;
  detailAddress?: string;
  requestedDate: string;  // ISO string
  serviceType: 'standard' | 'premium';
  notes?: string;
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
