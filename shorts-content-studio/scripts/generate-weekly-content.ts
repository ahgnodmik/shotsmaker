/**
 * 주간 콘텐츠 자동 생성 스크립트
 * 
 * Weekly_Plan에서 이번 주 2개 주제를 읽어와서
 * Shorts_Content에 제목/설명/스크립트 생성 후 추가
 * 
 * 사용법:
 * npm run generate-weekly-content <주차>
 * 예: npm run generate-weekly-content "2025-W21"
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { generateShortsContent } from '../lib/openai';
import {
  createSheetsClient,
  readSheetData,
  appendSheetData,
} from '../lib/sheets';
import { getWeek } from 'date-fns';

async function main() {
  const args = process.argv.slice(2);
  let week: string;

  if (args.length > 0) {
    week = args[0];
  } else {
    // 현재 주차 자동 계산
    const now = new Date();
    const year = now.getFullYear();
    const weekNum = getWeek(now, { weekStartsOn: 1 });
    week = `${year}-W${weekNum.toString().padStart(2, '0')}`;
  }

  console.log(`\n📝 주차 "${week}"의 콘텐츠를 생성합니다...\n`);

  const sheetId = process.env.GOOGLE_SHEET_ID;
  
  if (!sheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.error('❌ Google Sheets 설정이 필요합니다.');
    console.error('환경 변수: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY');
    process.exit(1);
  }

  try {
    const sheetsClient = await createSheetsClient({
      sheetId,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
    });

    // 1. Weekly_Plan에서 이번 주 정보 읽기
    console.log('📊 Weekly_Plan에서 주간 계획 읽는 중...');
    const planData = await readSheetData(
      sheetsClient,
      sheetId,
      'Weekly_Plan!A:F'
    );

    // 헤더 제거
    const plans = planData.slice(1);
    const thisWeekPlan = plans.find((row) => row[0] === week);

    if (!thisWeekPlan) {
      console.error(`❌ 주차 "${week}"에 대한 계획을 찾을 수 없습니다.`);
      console.log('\nWeekly_Plan에 먼저 계획을 추가해주세요.');
      process.exit(1);
    }

    const [_, uploadDate1, uploadDate2, topic1, topic2, trendKeyword] = thisWeekPlan;
    console.log(`✅ 계획 확인: ${topic1}, ${topic2}\n`);

    // 2. Shorts_Content에서 다음 ID 확인
    const contentData = await readSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M'
    );
    const nextId = contentData.length; // 헤더 포함이므로 자동으로 다음 ID

    // 3. 두 주제에 대해 콘텐츠 생성
    const contents = [];

    for (let i = 0; i < 2; i++) {
      const topic = i === 0 ? topic1 : topic2;
      const uploadDate = i === 0 ? uploadDate1 : uploadDate2;

      console.log(`\n🎬 "${topic}" 주제 콘텐츠 생성 중...`);
      
      const generated = await generateShortsContent(topic, trendKeyword || undefined);
      
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
      
      console.log(`✅ "${generated.title}" 생성 완료!`);
      console.log(`   훅: ${generated.hook}\n`);
    }

    // 4. Shorts_Content에 추가
    console.log('📊 Google Sheets에 추가 중...');
    await appendSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M',
      contents
    );

    console.log('\n✨ 완료!');
    console.log(`\n생성된 콘텐츠 ID: ${nextId} ~ ${nextId + 1}`);
    console.log(`관리 대시보드에서 확인하세요: http://localhost:3000/shorts`);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();

