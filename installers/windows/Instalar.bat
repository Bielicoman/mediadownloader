@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title Instalador do Media Downloader

set "ORIGEM=%~dp0"
set "DEST=%LOCALAPPDATA%\Programs\Media Downloader"
set "MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
set "EXE=Media Downloader.exe"

echo.
echo   ===============================================
echo    MEDIA DOWNLOADER - Instalador
echo   ===============================================
echo.

if not exist "%ORIGEM%%EXE%" (
    echo   ERRO: "%EXE%" nao foi encontrado nesta pasta.
    echo   Extraia o ZIP inteiro antes de rodar este instalador.
    echo.
    pause
    exit /b 1
)

echo   Instalando em:
echo   %DEST%
echo.

echo   [1/4] Liberando os arquivos baixados da internet...
REM O Windows marca todo arquivo vindo da internet (Mark-of-the-Web). E essa
REM marca que faz o SmartScreen bloquear. Removendo, o app abre direto.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-ChildItem -LiteralPath '%ORIGEM%' -Recurse -File -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue" >nul 2>&1

echo   [2/4] Copiando os arquivos...
if exist "%DEST%" rmdir /s /q "%DEST%" >nul 2>&1
mkdir "%DEST%" >nul 2>&1
robocopy "%ORIGEM%." "%DEST%" /E /NJH /NJS /NDL /NFL /NP >nul
if not exist "%DEST%\%EXE%" (
    echo   ERRO: falha ao copiar os arquivos.
    echo.
    pause
    exit /b 1
)

REM Remove a marca tambem no destino, por seguranca
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-ChildItem -LiteralPath '%DEST%' -Recurse -File -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue" >nul 2>&1

echo   [3/4] Criando atalhos...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$w = New-Object -ComObject WScript.Shell;" ^
  "$s = $w.CreateShortcut('%MENU%\Media Downloader.lnk');" ^
  "$s.TargetPath = '%DEST%\%EXE%';" ^
  "$s.WorkingDirectory = '%DEST%';" ^
  "$s.IconLocation = '%DEST%\%EXE%,0';" ^
  "$s.Description = 'Baixe videos, audios, playlists e canais em qualidade maxima';" ^
  "$s.Save()" >nul 2>&1

choice /C SN /N /M "   Criar atalho na Area de Trabalho tambem? [S/N] "
if errorlevel 2 goto sem_desktop
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$w = New-Object -ComObject WScript.Shell;" ^
  "$s = $w.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Media Downloader.lnk');" ^
  "$s.TargetPath = '%DEST%\%EXE%';" ^
  "$s.WorkingDirectory = '%DEST%';" ^
  "$s.IconLocation = '%DEST%\%EXE%,0';" ^
  "$s.Save()" >nul 2>&1
:sem_desktop
echo.

echo   [4/4] Registrando em Aplicativos Instalados...
set "CHAVE=HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\MediaDownloader"
reg add "%CHAVE%" /v DisplayName     /t REG_SZ /d "Media Downloader"            /f >nul 2>&1
reg add "%CHAVE%" /v DisplayVersion  /t REG_SZ /d "1.0.0"                       /f >nul 2>&1
reg add "%CHAVE%" /v Publisher       /t REG_SZ /d "Alex Ascencio"               /f >nul 2>&1
reg add "%CHAVE%" /v DisplayIcon     /t REG_SZ /d "%DEST%\%EXE%"                /f >nul 2>&1
reg add "%CHAVE%" /v InstallLocation /t REG_SZ /d "%DEST%"                      /f >nul 2>&1
reg add "%CHAVE%" /v UninstallString /t REG_SZ /d "\"%DEST%\Desinstalar.bat\""  /f >nul 2>&1
reg add "%CHAVE%" /v NoModify        /t REG_DWORD /d 1                          /f >nul 2>&1
reg add "%CHAVE%" /v NoRepair        /t REG_DWORD /d 1                          /f >nul 2>&1

echo.
echo   ===============================================
echo    Instalado com sucesso.
echo   ===============================================
echo.
echo   Abra pelo Menu Iniciar, procurando por "Media Downloader".
echo   Para remover: Configuracoes ^> Aplicativos, ou o
echo   Desinstalar.bat dentro da pasta de instalacao.
echo.

choice /C SN /N /M "   Abrir o Media Downloader agora? [S/N] "
if errorlevel 2 goto fim
start "" "%DEST%\%EXE%"

:fim
endlocal
exit /b 0
