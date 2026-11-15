@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo  RESET DATA Chill Guard
echo  Menghapus database dan foto di folder data\
echo  Data contoh dibuat ulang otomatis saat start.bat dijalankan.
echo ============================================================
echo.
echo Pastikan jendela server (start.bat) SUDAH DITUTUP.
set /p YA=Ketik YA lalu Enter untuk melanjutkan: 
if /i not "%YA%"=="YA" (
  echo Dibatalkan.
  pause
  exit /b 0
)
if exist "%~dp0data" rmdir /s /q "%~dp0data"
if exist "%~dp0data" (
  echo GAGAL menghapus folder data\. Tutup jendela server lalu coba lagi.
) else (
  echo Selesai. Jalankan start.bat untuk membuat data contoh baru.
)
pause
