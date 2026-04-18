@echo off
chcp 65001 >nul

REM ВАЖНО: Переходим в папку скрипта
cd /d "%~dp0"

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              🎮 BFshop - Запуск                               ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 📍 Текущая папка: %CD%
echo.

REM Check if we're in the right directory
if not exist "backend" (
    echo ❌ Ошибка: Папка backend не найдена!
    echo.
    echo Убедитесь, что вы запускаете скрипт из папки BFshop
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js не установлен!
    echo.
    echo Скачайте и установите Node.js:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js установлен
echo.

REM Check PostgreSQL
sc query postgresql-x64-18 | find "RUNNING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL 18 работает
    goto :postgres_ok
)

sc query postgresql-x64-17 | find "RUNNING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL 17 работает
    goto :postgres_ok
)

sc query postgresql-x64-16 | find "RUNNING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL 16 работает
    goto :postgres_ok
)

echo.
echo ❌ PostgreSQL не запущен!
echo.
echo Сначала настройте базу данных:
echo → Запустите: СУПЕР_ПРОСТОЙ_СБРОС.bat (от администратора)
echo.
pause
exit /b 1

:postgres_ok
echo.

REM Check if dependencies are installed
if not exist "backend\node_modules" (
    echo 📦 Установка зависимостей...
    echo    (Это займёт 1-2 минуты при первом запуске)
    echo.
    cd backend
    call npm install
    cd ..
    echo.
    echo ✅ Зависимости установлены
    echo.
)

REM Check if .env exists
if not exist "backend\.env" (
    echo.
    echo ❌ Файл .env не найден!
    echo.
    echo Сначала настройте базу данных:
    echo → Запустите: СУПЕР_ПРОСТОЙ_СБРОС.bat (от администратора)
    echo.
    echo Или создайте .env вручную:
    echo 1. Скопируйте backend\.env.example в backend\.env
    echo 2. Укажите пароль PostgreSQL в DATABASE_URL
    echo.
    pause
    exit /b 1
)

echo ✅ Файл .env найден
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo 🚀 Запуск BFshop...
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:8080
echo.
echo Для остановки закройте окна Backend и Frontend
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause

REM Start backend in new window
start "BFshop Backend" cmd /k "cd /d "%~dp0backend" && npm start"

REM Wait for backend to start
echo ⏳ Ожидание запуска backend (5 секунд)...
timeout /t 5 /nobreak >nul

REM Start frontend in new window
start "BFshop Frontend" cmd /k "cd /d "%~dp0frontend" && python -m http.server 8080"

REM Wait for frontend to start
echo ⏳ Ожидание запуска frontend (3 секунды)...
timeout /t 3 /nobreak >nul

REM Open browser
echo.
echo 🌐 Открытие браузера...
start http://localhost:8080

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              ✅ BFshop запущен!                                ║
echo ║                                                                ║
echo ║  Frontend: http://localhost:8080                              ║
echo ║  Backend:  http://localhost:3000                              ║
echo ║                                                                ║
echo ║  Для остановки закройте окна Backend и Frontend               ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Это окно можно закрыть.
echo.
pause
