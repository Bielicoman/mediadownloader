#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXTENSION_ID='com.alexascencio.mediadownloader'
SOURCE="$SCRIPT_DIR/$EXTENSION_ID"
INSTALL_ROOT="$HOME/Library/Application Support/Adobe/CEP/extensions"
BACKUP_ROOT="$HOME/Library/Application Support/MediaDownloaderPro/extension-backups"
DESTINATION="$INSTALL_ROOT/$EXTENSION_ID"
if [ ! -f "$SOURCE/CSXS/manifest.xml" ]; then
  printf 'Erro: extraia o ZIP completo. A pasta %s precisa estar ao lado deste instalador.\n' "$EXTENSION_ID" >&2
  exit 1
fi
if ! /usr/bin/grep -Fq "ExtensionBundleId=\"$EXTENSION_ID\"" "$SOURCE/CSXS/manifest.xml"; then
  printf 'Erro: manifesto da extensão incompatível.\n' >&2
  exit 1
fi
mkdir -p "$INSTALL_ROOT" "$BACKUP_ROOT"
TRANSACTION_ID="$(date '+%Y%m%d-%H%M%S')-$$-$RANDOM"
STAGE="$BACKUP_ROOT/.staging-$EXTENSION_ID-$TRANSACTION_ID"
BACKUP="$BACKUP_ROOT/$EXTENSION_ID-$TRANSACTION_ID"
if [ -e "$STAGE" ] || [ -e "$BACKUP" ]; then printf 'Erro: pasta de preparação já existe.\n' >&2; exit 1; fi
# Complete and validate the new copy before replacing the current extension.
/usr/bin/ditto "$SOURCE" "$STAGE"
/usr/bin/grep -Fq "ExtensionBundleId=\"$EXTENSION_ID\"" "$STAGE/CSXS/manifest.xml"
HAD_PREVIOUS=0
if [ -e "$DESTINATION" ]; then
  mv "$DESTINATION" "$BACKUP"
  HAD_PREVIOUS=1
fi
if ! mv "$STAGE" "$DESTINATION"; then
  if [ "$HAD_PREVIOUS" -eq 1 ]; then
    if [ -e "$DESTINATION" ]; then mv "$DESTINATION" "$STAGE.failed"; fi
    mv "$BACKUP" "$DESTINATION"
  fi
  printf 'Erro ao ativar extensão; versão anterior restaurada quando existente.\n' >&2
  exit 1
fi
for VERSION in 9 10 11 12; do
  /usr/bin/defaults write "com.adobe.CSXS.$VERSION" PlayerDebugMode -string 1
done
printf '\nMedia Downloader instalado em:\n%s\n' "$DESTINATION"
if [ "$HAD_PREVIOUS" -eq 1 ]; then printf 'Backup anterior preservado em:\n%s\n' "$BACKUP"; fi
printf '\nSe o Premiere ou After Effects estiver aberto, reinicie o editor quando puder. Abra Janela > Extensões (Legado) > Media Downloader.\n'
