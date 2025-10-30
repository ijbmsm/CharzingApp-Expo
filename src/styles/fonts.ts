// LINE Seed 폰트 스타일 정의 (KR/EN 버전 구분)
export const fontStyles = {
  regular: {
    fontFamily: 'LINESeedSansKR-Regular', // 한국어 텍스트용
  },
  bold: {
    fontFamily: 'LINESeedSansKR-Bold', // 한국어 텍스트용
  },
  regularEN: {
    fontFamily: 'LINESeedSansEN-Regular', // 영어 텍스트용
  },
  boldEN: {
    fontFamily: 'LINESeedSansEN-Bold', // 영어 텍스트용
  },
};

// 언어에 따른 폰트 패밀리 선택 함수
export const getFontFamily = (fontWeight?: string | number, isEnglish?: boolean) => {
  const isBold = fontWeight === 'bold' || fontWeight === '600' || fontWeight === '700' || fontWeight === 'bolder';
  
  if (isEnglish) {
    return isBold ? 'LINESeedSansEN-Bold' : 'LINESeedSansEN-Regular';
  } else {
    return isBold ? 'LINESeedSansKR-Bold' : 'LINESeedSansKR-Regular';
  }
};

// 텍스트 스타일을 LINE Seed 폰트로 변환하는 헬퍼 함수
export const convertToLineSeedFont = (style: any, isEnglish?: boolean) => {
  if (!style) return style;
  
  const newStyle = { ...style };
  
  // 언어에 따른 적절한 폰트 패밀리 설정
  const fontWeight = newStyle.fontWeight;
  newStyle.fontFamily = getFontFamily(fontWeight, isEnglish);
  
  // fontWeight 제거 (폰트 파일 자체에 굵기가 포함되어 있음)
  delete newStyle.fontWeight;
  
  return newStyle;
};