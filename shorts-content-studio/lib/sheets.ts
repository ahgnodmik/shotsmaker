import { google } from 'googleapis';

export interface SheetsConfig {
  sheetId: string;
  serviceAccountEmail?: string;
  privateKey?: string;
}

/**
 * Google Sheets API 클라이언트 생성
 */
export async function createSheetsClient(config: SheetsConfig) {
  // Service Account 방식 (권장)
  if (config.serviceAccountEmail && config.privateKey) {
    // Private Key 처리
    let privateKey = config.privateKey;
    
    // 따옴표로 감싸진 경우 제거
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // 문자열 "\n"을 실제 줄바꿈으로 변환
    // 이미 실제 줄바꿈이 있으면 그대로 사용
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Private key가 유효한지 확인
    if (!privateKey || privateKey.trim().length === 0) {
      throw new Error('Private key가 비어있습니다.');
    }
    
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new Error('Private key 형식이 올바르지 않습니다.');
    }
    
    const auth = new google.auth.JWT({
      email: config.serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 인증 토큰 가져오기
    await auth.authorize();

    return google.sheets({ version: 'v4', auth });
  }

  // API Key 방식 (읽기 전용 권장)
  const auth = new google.auth.GoogleAuth({
    keyFile: undefined,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * 시트에서 데이터 읽기
 */
export async function readSheetData(
  sheetsClient: Awaited<ReturnType<typeof createSheetsClient>>,
  sheetId: string,
  range: string
) {
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    return response.data.values || [];
  } catch (error) {
    console.error('시트 읽기 실패:', error);
    throw error;
  }
}

/**
 * 시트에 데이터 추가
 */
export async function appendSheetData(
  sheetsClient: Awaited<ReturnType<typeof createSheetsClient>>,
  sheetId: string,
  range: string,
  values: any[][]
) {
  try {
    const response = await sheetsClient.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    return response.data;
  } catch (error) {
    console.error('시트 추가 실패:', error);
    throw error;
  }
}

/**
 * 시트 데이터 업데이트
 */
export async function updateSheetData(
  sheetsClient: Awaited<ReturnType<typeof createSheetsClient>>,
  sheetId: string,
  range: string,
  values: any[][]
) {
  try {
    const response = await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    return response.data;
  } catch (error) {
    console.error('시트 업데이트 실패:', error);
    throw error;
  }
}

/**
 * Topics_Pool 데이터 타입
 */
export interface Topic {
  category: string;
  keyword: string;
  description: string;
  status: 'unused' | 'planned' | 'used';
}

/**
 * Shorts_Content 데이터 타입
 */
export interface ShortsContent {
  id?: number;
  week: string;
  targetDate: string;
  status: '작성중' | '촬영중' | '편집중' | '업로드완료';
  keyword: string;
  title: string;
  description: string;
  hashtags: string;
  script: string;
  hook: string;
  trendKeyword?: string;
  referenceLinks?: string;
  memo?: string;
}

/**
 * Weekly_Plan 데이터 타입
 */
export interface WeeklyPlan {
  week: string;
  uploadDate1: string;
  uploadDate2: string;
  topic1: string;
  topic2: string;
  trendKeyword?: string;
}

