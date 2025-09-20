import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

class OpenAIService {
  static final String _apiKey = dotenv.get('OPENAI_API_KEY', fallback: '');
  static final String _baseUrl = dotenv.get('OPENAI_BASE_URL', fallback: 'https://api.openai.com/v1');
  static final String _model = dotenv.get('OPENAI_VISION_MODEL', fallback: 'gpt-4o-mini');

  static Future<String> analyzePalm(String base64Image) async {
    if (_apiKey.isEmpty) {
      throw Exception('OPENAI_API_KEY is missing');
    }

    final uri = Uri.parse('$_baseUrl/chat/completions');
    final headers = {
      'Authorization': 'Bearer $_apiKey',
      'Content-Type': 'application/json',
    };

    final prompt =
        'You are a professional palmistry assistant. Analyze the hand palm lines (life, head, heart, fate) from the provided image. Provide concise insights in Korean, in bullet points, and include a short disclaimer that this is for entertainment only. If the photo is unclear, ask for a clearer palm photo.';

    final body = {
      'model': _model,
      'messages': [
        {
          'role': 'user',
          'content': [
            {'type': 'text', 'text': prompt},
            {
              'type': 'image_url',
              'image_url': {
                'url': 'data:image/jpeg;base64,$base64Image',
              }
            }
          ]
        }
      ],
      'temperature': 0.7
    };

    final response = await http.post(uri, headers: headers, body: jsonEncode(body));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final choices = data['choices'] as List<dynamic>?;
      if (choices == null || choices.isEmpty) {
        throw Exception('No response');
      }
      final msg = choices.first['message'] as Map<String, dynamic>;
      final content = msg['content'];
      return content is String ? content : (content?['text'] ?? '');
    } else {
      throw Exception('OpenAI error ${response.statusCode}: ${response.body}');
    }
  }
}


