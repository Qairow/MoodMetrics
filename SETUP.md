# Инструкция по установке и запуску

## Требования

- Node.js 18+ и npm

## Установка

1. Установите зависимости для всех проектов:
```bash
npm run install:all
```

Или вручную:
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

## Запуск

### Режим разработки

Запуск фронтенда и бэкенда одновременно:
```bash
npm run dev
```

Или по отдельности:
```bash
# Терминал 1 - Бэкенд
cd server
npm run dev

# Терминал 2 - Фронтенд
cd client
npm run dev
```

- **Фронтенд**: http://localhost:3000
- **Бэкенд API**: http://localhost:5000

## Тестовые аккаунты

### Admin (полный доступ)
- Email: `admin@psycheck.com`
- Пароль: `admin123`

### HR (создание опросов, просмотр аналитики)
- Email: `hr@psycheck.com`
- Пароль: `hr123`

### Employee (прохождение опросов)
- Email: `employee@psycheck.com`
- Пароль: `emp123`

## Структура проекта

```
diplomka_cursor/
├── client/           # React фронтенд
│   └── src/
│       ├── pages/    # Страницы приложения
│       ├── components/ # Компоненты
│       └── context/   # React Context (Auth)
├── server/           # Express бэкенд
│   └── src/
│       ├── routes/   # API маршруты
│       ├── data/     # JSON база данных (MVP)
│       └── middleware/ # Middleware (auth)
└── package.json      # Корневой package.json
```

## Данные

Данные хранятся в JSON файлах в `server/data/`:
- `users.json` - пользователи
- `surveys.json` - опросы
- `responses.json` - ответы на опросы
- `departments.json` - отделы

При первом запуске данные автоматически инициализируются.

## Особенности MVP

- Простая аутентификация (пароли не хешируются - только для демо)
- JSON файлы вместо базы данных
- Mock данные для некоторых метрик
- Адаптивный дизайн (mobile-first)

## Для продакшена

- Использовать базу данных (PostgreSQL/MongoDB)
- Хешировать пароли с bcrypt
- Добавить валидацию данных
- Настроить HTTPS
- Добавить rate limiting
- Настроить CORS правильно
