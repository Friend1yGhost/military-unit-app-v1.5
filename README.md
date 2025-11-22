# 222 ЦАПБ - Military Unit Management App

Система управління військовим підрозділом з веб-додатком та Android версією.

## 🚀 Швидкий старт

### Веб-версія (PWA)
Відкрийте в Chrome на Android: https://troop-manager-3.preview.emergentagent.com
Натисніть "Add to Home screen" для встановлення як додаток.

### Android APK
Автоматична збірка через GitHub Actions при кожному push.

## 📱 Завантажити Android APK

1. Перейдіть в [Actions](../../actions)
2. Оберіть останній успішний workflow
3. Завантажте `app-debug-apk` з Artifacts
4. Встановіть APK на телефон

## 🛠️ Розробка

### Backend (FastAPI + MongoDB)
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Frontend (React)
```bash
cd frontend
yarn install
yarn start
```

### Android (Capacitor)
```bash
# Build React app
cd frontend
yarn build

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

## 📚 Документація

- [PWA Installation Guide](PWA_INSTALLATION_GUIDE.md)
- [Capacitor Build Guide](CAPACITOR_BUILD_GUIDE.md)
- [Quick Start Android](QUICK_START_ANDROID.md)
- [AppFlow Setup](APPFLOW_SETUP.md)
- [Final Solution](FINAL_SOLUTION.md)

## 🏗️ Архітектура

```
military-unit-app/
├── backend/          # FastAPI server
├── frontend/         # React app
├── android/          # Capacitor Android project
└── .github/          # GitHub Actions workflows
```

## ✨ Функціонал

- 🔐 Авторизація (користувачі та адміністратори)
- 📰 Система новин (внутрішні + RSS feed)
- 📅 Система нарядів (створення, перегляд, редагування)
- 👥 Управління користувачами та групами
- ⚙️ Налаштування системи
- 📱 PWA підтримка (офлайн режим)
- 📦 Android APK (через Capacitor)

## 🔧 Технології

**Backend:**
- FastAPI
- MongoDB
- JWT Authentication

**Frontend:**
- React 19
- Tailwind CSS
- Shadcn UI
- React Router

**Mobile:**
- Capacitor 7
- PWA (Service Worker)

## 📄 Ліцензія

Приватний проект для військового підрозділу 222 ЦАПБ.
