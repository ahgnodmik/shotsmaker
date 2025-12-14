/**
 * 영상 자동 생성 및 YouTube 업로드 스크립트
 * 
 * 사용법:
 * npm run generate-video <content-id>
 * 예: npm run generate-video 1
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  textToSpeech,
  getImageFromUnsplash,
  getVideoFromPexels,
  getMultipleVideosFromPexels,
  createVideo,
} from '../lib/video';
import { uploadVideoToYouTube } from '../lib/youtube';
import {
  createSheetsClient,
  readSheetData,
  updateSheetData,
  ShortsContent,
} from '../lib/sheets';
import { verifyContentAccuracy } from '../lib/openai';

const TEMP_DIR = path.join(process.cwd(), 'temp');
const OUTPUT_DIR = path.join(process.cwd(), 'output');

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
사용법: npm run generate-video <content-id> [옵션]

옵션:
  --skip-verification    검증을 건너뛰고 바로 영상 생성
  --force                검증 실패해도 강제로 영상 생성
  --upload               영상 생성 후 YouTube에 업로드

예시:
  npm run generate-video 1
  npm run generate-video 1 --skip-verification
  npm run generate-video 1 --force
  npm run generate-video 1 --upload
    `);
    process.exit(1);
  }

  const contentId = parseInt(args[0], 10);

  if (isNaN(contentId)) {
    console.error('콘텐츠 ID는 숫자여야 합니다.');
    process.exit(1);
  }

  // 옵션 플래그 확인
  const skipVerification = args.includes('--skip-verification');
  const forceGeneration = args.includes('--force');
  const shouldUpload = args.includes('--upload');

  console.log(`\n🎬 콘텐츠 ID ${contentId}의 영상을 생성합니다...\n`);

  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.error('❌ Google Sheets 설정이 필요합니다.');
    process.exit(1);
  }

  try {
    // 임시 디렉토리 생성
    await fs.mkdir(TEMP_DIR, { recursive: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

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
    const contentRow = rows.find((row) => parseInt(row[0], 10) === contentId);

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

    // 2. 콘텐츠 정확성 검증 (선택적)
    let verification: Awaited<ReturnType<typeof verifyContentAccuracy>> | null = null;
    
    if (skipVerification) {
      console.log('⏭️  검증을 건너뜁니다. (--skip-verification)\n');
    } else {
      console.log('🔍 콘텐츠 정확성 검증 중...');
      verification = await verifyContentAccuracy(
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

      if (!verification.isValid) {
        if (forceGeneration) {
          console.log(`\n⚠️  검증 실패했지만 --force 플래그로 강제 진행합니다.`);
          console.log(`   Google Sheets에서 수정한 내용을 그대로 사용합니다.\n`);
        } else {
          console.error(`\n❌ 검증 실패: 스크립트에 심각한 문제가 발견되었습니다.`);
          console.error(`   영상 생성을 중단합니다.`);
          console.error(`\n💡 해결 방법:`);
          console.error(`   1. Google Sheets에서 스크립트를 수정하세요.`);
          console.error(`   2. 검증 결과를 참고하여 정확한 정보로 업데이트하세요.`);
          console.error(`   3. 수정 후 다시 실행하거나 --force 플래그로 강제 진행하세요.`);
          if (verification.suggestions.length > 0) {
            console.error(`\n📝 개선 제안:`);
            verification.suggestions.forEach((suggestion, i) => {
              console.error(`   ${i + 1}. ${suggestion}`);
            });
          }
          console.error(`\n💡 Google Sheets에서 수정한 내용을 그대로 사용하려면:`);
          console.error(`   npm run generate-video ${contentId} --force`);
          process.exit(1);
        }
      } else {
        if (verification.warnings.length > 0) {
          console.log(`\n⚠️  경고가 있지만 계속 진행합니다. 수동 검토를 권장합니다.`);
        }

        if (verification.verifiedFacts.length > 0) {
          console.log(`\n✅ 검증된 사실:`);
          verification.verifiedFacts.slice(0, 3).forEach((fact, i) => {
            console.log(`   ${i + 1}. ${fact}`);
          });
          if (verification.verifiedFacts.length > 3) {
            console.log(`   ... 외 ${verification.verifiedFacts.length - 3}개`);
          }
        }
      }

      console.log(`\n`);
    }

    // 3. TTS로 음성 생성
    const audioPath = path.join(TEMP_DIR, `audio-${contentId}.mp3`);
    await textToSpeech(content.script, audioPath);

    // 4. 이미지 또는 비디오 가져오기 (3~4개 비디오 조합)
    let imagePath: string | undefined;
    let videoPath: string | undefined;
    let videoPaths: string[] | undefined;

    try {
      // 먼저 여러 비디오 시도 (Pexels) - 3~4개 조합
      if (process.env.PEXELS_API_KEY) {
        // 한국어 키워드를 영어로 변환
        const keywordMap: Record<string, string> = {
          '신용카드': 'credit card',
          '소득공제': 'tax deduction',
          '카카오뱅크': 'banking',
          '정부지원금': 'government support',
        };
        const searchKeyword = keywordMap[content.keyword] || content.keyword;
        
        console.log(`🎬 배경 영상 검색 중: "${searchKeyword}" (3~4개 조합)`);
        videoPaths = await getMultipleVideosFromPexels(searchKeyword, 4, TEMP_DIR);
        console.log(`✅ ${videoPaths.length}개의 배경 영상 다운로드 완료`);
      }
    } catch (error: any) {
      console.log(`⚠️  여러 비디오를 가져올 수 없습니다: ${error.message}`);
      console.log('   단일 비디오로 재시도...');
      
      // 단일 비디오로 재시도
      try {
        if (process.env.PEXELS_API_KEY) {
          const keywordMap: Record<string, string> = {
            '신용카드': 'credit card',
            '소득공제': 'tax deduction',
            '카카오뱅크': 'banking',
            '정부지원금': 'government support',
          };
          const searchKeyword = keywordMap[content.keyword] || content.keyword;
          
          videoPath = path.join(TEMP_DIR, `video-${contentId}.mp4`);
          await getVideoFromPexels(searchKeyword, videoPath);
          console.log('✅ 단일 배경 영상 다운로드 완료');
        }
      } catch (retryError: any) {
        console.log(`⚠️  비디오를 가져올 수 없습니다: ${retryError.message}`);
        console.log('   이미지를 사용합니다.');
        videoPath = undefined;
        videoPaths = undefined;
      }
    }

    if (!videoPath) {
      try {
        // 이미지 사용 (Unsplash 또는 Pexels)
        if (process.env.UNSPLASH_ACCESS_KEY) {
          imagePath = path.join(TEMP_DIR, `image-${contentId}.jpg`);
          await getImageFromUnsplash(content.keyword, imagePath);
        } else if (process.env.PEXELS_API_KEY) {
          // Pexels에서 이미지 가져오기
          const axios = (await import('axios')).default;
          
          // 한국어 키워드를 영어로 변환 시도 (간단한 매핑)
          const keywordMap: Record<string, string> = {
            '신용카드': 'credit card',
            '소득공제': 'tax deduction',
            '카카오뱅크': 'banking',
            '정부지원금': 'government support',
          };
          const searchKeyword = keywordMap[content.keyword] || content.keyword;
          
          console.log(`🔍 이미지 검색 중: "${searchKeyword}"`);
          
          const response = await axios.get('https://api.pexels.com/v1/search', {
            params: {
              query: searchKeyword,
              per_page: 1,
              orientation: 'portrait',
            },
            headers: {
              Authorization: process.env.PEXELS_API_KEY,
            },
          });
          
          if (!response.data.photos || response.data.photos.length === 0) {
            // 영어 키워드로 재시도
            const englishKeyword = content.keyword;
            console.log(`🔍 영어 키워드로 재시도: "${englishKeyword}"`);
            const retryResponse = await axios.get('https://api.pexels.com/v1/search', {
              params: {
                query: englishKeyword,
                per_page: 1,
              },
              headers: {
                Authorization: process.env.PEXELS_API_KEY,
              },
            });
            
            if (!retryResponse.data.photos || retryResponse.data.photos.length === 0) {
              throw new Error('이미지를 찾을 수 없습니다.');
            }
            
            const imageUrl = retryResponse.data.photos[0]?.src?.large || retryResponse.data.photos[0]?.src?.original;
            if (!imageUrl) {
              throw new Error('이미지 URL을 찾을 수 없습니다.');
            }
            
            imagePath = path.join(TEMP_DIR, `image-${contentId}.jpg`);
            const imageResponse = await axios.get(imageUrl, {
              responseType: 'arraybuffer',
            });
            await fs.writeFile(imagePath, imageResponse.data);
            console.log('✅ 이미지 다운로드 완료 (Pexels)');
          } else {
            const imageUrl = response.data.photos[0]?.src?.large || response.data.photos[0]?.src?.original;
            if (!imageUrl) {
              throw new Error('이미지 URL을 찾을 수 없습니다.');
            }
            
            imagePath = path.join(TEMP_DIR, `image-${contentId}.jpg`);
            const imageResponse = await axios.get(imageUrl, {
              responseType: 'arraybuffer',
            });
            await fs.writeFile(imagePath, imageResponse.data);
            console.log('✅ 이미지 다운로드 완료 (Pexels)');
          }
        } else {
          throw new Error('이미지/비디오 API 키가 설정되지 않았습니다. (UNSPLASH_ACCESS_KEY 또는 PEXELS_API_KEY 필요)');
        }
      } catch (error: any) {
        console.error('❌ 이미지/비디오를 가져올 수 없습니다:', error.message);
        throw error;
      }
    }

    // 5. 영상 생성
    const outputPath = path.join(OUTPUT_DIR, `video-${contentId}.mp4`);
    await createVideo({
      audioPath,
      imagePath,
      videoPath,
      videoPaths, // 여러 비디오 경로 전달
      script: content.script,
      outputPath,
      title: content.title,
    });

    // 6. YouTube 업로드 (선택사항)

    if (shouldUpload) {
      const tags = content.hashtags
        .split(' ')
        .filter((tag) => tag.startsWith('#'))
        .map((tag) => tag.replace('#', ''));

      const videoUrl = await uploadVideoToYouTube({
        videoPath: outputPath,
        title: content.title,
        description: content.description,
        tags,
        privacyStatus: 'private', // 검토 후 공개
      });

      // 7. Google Sheets 업데이트
      const rowIndex = rows.findIndex((row) => parseInt(row[0], 10) === contentId) + 2; // +2 (헤더 + 1-based)
      const updatedRow = [...contentRow];
      updatedRow[3] = '업로드완료'; // 상태
      updatedRow[11] = videoUrl; // 참고 영상 링크

      await updateSheetData(
        sheetsClient,
        sheetId,
        `Shorts_Content!A${rowIndex}:M${rowIndex}`,
        [updatedRow]
      );

      console.log(`\n✅ Google Sheets 업데이트 완료`);
    } else {
      console.log(`\n💡 YouTube에 업로드하려면 --upload 플래그를 추가하세요:`);
      console.log(`   npm run generate-video ${contentId} --upload`);
    }

    // 8. 임시 파일 정리
    console.log('\n🧹 임시 파일 정리 중...');
    await fs.unlink(audioPath).catch(() => {});
    if (imagePath) await fs.unlink(imagePath).catch(() => {});
    if (videoPath) await fs.unlink(videoPath).catch(() => {});
    if (videoPaths) {
      for (const vp of videoPaths) {
        await fs.unlink(vp).catch(() => {});
      }
    }

    console.log('\n✨ 완료!');
    console.log(`영상 파일: ${outputPath}`);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();

