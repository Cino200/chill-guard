@echo off
rem Mengizinkan node.exe (Chill Guard) di Windows Firewall agar HP/Android bisa terhubung.
rem Butuh hak Administrator. Hanya perlu sekali. Bisa juga cukup pilih "Allow access" saat Windows bertanya.
net session >nul 2>nul
if errorlevel 1 (
  echo Skrip ini harus dijalankan sebagai Administrator:
  echo klik kanan buka-firewall.bat, pilih "Run as administrator".
  echo.
  pause
  exit /b 1
)
cd /d "%~dp0"
netsh advfirewall firewall delete rule name="Chill Guard (node)" >nul 2>nul
netsh advfirewall firewall add rule name="Chill Guard (node)" dir=in action=allow program="%~dp0node\node.exe" enable=yes profile=private,public
echo.
echo Selesai. Untuk membatalkan: netsh advfirewall firewall delete rule name="Chill Guard (node)"
pause
