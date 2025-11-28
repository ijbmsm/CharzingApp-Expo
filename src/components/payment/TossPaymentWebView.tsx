import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent, ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import Constants from 'expo-constants';
import { ConvertUrl } from '@tosspayments/widget-sdk-react-native/src/utils/convertUrl';
import { devLog } from '../../utils/devLog';
import sentryLogger from '../../utils/sentryLogger';

// 토스페이먼츠 클라이언트 키
const TOSS_CLIENT_KEY = Constants.expoConfig?.extra?.TOSS_CLIENT_KEY
  || process.env.EXPO_PUBLIC_TOSS_CLIENT_KEY
  || 'test_ck_YOUR_CLIENT_KEY_HERE';

// 디버깅용 로그
devLog.log('🔑 TOSS_CLIENT_KEY:', TOSS_CLIENT_KEY?.slice(0, 15) + '...');

export interface PaymentParams {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerMobilePhone?: string;
  successUrl: string;
  failUrl: string;
}

interface TossPaymentWebViewProps {
  paymentParams: PaymentParams;
  onSuccess: (paymentKey: string, orderId: string, amount: number) => void;
  onFail: (errorCode: string, errorMessage: string, orderId: string, errorDetail?: string) => void;
  onClose?: () => void;
}

export const TossPaymentWebView: React.FC<TossPaymentWebViewProps> = ({
  paymentParams,
  onSuccess,
  onFail,
  onClose,
}) => {
  const webViewRef = useRef<WebView>(null);

  // 토스페이먼츠 결제 위젯 HTML 생성 (웹과 동일한 방식)
  const generatePaymentHTML = useCallback(() => {
    const {
      orderId,
      orderName,
      amount,
      customerName,
      customerMobilePhone,
      successUrl,
      failUrl,
    } = paymentParams;

    // 웹과 동일하게 Toss SDK를 사용하여 위젯 렌더링
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>결제</title>
        <!-- Toss Payments SDK (웹과 동일) -->
        <script src="https://js.tosspayments.com/v2/standard"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f9fafb;
            min-height: 100%;
          }
          .container {
            padding: 16px;
            max-width: 100%;
          }
          .header {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .header h1 {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
          }
          .header p {
            font-size: 14px;
            color: #6b7280;
          }
          .amount-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .amount-label {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .service-name {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 12px;
          }
          .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 12px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            font-size: 15px;
            font-weight: 500;
            color: #374151;
          }
          .total-amount {
            font-size: 24px;
            font-weight: 700;
            color: #06B6D4;
          }
          .widget-container {
            background: white;
            border-radius: 12px;
            margin-bottom: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          #payment-method {
            margin-bottom: 4px;
          }
          .pay-button-container {
            background: white;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .pay-button {
            width: 100%;
            background-color: #06B6D4;
            color: white;
            font-weight: 700;
            font-size: 16px;
            padding: 14px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .pay-button:hover {
            background-color: #0891B2;
          }
          .pay-button:disabled {
            background-color: #d1d5db;
            cursor: not-allowed;
          }
          .loading-container {
            text-align: center;
            padding: 40px;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top-color: #06B6D4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loading-text {
            color: #6b7280;
            font-size: 14px;
          }
          .error-container {
            text-align: center;
            padding: 40px;
          }
          .error-text {
            color: #ef4444;
            font-size: 14px;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- 헤더 -->
          <div class="header">
            <h1>결제하기</h1>
            <p>안전하고 빠른 토스페이먼츠 결제</p>
          </div>

          <!-- 금액 표시 -->
          <div class="amount-card">
            <div class="amount-label">서비스</div>
            <div class="service-name">${orderName}</div>
            <div class="divider"></div>
            <div class="total-row">
              <span class="total-label">총 결제금액</span>
              <span class="total-amount">${amount.toLocaleString()}원</span>
            </div>
          </div>

          <!-- 결제 위젯 영역 -->
          <div class="widget-container">
            <div id="payment-method"></div>
            <div id="agreement"></div>
          </div>

          <!-- 결제 버튼 -->
          <div class="pay-button-container">
            <button id="pay-button" class="pay-button" disabled>
              결제 준비 중...
            </button>
          </div>
        </div>

        <script>
          // React Native로 로그 전송
          function sendLog(msg) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', message: msg }));
            }
            console.log('[TossWidget]', msg);
          }

          // React Native로 메시지 전송
          function sendMessage(type, data) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
            }
          }

          // 에러 핸들링
          function handleError(error) {
            sendLog('에러 발생: ' + JSON.stringify(error));

            // 1. 검증 에러 (결제 수단 미선택, 약관 미동의 등)
            // → WebView 내부에서 alert로 처리 (PaymentFailure 화면 안감)
            if (error.code === 'INVALID_PARAMETER' ||
                error.code === 'VALIDATION_ERROR' ||
                error.code === 'INVALID_REQUEST' ||
                error.message?.includes('선택') ||
                error.message?.includes('입력') ||
                error.message?.includes('동의') ||
                error.message?.includes('필수')) {
              sendLog('검증 에러 - WebView에서 처리');
              alert(error.message || '결제 수단을 선택해주세요.');
              return;
            }

            // 2. 사용자 취소
            if (error.code === 'USER_CANCEL') {
              sendMessage('CANCEL', { orderId: '${orderId}' });
              return;
            }

            // 3. 실제 결제 실패 (카드사 거절, 한도 초과 등)
            // → PaymentFailure 화면으로 이동
            sendMessage('FAIL', {
              errorCode: error.code || 'UNKNOWN_ERROR',
              errorMessage: error.message || '결제 중 오류가 발생했습니다.',
              errorDetail: JSON.stringify(error),
              orderId: '${orderId}'
            });
          }

          // 결제 위젯 초기화 (웹과 동일한 방식)
          async function initPayment() {
            try {
              sendLog('결제 위젯 초기화 시작...');
              sendLog('Client Key: ${TOSS_CLIENT_KEY.slice(0, 15)}...');

              // Toss Payments SDK 로드
              const tossPayments = TossPayments('${TOSS_CLIENT_KEY}');
              sendLog('TossPayments SDK 로드 완료');

              // 위젯 초기화 (ANONYMOUS 사용)
              const widgets = tossPayments.widgets({
                customerKey: TossPayments.ANONYMOUS
              });
              sendLog('위젯 인스턴스 생성 완료');

              // 결제 금액 설정
              await widgets.setAmount({
                currency: 'KRW',
                value: ${amount}
              });
              sendLog('결제 금액 설정 완료: ${amount}원');

              // 결제 수단 UI 렌더링
              await Promise.all([
                widgets.renderPaymentMethods({
                  selector: '#payment-method',
                  variantKey: 'DEFAULT'
                }),
                widgets.renderAgreement({
                  selector: '#agreement',
                  variantKey: 'AGREEMENT'
                })
              ]);
              sendLog('위젯 렌더링 완료');

              // 버튼 활성화
              const payButton = document.getElementById('pay-button');
              payButton.disabled = false;
              payButton.textContent = '${amount.toLocaleString()}원 결제하기';

              // 결제 버튼 클릭 핸들러
              payButton.addEventListener('click', async () => {
                try {
                  payButton.disabled = true;
                  payButton.textContent = '결제 진행 중...';

                  sendLog('결제 요청 시작...');

                  await widgets.requestPayment({
                    orderId: '${orderId}',
                    orderName: '${orderName}',
                    customerName: '${customerName}',
                    customerMobilePhone: '${customerMobilePhone || ''}',
                    successUrl: '${successUrl}',
                    failUrl: '${failUrl}'
                  });

                  // 위젯이 successUrl/failUrl로 리다이렉트 처리

                } catch (error) {
                  sendLog('결제 요청 에러: ' + JSON.stringify(error));
                  handleError(error);
                  payButton.disabled = false;
                  payButton.textContent = '${amount.toLocaleString()}원 결제하기';
                }
              });

            } catch (error) {
              sendLog('초기화 에러: ' + JSON.stringify(error));
              handleError(error);
            }
          }

          // 페이지 로드 시 초기화
          document.addEventListener('DOMContentLoaded', initPayment);
        </script>
      </body>
      </html>
    `;
  }, [paymentParams]);

  // WebView 메시지 핸들러
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'SUCCESS':
          onSuccess(data.paymentKey, data.orderId, data.amount);
          break;
        case 'FAIL':
          onFail(data.errorCode, data.errorMessage, data.orderId, data.errorDetail);
          break;
        case 'CANCEL':
          onClose?.();
          break;
        case 'LOG':
          devLog.log('📱 [WebView]', data.message);
          break;
        default:
          devLog.log('Unknown message type:', data.type);
      }
    } catch (error) {
      devLog.error('Failed to parse WebView message:', error);
    }
  }, [onSuccess, onFail, onClose]);

  // URL 변경 핸들러 (successUrl, failUrl 감지)
  const handleNavigationStateChange = useCallback((navState: { url: string }) => {
    const { url } = navState;
    devLog.log('📍 Navigation URL:', url);

    // 성공 URL 감지
    if (url.includes('/payment/success') || url.includes('payment-success')) {
      try {
        const urlObj = new URL(url);
        const paymentKey = urlObj.searchParams.get('paymentKey');
        const orderId = urlObj.searchParams.get('orderId');
        const amount = urlObj.searchParams.get('amount');

        devLog.log('✅ 결제 성공 감지:', { paymentKey, orderId, amount });

        if (paymentKey && orderId && amount) {
          onSuccess(paymentKey, orderId, parseInt(amount, 10));
        }
      } catch (e) {
        devLog.error('URL 파싱 에러:', e);
      }
    }

    // 실패 URL 감지
    if (url.includes('/payment/fail') || url.includes('payment-fail')) {
      try {
        const urlObj = new URL(url);
        const errorCode = urlObj.searchParams.get('code') || 'UNKNOWN_ERROR';
        const errorMessage = urlObj.searchParams.get('message') || '결제에 실패했습니다.';
        const orderId = urlObj.searchParams.get('orderId') || '';

        devLog.log('❌ 결제 실패 감지:', { errorCode, errorMessage, orderId });

        onFail(errorCode, errorMessage, orderId);
      } catch (e) {
        devLog.error('URL 파싱 에러:', e);
      }
    }
  }, [onSuccess, onFail]);

  // 딥링크 처리 핸들러 (카드사 앱 실행) - ConvertUrl 사용
  const handleShouldStartLoadWithRequest = useCallback((request: ShouldStartLoadRequest): boolean => {
    const { url } = request;

    devLog.log('📍 Navigation URL:', url);

    // 1. about:blank, javascript: 등은 허용
    if (url.startsWith('about:') || url.startsWith('javascript:')) {
      return true;
    }

    // 2. http/https URL은 WebView에서 처리
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }

    // 3. ⭐ Intent URL 또는 앱 스킴 URL 처리 (ConvertUrl 사용)
    devLog.log('🔗 앱 링크/딥링크 감지:', url);

    try {
      const convertUrl = new ConvertUrl(url);

      // 앱 링크인지 확인
      if (convertUrl.isAppLink()) {
        devLog.log('📱 앱 링크 변환 시도:', convertUrl.appScheme);

        // ⭐ 먼저 앱 설치 여부 확인 (Safari fallback 방지)
        const appLink = convertUrl.appLink || url;

        (async () => {
          try {
            const canOpen = await Linking.canOpenURL(appLink);

            if (canOpen) {
              // 앱이 설치되어 있으면 실행
              devLog.log('✅ 앱 설치 확인됨, 실행 시도');
              const isLaunch = await convertUrl.launchApp();

              if (isLaunch) {
                devLog.log('✅ 앱 실행 성공:', convertUrl.appScheme);
              } else {
                devLog.log('⚠️ 앱 실행 실패');
              }
            } else {
              // 앱이 없으면 딥링크 시도하지 않음
              devLog.log('⚠️ 앱 미설치:', convertUrl.appScheme);
              devLog.log('🌐 딥링크 차단, 토스가 자동으로 웹 결제로 전환');
              // 아무것도 하지 않음 - 토스가 타임아웃 후 자동으로 웹 결제 페이지로 전환
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            devLog.log('⚠️ 앱 체크 에러:', errorMessage);
          }
        })();

        // ⭐ WebView에서 로드 차단 (Safari fallback 방지)
        return false;
      } else {
        devLog.log('⚠️ 앱 링크가 아님, WebView에서 처리');
        return true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      devLog.log('⚠️ ConvertUrl 에러:', errorMessage);

      // ConvertUrl 처리 실패 시 기존 방식으로 fallback
      (async () => {
        try {
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            await Linking.openURL(url);
            devLog.log('✅ 기존 방식으로 앱 실행 성공');
          } else {
            devLog.log('⚠️ 앱 미설치 (기존 방식), 딥링크 차단');
          }
        } catch (linkError) {
          const linkErrorMessage = linkError instanceof Error ? linkError.message : String(linkError);
          devLog.log('⚠️ Linking 에러:', linkErrorMessage);
        }
      })();

      return false;
    }
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generatePaymentHTML() }}
        style={styles.webView}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#06B6D4" />
          </View>
        )}
        // iOS 설정
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Android 설정
        mixedContentMode="compatibility"
        allowFileAccess={true}
        // 보안 설정
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default TossPaymentWebView;
