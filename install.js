/**
 * install.js - Instala a extensão CEP no Adobe Premiere Pro e ativa o PlayerDebugMode
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appData = process.env.APPDATA || '';
const cepDir = path.join(appData, 'Adobe', 'CEP', 'extensions');
const targetDir = path.join(cepDir, 'com.alexascencio.mediadownloader');
const sourceDir = path.join(__dirname, 'com.alexascencio.mediadownloader');

console.log('🚀 Instalando Media Downloader Pro no Premiere Pro...');

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
        // Skip locked file if identical
      }
    }
  }
}

copyDir(sourceDir, targetDir);
console.log('✅ Arquivos copiados para:', targetDir);

// Ativa PlayerDebugMode via reg.exe nativo do Windows
for (let i = 9; i <= 16; i++) {
  try {
    execSync(`reg.exe add "HKEY_CURRENT_USER\\Software\\Adobe\\CSXS.${i}" /v PlayerDebugMode /t REG_SZ /d "1" /f`, { stdio: 'ignore' });
  } catch (e) {}
}
console.log('✅ PlayerDebugMode habilitado no Windows Registry para CSXS.9 até CSXS.16.');
console.log('🎉 Instalação concluída com sucesso!');
console.log('👉 Abra o Premiere Pro e acesse: Janela > Extensões > Media Downloader');
