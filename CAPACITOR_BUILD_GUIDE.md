# 📦 Інструкція по збірці Android APK через Capacitor

## ✅ Що вже зроблено:

1. ✅ Capacitor встановлено (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`)
2. ✅ Проект ініціалізовано (`capacitor.config.json`)
3. ✅ Android платформу додано (`/app/frontend/android/`)
4. ✅ React build створено (`/app/frontend/build/`)
5. ✅ Веб-ресурси скопійовано в Android проект
6. ✅ Конфігурація налаштована

---

## 📱 Структура проекту:

```
/app/frontend/
├── android/                    # Android нативний проект
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/  # Веб-ресурси React
│   │   │   ├── res/            # Android ресурси (іконки)
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   ├── gradle/
│   └── build.gradle
├── build/                      # React production build
├── capacitor.config.json       # Capacitor конфігурація
└── package.json
```

---

## 🛠️ Варіант 1: Збірка локально (на вашому комп'ютері)

### Вимоги:
- ✅ Android Studio (остання версія)
- ✅ Java JDK 17+
- ✅ Android SDK (API level 33+)
- ✅ Gradle 8.0+

### Кроки:

1. **Завантажте проект:**
   ```bash
   # Клонуйте з GitHub або завантажте zip
   git clone [your-repo-url]
   cd frontend
   ```

2. **Встановіть залежності:**
   ```bash
   yarn install
   ```

3. **Створіть production build:**
   ```bash
   yarn build
   ```

4. **Синхронізуйте з Android:**
   ```bash
   npx cap sync android
   ```

5. **Відкрийте в Android Studio:**
   ```bash
   npx cap open android
   ```

6. **В Android Studio:**
   - Зачекайте поки Gradle завершить індексацію
   - Build → Generate Signed Bundle / APK
   - Оберіть APK
   - Створіть новий keystore або використайте існуючий
   - Build
   - APK буде в `android/app/build/outputs/apk/release/`

---

## ☁️ Варіант 2: Cloud Build (EAS Build від Expo)

Хоча Capacitor не Expo, можна використовувати інші cloud сервіси:

### 2.1 AppFlow від Ionic (Рекомендовано для Capacitor)

1. **Зареєструйтесь:** https://ionic.io/appflow
2. **Підключіть GitHub репозиторій**
3. **Налаштуйте build:**
   - Build Type: Android
   - Target: APK або AAB
   - Environment: Production
4. **Запустіть build** - отримаєте APK через ~10-15 хвилин

### 2.2 GitHub Actions (Безкоштовно)

Створіть `.github/workflows/android-build.yml`:

```yaml
name: Android Build

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'zulu'
        java-version: '17'
        
    - name: Install dependencies
      run: cd frontend && yarn install
      
    - name: Build React app
      run: cd frontend && yarn build
      
    - name: Sync with Android
      run: cd frontend && npx cap sync android
      
    - name: Build Android APK
      run: |
        cd frontend/android
        chmod +x gradlew
        ./gradlew assembleRelease
        
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-release
        path: frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

---

## 🔧 Варіант 3: Збірка в Docker

Створіть `Dockerfile.android`:

```dockerfile
FROM openjdk:17-jdk

# Install Android SDK
RUN apt-get update && apt-get install -y wget unzip
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
RUN unzip commandlinetools-linux-9477386_latest.zip -d /opt/android-sdk

# Setup environment
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Install Node
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Copy project
WORKDIR /app
COPY frontend/ .

# Build
RUN yarn install
RUN yarn build
RUN npx cap sync android
RUN cd android && ./gradlew assembleRelease
```

Запуск:
```bash
docker build -f Dockerfile.android -t android-builder .
docker run android-builder
# Скопіюйте APK з контейнера
```

---

## 📝 Важливі файли для збірки:

### 1. `capacitor.config.json` (вже налаштовано)
```json
{
  "appId": "com.troop.manager",
  "appName": "222 ЦАПБ",
  "webDir": "build",
  "server": {
    "androidScheme": "https",
    "cleartext": true,
    "allowNavigation": ["https://troop-manager-3.preview.emergentagent.com"]
  }
}
```

### 2. `android/app/build.gradle` (перевірте версії)
```gradle
android {
    compileSdk 34
    defaultConfig {
        applicationId "com.troop.manager"
        minSdk 22
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
}
```

### 3. Keystore для підпису (для production)
```bash
# Створіть keystore
keytool -genkey -v -keystore troop-manager.keystore \
  -alias troop-manager-key \
  -keyalg RSA -keysize 2048 -validity 10000
```

---

## 🚀 Швидкі команди:

```bash
# Повна збірка
cd /app/frontend
yarn build
npx cap sync android
npx cap open android

# Або через Gradle напряму (якщо Android SDK встановлено)
cd /app/frontend/android
./gradlew assembleRelease

# APK буде тут:
# android/app/build/outputs/apk/release/app-release-unsigned.apk
```

---

## 📲 Після збірки APK:

### Встановлення на телефон:

**Спосіб 1: ADB (Android Debug Bridge)**
```bash
adb install app-release.apk
```

**Спосіб 2: Прямо з телефону**
1. Скопіюйте APK на телефон
2. Відкрийте файл-менеджер
3. Натисніть на APK
4. Дозвольте встановлення з невідомих джерел
5. Встановіть

**Спосіб 3: Google Play Store**
1. Створіть developer акаунт ($25 одноразово)
2. Upload APK/AAB в Play Console
3. Опублікуйте (internal/closed/open testing)

---

## ⚠️ Обмеження поточного середовища:

В Docker контейнері на Emergent **НЕМАЄ**:
- ❌ Android SDK
- ❌ Android Studio
- ❌ Gradle повна версія
- ❌ GUI для збірки

**Тому потрібно:**
- Використати локальний комп'ютер (Варіант 1)
- Або Cloud Build сервіс (Варіант 2)
- Або GitHub Actions (Варіант 2.2)

---

## 🎯 Рекомендації:

**Для розробки:**
- Використовуйте Android Studio локально
- Hot reload працює через `npx cap run android`

**Для production:**
- GitHub Actions (безкоштовно, автоматично)
- Ionic AppFlow (платно, але простіше)
- Google Play Console (для публікації)

---

## 📄 Додаткові ресурси:

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Build Guide](https://capacitorjs.com/docs/android)
- [Publishing to Play Store](https://capacitorjs.com/docs/android/publishing)
- [Signing Android Apps](https://developer.android.com/studio/publish/app-signing)

---

## 🔍 Troubleshooting:

**Проблема:** Gradle build failed
**Рішення:** Перевірте Java версію (потрібна 17+)

**Проблема:** SDK not found
**Рішення:** Встановіть Android SDK через Android Studio

**Проблема:** Build працює, але додаток не підключається до API
**Рішення:** Перевірте `capacitor.config.json` - allowNavigation повинен містити ваш backend URL

---

**Дата:** 22.11.2024
**Capacitor версія:** 7.4.4
**Android платформа:** Готова до збірки ✅
