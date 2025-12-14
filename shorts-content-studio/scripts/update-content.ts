/**
 * Google Sheets 콘텐츠 재검토 및 업데이트 스크립트
 * 
 * 사용법:
 * npm run update-content <content-id> [옵션]
 * 
 * 옵션:
 *   --verify-only      검증만 수행하고 업데이트하지 않음
 *   --auto-improve     검증 결과를 바탕으로 자동으로 스크립트 개선
 *   --preview          변경 사항을 미리보기만 하고 실제 업데이트하지 않음
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import {
  createSheetsClient,
  readSheetData,
  updateSheetData,
  ShortsContent,
} from '../lib/sheets';
import {
  verifyContentAccuracy,
  improveContentScript,
  generateShortsContent,
} from '../lib/openai';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
사용법: npm run update-content <content-id> [옵션]

옵션:
  --verify-only      검증만 수행하고 업데이트하지 않음
  --auto-improve     검증 결과를 바탕으로 자동으로 스크립트 개선
  --regenerate       거짓 정보가 많을 때 완전히 새로운 스크립트 재생성
  --preview          변경 사항을 미리보기만 하고 실제 업데이트하지 않음

예시:
  npm run update-content 1                    # 검증만 수행
  npm run update-content 1 --verify-only      # 검증만 수행 (명시적)
  npm run update-content 1 --auto-improve     # 검증 후 자동 개선
  npm run update-content 1 --auto-improve --preview  # 미리보기
  npm run update-content 1 --regenerate      # 완전히 새로운 스크립트 재생성
  npm run update-content 1 --regenerate --preview  # 재생성 미리보기
    `);
    process.exit(1);
  }

  const contentId = parseInt(args[0], 10);

  if (isNaN(contentId)) {
    console.error('❌ 콘텐츠 ID는 숫자여야 합니다.');
    process.exit(1);
  }

  const verifyOnly = args.includes('--verify-only');
  const autoImprove = args.includes('--auto-improve');
  const regenerate = args.includes('--regenerate');
  const preview = args.includes('--preview');

  console.log(`\n📝 콘텐츠 ID ${contentId} 재검토 중...\n`);

  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.error('❌ Google Sheets 설정이 필요합니다.');
    process.exit(1);
  }

  try {
    const sheetsClient = await createSheetsClient({
      sheetId,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
    });

    // 1. Shorts_Content에서 콘텐츠 정보 가져오기
    console.log('📊 콘텐츠 정보 가져오는 중...');
    const contentData = await readSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M'
    );

    const rows = contentData.slice(1); // 헤더 제거
    const contentRow = rows.find((row: any[]) => parseInt(row[0], 10) === contentId);

    if (!contentRow) {
      console.error(`❌ 콘텐츠 ID ${contentId}를 찾을 수 없습니다.`);
      process.exit(1);
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

    console.log(`✅ 콘텐츠 확인: "${content.title}"\n`);

    // 2. 콘텐츠 정확성 검증
    console.log('🔍 콘텐츠 정확성 검증 중...');
    const verification = await verifyContentAccuracy(
      content.keyword,
      content.script,
      content.title
    );

    console.log(`\n📋 검증 결과:`);
    console.log(`   상태: ${verification.isValid ? '✅ 통과' : '❌ 실패'}`);
    console.log(`   신뢰도: ${verification.confidence}`);

    if (verification.issues.length > 0) {
      console.log(`\n⚠️  발견된 문제점:`);
      verification.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    if (verification.warnings.length > 0) {
      console.log(`\n⚠️  경고 사항:`);
      verification.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
    }

    if (verification.suggestions.length > 0) {
      console.log(`\n💡 개선 제안:`);
      verification.suggestions.forEach((suggestion, i) => {
        console.log(`   ${i + 1}. ${suggestion}`);
      });
    }

    if (verification.verifiedFacts.length > 0) {
      console.log(`\n✅ 검증된 사실:`);
      verification.verifiedFacts.slice(0, 5).forEach((fact, i) => {
        console.log(`   ${i + 1}. ${fact}`);
      });
      if (verification.verifiedFacts.length > 5) {
        console.log(`   ... 외 ${verification.verifiedFacts.length - 5}개`);
      }
    }

    // 3. 검증만 수행하는 경우 종료
    if (verifyOnly || (!autoImprove && !regenerate && !preview)) {
      console.log(`\n✅ 검증 완료`);
      if (!verification.isValid) {
        console.log(`\n💡 스크립트를 개선하려면:`);
        console.log(`   npm run update-content ${contentId} --auto-improve`);
        console.log(`\n💡 완전히 새로운 스크립트를 재생성하려면:`);
        console.log(`   npm run update-content ${contentId} --regenerate`);
      }
      return;
    }

    // 4. 자동 개선 수행
    if (autoImprove) {
      if (verification.isValid && verification.issues.length === 0) {
        console.log(`\n✅ 스크립트가 이미 정확합니다. 개선이 필요하지 않습니다.`);
        return;
      }

      console.log(`\n🤖 ChatGPT를 사용하여 스크립트 개선 중...`);
      const improvement = await improveContentScript(
        content.keyword,
        content.script,
        content.title,
        verification
      );

      console.log(`\n📝 개선된 스크립트:`);
      console.log(`\n${improvement.improvedScript}\n`);

      if (improvement.changes.length > 0) {
        console.log(`\n📋 변경 사항:`);
        improvement.changes.forEach((change, i) => {
          console.log(`   ${i + 1}. ${change}`);
        });
      }

      if (improvement.improvedTitle) {
        console.log(`\n📌 개선된 제목: "${improvement.improvedTitle}"`);
      }

      if (improvement.improvedDescription) {
        console.log(`\n📄 개선된 설명: "${improvement.improvedDescription}"`);
      }

      // 5. 미리보기 모드인 경우 업데이트하지 않음
      if (preview) {
        console.log(`\n👀 미리보기 모드: 실제 업데이트하지 않습니다.`);
        console.log(`\n💡 실제로 업데이트하려면 --preview 플래그를 제거하세요:`);
        console.log(`   npm run update-content ${contentId} --auto-improve`);
        return;
      }

      // 6. 업데이트할 내용 요약 표시
      console.log(`\n📋 업데이트할 내용 요약:`);
      console.log(`   - 스크립트: 개선됨 (${improvement.improvedScript.length}자)`);
      if (improvement.improvedTitle && improvement.improvedTitle !== content.title) {
        console.log(`   - 제목: "${content.title}" → "${improvement.improvedTitle}"`);
      }
      if (improvement.improvedDescription && improvement.improvedDescription !== content.description) {
        console.log(`   - 설명: 업데이트됨`);
      }
      console.log(`   - 훅: 자동 업데이트됨`);
      console.log(`   - 메모: 개선 이력 추가됨`);

      // 7. Google Sheets 업데이트
      console.log(`\n📊 Google Sheets에 업데이트 중...`);
      const rowIndex = rows.findIndex((row: any[]) => parseInt(row[0], 10) === contentId) + 2; // +2 (헤더 + 1-based)
      
      const updatedRow = [...contentRow];
      
      // 스크립트 업데이트
      updatedRow[8] = improvement.improvedScript; // script
      
      // 제목 업데이트 (개선된 경우)
      if (improvement.improvedTitle) {
        updatedRow[5] = improvement.improvedTitle; // title
      }
      
      // 설명 업데이트 (개선된 경우)
      if (improvement.improvedDescription) {
        updatedRow[6] = improvement.improvedDescription; // description
      }
      
      // 훅 업데이트 (스크립트의 첫 문장 추출)
      const firstSentence = improvement.improvedScript.split(/[.!?]/)[0].trim();
      if (firstSentence) {
        updatedRow[9] = firstSentence; // hook
      }
      
      // 메모에 개선 이력 추가
      const improvementMemo = `[${new Date().toLocaleString('ko-KR')}] ChatGPT로 자동 개선됨. 변경사항: ${improvement.changes.length}개`;
      updatedRow[12] = content.memo 
        ? `${content.memo}\n${improvementMemo}`
        : improvementMemo;

      try {
        await updateSheetData(
          sheetsClient,
          sheetId,
          `Shorts_Content!A${rowIndex}:M${rowIndex}`,
          [updatedRow]
        );

        console.log(`\n✅ Google Sheets 업데이트 완료!`);
        console.log(`\n📝 업데이트된 필드:`);
        console.log(`   ✅ 스크립트: ChatGPT로 개선된 내용으로 업데이트됨`);
        if (improvement.improvedTitle) {
          console.log(`   ✅ 제목: "${improvement.improvedTitle}"`);
        }
        if (improvement.improvedDescription) {
          console.log(`   ✅ 설명: 업데이트됨`);
        }
        console.log(`   ✅ 훅: 자동 업데이트됨`);
        console.log(`   ✅ 메모: 개선 이력 추가됨`);
        console.log(`\n💡 업데이트된 내용을 확인하려면:`);
        console.log(`   Google Sheets에서 콘텐츠 ID ${contentId}를 확인하세요.`);
        console.log(`\n🎬 이제 개선된 스크립트로 영상을 생성할 수 있습니다:`);
        console.log(`   npm run generate-video ${contentId}`);
      } catch (error: any) {
        console.error(`\n❌ Google Sheets 업데이트 실패:`, error.message);
        throw error;
      }
    }

    // 5. 완전히 새로운 스크립트 재생성
    if (regenerate) {
      console.log(`\n🔄 ChatGPT를 사용하여 완전히 새로운 스크립트 재생성 중...`);
      console.log(`   키워드: "${content.keyword}"`);
      if (content.trendKeyword) {
        console.log(`   트렌드 키워드: "${content.trendKeyword}"`);
      }

      const regenerated = await generateShortsContent(
        content.keyword,
        content.trendKeyword || undefined
      );

      console.log(`\n📝 재생성된 스크립트:`);
      console.log(`\n${regenerated.script}\n`);

      console.log(`\n📌 재생성된 제목: "${regenerated.title}"`);
      if (regenerated.titleAlternatives && regenerated.titleAlternatives.length > 0) {
        console.log(`   대안 제목:`);
        regenerated.titleAlternatives.forEach((alt, i) => {
          console.log(`   ${i + 1}. ${alt}`);
        });
      }

      console.log(`\n📄 재생성된 설명: "${regenerated.description}"`);
      console.log(`\n🏷️  재생성된 해시태그: ${regenerated.hashtags.join(' ')}`);
      console.log(`\n🎣 재생성된 훅: "${regenerated.hook}"`);

      // 미리보기 모드인 경우 업데이트하지 않음
      if (preview) {
        console.log(`\n👀 미리보기 모드: 실제 업데이트하지 않습니다.`);
        console.log(`\n💡 실제로 업데이트하려면 --preview 플래그를 제거하세요:`);
        console.log(`   npm run update-content ${contentId} --regenerate`);
        return;
      }

      // 재생성된 콘텐츠 검증 (선택적)
      console.log(`\n🔍 재생성된 콘텐츠 정확성 검증 중...`);
      const regeneratedVerification = await verifyContentAccuracy(
        content.keyword,
        regenerated.script,
        regenerated.title
      );

      console.log(`\n📋 재생성 콘텐츠 검증 결과:`);
      console.log(`   상태: ${regeneratedVerification.isValid ? '✅ 통과' : '❌ 실패'}`);
      console.log(`   신뢰도: ${regeneratedVerification.confidence}`);

      if (regeneratedVerification.issues.length > 0) {
        console.log(`\n⚠️  발견된 문제점:`);
        regeneratedVerification.issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
        console.log(`\n⚠️  재생성된 콘텐츠에도 문제가 있습니다. 다시 검토가 필요할 수 있습니다.`);
      } else {
        console.log(`\n✅ 재생성된 콘텐츠가 검증을 통과했습니다!`);
      }

      // 업데이트할 내용 요약 표시
      console.log(`\n📋 업데이트할 내용 요약:`);
      console.log(`   - 스크립트: 완전히 재생성됨 (${regenerated.script.length}자)`);
      console.log(`   - 제목: "${content.title}" → "${regenerated.title}"`);
      console.log(`   - 설명: 재생성됨`);
      console.log(`   - 해시태그: 재생성됨`);
      console.log(`   - 훅: 재생성됨`);
      console.log(`   - 메모: 재생성 이력 추가됨`);

      // Google Sheets 업데이트
      console.log(`\n📊 Google Sheets에 업데이트 중...`);
      const rowIndex = rows.findIndex((row: any[]) => parseInt(row[0], 10) === contentId) + 2; // +2 (헤더 + 1-based)
      
      const updatedRow = [...contentRow];
      
      // 모든 필드 재생성된 내용으로 업데이트
      updatedRow[5] = regenerated.title; // title
      updatedRow[6] = regenerated.description; // description
      updatedRow[7] = regenerated.hashtags.join(' '); // hashtags
      updatedRow[8] = regenerated.script; // script
      updatedRow[9] = regenerated.hook; // hook
      
      // 메모에 재생성 이력 추가
      const regenerateMemo = `[${new Date().toLocaleString('ko-KR')}] ChatGPT로 완전히 새로운 스크립트 재생성됨. 검증: ${regeneratedVerification.isValid ? '통과' : '실패'}`;
      updatedRow[12] = content.memo 
        ? `${content.memo}\n${regenerateMemo}`
        : regenerateMemo;

      try {
        await updateSheetData(
          sheetsClient,
          sheetId,
          `Shorts_Content!A${rowIndex}:M${rowIndex}`,
          [updatedRow]
        );

        console.log(`\n✅ Google Sheets 업데이트 완료!`);
        console.log(`\n📝 업데이트된 필드:`);
        console.log(`   ✅ 스크립트: 완전히 새로운 내용으로 재생성됨`);
        console.log(`   ✅ 제목: "${regenerated.title}"`);
        console.log(`   ✅ 설명: 재생성됨`);
        console.log(`   ✅ 해시태그: 재생성됨`);
        console.log(`   ✅ 훅: 재생성됨`);
        console.log(`   ✅ 메모: 재생성 이력 추가됨`);
        console.log(`\n💡 업데이트된 내용을 확인하려면:`);
        console.log(`   Google Sheets에서 콘텐츠 ID ${contentId}를 확인하세요.`);
        console.log(`\n🎬 이제 재생성된 스크립트로 영상을 생성할 수 있습니다:`);
        console.log(`   npm run generate-video ${contentId}`);
      } catch (error: any) {
        console.error(`\n❌ Google Sheets 업데이트 실패:`, error.message);
        throw error;
      }
    }

  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

