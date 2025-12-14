# ✅ 설정 체크리스트

영상 자동 생성 및 업로드 시스템을 사용하기 위한 설정 체크리스트입니다.

## 1단계: 기본 설정 (필수)

### ✅ 프로젝트 설치
- [x] `npm install` 완료
- [x] `.env.local` 파일 생성 완료

### ✅ Google Sheets API 설정
- [x] Google Cloud Console 프로젝트 생성
- [x] Google Sheets API 활성화
- [x] Service Account 생성
- [x] Service Account 키 다운로드
- [x] `.env.local`에 인증 정보 추가
- [x] Google Sheets에 Service Account 이메일 공유
- [x] `npm run check-google-auth` 실행 확인

### ✅ OpenAI API 설정
- [x] OpenAI API 키 발급
- [x] `.env.local`에 `OPENAI_API_KEY` 추가
- [x] 주제 생성 테스트: `npm run generate-topics "경제·생활" 5`

### ✅ 시트 구조 설정
- [x] `npm run setup-sheets` 실행 완료

## 2단계: 영상 생성 설정 (영상 생성하려면 필요)

### ✅ FFmpeg 설치
- [x] FFmpeg 설치 확인: `ffmpeg -version`
- [ ] macOS: `brew install ffmpeg`
- [ ] Linux: `sudo apt-get install ffmpeg`
- [ ] Windows: https://ffmpeg.org/download.html

### ✅ 이미지/비디오 소스 API 설정 (선택사항)
**Unsplash 또는 Pexels 중 하나만 있어도 됩니다.**

#### Unsplash 설정
- [ ] https://unsplash.com/developers 접속
- [ ] 애플리케이션 생성
- [ ] Access Key 발급
- [ ] `.env.local`에 `UNSPLASH_ACCESS_KEY` 추가

#### Pexels 설정
- [ ] https://www.pexels.com/api/ 접속
- [ ] API 키 발급
- [ ] `.env.local`에 `PEXELS_API_KEY` 추가

### ✅ 영상 생성 테스트
- [ ] 콘텐츠 생성: `npm run generate-weekly-content`
- [ ] 영상 생성 테스트: `npm run generate-video 1`
- [ ] 생성된 영상 확인: `output/video-1.mp4`

## 3단계: YouTube 업로드 설정 (업로드하려면 필요)

### ✅ YouTube Data API v3 설정
- [ ] Google Cloud Console에서 YouTube Data API v3 활성화
- [ ] OAuth 2.0 클라이언트 ID 생성
  - 애플리케이션 유형: 웹 애플리케이션
  - 승인된 리디렉션 URI: `http://localhost:3000/api/youtube/callback`
- [ ] 클라이언트 ID와 Secret을 `.env.local`에 추가:
  ```env
  YOUTUBE_CLIENT_ID=your-client-id
  YOUTUBE_CLIENT_SECRET=your-client-secret
  YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
  ```

### ✅ YouTube OAuth 인증
- [ ] `npm run dev` 실행
- [ ] 브라우저에서 `http://localhost:3000/api/youtube/auth` 접속
- [ ] Google 계정으로 인증
- [ ] 리디렉션 후 받은 `refresh_token`을 `.env.local`에 추가:
  ```env
  YOUTUBE_REFRESH_TOKEN=your-refresh-token
  ```

### ✅ YouTube 업로드 테스트
- [ ] 영상 생성 및 업로드: `npm run generate-video 1 --upload`
- [ ] YouTube에서 업로드된 영상 확인

## 완료 체크

모든 체크리스트를 완료했으면 다음 명령어로 전체 워크플로우를 테스트하세요:

```bash
# 1. 주제 생성
npm run generate-topics "경제·생활" 10

# 2. 주간 콘텐츠 생성
npm run generate-weekly-content

# 3. 영상 생성
npm run generate-video 1

# 4. 영상 생성 + YouTube 업로드 (옵션)
npm run generate-video 1 --upload
```

## 문제 해결

### FFmpeg 오류
- FFmpeg가 설치되어 있는지 확인: `which ffmpeg`
- 경로 문제: `.env`에 `FFMPEG_PATH` 설정

### YouTube 업로드 오류
- Refresh token이 만료되었을 수 있음 → 다시 인증 필요
- 할당량 초과: YouTube API 일일 할당량 확인

### 영상 생성 실패
- 이미지/비디오 API 키 확인
- FFmpeg 설치 확인
- 디스크 공간 확인 (임시 파일 생성)

## 다음 단계

- [ ] 자동 스케줄링 설정 (Cron)
- [ ] 영상 품질 개선
- [ ] 썸네일 자동 생성
- [ ] 통계 및 분석

