param(
    [string]$InstallRoot = (Join-Path $env:APPDATA 'Adobe/CEP/extensions'),
    [string]$BackupRoot = (Join-Path $env:APPDATA 'MediaDownloaderPro/extension-backups'),
    [switch]$SkipDebugMode
)
$ErrorActionPreference = 'Stop'
$extensionId = 'com.alexascencio.mediadownloader'
$source = Join-Path $PSScriptRoot $extensionId
$manifest = Join-Path $source 'CSXS/manifest.xml'
$destination = Join-Path $InstallRoot $extensionId
if (!(Test-Path -LiteralPath $manifest -PathType Leaf)) {
    throw "Extraia o ZIP completo. A pasta $extensionId precisa estar ao lado deste instalador."
}
[xml]$manifestXml = Get-Content -LiteralPath $manifest -Raw
if ($manifestXml.DocumentElement.ExtensionBundleId -ne $extensionId) { throw 'Manifesto da extensão incompatível.' }
New-Item -ItemType Directory -Force -Path $InstallRoot, $BackupRoot | Out-Null
$transactionId = "$(Get-Date -Format 'yyyyMMdd-HHmmss')-$([guid]::NewGuid().ToString('N'))"
$stage = Join-Path $BackupRoot ".staging-$extensionId-$transactionId"
$backup = Join-Path $BackupRoot "$extensionId-$transactionId"
if ((Test-Path -LiteralPath $stage) -or (Test-Path -LiteralPath $backup)) { throw 'Colisão no diretório de preparação.' }
# Prepare the full copy before touching an existing installation.
Copy-Item -LiteralPath $source -Destination $stage -Recurse
[xml]$stagedXml = Get-Content -LiteralPath (Join-Path $stage 'CSXS/manifest.xml') -Raw
if ($stagedXml.DocumentElement.ExtensionBundleId -ne $extensionId) { throw 'Falha ao validar cópia preparada.' }
$hadPrevious = Test-Path -LiteralPath $destination
$previousMoved = $false
try {
    if ($hadPrevious) {
        Move-Item -LiteralPath $destination -Destination $backup
        $previousMoved = $true
    }
    Move-Item -LiteralPath $stage -Destination $destination
} catch {
    $installError = $_
    if ($previousMoved) {
        if (Test-Path -LiteralPath $destination) {
            Move-Item -LiteralPath $destination -Destination "$stage.failed"
        }
        Move-Item -LiteralPath $backup -Destination $destination
    }
    throw "Instalação interrompida; versão anterior restaurada quando existente. $($installError.Exception.Message)"
}
if (!$SkipDebugMode) {
    foreach ($version in 9..12) {
        $registryPath = "HKCU:/Software/Adobe/CSXS.$version"
        New-Item -Path $registryPath -Force | Out-Null
        New-ItemProperty -LiteralPath $registryPath -Name PlayerDebugMode -PropertyType String -Value '1' -Force | Out-Null
    }
}
Write-Host "Media Downloader instalado em: $destination"
if ($hadPrevious) { Write-Host "Backup anterior preservado em: $backup" }
Write-Host 'Se o Premiere ou After Effects estiver aberto, reinicie o editor quando puder. Abra Janela > Extensões (Legado) > Media Downloader.'
