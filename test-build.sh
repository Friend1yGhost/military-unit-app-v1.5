#!/bin/bash
# Тестовий скрипт для перевірки build процесу (симуляція GitHub Actions)

set -e

echo "🚀 Starting build test..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Install root dependencies${NC}"
yarn install --frozen-lockfile
echo -e "${GREEN}✅ Root dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 2: Install frontend dependencies${NC}"
cd frontend
yarn install --frozen-lockfile
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 3: Build React application${NC}"
GENERATE_SOURCEMAP=false yarn build
echo -e "${GREEN}✅ React app built${NC}"
echo ""

echo -e "${BLUE}Step 4: Sync Capacitor${NC}"
cd ..
npx cap sync android
echo -e "${GREEN}✅ Capacitor synced${NC}"
echo ""

echo -e "${BLUE}Step 5: Check gradlew${NC}"
if [ -f "android/gradlew" ]; then
    echo -e "${GREEN}✅ gradlew found${NC}"
    chmod +x android/gradlew
else
    echo "❌ gradlew not found"
    exit 1
fi
echo ""

echo -e "${BLUE}Step 6: Build Android Debug APK${NC}"
cd android
./gradlew assembleDebug --no-daemon
echo -e "${GREEN}✅ Debug APK created${NC}"
echo ""

echo "🎉 Build completed successfully!"
echo ""
echo "📦 APK location:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "📱 Install on device:"
echo "   adb install android/app/build/outputs/apk/debug/app-debug.apk"
