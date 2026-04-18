@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════╗
echo ║   🔐 Настройка пароля PostgreSQL      ║
echo ╚════════════════════════════════════════╝
echo.

echo Файл .env уже создан!
echo.
echo Теперь нужно указать ваш пароль PostgreSQL.
echo.

set /p password="Введите пароль пользователя postgres: "

echo.
echo 📝 Обновление .env файла...

REM Create temporary file with updated password
(
echo # Database
echo # ⚠️ ВАЖНО: Замените "ваш_пароль" на реальный пароль пользователя postgres
echo DATABASE_URL=postgresql://postgres:%password%@localhost:5432/bfshop
echo.
echo # Server
echo PORT=3000
echo NODE_ENV=development
echo.
echo # JWT Secret
echo JWT_SECRET=bfshop-jwt-secret-key-12345-abcdef-ghijkl
echo.
echo # Session Secret
echo SESSION_SECRET=bfshop-session-secret-key-67890-mnopqr-stuvwx
echo.
echo # Frontend URL ^(for CORS^)
echo FRONTEND_URL=http://localhost:8080
echo.
echo # File Upload
echo MAX_FILE_SIZE=5242880
echo UPLOAD_DIR=./uploads
) > backend\.env

echo.
echo ✅ Пароль сохранён в backend\.env
echo.
echo 🗄️  Теперь создадим базу данных...
echo.

REM Set PostgreSQL path
set PGPATH=C:\Program Files\PostgreSQL\18\bin
set PSQL="%PGPATH%\psql.exe"

if not exist %PSQL% (
    echo ⚠️  psql не найден в стандартном месте
    echo    Запустите вручную: СОЗДАТЬ_БАЗУ_ДАННЫХ.bat
    echo.
    pause
    exit /b 0
)

%PSQL% -U postgres -c "DROP DATABASE IF EXISTS bfshop;"
%PSQL% -U postgres -c "CREATE DATABASE bfshop;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ База данных создана!
    echo.
    echo 📊 Применение схемы...
    echo.
    
    %PSQL% -U postgres -d bfshop -f database\schema.sql
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ Всё готово! 9 таблиц созданы.
        echo.
        echo 🚀 Теперь запустите: START_BFSHOP.bat
        echo.
    ) else (
        echo.
        echo ❌ Ошибка при применении схемы
        echo.
    )
) else (
    echo.
    echo ❌ Ошибка при создании базы данных
    echo    Проверьте пароль и попробуйте снова
    echo.
)

pause
