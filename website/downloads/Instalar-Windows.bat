@echo off
chcp 65001 >nul
title Media Downloader Pro — Instalador Automático para Adobe Premiere Pro

echo.
echo ========================================================
echo   MEDIA DOWNLOADER — INSTALADOR PARA PREMIERE PRO
echo   Compatível com Premiere Pro 2020, 2021, 2022, 2023, 2024, 2025 e 2026+
echo   Criado por: Alex Ascencio
echo ========================================================
echo.

set "TARGET_DIR=%APPDATA%\Adobe\CEP\extensions\com.alexascencio.mediadownloader"
set "SOURCE_DIR=%~dp0com.alexascencio.mediadownloader"

echo [1/3] Verificando diretório de extensões Adobe CEP...
if not exist "%APPDATA%\Adobe\CEP\extensions" (
    mkdir "%APPDATA%\Adobe\CEP\extensions" 2>nul
)

echo [2/3] Instalando Media Downloader no Premiere...
if exist "%SOURCE_DIR%" (
    if exist "%TARGET_DIR%" rmdir /s /q "%TARGET_DIR%" 2>nul
    xcopy "%SOURCE_DIR%" "%TARGET_DIR%\" /E /I /H /Y /Q >nul
    echo       ✓ Instalado em: %%APPDATA%%\Adobe\CEP\extensions
) else (
    echo [ERRO] Pasta com.alexascencio.mediadownloader não encontrada neste diretório!
    pause
    exit /b 1
)

echo [3/3] Habilitando PlayerDebugMode no Windows (CSXS 9 até 20)...
for /L %%i in (9,1,20) do (
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.%%i" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
    reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Adobe\CSXS.%%i" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
    reg add "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Adobe\CSXS.%%i" /v PlayerDebugMode /t REG_SZ /d "1" /f >nul 2>&1
)

echo.
echo ========================================================
echo   ✅ MEDIA DOWNLOADER INSTALADO COM SUCESSO!
echo.
echo   Como abrir no Adobe Premiere Pro:
echo   1. Abra (ou reinicie) o Adobe Premiere Pro
echo   2. Acesse o menu: Janela (Window) ^> Extensões ^> Media Downloader
echo ========================================================
echo.
pause
