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
  receiptUrl: string | null;
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
