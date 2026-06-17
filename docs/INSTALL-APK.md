# Install Diet Elite on Android (APK + Render API)

Use this when your API is already on **Render** and you want a real **APK** on your phone (no Expo Go).

## 1. One-time setup on your PC

```powershell
cd c:\laragon\www\diet-elite-mobile
npm install
npm install -g eas-cli
eas login
```

Create a free Expo account at [expo.dev](https://expo.dev) if you do not have one.

## 2. Point the app at your Render API

Open `eas.json` and replace both placeholders:

```json
"EXPO_PUBLIC_API_URL": "https://diet-elite-w4kw.onrender.com"
```

Use your **exact** Render service URL (no trailing slash). Find it in Render → your web service → top of the page.

Optional: also set the same value in `.env` for local `expo start` testing.

## 3. Build the APK (cloud build)

```powershell
eas build -p android --profile preview
```

- First run may ask to create an Expo project — accept defaults.
- Build takes about **10–20 minutes** on Expo’s servers.
- When finished, you get a **download link** in the terminal and on [expo.dev](https://expo.dev) → your project → Builds.

The `preview` profile produces an **`.apk`** file you can sideload (not an AAB for Play Store).

## 4. Install on your Android phone

### From the build page (easiest)

1. On your phone, open the **build URL** from the terminal (or Expo dashboard).
2. Tap **Download** / **Install**.
3. If Android blocks it: **Settings → Security** (or **Apps**) → **Install unknown apps** → allow your **browser** (Chrome, etc.).
4. Open the downloaded `.apk` → **Install** → **Open**.

### From your PC (USB)

1. Download the `.apk` to your PC from the Expo build page.
2. Copy to the phone (USB, Google Drive, WhatsApp, etc.).
3. On the phone, open the file with **Files** → tap **Install**.

### With USB debugging (developers)

```powershell
adb install path\to\downloaded.apk
```

## 5. Log in

Use accounts that exist on your **Render** database (not local Laragon).

If you seeded demo data on Render:

| Email | Password |
|-------|----------|
| `customer@dietelite.com` | `password` |

Production Render deploys often only seed the **admin** user. Create customers from Admin → Users, or run demo seed on Render shell if you use it for QA.

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Network request failed” | Wrong `EXPO_PUBLIC_API_URL` in `eas.json` — rebuild APK after fixing. |
| App opens but login fails | User does not exist on Render DB; check Render logs. |
| Very slow first request | Render free tier **cold start** — wait 30–60s, then retry. |
| Need a new API URL | Change `eas.json` → run `eas build` again. |

## Rebuild after code changes

```powershell
eas build -p android --profile preview
```

Install the new APK over the old one (same package name).

## Play Store (later)

Use `production` profile (`app-bundle`) and `eas submit` when you are ready for Google Play.
