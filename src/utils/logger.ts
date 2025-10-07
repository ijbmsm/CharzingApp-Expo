import { logger, consoleTransport, configLoggerType } from 'react-native-logs';

const defaultConfig: configLoggerType<any, any> = {
  severity: __DEV__ ? 'debug' : 'error',
  transport: [
    consoleTransport,
    // chromeConsoleTransport, // Chrome DevTools에서만 작동
    // fileAsyncTransport, // 실제 기기에서 오류 발생
  ],
  transportOptions: {
    colors: {
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright',
    },
  },
  async: false, // 실제 기기에서 안정성을 위해 false
  dateFormat: 'time',
  printLevel: true,
  printDate: true,
  enabled: true,
};

const log = logger.createLogger(defaultConfig);

export { log };

// 카카오 로그인 전용 로거 (임시로 console.log 사용)
export const kakaoLogger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[KAKAO] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[KAKAO] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    console.log(`[KAKAO] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[KAKAO] ${message}`, ...args);
  }
};