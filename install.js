/**
 * install.js - Desinstalação Limpa e Instalação a partir do pacote ZXP/ZIP no Premiere Pro
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appData = process.env.APPDATA || '';
const cepDir = path.join(appData, 'Adobe', 'CEP', 'extensions');
const targetDir = path.join(cepDir, 'com.alexascencio.mediadownloader');
const sourceDir = path.join(__dirname, 'com.alexascencio.mediadownloader');

console.log('🔄 Desinstalando versão anterior do Media Downloader...');

// 1. Limpeza / Desinstalação completa
try {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    console.log('🗑️ Versão anterior desinstalada com sucesso!');
  }
} catch (e) {
  console.log('⚠️ Aviso ao limpar diretório:', e.message);
}

console.log('🚀 Instalando Media Downloader a partir do pacote no Premiere Pro...');

if (!fs.existsSync(cepDir)) {
  fs.mkdirSync(cepDir, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (e) {
        console.error('Erro ao copiar', srcPath, e.message);
      }
    }
  }
}

copyDir(sourceDir, targetDir);
console.log('✅ Arquivos instalados em:', targetDir);

// Ativa PlayerDebugMode via reg.exe nativo do Windows
for (let i = 9; i <= 16; i++) {
  try {
    execSync(`reg.exe add "HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.${i}" /v PlayerDebugMode /t REG_SZ /d "1" /f`, { stdio: 'ignore' });
  } catch (e) {}
}
console.log('✅ PlayerDebugMode habilitado no Windows Registry (CSXS.9 a CSXS.16).');
console.log('🎉 Instalação concluída com sucesso!');
console.log('👉 Abra o Premiere Pro e acesse: Janela > Extensões > Media Downloader');
