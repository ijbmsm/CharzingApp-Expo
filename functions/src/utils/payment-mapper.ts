import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { TossPaymentResponse } from '../types/toss.types';
import { PaymentDocument, PaymentMethodDetails, CancelRecord } from '../types/payment.types';
import { getCardCompanyName } from '../constants/card-companies';

function toTimestamp(isoString: string): Timestamp {
  return Timestamp.fromDate(new Date(isoString));
}

export function extractPaymentMethodDetails(
  tossResponse: TossPaymentResponse
): PaymentMethodDetails {
  const details: PaymentMethodDetails = {
    type: tossResponse.method,
  };

  if (tossResponse.card) {
    const issuerCode = tossResponse.card.issuerCode;
    const companyName = getCardCompanyName(issuerCode);

    // 🔍 디버깅: issuerCode와 매핑 결과 로깅
    console.log('🏦 Card IssuerCode:', issuerCode, '→ Company:', companyName);
    console.log('📇 CardType:', tossResponse.card.cardType);
    console.log('💳 Card Number:', tossResponse.card.number);

    details.card = {
      company: companyName,
      number: tossResponse.card.number,
      cardType: tossResponse.card.cardType,
      ownerType: tossResponse.card.ownerType,
      installmentPlanMonths: tossResponse.card.installmentPlanMonths,
      approveNo: tossResponse.card.approveNo,
    };
  }

  if (tossResponse.easyPay) {
    details.easyPay = {
      provider: tossResponse.easyPay.provider,
      amount: tossResponse.easyPay.amount,
      discountAmount: tossResponse.easyPay.discountAmount,
    };
  }

  if (tossResponse.virtualAccount) {
    details.virtualAccount = {
      bank: tossResponse.virtualAccount.bankCode,
      accountNumber: tossResponse.virtualAccount.accountNumber,
      dueDate: toTimestamp(tossResponse.virtualAccount.dueDate),
    };
  }

  return details;
}

export function mapCancelRecords(
  tossCancels: TossPaymentResponse['cancels']
): CancelRecord[] {
  if (!tossCancels || tossCancels.length === 0) {
    return [];
  }

  return tossCancels.map((cancel) => ({
    transactionKey: cancel.transactionKey,
    cancelReason: cancel.cancelReason,
    cancelAmount: cancel.cancelAmount,
    canceledAt: toTimestamp(cancel.canceledAt),
    cancelStatus: cancel.cancelStatus,
    taxFreeAmount: cancel.taxFreeAmount,
    taxExemptionAmount: cancel.taxExemptionAmount,
  }));
}

export function tossResponseToPaymentDocument(
  tossResponse: TossPaymentResponse,
  additionalData: {
    reservationId: string | null;
    userId: string | null;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
  }
): Omit<PaymentDocument, 'createdAt' | 'updatedAt'> {
  return {
    paymentKey: tossResponse.paymentKey,
    orderId: tossResponse.orderId,
    orderName: tossResponse.orderName,

    totalAmount: tossResponse.totalAmount,
    suppliedAmount: tossResponse.suppliedAmount,
    vat: tossResponse.vat,
    taxFreeAmount: tossResponse.taxFreeAmount,
    balanceAmount: tossResponse.balanceAmount,
    currency: tossResponse.currency,

    status: tossResponse.status,
    method: tossResponse.method,

    requestedAt: toTimestamp(tossResponse.requestedAt),
    approvedAt: toTimestamp(tossResponse.approvedAt),

    reservationId: additionalData.reservationId,
    userId: additionalData.userId,

    customerName: additionalData.customerName,
    customerPhone: additionalData.customerPhone,
    customerEmail: additionalData.customerEmail,

    paymentMethod: extractPaymentMethodDetails(tossResponse),

    cancels: mapCancelRecords(tossResponse.cancels),
    isPartialCancelable: tossResponse.isPartialCancelable,

    receiptUrl: tossResponse.receipt?.url || null,

    cancelInProgress: false,
    lastCancelIdempotencyKey: null,
  };
}

export function createCancelUpdateData(
  tossResponse: TossPaymentResponse,
  idempotencyKey: string
): Record<string, unknown> {
  return {
    status: tossResponse.status,
    balanceAmount: tossResponse.balanceAmount,
    suppliedAmount: tossResponse.suppliedAmount,
    vat: tossResponse.vat,
    cancels: mapCancelRecords(tossResponse.cancels),
    cancelInProgress: false,
    lastCancelIdempotencyKey: idempotencyKey,
    updatedAt: FieldValue.serverTimestamp(),
  };
}
