import { NextResponse } from 'next/server';
import {
  createSheetsClient,
  readSheetData,
  updateSheetData,
  ShortsContent,
} from '@/lib/sheets';
import { verifyContentAccuracy } from '@/lib/openai';
// import { textToSpeech } from '@/lib/video'; // Netlify에서는 FFmpeg 사용 불가

/**
 * 비디오 생성 API
 * 
 * Netlify Functions에서는 FFmpeg를 직접 사용할 수 없으므로,
 * 비디오 생성은 클라이언트 사이드에서 처리하거나
 * 외부 서비스(Cloudinary, Mux 등)를 사용해야 합니다.
 * 
 * 이 API는 TTS만 생성하고, 비디오 생성은 클라이언트에서 처리합니다.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentId, skipVerification = false } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: '콘텐츠 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Google Sheets 설정이 필요합니다.' },
        { status: 500 }
      );
    }

    const sheetsClient = await createSheetsClient({
      sheetId,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
    });

    // 1. 콘텐츠 정보 가져오기
    const contentData = await readSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M'
    );

    const rows = contentData.slice(1);
    const contentRow = rows.find((row: any[]) => parseInt(row[0], 10) === contentId);

    if (!contentRow) {
      return NextResponse.json(
        { error: `콘텐츠 ID ${contentId}를 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    const content: ShortsContent = {
      id: parseInt(contentRow[0], 10),
      week: contentRow[1],
      targetDate: contentRow[2],
      status: contentRow[3] as ShortsContent['status'],
      keyword: contentRow[4],
      title: contentRow[5],
      description: contentRow[6],
      hashtags: contentRow[7],
      script: contentRow[8],
      hook: contentRow[9],
      trendKeyword: contentRow[10],
      referenceLinks: contentRow[11],
      memo: contentRow[12],
    };

    // 2. 콘텐츠 정확성 검증 (선택적)
    let verification = null;
    if (!skipVerification) {
      verification = await verifyContentAccuracy(
        content.keyword,
        content.script,
        content.title
      );

      if (!verification.isValid && verification.issues.length > 0) {
        return NextResponse.json({
          error: '콘텐츠에 거짓 정보가 포함되어 있습니다.',
          verification,
          suggestion: '스크립트를 개선하거나 재생성하세요.',
        }, { status: 400 });
      }
    }

    // 3. TTS 생성 (서버에서 처리 가능)
    // 실제로는 클라이언트에서 처리하거나, 외부 서비스 사용
    // 여기서는 메타데이터만 반환

    return NextResponse.json({
      success: true,
      message: '비디오 생성을 위한 데이터가 준비되었습니다.',
      content: {
        id: content.id,
        title: content.title,
        script: content.script,
        keyword: content.keyword,
        hashtags: content.hashtags,
      },
      verification,
      note: 'Netlify Functions에서는 FFmpeg를 사용할 수 없습니다. 비디오 생성은 클라이언트 사이드에서 처리하거나 외부 서비스를 사용하세요.',
    });
  } catch (error: any) {
    console.error('오류 발생:', error);
    return NextResponse.json(
      { error: error.message || '비디오 생성 준비에 실패했습니다.' },
      { status: 500 }
    );
  }
}

