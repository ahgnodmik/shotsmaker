import OpenAI from 'openai';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  return new OpenAI({
    apiKey,
});
}

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * "그거 모르죠? 내가 알려줌" 스타일 주제 생성
 */
export async function generateTopics(
  category: string,
  count: number = 10
): Promise<Array<{ keyword: string; description: string }>> {
  const prompt = `
당신은 "그거 모르죠? 내가 알려줌" 스타일의 유튜브 숏츠 주제를 생성하는 전문가입니다.

카테고리: ${category}
생성 개수: ${count}개

요구사항:
1. 한국어로 작성
2. 각 주제는 대부분의 사람들이 모를 수 있는 실용적인 정보여야 함
3. 60초 이내로 설명 가능한 내용
4. "이거 진짜 모르는 사람 많습니다" 스타일로 끌어당기는 주제

각 주제는 다음 형식으로 제공하세요:
- 키워드: 한 단어 또는 짧은 구 (예: ETF, 라우터, 4대보험)
- 설명: 한 줄 설명 (예: 주식 투자 시 분산투자 방법)

JSON 형식으로 응답:
[
  {
    "keyword": "주제 키워드",
    "description": "한 줄 설명"
  },
  ...
]
`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            '당신은 유튜브 숏츠 주제를 생성하는 전문가입니다. 항상 JSON 형식으로만 응답하세요.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('응답이 없습니다.');

    const parsed = JSON.parse(content);
    
    // 응답이 객체인 경우 topics 키를 확인
    if (parsed.topics && Array.isArray(parsed.topics)) {
      return parsed.topics;
    }
    
    // 배열인 경우 그대로 반환
    if (Array.isArray(parsed)) {
      return parsed;
    }

    throw new Error('예상하지 못한 응답 형식입니다.');
  } catch (error) {
    console.error('주제 생성 실패:', error);
    throw error;
  }
}

/**
 * 숏츠 콘텐츠 전체 생성 (제목, 설명, 스크립트, 해시태그)
 */
export interface GeneratedContent {
  title: string;
  titleAlternatives: string[]; // 3안
  description: string;
  hashtags: string[];
  script: string;
  hook: string;
}

export async function generateShortsContent(
  keyword: string,
  trendKeyword?: string
): Promise<GeneratedContent> {
  const trendContext = trendKeyword
    ? `\n참고: 이번 주 트렌드 키워드는 "${trendKeyword}"입니다. 이와 연관지어 작성하면 좋습니다.`
    : '';

  const prompt = `
당신은 "그거 모르죠? 내가 알려줌" 스타일의 유튜브 숏츠 콘텐츠를 생성하는 전문가입니다.

주제 키워드: ${keyword}${trendContext}

**중요: 모든 정보는 정확하고 검증 가능한 사실만 사용하세요. 추측이나 불확실한 정보는 포함하지 마세요.**

톤앤매너:
- 약간 장난스럽지만 정보는 100% 정확하게
- 친근하고 편안한 말투
- "이거 진짜 모르는 사람 많습니다" 같은 강한 훅
- 실제 통계, 법률, 규정 등 구체적인 정보 제공

포맷:
1. Hook: "이거, 진짜 모르는 사람 많습니다." 스타일의 첫 문장
2. 본문: 
   - 정확한 개념 설명 (3-4줄)
   - 구체적인 예시 1개 (실제 사례나 숫자 포함)
   - 실용적인 팁이나 주의사항
3. 마무리: "이제 아는 사람 됐음 ㅇㅇ" 느낌

요구사항:
- 60초 이내로 읽을 수 있는 스크립트 (약 200-250자)
- 모든 정보는 정확하고 검증 가능해야 함
- 구체적인 숫자, 법률 조항, 규정 등 포함 가능
- YouTube 제목 3안 제공
- 설명란 텍스트 (1문단, 100-150자)
- 해시태그 8-12개 (한글+영문 혼합)

JSON 형식으로 응답:
{
  "title": "최종 추천 제목",
  "titleAlternatives": ["제목 2안", "제목 3안"],
  "description": "YouTube 설명란 텍스트",
  "hashtags": ["#해시태그1", "#해시태그2", ...],
  "script": "전체 스크립트 텍스트 (Hook + 본문 + 마무리)",
  "hook": "첫 문장 훅"
}
`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            '당신은 유튜브 숏츠 콘텐츠를 생성하는 전문가입니다. 항상 JSON 형식으로만 응답하세요.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('응답이 없습니다.');

    const parsed = JSON.parse(content) as GeneratedContent;
    
    // 해시태그가 문자열인 경우 배열로 변환
    const hashtagsValue = (parsed as any).hashtags;
    if (typeof hashtagsValue === 'string') {
      (parsed as any).hashtags = hashtagsValue.split(',').map((h: string) => h.trim());
    }

    return parsed;
  } catch (error) {
    console.error('콘텐츠 생성 실패:', error);
    throw error;
  }
}

