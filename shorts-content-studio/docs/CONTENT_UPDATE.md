# 콘텐츠 재검토 및 업데이트 가이드

Google Sheets의 콘텐츠를 재검토하고, ChatGPT를 통해 자동으로 개선하여 스프레드시트에 업데이트하는 방법을 안내합니다.

## 기능 개요

1. **검증**: 콘텐츠의 정확성을 검증하고 문제점을 발견
2. **자동 개선**: ChatGPT가 검증 결과를 바탕으로 스크립트를 정확한 정보로 개선
3. **자동 업데이트**: 개선된 내용을 Google Sheets에 자동으로 업데이트

## 사용 방법

### 1. 검증만 수행하기

콘텐츠의 문제점만 확인하고 싶을 때:

```bash
npm run update-content <content-id>
```

또는 명시적으로:

```bash
npm run update-content <content-id> --verify-only
```

**예시:**
```bash
npm run update-content 1
```

**출력:**
- 검증 결과 (통과/실패)
- 발견된 문제점
- 경고 사항
- 개선 제안
- 검증된 사실

### 2. 미리보기 모드 (업데이트 안 함)

ChatGPT가 개선한 내용을 미리 확인하고 싶을 때:

```bash
npm run update-content <content-id> --auto-improve --preview
```

**예시:**
```bash
npm run update-content 1 --auto-improve --preview
```

**출력:**
- 검증 결과
- 개선된 스크립트
- 변경 사항 설명
- 개선된 제목/설명 (있는 경우)
- ⚠️ 실제로 업데이트하지 않음

### 3. 자동 개선 및 업데이트

ChatGPT로 개선하고 Google Sheets에 자동 업데이트:

```bash
npm run update-content <content-id> --auto-improve
```

**예시:**
```bash
npm run update-content 1 --auto-improve
```

**프로세스:**
1. 콘텐츠 검증
2. ChatGPT가 스크립트 개선
3. 개선된 내용 표시
4. **Google Sheets에 자동 업데이트**
5. 업데이트 완료 메시지

**업데이트되는 필드:**
- ✅ 스크립트: 개선된 내용으로 업데이트
- ✅ 제목: 개선된 경우 업데이트
- ✅ 설명: 개선된 경우 업데이트
- ✅ 훅: 스크립트 첫 문장으로 자동 업데이트
- ✅ 메모: 개선 이력 추가

### 4. 완전히 새로운 스크립트 재생성

거짓 정보가 많거나 완전히 새로운 접근이 필요할 때:

```bash
npm run update-content <content-id> --regenerate
```

**예시:**
```bash
npm run update-content 1 --regenerate
```

**프로세스:**
1. 콘텐츠 검증 (현재 상태 확인)
2. ChatGPT가 **완전히 새로운 스크립트 재생성**
3. 재생성된 콘텐츠 검증
4. 재생성된 내용 표시
5. **Google Sheets에 자동 업데이트**
6. 업데이트 완료 메시지

**업데이트되는 필드:**
- ✅ 스크립트: 완전히 새로운 내용으로 재생성
- ✅ 제목: 재생성됨
- ✅ 설명: 재생성됨
- ✅ 해시태그: 재생성됨
- ✅ 훅: 재생성됨
- ✅ 메모: 재생성 이력 추가

**언제 사용하나요?**
- 거짓 정보가 너무 많아 개선보다 재생성이 나을 때
- 기존 스크립트의 구조나 접근 방식이 문제가 있을 때
- 완전히 새로운 관점으로 콘텐츠를 만들고 싶을 때

## 워크플로우 예시

### 시나리오 1: 문제 발견 후 개선

```bash
# 1단계: 검증하여 문제점 확인
npm run update-content 1

# 2단계: 개선 내용 미리보기
npm run update-content 1 --auto-improve --preview

# 3단계: 만족스러우면 실제 업데이트
npm run update-content 1 --auto-improve
```

### 시나리오 2: 바로 개선 및 업데이트

```bash
# 검증 → 개선 → 업데이트를 한 번에
npm run update-content 1 --auto-improve
```

### 시나리오 3: 거짓 정보가 많을 때 완전히 재생성

```bash
# 1단계: 검증하여 문제점 확인
npm run update-content 1

# 2단계: 재생성 내용 미리보기
npm run update-content 1 --regenerate --preview

# 3단계: 만족스러우면 실제 재생성 및 업데이트
npm run update-content 1 --regenerate
```

## 개선 기능 상세

### ChatGPT가 개선하는 내용

1. **거짓 정보 수정**: 검증 결과를 바탕으로 정확한 정보로 수정
2. **불확실한 내용 제거**: 추측이나 일반화된 주장을 구체적인 정보로 변경
3. **과장/왜곡 수정**: 과장된 표현을 정확한 표현으로 수정
4. **구체성 향상**: 구체적인 숫자, 법률 조항, 규정 등 추가
5. **최신성 반영**: 최신 정보로 업데이트

### 개선 예시

**개선 전:**
```
신용카드를 사용하면 포인트가 쌓이고, 발급 시 보너스 포인트를 받을 수 있습니다.
특정 카드로 쇼핑하면 포인트를 두 배로 받을 수 있어요.
포인트를 모으면 무료 항공권도 받을 수 있습니다!
```

**개선 후:**
```
신용카드를 사용할 때 포인트가 쌓이는 방식은 카드사마다 다릅니다.
많은 카드가 발급 시 보너스 포인트를 제공하지만, 이는 카드에 따라 다르니 확인이 필요합니다.
예를 들어, A카드는 첫 사용 시 5,000 포인트를 제공하며,
특정 쇼핑몰에서 사용할 경우 포인트가 두 배로 적립됩니다.
신용카드 포인트를 잘 활용하면 무료 항공권 같은 혜택도 기대할 수 있습니다.
```

## 주의사항

1. **미리보기 권장**: 처음 사용할 때는 `--preview` 플래그로 먼저 확인하세요
2. **메모 확인**: 업데이트 후 메모 필드에 개선 이력이 추가됩니다
3. **백업**: 중요한 콘텐츠는 업데이트 전 Google Sheets에서 백업하세요
4. **재검증**: 업데이트 후 필요시 다시 검증하세요

## 문제 해결

### 업데이트가 안 될 때

1. Google Sheets 권한 확인
2. Service Account가 스프레드시트에 접근 권한이 있는지 확인
3. 콘텐츠 ID가 올바른지 확인

### 개선 결과가 마음에 안 들 때

1. Google Sheets에서 직접 수정
2. 또는 다시 `--auto-improve` 실행 (다른 결과가 나올 수 있음)

## 관련 명령어

```bash
# 콘텐츠 생성
npm run generate-weekly-content

# 영상 생성 (개선된 스크립트 사용)
npm run generate-video <content-id>

# 영상 생성 (검증 건너뛰기)
npm run generate-video <content-id> --force
```


