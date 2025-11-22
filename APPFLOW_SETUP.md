# 📱 Ionic AppFlow - Налаштування та збірка

## Проблема яку ви зустріли:

```
Couldn't find gradlew at path '/builds/Friend1yGhost/military-unit-app/gradlew'
```

**Причина:** AppFlow очікував що `gradlew` буде в корені проекту, але у нас монорепо структура (backend + frontend).

## ✅ Що було виправлено:

1. **Створено кореневий `capacitor.config.json`**
   - Вказано webDir: `frontend/build`
   - Конфігурація тепер в корені проекту

2. **Додано символічне посилання на Android**
   - `/app/android` → `/app/frontend/android`
   - AppFlow тепер може знайти gradlew

3. **Створено кореневий `package.json`**
   - Build script: збирає frontend та синхронізує з Android
   - Capacitor dependencies додано

4. **Додано `ionic.config.json`**
   - Визначає проект як Capacitor React app
   - Необхідний для AppFlow

5. **Додано `.gitignore`**
   - Виключає build файли та node_modules

---

## 🚀 Налаштування AppFlow (крок за кроком):

### Крок 1: Підготовка проекту на GitHub

1. **Закомітьте зміни:**
   ```bash
   git add .
   git commit -m "Add Capacitor root config for AppFlow"
   git push origin main
   ```

2. **Переконайтеся що ці файли в репозиторії:**
   - ✅ `/capacitor.config.json` (в корені)
   - ✅ `/package.json` (в корені)
   - ✅ `/ionic.config.json` (в корені)
   - ✅ `/android/` (symbolic link або реальна папка)
   - ✅ `.gitignore`

### Крок 2: Підключення до AppFlow

1. **Зайдіть на:** https://ionic.io/appflow

2. **Створіть новий App:**
   - Click "New App"
   - Name: "222 ЦАПБ"
   - Connect Git Provider: GitHub

3. **Авторизуйте GitHub:**
   - Дозвольте AppFlow доступ до репозиторію
   - Оберіть репозиторій `military-unit-app`

4. **Оберіть гілку:**
   - Main branch: `main` або `master`

### Крок 3: Налаштування Build

1. **Перейдіть в Build → Configure**

2. **Build Settings:**
   ```
   Build Type: Release
   Platform: Android
   Build Stack: Latest
   ```

3. **Environment:**
   ```
   Node.js: 20.x
   npm: 10.x
   ```

4. **Custom Build Script (якщо потрібно):**
   ```bash
   #!/bin/bash
   # Build frontend
   cd frontend
   yarn install
   yarn build
   cd ..
   
   # Sync with Capacitor
   npx cap sync android
   ```

### Крок 4: Запуск Build

1. **Click "New Build"**

2. **Оберіть:**
   - Commit/Branch: `main`
   - Build Type: `Debug` (для тестування) або `Release`
   - Target: `Android`

3. **Click "Build"**

4. **Зачекайте ~5-10 хвилин**

5. **Завантажте APK:**
   - Build завершиться з статусом "Success"
   - Click "Download" → APK файл

---

## 🔧 Альтернатива: GitHub Actions (Безкоштовно)

Якщо AppFlow не працює або потрібна безкоштовна альтернатива:

### Створіть `.github/workflows/android-build.yml`:

```yaml
name: Build Android APK

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'yarn'
        cache-dependency-path: frontend/yarn.lock
        
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'zulu'
        java-version: '17'
        
    - name: Install root dependencies
      run: |
        yarn install
        
    - name: Install frontend dependencies
      run: |
        cd frontend
        yarn install
        
    - name: Build React app
      run: |
        cd frontend
        yarn build
        
    - name: Sync Capacitor
      run: |
        npx cap sync android
        
    - name: Grant execute permission for gradlew
      run: |
        chmod +x android/gradlew
        
    - name: Build Android APK
      run: |
        cd android
        ./gradlew assembleDebug
        
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-debug
        path: android/app/build/outputs/apk/debug/app-debug.apk
```

**Як використовувати:**

1. Створіть файл `.github/workflows/android-build.yml`
2. Закомітьте та push на GitHub
3. Перейдіть: Actions tab на GitHub
4. Build запуститься автоматично
5. Завантажте APK з Artifacts

---

## 📝 Структура проекту після змін:

```
/app/
├── capacitor.config.json       # ← Додано (в корені)
├── package.json                # ← Додано (в корені)
├── ionic.config.json           # ← Додано
├── .gitignore                  # ← Додано
├── android/                    # ← Symbolic link → frontend/android
├── backend/
│   ├── server.py
│   └── ...
└── frontend/
    ├── capacitor.config.json   # ← Залишається
    ├── android/                # ← Реальна папка
    │   ├── app/
    │   ├── gradle/
    │   ├── gradlew             # ← Тепер доступний через symlink
    │   └── ...
    ├── build/
    ├── src/
    └── package.json
```

---

## ⚠️ Важливі нотатки:

### Для AppFlow:

1. **Build може зайняти 10-15 хвилин** (перша збірка довша)

2. **Безкоштовний план обмежений:**
   - 500 build хвилин/місяць
   - 1 concurrent build
   - Після вичерпання - потрібна підписка

3. **Якщо build fails:**
   - Перевірте Build Log в AppFlow
   - Переконайтесь що всі файли закомічені
   - Перевірте що `android/` доступний

### Для GitHub Actions:

1. **Безкоштовно:**
   - 2000 build хвилин/місяць (public repos)
   - Необмежені concurrent builds

2. **APK буде unsigned:**
   - Для production потрібен signing key
   - Додайте secrets в GitHub для signing

---

## 🎯 Рекомендація:

**Для швидкого тестування:**
- Використайте локальний build (Android Studio)
- Або GitHub Actions (безкоштовно, але потрібно налаштувати)

**Для production:**
- AppFlow (платно, але найпростіше)
- Або налаштуйте signing в GitHub Actions

---

## 📊 Порівняння методів:

| Метод | Вартість | Складність | Час setup | Автоматизація |
|-------|----------|------------|-----------|---------------|
| Локально | Безкоштовно | Середня | 30 хв | ❌ |
| AppFlow | $29/міс | Низька | 10 хв | ✅ |
| GitHub Actions | Безкоштовно | Середня | 20 хв | ✅ |

---

## 🔍 Troubleshooting:

**AppFlow: "Couldn't find gradlew"**
✅ Виправлено! Додали symlink та кореневий config

**AppFlow: "Build failed - Gradle error"**
- Перевірте що `frontend/build/` не пустий
- Спробуйте Debug build замість Release

**GitHub Actions: "gradlew: Permission denied"**
- Додайте: `chmod +x android/gradlew` в workflow

**Локально: "Android SDK not found"**
- Встановіть Android Studio з SDK

---

**Готово! Тепер ваш проект сумісний з AppFlow.** 🎉

Закомітьте зміни на GitHub та спробуйте знову на https://ionic.io/appflow
