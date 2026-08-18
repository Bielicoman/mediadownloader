#!/bin/bash
clear
echo "========================================================"
echo "  MEDIA DOWNLOADER — INSTALADOR PARA ADOBE PREMIERE PRO"
echo "  Compatível com Premiere Pro 2020 a 2026+ (macOS)"
echo "  Criado por: Alex Ascencio"
echo "========================================================"
echo ""

PLUGIN_ID="com.alexascencio.mediadownloader"
PLUGIN_NAME="Media Downloader"
TARGET_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/$PLUGIN_ID"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ZIP_URL="https://raw.githubusercontent.com/Bielicoman/mediadownloader/main/MediaDownloader.zip"

echo "[1/3] Preparando diretório de extensões no Mac..."
mkdir -p "$HOME/Library/Application Support/Adobe/CEP/extensions"

echo "[2/3] Instalando $PLUGIN_NAME..."
if [ -d "$SCRIPT_DIR/$PLUGIN_ID" ]; then
    rm -rf "$TARGET_DIR"
    cp -R "$SCRIPT_DIR/$PLUGIN_ID" "$TARGET_DIR"
    echo "      ✓ Instalado a partir dos arquivos locais!"
elif [ -f "$SCRIPT_DIR/CSXS/manifest.xml" ]; then
    rm -rf "$TARGET_DIR"
    mkdir -p "$TARGET_DIR"
    cp -R "$SCRIPT_DIR/"* "$TARGET_DIR/"
    echo "      ✓ Instalado a partir dos arquivos locais!"
elif [ -f "$SCRIPT_DIR/MediaDownloader.zip" ]; then
    rm -rf "$TARGET_DIR"
    mkdir -p "$TARGET_DIR"
    unzip -q "$SCRIPT_DIR/MediaDownloader.zip" -d "$TARGET_DIR"
    echo "      ✓ Instalado a partir do ZIP local!"
else
    echo "      [i] Baixando versão mais recente do GitHub..."
    TEMP_ZIP="/tmp/MediaDownloader_latest.zip"
    curl -sL "$ZIP_URL" -o "$TEMP_ZIP"
    if [ -f "$TEMP_ZIP" ]; then
        rm -rf "$TARGET_DIR"
        mkdir -p "$TARGET_DIR"
        unzip -q "$TEMP_ZIP" -d "$TARGET_DIR"
        rm -f "$TEMP_ZIP"
        echo "      ✓ Download e instalação concluídos com sucesso!"
    else
        echo "      [ERRO] Falha ao baixar arquivos do plugin."
        exit 1
    fi
fi

echo ""
echo "[3/3] Desbloqueando Premiere Pro no macOS (CSXS 9 até 20)..."
for i in {9..20}; do
    defaults write "com.adobe.CSXS.$i" PlayerDebugMode 1 2>/dev/null
done
echo "      ✓ Permissões CSXS ativadas no macOS!"

echo ""
echo "========================================================"
echo "  ✅ $PLUGIN_NAME INSTALADO COM SUCESSO!"
echo ""
echo "  Como abrir no Adobe Premiere Pro:"
echo "  1. Abra (ou reinicie) o Adobe Premiere Pro."
echo "  2. Vá em: Janela (Window) > Extensões > $PLUGIN_NAME"
echo "========================================================"
echo ""
read -p "Pressione Enter para fechar..."
