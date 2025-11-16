export type PaymentStatus =
  | 'READY'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_DEPOSIT'
  | 'DONE'
  | 'CANCELED'
  | 'PARTIAL_CANCELED'
  | 'ABORTED'
  | 'EXPIRED';

export type PaymentMethod = '카드' | '가상계좌' | '간편결제' | '휴대폰' | '계좌이체' | '상품권';

export type CancelStatus = 'DONE' | 'FAILED';

export type CardOwnerType = '개인' | '법인';

export type CardType = '신용' | '체크' | '기프트';

export interface TossCardInfo {
  issuerCode: string;
  acquirerCode: string;
  number: string;
  installmentPlanMonths: number;
  isInterestFree: boolean;
  interestPayer: string | null;
  approveNo: string;
  useCardPoint: boolean;
  cardType: CardType;
  ownerType: CardOwnerType;
  acquireStatus: string;
  amount: number;
}

export interface TossEasyPayInfo {
  provider: string;
  amount: number;
  discountAmount: number;
}

export interface TossVirtualAccountInfo {
  accountType: string;
  accountNumber: string;
  bankCode: string;
  customerName: string;
  dueDate: string;
  refundStatus: string;
  expired: boolean;
  settlementStatus: string;
  refundReceiveAccount: {
    bankCode: string;
    accountNumber: string;
    holderName: string;
  } | null;
}

export interface TossCancelInfo {
  transactionKey: string;
  cancelReason: string;
  taxExemptionAmount: number;
  canceledAt: string;
  transferDiscountAmount: number;
  easyPayDiscountAmount: number;
  receiptKey: string | null;
  cancelAmount: number;
  taxFreeAmount: number;
  refundableAmount: number;
  cancelStatus: CancelStatus;
  cancelRequestId: string | null;
}

export interface TossReceiptInfo {
  url: string;
}

export interface TossPaymentResponse {
  mId: string;
  lastTransactionKey: string;
  paymentKey: string;
  orderId: string;
  orderName: string;
  taxExemptionAmount: number;
  status: PaymentStatus;
  requestedAt: string;
  approvedAt: string;
  useEscrow: boolean;
  cultureExpense: boolean;
  card: TossCardInfo | null;
  virtualAccount: TossVirtualAccountInfo | null;
  transfer: unknown | null;
  mobilePhone: unknown | null;
  giftCertificate: unknown | null;
  cashReceipt: unknown | null;
  cashReceipts: unknown | null;
  discount: unknown | null;
  cancels: TossCancelInfo[] | null;
  secret: string | null;
  type: string;
  easyPay: TossEasyPayInfo | null;
  country: string;
  failure: unknown | null;
  isPartialCancelable: boolean;
  receipt: TossReceiptInfo;
  checkout: {
    url: string;
  };
  currency: string;
  totalAmount: number;
  balanceAmount: number;
  suppliedAmount: number;
  vat: number;
  taxFreeAmount: number;
  method: PaymentMethod;
  version: string;
  metadata: Record<string, string> | null;
}

export interface TossConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossCancelRequest {
  cancelReason: string;
  cancelAmount?: number;
  refundReceiveAccount?: {
    bank: string;
    accountNumber: string;
    holderName: string;
  };
}

export interface TossErrorResponse {
  code: string;
  message: string;
}
