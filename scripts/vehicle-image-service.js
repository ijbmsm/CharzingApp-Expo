/**
 * 차량 이미지 서비스
 * 안정적이고 확장 가능한 이미지 조회 시스템
 */

const fs = require('fs');
const path = require('path');

// 매핑 데이터 로드
const mappingPath = path.join(__dirname, 'vehicle-image-mapping.json');
let imageMapping = {};

try {
  imageMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
} catch (error) {
  console.error('❌ Failed to load vehicle image mapping:', error.message);
  process.exit(1);
}

/**
 * Firebase Storage 기본 설정
 */
const FIREBASE_CONFIG = {
  bucketName: imageMapping.firebaseStorage?.bucketName || 'charzing-d1600.appspot.com',
  basePath: imageMapping.firebaseStorage?.basePath || 'vehicle-images',
  defaultImage: imageMapping.firebaseStorage?.defaultImage || 'default-vehicle.png'
};

/**
 * 로그 레벨 설정
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

let currentLogLevel = LOG_LEVELS.INFO;

function log(level, message, data = null) {
  if (level <= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    const prefix = `[${timestamp}] [${levelNames[level]}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
}

/**
 * 연식 기반 가장 가까운 이미지 찾기
 */
function findClosestYearImage(modelMapping, targetYear) {
  if (!modelMapping.yearMappings || !targetYear) {
    return null;
  }

  const availableYears = Object.keys(modelMapping.yearMappings).map(Number).sort();
  
  if (availableYears.length === 0) {
    return null;
  }

  // 정확히 일치하는 연식이 있는 경우
  if (availableYears.includes(targetYear)) {
    const imageName = modelMapping.yearMappings[targetYear.toString()];
    log(LOG_LEVELS.DEBUG, `Exact year match found: ${targetYear} → ${imageName}`);
    return imageName;
  }

  // 가장 가까운 연식 찾기
  let closestYear = availableYears[0];
  let minDiff = Math.abs(targetYear - closestYear);

  for (const year of availableYears) {
    const diff = Math.abs(targetYear - year);
    if (diff < minDiff) {
      minDiff = diff;
      closestYear = year;
    }
  }

  const imageName = modelMapping.yearMappings[closestYear.toString()];
  log(LOG_LEVELS.DEBUG, `Closest year match: ${targetYear} → ${closestYear} → ${imageName}`);
  return imageName;
}

/**
 * 폴백 체인을 통한 이미지 찾기
 */
function findFallbackImage(modelMapping, attempt = 0) {
  if (!modelMapping.fallbackChain || modelMapping.fallbackChain.length === 0) {
    log(LOG_LEVELS.WARN, 'No fallback chain available');
    return null;
  }

  const maxAttempts = Math.min(
    modelMapping.fallbackChain.length,
    imageMapping.validationRules?.maxFallbackDepth || 3
  );

  if (attempt >= maxAttempts) {
    log(LOG_LEVELS.WARN, `Reached max fallback depth (${maxAttempts})`);
    return null;
  }

  const fallbackImage = modelMapping.fallbackChain[attempt];
  log(LOG_LEVELS.DEBUG, `Fallback attempt ${attempt + 1}: ${fallbackImage}`);
  return fallbackImage;
}

/**
 * 브랜드 정규화
 */
function normalizeBrand(brand) {
  if (!brand) return null;
  
  const brandLower = brand.toLowerCase();
  const brandMapping = {
    'hyundai': 'hyundai',
    '현대': 'hyundai',
    'kia': 'kia',
    '기아': 'kia'
  };
  
  return brandMapping[brandLower] || brandLower;
}

/**
 * 입력 유효성 검사
 */
