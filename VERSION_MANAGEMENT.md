# 📱 버전 관리 가이드

## 🎯 개요

**package.json**을 단일 버전 소스로 사용하여 모든 플랫폼의 버전 정보를 자동으로 동기화합니다.

### 자동 업데이트 대상

| 파일 | 필드 | 값 |
|------|------|-----|
| `package.json` | `version` | 단일 소스 (수동 변경 또는 npm version) |
| `app.config.js` | `version` | package.json과 동일 |
| `app.config.js` | `ios.buildNumber` | Git commit count |
| `app.config.js` | `android.versionCode` | Git commit count |
| `ios/app/Info.plist` | `CFBundleShortVersionString` | package.json version |
| `ios/app/Info.plist` | `CFBundleVersion` | Git commit count |
| `android/app/build.gradle` | `versionName` | package.json version |
| `android/app/build.gradle` | `versionCode` | Git commit count |

---

## 🚀 사용법

### 1️⃣ 버전만 동기화 (현재 버전 유지)

```bash
npm run sync-versions
```

**언제 사용?**
- Git commit 후 빌드 번호만 업데이트하고 싶을 때
- 수동으로 package.json 버전을 변경한 후

---

### 2️⃣ 버전 업그레이드 + 자동 동기화 (추천 ⭐)

#### Patch 버전 (1.1.3 → 1.1.4)
```bash
npm run version:patch
```

#### Minor 버전 (1.1.3 → 1.2.0)
```bash
npm run version:minor
```

#### Major 버전 (1.1.3 → 2.0.0)
```bash
npm run version:major
```

**자동 실행되는 작업:**
1. `package.json` 버전 업데이트
2. Git commit 생성 (예: "1.1.4")
3. Git tag 생성 (예: "v1.1.4")
4. 모든 파일 동기화 (`sync-versions.js` 실행)
5. 변경 사항을 기존 commit에 amend

---

## 📊 예시 플로우

### Case 1: 버그 수정 후 배포 (Patch)

```bash
# 1. 코드 수정
git add .
git commit -m "fix: 결제 에러 수정"

# 2. 버전 업그레이드 (1.1.3 → 1.1.4)
npm run version:patch

# 3. 원격 저장소에 푸시
git push
git push --tags

# 4. 빌드
npm run build:android:clean
```

**결과:**
- `package.json`: 1.1.4
- iOS buildNumber: 68 (commit count)
- Android versionCode: 68 (commit count)
- Git tag: v1.1.4

---

### Case 2: 새 기능 추가 후 배포 (Minor)

```bash
# 1. 기능 구현
git add .
git commit -m "feat: 토스 결제 추가"

# 2. 버전 업그레이드 (1.1.3 → 1.2.0)
npm run version:minor

# 3. 푸시 및 빌드
git push --follow-tags
npm run build:eas:all
```

---

### Case 3: Git commit만 추가 (버전 유지)

```bash
# 1. 리팩토링
git add .
git commit -m "refactor: 코드 정리"

# 2. 빌드 번호만 업데이트 (버전은 1.1.3 유지)
npm run sync-versions

# 3. 빌드
npm run build:android:clean
```

**결과:**
- `package.json`: 1.1.3 (유지)
- iOS buildNumber: 68 → 69 (commit count 증가)
- Android versionCode: 68 → 69 (commit count 증가)

---

## 🔧 내부 동작 원리

### Git Commit Count 기반 빌드 번호

```javascript
// scripts/sync-versions.js
function getBuildNumber() {
  const count = execSync('git rev-list --count HEAD').toString().trim();
  return parseInt(count, 10);
}
```

**장점:**
- ✅ 자동으로 증가 (수동 관리 불필요)
- ✅ 충돌 없음 (각 commit마다 고유)
- ✅ 브랜치별 독립적
- ✅ Apple/Google 심사 요구사항 충족

**단점:**
- ⚠️ Git history 조작 시 변경됨 (rebase, squash 등)
- ⚠️ 브랜치마다 다른 빌드 번호

