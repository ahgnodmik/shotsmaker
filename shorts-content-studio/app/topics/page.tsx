'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Topic } from '@/lib/sheets';

const STATUS_COLORS = {
  unused: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  used: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/topics')
      .then((res) => res.json())
      .then((data) => {
        setTopics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const categories = Array.from(new Set(topics.map((t) => t.category)));

  const filteredTopics = topics.filter((topic) => {
    const statusMatch = filter === 'all' || topic.status === filter;
    const categoryMatch = categoryFilter === 'all' || topic.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-300">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            주제 풀
          </h1>
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            ← 대시보드
          </Link>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <span className="font-medium text-gray-700 dark:text-gray-300 py-2">상태:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              전체
            </button>
            {Object.keys(STATUS_COLORS).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg ${
                  filter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className="font-medium text-gray-700 dark:text-gray-300 py-2">카테고리:</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                categoryFilter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              전체
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg ${
                  categoryFilter === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              아직 주제가 없습니다.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              주제를 생성하려면: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">npm run generate-topics "경제·생활" 15</code>
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTopics.map((topic, index) => (
              <TopicCard key={index} topic={topic} />
            ))}
          </div>
        )}

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            통계
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">전체</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {topics.length}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">미사용</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {topics.filter((t) => t.status === 'unused').length}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">계획됨</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {topics.filter((t) => t.status === 'planned').length}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">사용됨</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {topics.filter((t) => t.status === 'used').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicCard({ topic }: { topic: Topic }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            STATUS_COLORS[topic.status] || ''
          }`}
        >
          {topic.status}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {topic.category}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {topic.keyword}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        {topic.description}
      </p>
    </div>
  );
}

