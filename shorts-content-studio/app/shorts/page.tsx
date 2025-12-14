'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShortsContent } from '@/lib/sheets';

const STATUS_COLORS = {
  작성중: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  촬영중: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  편집중: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  업로드완료: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const STATUS_OPTIONS: ShortsContent['status'][] = ['작성중', '촬영중', '편집중', '업로드완료'];

export default function ShortsPage() {
  const [contents, setContents] = useState<ShortsContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContent, setEditingContent] = useState<ShortsContent | null>(null);

  const loadContents = () => {
    setLoading(true);
    fetch('/api/shorts')
      .then((res) => res.json())
      .then((data) => {
        setContents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadContents();
  }, []);

  const filteredContents =
    filter === 'all'
      ? contents
      : contents.filter((c) => c.status === filter);

  const handleDelete = async (id: number) => {
    const content = contents.find(c => c.id === id);
    const warningMessage = `⚠️ 경고: 콘텐츠 삭제\n\n` +
      `삭제할 콘텐츠:\n` +
      `- ID: ${id}\n` +
      `- 제목: ${content?.title || content?.keyword || 'N/A'}\n` +
      `- 키워드: ${content?.keyword || 'N/A'}\n\n` +
      `이 작업은 되돌릴 수 없습니다.\n` +
      `거짓 정보 관리를 위한 삭제인지 확인해주세요.\n\n` +
      `정말로 삭제하시겠습니까?`;
    
    if (!confirm(warningMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/shorts/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('콘텐츠가 삭제되었습니다.');
        loadContents();
      } else {
        alert(`오류: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('콘텐츠 삭제 중 오류가 발생했습니다.');
    }
  };

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
            숏츠 콘텐츠 관리
          </h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + 새 콘텐츠
            </button>
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              ← 대시보드
            </Link>
          </div>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
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

        {filteredContents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              {filter === 'all'
                ? '아직 생성된 콘텐츠가 없습니다.'
                : `${filter} 상태의 콘텐츠가 없습니다.`}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              첫 콘텐츠 만들기
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredContents.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onEdit={() => setEditingContent(content)}
                onUpdate={loadContents}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {showCreateModal && (
          <CreateContentModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadContents();
            }}
          />
        )}

        {editingContent && (
          <EditContentModal
            content={editingContent}
            onClose={() => setEditingContent(null)}
            onSuccess={() => {
              setEditingContent(null);
              loadContents();
            }}
          />
        )}
      </div>
    </div>
  );
}

function ContentCard({
  content,
  onEdit,
  onUpdate,
  onDelete,
}: {
  content: ShortsContent;
  onEdit: () => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
}) {
  const [generating, setGenerating] = useState(false);

  const handleGenerateFromKeyword = async () => {
    if (!content.id) return;

    setGenerating(true);
    try {
      const response = await fetch(`/api/shorts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: content.id,
          keyword: content.keyword,
          trendKeyword: content.trendKeyword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('키워드로 콘텐츠가 재생성되었습니다!');
        onUpdate();
      } else {
        alert(`오류: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            STATUS_COLORS[content.status] || ''
          }`}
        >
          {content.status}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ID: {content.id}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {content.title || content.keyword}
      </h3>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
        <div>
          <span className="font-medium">주차:</span> {content.week}
        </div>
        <div>
          <span className="font-medium">목표일:</span> {content.targetDate || '-'}
        </div>
        <div>
          <span className="font-medium">키워드:</span> {content.keyword}
        </div>
        {content.trendKeyword && (
          <div>
            <span className="font-medium">트렌드:</span> {content.trendKeyword}
          </div>
        )}
      </div>

      {content.hook && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-sm text-gray-700 dark:text-gray-200 italic">
            "{content.hook}"
          </p>
        </div>
      )}

      {content.script && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            스크립트 보기
          </summary>
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
            {content.script}
          </div>
        </details>
      )}

      {content.hashtags && (
        <div className="mt-4 flex flex-wrap gap-1">
          {content.hashtags.split(' ').slice(0, 5).map((tag, i) => (
            <span
              key={i}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
        >
          편집
        </button>
        <button
          onClick={handleGenerateFromKeyword}
          disabled={generating}
          className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {generating ? '생성 중...' : '키워드로 재생성'}
        </button>
        <button
          onClick={() => onDelete(content.id!)}
          className="px-3 py-2 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-600 text-sm rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
          title="⚠️ 거짓 정보 관리: 콘텐츠 삭제"
        >
          ⚠️ 삭제
        </button>
      </div>
    </div>
  );
}

function CreateContentModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    keyword: '',
    week: '',
    targetDate: '',
    trendKeyword: '',
    generateContent: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/shorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: formData.keyword,
          week: formData.week || undefined,
          targetDate: formData.targetDate || undefined,
          trendKeyword: formData.trendKeyword || undefined,
          generateContent: formData.generateContent,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('콘텐츠가 생성되었습니다!');
        onSuccess();
      } else {
        alert(`오류: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              새 콘텐츠 생성
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                키워드 *
              </label>
              <input
                type="text"
                required
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="예: ETF, 신용카드 포인트"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  주차
                </label>
                <input
                  type="text"
                  value={formData.week}
                  onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="예: 2025-W21 (비워두면 자동)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  목표일
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                트렌드 키워드
              </label>
              <input
                type="text"
                value={formData.trendKeyword}
                onChange={(e) => setFormData({ ...formData, trendKeyword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="선택사항"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="generateContent"
                checked={formData.generateContent}
                onChange={(e) => setFormData({ ...formData, generateContent: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="generateContent" className="text-sm text-gray-700 dark:text-gray-300">
                GPT로 자동 생성 (체크 해제 시 빈 콘텐츠로 생성)
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? '생성 중...' : '생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditContentModal({
  content,
  onClose,
  onSuccess,
}: {
  content: ShortsContent;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    week: content.week || '',
    targetDate: content.targetDate || '',
    status: content.status || '작성중',
    keyword: content.keyword || '',
    title: content.title || '',
    description: content.description || '',
    hashtags: content.hashtags || '',
    script: content.script || '',
    hook: content.hook || '',
    trendKeyword: content.trendKeyword || '',
    referenceLinks: content.referenceLinks || '',
    memo: content.memo || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/shorts/${content.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert('콘텐츠가 업데이트되었습니다!');
        onSuccess();
      } else {
        alert(`오류: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('콘텐츠 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              콘텐츠 편집 (ID: {content.id})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  주차
                </label>
                <input
                  type="text"
                  value={formData.week}
                  onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  목표일
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ShortsContent['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                키워드
              </label>
              <input
                type="text"
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                제목
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                해시태그
              </label>
              <input
                type="text"
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="#해시태그1 #해시태그2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                훅 (한 줄 훅)
              </label>
              <input
                type="text"
                value={formData.hook}
                onChange={(e) => setFormData({ ...formData, hook: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                스크립트
              </label>
              <textarea
                value={formData.script}
                onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                트렌드 키워드
              </label>
              <input
                type="text"
                value={formData.trendKeyword}
                onChange={(e) => setFormData({ ...formData, trendKeyword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                참고 링크
              </label>
              <input
                type="text"
                value={formData.referenceLinks}
                onChange={(e) => setFormData({ ...formData, referenceLinks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                메모
              </label>
              <textarea
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
