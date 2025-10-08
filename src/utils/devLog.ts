/**
 * 개발 환경에서만 작동하는 로그 유틸리티
 * 운영 환경에서는 모든 로그가 자동으로 비활성화됨
 */

const isDev = __DEV__;

export const devLog = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },
  
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  
  error: (...args: any[]) => {
    if (isDev) console.error(...args);
  },
  
  debug: (...args: any[]) => {
    if (isDev) console.log(...args);
  }
};

export default devLog;