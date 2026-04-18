# 🎮 BFshop - Маркетплейс для Blox Fruits

## 📋 Описание

BFshop - это полноценный маркетплейс для торговли предметами Blox Fruits. Оплата происходит фруктами (не реальными деньгами), что делает торговлю безопасной и удобной.

## ✨ Возможности

### 👤 Система пользователей
- ✅ Регистрация и вход
- ✅ Загрузка аватара
- ✅ Профиль с рейтингом
- ✅ Сохранение сессии (30 дней)

### 🛒 Торговля
- ✅ 4 типа товаров:
  - 🎮 **Аккаунты** - продажа аккаунтов с уровнем и фруктами
  - ⚡ **Прокачка** - услуги по прокачке уровня
  - 🗡️ **Квесты** - прохождение рейдов и данжей
  - 👹 **Боссы** - призыв боссов
- ✅ Поиск и фильтры
- ✅ Детальное описание товаров
- ✅ Оплата фруктами (Leopard, Dragon, Dough и др.)

### 💬 Чат
- ✅ Чат в реальном времени (WebSocket)
- ✅ Обсуждение оплаты с продавцом
- ✅ История сообщений

### 📦 Заказы
- ✅ Создание заказа
- ✅ Покупатель отправляет фрукт в игре
- ✅ Продавец подтверждает получение
- ✅ Автоматическое завершение сделки

### ⭐ Отзывы
- ✅ Рейтинг 0-5 звезд
- ✅ Текстовые комментарии
- ✅ Отображение на профиле
- ✅ Средний рейтинг продавца

## 🎨 Дизайн

