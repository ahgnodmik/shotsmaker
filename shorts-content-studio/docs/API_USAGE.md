# API 사용 가이드

웹에서 사용할 수 있는 API 엔드포인트 사용 방법입니다.

## 기본 URL

로컬 개발:
```
http://localhost:3000/api
```

Netlify 배포:
```
https://your-site.netlify.app/api
```

## API 엔드포인트

### 1. 주간 콘텐츠 생성

**엔드포인트**: `POST /api/generate-weekly-content`

**요청 본문**:
```json
{
  "week": "2025-W21"  // 선택사항, 없으면 현재 주차 자동 계산
}
```

**응답**:
```json
{
  "success": true,
  "message": "주차 \"2025-W21\"의 콘텐츠가 생성되었습니다.",
  "contentIds": [1, 2],
  "contents": [
    {
      "id": 1,
      "title": "생성된 제목",
      "keyword": "주제 키워드"
    },
    {
      "id": 2,
      "title": "생성된 제목",
      "keyword": "주제 키워드"
    }
  ]
}
```

**사용 예시**:
```javascript
const response = await fetch('/api/generate-weekly-content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    week: '2025-W21'
  })
});

const data = await response.json();
if (data.success) {
  console.log('생성된 콘텐츠 ID:', data.contentIds);
}
```

### 2. 콘텐츠 검증

**엔드포인트**: `POST /api/update-content`

**요청 본문**:
```json
{
  "contentId": 1,
  "action": "verify"
}
```

**응답**:
```json
{
  "success": true,
  "verification": {
    "isValid": false,
    "confidence": "medium",
    "issues": [
      "구체적인 문제점 1",
      "구체적인 문제점 2"
    ],
    "warnings": [
      "경고 사항 1"
    ],
    "suggestions": [
      "개선 제안 1"
    ],
    "verifiedFacts": [
      "검증된 사실 1"
    ]
  },
  "content": {
    "id": 1,
    "title": "콘텐츠 제목",
    "keyword": "키워드"
  }
}
```

**사용 예시**:
```javascript
const response = await fetch('/api/update-content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contentId: 1,
    action: 'verify'
  })
});

const data = await response.json();
if (data.success) {
  console.log('검증 결과:', data.verification);
  if (!data.verification.isValid) {
    console.log('문제점:', data.verification.issues);
  }
}
```

### 3. 콘텐츠 개선

**엔드포인트**: `POST /api/update-content`

**요청 본문**:
```json
{
  "contentId": 1,
  "action": "improve",
  "preview": false  // true면 미리보기만, false면 실제 업데이트
}
```

**응답**:
```json
{
  "success": true,
  "message": "콘텐츠가 개선되어 업데이트되었습니다.",
  "improvement": {
    "improvedScript": "개선된 스크립트...",
    "improvedTitle": "개선된 제목",
    "improvedDescription": "개선된 설명",
    "changes": [
      "변경 사항 1",
      "변경 사항 2"
    ]
  },
  "verification": {
    "isValid": true,
    "confidence": "high",
    "issues": [],
    "warnings": [],
    "suggestions": [],
    "verifiedFacts": []
  }
}
```

**사용 예시**:
```javascript
// 미리보기
const previewResponse = await fetch('/api/update-content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contentId: 1,
    action: 'improve',
    preview: true
  })
});

const previewData = await previewResponse.json();
console.log('개선된 스크립트:', previewData.improvement.improvedScript);

// 실제 업데이트
const updateResponse = await fetch('/api/update-content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contentId: 1,
    action: 'improve',
    preview: false
  })
});

const updateData = await updateResponse.json();
if (updateData.success) {
  console.log('업데이트 완료!');
}
```

### 4. 콘텐츠 재생성

**엔드포인트**: `POST /api/update-content`

**요청 본문**:
```json
{
  "contentId": 1,
  "action": "regenerate",
  "preview": false
}
```

**응답**:
```json
{
  "success": true,
  "message": "콘텐츠가 재생성되어 업데이트되었습니다.",
  "regenerated": {
    "title": "재생성된 제목",
    "titleAlternatives": ["제목 2안", "제목 3안"],
    "description": "재생성된 설명",
    "hashtags": ["#해시태그1", "#해시태그2"],
    "script": "재생성된 스크립트...",
    "hook": "재생성된 훅"
  },
  "verification": {
    "isValid": true,
    "confidence": "high",
    "issues": [],
    "warnings": [],
    "suggestions": [],
    "verifiedFacts": []
  }
}
```

**사용 예시**:
```javascript
const response = await fetch('/api/update-content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contentId: 1,
    action: 'regenerate',
    preview: false
  })
});

const data = await response.json();
if (data.success) {
  console.log('재생성된 제목:', data.regenerated.title);
  console.log('재생성된 스크립트:', data.regenerated.script);
}
```

### 5. 콘텐츠 목록 조회

**엔드포인트**: `GET /api/shorts`

**응답**:
```json
[
  {
    "id": 1,
    "week": "2025-W21",
    "targetDate": "2025-05-26",
    "status": "작성중",
    "keyword": "키워드",
    "title": "제목",
    "description": "설명",
    "hashtags": "#해시태그1 #해시태그2",
    "script": "스크립트...",
    "hook": "훅",
    "trendKeyword": "트렌드 키워드",
    "referenceLinks": "",
    "memo": ""
  },
  ...
]
```

**사용 예시**:
```javascript
const response = await fetch('/api/shorts');
const contents = await response.json();
console.log('콘텐츠 목록:', contents);
```

### 6. 주제 목록 조회

**엔드포인트**: `GET /api/topics`

**응답**:
```json
[
  {
    "category": "경제·생활",
    "keyword": "ETF",
    "description": "주식 투자 시 분산투자 방법",
    "status": "unused"
  },
  ...
]
```

**사용 예시**:
```javascript
const response = await fetch('/api/topics');
const topics = await response.json();
console.log('주제 목록:', topics);
```

## 에러 처리

모든 API는 에러 발생 시 다음 형식으로 응답합니다:

```json
{
  "error": "에러 메시지"
}
```

**HTTP 상태 코드**:
- `200`: 성공
- `400`: 잘못된 요청 (필수 파라미터 누락 등)
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 오류

**에러 처리 예시**:
```javascript
try {
  const response = await fetch('/api/update-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contentId: 1,
      action: 'improve'
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '요청 실패');
  }

  if (data.success) {
    console.log('성공:', data);
  }
} catch (error) {
  console.error('에러:', error.message);
}
```

## React 컴포넌트 예시

```typescript
'use client';

import { useState } from 'react';

export function ContentGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generateContent = async (week?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-weekly-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ week }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('생성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => generateContent()}
        disabled={loading}
      >
        {loading ? '생성 중...' : '주간 콘텐츠 생성'}
      </button>
      {result && (
        <div>
          <p>생성된 콘텐츠 ID: {result.contentIds.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
```






