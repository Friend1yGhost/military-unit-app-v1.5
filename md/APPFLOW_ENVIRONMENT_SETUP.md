# 🔧 AppFlow Environment Setup

## Варіант 1: Через Web UI (Що ви відкрили на скріншоті)

### Крок за кроком:

1. **Name:** Введіть назву environment
   ```
   Production
   ```

2. **Variables:** Додайте змінні одну за одною:

   **Натисніть "+ Add variable"** і додайте:

   ```
   KEY: NODE_VERSION
   VALUE: 20.19.3
   ```

   ```
   KEY: NPM_VERSION
   VALUE: 10.8.2
   ```

   ```
   KEY: YARN_VERSION
   VALUE: 1.22.22
   ```

   ```
   KEY: CI
   VALUE: false
   ```

   ```
   KEY: GENERATE_SOURCEMAP
   VALUE: false
   ```

3. **Secrets:** Залиште пустим (якщо не потрібні API keys)

4. **Натисніть "Create"**

---

## Варіант 2: Через appflow.config.json (Рекомендовано)

Створіть файл `appflow.config.json` в корені проекту:

```json
{
  "name": "military-unit-app",
  "android": {
    "buildType": "gradle",
    "gradle": {
      "file": "android/build.gradle"
    }
  },
  "environments": {
    "production": {
      "NODE_VERSION": "20.19.3",
      "NPM_VERSION": "10.8.2",
      "YARN_VERSION": "1.22.22",
      "CI": "false",
      "GENERATE_SOURCEMAP": "false"
    }
  },
  "dependencies": {
    "cordova": "12.0.0"
  }
}
```

**Переваги цього підходу:**
- ✅ Версійований контроль (Git)
- ✅ Однакові налаштування для всієї команди
- ✅ Легко оновлювати
- ✅ Автоматично підхоплюється AppFlow

---

## Варіант 3: Через Custom Build Script

Якщо AppFlow ігнорує змінні, створіть custom build script.

### В AppFlow UI:

1. Build → Configure → Advanced
2. Додайте Pre-build Script:

```bash
#!/bin/bash

# Set Node.js version
export NODE_VERSION=20.19.3
export NPM_VERSION=10.8.2
export YARN_VERSION=1.22.22

# Verify versions
echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"
echo "yarn version: $(yarn -v)"
```

---

## 📋 Повний список корисних змінних:

### Обов'язкові для вашого проекту:

| Variable | Value | Опис |
|----------|-------|------|
| `NODE_VERSION` | `20.19.3` | Версія Node.js |
| `NPM_VERSION` | `10.8.2` | Версія npm |
| `YARN_VERSION` | `1.22.22` | Версія Yarn |
| `CI` | `false` | Вимкнути CI warnings |
| `GENERATE_SOURCEMAP` | `false` | Не генерувати source maps |

### Опціональні (для кращої збірки):

| Variable | Value | Опис |
|----------|-------|------|
| `JAVA_HOME` | `/usr/lib/jvm/java-17-openjdk` | Java для Gradle |
| `ANDROID_SDK_ROOT` | `/opt/android-sdk` | Android SDK шлях |
| `GRADLE_OPTS` | `-Xmx4096m -XX:MaxPermSize=512m` | Gradle memory |
| `NODE_OPTIONS` | `--max-old-space-size=4096` | Node.js memory |

### Для монорепо (ваш випадок):

| Variable | Value | Опис |
|----------|-------|------|
| `CAPACITOR_WEB_DIR` | `frontend/build` | Шлях до build |
| `PROJECT_ROOT` | `/builds/Friend1yGhost/military-unit-app` | Корінь проекту |

---

## 🚀 Налаштування після створення Environment:

### 1. Прив'язати Environment до Build:

1. Перейдіть в **Builds**
2. Click **"New Build"**
3. В **"Environment"** оберіть створений environment
4. Click **"Build"**

### 2. Зробити Environment за замовчуванням:

1. Builds → Environments
2. Знайдіть ваш environment
3. Click **"⋮"** (три крапки)
4. **"Set as default"**

---

## ⚠️ Важливі нотатки:

### Версії Node.js:

AppFlow підтримує:
- ✅ 18.x
- ✅ 20.x (ваша версія)
- ✅ 22.x

Якщо AppFlow використовує стару версію:
- Перевірте що `NODE_VERSION` встановлена
- Або використайте `nvm` в custom script:

```bash
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20.19.3
nvm use 20.19.3
```

### Build fails після додавання змінних:

1. **Очистіть кеш:**
   - Builds → Settings → Clear cache
   - Спробуйте новий build

2. **Перевірте logs:**
   - Build details → Logs
   - Шукайте "Node version:" в логах

3. **Використайте appflow.config.json:**
   - Це найнадійніший метод
   - AppFlow автоматично читає файл

---

## 📝 Приклад повного appflow.config.json:

```json
{
  "name": "military-unit-app",
  "integrations": {
    "capacitor": {}
  },
  "android": {
    "buildType": "gradle",
    "gradle": {
      "file": "android/build.gradle",
      "properties": {
        "android.useAndroidX": "true",
        "android.enableJetifier": "true"
      }
    }
  },
  "environments": {
    "production": {
      "NODE_VERSION": "20.19.3",
      "NPM_VERSION": "10.8.2",
      "YARN_VERSION": "1.22.22",
      "CI": "false",
      "GENERATE_SOURCEMAP": "false",
      "CAPACITOR_WEB_DIR": "frontend/build"
    },
    "development": {
      "NODE_VERSION": "20.19.3",
      "NPM_VERSION": "10.8.2",
      "YARN_VERSION": "1.22.22",
      "CI": "false"
    }
  },
  "dependencies": {
    "cordova": "12.0.0"
  },
  "scripts": {
    "prebuild": "cd frontend && yarn install && yarn build && cd ..",
    "postbuild": "npx cap sync android"
  }
}
```

---

## ✅ Перевірка що працює:

Після створення Environment та запуску Build, перевірте logs:

Має бути:
```
Node.js version     | v20.19.3
npm version         | 10.8.2
yarn version        | 1.22.22
```

Якщо бачите інші версії - Environment не застосувався.

---

## 🔍 Troubleshooting:

**Проблема:** AppFlow використовує стару версію Node

**Рішення:**
1. Створіть `appflow.config.json` (найкраще)
2. Або додайте Custom Build Script з `nvm`
3. Перевірте що Environment вибраний при створенні Build

**Проблема:** Build fails з "MODULE_NOT_FOUND"

**Рішення:**
```bash
# В Custom Build Script додайте:
cd frontend
rm -rf node_modules
yarn install --frozen-lockfile
yarn build
cd ..
npx cap sync android
```

**Проблема:** Gradle fails з Java version

**Рішення:**
```json
// В appflow.config.json додайте:
"environments": {
  "production": {
    "JAVA_HOME": "/usr/lib/jvm/java-17-openjdk"
  }
}
```

---

## 📦 Готові файли для commit:

```bash
# Закомітьте appflow.config.json
git add appflow.config.json
git commit -m "Add AppFlow config with Node 20.x"
git push origin main
```

AppFlow автоматично підхопить конфігурацію при наступному build! ✅

---

**Рекомендація:** Використовуйте `appflow.config.json` - це найнадійніший метод! 🎯