function validateInput(modelId, options = {}) {
  const errors = [];

  if (!modelId || typeof modelId !== 'string') {
    errors.push('modelId is required and must be a string');
  }

  if (options.year !== undefined) {
    const year = Number(options.year);
    const minYear = imageMapping.validationRules?.yearValidation?.minYear || 2012;
    const maxYear = imageMapping.validationRules?.yearValidation?.maxYear || 2030;
    
    if (isNaN(year) || year < minYear || year > maxYear) {
      errors.push(`year must be between ${minYear} and ${maxYear}`);
    }
  }

  return errors;
}

/**
 * 메인 이미지 조회 함수
 * @param {string} modelId - vehicleBatteryData.js의 modelId (예: 'ioniq-5-standard')
 * @param {Object} options - 옵션
 * @param {number} options.year - 희망 연식
 * @param {string} options.brand - 브랜드 (자동 추론 가능)
 * @param {boolean} options.returnUrl - Firebase URL 반환 여부 (기본: false)
 * @param {boolean} options.strict - 엄격 모드 (폴백 사용 안함)
 * @returns {string|null} 이미지 파일명 또는 Firebase URL
 */
function getVehicleImage(modelId, options = {}) {
  const startTime = Date.now();
  log(LOG_LEVELS.INFO, `🔍 Getting vehicle image for modelId: ${modelId}`, options);

  // 입력 유효성 검사
  const validationErrors = validateInput(modelId, options);
  if (validationErrors.length > 0) {
    log(LOG_LEVELS.ERROR, 'Validation failed', validationErrors);
    return null;
  }

  const { year, brand: inputBrand, returnUrl = false, strict = false } = options;
  
  // 브랜드 추론 또는 정규화
  let brand = normalizeBrand(inputBrand);
  if (!brand) {
    // modelId에서 브랜드 추론
    if (modelId.startsWith('ioniq-') || modelId.startsWith('kona-') || modelId.includes('casper')) {
      brand = 'hyundai';
    } else if (modelId.startsWith('ev') || modelId.includes('niro') || modelId.includes('ray')) {
      brand = 'kia';
    }
  }

  if (!brand) {
    log(LOG_LEVELS.ERROR, `Cannot determine brand for modelId: ${modelId}`);
    return strict ? null : FIREBASE_CONFIG.defaultImage;
  }

  // 매핑 데이터에서 모델 찾기
  const brandMappings = imageMapping.mappings?.[brand];
  if (!brandMappings) {
    log(LOG_LEVELS.ERROR, `No mappings found for brand: ${brand}`);
    return strict ? null : FIREBASE_CONFIG.defaultImage;
  }

  const modelMapping = brandMappings[modelId];
  if (!modelMapping) {
    log(LOG_LEVELS.ERROR, `No mapping found for modelId: ${modelId} in brand: ${brand}`);
    return strict ? null : FIREBASE_CONFIG.defaultImage;
  }

  let selectedImage = null;

  // 1. 연식 기반 이미지 찾기
  if (year) {
    selectedImage = findClosestYearImage(modelMapping, year);
    if (selectedImage) {
      log(LOG_LEVELS.INFO, `✅ Year-based image found: ${selectedImage}`);
    }
  }

  // 2. 기본 이미지 사용
  if (!selectedImage && modelMapping.defaultImage) {
    selectedImage = modelMapping.defaultImage;
    log(LOG_LEVELS.INFO, `✅ Using default image: ${selectedImage}`);
  }

  // 3. 폴백 체인 사용 (strict 모드가 아닌 경우)
  if (!selectedImage && !strict) {
    selectedImage = findFallbackImage(modelMapping, 0);
    if (selectedImage) {
      log(LOG_LEVELS.INFO, `✅ Fallback image found: ${selectedImage}`);
    }
  }

  // 4. 최종 폴백 (글로벌 기본 이미지)
  if (!selectedImage && !strict) {
    selectedImage = FIREBASE_CONFIG.defaultImage;
    log(LOG_LEVELS.WARN, `⚠️ Using global default image: ${selectedImage}`);
  }

  const elapsedTime = Date.now() - startTime;
  log(LOG_LEVELS.DEBUG, `Image lookup completed in ${elapsedTime}ms`);

  if (!selectedImage) {
    log(LOG_LEVELS.ERROR, 'No image found');
    return null;
  }

  // Firebase URL 반환
  if (returnUrl) {
    return buildFirebaseUrl(selectedImage);
  }

  return selectedImage;
}

