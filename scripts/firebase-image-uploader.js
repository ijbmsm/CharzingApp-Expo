/**
 * Firebase Storage 차량 이미지 업로드 스크립트
 * 안전하고 체계적인 이미지 업로드 시스템
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Firebase Admin 초기화
let firebaseApp;
let bucket;

async function initializeFirebase() {
  try {
    // 로컬 서비스 계정 키 파일 사용
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error('serviceAccountKey.json file not found in scripts directory');
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    // 기본 버킷 설정 없이 초기화 (버킷은 나중에 동적으로 찾기)
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase Admin initialized successfully');
    
    // 사용 가능한 버킷 찾기
    bucket = await findWorkingBucket(serviceAccount);
    console.log(`📦 Using bucket: ${bucket.name}`);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    return false;
  }
}

async function findWorkingBucket(serviceAccount) {
  console.log('🔍 Finding working Firebase Storage bucket...');
  
  // 여러 버킷 네이밍 패턴 시도
  const bucketPatterns = [
    `${serviceAccount.project_id}.appspot.com`,
    serviceAccount.project_id,
    `${serviceAccount.project_id}.firebasestorage.app`,
    `gs://${serviceAccount.project_id}.appspot.com`,
    `gs://${serviceAccount.project_id}.firebasestorage.app`
  ];
  
  // 각 패턴 시도
  for (const bucketName of bucketPatterns) {
    try {
      console.log(`  🔍 Trying: ${bucketName}`);
      const testBucket = admin.storage().bucket(bucketName);
      await testBucket.getMetadata(); // 버킷 존재 확인
      console.log(`  ✅ Success: ${bucketName}`);
      return testBucket;
    } catch (error) {
      console.log(`  ❌ Failed: ${bucketName} - ${error.message}`);
    }
  }
  
  // 모든 패턴 실패 시 사용 가능한 버킷 나열
  try {
    console.log('🔍 Listing all available buckets...');
    const [buckets] = await admin.storage().getBuckets();
    
    if (buckets.length === 0) {
      throw new Error('No Storage buckets found in project');
    }
    
    console.log('📋 Available buckets:');
    buckets.forEach((bucket, index) => {
      console.log(`  ${index + 1}. ${bucket.name}`);
    });
    
    // 첫 번째 버킷 사용
    console.log(`✅ Using first available bucket: ${buckets[0].name}`);
    return buckets[0];
    
  } catch (listError) {
    console.error('❌ Could not list buckets:', listError.message);
    throw new Error('No accessible Firebase Storage bucket found');
  }
}

/**
 * 설정
 */
