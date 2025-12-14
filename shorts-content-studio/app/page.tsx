import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            📹 콘텐츠 스튜디오 대시보드
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
            "그거 모르죠? 내가 알려줌" 시리즈 관리 시스템
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <DashboardCard
              title="이번 주 업로드 예정"
              description="이번 주에 업로드할 2개의 숏츠 콘텐츠"
              href="/shorts"
              emoji="🎬"
            />
            <DashboardCard
              title="주제 풀"
              description="사용 가능한 주제 모음"
              href="/topics"
              emoji="💡"
            />
            <DashboardCard
              title="참고 자료"
              description="레퍼런스 영상 및 문서"
              href="/references"
              emoji="📚"
            />
            <DashboardCard
              title="통계 및 중복 분석"
              description="콘텐츠 통계, 분류, 중복 정보 관리"
              href="/statistics"
              emoji="📊"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              빠른 시작 가이드
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Google Sheets API 설정 (docs/GOOGLE_SHEETS_SETUP.md 참고)</li>
              <li>시트 구조 설정: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">npm run setup-sheets</code></li>
              <li>주제 생성: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">npm run generate-topics "경제·생활" 15</code></li>
              <li>주간 콘텐츠 생성: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">npm run generate-weekly-content</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  emoji,
}: {
  title: string;
  description: string;
  href: string;
  emoji: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </Link>
  );
}
