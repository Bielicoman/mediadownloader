@echo off
chcp 65001 >nul
title Media Downloader Pro — Instalador Automático para Adobe Premiere Pro

echo.
echo ========================================================
echo   MEDIA DOWNLOADER PRO — INSTALADOR PARA PREMIERE PRO
echo   Baixe vídeos do YouTube, Instagram e TikTok direto no Premiere
echo ========================================================
echo.

set "TARGET_DIR=%APPDATA%\Adobe\CEP\extensions\com.alexascencio.mediadownloader"
set "SOURCE_DIR=%~dp0com.alexascencio.mediadownloader"

echo [1/3] Verificando diretório de extensões Adobe CEP...
if not exist "%APPDATA%\Adobe\CEP\extensions" (
    mkdir "%APPDATA%\Adobe\CEP\extensions" 2>nul
)

echo [2/3] Instalando Media Downloader Pro no Premiere...
if exist "%SOURCE_DIR%" (
    if exist "%TARGET_DIR%" rmdir /s /q "%TARGET_DIR%"
    xcopy "%SOURCE_DIR%" "%TARGET_DIR%\" /E /I /H /Y /Q >nul
) else (
    echo [ERRO] Pasta com.alexascencio.mediadownloader não encontrada neste diretório!
    pause
    exit /b 1
)

echo [3/3] Habilitando PlayerDebugMode no Windows (CSXS 9 a 16)...
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.13" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.14" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.15" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.16" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1

echo.
echo ========================================================
echo   ✅ MEDIA DOWNLOADER PRO INSTALADO COM SUCESSO!
echo.
echo   Como abrir no Adobe Premiere Pro:
echo   1. Abra o Adobe Premiere Pro
echo   2. Acesse o menu: Janela ^> Extensões ^> Media Downloader
echo ========================================================
echo.
pause