const CONFIG = {
  localImagePath: '../src/assets/images/car-image',
  firebaseBasePath: 'vehicle-images',
  supportedExtensions: ['.png', '.jpg', '.jpeg'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  enableBackup: true,
  backupPath: 'vehicle-images-backup',
  dryRun: false // true로 설정하면 실제 업로드 없이 시뮬레이션만
};

/**
 * 로깅 시스템
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
      console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
}

/**
 * 진행상황 표시
 */
class ProgressTracker {
  constructor(total) {
    this.total = total;
    this.current = 0;
    this.startTime = Date.now();
    this.succeeded = 0;
    this.failed = 0;
    this.skipped = 0;
  }

  update(success = true, skip = false) {
    this.current++;
    if (skip) {
      this.skipped++;
    } else if (success) {
      this.succeeded++;
    } else {
      this.failed++;
    }
    this.display();
  }

  display() {
    const percentage = ((this.current / this.total) * 100).toFixed(1);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const eta = this.current > 0 ? (((Date.now() - this.startTime) / this.current) * (this.total - this.current) / 1000).toFixed(1) : '?';
    
    process.stdout.write(`\r📊 Progress: ${this.current}/${this.total} (${percentage}%) | ✅ ${this.succeeded} | ❌ ${this.failed} | ⏭️ ${this.skipped} | ⏱️ ${elapsed}s | ETA: ${eta}s`);
    
    if (this.current === this.total) {
      console.log('\n');
    }
  }

  summary() {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    return {
      total: this.total,
      succeeded: this.succeeded,
      failed: this.failed,
      skipped: this.skipped,
      totalTime: `${totalTime}s`,
      successRate: `${((this.succeeded / this.total) * 100).toFixed(1)}%`
    };
  }
}

/**
 * 파일 유효성 검사
 */
function validateFile(filePath) {
  const errors = [];
  
  // 파일 존재 확인
  if (!fs.existsSync(filePath)) {
    errors.push('File does not exist');
    return errors;
  }

  // 파일 크기 확인
  const stats = fs.statSync(filePath);
  if (stats.size > CONFIG.maxFileSize) {
    errors.push(`File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (${CONFIG.maxFileSize / 1024 / 1024}MB)`);
  }

  if (stats.size === 0) {
    errors.push('File is empty');
  }

  // 확장자 확인
  const ext = path.extname(filePath).toLowerCase();
  if (!CONFIG.supportedExtensions.includes(ext)) {
    errors.push(`Unsupported file extension: ${ext}. Supported: ${CONFIG.supportedExtensions.join(', ')}`);
  }

  return errors;
}

/**
 * 파일 해시 계산 (중복 확인용)
 */
function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

/**
 * Firebase Storage에 파일 존재 확인
 */
async function fileExistsInStorage(remotePath) {
  try {
    const file = bucket.file(remotePath);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    log(LOG_LEVELS.DEBUG, `Error checking file existence: ${error.message}`);
    return false;
  }
}

/**
 * 단일 파일 업로드
 */
async function uploadSingleFile(localPath, remotePath, options = {}) {
  const { force = false, generateThumbnail = false } = options;
  
  // 파일 유효성 검사
  const validationErrors = validateFile(localPath);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  // 기존 파일 확인
  if (!force) {
    const exists = await fileExistsInStorage(remotePath);
    if (exists) {
      log(LOG_LEVELS.DEBUG, `File already exists, skipping: ${remotePath}`);
      return { success: true, skipped: true, message: 'File already exists' };
    }
  }

  // Dry run 모드
  if (CONFIG.dryRun) {
    log(LOG_LEVELS.INFO, `[DRY RUN] Would upload: ${localPath} → ${remotePath}`);
    return { success: true, skipped: false, message: 'Dry run mode' };
  }

  try {
    const file = bucket.file(remotePath);
    const fileHash = calculateFileHash(localPath);
    
    // 메타데이터 설정
    const metadata = {
      metadata: {
        uploadedAt: new Date().toISOString(),
        originalName: path.basename(localPath),
        fileHash: fileHash,
        source: 'vehicle-image-uploader'
      },
      contentType: getContentType(localPath),
      cacheControl: 'public, max-age=31536000' // 1년 캐시
    };

    // 업로드 실행
    await file.save(fs.readFileSync(localPath), metadata);
    
    log(LOG_LEVELS.DEBUG, `✅ Uploaded: ${remotePath}`);
    return { 
      success: true, 
      skipped: false, 
      message: 'Upload successful',
      hash: fileHash,
      size: fs.statSync(localPath).size
    };
    
  } catch (error) {
    log(LOG_LEVELS.ERROR, `❌ Upload failed: ${remotePath}`, error.message);
    throw error;
  }
}

/**
 * Content-Type 추론
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 파일명에서 브랜드와 모델을 추출하여 구조화된 경로 생성
 * 예: HYUNDAI-IONIQ-5-2024-STANDARD.png → vehicle-images/HYUNDAI/IONIQ-5/HYUNDAI-IONIQ-5-2024-STANDARD.png
 */
function buildStructuredPath(fileName) {
  const parts = fileName.split('-');
  
  if (parts.length < 2) {
    // 파싱할 수 없는 경우 기본 경로 사용
    return `${CONFIG.firebaseBasePath}/${fileName}`;
  }

  const brand = parts[0].toUpperCase();
  let model = '';

  // 브랜드별 모델 추출 로직
  switch (brand) {
    case 'HYUNDAI':
      if (fileName.includes('IONIQ-5')) model = 'IONIQ-5';
      else if (fileName.includes('IONIQ-6')) model = 'IONIQ-6';
      else if (fileName.includes('IONIQ-9')) model = 'IONIQ-9';
      else if (fileName.includes('KONA-ELECTRIC')) model = 'KONA-ELECTRIC';
      else if (fileName.includes('CASPER-ELECTRIC')) model = 'CASPER-ELECTRIC';
      else model = parts[1].toUpperCase();
      break;

    case 'KIA':
      if (fileName.includes('EV3')) model = 'EV3';
      else if (fileName.includes('EV4')) model = 'EV4';
      else if (fileName.includes('EV6')) model = 'EV6';
      else if (fileName.includes('EV9')) model = 'EV9';
      else if (fileName.includes('NIRO-EV')) model = 'NIRO-EV';
      else if (fileName.includes('RAY')) model = 'RAY';
      else model = parts[1].toUpperCase();
      break;

    case 'TESLA':
    case 'TELSA': // 오타 있는 파일들 처리
      if (fileName.includes('MODEL-S')) model = 'MODEL-S';
      else if (fileName.includes('MODEL-3')) model = 'MODEL-3';
      else if (fileName.includes('MODEL-X')) model = 'MODEL-X';
      else if (fileName.includes('MODEL-Y')) model = 'MODEL-Y';
      else if (fileName.includes('CYBERTRUCK')) model = 'CYBERTRUCK';
      else model = parts[1] + '-' + parts[2];
      break;

    case 'BMW':
      if (fileName.includes('i4')) model = 'i4';
      else if (fileName.includes('i5')) model = 'i5';
      else if (fileName.includes('i7')) model = 'i7';
      else if (fileName.includes('iX1')) model = 'iX1';
      else if (fileName.includes('iX2')) model = 'iX2';
      else if (fileName.includes('iX3')) model = 'iX3';
      else if (fileName.includes('iX')) model = 'iX';
      else model = parts[1].toUpperCase();
      break;

    case 'BENZ':
      if (fileName.includes('EQA')) model = 'EQA';
      else if (fileName.includes('EQB')) model = 'EQB';
      else if (fileName.includes('EQC')) model = 'EQC';
      else if (fileName.includes('EQE')) model = 'EQE';
      else if (fileName.includes('EQS')) model = 'EQS';
      else if (fileName.includes('G-CLASS')) model = 'G-CLASS';
      else model = parts[1].toUpperCase();
      break;

    case 'AUDI':
      if (fileName.includes('A6-E-TRON')) model = 'A6-E-TRON';
      else if (fileName.includes('E-TRON')) model = 'E-TRON';
      else if (fileName.includes('Q4-E-TRON')) model = 'Q4-E-TRON';
      else if (fileName.includes('Q8-E-TRON')) model = 'Q8-E-TRON';
      else if (fileName.includes('RS-E-TRON-GT')) model = 'RS-E-TRON-GT';
      else if (fileName.includes('S-e-tron')) model = 'S-e-tron';
      else if (fileName.includes('S6-E-TRON')) model = 'S6-E-TRON';
      else if (fileName.includes('SQ6-E-TRON')) model = 'SQ6-E-TRON';
      else if (fileName.includes('SQ8-e-tron')) model = 'SQ8-e-tron';
      else model = parts[1].toUpperCase();
      break;

    case 'PORSCHE':
      if (fileName.includes('TAYCAN')) model = 'TAYCAN';
      else model = parts[1].toUpperCase();
      break;

    case 'MINI':
      if (fileName.includes('ACEMAN')) model = 'ACEMAN';
      else if (fileName.includes('COOPER')) model = 'COOPER';
      else if (fileName.includes('COUNTRYMAN')) model = 'COUNTRYMAN';
      else model = parts[1].toUpperCase();
      break;

    default:
      // 기본적으로 두 번째 파트를 모델로 사용
      model = parts[1].toUpperCase();
  }

  return `${CONFIG.firebaseBasePath}/${brand}/${model}/${fileName}`;
}

/**
 * 로컬 이미지 파일 스캔
 */
function scanLocalImages() {
  const images = [];
  
  function scanDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      if (item.startsWith('.')) continue; // 숨김 파일 제외
      
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        scanDirectory(fullPath, path.join(relativePath, item));
      } else {
        const ext = path.extname(item).toLowerCase();
        if (CONFIG.supportedExtensions.includes(ext)) {
          images.push({
            localPath: fullPath,
            relativePath: path.join(relativePath, item).replace(/\\/g, '/'), // Windows 호환
            fileName: item,
            size: stats.size,
            modified: stats.mtime
          });
        }
      }
    }
  }
  
  scanDirectory(CONFIG.localImagePath);
  return images;
}

