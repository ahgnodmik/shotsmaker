import { NextResponse } from 'next/server';
import {
  createSheetsClient,
  readSheetData,
  updateSheetData,
  ShortsContent,
} from '@/lib/sheets';

/**
 * 콘텐츠 조회 (GET)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentId = parseInt(id, 10);

    if (isNaN(contentId)) {
      return NextResponse.json(
        { error: '유효하지 않은 콘텐츠 ID입니다.' },
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

    return NextResponse.json(content);
  } catch (error: any) {
    console.error('오류 발생:', error);
    return NextResponse.json(
      { error: error.message || '콘텐츠를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 콘텐츠 업데이트 (PUT)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentId = parseInt(id, 10);

    if (isNaN(contentId)) {
      return NextResponse.json(
        { error: '유효하지 않은 콘텐츠 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      week,
      targetDate,
      status,
      keyword,
      title,
      description,
      hashtags,
      script,
      hook,
      trendKeyword,
      referenceLinks,
      memo,
    } = body;

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

    // 기존 콘텐츠 조회
    const contentData = await readSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M'
    );

    const rows = contentData.slice(1);
    const rowIndex = rows.findIndex((row: any[]) => parseInt(row[0], 10) === contentId);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: `콘텐츠 ID ${contentId}를 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    // 기존 데이터 가져오기
    const existingRow = rows[rowIndex];
    
    // 업데이트할 데이터 구성 (전달된 값만 업데이트)
    const updatedRow = [
      contentId, // ID는 변경하지 않음
      week !== undefined ? week : existingRow[1],
      targetDate !== undefined ? targetDate : existingRow[2],
      status !== undefined ? status : existingRow[3],
      keyword !== undefined ? keyword : existingRow[4],
      title !== undefined ? title : existingRow[5],
      description !== undefined ? description : existingRow[6],
      hashtags !== undefined ? hashtags : existingRow[7],
      script !== undefined ? script : existingRow[8],
      hook !== undefined ? hook : existingRow[9],
      trendKeyword !== undefined ? trendKeyword : existingRow[10],
      referenceLinks !== undefined ? referenceLinks : existingRow[11],
      memo !== undefined ? memo : existingRow[12],
    ];

    // 시트 업데이트 (헤더 포함이므로 +2)
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
      message: '콘텐츠가 업데이트되었습니다.',
      content: updatedContent,
    });
  } catch (error: any) {
    console.error('오류 발생:', error);
    return NextResponse.json(
      { error: error.message || '콘텐츠 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 콘텐츠 삭제 (DELETE)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentId = parseInt(id, 10);

    if (isNaN(contentId)) {
      return NextResponse.json(
        { error: '유효하지 않은 콘텐츠 ID입니다.' },
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

    // 기존 콘텐츠 조회
    const contentData = await readSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M'
    );

    const rows = contentData.slice(1);
    const rowIndex = rows.findIndex((row: any[]) => parseInt(row[0], 10) === contentId);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: `콘텐츠 ID ${contentId}를 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    // 시트 ID 찾기
    const spreadsheet = await sheetsClient.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    const shortsContentSheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === 'Shorts_Content'
    );
    
    if (!shortsContentSheet?.properties?.sheetId) {
      return NextResponse.json(
        { error: 'Shorts_Content 시트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 행 삭제 (헤더 포함이므로 +2)
    const deleteRowIndex = rowIndex + 2;

    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: shortsContentSheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: deleteRowIndex - 1,
                endIndex: deleteRowIndex,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: '콘텐츠가 삭제되었습니다.',
      deletedId: contentId,
    });
  } catch (error: any) {
    console.error('오류 발생:', error);
    return NextResponse.json(
      { error: error.message || '콘텐츠 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

