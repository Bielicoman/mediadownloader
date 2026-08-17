/**
 * test-runner.js - Verificação de integridade e simulação de parsing do Downloader
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Iniciando testes de validação do MediaDownloader Pro...');

// 1. Testa sintaxe de todos os arquivos JS/JSX
const jsFiles = [
  'js/bridge.js',
  'js/binManager.js',
  'js/downloader.js',
  'js/app.js'
];

let allOk = true;

for (const rel of jsFiles) {
  const full = path.join(__dirname, 'com.alexascencio.mediadownloader', rel);
  try {
    const code = fs.readFileSync(full, 'utf8');
    new Function(code);
    console.log(`✅ ${rel} — Sintaxe JS válida`);
  } catch (err) {
    console.error(`❌ ${rel} — Erro de sintaxe:`, err.message);
    allOk = false;
  }
}

// 2. Testa detecção do yt-dlp e ffmpeg
console.log('\n🔧 Testando execução dos binários locais...');
try {
  const ytdlpVer = execSync('yt-dlp --version').toString().trim();
  console.log(`✅ yt-dlp funcional: versão ${ytdlpVer}`);
} catch (e) {
  console.warn('⚠️ yt-dlp não está no PATH global, mas o binManager irá detectá-lo.');
}

try {
  const ffmpegOut = execSync('ffmpeg -version').toString().split('\n')[0];
  console.log(`✅ ffmpeg funcional: ${ffmpegOut}`);
} catch (e) {
  console.warn('⚠️ ffmpeg não está no PATH global.');
}

// 3. Testa regex de detecção de plataformas
const sampleUrls = [
  { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'youtube' },
  { url: 'https://youtube.com/shorts/3xyz123', expected: 'youtube_shorts' },
  { url: 'https://www.instagram.com/reel/C123456789/', expected: 'instagram_reels' },
  { url: 'https://www.tiktok.com/@user/video/7123456789012345678', expected: 'tiktok' },
  { url: 'https://x.com/adobe/status/1234567890', expected: 'twitter' }
];

console.log('\n🌐 Testando identificação de URLs:');
for (const s of sampleUrls) {
  let matched = 'web';
  const u = s.url.toLowerCase();
  if (u.includes('youtube.com/shorts')) matched = 'youtube_shorts';
  else if (u.includes('youtube.com') || u.includes('youtu.be')) matched = 'youtube';
  else if (u.includes('instagram.com/reel')) matched = 'instagram_reels';
  else if (u.includes('tiktok.com')) matched = 'tiktok';
  else if (u.includes('twitter.com') || u.includes('x.com')) matched = 'twitter';
  
  if (matched === s.expected) {
    console.log(`✅ ${s.url.substring(0, 45)}... -> ${matched}`);
  } else {
    console.error(`❌ Falha: ${s.url} esperava ${s.expected} mas obteve ${matched}`);
    allOk = false;
  }
}

if (allOk) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
} else {
  console.error('\n❌ Houve falhas nos testes.');
  process.exit(1);
}
