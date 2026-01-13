import * as crypto from 'crypto';
import { https } from 'firebase-functions';

const NAVER_SENS_API_BASE_URL = 'https://sens.apigw.ntruss.com';

export interface SendSMSRequest {
  to: string;           // 수신자 전화번호 (예: '01012345678')
  content: string;      // 메시지 내용
  subject?: string;     // LMS 제목 (선택, LMS일 때만 사용)
  from?: string;        // 발신자 전화번호 (미설정 시 환경변수 사용)
}

interface NaverSENSMessageRequest {
  type: 'SMS' | 'LMS' | 'MMS';
  contentType: 'COMM' | 'AD';
  countryCode: string;
  from: string;
  subject?: string;     // LMS/MMS 제목
  content: string;
  messages: Array<{
    to: string;
    content?: string;
  }>;
}

interface NaverSENSResponse {
  requestId: string;
  requestTime: string;
  statusCode: string;
  statusName: string;
}

/**
 * HMAC SHA256 서명 생성
 * @param timestamp - API 요청 시간 (밀리초)
 * @param method - HTTP 메서드 (POST)
 * @param uri - API 엔드포인트 URI
 * @param accessKey - NCP Access Key
 * @param secretKey - NCP Secret Key
 */
function makeSignature(
  timestamp: string,
  method: string,
  uri: string,
  accessKey: string,
  secretKey: string
): string {
  const message = [
    method,
    ' ',
    uri,
    '\n',
    timestamp,
    '\n',
    accessKey,
  ].join('');

  const hmac = crypto.createHmac('sha256', secretKey);
  const signature = hmac.update(message).digest('base64');

  return signature;
}

/**
 * SMS 메시지 유형 결정 (90바이트 초과 시 LMS로 자동 변환)
 */
function getMessageType(content: string): 'SMS' | 'LMS' {
  // 한글은 2바이트, 영문/숫자는 1바이트로 계산
  const byteLength = Buffer.from(content, 'utf8').length;
  return byteLength > 90 ? 'LMS' : 'SMS';
}

/**
 * Naver Cloud SENS SMS 발송
 * @param request - SMS 발송 요청 정보
 * @param serviceId - SENS 서비스 ID (환경변수에서 가져옴)
 * @param accessKey - NCP Access Key (환경변수에서 가져옴)
 * @param secretKey - NCP Secret Key (환경변수에서 가져옴)
 * @param senderPhone - 발신자 전화번호 (환경변수에서 가져옴)
 */
export async function sendSMS(
  request: SendSMSRequest,
  serviceId: string,
  accessKey: string,
  secretKey: string,
  senderPhone: string
): Promise<NaverSENSResponse> {
  // 타임스탬프 생성 (동일한 값을 서명과 헤더에서 사용)
  const timestamp = Date.now().toString();

  // API 엔드포인트
  const uri = `/sms/v2/services/${serviceId}/messages`;
  const method = 'POST';

  // HMAC 서명 생성
  const signature = makeSignature(timestamp, method, uri, accessKey, secretKey);

  // 메시지 타입 결정
  const messageType = getMessageType(request.content);

  // 요청 바디 구성
  const body: NaverSENSMessageRequest = {
    type: messageType,
    contentType: 'COMM',  // 일반 메시지 (AD: 광고 메시지)
    countryCode: '82',    // 대한민국
    from: request.from || senderPhone,
    ...(messageType === 'LMS' && { subject: request.subject || '[차징]' }),
    content: request.content,
    messages: [
      {
        to: request.to,
      },
    ],
  };

  // API 요청 헤더
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'x-ncp-iam-access-key': accessKey,
    'x-ncp-apigw-timestamp': timestamp,
    'x-ncp-apigw-signature-v2': signature,
  };

  // API 호출
  const response = await fetch(`${NAVER_SENS_API_BASE_URL}${uri}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();

  // 에러 처리
  if (!response.ok) {
    console.error('Naver SENS SMS 발송 실패:', {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    throw new https.HttpsError(
      'internal',
      `SMS 발송 실패: ${data.message || response.statusText}`,
      {
        statusCode: response.status,
        errorCode: data.code,
        errorMessage: data.message,
      }
    );
  }

  console.log('SMS 발송 성공:', {
    requestId: data.requestId,
    statusCode: data.statusCode,
    to: request.to,
  });

  return data as NaverSENSResponse;
}

/**
 * 환경 변수 검증
 */
export function validateSMSConfig(): {
  serviceId: string;
  accessKey: string;
  secretKey: string;
  senderPhone: string;
  adminPhones: string[];
} {
  const serviceId = process.env.NAVER_SENS_SERVICE_ID;
  const accessKey = process.env.NAVER_SENS_ACCESS_KEY;
  const secretKey = process.env.NAVER_SENS_SECRET_KEY;
  const senderPhone = process.env.NAVER_SENS_SENDER_PHONE;
  const adminPhonesStr = process.env.ADMIN_PHONE_NUMBERS;

  if (!serviceId || !accessKey || !secretKey || !senderPhone || !adminPhonesStr) {
    throw new https.HttpsError(
      'failed-precondition',
      'SMS 발송에 필요한 환경 변수가 설정되지 않았습니다. ' +
      'Firebase Functions 환경 변수를 확인하세요: ' +
      'NAVER_SENS_SERVICE_ID, NAVER_SENS_ACCESS_KEY, NAVER_SENS_SECRET_KEY, ' +
      'NAVER_SENS_SENDER_PHONE, ADMIN_PHONE_NUMBERS'
    );
  }

  // 쉼표로 구분된 전화번호 목록을 배열로 변환
  const adminPhones = adminPhonesStr.split(',').map(phone => phone.trim()).filter(phone => phone.length > 0);

  if (adminPhones.length === 0) {
    throw new https.HttpsError(
      'failed-precondition',
      'ADMIN_PHONE_NUMBERS에 최소 하나 이상의 전화번호가 필요합니다.'
    );
  }

  return {
    serviceId,
    accessKey,
    secretKey,
    senderPhone,
    adminPhones,
  };
}
