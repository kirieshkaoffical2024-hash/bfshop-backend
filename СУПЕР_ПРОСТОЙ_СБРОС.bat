@echo off
chcp 65001 >nul

REM Change to script directory
cd /d "%~dp0"

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║           🔐 Супер простой сброс пароля                       ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo.
echo Этот скрипт установит пароль: postgres123
echo.
echo Если хотите другой пароль - отредактируйте этот файл в блокноте
echo и измените строку: set NEW_PASSWORD=postgres123
echo.
echo ⚠️  ВАЖНО: Запустите от имени администратора!
echo.
pause

REM Check for admin rights
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Нужны права администратора!
    echo.
    echo Закройте это окно и запустите файл правой кнопкой:
    echo "Запуск от имени администратора"
    echo.
    pause
    exit /b 1
)

REM ═══════════════════════════════════════════════════════════════
REM   ИЗМЕНИТЕ ПАРОЛЬ ЗДЕСЬ (если хотите другой):
REM ═══════════════════════════════════════════════════════════════
set NEW_PASSWORD=postgres123
REM ═══════════════════════════════════════════════════════════════

echo.
echo ✅ Права администратора получены
echo.
echo 🔐 Новый пароль будет: %NEW_PASSWORD%
echo.

set PGDATA=C:\Program Files\PostgreSQL\18\data
set PGBIN=C:\Program Files\PostgreSQL\18\bin
set PGPASSWORD=%NEW_PASSWORD%

echo 💾 Создание резервной копии pg_hba.conf...
copy "%PGDATA%\pg_hba.conf" "%PGDATA%\pg_hba.conf.backup" >nul

echo.
echo 🔓 Отключение проверки пароля...

REM Create minimal pg_hba.conf with trust
(
echo # TYPE  DATABASE        USER            ADDRESS                 METHOD
echo host    all             all             127.0.0.1/32            trust
echo host    all             all             ::1/128                 trust
echo local   all             all                                     trust
) > "%PGDATA%\pg_hba_new.conf"

move /Y "%PGDATA%\pg_hba.conf" "%PGDATA%\pg_hba_old.conf" >nul
move /Y "%PGDATA%\pg_hba_new.conf" "%PGDATA%\pg_hba.conf" >nul

echo.
echo 🔄 Перезапуск PostgreSQL...
net stop postgresql-x64-18
timeout /t 2 /nobreak >nul
net start postgresql-x64-18
timeout /t 3 /nobreak >nul

echo.
echo 🔐 Установка нового пароля...
echo.

REM Set password without prompting
"%PGBIN%\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD '%NEW_PASSWORD%';"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Пароль успешно изменён на: %NEW_PASSWORD%
    echo.
    echo 🔒 Восстановление проверки пароля...
    
    move /Y "%PGDATA%\pg_hba_old.conf" "%PGDATA%\pg_hba.conf" >nul
    
    echo.
    echo 🔄 Перезапуск PostgreSQL...
    net stop postgresql-x64-18
    timeout /t 2 /nobreak >nul
    net start postgresql-x64-18
    timeout /t 3 /nobreak >nul
    
    echo.
    echo 📝 Обновление .env файла...
    
    (
    echo # Database
    echo DATABASE_URL=postgresql://postgres:%NEW_PASSWORD%@localhost:5432/bfshop
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
    echo ✅ Файл .env обновлён!
    echo.
    echo 🗄️  Создание базы данных bfshop...
    echo.
    
    "%PGBIN%\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS bfshop;"
    "%PGBIN%\psql.exe" -U postgres -c "CREATE DATABASE bfshop;"
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ База данных создана!
        echo.
        echo 📊 Создание таблиц (это займёт несколько секунд)...
        echo.
        
        "%PGBIN%\psql.exe" -U postgres -d bfshop -f database\schema.sql
        
        if %ERRORLEVEL% EQU 0 (
            echo.
            echo.
            echo ╔════════════════════════════════════════════════════════════╗
            echo ║                                                            ║
            echo ║              🎉 ВСЁ ГОТОВО!                                ║
            echo ║                                                            ║
            echo ║  ✅ Пароль PostgreSQL: %NEW_PASSWORD%
            echo ║  ✅ База данных: bfshop                                   ║
            echo ║  ✅ Таблиц создано: 9                                     ║
            echo ║  ✅ Файл .env настроен                                    ║
            echo ║                                                            ║
            echo ║  🚀 Теперь запустите: START_BFSHOP.bat                    ║
            echo ║                                                            ║
            echo ╚════════════════════════════════════════════════════════════╝
            echo.
            echo.
            echo 📝 Запомните пароль: %NEW_PASSWORD%
            echo.
        ) else (
            echo.
            echo ⚠️  База создана, но ошибка при создании таблиц
            echo.
        )
    ) else (
        echo.
        echo ⚠️  Пароль изменён, но не удалось создать базу данных
        echo.
    )
) else (
    echo.
    echo ❌ Ошибка при изменении пароля
    echo.
    if exist "%PGDATA%\pg_hba_old.conf" (
        move /Y "%PGDATA%\pg_hba_old.conf" "%PGDATA%\pg_hba.conf" >nul
    )
    net stop postgresql-x64-18
    net start postgresql-x64-18
)

REM Cleanup
if exist "%PGDATA%\pg_hba.conf.backup" del "%PGDATA%\pg_hba.conf.backup"
if exist "%PGDATA%\pg_hba_old.conf" del "%PGDATA%\pg_hba_old.conf"
if exist "%PGDATA%\pg_hba_new.conf" del "%PGDATA%\pg_hba_new.conf"

echo.
pause
