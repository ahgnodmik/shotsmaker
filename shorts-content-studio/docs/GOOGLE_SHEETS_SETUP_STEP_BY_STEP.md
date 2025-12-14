# Google Sheets API 설정 - 단계별 가이드

## 🎯 목표

Google Sheets를 데이터베이스로 사용하여 콘텐츠를 관리하기 위한 API 인증 설정

## 📋 전체 과정 요약

1. Google Cloud Console에서 프로젝트 생성
2. Google Sheets API 활성화
3. Service Account 생성
4. 키(JSON) 다운로드
5. 환경 변수에 인증 정보 추가
6. Google Sheets에 Service Account 공유
7. 인증 테스트

---

## 1단계: Google Cloud Console 접속

### 1-1. 접속
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Google 계정으로 로그인

### 1-2. 프로젝트 생성 또는 선택
1. 상단 프로젝트 선택 메뉴 클릭
2. "새 프로젝트" 클릭
3. 프로젝트 이름 입력 (예: `shorts-content-studio`)
4. "만들기" 클릭
5. 생성 완료까지 대기 (몇 초 소요)

---

## 2단계: Google Sheets API 활성화

### 2-1. API 라이브러리 이동
1. 왼쪽 메뉴에서 "API 및 서비스" > "라이브러리" 클릭
   - 또는 직접 링크: https://console.cloud.google.com/apis/library

### 2-2. Google Sheets API 검색 및 활성화
1. 검색창에 "Google Sheets API" 입력
2. "Google Sheets API" 선택
3. "사용 설정" 버튼 클릭
4. 활성화 완료까지 대기

---

## 3단계: Service Account 생성

### 3-1. 사용자 인증 정보 페이지 이동
1. 왼쪽 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 클릭
   - 또는 직접 링크: https://console.cloud.google.com/apis/credentials

### 3-2. Service Account 생성
1. 상단의 "+ 사용자 인증 정보 만들기" 클릭
2. "서비스 계정" 선택

### 3-3. Service Account 정보 입력
1. **서비스 계정 이름**: `shorts-content-studio` (원하는 이름)
2. **서비스 계정 ID**: 자동 생성됨 (변경 가능)
3. **서비스 계정 설명** (선택사항): "콘텐츠 스튜디오 자동화"
4. "만들기 및 계속" 클릭

### 3-4. 역할 설정 (선택사항)
1. 역할(역할) 선택 화면이 나타나면 **건너뛰기** (필요 없음)
2. "계속" 또는 "완료" 클릭

---

## 4단계: 키 생성 및 다운로드

### 4-1. 생성된 Service Account 클릭
1. 사용자 인증 정보 페이지에서 방금 생성한 Service Account 클릭
   - 이메일 주소가 `xxx@xxx.iam.gserviceaccount.com` 형식

### 4-2. 키 추가
1. 상단의 "키" 탭 클릭
2. "키 추가" > "새 키 만들기" 클릭

### 4-3. 키 형식 선택
1. **키 유형**: "JSON" 선택
2. "만들기" 클릭
3. JSON 파일이 자동으로 다운로드됩니다

### 4-4. 다운로드한 JSON 파일 확인
다운로드 폴더에서 JSON 파일 열기 (예: `shorts-content-studio-xxxxx-xxxxx.json`)

JSON 파일 내용 예시:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "shorts-content-studio@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

---

## 5단계: 환경 변수 설정

### 5-1. JSON 파일에서 필요한 정보 추출
JSON 파일에서 다음 2개 정보만 필요합니다:

1. **client_email**: `shorts-content-studio@xxx.iam.gserviceaccount.com`
2. **private_key**: `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`

### 5-2. .env.local 파일 편집
프로젝트 루트의 `.env.local` 파일 열기

### 5-3. 인증 정보 추가
다음 형식으로 추가:

```env
# Google Sheets API
GOOGLE_SHEET_ID=1nPNRi5L8HlI8T8mw0YZ5XLQoKiKKbXIDf6vEi-HPPh8
GOOGLE_SERVICE_ACCOUNT_EMAIL=shorts-content-studio@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

⚠️ **중요 사항**:
- `GOOGLE_PRIVATE_KEY`는 **따옴표(`"`)로 감싸야 합니다**
- `\n` (줄바꿈)이 그대로 포함되어야 합니다
- JSON 파일의 `private_key` 값을 그대로 복사

### 5-4. .env.local 파일 예시 (전체)
```env
# OpenAI API Key
OPENAI_API_KEY=sk-proj-...your-api-key-here...

# Google Sheets API
GOOGLE_SHEET_ID=your-sheet-id-here
GOOGLE_SERVICE_ACCOUNT_EMAIL=shorts-content-studio@your-project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# OpenAI Model (선택사항)
OPENAI_MODEL=gpt-4o-mini
```

---