/**
 * 콘텐츠 정확성 검증 결과
 */
export interface VerificationResult {
  isValid: boolean; // 검증 통과 여부
  confidence: 'high' | 'medium' | 'low'; // 신뢰도
  issues: string[]; // 발견된 문제점 목록
  warnings: string[]; // 경고 사항 목록
  suggestions: string[]; // 개선 제안
  verifiedFacts: string[]; // 검증된 사실 목록
}

/**
 * 생성된 콘텐츠의 정확성을 검증
 * 특히 금융, 법률, 의료 등 민감한 주제에 대해 엄격하게 검증
 */
export async function verifyContentAccuracy(
  keyword: string,
  script: string,
  title: string
): Promise<VerificationResult> {
  // 민감한 주제 키워드 목록
  const sensitiveKeywords = [
    '신용카드', '카드', '포인트', '적립', '할인',
    '금리', '이자', '대출', '예금', '적금',
    '세금', '소득공제', '공제', '환급',
    '법률', '규정', '법', '조항',
    '의료', '건강', '질병', '치료',
    '투자', '주식', '부동산', '재테크',
  ];

  const isSensitive = sensitiveKeywords.some((sk) => 
    keyword.includes(sk) || script.includes(sk) || title.includes(sk)
  );

  const sensitivityLevel = isSensitive 
    ? '매우 높음 (금융/법률/의료 등 민감한 주제입니다. 모든 정보는 반드시 검증 가능한 사실이어야 합니다.)'
    : '보통';

  const prompt = `
당신은 콘텐츠 정확성 검증 전문가입니다. 생성된 유튜브 숏츠 스크립트의 사실 여부를 엄격하게 검증하세요.

주제 키워드: ${keyword}
제목: ${title}
민감도: ${sensitivityLevel}

검증할 스크립트:
"""
${script}
"""

검증 기준:
1. **사실 확인**: 모든 주장이 검증 가능한 사실인가?
2. **통계/숫자**: 언급된 통계, 비율, 금액이 정확한가?
3. **법률/규정**: 법률 조항, 규정, 정책이 정확히 언급되었는가?
4. **일반적인 오해**: 널리 퍼진 오해나 잘못된 정보가 포함되어 있지 않은가?
5. **과장/왜곡**: 정보가 과장되거나 왜곡되지 않았는가?
6. **최신성**: 정보가 최신인가? (특히 법률, 정책, 금리 등)
7. **출처 가능성**: 신뢰할 수 있는 출처에서 확인 가능한 정보인가?

${isSensitive ? `
⚠️ **특별 주의사항 (민감한 주제)**:
- 금융 정보: 모든 금액, 비율, 수수료는 정확해야 함
- 법률 정보: 법률 조항 번호, 규정 내용이 정확해야 함
- 정책 정보: 최신 정책 내용과 일치해야 함
- 가짜 정보나 추측은 절대 허용되지 않음
` : ''}

JSON 형식으로 응답:
{
  "isValid": true/false,  // 검증 통과 여부 (false면 영상 생성 중단 권장)
  "confidence": "high"/"medium"/"low",  // 검증 신뢰도
  "issues": [
    "구체적인 문제점 1",
    "구체적인 문제점 2"
  ],  // 발견된 심각한 문제점 (없으면 빈 배열)
  "warnings": [
    "경고 사항 1",
    "경고 사항 2"
  ],  // 주의가 필요한 사항 (없으면 빈 배열)
  "suggestions": [
    "개선 제안 1",
    "개선 제안 2"
  ],  // 개선 제안 (없으면 빈 배열)
  "verifiedFacts": [
    "검증된 사실 1",
    "검증된 사실 2"
  ]  // 검증된 사실 목록
}

중요:
- isValid가 false인 경우: 심각한 오류가 있어 영상 생성을 중단해야 함
- issues가 있으면 반드시 isValid를 false로 설정
- 모든 정보는 객관적이고 검증 가능해야 함
- 추측이나 불확실한 정보는 issues로 표시
`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            '당신은 콘텐츠 정확성 검증 전문가입니다. 매우 엄격하게 검증하고, 모든 문제점을 정확히 지적하세요. 항상 JSON 형식으로만 응답하세요.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // 더 정확한 검증을 위해 낮은 temperature
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('검증 응답이 없습니다.');

    const parsed = JSON.parse(content) as VerificationResult;

    // 배열 필드가 문자열인 경우 배열로 변환
    const parsedAny = parsed as any;
    if (typeof parsedAny.issues === 'string') {
      parsedAny.issues = parsedAny.issues.split(',').map((i: string) => i.trim());
    }
    if (typeof parsedAny.warnings === 'string') {
      parsedAny.warnings = parsedAny.warnings.split(',').map((w: string) => w.trim());
    }
    if (typeof parsedAny.suggestions === 'string') {
      parsedAny.suggestions = parsedAny.suggestions.split(',').map((s: string) => s.trim());
    }
    if (typeof parsedAny.verifiedFacts === 'string') {
      parsedAny.verifiedFacts = parsedAny.verifiedFacts.split(',').map((f: string) => f.trim());
    }

    return parsed;
  } catch (error) {
    console.error('콘텐츠 검증 실패:', error);
    // 검증 실패 시 안전하게 처리: 검증 실패로 간주
    return {
      isValid: false,
      confidence: 'low',
      issues: ['검증 프로세스 오류가 발생했습니다. 수동 검토가 필요합니다.'],
      warnings: [],
      suggestions: [],
      verifiedFacts: [],
    };
  }
}

