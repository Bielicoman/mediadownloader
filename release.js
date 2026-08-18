/**
 * Media Downloader — Master ZXP Version Bump & Release Engine
 * (C) 2026 Alex Ascencio.
 *
 * Usage:
 *   node release.js <new_version> ["Changelog item 1"] ["Changelog item 2"]
 * Example:
 *   node release.js 1.0.1 "Download acelerado com suporte a shorts" "Compatibilidade Premiere 2026"
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const newVersion = args[0];
const customChangelog = args.slice(1);

if (!newVersion) {
    console.error('❌ Erro: Por favor informe a nova versão. Exemplo: node release.js 1.0.1');
    process.exit(1);
}

const PLUGIN_ID = 'com.alexascencio.mediadownloader';
const PLUGIN_NAME = 'Media Downloader';
const ROOT_DIR = __dirname;
const EXT_DIR = path.join(ROOT_DIR, PLUGIN_ID);
const WEB_DIR = path.join(ROOT_DIR, 'website');
const DL_DIR = path.join(ROOT_DIR, 'downloads');
const WEB_DL_DIR = path.join(WEB_DIR, 'downloads');

console.log(`\n======================================================`);
console.log(`🚀 INICIANDO RELEASE ZXP: ${PLUGIN_NAME} v${newVersion}`);
console.log(`======================================================\n`);

// 1. Atualizar version.json (Raiz)
const versionJsonPath = path.join(ROOT_DIR, 'version.json');
let versionData = {};
if (fs.existsSync(versionJsonPath)) {
    versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
}

const prevVersion = versionData.version || '1.0.0';
versionData.pluginId = PLUGIN_ID;
versionData.name = PLUGIN_NAME;
versionData.version = newVersion;
versionData.fullName = `${PLUGIN_NAME} ${newVersion}`;
versionData.releaseDate = new Date().toISOString().split('T')[0];
versionData.downloadUrl = `https://raw.githubusercontent.com/Bielicoman/mediadownloader/main/MediaDownloader.zxp`;

if (customChangelog.length > 0) {
    versionData.changelog = customChangelog;
}

const versionJsonContent = JSON.stringify(versionData, null, 2);
fs.writeFileSync(versionJsonPath, versionJsonContent, 'utf8');
console.log(`✓ [1/5] version.json atualizado na raiz (v${prevVersion} -> v${newVersion})`);

// 2. Sincronizar version.json no Website e no Extension Folder
const webVersionJsonPath = path.join(WEB_DIR, 'version.json');
fs.writeFileSync(webVersionJsonPath, versionJsonContent, 'utf8');

const extVersionJsonPath = path.join(EXT_DIR, 'version.json');
fs.writeFileSync(extVersionJsonPath, versionJsonContent, 'utf8');
console.log(`✓ [2/5] version.json sincronizado no /website e na pasta da extensão CEP`);

// 3. Atualizar CSXS/manifest.xml
const manifestPath = path.join(EXT_DIR, 'CSXS', 'manifest.xml');
if (fs.existsSync(manifestPath)) {
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    manifestContent = manifestContent.replace(/ExtensionBundleVersion="[^"]+"/, `ExtensionBundleVersion="${newVersion}"`);
    manifestContent = manifestContent.replace(/<Extension Id="([^"]+)" Version="[^"]+" \/>/g, `<Extension Id="$1" Version="${newVersion}" />`);
    fs.writeFileSync(manifestPath, manifestContent, 'utf8');
    console.log(`✓ [3/5] CSXS/manifest.xml atualizado para v${newVersion}`);
}

// 4. Atualizar updater.js config
const updaterJsPath = path.join(EXT_DIR, 'js', 'updater.js');
if (fs.existsSync(updaterJsPath)) {
    let updaterContent = fs.readFileSync(updaterJsPath, 'utf8');
    updaterContent = updaterContent.replace(/currentVersion:\s*"[^"]+"/, `currentVersion: "${newVersion}"`);
    fs.writeFileSync(updaterJsPath, updaterContent, 'utf8');
    console.log(`✓ [4/5] js/updater.js configurado com currentVersion "${newVersion}"`);
}

// 5. Empacotar .ZXP
console.log(`✓ [5/5] Gerando arquivo MediaDownloader.zxp padrão Adobe...`);
require('./package-zxp.js');

console.log(`\n======================================================`);
console.log(`🎉 RELEASE ZXP CONCLUÍDO COM SUCESSO!`);
console.log(`Plugin: ${PLUGIN_NAME} ${newVersion} (MediaDownloader.zxp)`);
console.log(`======================================================\n`);
