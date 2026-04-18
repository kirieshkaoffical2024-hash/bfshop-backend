@echo off
chcp 65001 >nul

REM Change to script directory
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════╗
echo ║     🎮 BFshop Launcher 🎮             ║
echo ╔════════════════════════════════════════╗
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PostgreSQL is running
echo 📊 Checking PostgreSQL...

REM Try to find PostgreSQL service
sc query postgresql-x64-18 | find "RUNNING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL 18 is running
    goto :postgres_ok
)

sc query postgresql-x64-17 | find "RUNNING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL 17 is running
    goto :postgres_ok
)

sc query postgresql-x64-16 | find "RUNNING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL 16 is running
    goto :postgres_ok
)

REM PostgreSQL not running
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  ⚠️  PostgreSQL НЕ ЗАПУЩЕН!                                   ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 📚 Что делать:
echo.
echo    1. Запустить PostgreSQL автоматически:
echo       → net start postgresql-x64-18
echo       → или: net start postgresql-x64-16
echo.
echo    2. Настроить базу данных:
echo       → Запустите: БЫСТРАЯ_НАСТРОЙКА.bat
echo       → Или прочитайте: НАЧНИТЕ_ЗДЕСЬ.txt
echo.
echo    3. Использовать Railway (облачный PostgreSQL):
echo       → Откройте: АЛЬТЕРНАТИВА_БЕЗ_POSTGRESQL.md
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
exit /b 1

:postgres_ok

:postgres_ok

echo.

REM Check if dependencies are installed
if not exist "backend\node_modules" (
    echo 📦 Installing dependencies...
    cd backend
    call npm install
    cd ..
    echo ✅ Dependencies installed
    echo.
)

REM Check if .env exists
if not exist "backend\.env" (
    echo ⚠️  .env file not found!
    echo    Please copy .env.example to .env and configure it.
    echo.
    echo    Run this command:
    echo    cd backend
    echo    copy .env.example .env
    echo    notepad .env
    echo.
    pause
    exit /b 1
)

echo 🚀 Starting BFshop...
echo.
echo Backend will start on: http://localhost:3000
echo Frontend will start on: http://localhost:8080
echo.
echo Press Ctrl+C to stop the servers
echo.

REM Start backend in new window
start "BFshop Backend" cmd /k "cd backend && npm start"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "BFshop Frontend" cmd /k "cd frontend && python -m http.server 8080"

REM Wait a bit for frontend to start
timeout /t 2 /nobreak >nul

REM Open browser
echo 🌐 Opening browser...
start http://localhost:8080

echo.
echo ✅ BFshop is running!
echo.
echo 📝 To stop the servers:
echo    - Close the Backend and Frontend windows
echo    - Or press Ctrl+C in each window
echo.
pause
