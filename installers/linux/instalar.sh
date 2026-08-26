#!/usr/bin/env bash
# Instalador do Media Downloader para Linux.
#
# Coloca o AppImage em ~/.local/bin, registra o atalho no menu de aplicativos
# e instala o icone. Nao precisa de root e nao toca em nada fora da sua pasta
# de usuario.
set -euo pipefail

APP="MediaDownloader-Linux-x86_64.AppImage"
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="$HOME/.local/bin"
APPS="$HOME/.local/share/applications"
ICONES="$HOME/.local/share/icons/hicolor/256x256/apps"

echo
echo "  ==============================================="
echo "   MEDIA DOWNLOADER - Instalador"
echo "  ==============================================="
echo

if [ ! -f "$AQUI/$APP" ]; then
  echo "  ERRO: $APP nao foi encontrado ao lado deste script."
  echo "  Baixe o AppImage e deixe os dois na mesma pasta."
  echo
  exit 1
fi

echo "  [1/4] Preparando as pastas..."
mkdir -p "$BIN" "$APPS" "$ICONES"

echo "  [2/4] Instalando o aplicativo..."
install -m 755 "$AQUI/$APP" "$BIN/media-downloader"

echo "  [3/4] Extraindo o icone..."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
(
  cd "$TMP"
  # --appimage-extract nao depende de FUSE, entao funciona mesmo sem libfuse2
  "$BIN/media-downloader" --appimage-extract >/dev/null 2>&1 || true
)
if [ -f "$TMP/squashfs-root/media-downloader.png" ]; then
  install -m 644 "$TMP/squashfs-root/media-downloader.png" "$ICONES/media-downloader.png"
  echo "        icone instalado"
else
  echo "        icone nao encontrado, seguindo sem ele"
fi

echo "  [4/4] Registrando no menu de aplicativos..."
cat > "$APPS/media-downloader.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Media Downloader
Comment=Baixe videos, audios, playlists e canais em qualidade maxima
Exec=$BIN/media-downloader
Icon=media-downloader
Categories=AudioVideo;Video;
Terminal=false
DESKTOP
chmod 644 "$APPS/media-downloader.desktop"

# Atualiza o cache do menu, quando a ferramenta existe
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$APPS" >/dev/null 2>&1 || true
command -v gtk-update-icon-cache   >/dev/null 2>&1 && gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" >/dev/null 2>&1 || true

echo
echo "  ==============================================="
echo "   Instalado com sucesso."
echo "  ==============================================="
echo
echo "  Procure por \"Media Downloader\" no menu de aplicativos."
echo "  Pelo terminal: media-downloader"
echo

case ":$PATH:" in
  *":$BIN:"*) ;;
  *) echo "  Aviso: $BIN nao esta no seu PATH."
     echo "  Para usar o comando no terminal, adicione ao ~/.bashrc:"
     echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
     echo ;;
esac

echo "  Para remover, rode: desinstalar.sh"
echo
