/**
 * 결제 관련 타입 정의
 * 웹(charzing)과 동일한 명세 사용
 */

// 토스 결제 상태
export type PaymentStatus =
  | 'READY'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_DEPOSIT'
  | 'DONE'
  | 'CANCELED'
  | 'PARTIAL_CANCELED'
  | 'ABORTED'
  | 'EXPIRED';

// 결제 수단
export type PaymentMethod = '카드' | '가상계좌' | '간편결제' | '휴대폰' | '계좌이체' | '상품권';

// 취소 상태
export type CancelStatus = 'DONE' | 'FAILED';

// 카드 소유자 타입
export type CardOwnerType = '개인' | '법인';

// 카드 타입
export type CardType = '신용' | '체크' | '기프트';

// 결제 수단 상세 정보
export interface PaymentMethodDetails {
  type: PaymentMethod;
  card?: {
    company: string;
    number: string;
    cardType: CardType;
    ownerType: CardOwnerType;
    installmentPlanMonths: number;
    approveNo: string;
  };
  easyPay?: {
    provider: string;
    amount: number;
    discountAmount: number;
  };
  virtualAccount?: {
    bank: string;
    accountNumber: string;
    dueDate: Date;
  };
}

// 취소 기록
export interface CancelRecord {
  transactionKey: string;
  cancelReason: string;
  cancelAmount: number;
  canceledAt: Date;
  cancelStatus: CancelStatus;
  taxFreeAmount: number;
  taxExemptionAmount: number;
}

// 결제 문서 (Firestore payments 컬렉션)
export interface PaymentDocument {
  paymentKey: string;
  orderId: string;
  orderName: string;

  totalAmount: number;
  suppliedAmount: number;
  vat: number;
  taxFreeAmount: number;
  balanceAmount: number;
  currency: string;

  status: PaymentStatus;
  method: PaymentMethod;

  requestedAt: Date;
  approvedAt: Date;

  reservationId: string | null;
  userId: string | null;

  customerName: string;
  customerPhone: string;
  customerEmail: string;

  paymentMethod: PaymentMethodDetails;

  cancels: CancelRecord[];
  isPartialCancelable: boolean;

  receiptUrl: string | null;

  cancelInProgress: boolean;
  lastCancelIdempotencyKey: string | null;

  createdAt: Date;
  updatedAt: Date;
}

// 예약에 포함되는 결제 필드
export interface ReservationPaymentFields {
  paymentId: string | null;
  paymentStatus: 'unpaid' | 'paid' | 'partial_refunded' | 'refunded' | 'failed';
  paymentMethod: PaymentMethod | null;
  paymentCompletedAt: Date | null;
}

// ========================================
// Firebase Function 요청/응답 타입
// ========================================

// 결제 확인 요청
export interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  reservationId?: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  reservationInfo?: ReservationInfo;
}

// 예약 정보 (결제 확인 시 함께 전달)
export interface ReservationInfo {
  vehicle: {
    make: string;
    model: string;
    year: number;
  };
  address: string;
  detailAddress?: string;  // 옵셔널로 변경 (Firebase Function과 일치)
  requestedDate: string; // ISO format: "2024-01-15T10:00:00"
  serviceType: 'standard' | 'premium';
  notes?: string;
}

// 결제 확인 응답
export interface ConfirmPaymentResponse {
  success: boolean;
  paymentId: string;
  reservationId?: string;
  receiptUrl: string | null;
}

// 결제 취소 요청
export interface CancelPaymentRequest {
  paymentId: string;
  cancelReason: string;
  cancelAmount?: number;
}

// 결제 취소 응답
export interface CancelPaymentResponse {
  success: boolean;
  status: 'CANCELED' | 'PARTIAL_CANCELED';
  balanceAmount: number;
  cancelAmount: number;
}

// ========================================
// 앱 내부 사용 타입
// ========================================

// 결제 화면으로 전달하는 파라미터
export interface PaymentScreenParams {
  reservationData: ReservationData;
  orderId: string;
  orderName: string;
  amount: number;
}

// 예약 데이터 (앱 내부에서 사용)
export interface ReservationData {
  // 차량 정보
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;

  // 주소 정보
  address: string;
  detailAddress?: string;
  latitude?: number;
  longitude?: number;

  // 예약 정보
  requestedDate: Date;
  timeSlot: string;
  serviceType: 'standard' | 'premium';

  // 고객 정보
  userName: string;
  userPhone: string;
  notes?: string;
}

// 서비스 가격 (개발용 - 운영 시 변경 필요)
export const SERVICE_PRICES = {
  basic: 1_000,        // 스탠다드 진단 (1천원) - 개발용
  premium: 2_000,      // 프리미엄 진단 (2천원) - 개발용
} as const;

export type ServiceType = keyof typeof SERVICE_PRICES;

// 서비스 이름 매핑
export const SERVICE_NAMES: Record<ServiceType, string> = {
  basic: '스탠다드 진단',
  premium: '프리미엄 진단',
};
