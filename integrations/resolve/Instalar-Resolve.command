#!/bin/bash
set -euo pipefail
base="$(cd "$(dirname "$0")" && pwd)"
id='com.alexascencio.mediadownloader.resolve'
sdk='/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Workflow Integrations/Examples/SamplePlugin/WorkflowIntegration.node'
target="/Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins/$id"
if [[ ! -f "$sdk" ]]; then printf 'SDK local não encontrado. Confira a instalação do Resolve Studio.\n'; exit 1; fi
backup="$HOME/Library/Application Support/MediaDownloaderEditors/resolve-backups/$(date +%Y%m%d-%H%M%S)-$$"
mkdir -p "$backup"
cp -R "$base/$id" "$backup/stage"
cp "$sdk" "$backup/stage/companion/WorkflowIntegration.node"
mkdir -p "$(dirname "$target")"
if [[ -d "$target" ]]; then mv "$target" "$backup/previous"; fi
if ! mv "$backup/stage" "$target"; then
 if [[ -d "$backup/previous" ]]; then mv "$backup/previous" "$target"; fi
 exit 1
fi
printf 'Instalado. Reinicie o Resolve quando puder e abra Workspace > Workflow Integrations > Media Downloader.\n'
