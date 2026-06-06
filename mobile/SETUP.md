# MoodMetrics Mobile — Expo Android App

## Быстрый старт

### 1. Установи зависимости
```bash
cd mobile
npm install
```

### 2. Настрой IP сервера

Открой `src/api/client.ts` и измени `API_BASE_URL`:

- **Эмулятор Android (AVD):** `http://10.0.2.2:5000/api` ← уже стоит по умолчанию
- **Реальное устройство:** замени на IP своего компьютера в локальной сети:
  ```
  http://192.168.X.X:5000/api
  ```
  Узнать IP: `ipconfig` → ищи IPv4 для Wi-Fi адаптера

### 3. Запусти сервер (в корне проекта)
```bash
cd ..
npm run dev
```

### 4. Запусти мобильное приложение
```bash
cd mobile
npm run android    # запустить на Android эмуляторе/устройстве
npm start          # запустить Expo dev server (потом сканируй QR в Expo Go)
```

## Структура приложения

```
mobile/
  App.tsx                          # точка входа
  src/
    theme/colors.ts                # цвета (совпадают с web)
    api/client.ts                  # axios + авто-токен
    context/AuthContext.tsx        # авторизация (AsyncStorage)
    navigation/AppNavigator.tsx    # стек + нижние табы
    screens/
      auth/LoginScreen.tsx         # экран входа
      app/DashboardScreen.tsx      # дашборд с графиком
      app/SurveysScreen.tsx        # список опросов
      app/ZonesScreen.tsx          # зоны риска
      app/NotificationsScreen.tsx  # уведомления
      app/ProfileScreen.tsx        # профиль + выход
```

## Необходимые иконки (assets/)

Expo требует несколько PNG файлов в `assets/`. Создай их (или скопируй любые):
- `assets/icon.png` (1024×1024)
- `assets/splash.png` (1284×2778)
- `assets/adaptive-icon.png` (1024×1024)
- `assets/favicon.png` (48×48)

Можно использовать любые PNG заглушки для разработки.

## Expo Go (без эмулятора)

Установи **Expo Go** на Android из Google Play.  
Запусти `npm start` в папке `mobile/`, отсканируй QR-код.  
Важно: телефон и компьютер должны быть в одной Wi-Fi сети.
