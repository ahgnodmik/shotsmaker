# 📋 다시 해야 할 일

## ✅ 완료된 작업

1. ✅ 영상 자동 생성 시스템 기본 구조 완성
   - TTS (OpenAI) 통합
   - 이미지/비디오 소스 통합 (Unsplash/Pexels)
   - FFmpeg 영상 편집 기능
   - YouTube 업로드 기능
   - 기본 스크립트 작성

2. ✅ 문서 작성
   - `docs/VIDEO_AUTOMATION.md` - 영상 자동화 가이드
   - `docs/SETUP_CHECKLIST.md` - 설정 체크리스트
   - `README.md` 업데이트

3. ✅ 기본 설정
   - FFmpeg 설치 확인
   - Package.json 스크립트 추가
   - .gitignore 업데이트

## 🔧 추가 설정 필요 (사용자가 직접 해야 함)

### 1. 이미지/비디오 소스 API 키 설정 (선택사항)

**Unsplash 또는 Pexels 중 하나만 있으면 됩니다.**

#### Unsplash 설정
1. https://unsplash.com/developers 접속
2. "New Application" 클릭
3. Access Key 발급
4. `.env.local`에 추가:
   ```env
   UNSPLASH_ACCESS_KEY=your-unsplash-access-key
   ```

#### Pexels 설정
1. https://www.pexels.com/api/ 접속
2. API 키 발급
3. `.env.local`에 추가:
   ```env
   PEXELS_API_KEY=your-pexels-api-key
   ```

### 2. YouTube API 설정 (업로드하려면 필요)

1. **Google Cloud Console 설정**
   - Google Cloud Console 접속
   - YouTube Data API v3 활성화
   - OAuth 2.0 클라이언트 ID 생성
     - 애플리케이션 유형: 웹 애플리케이션
     - 승인된 리디렉션 URI: `http://localhost:3000/api/youtube/callback`

2. **환경 변수 추가**
   `.env.local`에 추가:
   ```env
   YOUTUBE_CLIENT_ID=your-youtube-client-id
   YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
   YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
   ```

3. **OAuth 인증**
   ```bash
   npm run dev
   # 브라우저에서 http://localhost:3000/api/youtube/auth 접속
   # Google 계정으로 인증 후 받은 refresh_token을 .env.local에 추가:
   YOUTUBE_REFRESH_TOKEN=your-refresh-token
   ```

## 🧪 테스트 순서

### 1단계: 영상 생성 테스트 (API 키만 있으면 가능)

```bash
# 1. 콘텐츠가 있는지 확인
npm run generate-weekly-content

# 2. 영상 생성 테스트 (YouTube 업로드 없이)
npm run generate-video 1

# 3. 생성된 영상 확인
ls -lh output/video-1.mp4
```

### 2단계: YouTube 업로드 테스트 (YouTube API 설정 필요)

```bash
# 영상 생성 + YouTube 업로드
npm run generate-video 1 --upload
```

## 🐛 알려진 이슈 및 개선 필요 사항

### 1. FFmpeg 자막 처리
- 현재 자막 파일 경로에 특수문자가 있으면 문제가 될 수 있음
- 개선: 자막 파일 경로를 절대 경로로 변환하거나 더 안전하게 처리

### 2. 영상 품질 개선
- 현재는 기본적인 영상만 생성
- 개선 아이디어:
  - 다중 이미지 슬라이드쇼
  - 트랜지션 효과
  - 더 나은 자막 스타일
  - 배경 음악 추가

### 3. 에러 처리 강화
- FFmpeg 명령어 실패 시 더 자세한 에러 메시지
- 임시 파일 정리 실패 시 경고 메시지

### 4. 자동화 스케줄링
- Cron 작업으로 자동 업로드
- 업로드 예정일이 되면 자동으로 영상 생성 및 업로드

### 5. 영상 최적화
- 파일 크기 최적화
- 썸네일 자동 생성
- 다중 해상도 지원

## 📝 추가 개발 아이디어

1. **AI 아바타 영상**
   - D-ID, Synthesia 같은 서비스 통합
   - 실제 사람처럼 말하는 아바타

2. **자동 썸네일 생성**
   - OpenAI DALL-E 또는 Midjourney API
   - 영상 내용 기반 썸네일

3. **다중 언어 지원**
   - 영어, 일본어 등 다른 언어 TTS
   - 자막 다국어 지원

4. **통계 및 분석**
   - 업로드된 영상 조회수/좋아요 수 추적
   - 가장 성공적인 주제 분석

5. **템플릿 시스템**
   - 다양한 영상 스타일 템플릿
   - 사용자가 선택 가능한 스타일

## 🚀 다음 단계

1. 이미지/비디오 API 키 설정 (Unsplash 또는 Pexels)
2. 영상 생성 테스트 실행
3. YouTube API 설정 (업로드하려면)
4. YouTube 업로드 테스트

자세한 설정 방법은 `docs/SETUP_CHECKLIST.md`를 참고하세요.

