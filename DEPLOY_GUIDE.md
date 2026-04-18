# 🚀 Руководство по деплою BFshop на реальный сервер

## Вариант 1: Railway.app (РЕКОМЕНДУЕТСЯ - БЕСПЛАТНО!)

### Шаг 1: Подготовка
1. Зарегистрируйтесь на https://railway.app
2. Установите Railway CLI: `npm install -g @railway/cli`
3. Войдите: `railway login`

### Шаг 2: Создание проекта
```bash
cd BFshop/backend
railway init
railway add postgresql
```

### Шаг 3: Настройка переменных
```bash
railway variables set JWT_SECRET=your-secret-key
railway variables set SESSION_SECRET=your-session-key
railway variables set FRONTEND_URL=https://your-domain.railway.app
```

### Шаг 4: Деплой
```bash
railway up
```

### Шаг 5: Применить схему БД
```bash
railway run psql < ../database/schema.sql
```

**Готово!** Ваш сервер работает на https://your-project.railway.app

---

## Вариант 2: Heroku

### Шаг 1: Установка
```bash
npm install -g heroku
heroku login
```

### Шаг 2: Создание приложения
```bash
cd BFshop/backend
heroku create bfshop-api
heroku addons:create heroku-postgresql:mini
```

### Шаг 3: Настройка
```bash
heroku config:set JWT_SECRET=your-secret
heroku config:set SESSION_SECRET=your-session
heroku config:set FRONTEND_URL=https://bfshop.herokuapp.com
```

### Шаг 4: Деплой
```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

### Шаг 5: БД
```bash
heroku pg:psql < ../database/schema.sql
```

---

## Вариант 3: DigitalOcean (Платно, но мощно)

### Шаг 1: Создание Droplet
1. Зайдите на https://digitalocean.com
2. Create → Droplets
3. Выберите Ubuntu 22.04
4. Выберите план ($6/месяц минимум)
5. Создайте SSH ключ

### Шаг 2: Подключение
```bash
ssh root@your-droplet-ip
```

### Шаг 3: Установка зависимостей
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Nginx
apt-get install -y nginx

# PM2
npm install -g pm2
```

### Шаг 4: Настройка PostgreSQL
```bash
sudo -u postgres psql
CREATE DATABASE bfshop;
CREATE USER bfshop_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE bfshop TO bfshop_user;
\q
```

### Шаг 5: Загрузка кода
```bash
cd /var/www
git clone your-repo-url bfshop
cd bfshop/backend
npm install
```

### Шаг 6: Настройка .env
```bash
nano .env
```
Вставьте:
```
DATABASE_URL=postgresql://bfshop_user:your-password@localhost:5432/bfshop
PORT=3000
JWT_SECRET=your-secret
SESSION_SECRET=your-session
FRONTEND_URL=https://your-domain.com
```

### Шаг 7: Применить схему БД
```bash
psql -U bfshop_user -d bfshop < ../database/schema.sql
```

### Шаг 8: Запуск с PM2
```bash
pm2 start server.js --name bfshop-api
pm2 save
pm2 startup
```

### Шаг 9: Настройка Nginx
```bash
nano /etc/nginx/sites-available/bfshop
```

Вставьте:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/bfshop/frontend;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/bfshop /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Шаг 10: SSL (HTTPS)
```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

**Готово!** Сайт работает на https://your-domain.com

---

## Вариант 4: Vercel (для фронтенда) + Railway (для бэкенда)

### Фронтенд на Vercel:
```bash
cd BFshop/frontend
npm install -g vercel
vercel
```

### Бэкенд на Railway:
См. Вариант 1

---

## 🔧 После деплоя

### 1. Создайте админа
```bash
# Подключитесь к БД
psql $DATABASE_URL

# Создайте админа
INSERT INTO users (username, password_hash, email, balance_fruits) 
VALUES ('admin', '$2b$10$...', 'admin@bfshop.com', '{"Leopard": 100}');
```

### 2. Настройте домен
- Купите домен на Namecheap/GoDaddy
- Настройте DNS на IP сервера
- Настройте SSL

### 3. Мониторинг
```bash
# Логи PM2
pm2 logs bfshop-api

# Статус
pm2 status

# Перезапуск
pm2 restart bfshop-api
```

---

## 📊 Рекомендации по производительности

### 1. Кэширование
Установите Redis:
```bash
apt-get install -y redis-server
npm install redis
```

### 2. CDN для картинок
Используйте Cloudflare или AWS S3

### 3. Backup БД
```bash
# Автоматический backup
crontab -e
```
Добавьте:
```
0 2 * * * pg_dump bfshop > /backups/bfshop_$(date +\%Y\%m\%d).sql
```

---

## 🔒 Безопасность

### 1. Firewall
```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 2. Fail2ban
```bash
apt-get install -y fail2ban
systemctl enable fail2ban
```

### 3. Обновления
```bash
apt-get update && apt-get upgrade -y
```

---

## 💰 Стоимость

| Вариант | Стоимость | Производительность |
|---------|-----------|-------------------|
| Railway | $0-5/мес | Отлично для старта |
| Heroku | $7/мес | Хорошо |
| DigitalOcean | $6-12/мес | Отлично |
| Vercel + Railway | $0-10/мес | Отлично |

---

## 🆘 Помощь

Если возникли проблемы:
1. Проверьте логи: `pm2 logs`
2. Проверьте БД: `psql $DATABASE_URL`
3. Проверьте Nginx: `nginx -t`
4. Проверьте порты: `netstat -tulpn`

---

**Готово!** Ваш BFshop работает на реальном сервере! 🎉
