import { https } from 'firebase-functions';
import {
  TossPaymentResponse,
  TossConfirmRequest,
  TossCancelRequest,
  TossErrorResponse,
} from '../types/toss.types';

const TOSS_API_BASE_URL = 'https://api.tosspayments.com/v1';

function getAuthHeader(secretKey: string): string {
  const encoded = Buffer.from(`${secretKey}:`).toString('base64');
  return `Basic ${encoded}`;
}

async function callTossAPI<T>(
  endpoint: string,
  method: 'GET' | 'POST',
  secretKey: string,
  body?: unknown,
  idempotencyKey?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Authorization': getAuthHeader(secretKey),
    'Content-Type': 'application/json',
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const response = await fetch(`${TOSS_API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as TossErrorResponse;
    throw new https.HttpsError(
      'internal',
      `Toss API 오류: ${error.message}`,
      {
        code: error.code,
        tossMessage: error.message,
      }
    );
  }

  return data as T;
}

export async function confirmPayment(
  secretKey: string,
  request: TossConfirmRequest
): Promise<TossPaymentResponse> {
  return callTossAPI<TossPaymentResponse>(
    '/payments/confirm',
    'POST',
    secretKey,
    request
  );
}

export async function cancelPayment(
  secretKey: string,
  paymentKey: string,
  request: TossCancelRequest,
  idempotencyKey: string
): Promise<TossPaymentResponse> {
  return callTossAPI<TossPaymentResponse>(
    `/payments/${paymentKey}/cancel`,
    'POST',
    secretKey,
    request,
    idempotencyKey
  );
}

export async function getPayment(
  secretKey: string,
  paymentKey: string
): Promise<TossPaymentResponse> {
  return callTossAPI<TossPaymentResponse>(
    `/payments/${paymentKey}`,
    'GET',
    secretKey
  );
}
