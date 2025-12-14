import { NextResponse } from 'next/server';
import {
  createSheetsClient,
  readSheetData,
  appendSheetData,
  ShortsContent,
} from '@/lib/sheets';
import { generateShortsContent } from '@/lib/openai';
import { getWeek } from 'date-fns';

/**
 * 콘텐츠 목록 조회 (GET)
 */
export async function GET() {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      return NextResponse.json(
        { error: 'Google Sheets가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // Service Account가 없으면 에러
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Google Sheets API 인증이 필요합니다.' },
        { status: 500 }
      );
    }

    const sheetsClient = await createSheetsClient({
      sheetId,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
    });

    const data = await readSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M'
    );

    // 헤더 제거
    const rows = data.slice(1);

    // 데이터 파싱
    const contents: ShortsContent[] = rows.map((row) => ({
      id: parseInt(row[0] || '0', 10),
      week: row[1] || '',
      targetDate: row[2] || '',
      status: (row[3] || '작성중') as ShortsContent['status'],
      keyword: row[4] || '',
      title: row[5] || '',
      description: row[6] || '',
      hashtags: row[7] || '',
      script: row[8] || '',
      hook: row[9] || '',
      trendKeyword: row[10] || '',
      referenceLinks: row[11] || '',
      memo: row[12] || '',
    }));

    return NextResponse.json(contents);
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 새 콘텐츠 생성 (POST)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      keyword,
      week,
      targetDate,
      trendKeyword,
      generateContent = false, // 키워드로 자동 생성할지 여부
    } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: '키워드가 필요합니다.' },
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

    // 다음 ID 계산
    const contentData = await readSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M'
    );

    const contentRows = contentData.slice(1);
    const nextId = contentRows.length > 0
      ? Math.max(...contentRows.map((row: any[]) => parseInt(row[0] || '0', 10))) + 1
      : 1;

    // 주차 자동 계산 (없으면)
    let finalWeek = week;
    if (!finalWeek) {
      const now = new Date();
      const year = now.getFullYear();
      const weekNum = getWeek(now, { weekStartsOn: 1 });
      finalWeek = `${year}-W${weekNum.toString().padStart(2, '0')}`;
    }

    // 콘텐츠 생성
    let title = '';
    let description = '';
    let hashtags = '';
    let script = '';
    let hook = '';

    if (generateContent) {
      // GPT로 콘텐츠 생성
      const generated = await generateShortsContent(
        keyword,
        trendKeyword || undefined
      );
      title = generated.title;
      description = generated.description;
      hashtags = generated.hashtags.join(' ');
      script = generated.script;
      hook = generated.hook;
    }

    // 새 행 추가
    const newRow = [
      nextId,
      finalWeek,
      targetDate || '',
      '작성중',
      keyword,
      title,
      description,
      hashtags,
      script,
      hook,
      trendKeyword || '',
      '',
      '', // memo
    ];

    await appendSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M',
      [newRow]
    );

    const newContent: ShortsContent = {
      id: nextId,
      week: finalWeek,
      targetDate: targetDate || '',
      status: '작성중',
      keyword,
      title,
      description,
      hashtags,
      script,
      hook,
      trendKeyword: trendKeyword || '',
      referenceLinks: '',
      memo: '',
    };

    return NextResponse.json({
      success: true,
      message: generateContent
        ? '키워드로 콘텐츠가 생성되었습니다.'
        : '새 콘텐츠가 생성되었습니다.',
      content: newContent,
    });
  } catch (error: any) {
    console.error('오류 발생:', error);
    return NextResponse.json(
      { error: error.message || '콘텐츠 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
