/**
 * Google Sheets API 인증 상태 확인 스크립트
 * 
 * 사용법:
 * npm run check-google-auth
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createSheetsClient, readSheetData } from '../lib/sheets';

async function checkAuth() {
  console.log('\n🔍 Google Sheets API 인증 상태 확인 중...\n');

  // 1. 환경 변수 확인
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  console.log('1️⃣ 환경 변수 확인:');
  console.log(`   GOOGLE_SHEET_ID: ${sheetId ? '✅ 설정됨' : '❌ 없음'}`);
  console.log(`   GOOGLE_SERVICE_ACCOUNT_EMAIL: ${serviceAccountEmail ? '✅ 설정됨' : '❌ 없음'}`);
  console.log(`   GOOGLE_PRIVATE_KEY: ${privateKey ? '✅ 설정됨' : '❌ 없음'}\n`);

  if (!sheetId || !serviceAccountEmail || !privateKey) {
    console.log('❌ 환경 변수가 완전히 설정되지 않았습니다.\n');
    console.log('다음 단계를 따라주세요:\n');
    console.log('📋 Google Sheets API 설정 가이드: docs/GOOGLE_SHEETS_SETUP.md\n');
    return;
  }

  // 2. API 연결 테스트
  console.log('2️⃣ Google Sheets API 연결 테스트 중...\n');

  try {
    const sheetsClient = await createSheetsClient({
      sheetId,
      serviceAccountEmail,
      privateKey,
    });

    // 시트 메타데이터 읽기 (권한 확인)
    const response = await sheetsClient.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    console.log('✅ API 연결 성공!');
    console.log(`   시트 제목: ${response.data.properties?.title || 'Unknown'}\n`);

    // 3. 첫 번째 시트 읽기 테스트
    console.log('3️⃣ 시트 읽기 테스트 중...\n');

    try {
      // Topics_Pool 시트 시도
      const data = await readSheetData(
        sheetsClient,
        sheetId,
        'Topics_Pool!A1:D1'
      );
      console.log('✅ 시트 읽기 성공!\n');
      console.log('시트 구조가 올바르게 설정되어 있습니다. 🎉\n');
    } catch (error: any) {
      if (error.message?.includes('Unable to parse range')) {
        console.log('⚠️  시트 탭이 없습니다.');
        console.log('   시트 구조를 설정하려면: npm run setup-sheets\n');
      } else {
        console.log('❌ 시트 읽기 실패:', error.message);
        console.log('   권한을 확인해주세요.\n');
      }
    }
  } catch (error: any) {
    console.log('❌ API 연결 실패!\n');
    
    if (error.message?.includes('invalid_grant') || error.message?.includes('unauthorized')) {
      console.log('💡 해결 방법:');
      console.log('   1. Service Account 이메일이 Google Sheets에 공유되었는지 확인');
      console.log('   2. 공유 권한이 "편집자"인지 확인');
      console.log('   3. Private Key가 올바르게 설정되었는지 확인 (\\n 포함)\n');
    } else if (error.message?.includes('API key not valid')) {
      console.log('💡 해결 방법:');
      console.log('   1. Google Cloud Console에서 API 키를 확인');
      console.log('   2. Google Sheets API가 활성화되었는지 확인\n');
    } else {
      console.log('에러 메시지:', error.message);
      console.log('   docs/GOOGLE_SHEETS_SETUP.md를 참고하여 설정을 확인해주세요.\n');
    }
  }

  console.log('📚 자세한 설정 가이드: docs/GOOGLE_SHEETS_SETUP.md\n');
}

checkAuth().catch(console.error);

