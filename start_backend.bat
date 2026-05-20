@echo off
title BRAND-A Dashboard - Backend
echo ============================================
echo  BRAND-A Dashboard - Flask Backend
echo ============================================

set PYTHON=C:\Users\Barrow\AppData\Local\Programs\Python\Python311\python.exe

if not exist "%PYTHON%" (
    echo [ERROR] Python bulunamadi: %PYTHON%
    echo Python 3.11 kurulu olmali.
    pause
    exit /b 1
)

echo [OK] Python bulundu: %PYTHON%
echo.

cd /d "%~dp0backend"

echo [*] Gerekli paketler kontrol ediliyor...
"%PYTHON%" -m pip install flask flask-cors pandas --quiet

echo.
echo [*] Flask sunucusu baslatiliyor: http://localhost:5000
echo     Durdurmak icin CTRL+C
echo.
"%PYTHON%" app.py
pause
