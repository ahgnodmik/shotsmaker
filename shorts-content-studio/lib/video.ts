import OpenAI from 'openai';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  return new OpenAI({ apiKey });
}

/**
 * FFmpeg 명령어를 안전하게 실행 (배열로 전달)
 */
async function execFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);
    
    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });
    
    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * TTS로 스크립트를 음성 파일로 변환
 */
export async function textToSpeech(
  text: string,
  outputPath: string
): Promise<string> {
  const openai = getOpenAIClient();

  console.log('🎤 음성 생성 중...');

  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // 한국어에 적합한 음성 (alloy, echo, fable, onyx, nova, shimmer)
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.writeFile(outputPath, buffer);

    console.log(`✅ 음성 파일 생성 완료: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('TTS 생성 실패:', error);
    throw error;
  }
}

/**
 * Unsplash에서 키워드로 이미지 검색
 */
export async function getImageFromUnsplash(
  keyword: string,
  outputPath: string
): Promise<string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY가 설정되지 않았습니다.');
  }

  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: keyword,
        per_page: 1,
        orientation: 'portrait', // 세로 영상용
      },
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    const imageUrl = response.data.results[0]?.urls?.regular;
    if (!imageUrl) {
      throw new Error('이미지를 찾을 수 없습니다.');
    }

    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });

    await fs.writeFile(outputPath, imageResponse.data);
    console.log(`✅ 이미지 다운로드 완료: ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error('이미지 다운로드 실패:', error);
    throw error;
  }
}

/**
 * Pexels에서 키워드로 비디오 검색 (단일)
 */
export async function getVideoFromPexels(
  keyword: string,
  outputPath: string
): Promise<string> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    throw new Error('PEXELS_API_KEY가 설정되지 않았습니다.');
  }

  try {
    const response = await axios.get('https://api.pexels.com/videos/search', {
      params: {
        query: keyword,
        per_page: 5, // 여러 개 검색하여 적절한 것 선택
        orientation: 'portrait',
      },
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.data.videos || response.data.videos.length === 0) {
      throw new Error('비디오를 찾을 수 없습니다.');
    }

    // 가장 적합한 비디오 파일 선택 (세로 영상, 적절한 해상도)
    const video = response.data.videos[0];
    const videoFiles = video.video_files || [];
    
    // 세로 영상 중 가장 큰 해상도 선택
    let selectedVideo = videoFiles.find((f: any) => 
      f.quality === 'hd' && f.width && f.height && f.height > f.width
    );
    
    if (!selectedVideo) {
      // HD가 없으면 SD 선택
      selectedVideo = videoFiles.find((f: any) => 
        f.quality === 'sd' && f.width && f.height && f.height > f.width
      );
    }
    
    if (!selectedVideo) {
      // 세로 영상이 없으면 첫 번째 파일 사용
      selectedVideo = videoFiles[0];
    }

    if (!selectedVideo?.link) {
      throw new Error('비디오 URL을 찾을 수 없습니다.');
    }

    console.log(`📥 비디오 다운로드 중: ${selectedVideo.quality || 'unknown'} (${selectedVideo.width}x${selectedVideo.height})`);

    const videoResponse = await axios.get(selectedVideo.link, {
      responseType: 'arraybuffer',
      maxContentLength: 100 * 1024 * 1024, // 100MB 제한
    });

    await fs.writeFile(outputPath, videoResponse.data);
    console.log(`✅ 비디오 다운로드 완료: ${outputPath}`);

    return outputPath;
  } catch (error: any) {
    console.error('비디오 다운로드 실패:', error.message);
    throw error;
  }
}

/**
 * Pexels에서 키워드로 여러 비디오 검색 (3~4개)
 */
export async function getMultipleVideosFromPexels(
  keyword: string,
  count: number = 4,
  tempDir: string
): Promise<string[]> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    throw new Error('PEXELS_API_KEY가 설정되지 않았습니다.');
  }

  try {
    const response = await axios.get('https://api.pexels.com/videos/search', {
      params: {
        query: keyword,
        per_page: Math.max(count, 10), // 충분히 검색
        orientation: 'portrait',
      },
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.data.videos || response.data.videos.length === 0) {
      throw new Error('비디오를 찾을 수 없습니다.');
    }

    const videos = response.data.videos.slice(0, count);
    const videoPaths: string[] = [];

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const videoFiles = video.video_files || [];
      
      // 세로 영상 중 가장 큰 해상도 선택
      let selectedVideo = videoFiles.find((f: any) => 
        f.quality === 'hd' && f.width && f.height && f.height > f.width
      );
      
      if (!selectedVideo) {
        selectedVideo = videoFiles.find((f: any) => 
          f.quality === 'sd' && f.width && f.height && f.height > f.width
        );
      }
      
      if (!selectedVideo) {
        selectedVideo = videoFiles[0];
      }

      if (!selectedVideo?.link) {
        console.log(`⚠️  비디오 ${i + 1}번을 건너뜁니다.`);
        continue;
      }

      const videoPath = path.join(tempDir, `video-part-${i + 1}.mp4`);
      
      console.log(`📥 비디오 ${i + 1}/${videos.length} 다운로드 중...`);

      const videoResponse = await axios.get(selectedVideo.link, {
        responseType: 'arraybuffer',
        maxContentLength: 100 * 1024 * 1024,
      });

      await fs.writeFile(videoPath, videoResponse.data);
      videoPaths.push(videoPath);
    }

    if (videoPaths.length === 0) {
      throw new Error('다운로드할 수 있는 비디오가 없습니다.');
    }

    console.log(`✅ ${videoPaths.length}개의 비디오 다운로드 완료`);
    return videoPaths;
  } catch (error: any) {
    console.error('비디오 다운로드 실패:', error.message);
    throw error;
  }
}

