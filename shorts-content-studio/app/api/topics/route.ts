import { NextResponse } from 'next/server';
import {
  createSheetsClient,
  readSheetData,
  Topic,
} from '@/lib/sheets';

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
      'Topics_Pool!A:D'
    );

    // 헤더 제거
    const rows = data.slice(1);

    // 데이터 파싱
    const topics: Topic[] = rows.map((row) => ({
      category: row[0] || '',
      keyword: row[1] || '',
      description: row[2] || '',
      status: (row[3] || 'unused') as Topic['status'],
    }));

    return NextResponse.json(topics);
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

