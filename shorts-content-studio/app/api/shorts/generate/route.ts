import { NextResponse } from 'next/server';
import {
  createSheetsClient,
  readSheetData,
  updateSheetData,
  ShortsContent,
} from '@/lib/sheets';
import { generateShortsContent } from '@/lib/openai';

/**
 * 키워드로 기존 콘텐츠 재생성 (POST)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentId, keyword, trendKeyword } = body;

    if (!contentId && !keyword) {
      return NextResponse.json(
        { error: '콘텐츠 ID 또는 키워드가 필요합니다.' },
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

    let finalKeyword = keyword;
    let finalTrendKeyword = trendKeyword;
    let rowIndex = -1;

    if (contentId) {
      // 기존 콘텐츠 조회
      const contentData = await readSheetData(
        sheetsClient,
        sheetId,
        'Shorts_Content!A:M'
      );

      const rows = contentData.slice(1);
      rowIndex = rows.findIndex((row: any[]) => parseInt(row[0], 10) === contentId);

      if (rowIndex === -1) {
        return NextResponse.json(
          { error: `콘텐츠 ID ${contentId}를 찾을 수 없습니다.` },
          { status: 404 }
        );
      }

      const existingRow = rows[rowIndex];
      finalKeyword = keyword || existingRow[4]; // keyword
      finalTrendKeyword = trendKeyword !== undefined ? trendKeyword : existingRow[10]; // trendKeyword
    }

    if (!finalKeyword) {
      return NextResponse.json(
        { error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    // GPT로 콘텐츠 생성
    const generated = await generateShortsContent(
      finalKeyword,
      finalTrendKeyword || undefined
    );

    if (contentId && rowIndex !== -1) {
      // 기존 콘텐츠 업데이트
      const contentData = await readSheetData(
        sheetsClient,
        sheetId,
        'Shorts_Content!A:M'
      );

      const rows = contentData.slice(1);
      const existingRow = rows[rowIndex];

      const updatedRow = [
        contentId,
        existingRow[1], // week
        existingRow[2], // targetDate
        existingRow[3], // status
        finalKeyword,
        generated.title,
        generated.description,
        generated.hashtags.join(' '),
        generated.script,
        generated.hook,
        finalTrendKeyword || '',
        existingRow[11], // referenceLinks
        existingRow[12] || '', // memo
      ];

      await updateSheetData(
        sheetsClient,
        sheetId,
        `Shorts_Content!A${rowIndex + 2}:M${rowIndex + 2}`,
        [updatedRow]
      );

      const updatedContent: ShortsContent = {
        id: contentId,
        week: updatedRow[1],
        targetDate: updatedRow[2],
        status: updatedRow[3] as ShortsContent['status'],
        keyword: updatedRow[4],
        title: updatedRow[5],
        description: updatedRow[6],
        hashtags: updatedRow[7],
        script: updatedRow[8],
        hook: updatedRow[9],
        trendKeyword: updatedRow[10],
        referenceLinks: updatedRow[11],
        memo: updatedRow[12],
      };

      return NextResponse.json({
        success: true,
        message: '키워드로 콘텐츠가 재생성되었습니다.',
        content: updatedContent,
      });
    } else {
      // 새 콘텐츠 생성 (POST /api/shorts로 리다이렉트)
      return NextResponse.json({
        success: true,
        message: '새 콘텐츠를 생성하려면 POST /api/shorts를 사용하세요.',
        generated: {
          title: generated.title,
          description: generated.description,
          hashtags: generated.hashtags,
          script: generated.script,
          hook: generated.hook,
        },
      });
    }
  } catch (error: any) {
    console.error('오류 발생:', error);
    return NextResponse.json(
      { error: error.message || '콘텐츠 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

