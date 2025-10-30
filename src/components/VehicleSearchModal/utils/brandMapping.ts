export const getBrandLogo = (brandName: string) => {
  const logoMap: { [key: string]: any } = {
    '현대': require('../../../assets/images/logo.png'),
    'HYUNDAI': require('../../../assets/images/logo.png'),
    '기아': require('../../../assets/images/logo.png'),
    'KIA': require('../../../assets/images/logo.png'),
    '테슬라': require('../../../assets/images/logo.png'),
    'TESLA': require('../../../assets/images/logo.png'),
    'Tesla': require('../../../assets/images/logo.png'),
    '벤츠': require('../../../assets/images/logo.png'),
    'BENZ': require('../../../assets/images/logo.png'),
    'MERCEDES-BENZ': require('../../../assets/images/logo.png'),
    'BMW': require('../../../assets/images/logo.png'),
    'AUDI': require('../../../assets/images/logo.png'),
    '아우디': require('../../../assets/images/logo.png'),
    '폭스바겐': require('../../../assets/images/logo.png'),
    'VOLKSWAGEN': require('../../../assets/images/logo.png'),
    '제네시스': require('../../../assets/images/logo.png'),
    'GENESIS': require('../../../assets/images/logo.png'),
    'MINI': require('../../../assets/images/logo.png'),
    '미니': require('../../../assets/images/logo.png'),
  };
  
  return logoMap[brandName] || require('../../../assets/images/logo.png');
};