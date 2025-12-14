import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

class OpenAIService {
  static final String _apiKey = dotenv.get('OPENAI_API_KEY', fallback: '');
  static final String _baseUrl =
      dotenv.get('OPENAI_BASE_URL', fallback: 'https://api.openai.com/v1');
  static final String _model =
      dotenv.get('OPENAI_VISION_MODEL', fallback: 'gpt-4o-mini');

  static Future<Map<String, dynamic>> analyzePalm(String base64Image) async {
    if (_apiKey.isEmpty) {
      throw Exception('OPENAI_API_KEY is missing');
    }

    final uri = Uri.parse('$_baseUrl/chat/completions');
    final headers = {
      'Authorization': 'Bearer $_apiKey',
      'Content-Type': 'application/json',
    };

    const systemPrompt = '''
당신은 "Palm Leader"라는 전문 손금 분석가입니다. 
사용자가 업로드한 손금 사진을 분석하여 통계적이고 과학적인 근거를 바탕으로 상세한 분석을 제공해야 합니다.

분석 시 다음 사항을 고려하세요:
1. 손의 방향 (왼손/오른손) 식별
2. 주요 손금선들의 길이, 깊이, 방향, 연결성
3. 손금의 패턴과 특징
4. 손의 형태와 크기
5. 손금의 색상과 질감
6. 통계적 데이터를 바탕으로 한 점수 산정

분석 결과는 JSON 형식으로 제공하며, 다음 구조를 따라주세요:
{
  "handType": "left" 또는 "right",
  "description": "전체적인 손금 분석 설명",
  "tags": ["태그1", "태그2", "태그3"],
  "statistics": {
    "fortune": {
      "score": 0-100,
      "description": "운세 분석 설명",
      "indicators": ["지표1", "지표2"]
    },
    "life": {
      "score": 0-100,
      "description": "수명/건강 분석 설명",
      "healthIndicators": ["건강지표1", "건강지표2"],
      "longevity": "장수 관련 분석"
    },
    "intelligence": {
      "score": 0-100,
      "description": "총명함/지능 분석 설명",
      "mentalIndicators": ["정신지표1", "정신지표2"],
      "wisdom": "지혜 관련 분석"
    },
    "career": {
      "score": 0-100,
      "description": "직업/성공 분석 설명",
      "careerIndicators": ["직업지표1", "직업지표2"],
      "potential": "잠재력 분석"
    },
    "relationship": {
      "score": 0-100,
      "description": "인간관계/사랑 분석 설명",
      "relationshipIndicators": ["관계지표1", "관계지표2"],
      "compatibility": "궁합 분석"
    }
  },
  "lines": [
    {
      "name": "생명선",
      "description": "생명선 설명",
      "quality": "strong/weak/broken/forked",
      "meaning": "의미",
      "length": 0-100
    }
  ],
  "guidance": "종합적인 조언과 가이드"
}

점수는 0-100 범위에서 산정하며, 통계적 근거를 바탕으로 객관적으로 평가해주세요.
''';

    final body = {
      'model': _model,
      'messages': [
        {
          'role': 'system',
          'content': [
            {'type': 'text', 'text': systemPrompt},
          ]
        },
        {
          'role': 'user',
          'content': [
            {
              'type': 'text',
              'text': '손금 사진을 분석해 주세요. 특히 운, 수명, 총명함, 직업, 인간관계에 대한 점수와 분석을 포함해주세요.',
            },
            {
              'type': 'image_url',
              'image_url': {
                'url': 'data:image/jpeg;base64,$base64Image',
                'detail': 'high',
              }
            }
          ]
        }
      ],
      'temperature': 0.7,
      'max_tokens': 3000,
    };

    final response = await http.post(uri, headers: headers, body: jsonEncode(body));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('OpenAI error ${response.statusCode}: ${response.body}');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final choices = data['choices'] as List<dynamic>?;
    if (choices == null || choices.isEmpty) {
      throw Exception('No response');
    }

    final message = choices.first['message'] as Map<String, dynamic>?;
    if (message == null) {
      throw Exception('Empty message');
    }

    final content = message['content'];
    String textContent = '';
    
    if (content is String) {
      textContent = content.trim();
    } else if (content is List) {
      final buffer = StringBuffer();
      for (final part in content) {
        if (part is Map && part['type'] == 'text') {
          buffer.write(part['text'] ?? '');
        }
      }
      textContent = buffer.toString().trim();
    }

    if (textContent.isEmpty) {
      throw Exception('응답을 파싱하지 못했습니다.');
    }

    // JSON 파싱 시도
    try {
      final jsonData = jsonDecode(textContent);
      return jsonData;
    } catch (e) {
      // JSON 파싱 실패 시 기본 구조로 반환
      return {
        'description': textContent,
        'tags': ['분석완료'],
        'statistics': {
          'fortune': {'score': 50, 'description': '분석 중', 'indicators': []},
          'life': {'score': 50, 'description': '분석 중', 'healthIndicators': [], 'longevity': ''},
          'intelligence': {'score': 50, 'description': '분석 중', 'mentalIndicators': [], 'wisdom': ''},
          'career': {'score': 50, 'description': '분석 중', 'careerIndicators': [], 'potential': ''},
          'relationship': {'score': 50, 'description': '분석 중', 'relationshipIndicators': [], 'compatibility': ''},
        },
        'lines': [],
        'guidance': '분석 결과를 처리하는 중입니다.',
        'handType': 'unknown',
      };
    }
  }
}