/**
 * 검증 결과를 바탕으로 스크립트를 개선
 * 거짓 정보를 정확한 정보로 수정
 */
export async function improveContentScript(
  keyword: string,
  originalScript: string,
  title: string,
  verificationResult: VerificationResult
): Promise<{
  improvedScript: string;
  improvedTitle?: string;
  improvedDescription?: string;
  changes: string[]; // 변경 사항 설명
}> {
  const prompt = `
당신은 콘텐츠 개선 전문가입니다. 검증 결과를 바탕으로 스크립트를 정확하고 신뢰할 수 있는 정보로 개선하세요.

주제 키워드: ${keyword}
원본 제목: ${title}

원본 스크립트:
"""
${originalScript}
"""

검증 결과:
- 검증 상태: ${verificationResult.isValid ? '통과' : '실패'}
- 신뢰도: ${verificationResult.confidence}
- 발견된 문제점: ${verificationResult.issues.join('; ')}
- 경고 사항: ${verificationResult.warnings.join('; ')}
- 개선 제안: ${verificationResult.suggestions.join('; ')}
- 검증된 사실: ${verificationResult.verifiedFacts.join('; ')}

**중요 지침:**
1. 모든 거짓 정보나 불확실한 정보를 정확하고 검증 가능한 사실로 수정하세요.
2. 검증 결과의 문제점과 개선 제안을 반드시 반영하세요.
3. 검증된 사실은 그대로 유지하세요.
4. 톤앤매너는 원본과 유사하게 유지하되, 정보는 100% 정확해야 합니다.
5. 구체적인 숫자, 법률 조항, 규정 등은 정확하게 명시하세요.
6. 추측이나 일반화된 주장은 피하고, 구체적이고 검증 가능한 정보로 대체하세요.
7. 원본의 길이와 구조를 최대한 유지하세요 (약 200-250자).

JSON 형식으로 응답:
{
  "improvedScript": "개선된 전체 스크립트",
  "improvedTitle": "개선된 제목 (필요시)",
  "improvedDescription": "개선된 설명 (필요시)",
  "changes": [
    "변경 사항 1: 구체적으로 어떤 부분을 어떻게 수정했는지",
    "변경 사항 2: ..."
  ]
}
`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            '당신은 콘텐츠 개선 전문가입니다. 검증 결과를 바탕으로 정확하고 신뢰할 수 있는 정보로 스크립트를 개선하세요. 항상 JSON 형식으로만 응답하세요.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7, // 창의성과 정확성의 균형
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('개선 응답이 없습니다.');

    const parsed = JSON.parse(content) as {
      improvedScript: string;
      improvedTitle?: string;
      improvedDescription?: string;
      changes: string[];
    };

    // changes가 문자열인 경우 배열로 변환
    const parsedAny = parsed as any;
    if (typeof parsedAny.changes === 'string') {
      parsedAny.changes = parsedAny.changes.split(',').map((c: string) => c.trim());
    }

    return {
      improvedScript: parsed.improvedScript,
      improvedTitle: parsed.improvedTitle,
      improvedDescription: parsed.improvedDescription,
      changes: parsed.changes || [],
    };
  } catch (error) {
    console.error('스크립트 개선 실패:', error);
    throw error;
  }
}

