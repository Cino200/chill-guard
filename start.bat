@echo off
setlocal
title Chill Guard - server
cd /d "%~dp0"

rem ---- Cari node.exe: utamakan yang ada di dalam paket ini (portable) ----
set "NODE=%~dp0node\node.exe"
if not exist "%NODE%" (
  where node >nul 2>nul
  if errorlevel 1 (
    echo.
    echo GAGAL: node\node.exe tidak ditemukan dan Node.js tidak terpasang.
    echo Salin ulang seluruh folder ChillGuard dari zip, lalu coba lagi.
    echo.
    pause
    exit /b 1
  )
  set "NODE=node"
)

rem ---- Data (database dan foto) disimpan di folder data\ di sebelah aplikasi ----
if not defined CG_DATA set "CG_DATA=%~dp0data"

echo Memulai Chill Guard dari: %~dp0
echo (Jika Windows menanyakan izin firewall, pilih "Allow access" agar HP bisa terhubung.)
"%NODE%" "%~dp0app\server.js"

echo.
echo Server berhenti. Tekan tombol apa saja untuk menutup jendela ini.
pause >nul
