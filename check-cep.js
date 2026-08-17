/**
 * check-cep.js - Verifica a instalação do plugin e os caminhos de CEP no Windows
 */

const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA || '';
const cepDir = path.join(appData, 'Adobe', 'CEP', 'extensions');
const pluginDir = path.join(cepDir, 'com.alexascencio.mediadownloader');

console.log('🔍 Verificando status de instalação do MediaDownloader Pro...');
console.log('📂 Diretório CEP:', cepDir);

if (fs.existsSync(pluginDir)) {
    console.log('✅ Extensão instalada em:', pluginDir);
    const manifestPath = path.join(pluginDir, 'CSXS', 'manifest.xml');
    if (fs.existsSync(manifestPath)) {
        console.log('✅ CSXS/manifest.xml encontrado.');
    } else {
        console.warn('⚠️ CSXS/manifest.xml NÃO encontrado.');
    }
} else {
    console.log('ℹ️ Extensão ainda não copiada para %APPDATA%/Adobe/CEP/extensions. Execute Instalar-Windows.bat para instalar.');
}
