#!/usr/bin/env node

/**
 * 버전 자동 동기화 스크립트
 *
 * package.json을 단일 소스로 사용하여 모든 버전 정보를 자동 업데이트합니다.
 *
 * 사용법:
 *   node scripts/sync-versions.js
 *
 * 업데이트 대상:
 *   - app.config.js (version)
 *   - app.config.js (iOS buildNumber, Android versionCode) ← git commit count
 *   - ios/app/Info.plist (CFBundleShortVersionString, CFBundleVersion)
 *   - android/app/build.gradle (versionName, versionCode)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================
// 1️⃣ Git Commit Count 조회 (빌드 번호로 사용)
// ============================================================
function getBuildNumber() {
  try {
    const count = execSync('git rev-list --count HEAD').toString().trim();
    return parseInt(count, 10);
  } catch (error) {
    console.warn('⚠️  Git commit count 조회 실패. 기본값 1 사용');
    return 1;
  }
}

// ============================================================
// 2️⃣ package.json 버전 읽기
// ============================================================
function getPackageVersion() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

// ============================================================
// 3️⃣ app.config.js 업데이트
// ============================================================
function updateAppConfig(version, buildNumber) {
  const configPath = path.join(__dirname, '../app.config.js');
  let config = fs.readFileSync(configPath, 'utf8');

  // version 업데이트
  config = config.replace(
    /version:\s*["'][\d.]+["']/,
    `version: "${version}"`
  );

  // iOS buildNumber 업데이트
  config = config.replace(
    /buildNumber:\s*["']\d+["']/,
    `buildNumber: "${buildNumber}"`
  );

  // Android versionCode 업데이트
  config = config.replace(
    /versionCode:\s*\d+/,
    `versionCode: ${buildNumber}`
  );

  fs.writeFileSync(configPath, config, 'utf8');
  console.log('✅ app.config.js 업데이트 완료');
}

// ============================================================
// 4️⃣ iOS Info.plist 업데이트 (PlistBuddy 사용)
// ============================================================
function updateInfoPlist(version, buildNumber) {
  const plistPath = path.join(__dirname, '../ios/app/Info.plist');

  if (!fs.existsSync(plistPath)) {
    console.warn('⚠️  Info.plist 파일이 없습니다. iOS 빌드 스킵');
    return;
  }

  try {
    // CFBundleShortVersionString (버전)
    execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${version}" "${plistPath}"`);

    // CFBundleVersion (빌드 번호)
    execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${buildNumber}" "${plistPath}"`);

    console.log('✅ ios/app/Info.plist 업데이트 완료');
  } catch (error) {
    console.error('❌ Info.plist 업데이트 실패:', error.message);
  }
}

// ============================================================
// 5️⃣ Android build.gradle 업데이트
// ============================================================
function updateBuildGradle(version, buildNumber) {
  const gradlePath = path.join(__dirname, '../android/app/build.gradle');

  if (!fs.existsSync(gradlePath)) {
    console.warn('⚠️  build.gradle 파일이 없습니다. Android 빌드 스킵');
    return;
  }

  let gradle = fs.readFileSync(gradlePath, 'utf8');

  // versionCode 업데이트
  gradle = gradle.replace(
    /versionCode\s+\d+/,
    `versionCode ${buildNumber}`
  );

  // versionName 업데이트
  gradle = gradle.replace(
    /versionName\s+["'][\d.]+["']/,
    `versionName "${version}"`
  );

  fs.writeFileSync(gradlePath, gradle, 'utf8');
  console.log('✅ android/app/build.gradle 업데이트 완료');
}

// ============================================================
// 🚀 메인 실행
// ============================================================
function main() {
  console.log('\n🔄 버전 자동 동기화 시작...\n');

  const version = getPackageVersion();
  const buildNumber = getBuildNumber();

  console.log(`📌 버전: ${version}`);
  console.log(`📌 빌드 번호: ${buildNumber} (Git commit count)\n`);

  updateAppConfig(version, buildNumber);
  updateInfoPlist(version, buildNumber);
  updateBuildGradle(version, buildNumber);

  console.log('\n✨ 모든 버전 정보가 동기화되었습니다!\n');
  console.log('변경된 파일:');
  console.log('  - app.config.js');
  console.log('  - ios/app/Info.plist');
  console.log('  - android/app/build.gradle\n');
}

main();