Современная темная тема:
- 🌑 Темно-синий фон (#0f0f1e)
- ❤️ Красно-розовый акцент (#e94560)
- ✨ Плавные анимации
- 📱 Адаптивный дизайн
- 🚫 Без градиентов и радуги (как вы просили!)

## 🚀 Быстрый запуск

### Вариант 1: Автоматический (Windows)

Просто запустите:
```bash
START_BFSHOP.bat
```

Скрипт автоматически:
1. Проверит Node.js и PostgreSQL
2. Установит зависимости
3. Запустит backend и frontend
4. Откроет браузер

### Вариант 2: Ручной запуск

#### 1. Установите зависимости
```bash
cd BFshop/backend
npm install
```

#### 2. Настройте PostgreSQL
```bash
# Создайте базу данных
psql -U postgres
CREATE DATABASE bfshop;
\q

# Примените схему
psql -U postgres -d bfshop < ../database/schema.sql
```

#### 3. Настройте .env
```bash
cd backend
copy .env.example .env
notepad .env
```

Измените:
```env
DATABASE_URL=postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/bfshop
JWT_SECRET=случайный-секретный-ключ
SESSION_SECRET=случайный-ключ-сессии
PORT=3000
```

#### 4. Запустите backend
```bash
npm start
```

#### 5. Запустите frontend (в новом окне)
```bash
cd ../frontend
python -m http.server 8080
```

#### 6. Откройте браузер
```
http://localhost:8080
```

## 📁 Структура проекта

```
BFshop/
├── backend/                    # Backend (Node.js + Express)
│   ├── routes/                # API маршруты
│   │   ├── auth.js           # Регистрация/вход
│   │   ├── users.js          # Профили
│   │   ├── listings.js       # Товары
│   │   ├── orders.js         # Заказы
│   │   ├── reviews.js        # Отзывы
│   │   └── chat.js           # Чат
│   ├── middleware/           # Middleware
│   │   ├── auth.js          # JWT авторизация
│   │   └── upload.js        # Загрузка файлов
│   ├── server.js            # Главный сервер
│   ├── database.js          # Подключение к БД
│   └── package.json         # Зависимости
│
├── frontend/                  # Frontend (HTML/CSS/JS)
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css    # Все стили
│   │   └── js/
│   │       ├── app.js       # API клиент
│   │       ├── auth.js      # Авторизация
│   │       ├── listings.js  # Товары
│   │       ├── profile.js   # Профиль
│   │       ├── orders.js    # Заказы
│   │       ├── create-listing.js  # Создание товара
│   │       ├── listing-details.js # Детали товара
│   │       └── chat-client.js     # Чат
│   ├── index.html           # Главная страница
│   ├── login.html           # Вход/регистрация
│   ├── profile.html         # Профиль
│   ├── orders.html          # Мои заказы
│   ├── create-listing.html  # Создать товар
│   ├── listing.html         # Страница товара
│   └── chat.html            # Чат
│
├── database/
│   └── schema.sql           # Схема БД
│
├── START_BFSHOP.bat         # Автозапуск (Windows)
├── COMPLETE_SETUP.md        # Полная инструкция
├── README.md                # Описание (English)
└── README_RU.md             # Описание (Русский)
```

## 🔧 Технологии

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - База данных
- **Socket.IO** - WebSocket для чата
- **JWT** - Авторизация
- **Bcrypt** - Хеширование паролей
- **Multer** - Загрузка файлов

### Frontend
- **HTML5** - Разметка
- **CSS3** - Стили (темная тема)
- **JavaScript** - Логика
- **Socket.IO Client** - WebSocket клиент
- **Fetch API** - HTTP запросы

### База данных
- **PostgreSQL** - 9 таблиц
- **Индексы** - Для быстрого поиска
- **Foreign Keys** - Связи между таблицами

## 📊 База данных

### Таблицы:
1. **users** - Пользователи
2. **sessions** - Сессии
3. **listings** - Товары
4. **orders** - Заказы
5. **chat_messages** - Сообщения
6. **reviews** - Отзывы
7. **notifications** - Уведомления

## 🌐 Деплой на реальный сервер

### Railway (БЕСПЛАТНО!)

1. Зарегистрируйтесь: https://railway.app
2. Установите CLI:
```bash
npm install -g @railway/cli
```

3. Войдите:
```bash
railway login
```

4. Создайте проект:
```bash
cd BFshop/backend
railway init
```

5. Добавьте PostgreSQL:
```bash
railway add postgresql
```

6. Деплой:
```bash
railway up
```

7. Получите URL:
```bash
railway domain
```

**Готово!** Ваш сайт доступен по ссылке!

### Heroku

```bash
heroku create bfshop-api
heroku addons:create heroku-postgresql:mini
git push heroku main
```

## 🧪 Как протестировать

### 1. Регистрация
- Откройте http://localhost:8080/login.html
- Нажмите "Sign Up"
- Введите логин и пароль
- Загрузите аватар (опционально)

### 2. Создание товара
- Нажмите "Sell" в меню
- Выберите тип (Аккаунт/Прокачка/Квест/Босс)
- Заполните описание
- Укажите цену в фруктах
- Отправьте

### 3. Покупка
- Найдите товар на главной
- Нажмите "Buy Now"
- Подтвердите покупку
- Откроется чат с продавцом

### 4. Чат
- Обсудите оплату
- Покупатель отправляет фрукт в игре
- Продавец подтверждает получение

### 5. Подтверждение
- Продавец нажимает "Confirm Order"
- Заказ завершается
- Покупатель может оставить отзыв

### 6. Отзыв
- Поставьте оценку 0-5 звезд
- Напишите комментарий
- Отправьте

## 🐛 Решение проблем

### Ошибка подключения к БД
```bash
# Проверьте, что PostgreSQL запущен
pg_isready

# Проверьте строку подключения в .env
DATABASE_URL=postgresql://postgres:пароль@localhost:5432/bfshop
```

### Порт занят
```bash
# Убейте процесс на порту 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Или используйте другой порт в .env
PORT=3001
```

### CORS ошибка
```bash
# Убедитесь, что FRONTEND_URL в .env совпадает с URL frontend
FRONTEND_URL=http://localhost:8080
```

### WebSocket не подключается
```javascript
// Проверьте URL в chat-client.js
const SOCKET_URL = 'http://localhost:3000';
```

### Не загружается аватар
```bash
# Создайте папку uploads
mkdir backend\uploads
```

## 📝 API Endpoints

### Авторизация
```
POST   /api/auth/register     - Регистрация
POST   /api/auth/login        - Вход
GET    /api/auth/me           - Текущий пользователь
```

### Пользователи
```
GET    /api/users/:id         - Профиль пользователя
POST   /api/users/avatar      - Загрузить аватар
```

### Товары
```
GET    /api/listings          - Все товары
GET    /api/listings/:id      - Один товар
POST   /api/listings          - Создать товар
PUT    /api/listings/:id      - Обновить товар
DELETE /api/listings/:id      - Удалить товар
```

### Заказы
```
GET    /api/orders            - Мои заказы
GET    /api/orders/:id        - Один заказ
POST   /api/orders            - Создать заказ
POST   /api/orders/:id/confirm - Подтвердить заказ
```

### Отзывы
```
GET    /api/reviews/:userId   - Отзывы пользователя
POST   /api/reviews           - Оставить отзыв
```

### Чат
```
GET    /api/chat/:orderId     - История чата
POST   /api/chat/:orderId     - Отправить сообщение
```

## 🎯 Что дальше?

### Возможные улучшения:
1. **Загрузка картинок** - для товаров
2. **Поиск** - полнотекстовый поиск
3. **Уведомления** - в реальном времени
4. **Админ панель** - модерация
5. **Инвентарь фруктов** - учет фруктов пользователя
6. **История сделок** - полный лог
7. **Система споров** - разрешение конфликтов
8. **Email верификация** - подтверждение почты
9. **2FA** - двухфакторная аутентификация
10. **Мобильное приложение** - React Native

## 📄 Лицензия

MIT License - свободно используйте и изменяйте!

## 🆘 Помощь

Если нужна помощь:
1. Прочитайте `COMPLETE_SETUP.md`
2. Проверьте логи в консоли
3. Проверьте подключение к БД
4. Проверьте .env файл

## 🎉 Готово!

Ваш BFshop готов к работе!

**Локальные URL:**
- Frontend: http://localhost:8080
- Backend: http://localhost:3000
- API Health: http://localhost:3000/api/health

**Удачной торговли!** 🎮🍎