/**
 * Firebase Storage URL 생성
 */
function buildFirebaseUrl(imageName) {
  const encodedPath = encodeURIComponent(`${FIREBASE_CONFIG.basePath}/${imageName}`);
  return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_CONFIG.bucketName}/o/${encodedPath}?alt=media`;
}

/**
 * 배치 이미지 조회
 */
function getBatchVehicleImages(requests) {
  log(LOG_LEVELS.INFO, `🔍 Processing batch request for ${requests.length} vehicles`);
  
  const results = [];
  const startTime = Date.now();

  for (const request of requests) {
    const { modelId, ...options } = request;
    const image = getVehicleImage(modelId, options);
    results.push({
      modelId,
      image,
      success: !!image
    });
  }

  const elapsedTime = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  
  log(LOG_LEVELS.INFO, `✅ Batch completed: ${successCount}/${requests.length} successful in ${elapsedTime}ms`);
  
  return results;
}

/**
 * 매핑 정보 조회
 */
function getModelInfo(modelId, brand = null) {
  const normalizedBrand = normalizeBrand(brand);
  
  if (normalizedBrand) {
    const modelMapping = imageMapping.mappings?.[normalizedBrand]?.[modelId];
    return modelMapping ? { brand: normalizedBrand, ...modelMapping } : null;
  }

  // 모든 브랜드에서 검색
  for (const [brandName, brandMappings] of Object.entries(imageMapping.mappings || {})) {
    if (brandMappings[modelId]) {
      return { brand: brandName, ...brandMappings[modelId] };
    }
  }

  return null;
}

/**
 * 지원되는 모든 모델 목록 조회
 */
function getSupportedModels() {
  const models = [];
  
  for (const [brand, brandMappings] of Object.entries(imageMapping.mappings || {})) {
    for (const [modelId, mapping] of Object.entries(brandMappings)) {
      models.push({
        brand,
        modelId,
        availableYears: mapping.availableYears || [],
        defaultImage: mapping.defaultImage
      });
    }
  }

  return models;
}

/**
 * 로그 레벨 설정
 */
function setLogLevel(level) {
  if (Object.values(LOG_LEVELS).includes(level)) {
    currentLogLevel = level;
  }
}

/**
 * 매핑 데이터 리로드
 */
function reloadMapping() {
  try {
    const newMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    imageMapping = newMapping;
    log(LOG_LEVELS.INFO, '✅ Mapping data reloaded successfully');
    return true;
  } catch (error) {
    log(LOG_LEVELS.ERROR, '❌ Failed to reload mapping data:', error.message);
    return false;
  }
}

module.exports = {
  getVehicleImage,
  getBatchVehicleImages,
  getModelInfo,
  getSupportedModels,
  buildFirebaseUrl,
  setLogLevel,
  reloadMapping,
  LOG_LEVELS,
  FIREBASE_CONFIG
};

// CLI 실행 시 테스트
if (require.main === module) {
  // 테스트 예제
  console.log('🧪 Testing Vehicle Image Service...\n');
  
  const testCases = [
    { modelId: 'ioniq-5-standard', year: 2024 },
    { modelId: 'ev6-longrange-awd', year: 2025 },
    { modelId: 'ev3-standard' },
    { modelId: 'invalid-model', year: 2024 },
    { modelId: 'ioniq-6-n', year: 2025, returnUrl: true }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${JSON.stringify(testCase)}`);
    const result = getVehicleImage(testCase.modelId, testCase);
    console.log(`Result: ${result}\n`);
  });

  // 배치 테스트
  console.log('🧪 Testing Batch Processing...');
  const batchResults = getBatchVehicleImages(testCases);
  console.log('Batch Results:', batchResults);
}