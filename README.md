# 📱 Cuhp Mobile App

The mobile application for **Cuhp**, built on **React Native** with **Expo SDK 57** and **TypeScript**. It delivers a modern UI optimized for small screens and stays in perfect sync with the data and APIs of the current Web version.

---

## ✨ Core Features

### 1. 🏠 Home & Progress (Dashboard)
*   **Streak & daily goal**: Counts the consecutive learning streak and displays the daily goal completion ratio as an animated SVG progress ring.
*   **Weekly contribution chart**: Shows daily learning activity levels for the past week.
*   **Quick shortcuts**: Direct navigation to main sections (Learn English, Todo, Gym).

### 2. 🇬🇧 English Hub
Groups every English-learning feature into a single tab mirroring the Web version:
*   **Vocabulary notebook**:
    *   Manage your personal word list (Add, Edit, Delete).
    *   **Quick dictionary lookup**: Type an English word and tap "Lookup" to auto-fill pronunciation, meaning, and classification via the API.
    *   Pronounce vocabulary with TTS (Expo Speech) using your configured accent.
*   **Flashcards review**: Review saved vocabulary using the Leitner Spaced Repetition system with a smooth flipping card UI.
*   **Bilingual reading**:
    *   Browse reading passages classified by level (Easy, Medium, Hard) with intuitive colors.
    *   **Tap a word to look it up**: Tap any word in the passage to open a definition popup and save it directly to your personal notebook.
    *   Discussion and save your personal translation (Translation practice).
*   **Listening & Shadowing**:
    *   Built-in audio player (`expo-av`) with a custom progress scrubber that supports seeking by tapping the bar.
    *   Adjustable playback speed (0.75x, 1x, 1.25x, 1.5x).
    *   **Shadow Dictation**: Listen and transcribe, with visual correctness matching.

### 3. 📅 Todo Tasks
*   **Planner**: Calendar strip to pick a date and plan work day by day.
*   **Inbox**: Quick collection spot for incoming tasks not yet scheduled.
*   **Eisenhower Matrix**: Scientifically classify tasks into 4 priority groups: *Do First, Schedule, Delegate, Eliminate*.

### 4. 🏋️ Gym Planner
*   **Workout schedule**: Track today's exercise list, sets x reps, weight (kg), and completion checkbox.
*   **Copy Day Forward**: Quickly copy today's workout plan to upcoming weeks.
*   **Muscle group management**: CRUD muscle groups with color labels for visual differentiation.
*   **Advanced stats**: SVG bar chart showing total volume over the last 7 days and history of max weight per exercise.

---

## 🛠️ Tech Stack

*   **Framework**: React Native & Expo (SDK 57)
*   **Language**: TypeScript (100% type-safe)
*   **Styling**: NativeWind (Tailwind CSS for React Native)
*   **Navigation**: Expo Router / React Navigation (5-tab Bottom Tab Bar combined with Native Stack)
*   **Multimedia libraries**: `expo-av` (audio playback), `expo-speech` (TTS), `react-native-svg` (charts & progress rings).

---

## 📂 Project Structure

```bash
mobile/
├── src/
│   ├── api/
│   │   └── client.ts          # API Client connected to Backend (Authentication, CRUD)
│   ├── components/            # Shared components (Card, Badge, Button, Input...)
│   ├── context/               # Global state management (AuthContext, SettingsContext)
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Bottom Tab Bar routing & Stack Screens config
│   ├── screens/               # Main app screens
│   │   ├── DashboardScreen.tsx
│   │   ├── EnglishHubScreen.tsx
│   │   ├── VocabularyScreen.tsx
│   │   ├── ReadingDetailScreen.tsx
│   │   ├── ListeningDetailScreen.tsx
│   │   ├── TodoScreen.tsx
│   │   └── GymScreen.tsx
│   ├── theme/                 # Color palette and base style definitions
│   ├── types/
│   │   └── index.ts           # TypeScript interface definitions
│   └── utils/                 # Helpers (vocabulary helpers, date format...)
├── app.json                   # Expo App config (name, slug, plugins, SDK version)
├── package.json               # Dependencies list & run scripts
└── tsconfig.json              # TypeScript compiler config
```

---

## 🚀 Installation & Running

### Step 1: Install Dependencies
Inside the `mobile` folder, run:
```bash
npm install
```

### Step 2: Start Metro Bundler
To start the JavaScript bundler:
```bash
npm run start
# or
npx expo start
```
*Tip: If you just installed a new native library or updated config code, restart with cache cleared:*
```bash
npx expo start -c
```

### Step 3: View on Device (Expo Go)
* **Same Wi-Fi network**:
  * Install **Expo Go** from Google Play Store (Android) or the Apple App Store (iOS).
  * Make sure your phone and the Metro Bundler machine are on the **same Wi-Fi network**.
  * Open Expo Go, tap **Scan QR Code**, and scan the QR displayed in the terminal to open the app quickly.
* **USB cable / Android Emulator (using ADB)**:
  * If you develop on an Android emulator or via USB (with USB Debugging enabled), run these commands in your terminal:
    ```bash
    # Forward Metro Bundler port
    adb reverse tcp:8081 tcp:8081

    # Start Metro Bundler
    npx expo start
    ```
    *(Afterwards you can open the app on your phone/emulator and connect directly to the Metro server at localhost:8081).*

*Note: Because Expo Go is a sandboxed environment, deep system-level features like background audio playback may be limited or disconnected after a few minutes when Android reclaims resources. For the full app experience, build a standalone APK (see instructions below).*

---

## 📦 Build Standalone App (Android APK)

The app is preconfigured with **EAS Build (Expo Application Services)** using the `preview` build profile to produce a directly installable `.apk`.

### Step 1: Set up an Expo account
* Visit [expo.dev](https://expo.dev) and sign up for a free Expo account (if you don't have one).

### Step 2: Install & log in to EAS CLI
Open a new terminal in the `mobile` folder and run:
```bash
npx eas-cli login
```
*(Enter your Expo credentials to link the project.)*

### Step 3: Build the APK
Send the build request to Expo's cloud servers:
```bash
npx eas-cli build --platform android --profile preview
```
*   The system may ask whether you want to set things up automatically (e.g. create a Keystore for signing the app...) → Choose **Yes** for all prompts.
*   Expo will package your project into a standalone `.apk` (takes about 5-10 minutes).

### Step 4: Download & install the APK
* Once the build completes, the terminal prints a **direct `.apk` download link** and a **QR code**.
* Just scan the QR with your phone to download the APK directly, then install it to test background features like a professional music player app.

---

## 🔍 Troubleshooting

### 1. `Cannot find native module 'ExponentAV'` or 'ExpoAudio'
This happens when Expo Go hasn't recognized a newly installed native module.
* **Fix 1: Clear app cache**:
  * **Android**: *Settings -> Apps -> Expo Go -> Storage -> Clear Cache & Clear Data*.
  * **iOS**: Uninstall the Expo Go app on your phone and reinstall from the App Store.
* **Fix 2: Restart Metro Bundler with cleared cache**: Run `npx expo start -c`.

### 2. Check TypeScript type errors
Make sure the code has no compile errors before building:
```bash
npx tsc --noEmit
```

### 3. Build native internally (Development Client)
If you want to build an internal client to debug natively on a real device:
```bash
# Android device
npx expo run:android

# iOS device (requires macOS)
npx expo run:ios
```
