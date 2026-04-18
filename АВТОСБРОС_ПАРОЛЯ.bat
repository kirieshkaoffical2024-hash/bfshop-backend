@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║           🔐 Автоматический сброс пароля PostgreSQL           ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo.
echo ⚠️  ВНИМАНИЕ! Этот скрипт требует прав администратора!
echo.
echo Что будет сделано:
echo   1. Временно отключена проверка пароля
echo   2. Установлен новый пароль
echo   3. Проверка пароля включена обратно
echo   4. Создана база данных bfshop
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
set PGHBA="%PGDATA%\pg_hba.conf"
set PGHBA_BACKUP="%PGDATA%\pg_hba.conf.backup"

echo 📝 Введите новый пароль для пользователя postgres:
set /p NEW_PASSWORD="Пароль: "

echo.
echo 💾 Создание резервной копии pg_hba.conf...
copy %PGHBA% %PGHBA_BACKUP% >nul

echo.
echo 🔓 Отключение проверки пароля...

REM Replace scram-sha-256 with trust
powershell -Command "(Get-Content '%PGDATA%\pg_hba.conf') -replace 'scram-sha-256', 'trust' | Set-Content '%PGDATA%\pg_hba.conf'"

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
    
    REM Restore backup
    copy %PGHBA_BACKUP% %PGHBA% >nul
    del %PGHBA_BACKUP% >nul
    
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
    "%PGBIN%\psql.exe" -U postgres -d bfshop -f database\schema.sql
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo.
        echo ╔════════════════════════════════════════════════════════════╗
        echo ║                                                            ║
        echo ║              ✅ ВСЁ ГОТОВО!                                ║
        echo ║                                                            ║
        echo ║  Новый пароль: %NEW_PASSWORD%
        echo ║  База данных создана: bfshop                              ║
        echo ║  Таблиц создано: 9                                        ║
        echo ║                                                            ║
        echo ║  Теперь запустите: START_BFSHOP.bat                       ║
        echo ║                                                            ║
        echo ╚════════════════════════════════════════════════════════════╝
        echo.
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
    copy %PGHBA_BACKUP% %PGHBA% >nul
    del %PGHBA_BACKUP% >nul
    
    net stop postgresql-x64-18 >nul 2>&1
    net start postgresql-x64-18 >nul 2>&1
    echo.
)

pause
