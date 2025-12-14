/**
 * Google Sheets 초기 구조 설정 스크립트
 * 
 * 시트 탭과 헤더를 자동으로 생성합니다.
 * 
 * 사용법:
 * npm run setup-sheets
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createSheetsClient, appendSheetData } from '../lib/sheets';

const SHEETS_CONFIG = {
  Topics_Pool: {
    range: 'Topics_Pool!A1:D1',
    headers: ['카테고리', '주제 키워드', '한 줄 설명', '사용 여부'],
  },
  Weekly_Trend: {
    range: 'Weekly_Trend!A1:E1',
    headers: ['날짜', '키워드', '소스', '관련도', '메모'],
  },
  Weekly_Plan: {
    range: 'Weekly_Plan!A1:F1',
    headers: ['주차', '업로드 예정일1', '업로드 예정일2', '주제1', '주제2', '트렌드 키워드'],
  },
  Shorts_Content: {
    range: 'Shorts_Content!A1:M1',
    headers: [
      'ID',
      '업로드 주차',
      '업로드 목표 날짜',
      '상태',
      '주제 키워드',
      '최종 제목',
      'YouTube 설명란',
      '해시태그',
      '대본(스크립트)',
      '한 줄 훅',
      '참고 트렌드 키워드',
      '참고 영상 링크',
      '메모',
    ],
  },
  References: {
    range: 'References!A1:F1',
    headers: ['레퍼런스 ID', '타입', '링크(URL)', '관련 주제 키워드', '메모', '사용 여부'],
  },
};

async function setupSheets() {
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    console.error('❌ GOOGLE_SHEET_ID 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  // Service Account가 없으면 수동 설정 안내
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.log(`
📋 Google Sheets 구조 설정 가이드

현재 시트 ID: ${sheetId}

수동 설정 방법:
1. Google Sheets를 열어주세요: https://docs.google.com/spreadsheets/d/${sheetId}/edit
2. 아래 탭들을 생성하거나 이름을 변경해주세요:
   ${Object.keys(SHEETS_CONFIG).map((name) => `   - ${name}`).join('\n')}
3. 각 탭에 다음 헤더를 첫 번째 행에 추가해주세요:

${Object.entries(SHEETS_CONFIG)
  .map(
    ([name, config]) =>
      `[${name}]\n${config.headers.map((h, i) => `   ${String.fromCharCode(65 + i)}: ${h}`).join('\n')}`
  )
  .join('\n\n')}

자동 설정을 원하시면 Google Service Account를 설정해주세요.
자세한 방법은 docs/GOOGLE_SHEETS_SETUP.md를 참고하세요.
    `);
    return;
  }

  console.log('\n📊 Google Sheets 구조를 설정합니다...\n');

  try {
    const sheetsClient = await createSheetsClient({
      sheetId,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
    });

    // 먼저 기존 시트 목록 확인
    const spreadsheet = await sheetsClient.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
    
    // 없는 시트 탭 생성
    const sheetsToCreate = Object.keys(SHEETS_CONFIG).filter(
      name => !existingSheets.includes(name)
    );
    
    if (sheetsToCreate.length > 0) {
      console.log(`📋 ${sheetsToCreate.length}개의 시트 탭 생성 중...\n`);
      
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: sheetsToCreate.map(sheetName => ({
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          })),
        },
      });
      
      console.log(`✅ 시트 탭 생성 완료: ${sheetsToCreate.join(', ')}\n`);
    }

    // 각 시트 탭에 헤더 추가
    for (const [sheetName, config] of Object.entries(SHEETS_CONFIG)) {
      console.log(`📝 ${sheetName} 탭 설정 중...`);
      
      try {
        // 먼저 시트가 비어있는지 확인 (A1 셀 확인)
        const existingData = await sheetsClient.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `${sheetName}!A1`,
        });
        
        // 헤더가 없으면 추가
        if (!existingData.data.values || existingData.data.values.length === 0) {
          await sheetsClient.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [config.headers],
            },
          });
        console.log(`✅ ${sheetName} 헤더 추가 완료`);
        } else {
          console.log(`ℹ️  ${sheetName} 헤더가 이미 존재합니다.`);
        }
      } catch (error: any) {
        console.error(`❌ ${sheetName} 설정 실패:`, error.message);
      }
    }

    console.log('\n✨ 완료!');
    console.log(`\n시트 확인: https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

setupSheets();

