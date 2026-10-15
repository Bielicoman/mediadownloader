param(
  [string]$SourceApp = "$env:LOCALAPPDATA/Programs/Media Downloader",
  [string]$Builder = "$PSScriptRoot/../../node_modules/electron-builder/cli.js",
  [string]$ResourceEditor = "",
  [string]$WorkDirectory = "$PSScriptRoot/../../work/windows-installer",
  [string]$OutputDirectory = "$PSScriptRoot/../../dist/windows"
)
$ErrorActionPreference = 'Stop'
$stage = Join-Path $WorkDirectory ('app-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $stage, $OutputDirectory | Out-Null
# Copy the complete Electron runtime and embedded download/conversion engines.
robocopy $SourceApp $stage /E /XF aria2c.exe Instalar.bat Desinstalar.bat /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -gt 7) { throw "Staging failed: $LASTEXITCODE" }
foreach ($engine in @('yt-dlp.exe','ffmpeg.exe','ffprobe.exe')) {
  if (!(Test-Path -LiteralPath "$stage/resources/app/bin/$engine")) { throw "Missing bundled engine: $engine" }
}
$electronVersion = (Get-Content -LiteralPath (Join-Path $stage 'version') -Raw).Trim()
$sourcePackage = Join-Path $PSScriptRoot '../../app'
Copy-Item -Path "$sourcePackage/src/*" -Destination "$stage/resources/app/src" -Recurse -Force
Copy-Item -Path "$sourcePackage/icons" -Destination "$stage/resources/app" -Recurse -Force
foreach ($document in @('package.json', 'LICENSE', 'THIRD-PARTY-NOTICES.md')) {
  $documentPath = Join-Path $sourcePackage $document
  if (!(Test-Path -LiteralPath $documentPath -PathType Leaf)) { throw "Missing package document: $document" }
  Copy-Item -LiteralPath $documentPath -Destination "$stage/resources/app/$document" -Force
}
$licensesPath = Join-Path $sourcePackage 'licenses'
if (!(Test-Path -LiteralPath $licensesPath -PathType Container)) { throw 'Missing third-party license directory' }
if (@(Get-ChildItem -LiteralPath $licensesPath -File -Recurse).Count -eq 0) { throw 'Third-party license directory is empty' }
New-Item -ItemType Directory -Force -Path "$stage/resources/app/licenses" | Out-Null
Copy-Item -Path "$licensesPath/*" -Destination "$stage/resources/app/licenses" -Recurse -Force
if (!(Test-Path -LiteralPath $Builder -PathType Leaf)) { throw "electron-builder missing: run npm ci in the repository root" }
if (!$ResourceEditor) {
  $ResourceEditor = Join-Path (Split-Path (Split-Path $Builder -Parent) -Parent) 'rcedit/bin/rcedit-x64.exe'
}
if (!(Test-Path -LiteralPath $ResourceEditor -PathType Leaf)) { throw "Resource editor not found: $ResourceEditor" }
$metadata = Get-Content -LiteralPath "$stage/resources/app/package.json" -Raw | ConvertFrom-Json
$appExecutable = Join-Path $stage 'Media Downloader.exe'
& $ResourceEditor $appExecutable --set-icon "$sourcePackage/icons/icon.ico" --set-file-version $metadata.version --set-product-version $metadata.version --set-version-string ProductName $metadata.productName --set-version-string FileDescription $metadata.productName --set-version-string CompanyName $metadata.author
if ($LASTEXITCODE -ne 0) { throw "Failed updating executable metadata: $LASTEXITCODE" }
$actualVersion = (Get-Item -LiteralPath $appExecutable).VersionInfo
if ($actualVersion.ProductVersion -ne $metadata.version) { throw 'Executable product version does not match package version' }
$env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'
& node $Builder --win nsis --x64 --prepackaged $stage --projectDir "$stage/resources/app" --config "$PSScriptRoot/electron-builder.nsis.json" --config.directories.output=$OutputDirectory --config.electronVersion=$electronVersion
if ($LASTEXITCODE -ne 0) { throw "Installer build failed: $LASTEXITCODE" }
Get-ChildItem -LiteralPath $OutputDirectory -Filter '*Setup*.exe' | Select-Object FullName,Length