/**
 * 여러 비디오를 하나로 합치기 (음성 길이에 맞춰)
 */
async function concatVideos(
  videoPaths: string[],
  audioDuration: number,
  outputPath: string
): Promise<string> {
  // 각 비디오의 길이 확인
  const videoDurations: number[] = [];
  for (const videoPath of videoPaths) {
    try {
      const { stdout } = await execAsync(
        `ffprobe -i "${videoPath}" -show_entries format=duration -v quiet -of csv="p=0"`
      );
      videoDurations.push(parseFloat(stdout.trim()));
    } catch (error) {
      console.log(`⚠️  비디오 길이 확인 실패, 기본값 사용`);
      videoDurations.push(5); // 기본 5초
    }
  }

  // 음성 길이에 맞춰 비디오를 반복하거나 자르기
  const totalVideoDuration = videoDurations.reduce((a, b) => a + b, 0);
  const repeatCount = Math.ceil(audioDuration / totalVideoDuration);
  
  // concat 파일 생성
  const concatFilePath = outputPath.replace('.mp4', '_concat.txt');
  const concatLines: string[] = [];
  
  // 비디오를 반복하여 추가
  for (let r = 0; r < repeatCount; r++) {
    for (const videoPath of videoPaths) {
      concatLines.push(`file '${videoPath.replace(/'/g, "\\'")}'`);
    }
  }
  
  await fs.writeFile(concatFilePath, concatLines.join('\n'), 'utf-8');

  // 비디오 합치기
  const ffmpegArgs = [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFilePath,
    '-t', audioDuration.toString(), // 음성 길이에 맞춰 자르기
    '-c', 'copy',
    '-y',
    outputPath
  ];

  await execFFmpeg(ffmpegArgs);
  await fs.unlink(concatFilePath).catch(() => {});

  return outputPath;
}

/**
 * FFmpeg를 사용하여 영상 생성
 * 음성 + 이미지/비디오 + 자막
 */
