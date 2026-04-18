@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════╗
echo ║   🗄️  Создание базы данных BFshop    ║
echo ╚════════════════════════════════════════╝
echo.

REM Set PostgreSQL path
set PGPATH=C:\Program Files\PostgreSQL\18\bin
set PSQL="%PGPATH%\psql.exe"

echo 📍 PostgreSQL найден: %PGPATH%
echo.

REM Check if psql exists
if not exist %PSQL% (
    echo ❌ psql.exe не найден!
    echo.
    echo Попробуйте найти PostgreSQL вручную:
    echo - C:\Program Files\PostgreSQL\18\bin\psql.exe
    echo - C:\Program Files\PostgreSQL\17\bin\psql.exe
    echo - C:\Program Files\PostgreSQL\16\bin\psql.exe
    echo.
    pause
    exit /b 1
)

echo ✅ psql.exe найден
echo.
echo 🗄️  Создание базы данных...
echo.
echo ⚠️  Сейчас нужно будет ввести пароль postgres ДВА раза:
echo    1. Для удаления старой базы (если есть)
echo    2. Для создания новой базы
echo.
pause

REM Drop database if exists
echo.
echo 🗑️  Удаление старой базы данных (если есть)...
%PSQL% -U postgres -c "DROP DATABASE IF EXISTS bfshop;"

REM Create database
echo.
echo 📦 Создание базы данных bfshop...
%PSQL% -U postgres -c "CREATE DATABASE bfshop;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ База данных создана!
    echo.
    echo 📊 Применение схемы (создание таблиц)...
    echo    Введите пароль postgres ещё раз:
    echo.
    
    %PSQL% -U postgres -d bfshop -f database\schema.sql
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ╔════════════════════════════════════════════════════════════╗
        echo ║  ✅ ВСЁ ГОТОВО!                                            ║
        echo ╚════════════════════════════════════════════════════════════╝
        echo.
        echo ✅ База данных bfshop создана
        echo ✅ 9 таблиц созданы:
        echo    - users
        echo    - sessions
        echo    - listings
        echo    - orders
        echo    - chat_messages
        echo    - reviews
        echo    - notifications
        echo.
        echo 🚀 Теперь запустите: START_BFSHOP.bat
        echo.
    ) else (
        echo.
        echo ❌ Ошибка при создании таблиц
        echo.
    )
) else (
    echo.
    echo ❌ Ошибка при создании базы данных
    echo    Проверьте пароль и попробуйте снова
    echo.
)

pause
