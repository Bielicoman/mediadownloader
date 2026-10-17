param([string]$InstallRoot=(Join-Path $env:PROGRAMDATA 'Blackmagic Design/DaVinci Resolve/Support/Workflow Integration Plugins'))
$ErrorActionPreference='Stop'
$id='com.alexascencio.mediadownloader.resolve'
$source=Join-Path $PSScriptRoot $id
$sdk=Join-Path $env:PROGRAMDATA 'Blackmagic Design/DaVinci Resolve/Support/Developer/Workflow Integrations/Examples/SamplePlugin/WorkflowIntegration.node'
$menuRoot=Join-Path $env:APPDATA 'Blackmagic Design/DaVinci Resolve/Support/Fusion/Scripts/Utility/Media Downloader'
New-Item -ItemType Directory -Force -Path $menuRoot | Out-Null
$menuSource=Join-Path $PSScriptRoot 'scripts'
if(Test-Path -LiteralPath $menuSource){Get-ChildItem -LiteralPath $menuSource -Filter '*.lua' | Copy-Item -Destination $menuRoot -Force}
Write-Host "Menu instalado: Área de Trabalho > Scripts > Media Downloader"
if(!(Test-Path -LiteralPath $sdk)){Write-Host 'Painel Studio indisponível. Instale também o aplicativo Media Downloader Editores para abrir pelo menu Scripts.';return}
if(!(Test-Path -LiteralPath (Join-Path $source 'manifest.xml'))){throw 'Extraia o pacote inteiro antes de instalar.'}
$backupRoot=Join-Path $env:APPDATA 'MediaDownloaderEditors/resolve-backups'
New-Item -ItemType Directory -Force -Path $backupRoot,$InstallRoot | Out-Null
$nonce=[guid]::NewGuid().ToString('N')
$stage=Join-Path $backupRoot "stage-$nonce"
$backup=Join-Path $backupRoot "previous-$nonce"
$target=Join-Path $InstallRoot $id
Copy-Item -LiteralPath $source -Destination $stage -Recurse
Copy-Item -LiteralPath $sdk -Destination (Join-Path $stage 'companion/WorkflowIntegration.node')
$moved=$false
try{
 if(Test-Path -LiteralPath $target){Move-Item -LiteralPath $target -Destination $backup;$moved=$true}
 Move-Item -LiteralPath $stage -Destination $target
}catch{
 if($moved){if(Test-Path -LiteralPath $target){Move-Item -LiteralPath $target -Destination "$stage.failed"};Move-Item -LiteralPath $backup -Destination $target}
 throw
}
Write-Host "Instalado: $target"
Write-Host 'Reinicie o Resolve quando puder. Abra Workspace > Workflow Integrations > Media Downloader.'
Write-Host 'O diretório oficial é compartilhado; uma política do computador pode exigir permissão para escrever nele.'
