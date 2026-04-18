@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║           🔐 Простой сброс пароля PostgreSQL                  ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo.
echo Этот скрипт поможет вам сбросить пароль PostgreSQL.
echo.
echo ⚠️  ВАЖНО: Запустите этот файл от имени администратора!
echo    (Правой кнопкой → "Запуск от имени администратора")
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

echo.
echo ✅ Права администратора получены
echo.

set PGDATA=C:\Program Files\PostgreSQL\18\data
set PGBIN=C:\Program Files\PostgreSQL\18\bin

echo 📝 Введите новый пароль для пользователя postgres:
set /p NEW_PASSWORD="Пароль: "

echo.
echo 💾 Создание резервной копии pg_hba.conf...
copy "%PGDATA%\pg_hba.conf" "%PGDATA%\pg_hba.conf.backup" >nul

echo.
echo 🔓 Отключение проверки пароля...
echo    (Изменение файла pg_hba.conf)

REM Create temp file with trust authentication
(
echo # TYPE  DATABASE        USER            ADDRESS                 METHOD
echo # IPv4 local connections:
echo host    all             all             127.0.0.1/32            trust
echo # IPv6 local connections:
echo host    all             all             ::1/128                 trust
echo # Allow replication connections from localhost
echo host    replication     all             127.0.0.1/32            trust
echo host    replication     all             ::1/128                 trust
) > "%PGDATA%\pg_hba_temp.conf"

REM Backup original and use temp
move /Y "%PGDATA%\pg_hba.conf" "%PGDATA%\pg_hba_original.conf" >nul
move /Y "%PGDATA%\pg_hba_temp.conf" "%PGDATA%\pg_hba.conf" >nul

echo.
echo 🔄 Перезапуск PostgreSQL...
net stop postgresql-x64-18 >nul 2>&1
timeout /t 2 /nobreak >nul
net start postgresql-x64-18 >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo 🔐 Установка нового пароля...

"%PGBIN%\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD '%NEW_PASSWORD%';"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Пароль изменён!
    echo.
    echo 🔒 Восстановление проверки пароля...
    
    REM Restore original pg_hba.conf
    move /Y "%PGDATA%\pg_hba_original.conf" "%PGDATA%\pg_hba.conf" >nul
    
    echo.
    echo 🔄 Перезапуск PostgreSQL...
    net stop postgresql-x64-18 >nul 2>&1
    timeout /t 2 /nobreak >nul
    net start postgresql-x64-18 >nul 2>&1
    timeout /t 3 /nobreak >nul
    
    echo.
    echo 📝 Обновление .env файла...
    
    REM Update .env file
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
    echo 🗄️  Создание базы данных...
    echo.
    
    "%PGBIN%\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS bfshop;"
    "%PGBIN%\psql.exe" -U postgres -c "CREATE DATABASE bfshop;"
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ База данных создана!
        echo.
        echo 📊 Создание таблиц...
        echo.
        
        "%PGBIN%\psql.exe" -U postgres -d bfshop -f database\schema.sql
        
        if %ERRORLEVEL% EQU 0 (
            echo.
            echo.
            echo ╔════════════════════════════════════════════════════════════╗
            echo ║                                                            ║
            echo ║              ✅ ВСЁ ГОТОВО!                                ║
            echo ║                                                            ║
            echo ║  Новый пароль: %NEW_PASSWORD%
            echo ║  База данных: bfshop                                      ║
            echo ║  Таблиц создано: 9                                        ║
            echo ║                                                            ║
            echo ║  Теперь запустите: START_BFSHOP.bat                       ║
            echo ║                                                            ║
            echo ╚════════════════════════════════════════════════════════════╝
            echo.
        ) else (
            echo.
            echo ⚠️  База создана, но ошибка при создании таблиц
            echo    Попробуйте запустить: ПРОСТАЯ_УСТАНОВКА.bat
            echo.
        )
    ) else (
        echo.
        echo ⚠️  Пароль изменён, но не удалось создать базу данных
        echo    Попробуйте запустить: ПРОСТАЯ_УСТАНОВКА.bat
        echo.
    )
) else (
    echo.
    echo ❌ Ошибка при изменении пароля
    echo.
    echo 🔙 Восстановление резервной копии...
    if exist "%PGDATA%\pg_hba_original.conf" (
        move /Y "%PGDATA%\pg_hba_original.conf" "%PGDATA%\pg_hba.conf" >nul
    )
    
    net stop postgresql-x64-18 >nul 2>&1
    net start postgresql-x64-18 >nul 2>&1
    echo.
)

REM Cleanup
if exist "%PGDATA%\pg_hba.conf.backup" del "%PGDATA%\pg_hba.conf.backup" >nul

pause
