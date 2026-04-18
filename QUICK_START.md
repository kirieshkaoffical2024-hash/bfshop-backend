# ⚡ Быстрый старт BFshop

## 🚀 За 5 минут до запуска!

### Шаг 1: Установка (1 мин)
```bash
# Клонируйте проект
cd BFshop/backend

# Установите зависимости
npm install
```

### Шаг 2: База данных (2 мин)
```bash
# Установите PostgreSQL (если нет)
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Создайте БД
psql -U postgres
CREATE DATABASE bfshop;
\q

# Примените схему
psql -U postgres -d bfshop < ../database/schema.sql
```

### Шаг 3: Настройка (1 мин)
```bash
# Скопируйте .env
cp .env.example .env

# Отредактируйте .env
nano .env
```

Измените:
```
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/bfshop
JWT_SECRET=any-random-string-here
SESSION_SECRET=another-random-string
```

### Шаг 4: Запуск (1 мин)
```bash
# Запустите сервер
npm start

# Откройте браузер
# http://localhost:3000
```

**Готово!** 🎉

---

## 📁 Полная структура файлов

Я создал базовую структуру. Вот что нужно добавить:

### Backend файлы (создайте сами):

**BFshop/backend/server.js** - основной сервер
**BFshop/backend/database.js** - подключение к БД
**BFshop/backend/auth.js** - авторизация
**BFshop/backend/routes/users.js** - роуты пользователей
**BFshop/backend/routes/listings.js** - роуты товаров
**BFshop/backend/routes/orders.js** - роуты заказов
**BFshop/backend/routes/chat.js** - роуты чата

### Frontend файлы (создайте сами):

**BFshop/frontend/index.html** - главная страница
**BFshop/frontend/login.html** - вход/регистрация
**BFshop/frontend/profile.html** - профиль
**BFshop/frontend/listing.html** - страница товара
**BFshop/frontend/create-listing.html** - создание товара
**BFshop/frontend/chat.html** - чат
**BFshop/frontend/assets/css/style.css** - стили
**BFshop/frontend/assets/js/app.js** - JavaScript

---

## 🎨 Дизайн концепция

### Цветовая схема:
- Основной: `#1a1a2e` (темно-синий)
- Акцент: `#16213e` (синий)
- Подсветка: `#0f3460` (светло-синий)
- Текст: `#e94560` (красный/розовый)
- Фон: `#0f0f1e` (почти черный)

### Шрифты:
- Заголовки: Inter Bold
- Текст: Inter Regular

### Компоненты:
- Карточки с тенью и hover эффектом
- Плавные анимации (0.3s ease)
- Скругленные углы (8px)
- Градиенты для кнопок

---

## 🔥 Основные функции

### 1. Регистрация/Вход
- Email + пароль
- Загрузка аватарки
- Сессия сохраняется

### 2. Создание товара
Типы:
- 🎮 Аккаунт (уровень, фрукты, статы)
- ⚡ Прокачка (с X до Y уровня)
- 🗡️ Квесты (рейды, данжи)
- 👹 Боссы (призыв и убийство)

### 3. Покупка
1. Покупатель выбирает товар
2. Открывается чат с продавцом
3. Покупатель предлагает фрукт
4. Продавец подтверждает
5. Автоматическая передача

### 4. Отзывы
- Рейтинг 0-5 звезд
- Комментарий
- Показывается в профиле

---

## 📝 TODO список

Создайте эти файлы для полного функционала:

### Backend:
- [ ] server.js - Express сервер
- [ ] database.js - PostgreSQL подключение
- [ ] auth.js - JWT авторизация
- [ ] routes/users.js - CRUD пользователей
- [ ] routes/listings.js - CRUD товаров
- [ ] routes/orders.js - CRUD заказов
- [ ] routes/chat.js - WebSocket чат
- [ ] middleware/auth.js - проверка токена
- [ ] middleware/upload.js - загрузка файлов

### Frontend:
- [ ] index.html - главная с товарами
- [ ] login.html - вход/регистрация
- [ ] profile.html - профиль пользователя
- [ ] listing.html - страница товара
- [ ] create-listing.html - создание товара
- [ ] chat.html - чат с продавцом
- [ ] style.css - все стили
- [ ] app.js - API запросы
- [ ] chat.js - WebSocket клиент

---

## 🌐 API Endpoints

```
POST   /api/auth/register     - Регистрация
POST   /api/auth/login        - Вход
GET    /api/auth/me           - Текущий пользователь
POST   /api/auth/logout       - Выход

GET    /api/users/:id         - Профиль пользователя
PUT    /api/users/:id         - Обновить профиль
POST   /api/users/:id/avatar  - Загрузить аватарку

GET    /api/listings          - Все товары
GET    /api/listings/:id      - Один товар
POST   /api/listings          - Создать товар
PUT    /api/listings/:id      - Обновить товар
DELETE /api/listings/:id      - Удалить товар

GET    /api/orders            - Мои заказы
POST   /api/orders            - Создать заказ
PUT    /api/orders/:id        - Обновить статус
POST   /api/orders/:id/confirm - Подтвердить

GET    /api/chat/:orderId     - История чата
POST   /api/chat/:orderId     - Отправить сообщение

POST   /api/reviews           - Оставить отзыв
GET    /api/reviews/:userId   - Отзывы пользователя
```

---

## 💡 Хотите готовый код?

Я создал структуру и схему БД. Для полного кода всех файлов:

1. Используйте эту структуру как основу
2. Следуйте API endpoints
3. Используйте схему БД
4. Следуйте дизайн концепции

Или скажите какой конкретный файл создать первым, и я его напишу полностью!

---

**Удачи с BFshop!** 🚀
