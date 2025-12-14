'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Statistics {
  total: number;
  byCategory: Array<{
    category: string;
    count: number;
    percentage: string;
    uniqueKeywords: number;
    contents: Array<{
      id: number;
      keyword: string;
      title: string;
      status: string;
    }>;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    percentage: string;
  }>;
  byWeek: Array<{
    week: string;
    count: number;
    percentage: string;
  }>;
  duplicates: Array<{
    keyword: string;
    count: number;
    contentIds: number[];
    contents: Array<{
      id: number;
      title: string;
      status: string;
      week: string;
    }>;
  }>;
  summary: {
    totalCategories: number;
    totalDuplicates: number;
    duplicateKeywords: number;
    totalDuplicateContents: number;
  };
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'category' | 'status' | 'week' | 'duplicates'>('category');

  useEffect(() => {
    fetch('/api/shorts/statistics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.statistics);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-300">로딩 중...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-red-600 dark:text-red-400">통계를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            콘텐츠 통계 및 중복 분석
          </h1>
          <Link
            href="/shorts"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            ← 콘텐츠 관리
          </Link>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">전체 콘텐츠</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">카테고리 수</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.summary.totalCategories}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">중복 키워드</div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.summary.duplicateKeywords}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">중복 콘텐츠</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.summary.totalDuplicateContents}</div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('category')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'category'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            카테고리별 ({stats.byCategory.length})
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'status'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            상태별 ({stats.byStatus.length})
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            주차별 ({stats.byWeek.length})
          </button>
          <button
            onClick={() => setActiveTab('duplicates')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'duplicates'
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            중복 ({stats.duplicates.length})
          </button>
        </div>

        {/* 카테고리별 통계 */}
        {activeTab === 'category' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              카테고리별 분류 및 비율
            </h2>
            <div className="space-y-4">
              {stats.byCategory.map((cat) => (
                <div key={cat.category} className="border-b dark:border-gray-700 pb-4 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {cat.category}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        고유 키워드: {cat.uniqueKeywords}개
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {cat.count}개
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {cat.percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      콘텐츠 목록 보기 ({cat.contents.length}개)
                    </summary>
                    <div className="mt-2 space-y-1">
                      {cat.contents.map((content) => (
                        <div
                          key={content.id}
                          className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                          <span className="font-medium">#{content.id}</span> {content.title || content.keyword}
                          <span className="ml-2 text-xs text-gray-500">({content.status})</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상태별 통계 */}
        {activeTab === 'status' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              상태별 분류 및 비율
            </h2>
            <div className="space-y-4">
              {stats.byStatus.map((status) => (
                <div key={status.status} className="border-b dark:border-gray-700 pb-4 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {status.status}
                    </h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {status.count}개
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {status.percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 주차별 통계 */}
        {activeTab === 'week' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              주차별 분류 및 비율
            </h2>
            <div className="space-y-4">
              {stats.byWeek.map((week) => (
                <div key={week.week} className="border-b dark:border-gray-700 pb-4 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {week.week || '미지정'}
                    </h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {week.count}개
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {week.percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${week.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 중복 분석 */}
        {activeTab === 'duplicates' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              중복 키워드 분석
            </h2>
            {stats.duplicates.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                중복된 키워드가 없습니다. ✅
              </div>
            ) : (
              <div className="space-y-4">
                {stats.duplicates.map((dup) => (
                  <div
                    key={dup.keyword}
                    className="border border-red-300 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/20"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                          키워드: {dup.keyword}
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {dup.count}개의 중복 콘텐츠 발견
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {dup.count}개
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {dup.contents.map((content) => (
                        <div
                          key={content.id}
                          className="text-sm p-2 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-800"
                        >
                          <span className="font-medium text-red-900 dark:text-red-200">
                            ID: {content.id}
                          </span>{' '}
                          {content.title || dup.keyword}
                          <span className="ml-2 text-xs text-gray-500">
                            ({content.status}) - {content.week}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

