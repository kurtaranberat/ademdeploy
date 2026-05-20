@echo off
title BRAND-A Dashboard - Frontend
echo ============================================
echo  BRAND-A Dashboard - React Frontend
echo ============================================

set NODE=C:\tools\node-v20.14.0-win-x64\node.exe

if not exist "%NODE%" (
    echo [HATA] Node.js bulunamadi: %NODE%
    pause
    exit /b 1
)

echo [OK] Node.js bulundu
echo.

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [*] npm paketleri yukleniyor...
    "%NODE%" node_modules\.bin\react-scripts start
)

echo [*] React baslatiliyor: http://localhost:3000
echo     Durdurmak icin CTRL+C
echo.
"%NODE%" node_modules\react-scripts\bin\react-scripts.js start
pause
