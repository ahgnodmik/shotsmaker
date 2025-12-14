import { NextResponse } from 'next/server';
import { getRefreshToken } from '@/lib/youtube';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: '인증 코드가 없습니다.' },
      { status: 400 }
    );
  }

  try {
    const refreshToken = await getRefreshToken(code);
    
    return NextResponse.json({
      success: true,
      refreshToken,
      message: '인증이 완료되었습니다. .env.local에 YOUTUBE_REFRESH_TOKEN을 추가하세요.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '인증 실패' },
      { status: 500 }
    );
  }
}

