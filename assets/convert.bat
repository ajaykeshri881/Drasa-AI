@echo off
title Drasa AI - Asset Converter
color 0B

echo.
echo ========================================
echo   Drasa AI - SVG to WebP Converter
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js not found!
    echo.
    echo Choose conversion method:
    echo   1. Use PowerShell script (requires ImageMagick)
    echo   2. Manual conversion (see README.md)
    echo   3. Exit
    echo.
    choice /C 123 /N /M "Enter choice: "
    if errorlevel 3 exit
    if errorlevel 2 (
        start README.md
        exit
    )
    if errorlevel 1 (
        powershell -ExecutionPolicy Bypass -File convert.ps1
        exit
    )
)

echo [√] Node.js found
echo.
echo Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [X] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Converting SVG to WebP...
echo.
call npm run convert

echo.
echo ========================================
echo.
pause