export async function createVideo(options: {
  audioPath: string;
  imagePath?: string;
  videoPath?: string;
  videoPaths?: string[]; // 여러 비디오 경로
  script: string;
  outputPath: string;
  title: string;
}): Promise<string> {
  const { audioPath, imagePath, videoPath, videoPaths, script, outputPath, title } = options;

  // 출력 디렉토리 생성
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // 자막 파일 생성 (ASS 형식 - 정중앙 배치, Pretendard 폰트)
  const subtitlePath = outputPath.replace('.mp4', '.ass');
  await createSubtitleFile(script, subtitlePath, audioPath);

  console.log('🎬 영상 편집 중...');

  try {
    // 자막 파일 경로를 절대 경로로 변환하고 이스케이프
    const absSubtitlePath = path.resolve(subtitlePath).replace(/\\/g, '/');
    // Windows 경로의 콜론과 특수문자 이스케이프
    const escapedSubtitlePath = absSubtitlePath
      .replace(/:/g, '\\:')
      .replace(/'/g, "\\'")
      .replace(/ /g, '\\ ');

    // Pretendard 폰트 경로 확인
    const fontPath = path.resolve(process.cwd(), 'fonts', 'Pretendard-Regular.ttf');
    const fontExists = await fs.access(fontPath).then(() => true).catch(() => false);

    // 여러 비디오가 있으면 합치기
    let finalVideoPath = videoPath;
    if (videoPaths && videoPaths.length > 0) {
      console.log(`🎞️  ${videoPaths.length}개의 비디오를 합치는 중...`);
      const { stdout: durationOutput } = await execAsync(
        `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`
      );
      const audioDuration = parseFloat(durationOutput.trim());
      
      const combinedVideoPath = outputPath.replace('.mp4', '_combined.mp4');
      await concatVideos(videoPaths, audioDuration, combinedVideoPath);
      finalVideoPath = combinedVideoPath;
    }

    // 비디오 소스가 있으면 사용, 없으면 이미지 사용
    if (finalVideoPath) {
      // 비디오 + 음성 + 자막 (정중앙 배치)
      // 필터 체인: scale -> pad -> subtitles (ASS 파일 사용)
      let filterComplex = `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2`;
      
      // Pretendard 폰트 경로 설정 (ASS 파일에서 폰트명 사용, FFmpeg는 시스템 폰트 찾기)
      // 시스템에 Pretendard가 설치되어 있으므로 fontsdir 없이도 작동
      filterComplex += `,subtitles='${escapedSubtitlePath}'`;
      
      const ffmpegArgs = [
        '-i', finalVideoPath,
        '-i', audioPath,
        '-vf', filterComplex,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-shortest',
        '-pix_fmt', 'yuv420p',
        '-y', // 덮어쓰기
        outputPath
      ];

      await execFFmpeg(ffmpegArgs);
      
      // 임시 합친 비디오 삭제
      if (videoPaths && videoPaths.length > 0) {
        await fs.unlink(finalVideoPath).catch(() => {});
      }
    } else if (imagePath) {
      // 이미지 + 음성 + 자막 (이미지를 음성 길이만큼 반복)
      // 먼저 음성 길이 확인
      const { stdout: durationOutput } = await execAsync(
        `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`
      );
      const duration = parseFloat(durationOutput.trim());

      const ffmpegArgs = [
        '-loop', '1',
        '-i', imagePath,
        '-i', audioPath,
        '-vf', 'scale=1080:1920',
        '-c:v', 'libx264',
        '-t', duration.toString(),
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        '-y',
        outputPath
      ];

      await execFFmpeg(ffmpegArgs);
      
      // 자막 추가 (별도 단계)
      console.log('📝 자막 추가 중...');
      const tempVideoPath = outputPath.replace('.mp4', '_temp.mp4');
      await fs.rename(outputPath, tempVideoPath);
      
      // 시스템에 Pretendard가 설치되어 있으므로 fontsdir 없이도 작동
      const subtitleFilter = `subtitles='${escapedSubtitlePath}'`;
      
      const subtitleArgs = [
        '-i', tempVideoPath,
        '-vf', subtitleFilter,
        '-c:a', 'copy',
        '-c:v', 'libx264',
        '-y',
        outputPath
      ];
      
      try {
        await execFFmpeg(subtitleArgs);
        await fs.unlink(tempVideoPath).catch(() => {});
        console.log('✅ 자막 추가 완료');
      } catch (error) {
        // 자막 추가 실패 시 원본 영상 사용
        console.log('⚠️  자막 추가 실패, 자막 없이 영상 생성');
        await fs.rename(tempVideoPath, outputPath).catch(() => {});
      }
    } else {
      throw new Error('이미지 또는 비디오 경로가 필요합니다.');
    }

    console.log(`✅ 영상 생성 완료: ${outputPath}`);

    // 임시 파일 정리
    await fs.unlink(subtitlePath).catch(() => {});

    return outputPath;
  } catch (error) {
    console.error('영상 생성 실패:', error);
    throw error;
  }
}

/**
 * 자막 파일 생성 (ASS 형식 - 정중앙 배치, Pretendard 폰트 16pt)
 */
async function createSubtitleFile(
  script: string,
  outputPath: string,
  audioPath: string
): Promise<void> {
  // 음성 길이 확인
  const { stdout: durationOutput } = await execAsync(
    `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`
  );
  const duration = parseFloat(durationOutput.trim());

  // 스크립트를 문장 단위로 분리
  const sentences = script
    .split(/[.!?。！？]\s*/)
    .filter((s) => s.trim().length > 0);

  // ASS 파일 헤더 (정중앙 배치 스타일, Pretendard 폰트 16pt)
  const assHeader = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Pretendard,16,&Hffffff,&Hffffff,&H000000,&H80000000,1,0,0,0,100,100,0,0,1,2,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // 각 문장을 시간에 맞춰 배치 (정중앙 정렬)
  const subtitleEntries: string[] = [];
  const timePerSentence = duration / sentences.length;

  sentences.forEach((sentence, index) => {
    const startTime = index * timePerSentence;
    const endTime = (index + 1) * timePerSentence;

    // ASS 시간 형식: H:MM:SS.cc
    const startAss = formatTimeASS(startTime);
    const endAss = formatTimeASS(endTime);

    // 정중앙 정렬을 위한 ASS 태그 사용
    subtitleEntries.push(
      `Dialogue: 0,${startAss},${endAss},Default,,0,0,0,,{\\an5}${sentence.trim()}`
    );
  });

  await fs.writeFile(outputPath, assHeader + subtitleEntries.join('\n'), 'utf-8');
}

/**
 * 시간을 ASS 형식으로 변환 (H:MM:SS.cc)
 */
function formatTimeASS(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);

  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

/**
 * 시간을 SRT 형식으로 변환 (HH:MM:SS,mmm)
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * 영상 파일 정보 확인
 */
export async function getVideoInfo(videoPath: string): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
}> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`
    );
    const info = JSON.parse(stdout);

    const videoStream = info.streams.find(
      (s: any) => s.codec_type === 'video'
    );
    const format = info.format;

    return {
      duration: parseFloat(format.duration),
      width: videoStream.width,
      height: videoStream.height,
      size: parseInt(format.size),
    };
  } catch (error) {
    console.error('영상 정보 확인 실패:', error);
    throw error;
  }
}
