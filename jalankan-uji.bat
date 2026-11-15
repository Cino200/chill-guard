@echo off
setlocal
cd /d "%~dp0"
set "NODE=%~dp0node\node.exe"
if not exist "%NODE%" set "NODE=node"
"%NODE%" "%~dp0tests\jalankan-uji.js"
echo.
pause
