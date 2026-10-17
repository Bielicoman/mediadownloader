#!/bin/bash
set -euo pipefail
base="$(cd "$(dirname "$0")" && pwd)"
arch="$(uname -m)"
case "$arch" in arm64) electron_arch=arm64;; x86_64) electron_arch=x64;; *) printf 'Arquitetura não suportada.\n';exit 1;; esac
version=44.7.2
archive="electron-v${version}-darwin-${electron_arch}.zip"
homebase="$HOME/Library/Application Support/MediaDownloaderEditors"
runtime="$homebase/runtime-$version-$electron_arch"
if [[ ! -f "$runtime/Electron.app/Contents/MacOS/Electron" ]]; then
 stage="$homebase/preparing-$(date +%s)-$$"
 mkdir -p "$stage"
 url="https://github.com/electron/electron/releases/download/v$version"
 curl --proto '=https' --tlsv1.2 -fL "$url/$archive" -o "$stage/$archive"
 curl --proto '=https' --tlsv1.2 -fL "$url/SHASUMS256.txt" -o "$stage/SHASUMS256.txt"
 expected="$(awk -v name="$archive" '$2 == name {print $1}' "$stage/SHASUMS256.txt")"
 actual="$(shasum -a 256 "$stage/$archive" | awk '{print $1}')"
 if [[ -z "$expected" || "$expected" != "$actual" ]]; then printf 'Falha na verificação do runtime. Arquivos preservados em %s\n' "$stage";exit 1;fi
 unzip -q "$stage/$archive" -d "$stage/extracted"
 mv "$stage/extracted" "$runtime"
fi
# Run as a development app directory; do not modify the Electron bundle's signature.
exec "$runtime/Electron.app/Contents/MacOS/Electron" "$base/.."
