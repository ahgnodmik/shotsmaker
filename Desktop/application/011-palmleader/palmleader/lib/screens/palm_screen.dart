import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

import '../services/openai_service.dart';

class PalmScreen extends StatefulWidget {
  const PalmScreen({super.key});

  @override
  State<PalmScreen> createState() => _PalmScreenState();
}

class _PalmScreenState extends State<PalmScreen> {
  File? _imageFile;
  String? _resultText;
  bool _isLoading = false;

  Future<void> _pickImage(ImageSource source) async {
    if (source == ImageSource.camera) {
      final status = await Permission.camera.request();
      if (!status.isGranted) return;
    }

    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, imageQuality: 85);
    if (picked == null) return;
    setState(() {
      _imageFile = File(picked.path);
      _resultText = null;
    });
  }

  Future<void> _analyze() async {
    if (_imageFile == null) return;
    setState(() => _isLoading = true);
    try {
      final bytes = await _imageFile!.readAsBytes();
      final base64Image = base64Encode(bytes);
      final response = await OpenAIService.analyzePalm(base64Image);
      setState(() => _resultText = response);
    } catch (e) {
      setState(() => _resultText = 'Error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Palm Leader')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
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
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library),
                    label: const Text('갤러리'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.camera),
                    icon: const Icon(Icons.photo_camera),
                    label: const Text('카메라'),
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
    );
  }
}


