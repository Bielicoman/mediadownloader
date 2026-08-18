@echo off
setlocal enabledelayedexpansion

title Media Downloader - Instalador Automatico para Adobe Premiere Pro
echo.
echo ========================================================
echo   MEDIA DOWNLOADER - INSTALADOR PARA ADOBE PREMIERE PRO
echo   Compativel com Premiere Pro 2020 a 2026+ (Windows 10 / 11)
echo   Criado por: Alex Ascencio
echo ========================================================
echo.

set "PLUGIN_NAME=Media Downloader"
set "PLUGIN_ID=com.alexascencio.mediadownloader"
set "TARGET_USER_DIR=%APPDATA%\Adobe\CEP\extensions\%PLUGIN_ID%"
set "SCRIPT_DIR=%~dp0"
set "ZIP_DOWNLOAD_URL=https://raw.githubusercontent.com/Bielicoman/mediadownloader/main/MediaDownloader.zip"

echo [1/3] Preparando diretorios de extensoes Adobe CEP...
if not exist "%APPDATA%\Adobe\CEP\extensions" (
    mkdir "%APPDATA%\Adobe\CEP\extensions" 2>nul
)

echo [2/3] Instalando %PLUGIN_NAME%...

rem Caso 1: A pasta da extensao esta ao lado do script
if exist "%SCRIPT_DIR%%PLUGIN_ID%\CSXS\manifest.xml" (
    if exist "%TARGET_USER_DIR%" rmdir /s /q "%TARGET_USER_DIR%" 2>nul
    xcopy "%SCRIPT_DIR%%PLUGIN_ID%" "%TARGET_USER_DIR%\" /E /I /H /Y /Q >nul
    echo       [OK] Instalado a partir dos arquivos locais!
    goto REGISTRY_CONFIG
)

rem Caso 2: O proprio script esta dentro da pasta descompactada
if exist "%SCRIPT_DIR%CSXS\manifest.xml" (
    if exist "%TARGET_USER_DIR%" rmdir /s /q "%TARGET_USER_DIR%" 2>nul
    mkdir "%TARGET_USER_DIR%" 2>nul
    xcopy "%SCRIPT_DIR%*" "%TARGET_USER_DIR%\" /E /I /H /Y /Q >nul
    echo       [OK] Instalado a partir dos arquivos locais!
    goto REGISTRY_CONFIG
)

rem Caso 3: O arquivo .zip esta ao lado do script
if exist "%SCRIPT_DIR%MediaDownloader.zip" (
    echo       [i] Descompactando MediaDownloader.zip local...
    if exist "%TARGET_USER_DIR%" rmdir /s /q "%TARGET_USER_DIR%" 2>nul
    mkdir "%TARGET_USER_DIR%" 2>nul
    powershell -NoProfile -Command "Expand-Archive -Path '%SCRIPT_DIR%MediaDownloader.zip' -DestinationPath '%TARGET_USER_DIR%' -Force" >nul 2>&1
    echo       [OK] Instalado a partir do ZIP local!
    goto REGISTRY_CONFIG
)

rem Caso 4: Instalador standalone online (executado direto pelo usuario)
echo       [i] Baixando a versao mais recente online do GitHub...
set "TEMP_ZIP=%TEMP%\MediaDownloader_latest.zip"
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%ZIP_DOWNLOAD_URL%', '%TEMP_ZIP%')" >nul 2>&1

if exist "%TEMP_ZIP%" (
    echo       [i] Instalando arquivos atualizados...
    if exist "%TARGET_USER_DIR%" rmdir /s /q "%TARGET_USER_DIR%" 2>nul
    mkdir "%TARGET_USER_DIR%" 2>nul
    powershell -NoProfile -Command "Expand-Archive -Path '%TEMP_ZIP%' -DestinationPath '%TARGET_USER_DIR%' -Force" >nul 2>&1
    del /f /q "%TEMP_ZIP%" 2>nul
    echo       [OK] Download e instalacao concluidos com sucesso!
    goto REGISTRY_CONFIG
) else (
    echo       [ERRO] Nao foi possivel baixar o plugin automaticamente. Verifique sua conexao.
    pause
    exit /b 1
)

:REGISTRY_CONFIG
echo.
echo [3/3] Desbloqueando Premiere Pro no Registro do Windows (CSXS 9 ate 20)...
for /L %%i in (9,1,20) do (
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.%%i" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
    reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Adobe\CSXS.%%i" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
    reg add "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Adobe\CSXS.%%i" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
)
echo       [OK] Permissoes ativadas para Premiere Pro 2020 a 2026+!

echo.
echo ========================================================
echo   %PLUGIN_NAME% INSTALADO COM SUCESSO!
echo.
echo   Como abrir no Adobe Premiere Pro:
echo   1. Abra (ou reinicie) o Adobe Premiere Pro.
echo   2. No menu superior, va em:
echo      Janela (Window) ^> Extensoes (Extensions) ^> Media Downloader
echo.
echo   Dica: Se o Premiere ja estiver aberto, feche e abra novamente.
echo ========================================================
echo.
pause
