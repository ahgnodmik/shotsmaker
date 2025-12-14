# 🚀 빠른 시작 가이드

## 1단계: 프로젝트 설정

### 의존성 설치

```bash
cd shorts-content-studio
npm install
```

### 환경 변수 설정

`.env.local` 파일 확인 및 설정:

```env
# OpenAI API Key (필수)
OPENAI_API_KEY=sk-proj-...

# Google Sheets API (필수)
GOOGLE_SHEET_ID=1nPNRi5L8HlI8T8mw0YZ5XLQoKiKKbXIDf6vEi-HPPh8
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OpenAI Model (선택사항, 기본값: gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

## 2단계: Google Sheets 설정

### Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. "API 및 서비스" > "라이브러리"
4. "Google Sheets API" 검색 후 활성화
5. "API 및 서비스" > "사용자 인증 정보"
6. "사용자 인증 정보 만들기" > "서비스 계정" 선택
7. 서비스 계정 생성 후 "키 추가" > "JSON" 다운로드

### 환경 변수에 인증 정보 추가

다운로드한 JSON 파일에서:

- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY` (전체를 따옴표로 감싸기)

### Google Sheets 공유

1. Google Sheets 열기: https://docs.google.com/spreadsheets/d/1nPNRi5L8HlI8T8mw0YZ5XLQoKiKKbXIDf6vEi-HPPh8/edit
2. 오른쪽 상단 "공유" 버튼 클릭
3. Service Account 이메일 추가 (권한: 편집자)

### 시트 구조 설정

자동 설정 (권장):

```bash
npm run setup-sheets
```

또는 수동 설정:

Google Sheets에서 다음 탭들을 생성:

1. **Topics_Pool** (주제 풀)
   - A: 카테고리
   - B: 주제 키워드
   - C: 한 줄 설명
   - D: 사용 여부

2. **Weekly_Trend** (주간 트렌드)
   - A: 날짜
   - B: 키워드
   - C: 소스
   - D: 관련도
   - E: 메모

3. **Weekly_Plan** (주간 계획)
   - A: 주차
   - B: 업로드 예정일1
   - C: 업로드 예정일2
   - D: 주제1
   - E: 주제2
   - F: 트렌드 키워드

4. **Shorts_Content** (숏츠 콘텐츠)
   - A: ID
   - B: 업로드 주차
   - C: 업로드 목표 날짜
   - D: 상태
   - E: 주제 키워드
   - F: 최종 제목
   - G: YouTube 설명란
   - H: 해시태그
   - I: 대본(스크립트)
   - J: 한 줄 훅
   - K: 참고 트렌드 키워드
   - L: 참고 영상 링크
   - M: 메모

5. **References** (참고 자료)
   - A: 레퍼런스 ID
   - B: 타입
   - C: 링크(URL)
   - D: 관련 주제 키워드
   - E: 메모
   - F: 사용 여부

자세한 내용은 [SHEETS_STRUCTURE.md](./SHEETS_STRUCTURE.md) 참고

## 3단계: 주제 생성

### 각 카테고리별로 주제 생성

```bash
# 경제·생활 카테고리
npm run generate-topics "경제·생활" 20

# IT·디지털 카테고리
npm run generate-topics "IT·디지털" 20

# 직장인 카테고리
npm run generate-topics "직장인" 15

# 생활·기타 카테고리
npm run generate-topics "생활·기타" 15
```

생성된 주제는 `Topics_Pool` 시트에 자동으로 추가됩니다.

## 4단계: 주간 계획 수립

### Google Sheets에서 수동 입력

`Weekly_Plan` 탭에 이번 주 계획 추가:

| 주차 | 업로드 예정일1 | 업로드 예정일2 | 주제1 | 주제2 | 트렌드 키워드 |
|------|---------------|---------------|-------|-------|--------------|
| 2025-W21 | 2025-01-22 | 2025-01-25 | ETF | 라우터 | 전기요금 |

주차 형식: `YYYY-W[주차]` (예: `2025-W21`)

## 5단계: 콘텐츠 자동 생성

### 현재 주차 자동 감지

```bash
npm run generate-weekly-content
```

### 특정 주차 지정

```bash
npm run generate-weekly-content "2025-W21"
```

이 명령어는:

1. `Weekly_Plan`에서 해당 주차 계획 읽기
2. 주제 2개에 대해 GPT로 제목/설명/스크립트/해시태그 생성
3. `Shorts_Content` 시트에 결과 추가

## 6단계: 대시보드 확인

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 주요 페이지

- `/` - 메인 대시보드
- `/shorts` - 숏츠 콘텐츠 목록 및 관리
- `/topics` - 주제 풀 관리
- `/references` - 참고 자료 (준비 중)

## 📋 일반적인 워크플로우

### 매주 반복 작업

1. **일요일 밤 / 월요일 아침**: 주간 트렌드 확인
   - `Weekly_Trend` 시트에 트렌드 키워드 추가 (수동)

2. **주간 계획 수립**:
   - `Topics_Pool`에서 주제 2개 선택
   - `Weekly_Plan`에 이번 주 계획 추가

3. **콘텐츠 자동 생성**:
   ```bash
   npm run generate-weekly-content
   ```

4. **대시보드에서 확인**:
   - 생성된 콘텐츠 검토
   - 필요시 수정

5. **촬영 및 편집**:
   - 상태를 "촬영중"으로 변경
   - 편집 완료 시 "편집중"으로 변경
   - 업로드 완료 시 "업로드완료"로 변경

### 주제 풀 확장 (필요시)

```bash
# 카테고리가 부족할 때
npm run generate-topics "경제·생활" 30
```

## 🔍 문제 해결

### "권한이 없습니다" 오류

- Service Account 이메일이 시트에 공유되었는지 확인
- 권한이 "편집자"인지 확인

### "시트를 찾을 수 없습니다" 오류

- `GOOGLE_SHEET_ID`가 올바른지 확인
- 시트 URL에서 ID 추출: `https://docs.google.com/spreadsheets/d/[ID]/edit`

### "인증 실패" 오류

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`과 `GOOGLE_PRIVATE_KEY` 확인
- Private Key의 `\n`이 제대로 포함되어 있는지 확인

### API 오류

- OpenAI API 키가 유효한지 확인
- Google Sheets API가 활성화되었는지 확인

## 📚 추가 자료

- [시트 구조 문서](./SHEETS_STRUCTURE.md)
- [Google Sheets 설정 가이드](./GOOGLE_SHEETS_SETUP.md)
- [프로젝트 README](../README.md)

## 🎉 다음 단계

1. 주제 풀을 충분히 확장
2. 주간 계획을 정기적으로 수립
3. 콘텐츠 생성 → 검토 → 촬영 → 편집 → 업로드 사이클 구축
4. Netlify에 배포하여 언제 어디서나 접근 가능하게 만들기

