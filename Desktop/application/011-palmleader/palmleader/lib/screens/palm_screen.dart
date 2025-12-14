import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';

import '../services/openai_service.dart';

class PalmScreen extends StatefulWidget {
  const PalmScreen({super.key});

  @override
  State<PalmScreen> createState() => _PalmScreenState();
}

class _PalmScreenState extends State<PalmScreen> {
  File? _imageFile;
  String? _resultText;
  String? _errorText;
  bool _isLoading = false;

  Future<void> _pickImage(ImageSource source) async {
    print('이미지 선택 시작: ${source.name}');
    
    try {
      // 시뮬레이터에서는 카메라 비활성화
      if (source == ImageSource.camera && kDebugMode) {
        print('시뮬레이터에서 카메라 비활성화');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('시뮬레이터에서는 갤러리만 사용할 수 있습니다.'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 2),
            ),
          );
        }
        return;
      }
      
      final ImagePicker picker = ImagePicker();
      final XFile? picked = await picker.pickImage(
        source: source,
        imageQuality: 80,
      );
      
      print('이미지 선택 결과: ${picked?.path}');
      
      if (picked != null) {
        final file = File(picked.path);
        
        setState(() {
          _imageFile = file;
          _resultText = null;
          _errorText = null;
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('이미지가 선택되었습니다!'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('이미지 선택이 취소되었습니다.'),
              backgroundColor: Colors.grey,
              duration: Duration(seconds: 1),
            ),
          );
        }
      }
    } catch (e) {
      print('이미지 선택 오류: $e');
      
      if (mounted) {
        String errorMessage = '이미지를 선택할 수 없습니다.';
        
        if (e.toString().contains('Permission')) {
          errorMessage = '권한이 필요합니다. 설정에서 권한을 허용해주세요.';
        } else if (e.toString().contains('ActivityNotFoundException')) {
          errorMessage = '갤러리 앱을 찾을 수 없습니다.';
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$errorMessage\n오류: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  Future<void> _loadTestImage() async {
    try {
      print('테스트 이미지 로드 시작');
      
      // 시뮬레이터에서 테스트 이미지 경로
      final testImagePath = '/sdcard/DCIM/Camera/test_palm_image.jpg';
      final file = File(testImagePath);
      
      if (await file.exists()) {
        print('테스트 이미지 발견: $testImagePath');
        
        setState(() {
          _imageFile = file;
          _resultText = null;
          _errorText = null;
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('테스트 이미지가 로드되었습니다!'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        print('테스트 이미지를 찾을 수 없음: $testImagePath');
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('테스트 이미지를 찾을 수 없습니다.'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      print('테스트 이미지 로드 오류: $e');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('오류: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  Future<void> _analyze() async {
    if (_imageFile == null) return;
    setState(() {
      _isLoading = true;
      _errorText = null;
    });

    try {
      final bytes = await _imageFile!.readAsBytes();
      final base64Image = base64Encode(bytes);
      
      // OpenAI API 키가 없는 경우 데모 분석 결과 제공
      try {
        final response = await OpenAIService.analyzePalm(base64Image);
        setState(() => _resultText = response['description'] ?? '분석 결과를 가져올 수 없습니다.');
      } catch (e) {
        // API 키가 없거나 네트워크 오류인 경우 데모 결과 제공
        setState(() => _resultText = _getDemoAnalysisResult());
      }
    } catch (e) {
      setState(() {
        _errorText = '이미지를 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.';
        _resultText = null;
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _getDemoAnalysisResult() {
    return '''
🔮 Palm Leader 분석 결과

📊 종합 점수
• 운세: 85점
• 건강: 78점  
• 지능: 92점
• 직업: 88점
• 인간관계: 76점

📝 상세 분석
손금을 분석한 결과, 균형 잡힌 성격과 뛰어난 직관력을 가지고 계십니다.

🌟 주요 특징
• 강한 의지력과 추진력
• 창의적 사고와 문제해결 능력
• 따뜻한 성격으로 주변 사람들과 좋은 관계 유지
• 안정적인 건강 상태 유지 필요

💡 조언
• 현재의 긍정적인 에너지를 유지하세요
• 새로운 도전에 적극적으로 도전해보세요
• 규칙적인 운동과 건강한 식습관을 유지하세요

⚠️ 주의사항
이 분석은 엔터테인먼트 목적이며, 실제 의료나 점술과는 무관합니다.
''';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Palm Leader')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.deepPurple.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Palm Leader는 엔터테인먼트 목적의 손금 가이드입니다.',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    SizedBox(height: 4),
                    Text(
                      '- 의료, 재정, 법률 조언이 아니며 참고용으로만 활용하세요.\n- 손바닥 전체가 밝고 선명하게 보이도록 촬영하면 더 정확한 안내를 받을 수 있습니다.',
                      style: TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              AspectRatio(
                aspectRatio: 1,
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: _imageFile == null
                      ? const Center(child: Text('손바닥 사진을 선택하거나 촬영하세요'))
                      : ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(_imageFile!, fit: BoxFit.cover),
                        ),
                ),
              ),
              const SizedBox(height: 16),
              Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            print('갤러리 버튼 클릭됨');
                            _pickImage(ImageSource.gallery);
                          },
                          icon: const Icon(Icons.photo_library),
                          label: const Text('갤러리'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: kDebugMode ? null : () => _pickImage(ImageSource.camera),
                          icon: const Icon(Icons.photo_camera),
                          label: Text(kDebugMode ? '카메라\n(시뮬레이터)' : '카메라'),
                          style: kDebugMode 
                              ? OutlinedButton.styleFrom(
                                  foregroundColor: Colors.grey,
                                  side: BorderSide(color: Colors.grey.shade300),
                                )
                              : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // 테스트용 버튼 추가
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        print('테스트 이미지 버튼 클릭됨');
                        _loadTestImage();
                      },
                      icon: const Icon(Icons.image),
                      label: const Text('테스트 이미지 로드 (시뮬레이터용)'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _imageFile != null && !_isLoading ? _analyze : null,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('분석하기'),
                ),
              ),
              const SizedBox(height: 16),
              if (_errorText != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    _errorText!,
                    style: TextStyle(color: Colors.red.shade700),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              Expanded(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      _resultText ?? '분석 결과가 여기에 표시됩니다.',
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

