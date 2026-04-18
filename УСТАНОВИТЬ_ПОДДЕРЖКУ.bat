@echo off
chcp 65001 >nul
cls

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              🛡️ УСТАНОВКА СИСТЕМЫ ПОДДЕРЖКИ                  ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 📋 Что будет установлено:
echo.
echo ✅ Система жалоб на скамеров
echo ✅ Админ-панель для Tmka
echo ✅ Система банов пользователей
echo ✅ Защита аккаунтов
echo.
echo 💡 Нажмите любую клавишу для продолжения...
pause >nul

cd /d "%~dp0"

echo.
echo 📊 Применяем обновления к базе данных...
echo.

"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d bfshop -f "database\add_support_system.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════════╗
    echo ║                                                                ║
    echo ║              ✅ СИСТЕМА ПОДДЕРЖКИ УСТАНОВЛЕНА!                ║
    echo ║                                                                ║
    echo ╚════════════════════════════════════════════════════════════════╝
    echo.
    echo 🎉 Новые функции:
    echo.
    echo 👤 Для обычных пользователей:
    echo    • Страница поддержки: http://localhost:8080/support.html
    echo    • Жалобы на скамеров
    echo    • Просмотр своих жалоб
    echo.
    echo 👑 Для администратора Tmka:
    echo    • Админ-панель: http://localhost:8080/admin.html
    echo    • Просмотр всех жалоб
    echo    • Бан пользователей
    echo    • Ответы на жалобы
    echo    • Управление пользователями
    echo.
    echo 🔐 Создание админа Tmka:
    echo.
    echo    1. Зарегистрируйтесь с ником "Tmka"
    echo    2. Или выполните SQL:
    echo.
    echo    UPDATE users SET is_admin = true WHERE username = 'Tmka';
    echo.
    echo 📖 Инструкции:
    echo    • Как пользоваться: 🎉_НОВЫЕ_ФУНКЦИИ.txt
    echo    • Реальный сервер 24/7: 🌐_РЕАЛЬНЫЙ_СЕРВЕР_24-7.md
    echo.
) else (
    echo.
    echo ❌ Ошибка при установке
    echo.
    echo Возможные причины:
    echo 1. PostgreSQL не запущен
    echo 2. База данных bfshop не существует
    echo 3. Неверный пароль
    echo.
    echo Решение:
    echo 1. Запустите PostgreSQL
    echo 2. Создайте базу: СОЗДАТЬ_БАЗУ_ДАННЫХ.bat
    echo 3. Попробуйте снова
)

echo.
pause
