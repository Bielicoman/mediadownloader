@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Instalar-no-Windows.ps1"
if errorlevel 1 (
  echo.
  echo A instalacao falhou. Consulte a mensagem acima.
  pause
  exit /b 1
)
echo.
pause
exit /b 0
