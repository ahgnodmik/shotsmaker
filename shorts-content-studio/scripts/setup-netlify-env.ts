/**
 * .env.local의 환경 변수를 Netlify에 설정하는 스크립트
 * 
 * 사용법:
 * npm run setup-netlify-env [--site-id=YOUR_SITE_ID]
 * 
 * 또는 Netlify CLI로:
 * netlify env:set KEY "value"
 */

import dotenv from 'dotenv';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

interface EnvVar {
  key: string;
  value: string;
  required: boolean;
  description: string;
}

function getEnvVars(): EnvVar[] {
  const siteUrl = process.env.NETLIFY_SITE_URL || 'https://your-site.netlify.app';
  
  return [
    {
      key: 'GOOGLE_SHEET_ID',
      value: process.env.GOOGLE_SHEET_ID || '',
      required: true,
      description: 'Google Sheets ID',
    },
    {
      key: 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      value: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
      required: true,
      description: 'Google Service Account Email',
    },
    {
      key: 'GOOGLE_PRIVATE_KEY',
      value: process.env.GOOGLE_PRIVATE_KEY || '',
      required: true,
      description: 'Google Private Key (따옴표 포함)',
    },
    {
      key: 'OPENAI_API_KEY',
      value: process.env.OPENAI_API_KEY || '',
      required: true,
      description: 'OpenAI API Key',
    },
    {
      key: 'OPENAI_MODEL',
      value: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      required: false,
      description: 'OpenAI Model',
    },
    {
      key: 'PEXELS_API_KEY',
      value: process.env.PEXELS_API_KEY || '',
      required: false,
      description: 'Pexels API Key (비디오 생성 시 필요)',
    },
    {
      key: 'YOUTUBE_CLIENT_ID',
      value: process.env.YOUTUBE_CLIENT_ID || '',
      required: false,
      description: 'YouTube Client ID (YouTube 업로드 시 필요)',
    },
    {
      key: 'YOUTUBE_CLIENT_SECRET',
      value: process.env.YOUTUBE_CLIENT_SECRET || '',
      required: false,
      description: 'YouTube Client Secret (YouTube 업로드 시 필요)',
    },
    {
      key: 'YOUTUBE_REDIRECT_URI',
      value: `${siteUrl}/api/youtube/callback`,
      required: false,
      description: 'YouTube Redirect URI (Netlify URL로 자동 변경)',
    },
    {
      key: 'YOUTUBE_REFRESH_TOKEN',
      value: process.env.YOUTUBE_REFRESH_TOKEN || '',
      required: false,
      description: 'YouTube Refresh Token (YouTube 업로드 시 필요)',
    },
  ];
}

function checkNetlifyCLI(): boolean {
  try {
    execSync('netlify --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkNetlifyLogin(): boolean {
  try {
    const result = execSync('netlify status --json', { encoding: 'utf-8', stdio: 'pipe' });
    const status = JSON.parse(result);
    return status.loggedIn === true;
  } catch {
    return false;
  }
}

function getSiteId(): string | null {
  try {
    const result = execSync('netlify status --json', { encoding: 'utf-8', stdio: 'pipe' });
    const status = JSON.parse(result);
    return status.site?.id || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log('\n🔧 Netlify 환경 변수 설정 스크립트\n');

  // 1. Netlify CLI 확인
  if (!checkNetlifyCLI()) {
    console.error('❌ Netlify CLI가 설치되지 않았습니다.');
    console.log('설치: npm install -g netlify-cli');
    process.exit(1);
  }

  // 2. 로그인 확인
  if (!checkNetlifyLogin()) {
    console.error('❌ Netlify에 로그인되지 않았습니다.');
    console.log('로그인: netlify login');
    process.exit(1);
  }

  // 3. 사이트 ID 확인
  const args = process.argv.slice(2);
  let siteId: string | null = null;

  for (const arg of args) {
    if (arg.startsWith('--site-id=')) {
      siteId = arg.split('=')[1];
    }
  }

  if (!siteId) {
    siteId = getSiteId();
  }

  if (!siteId) {
    console.error('❌ Netlify 사이트가 연결되지 않았습니다.');
    console.log('사이트 연결: netlify link');
    console.log('또는 --site-id=YOUR_SITE_ID 옵션 사용');
    process.exit(1);
  }

  console.log(`✅ 사이트 ID: ${siteId}\n`);

  // 4. 환경 변수 가져오기
  const envVars = getEnvVars();
  const missing = envVars.filter(v => v.required && !v.value);

  if (missing.length > 0) {
    console.error('❌ 필수 환경 변수가 누락되었습니다:');
    missing.forEach(v => console.error(`   - ${v.key}`));
    console.log('\n.env.local 파일을 확인하세요.');
    process.exit(1);
  }

  // 5. 환경 변수 설정
  console.log('📝 Netlify에 환경 변수 설정 중...\n');

  for (const envVar of envVars) {
    if (!envVar.value && envVar.required) {
      continue; // 이미 체크했지만 안전을 위해
    }

    if (!envVar.value && !envVar.required) {
      console.log(`⏭️  ${envVar.key}: 건너뜀 (선택사항, 값 없음)`);
      continue;
    }

    try {
      // GOOGLE_PRIVATE_KEY는 따옴표로 감싸야 함
      let value = envVar.value;
      if (envVar.key === 'GOOGLE_PRIVATE_KEY' && !value.startsWith('"')) {
        value = `"${value}"`;
      }

      const command = `netlify env:set ${envVar.key} "${value.replace(/"/g, '\\"')}" --context production`;
      execSync(command, { stdio: 'inherit' });
      console.log(`✅ ${envVar.key}: 설정 완료`);
    } catch (error: any) {
      console.error(`❌ ${envVar.key}: 설정 실패 - ${error.message}`);
    }
  }

  console.log('\n✅ 환경 변수 설정 완료!');
  console.log('\n📋 다음 단계:');
  console.log('1. Netlify 대시보드에서 환경 변수 확인');
  console.log('2. 사이트 재배포 (환경 변수 변경 후 필요)');
  console.log('3. 배포 로그에서 환경 변수 로드 확인\n');
}

main().catch(console.error);




