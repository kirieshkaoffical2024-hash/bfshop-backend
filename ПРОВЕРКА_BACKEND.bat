@echo off
chcp 65001 >nul
cd /d "%~dp0"

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              🔍 Проверка Backend                              ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo 📝 Проверка файлов...
echo.

if not exist "backend\.env" (
    echo ❌ Файл backend\.env не найден!
    echo.
    echo Создайте его:
    echo 1. Запустите: СУПЕР_ПРОСТОЙ_СБРОС.bat (от администратора)
    echo.
    pause
    exit /b 1
)

echo ✅ Файл .env найден
echo.

if not exist "backend\node_modules" (
    echo ❌ Зависимости не установлены!
    echo.
    echo Установка зависимостей...
    cd backend
    npm install
    cd ..
    echo.
)

echo ✅ Зависимости установлены
echo.

echo 📊 Проверка подключения к базе данных...
echo.

cd backend

node -e "const { Pool } = require('pg'); require('dotenv').config(); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()', (err, res) => { if (err) { console.log('❌ Ошибка подключения к БД:', err.message); process.exit(1); } else { console.log('✅ Подключение к БД успешно!'); console.log('   Время сервера:', res.rows[0].now); pool.end(); } });"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Не удалось подключиться к базе данных!
    echo.
    echo Возможные причины:
    echo 1. Неверный пароль в .env
    echo 2. База данных bfshop не создана
    echo 3. PostgreSQL не запущен
    echo.
    echo Решение:
    echo → Запустите: СУПЕР_ПРОСТОЙ_СБРОС.bat (от администратора)
    echo.
    cd ..
    pause
    exit /b 1
)

echo.
echo 🚀 Попытка запуска backend...
echo.
echo Если увидите ошибки - скопируйте их и сообщите.
echo.
pause

npm start

cd ..
