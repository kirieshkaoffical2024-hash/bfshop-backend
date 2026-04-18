@echo off
chcp 65001 >nul
cd /d "%~dp0"

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              📊 Создание таблиц в базе данных                 ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set PGBIN=C:\Program Files\PostgreSQL\18\bin
set PSQL="%PGBIN%\psql.exe"

echo 📝 Сейчас будут созданы 9 таблиц в базе данных bfshop
echo.
echo Вам нужно будет ввести пароль postgres: 2306
echo.
pause

echo.
echo 📊 Создание таблиц...
echo.

%PSQL% -U postgres -d bfshop -f database\schema.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║                                                            ║
    echo ║              ✅ ТАБЛИЦЫ СОЗДАНЫ!                           ║
    echo ║                                                            ║
    echo ║  Создано 9 таблиц:                                        ║
    echo ║    - users                                                ║
    echo ║    - sessions                                             ║
    echo ║    - listings                                             ║
    echo ║    - orders                                               ║
    echo ║    - chat_messages                                        ║
    echo ║    - reviews                                              ║
    echo ║    - notifications                                        ║
    echo ║                                                            ║
    echo ║  Теперь перезапустите BFshop:                             ║
    echo ║  → Закройте окна Backend и Frontend                       ║
    echo ║  → Запустите: БЫСТРЫЙ_ЗАПУСК.bat                          ║
    echo ║                                                            ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
) else (
    echo.
    echo ❌ Ошибка при создании таблиц
    echo.
    echo Возможные причины:
    echo 1. Неверный пароль (должен быть: 2306)
    echo 2. База данных bfshop не существует
    echo.
    echo Решение:
    echo → Запустите: СУПЕР_ПРОСТОЙ_СБРОС.bat (от администратора)
    echo.
)

pause
