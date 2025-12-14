import Link from 'next/link';

export default function ReferencesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            참고 자료
          </h1>
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            ← 대시보드
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            참고 자료 기능은 곧 추가될 예정입니다.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            References 시트에서 데이터를 불러와 표시할 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

