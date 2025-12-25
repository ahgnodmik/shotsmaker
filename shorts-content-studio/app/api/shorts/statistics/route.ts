import { NextResponse } from 'next/server';
import {
  createSheetsClient,
  readSheetData,
  ShortsContent,
} from '@/lib/sheets';

/**
 * 콘텐츠 통계 및 중복 분석 (GET)
 */
export async function GET() {
  try {
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

    // 콘텐츠 데이터 가져오기
    const contentData = await readSheetData(
      sheetsClient,
      sheetId,
      'Shorts_Content!A:M'
    );

    const rows = contentData.slice(1);
    const contents: ShortsContent[] = rows.map((row) => ({
      id: parseInt(row[0] || '0', 10),
      week: row[1] || '',
      targetDate: row[2] || '',
      status: (row[3] || '작성중') as ShortsContent['status'],
      keyword: row[4] || '',
      title: row[5] || '',
      description: row[6] || '',
      hashtags: row[7] || '',
      script: row[8] || '',
      hook: row[9] || '',
      trendKeyword: row[10] || '',
      referenceLinks: row[11] || '',
      memo: row[12] || '',
    }));

    // Topics_Pool에서 카테고리 정보 가져오기
    const topicsData = await readSheetData(
      sheetsClient,
      sheetId,
      'Topics_Pool!A:D'
    );

    const topicRows = topicsData.slice(1);
    const keywordToCategory = new Map<string, string>();
    
    topicRows.forEach((row: any[]) => {
      const category = row[0] || '';
      const keyword = row[1] || '';
      if (keyword) {
        keywordToCategory.set(keyword, category);
      }
    });

    // 카테고리별 분류
    const categoryStats = new Map<string, {
      count: number;
      contents: ShortsContent[];
      keywords: Set<string>;
    }>();

    const uncategorized: ShortsContent[] = [];

    contents.forEach((content) => {
      const category = keywordToCategory.get(content.keyword) || '미분류';
      
      if (category === '미분류') {
        uncategorized.push(content);
      }

      if (!categoryStats.has(category)) {
        categoryStats.set(category, {
          count: 0,
          contents: [],
          keywords: new Set(),
        });
      }

      const stats = categoryStats.get(category)!;
      stats.count++;
      stats.contents.push(content);
      stats.keywords.add(content.keyword);
    });

    // 카테고리별 통계 계산
    const totalCount = contents.length;
    const categoryBreakdown = Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      percentage: totalCount > 0 ? (stats.count / totalCount * 100).toFixed(1) : '0',
      uniqueKeywords: stats.keywords.size,
      contents: stats.contents.map(c => ({
        id: c.id,
        keyword: c.keyword,
        title: c.title,
        status: c.status,
      })),
    }));

    // 미분류 추가
    if (uncategorized.length > 0) {
      categoryBreakdown.push({
        category: '미분류',
        count: uncategorized.length,
        percentage: totalCount > 0 ? (uncategorized.length / totalCount * 100).toFixed(1) : '0',
        uniqueKeywords: new Set(uncategorized.map(c => c.keyword)).size,
        contents: uncategorized.map(c => ({
          id: c.id,
          keyword: c.keyword,
          title: c.title,
          status: c.status,
        })),
      });
    }

    // 중복 감지 (키워드 기반)
    const keywordCounts = new Map<string, number[]>();
    contents.forEach((content) => {
      if (!keywordCounts.has(content.keyword)) {
        keywordCounts.set(content.keyword, []);
      }
      keywordCounts.get(content.keyword)!.push(content.id || 0);
    });

    const duplicates = Array.from(keywordCounts.entries())
      .filter(([_, ids]) => ids.length > 1)
      .map(([keyword, ids]) => ({
        keyword,
        count: ids.length,
        contentIds: ids,
        contents: ids.map(id => {
          const content = contents.find(c => c.id === id);
          return content ? {
            id: content.id,
            title: content.title,
            status: content.status,
            week: content.week,
          } : null;
        }).filter(Boolean),
      }));

    // 상태별 통계
    const statusStats = new Map<string, number>();
    contents.forEach((content) => {
      const status = content.status || '작성중';
      statusStats.set(status, (statusStats.get(status) || 0) + 1);
    });

    const statusBreakdown = Array.from(statusStats.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: totalCount > 0 ? (count / totalCount * 100).toFixed(1) : '0',
    }));

    // 주차별 통계
    const weekStats = new Map<string, number>();
    contents.forEach((content) => {
      const week = content.week || '미지정';
      weekStats.set(week, (weekStats.get(week) || 0) + 1);
    });

    const weekBreakdown = Array.from(weekStats.entries())
      .map(([week, count]) => ({
        week,
        count,
        percentage: totalCount > 0 ? (count / totalCount * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.week.localeCompare(a.week)); // 최신 주차부터

    return NextResponse.json({
      success: true,
      statistics: {
        total: totalCount,
        byCategory: categoryBreakdown,
        byStatus: statusBreakdown,
        byWeek: weekBreakdown,
        duplicates: duplicates,
        summary: {
          totalCategories: categoryBreakdown.length,
          totalDuplicates: duplicates.length,
          duplicateKeywords: duplicates.length,
          totalDuplicateContents: duplicates.reduce((sum, d) => sum + d.count, 0),
        },
      },
    });
  } catch (error: any) {
    console.error('오류 발생:', error);
    return NextResponse.json(
      { error: error.message || '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}




