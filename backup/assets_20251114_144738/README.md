# 앱 아이콘 및 스플래시 이미지 백업

**백업 일시**: 2025년 11월 14일 14:47:38

## 백업 내용

### iOS
- **경로**: `ios/app/Images.xcassets/`
- **내용**:
  - `AppIcon.appiconset` - 앱 아이콘
  - `SplashScreenBackground.colorset` - 스플래시 배경색
  - `SplashScreenLegacy.imageset` - 스플래시 이미지

### Android
- **경로**: `android/app/src/main/res/`
- **내용**:
  - `mipmap-anydpi-v26/` - 적응형 아이콘 (Android 8.0+)
  - `mipmap-hdpi/` - 고밀도 아이콘
  - `mipmap-mdpi/` - 중밀도 아이콘
  - `mipmap-xhdpi/` - 초고밀도 아이콘
  - `mipmap-xxhdpi/` - 초초고밀도 아이콘
  - `mipmap-xxxhdpi/` - 초초초고밀도 아이콘

## 복원 방법

### iOS 복원
```bash
# Images.xcassets 전체 복원
cp -r backup/assets_20251114_144738/ios/Images.xcassets ios/app/

# 또는 개별 복원
cp -r backup/assets_20251114_144738/ios/Images.xcassets/AppIcon.appiconset ios/app/Images.xcassets/
cp -r backup/assets_20251114_144738/ios/Images.xcassets/SplashScreenBackground.colorset ios/app/Images.xcassets/
cp -r backup/assets_20251114_144738/ios/Images.xcassets/SplashScreenLegacy.imageset ios/app/Images.xcassets/
```

### Android 복원
```bash
# 모든 mipmap 폴더 복원
cp -r backup/assets_20251114_144738/android/mipmap-* android/app/src/main/res/

# 또는 개별 복원 (예시)
cp -r backup/assets_20251114_144738/android/mipmap-hdpi android/app/src/main/res/
cp -r backup/assets_20251114_144738/android/mipmap-xhdpi android/app/src/main/res/
# ... (다른 해상도도 동일하게)
```

## 주의사항

1. **Prebuild 이후**: `npx expo prebuild` 실행 후 Assets 폴더가 재생성되므로, 필요시 이 백업에서 복원하세요.

2. **iOS 빌드 후**: Xcode에서 빌드 시 Images.xcassets가 변경될 수 있으므로 백업 확인이 필요합니다.

3. **Android 빌드 후**: Gradle 빌드 시 mipmap 폴더는 일반적으로 유지되지만, prebuild 후에는 재생성됩니다.

## 백업 구조
```
backup/assets_20251114_144738/
├── README.md (이 파일)
├── ios/
│   └── Images.xcassets/
│       ├── AppIcon.appiconset/
│       ├── SplashScreenBackground.colorset/
│       └── SplashScreenLegacy.imageset/
└── android/
    ├── mipmap-anydpi-v26/
    ├── mipmap-hdpi/
    ├── mipmap-mdpi/
    ├── mipmap-xhdpi/
    ├── mipmap-xxhdpi/
    └── mipmap-xxxhdpi/
```

## 복원이 필요한 경우

- `npx expo prebuild` 실행 후
- `npx expo prebuild --clean` 실행 후
- iOS/Android 네이티브 프로젝트 재생성 후
- Git에서 네이티브 폴더 리셋 후
