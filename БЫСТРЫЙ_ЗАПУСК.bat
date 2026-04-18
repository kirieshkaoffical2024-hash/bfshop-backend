@echo off
chcp 65001 >nul
cd /d "%~dp0"

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              🚀 BFshop - Быстрый запуск                       ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Start backend
echo 🔧 Запуск Backend...
start "BFshop Backend" cmd /k "cd /d "%~dp0backend" && npm start"

REM Wait
echo ⏳ Ожидание 5 секунд...
timeout /t 5 /nobreak >nul

REM Start frontend
echo 🌐 Запуск Frontend...
start "BFshop Frontend" cmd /k "cd /d "%~dp0frontend" && python -m http.server 8080"

REM Wait
echo ⏳ Ожидание 3 секунды...
timeout /t 3 /nobreak >nul

REM Open browser
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
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Это окно можно закрыть.
echo Для остановки закройте окна Backend и Frontend.
echo.
pause
