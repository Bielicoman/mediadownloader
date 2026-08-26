#!/usr/bin/env bash
# Remove o Media Downloader instalado por instalar.sh.
# Os videos baixados nao sao apagados.
set -euo pipefail

BIN="$HOME/.local/bin/media-downloader"
DESKTOP="$HOME/.local/share/applications/media-downloader.desktop"
ICONE="$HOME/.local/share/icons/hicolor/256x256/apps/media-downloader.png"

echo
echo "  ==============================================="
echo "   MEDIA DOWNLOADER - Desinstalar"
echo "  ==============================================="
echo
echo "  Sera removido:"
echo "    $BIN"
echo "    $DESKTOP"
echo "    $ICONE"
echo
echo "  Seus videos baixados NAO serao apagados."
echo

read -r -p "  Confirmar a remocao? [s/N] " resposta
case "$resposta" in
  [sS]|[sS][iI][mM]) ;;
  *) echo; echo "  Cancelado. Nada foi removido."; echo; exit 0 ;;
esac

echo
rm -f "$BIN" "$DESKTOP" "$ICONE"

command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
command -v gtk-update-icon-cache   >/dev/null 2>&1 && gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" >/dev/null 2>&1 || true

echo "  Media Downloader removido."
echo