/**
 * 백업 생성
 */
async function createBackup() {
  if (!CONFIG.enableBackup) return;
  
  log(LOG_LEVELS.INFO, '📦 Creating backup of existing files...');
  
  try {
    const [files] = await bucket.getFiles({ prefix: `${CONFIG.firebaseBasePath}/` });
    
    for (const file of files) {
      const backupPath = file.name.replace(CONFIG.firebaseBasePath, CONFIG.backupPath);
      await file.copy(backupPath);
    }
    
    log(LOG_LEVELS.INFO, `✅ Backup created: ${files.length} files backed up`);
  } catch (error) {
    log(LOG_LEVELS.WARN, `⚠️ Backup failed: ${error.message}`);
  }
}

/**
 * 메인 업로드 함수
 */
async function uploadVehicleImages(options = {}) {
  const {
    force = false,
    createBackupFirst = true,
    filter = null, // 파일명 필터 함수
    batchSize = 5, // 동시 업로드 수
    validateMapping = true
  } = options;

  log(LOG_LEVELS.INFO, '🚀 Starting vehicle image upload...');
  log(LOG_LEVELS.INFO, `Config: Force=${force}, DryRun=${CONFIG.dryRun}, BatchSize=${batchSize}`);

  // 백업 생성
  if (createBackupFirst && !CONFIG.dryRun) {
    await createBackup();
  }

  // 로컬 이미지 스캔
  const localImages = scanLocalImages();
  log(LOG_LEVELS.INFO, `📁 Found ${localImages.length} local images`);

  // 필터 적용
  const filteredImages = filter ? localImages.filter(filter) : localImages;
  log(LOG_LEVELS.INFO, `🔍 After filtering: ${filteredImages.length} images to process`);

  if (filteredImages.length === 0) {
    log(LOG_LEVELS.WARN, '⚠️ No images to upload');
    return { success: false, message: 'No images found' };
  }

  // 매핑 유효성 검사 (선택적)
  if (validateMapping) {
    const mappingValidation = validateAgainstMapping(filteredImages);
    if (mappingValidation.errors.length > 0) {
      log(LOG_LEVELS.WARN, '⚠️ Mapping validation warnings:', mappingValidation.errors);
    }
  }

  // 진행상황 트래커 초기화
  const progress = new ProgressTracker(filteredImages.length);
  const results = [];

  // 배치 업로드
  for (let i = 0; i < filteredImages.length; i += batchSize) {
    const batch = filteredImages.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (image) => {
      // 파일명에서 브랜드와 모델 추출하여 구조화된 경로 생성
      const remotePath = buildStructuredPath(image.fileName);
      
      try {
        const result = await uploadSingleFile(image.localPath, remotePath, { force });
        progress.update(result.success, result.skipped);
        return { ...image, ...result, remotePath };
      } catch (error) {
        progress.update(false, false);
        return { ...image, success: false, error: error.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // 배치 간 잠시 대기 (API 제한 방지)
    if (i + batchSize < filteredImages.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 결과 요약
  const summary = progress.summary();
  log(LOG_LEVELS.INFO, '📊 Upload Summary:', summary);

  // 실패한 업로드 상세 정보
  const failures = results.filter(r => !r.success && !r.skipped);
  if (failures.length > 0) {
    log(LOG_LEVELS.ERROR, '❌ Failed uploads:', failures.map(f => ({
      file: f.fileName,
      error: f.error
    })));
  }

  return {
    success: summary.succeeded > 0,
    summary,
    results,
    failures
  };
}

/**
 * 매핑 데이터와 비교하여 유효성 검사
 */
function validateAgainstMapping(images) {
  const mappingPath = path.join(__dirname, 'vehicle-image-mapping.json');
  const errors = [];
  const warnings = [];

  try {
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    const expectedImages = new Set();

    // 매핑에서 참조되는 모든 이미지 수집
    for (const brand of Object.values(mapping.mappings || {})) {
      for (const model of Object.values(brand)) {
        if (model.defaultImage) expectedImages.add(model.defaultImage);
        if (model.yearMappings) {
          Object.values(model.yearMappings).forEach(img => expectedImages.add(img));
        }
        if (model.fallbackChain) {
          model.fallbackChain.forEach(img => expectedImages.add(img));
        }
      }
    }

    // 현재 이미지와 비교
    const currentImages = new Set(images.map(img => img.fileName));
    
    // 매핑에는 있지만 파일이 없는 경우
    for (const expectedImg of expectedImages) {
      if (!currentImages.has(expectedImg)) {
        errors.push(`Referenced in mapping but file not found: ${expectedImg}`);
      }
    }

    // 파일은 있지만 매핑에 없는 경우
    for (const currentImg of currentImages) {
      if (!expectedImages.has(currentImg)) {
        warnings.push(`File exists but not referenced in mapping: ${currentImg}`);
      }
    }

    return { errors, warnings, expectedCount: expectedImages.size, actualCount: currentImages.size };
    
  } catch (error) {
    errors.push(`Failed to validate mapping: ${error.message}`);
    return { errors, warnings: [], expectedCount: 0, actualCount: images.length };
  }
}

/**
 * 특정 브랜드만 업로드
 */
async function uploadByBrand(brand) {
  const brandFilter = (image) => {
    const fileName = image.fileName.toUpperCase();
    return fileName.startsWith(`${brand.toUpperCase()}-`);
  };

  return uploadVehicleImages({ filter: brandFilter });
}

/**
 * 누락된 이미지만 업로드
 */
async function uploadMissingImages() {
  const missingFilter = async (image) => {
    const remotePath = `${CONFIG.firebaseBasePath}/${image.fileName}`;
    const exists = await fileExistsInStorage(remotePath);
    return !exists;
  };

  // 비동기 필터를 위해 별도 처리
  const localImages = scanLocalImages();
  const missingImages = [];
  
  for (const image of localImages) {
    if (await missingFilter(image)) {
      missingImages.push(image);
    }
  }

  return uploadVehicleImages({ 
    filter: () => true, // 이미 필터링됨
    force: false 
  });
}

/**
 * CLI 명령어 처리
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  async function runCommand() {
    try {
      // Firebase 초기화
      const initialized = await initializeFirebase();
      if (!initialized) {
        throw new Error('Firebase initialization failed');
      }
      
      switch (command) {
        case 'upload':
          await uploadVehicleImages({ force: args.includes('--force') });
          break;
          
        case 'upload-brand':
          const brand = args[1];
          if (!brand) throw new Error('Brand name required');
          await uploadByBrand(brand);
          break;
          
        case 'upload-missing':
          await uploadMissingImages();
          break;
          
        case 'validate':
          const images = scanLocalImages();
          const validation = validateAgainstMapping(images);
          console.log('🔍 Validation Results:', validation);
          break;
          
        case 'scan':
          const scannedImages = scanLocalImages();
          console.log(`📁 Found ${scannedImages.length} images:`);
          scannedImages.forEach(img => console.log(`  ${img.fileName} (${(img.size/1024).toFixed(1)}KB)`));
          break;
          
        default:
          console.log(`
🚗 Vehicle Image Uploader Commands:

  upload [--force]     Upload all images
  upload-brand <name>  Upload specific brand (kia, hyundai)
  upload-missing       Upload only missing images
  validate             Validate against mapping
  scan                 Scan local images

Configuration:
  Uses serviceAccountKey.json in scripts directory

Options:
  --force              Overwrite existing files
  --dry-run            Simulation mode (set CONFIG.dryRun = true)
          `);
      }
    } catch (error) {
      log(LOG_LEVELS.ERROR, `Command failed: ${error.message}`);
      process.exit(1);
    }
  }

  runCommand();
}

module.exports = {
  uploadVehicleImages,
  uploadByBrand,
  uploadMissingImages,
  validateAgainstMapping,
  scanLocalImages,
  CONFIG
};