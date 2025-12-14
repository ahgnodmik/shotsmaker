import { NextResponse } from 'next/server';
import { generateShortsContent } from '@/lib/openai';
import {
  createSheetsClient,
  readSheetData,
  appendSheetData,
} from '@/lib/sheets';
// import { getWeek } from 'date-fns'; // 클라이언트에서 주차 계산

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { week } = body;

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

    // 1. Weekly_Plan에서 이번 주 계획 가져오기
    const planData = await readSheetData(
      sheetsClient,
      sheetId,
      'Weekly_Plan!A:F'
    );

    const planRows = planData.slice(1);
    const planRow = planRows.find((row: any[]) => row[0] === week);

    if (!planRow) {
      return NextResponse.json(
        { error: `주차 "${week}"의 계획을 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    const topic1 = planRow[1];
    const topic2 = planRow[2];
    const trendKeyword = planRow[3];
    const uploadDate1 = planRow[4];
    const uploadDate2 = planRow[5];

    // 2. Shorts_Content에서 다음 ID 계산
    const contentData = await readSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M'
    );

    const contentRows = contentData.slice(1);
    const nextId = contentRows.length > 0
      ? Math.max(...contentRows.map((row: any[]) => parseInt(row[0] || '0', 10))) + 1
      : 1;

    // 3. 두 주제에 대해 콘텐츠 생성
    const contents = [];

    for (let i = 0; i < 2; i++) {
      const topic = i === 0 ? topic1 : topic2;
      const uploadDate = i === 0 ? uploadDate1 : uploadDate2;

      const generated = await generateShortsContent(
        topic,
        trendKeyword || undefined
      );
      
      const row = [
        nextId + i, // ID
        week, // 업로드 주차
        uploadDate || '', // 업로드 목표 날짜
        '작성중', // 상태
        topic, // 주제 키워드
        generated.title, // 최종 제목
        generated.description, // YouTube 설명란
        generated.hashtags.join(' '), // 해시태그
        generated.script, // 대본
        generated.hook, // 한 줄 훅
        trendKeyword || '', // 참고 트렌드 키워드
        '', // 참고 영상 링크
        '', // 메모
      ];

      contents.push(row);
    }

    // 4. Shorts_Content에 추가
    await appendSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M',
      contents
    );

    return NextResponse.json({
      success: true,
      message: `주차 "${week}"의 콘텐츠가 생성되었습니다.`,
      contentIds: [nextId, nextId + 1],
      contents: contents.map((row, i) => ({
        id: row[0],
        title: row[5],
        keyword: row[4],
      })),
    });
  } catch (error: any) {
    console.error('오류 발생:', error);
    return NextResponse.json(
      { error: error.message || '콘텐츠 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

