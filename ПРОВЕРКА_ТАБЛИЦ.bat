@echo off
chcp 65001 >nul
cd /d "%~dp0"

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              🔍 Проверка таблиц базы данных                   ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set PGBIN=C:\Program Files\PostgreSQL\18\bin
set PSQL="%PGBIN%\psql.exe"

echo 📊 Проверка таблиц в базе данных bfshop...
echo.
echo Введите пароль postgres:
echo.

%PSQL% -U postgres -d bfshop -c "\dt"

echo.
echo.
echo Должны быть эти таблицы:
echo   - users
echo   - sessions
echo   - listings
echo   - orders
echo   - chat_messages
echo   - reviews
echo   - notifications
echo.
echo Всего: 7 таблиц
echo.

%PSQL% -U postgres -d bfshop -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

echo.
echo.
echo Если таблиц нет или меньше 7:
echo → Запустите: СУПЕР_ПРОСТОЙ_СБРОС.bat (от администратора)
echo.
pause
