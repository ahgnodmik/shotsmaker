import { NextResponse } from 'next/server';
import {
  createSheetsClient,
  readSheetData,
  updateSheetData,
  ShortsContent,
} from '@/lib/sheets';
import {
  verifyContentAccuracy,
  improveContentScript,
  generateShortsContent,
} from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentId, action, preview = false } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: '콘텐츠 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!['verify', 'improve', 'regenerate'].includes(action)) {
      return NextResponse.json(
        { error: 'action은 verify, improve, 또는 regenerate여야 합니다.' },
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

    // 1. Shorts_Content에서 콘텐츠 정보 가져오기
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

    // 2. 콘텐츠 정확성 검증
    const verification = await verifyContentAccuracy(
      content.keyword,
      content.script,
      content.title
    );

    if (action === 'verify') {
      return NextResponse.json({
        success: true,
        verification,
        content: {
          id: content.id,
          title: content.title,
          keyword: content.keyword,
        },
      });
    }

    // 3. 개선 또는 재생성
    if (action === 'improve') {
      if (verification.isValid && verification.issues.length === 0) {
        return NextResponse.json({
          success: true,
          message: '스크립트가 이미 정확합니다. 개선이 필요하지 않습니다.',
          verification,
        });
      }

      const improvement = await improveContentScript(
        content.keyword,
        content.script,
        content.title,
        verification
      );

      if (preview) {
        return NextResponse.json({
          success: true,
          preview: true,
          improvement,
          verification,
        });
      }

      // Google Sheets 업데이트
      const rowIndex = rows.findIndex((row: any[]) => parseInt(row[0], 10) === contentId) + 2;
      const updatedRow = [...contentRow];
      
      updatedRow[8] = improvement.improvedScript;
      if (improvement.improvedTitle) {
        updatedRow[5] = improvement.improvedTitle;
      }
      if (improvement.improvedDescription) {
        updatedRow[6] = improvement.improvedDescription;
      }
      const firstSentence = improvement.improvedScript.split(/[.!?]/)[0].trim();
      if (firstSentence) {
        updatedRow[9] = firstSentence;
      }
      const improvementMemo = `[${new Date().toLocaleString('ko-KR')}] ChatGPT로 자동 개선됨. 변경사항: ${improvement.changes.length}개`;
      updatedRow[12] = content.memo 
        ? `${content.memo}\n${improvementMemo}`
        : improvementMemo;

      await updateSheetData(
        sheetsClient,
        sheetId,
        `Shorts_Content!A${rowIndex}:M${rowIndex}`,
        [updatedRow]
      );

      return NextResponse.json({
        success: true,
        message: '콘텐츠가 개선되어 업데이트되었습니다.',
        improvement,
        verification,
      });
    }

    // 4. 재생성
    if (action === 'regenerate') {
      const regenerated = await generateShortsContent(
        content.keyword,
        content.trendKeyword || undefined
      );

      const regeneratedVerification = await verifyContentAccuracy(
        content.keyword,
        regenerated.script,
        regenerated.title
      );

      if (preview) {
        return NextResponse.json({
          success: true,
          preview: true,
          regenerated,
          verification: regeneratedVerification,
        });
      }

      // Google Sheets 업데이트
      const rowIndex = rows.findIndex((row: any[]) => parseInt(row[0], 10) === contentId) + 2;
      const updatedRow = [...contentRow];
      
      updatedRow[5] = regenerated.title;
      updatedRow[6] = regenerated.description;
      updatedRow[7] = regenerated.hashtags.join(' ');
      updatedRow[8] = regenerated.script;
      updatedRow[9] = regenerated.hook;
      const regenerateMemo = `[${new Date().toLocaleString('ko-KR')}] ChatGPT로 완전히 새로운 스크립트 재생성됨. 검증: ${regeneratedVerification.isValid ? '통과' : '실패'}`;
      updatedRow[12] = content.memo 
        ? `${content.memo}\n${regenerateMemo}`
        : regenerateMemo;

      await updateSheetData(
        sheetsClient,
        sheetId,
        `Shorts_Content!A${rowIndex}:M${rowIndex}`,
        [updatedRow]
      );

      return NextResponse.json({
        success: true,
        message: '콘텐츠가 재생성되어 업데이트되었습니다.',
        regenerated,
        verification: regeneratedVerification,
      });
    }

    return NextResponse.json(
      { error: '알 수 없는 action입니다.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('오류 발생:', error);
    return NextResponse.json(
      { error: error.message || '콘텐츠 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}



