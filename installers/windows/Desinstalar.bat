@echo off
setlocal
chcp 65001 >nul 2>&1
title Desinstalar o Media Downloader

set "DEST=%LOCALAPPDATA%\Programs\Media Downloader"
set "MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
set "CHAVE=HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\MediaDownloader"

echo.
echo   ===============================================
echo    MEDIA DOWNLOADER - Desinstalar
echo   ===============================================
echo.
echo   Sera removido:
echo     %DEST%
echo     Atalhos do Menu Iniciar e da Area de Trabalho
echo.
echo   Seus videos baixados NAO serao apagados.
echo.

choice /C SN /N /M "   Confirmar a remocao? [S/N] "
if errorlevel 2 goto cancelado

echo.
echo   Removendo atalhos...
del /f /q "%MENU%\Media Downloader.lnk" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Remove-Item -LiteralPath ([Environment]::GetFolderPath('Desktop') + '\Media Downloader.lnk') -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo   Removendo o registro...
reg delete "%CHAVE%" /f >nul 2>&1

echo   Removendo os arquivos...
REM O proprio desinstalador esta dentro da pasta que sera apagada, entao a
REM exclusao e agendada para depois que este script terminar.
start "" /min cmd /c "timeout /t 2 /nobreak >nul & rmdir /s /q ""%DEST%"""

echo.
echo   Media Downloader removido.
echo.
timeout /t 3 /nobreak >nul
exit /b 0

:cancelado
echo.
echo   Cancelado. Nada foi removido.
echo.
pause
exit /b 0