## 6단계: Google Sheets에 Service Account 공유

### 6-1. Google Sheets 열기
1. [Google Sheets 링크](https://docs.google.com/spreadsheets/d/1nPNRi5L8HlI8T8mw0YZ5XLQoKiKKbXIDf6vEi-HPPh8/edit) 접속
   - 또는 시트 ID를 사용하여 직접 접속

### 6-2. 공유 설정
1. 오른쪽 상단의 **"공유"** 버튼 클릭
2. **"사용자 및 그룹 추가"** 필드에 Service Account 이메일 입력
   - 예: `shorts-content-studio@your-project-id.iam.gserviceaccount.com`
   - ⚠️ 이메일은 `.env.local`의 `GOOGLE_SERVICE_ACCOUNT_EMAIL`과 동일해야 합니다

### 6-3. 권한 설정
1. 권한 드롭다운에서 **"편집자"** 선택
   - "뷰어"는 읽기만 가능하므로 "편집자" 선택
2. **"전송"** 클릭
3. 확인 메시지가 나타나면 "완료"

---

## 7단계: 인증 테스트

### 7-1. 인증 상태 확인 스크립트 실행
터미널에서 실행:

```bash
cd shorts-content-studio
npm run check-google-auth
```

### 7-2. 예상 결과
성공 시:
```
🔍 Google Sheets API 인증 상태 확인 중...

1️⃣ 환경 변수 확인:
   GOOGLE_SHEET_ID: ✅ 설정됨
   GOOGLE_SERVICE_ACCOUNT_EMAIL: ✅ 설정됨
   GOOGLE_PRIVATE_KEY: ✅ 설정됨

2️⃣ Google Sheets API 연결 테스트 중...

✅ API 연결 성공!
   시트 제목: your-sheet-title

3️⃣ 시트 읽기 테스트 중...

✅ 시트 읽기 성공!

시트 구조가 올바르게 설정되어 있습니다. 🎉
```

### 7-3. 오류 발생 시 해결 방법

#### 오류 1: "환경 변수가 설정되지 않았습니다"
- `.env.local` 파일이 올바른 위치에 있는지 확인
- 환경 변수 이름이 정확한지 확인

#### 오류 2: "API 연결 실패" 또는 "unauthorized"
- Service Account 이메일이 Google Sheets에 공유되었는지 확인
- 공유 권한이 "편집자"인지 확인
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` 값이 정확한지 확인

#### 오류 3: "invalid_grant"
- `GOOGLE_PRIVATE_KEY`가 따옴표로 감싸져 있는지 확인
- `\n`이 제대로 포함되어 있는지 확인
- JSON 파일에서 `private_key` 값을 그대로 복사했는지 확인

#### 오류 4: "시트를 찾을 수 없습니다"
- `GOOGLE_SHEET_ID`가 올바른지 확인
- URL에서 ID 확인: `https://docs.google.com/spreadsheets/d/[ID]/edit`

---

## 8단계: 시트 구조 설정 (선택사항)

인증이 완료되면 시트 구조를 자동으로 설정할 수 있습니다:

```bash
npm run setup-sheets
```

또는 수동으로 Google Sheets에 다음 탭들을 생성:
- `Topics_Pool`
- `Weekly_Trend`
- `Weekly_Plan`
- `Shorts_Content`
- `References`

자세한 내용은 `docs/SHEETS_STRUCTURE.md` 참고

---

## ✅ 완료!

인증이 성공적으로 완료되면 다음 명령어들을 사용할 수 있습니다:

```bash
# 주제 생성
npm run generate-topics "경제·생활" 15

# 주간 콘텐츠 생성
npm run generate-weekly-content

# 개발 서버 실행
npm run dev
```

---

## 🔒 보안 주의사항

1. **JSON 키 파일 보관**
   - JSON 키 파일은 절대 Git에 커밋하지 마세요
   - `.gitignore`에 이미 포함되어 있습니다
   - 키 파일은 안전한 곳에 백업 보관

2. **환경 변수 보호**
   - `.env.local` 파일은 로컬에서만 사용
   - Netlify 배포 시 환경 변수만 추가 (파일 업로드 X)

3. **Service Account 권한**
   - 필요한 시트에만 공유
   - "편집자" 권한으로 충분 (관리자 권한 불필요)

---

## 📚 추가 자료

- [Google Sheets API 문서](https://developers.google.com/sheets/api)
- [Service Account 문서](https://cloud.google.com/iam/docs/service-accounts)
- [프로젝트 README](../README.md)

---

## 🆘 문제 해결

문제가 발생하면:
1. `npm run check-google-auth` 실행하여 상세 오류 확인
2. `docs/GOOGLE_SHEETS_SETUP.md` 참고
3. Google Cloud Console에서 API 활성화 상태 확인
4. Google Sheets 공유 설정 확인

