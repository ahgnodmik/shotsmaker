import { google } from 'googleapis';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * YouTube Data API v3 클라이언트 생성
 */
export function createYouTubeClient() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback';
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error('YouTube API 인증 정보가 설정되지 않았습니다.');
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  return {
    auth: oauth2Client,
    youtube: google.youtube({ version: 'v3', auth: oauth2Client }),
  };
}

/**
 * YouTube에 영상 업로드
 */
export async function uploadVideoToYouTube(options: {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
  categoryId?: string;
  privacyStatus?: 'private' | 'unlisted' | 'public';
}): Promise<string> {
  const {
    videoPath,
    title,
    description,
    tags,
    categoryId = '22', // People & Blogs
    privacyStatus = 'private', // 기본값: 비공개 (검토 후 공개)
  } = options;

  const { youtube, auth } = createYouTubeClient();

  // Refresh token이 없으면 OAuth 인증 필요
  if (!process.env.YOUTUBE_REFRESH_TOKEN) {
    throw new Error(
      'YOUTUBE_REFRESH_TOKEN이 설정되지 않았습니다. OAuth 인증이 필요합니다.'
    );
  }

  console.log('📤 YouTube에 업로드 중...');

  try {
    const videoFile = await fs.readFile(videoPath);
    const fileSize = (await fs.stat(videoPath)).size;

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId,
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: videoFile,
      },
    });

    const videoId = response.data.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    console.log(`✅ 업로드 완료: ${videoUrl}`);
    return videoUrl;
  } catch (error: any) {
    console.error('YouTube 업로드 실패:', error.message);
    throw error;
  }
}

/**
 * OAuth 인증 URL 생성
 */
export function getAuthUrl(): string {
  const { auth } = createYouTubeClient();
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
  ];

  return auth.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

/**
 * OAuth 콜백에서 refresh token 가져오기
 */
export async function getRefreshToken(code: string): Promise<string> {
  const { auth } = createYouTubeClient();

  const { tokens } = await auth.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('Refresh token을 받지 못했습니다.');
  }

  return tokens.refresh_token;
}

