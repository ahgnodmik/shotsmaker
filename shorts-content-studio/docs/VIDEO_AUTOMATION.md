# 🎬 영상 자동 생성 및 업로드 가이드

## 개요

이 시스템은 생성된 스크립트를 자동으로 영상으로 변환하고 YouTube에 업로드하는 기능을 제공합니다.

## 필요한 구성 요소

### 1. TTS (Text-to-Speech)
- **OpenAI TTS API** (권장) - 자연스러운 한국어 음성
- 또는 **Google Cloud Text-to-Speech** - 무료 티어 제공

### 2. 영상 편집
- **FFmpeg** - 오픈소스 영상 편집 도구
- 이미지/비디오 소스: Unsplash API, Pexels API

### 3. YouTube 업로드
- **YouTube Data API v3** - OAuth 2.0 인증 필요

## 설치 및 설정

### 1. FFmpeg 설치

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
- https://ffmpeg.org/download.html 에서 다운로드

### 2. 필요한 패키지 설치

이미 설치되어 있습니다 (`axios`는 `package.json`에 포함됨)
```bash
npm install  # 이미 설치됨
```

### 3. 환경 변수 추가

`.env.local`에 추가:

```env
# OpenAI TTS (선택사항, 이미 OPENAI_API_KEY가 있으면 사용 가능)
# 또는 Google Cloud TTS
GOOGLE_TTS_PROJECT_ID=your-project-id
GOOGLE_TTS_KEY_FILE=path/to/key.json

# YouTube API
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/callback
YOUTUBE_REFRESH_TOKEN=your-refresh-token

# 이미지 소스 API (선택사항)
UNSPLASH_ACCESS_KEY=your-unsplash-key
PEXELS_API_KEY=your-pexels-key
```

## 워크플로우

1. **스크립트 → 음성 변환** (TTS)
2. **이미지/비디오 소스 가져오기** (API)
3. **영상 편집** (FFmpeg)
   - 음성 + 이미지/비디오 클립
   - 자막 추가
   - 트랜지션 효과
4. **YouTube 업로드** (YouTube Data API)

## 사용 방법

### 영상 생성 및 업로드

```bash
# 특정 콘텐츠 ID의 영상 생성 및 업로드
npm run generate-video <content-id>

# 예: 콘텐츠 ID 1번의 영상 생성
npm run generate-video 1
```

### 자동 스케줄링

업로드 예정일이 된 콘텐츠를 자동으로 처리:

```bash
npm run auto-upload
```

## 제한사항

1. **YouTube API 할당량**: 일일 업로드 제한 (기본 6,000 units)
2. **영상 품질**: 완전 자동화된 영상은 수동 편집보다 품질이 낮을 수 있음
3. **저작권**: 사용하는 이미지/비디오의 라이선스 확인 필요

## 향후 개선 사항

- [ ] AI 아바타 영상 생성 (D-ID, Synthesia)
- [ ] 자동 썸네일 생성
- [ ] 다중 언어 지원
- [ ] 영상 스타일 템플릿 시스템

