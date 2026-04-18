@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║           🎮 BFshop - Простая установка                       ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo.

set PGPATH=C:\Program Files\PostgreSQL\18\bin
set PSQL="%PGPATH%\psql.exe"

echo 📝 Инструкция:
echo.
echo    Сейчас откроется окно PostgreSQL.
echo    Вам нужно будет:
echo.
echo    1. Нажать Enter 4 раза (на всех вопросах)
echo    2. Ввести пароль postgres
echo    3. Дождаться создания базы данных
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause

echo.
echo 🗄️  Создание базы данных...
echo.

REM Create database using SQL file
%PSQL% -U postgres -f create_database.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ База данных создана!
    echo.
    echo 📊 Создание таблиц...
    echo.
    
    %PSQL% -U postgres -d bfshop -f database\schema.sql
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo.
        echo ╔════════════════════════════════════════════════════════════╗
        echo ║                                                            ║
        echo ║              ✅ ВСЁ ГОТОВО!                                ║
        echo ║                                                            ║
        echo ║  База данных создана, 9 таблиц готовы!                    ║
        echo ║                                                            ║
        echo ║  Теперь запустите: START_BFSHOP.bat                       ║
        echo ║                                                            ║
        echo ╚════════════════════════════════════════════════════════════╝
        echo.
    ) else (
        echo.
        echo ❌ Ошибка при создании таблиц
        echo.
        echo Попробуйте вручную:
        echo 1. Откройте SQL Shell (psql) из меню Пуск
        echo 2. Нажмите Enter 4 раза
        echo 3. Введите пароль
        echo 4. Скопируйте и вставьте:
        echo    \c bfshop
        echo    \i C:/Users/USER-PC/Desktop/sssssss/BFshop/database/schema.sql
        echo.
    )
) else (
    echo.
    echo ❌ Ошибка при создании базы данных
    echo.
    echo Попробуйте вручную через SQL Shell (psql):
    echo.
    echo 1. Откройте меню Пуск
    echo 2. Найдите "SQL Shell (psql)"
    echo 3. Запустите
    echo 4. Нажмите Enter 4 раза
    echo 5. Введите пароль postgres
    echo 6. Скопируйте эти команды по одной:
    echo.
    echo    DROP DATABASE IF EXISTS bfshop;
    echo    CREATE DATABASE bfshop;
    echo    \c bfshop
    echo    \i C:/Users/USER-PC/Desktop/sssssss/BFshop/database/schema.sql
    echo    \q
    echo.
)

pause