---

## 📋 npm version 명령어 참고

| 명령어 | 현재 버전 | 다음 버전 | 용도 |
|--------|----------|----------|------|
| `npm version patch` | 1.1.3 | 1.1.4 | 버그 수정 |
| `npm version minor` | 1.1.3 | 1.2.0 | 새 기능 추가 |
| `npm version major` | 1.1.3 | 2.0.0 | 호환성 깨지는 변경 |
| `npm version prepatch` | 1.1.3 | 1.1.4-0 | 패치 프리릴리즈 |
| `npm version preminor` | 1.1.3 | 1.2.0-0 | 마이너 프리릴리즈 |
| `npm version premajor` | 1.1.3 | 2.0.0-0 | 메이저 프리릴리즈 |

---

## ⚙️ 고급 설정

### postversion Hook 커스터마이징

현재 `package.json`의 postversion 스크립트:

```json
{
  "scripts": {
    "postversion": "npm run sync-versions && git add . && git commit --amend --no-edit"
  }
}
```

**동작:**
1. `npm version patch` 실행 시 자동으로 실행됨
2. `sync-versions.js`로 모든 파일 동기화
3. 변경 사항을 기존 commit에 amend

**변경하고 싶다면:**
```json
{
  "postversion": "npm run sync-versions && git add . && echo '버전 업데이트 완료: %s' $npm_package_version"
}
```

---

## 🐛 트러블슈팅

### 문제: Info.plist 업데이트 실패

```
❌ Info.plist 업데이트 실패: Command failed
```

**원인:** macOS가 아니거나 PlistBuddy가 없음

**해결:**
1. macOS에서 실행하거나
2. CI/CD에서 macOS runner 사용
3. 또는 수동으로 Info.plist 수정

---

### 문제: Git commit count가 이상함

```
📌 빌드 번호: 1 (Git commit count)
```

**원인:** Git 저장소가 아님

**해결:**
```bash
git init
git add .
git commit -m "Initial commit"
npm run sync-versions
```

---

### 문제: 빌드 번호가 감소함

**원인:** Git rebase/squash 등으로 commit history가 변경됨

**해결:**
- `git rebase` 사용 자제
- 또는 수동으로 빌드 번호 지정 (스크립트 수정 필요)

---

## 📌 권장 워크플로우

### 일반 개발 (Patch 버전)

```bash
# 매일 개발
git add .
git commit -m "fix: ..."
npm run sync-versions  # 빌드 번호만 증가

# 주 1회 배포
npm run version:patch  # 1.1.3 → 1.1.4
git push --follow-tags
npm run build:android:clean
```

### 대규모 릴리스 (Minor/Major 버전)

```bash
# 기능 완성
git add .
git commit -m "feat: 토스 결제 추가"

# 버전 업그레이드
npm run version:minor  # 1.1.3 → 1.2.0

# 릴리스 노트 작성 (선택)
gh release create v1.2.0 --notes "새로운 기능: 토스 결제"

# 푸시 및 빌드
git push --follow-tags
npm run build:eas:all
```

---

## 🔗 관련 파일

- `scripts/sync-versions.js` - 자동 동기화 스크립트
- `package.json` - 버전 단일 소스
- `app.config.js` - Expo 설정
- `ios/app/Info.plist` - iOS 버전 정보
- `android/app/build.gradle` - Android 버전 정보

---

## 💡 추가 개선 아이디어

### 1. Changelog 자동 생성
```bash
npm install -D standard-version
npm run release  # 자동으로 CHANGELOG.md 생성
```

### 2. CI/CD 통합 (GitHub Actions)
```yaml
- name: 버전 동기화
  run: npm run sync-versions
```

### 3. Pre-commit Hook
```bash
# .husky/pre-commit
npm run sync-versions
git add app.config.js ios/app/Info.plist android/app/build.gradle
```

---

**마지막 업데이트:** 2025-12-01
**작성자:** Claude Code
