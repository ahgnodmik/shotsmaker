/**
 * 주제 풀 자동 생성 스크립트
 * 
 * 사용법:
 * npm run generate-topics <카테고리> <개수>
 * 예: npm run generate-topics "경제·생활" 15
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { generateTopics } from '../lib/openai';
import { createSheetsClient, appendSheetData } from '../lib/sheets';

const categories = [
  '경제·생활',
  'IT·디지털',
  '직장인',
  '생활·기타',
];

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
사용법: npm run generate-topics <카테고리> <개수>

카테고리 옵션:
${categories.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}

또는 직접 카테고리 이름 입력

예시:
  npm run generate-topics "경제·생활" 15
  npm run generate-topics "IT·디지털" 20
    `);
    process.exit(1);
  }

  const category = args[0];
  const count = parseInt(args[1], 10);

  if (isNaN(count) || count <= 0) {
    console.error('개수는 양수여야 합니다.');
    process.exit(1);
  }

  console.log(`\n📝 "${category}" 카테고리의 주제 ${count}개를 생성합니다...\n`);

  try {
    // 1. GPT로 주제 생성
    const topics = await generateTopics(category, count);
    console.log(`✅ ${topics.length}개의 주제가 생성되었습니다.\n`);

    // 2. Google Sheets에 추가 (선택사항)
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (sheetId && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      console.log('📊 Google Sheets에 추가 중...\n');
      
      const sheetsClient = await createSheetsClient({
        sheetId,
        serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: process.env.GOOGLE_PRIVATE_KEY,
      });

      const values = topics.map((topic) => [
        category,
        topic.keyword,
        topic.description,
        'unused', // 사용 여부
      ]);

      await appendSheetData(sheetsClient, sheetId, 'Topics_Pool!A:D', values);
      console.log('✅ Google Sheets에 추가 완료!\n');
    } else {
      console.log('⚠️  Google Sheets 설정이 없어 시트에 추가하지 않습니다.\n');
      console.log('생성된 주제 목록:\n');
      topics.forEach((topic, index) => {
        console.log(`${index + 1}. ${topic.keyword}`);
        console.log(`   ${topic.description}\n`);
      });
    }

    console.log('✨ 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();

