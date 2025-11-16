import { Timestamp } from 'firebase-admin/firestore';
import { PaymentStatus, PaymentMethod, CancelStatus } from './toss.types';

export interface PaymentMethodDetails {
  type: PaymentMethod;
  card?: {
    company: string;
    number: string;
    cardType: '신용' | '체크' | '기프트';
    ownerType: '개인' | '법인';
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
    dueDate: Timestamp;
  };
}

export interface CancelRecord {
  transactionKey: string;
  cancelReason: string;
  cancelAmount: number;
  canceledAt: Timestamp;
  cancelStatus: CancelStatus;
  taxFreeAmount: number;
  taxExemptionAmount: number;
}

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

  requestedAt: Timestamp;
  approvedAt: Timestamp;

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

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReservationPaymentFields {
  paymentId: string | null;
  paymentStatus: 'unpaid' | 'paid' | 'partial_refunded' | 'refunded' | 'failed';
  paymentMethod: PaymentMethod | null;
  paymentCompletedAt: Timestamp | null;
}
