@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════╗
echo ║   🚀 Быстрая настройка BFshop         ║
echo ╚════════════════════════════════════════╝
echo.

echo ✅ PostgreSQL уже установлен!
echo.

echo 📝 Сейчас создадим базу данных...
echo.
echo ⚠️  Вам нужно будет ввести пароль пользователя postgres
echo    (тот, который вы установили при установке PostgreSQL)
echo.
pause

echo.
echo 🗄️  Создание базы данных bfshop...
echo.

psql -U postgres -c "CREATE DATABASE bfshop;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ База данных создана!
    echo.
    echo 📊 Применение схемы...
    echo.
    
    psql -U postgres -d bfshop -f database\schema.sql
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ Схема применена! 9 таблиц созданы.
        echo.
        echo 📝 Теперь настройте файл .env
        echo.
        echo 1. Откройте: backend\.env.example
        echo 2. Скопируйте его в: backend\.env
        echo 3. Измените DATABASE_URL, укажите ваш пароль:
        echo    DATABASE_URL=postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/bfshop
        echo.
        echo 4. Заполните остальные поля:
        echo    JWT_SECRET=любой-случайный-текст-12345
        echo    SESSION_SECRET=другой-случайный-текст-67890
        echo.
        echo 5. Сохраните файл
        echo.
        echo 🚀 После этого запустите: START_BFSHOP.bat
        echo.
    ) else (
        echo.
        echo ❌ Ошибка при применении схемы
        echo.
    )
) else (
    echo.
    echo ⚠️  База данных уже существует или ошибка подключения
    echo.
    echo Попробуйте применить схему вручную:
    echo psql -U postgres -d bfshop -f database\schema.sql
    echo.
)

pause
