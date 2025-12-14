import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/youtube';

export async function GET() {
  try {
    const authUrl = getAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '인증 URL 생성 실패' },
      { status: 500 }
    );
  }
}

