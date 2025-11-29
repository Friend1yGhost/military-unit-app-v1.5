# 🚀 Швидкий старт: Тестування Android додатку

## Найпростіший спосіб протестувати на телефоні:

### Крок 1: Завантажте проект
```bash
# Збережіть проект на GitHub
# Або завантажте папку frontend на свій комп'ютер
```

### Крок 2: Встановіть Android Studio
- Завантажте: https://developer.android.com/studio
- Встановіть з усіма компонентами (SDK, emulator, etc.)

### Крок 3: Відкрийте проект
```bash
cd frontend
npx cap open android
```

### Крок 4: Підключіть телефон або запустіть емулятор
- **Реальний телефон:**
  1. Увімкніть "Developer options" на телефоні
  2. Увімкніть "USB debugging"
  3. Підключіть USB кабель
  4. Дозвольте debugging на телефоні

- **Емулятор:**
  1. В Android Studio: Tools → Device Manager
  2. Create Device → Pixel 5 → Next
  3. Download system image (API 33+)
  4. Finish

### Крок 5: Запустіть
- В Android Studio натисніть зелену кнопку ▶️ "Run"
- Оберіть свій телефон/емулятор
- Зачекайте ~30 секунд
- Додаток запуститься!

---

## ⚡ Ще швидший спосіб (live reload):

```bash
cd frontend
yarn install
npx cap run android
```

Це запустить сервер розробки + відкриє Android Studio + запустить на телефоні.
При змінах в коді додаток автоматично перезавантажиться!

---

## 📦 Створення APK для встановлення:

### Для тестування (без підпису):
```bash
cd frontend/android
./gradlew assembleDebug
```
APK: `android/app/build/outputs/apk/debug/app-debug.apk`

### Для production (з підписом):
1. Створіть keystore:
```bash
keytool -genkey -v -keystore ~/troop-manager.keystore \
  -alias troop-manager \
  -keyalg RSA -keysize 2048 -validity 10000
```

2. Додайте в `android/gradle.properties`:
```properties
MYAPP_UPLOAD_STORE_FILE=~/troop-manager.keystore
MYAPP_UPLOAD_KEY_ALIAS=troop-manager
MYAPP_UPLOAD_STORE_PASSWORD=your-password
MYAPP_UPLOAD_KEY_PASSWORD=your-password
```

3. Оновіть `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

4. Створіть підписаний APK:
```bash
cd frontend/android
./gradlew assembleRelease
```
APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📱 Встановлення APK на телефон:

### З комп'ютера (через ADB):
```bash
adb install app-release.apk
```

### Напряму на телефоні:
1. Скопіюйте APK на телефон (через USB, email, Drive, etc.)
2. Відкрийте файл-менеджер
3. Знайдіть APK
4. Натисніть → дозвольте "Install from unknown sources"
5. Встановіть!

---

## 🔧 Типові команди:

```bash
# Встановити залежності
cd frontend && yarn install

# Зробити build React
yarn build

# Синхронізувати з Android
npx cap sync android

# Відкрити в Android Studio
npx cap open android

# Запустити з live reload
npx cap run android

# Переглянути логи
npx cap run android -l

# Створити debug APK
cd android && ./gradlew assembleDebug

# Створити release APK
cd android && ./gradlew assembleRelease

# Список підключених пристроїв
adb devices
```

---

## ❓ FAQ:

**Q: Чи потрібно встановлювати щось ще?**
A: Тільки Android Studio з Android SDK. Решта встановиться автоматично.

**Q: Скільки часу займає перша збірка?**
A: ~2-5 хвилин (Gradle завантажує залежності).

**Q: Чи працює без інтернету?**
A: PWA функції працюють, але для API запитів потрібен інтернет.

**Q: Яка версія Android підтримується?**
A: Android 5.1+ (API level 22+)

**Q: Скільки займає APK?**
A: ~5-10 MB (стиснуто)

**Q: Чи можна опублікувати в Play Store?**
A: Так! Використовуйте команду `./gradlew bundleRelease` для створення AAB файлу.

---

## 🎯 Рекомендації:

1. **Для розробки:** Використовуйте `npx cap run android` - live reload працює
2. **Для тестування:** Debug APK - швидко створюється
3. **Для публікації:** Release AAB - оптимізований для Play Store

---

**Потрібна допомога?**
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Android Studio User Guide](https://developer.android.com/studio/intro)
