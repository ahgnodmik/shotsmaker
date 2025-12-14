# 📹 콘텐츠 스튜디오 대시보드

"그거 모르죠? 내가 알려줌" 시리즈를 위한 1인 콘텐츠 스튜디오 자동화 시스템

## ✨ 주요 기능

1. **주제 풀 자동 확장** - GPT로 무한 주제 생성
2. **주간 트렌드 반영** - 트렌드 키워드를 주제에 반영
3. **콘텐츠 자동 생성** - 제목/설명/스크립트/해시태그 자동 생성
4. **영상 자동 생성** - TTS + 이미지/비디오 + 자막 자동 편집
5. **YouTube 자동 업로드** - 생성된 영상을 YouTube에 자동 업로드
6. **Google Sheets 연동** - 모든 데이터를 시트에서 관리
7. **관리 대시보드** - 웹 인터페이스로 콘텐츠 관리

## 🚀 빠른 시작

### 1. 환경 변수 설정

`.env.local` 파일 생성:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Google Sheets API
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OpenAI Model (선택사항)
OPENAI_MODEL=gpt-4o-mini

# YouTube API (선택사항 - 영상 업로드하려면 필요)
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
YOUTUBE_REFRESH_TOKEN=your-refresh-token

# 이미지/비디오 소스 API (선택사항 - 영상 생성하려면 하나 이상 필요)
UNSPLASH_ACCESS_KEY=your-unsplash-key
PEXELS_API_KEY=your-pexels-key
```

### 2. Google Sheets 설정

자세한 설정 방법은 [docs/GOOGLE_SHEETS_SETUP.md](./docs/GOOGLE_SHEETS_SETUP.md)를 참고하세요.

1. Google Cloud Console에서 프로젝트 생성
2. Google Sheets API 활성화
3. Service Account 생성 및 키 다운로드
4. 환경 변수에 인증 정보 추가
5. Google Sheets에 Service Account 이메일 공유

### 3. 시트 구조 설정

```bash
npm run setup-sheets
```

또는 수동으로 Google Sheets에 다음 탭들을 생성:

- `Topics_Pool` - 주제 풀
- `Weekly_Trend` - 주간 트렌드
- `Weekly_Plan` - 주간 계획
- `Shorts_Content` - 숏츠 콘텐츠
- `References` - 참고 자료

시트 구조는 [docs/SHEETS_STRUCTURE.md](./docs/SHEETS_STRUCTURE.md)를 참고하세요.

### 4. 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📝 사용 방법

### 주제 생성

특정 카테고리의 주제를 생성하고 Google Sheets에 추가:

```bash
npm run generate-topics "경제·생활" 15
npm run generate-topics "IT·디지털" 20
npm run generate-topics "직장인" 10
```

카테고리:
- 경제·생활
- IT·디지털
- 직장인
- 생활·기타

### 주간 콘텐츠 생성

`Weekly_Plan`에서 이번 주 2개 주제를 읽어와서 `Shorts_Content`에 자동 생성:

```bash
npm run generate-weekly-content
```

또는 특정 주차 지정:

```bash
npm run generate-weekly-content "2025-W21"
```

### 웹 대시보드

- `/` - 메인 대시보드
- `/shorts` - 숏츠 콘텐츠 목록 및 관리
- `/topics` - 주제 풀 관리
- `/references` - 참고 자료 (준비 중)

## 📁 프로젝트 구조

```
shorts-content-studio/
├── app/
│   ├── api/              # API 라우트
│   │   ├── shorts/       # 숏츠 콘텐츠 API
│   │   └── topics/       # 주제 풀 API
│   ├── shorts/           # 숏츠 콘텐츠 페이지
│   ├── topics/           # 주제 풀 페이지
│   ├── references/       # 참고 자료 페이지
│   ├── layout.tsx        # 레이아웃
│   └── page.tsx          # 메인 페이지
├── lib/
│   ├── openai.ts         # OpenAI API 유틸리티
│   └── sheets.ts         # Google Sheets API 유틸리티
├── scripts/
│   ├── generate-topics.ts       # 주제 생성 스크립트
│   ├── generate-weekly-content.ts  # 주간 콘텐츠 생성 스크립트
│   └── setup-sheets.ts          # 시트 구조 설정 스크립트
├── docs/
│   ├── SHEETS_STRUCTURE.md      # 시트 구조 문서
│   └── GOOGLE_SHEETS_SETUP.md   # Google Sheets 설정 가이드
└── .env.local            # 환경 변수 (gitignore)
```

## 🔧 기술 스택

- **Next.js 16** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **OpenAI API** - GPT 기반 콘텐츠 생성, TTS
- **Google Sheets API** - 데이터 저장소
- **YouTube Data API v3** - 영상 업로드
- **FFmpeg** - 영상 편집
- **Unsplash/Pexels API** - 이미지/비디오 소스
- **Netlify** - 호스팅 (예정)

## 📚 문서

- [시트 구조 문서](./docs/SHEETS_STRUCTURE.md)
- [Google Sheets 설정 가이드](./docs/GOOGLE_SHEETS_SETUP.md)
- [영상 자동화 가이드](./docs/VIDEO_AUTOMATION.md)
- [설정 체크리스트](./docs/SETUP_CHECKLIST.md)
- [다시 해야 할 일](./docs/TODO.md)
- [영상 자동화 가이드](./docs/VIDEO_AUTOMATION.md)

## 🌐 Netlify 배포

### 1. GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Netlify 연결

1. [Netlify](https://www.netlify.com/) 접속
2. "New site from Git" 클릭
3. GitHub 저장소 선택
4. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Environment variables: `.env.local`의 모든 변수 추가

### 3. 환경 변수 설정

Netlify 대시보드에서 환경 변수 추가:

- `OPENAI_API_KEY`
- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `OPENAI_MODEL` (선택사항)

## 📝 사용 예시

### 1단계: 주제 풀 확장

```bash
# 각 카테고리별로 주제 생성
npm run generate-topics "경제·생활" 20
npm run generate-topics "IT·디지털" 20
npm run generate-topics "직장인" 15
npm run generate-topics "생활·기타" 15
```

### 2단계: 주간 계획 수립

Google Sheets의 `Weekly_Plan` 탭에 이번 주 계획 추가:

| 주차 | 업로드 예정일1 | 업로드 예정일2 | 주제1 | 주제2 | 트렌드 키워드 |
|------|---------------|---------------|-------|-------|--------------|
| 2025-W21 | 2025-01-22 | 2025-01-25 | ETF | 라우터 | 전기요금 |

### 3단계: 콘텐츠 자동 생성

```bash
npm run generate-weekly-content
```

이제 `Shorts_Content` 탭에 2개의 콘텐츠가 생성됩니다.

### 4단계: 대시보드에서 확인

웹 브라우저에서 대시보드 접속하여 생성된 콘텐츠 확인 및 관리

## 🤝 기여

이 프로젝트는 1인 콘텐츠 크리에이터를 위한 도구입니다. 개선 제안이나 버그 리포트는 이슈로 등록해주세요.

## 📄 라이선스

MIT
