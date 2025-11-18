# Пример настроек окружения (.env)

Скопируйте этот файл в `.env` и заполните реальными значениями.

## База данных

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dentist_app?schema=public"
```

**Описание:** Строка подключения к PostgreSQL базе данных.
**Формат:** `postgresql://username:password@host:port/database?schema=public`

---

## JWT (JSON Web Token)

```env
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

**Описание:**
- `JWT_SECRET` - секретный ключ для подписи JWT токенов. **ВАЖНО:** Используйте сложный случайный ключ в продакшене!
- `JWT_EXPIRES_IN` - время жизни токена (например: `7d` = 7 дней, `24h` = 24 часа, `60m` = 60 минут)

---

## Сервер

```env
PORT=3001
```

**Описание:** Порт, на котором будет запущен backend сервер.
**По умолчанию:** `3001`

---

## Email (SMTP) - Опционально

### Включение/отключение email-уведомлений

```env
EMAIL_ENABLED=false
```

**Описание:** Включить или отключить отправку email-уведомлений.
**Значения:** `true` или `false`
**По умолчанию:** `false` (email отключены, уведомления только в приложении)

### Настройки SMTP сервера

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Описание:**
- `SMTP_HOST` - адрес SMTP сервера
  - Gmail: `smtp.gmail.com`
  - Яндекс: `smtp.yandex.ru`
  - Mail.ru: `smtp.mail.ru`
  - Outlook: `smtp-mail.outlook.com`
- `SMTP_PORT` - порт SMTP сервера
  - Обычно `587` (TLS) или `465` (SSL)
- `SMTP_SECURE` - использовать SSL/TLS
  - `true` для порта 465 (SSL)
  - `false` для порта 587 (TLS)
- `SMTP_USER` - email адрес отправителя
- `SMTP_PASS` - пароль для SMTP аутентификации

### Настройка Gmail

Для использования Gmail необходимо:

1. **Включить двухфакторную аутентификацию** в вашем Google аккаунте
2. **Создать пароль приложения:**
   - Перейдите на https://myaccount.google.com/apppasswords
   - Выберите "Почта" и "Другое устройство"
   - Введите название (например, "Dentist App")
   - Скопируйте сгенерированный 16-символьный пароль
   - Используйте этот пароль в `SMTP_PASS` (не ваш обычный пароль от Gmail!)


## Полный пример .env файла

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dentist_app?schema=public"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001

# Email Configuration (опционально)
EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Типы уведомлений, отправляемых по email

При включенном `EMAIL_ENABLED=true` система будет отправлять email-уведомления для:

1. **Создание приёма** (`appointment_created`)
   - Отправляется пациенту и врачу при создании нового приёма

2. **Изменение приёма** (`appointment_updated`)
   - Отправляется пациенту и врачу при изменении времени или других данных приёма

3. **Отмена приёма** (`appointment_cancelled`)
   - Отправляется пациенту и врачу при отмене приёма

4. **Напоминание о приёме** (`appointment_reminder`)
   - Автоматически отправляется за 18-30 часов до начала приёма
   - Проверка выполняется каждые 6 часов через cron job

**Примечание:** Даже если email отправка отключена или не настроена, все уведомления сохраняются в базе данных и отображаются в приложении (иконка колокольчика в навигации).

