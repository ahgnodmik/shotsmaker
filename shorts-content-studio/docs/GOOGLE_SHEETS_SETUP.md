# Google Sheets API 설정 가이드

## 1. Google Cloud Console 설정

### 1-1. 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 (또는 기존 프로젝트 선택)

### 1-2. Google Sheets API 활성화
1. "API 및 서비스" > "라이브러리"로 이동
2. "Google Sheets API" 검색 후 활성화

### 1-3. Service Account 생성
1. "API 및 서비스" > "사용자 인증 정보"로 이동
2. "사용자 인증 정보 만들기" > "서비스 계정" 선택
3. 서비스 계정 이름 입력 (예: `shorts-content-studio`)
4. "만들기" 클릭
5. 역할은 필요 없으니 건너뛰고 "완료" 클릭

### 1-4. 키 생성
1. 생성된 서비스 계정 클릭
2. "키" 탭으로 이동
3. "키 추가" > "새 키 만들기"
4. JSON 형식 선택 후 "만들기"
5. JSON 파일이 다운로드됩니다.

### 1-5. 인증 정보 추출
다운로드한 JSON 파일에서 다음 정보를 추출:

```json
{
  "client_email": "xxxxx@xxxxx.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

## 2. 환경 변수 설정

`.env.local` 파일에 추가:

```env
GOOGLE_SHEET_ID=1nPNRi5L8HlI8T8mw0YZ5XLQoKiKKbXIDf6vEi-HPPh8
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxxx@xxxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

⚠️ **주의**: `GOOGLE_PRIVATE_KEY`는 따옴표로 감싸고, `\n`을 그대로 포함해야 합니다.

## 3. Google Sheets 권한 설정

1. Google Sheets를 열어주세요: https://docs.google.com/spreadsheets/d/[YOUR_SHEET_ID]/edit
2. 오른쪽 상단 "공유" 버튼 클릭
3. Service Account 이메일 주소를 입력
4. 권한: "편집자" 또는 "뷰어" (편집이 필요하면 편집자)
5. "전송" 클릭

## 4. 시트 구조 설정

### 방법 1: 자동 설정 (권장)
Service Account 설정 완료 후:

```bash
npm run setup-sheets
```

### 방법 2: 수동 설정
Google Sheets에서 직접:

1. 시트 탭 생성/이름 변경:
   - `Topics_Pool`
   - `Weekly_Trend`
   - `Weekly_Plan`
   - `Shorts_Content`
   - `References`

2. 각 탭에 헤더 추가 (첫 번째 행)

**Topics_Pool**
```
A: 카테고리
B: 주제 키워드
C: 한 줄 설명
D: 사용 여부
```

**Weekly_Trend**
```
A: 날짜
B: 키워드
C: 소스
D: 관련도
E: 메모
```

**Weekly_Plan**
```
A: 주차
B: 업로드 예정일1
C: 업로드 예정일2
D: 주제1
E: 주제2
F: 트렌드 키워드
```

**Shorts_Content**
```
A: ID
B: 업로드 주차
C: 업로드 목표 날짜
D: 상태
E: 주제 키워드
F: 최종 제목
G: YouTube 설명란
H: 해시태그
I: 대본(스크립트)
J: 한 줄 훅
K: 참고 트렌드 키워드
L: 참고 영상 링크
M: 메모
```

**References**
```
A: 레퍼런스 ID
B: 타입
C: 링크(URL)
D: 관련 주제 키워드
E: 메모
F: 사용 여부
```

## 5. 테스트

설정이 완료되면 다음 명령어로 테스트:

```bash
# 주제 생성 테스트
npm run generate-topics "경제·생활" 5

# 또는 시트 구조 확인
npm run setup-sheets
```

## 문제 해결

### "권한이 없습니다" 오류
- Service Account 이메일이 시트에 공유되었는지 확인
- 권한이 "편집자"인지 확인

### "시트를 찾을 수 없습니다" 오류
- `GOOGLE_SHEET_ID`가 올바른지 확인
- URL에서 ID 추출: `https://docs.google.com/spreadsheets/d/[ID]/edit`

### "인증 실패" 오류
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`과 `GOOGLE_PRIVATE_KEY` 확인
- Private Key의 `\n`이 제대로 포함되어 있는지 확인

