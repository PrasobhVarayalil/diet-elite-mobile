# Diet Elite Mobile

Expo (React Native) client for [Diet Elite API](https://github.com/PrasobhVarayalil/diet-elite). Uses the same `/api/v1` REST API and Sanctum Bearer tokens as the web SPA.

## Stack

- **Expo SDK 56** + **Expo Router**
- **TypeScript**
- **Secure token storage** (`expo-secure-store`)

## Prerequisites

- Node.js 20+
- [Expo Go](https://expo.dev/go) on your phone, or Android Studio / Xcode emulator
- Running **diet-elite-api** backend (local or Render)

## Setup

```bash
cd diet-elite-mobile
cp .env.example .env
npm install
```

Edit `.env` and set `EXPO_PUBLIC_API_URL` to your API origin.

| Environment | Typical API URL |
|-------------|-----------------|
| Laragon + Android emulator | `http://10.0.2.2:8000` |
| Laragon + iOS simulator | `http://localhost:8000` |
| Phone on same Wi‑Fi | `http://YOUR_PC_IP:8000` |
| Render | `https://your-service.onrender.com` |

## Run

```bash
npm start
```

Then press `a` (Android), `i` (iOS), or scan the QR code with Expo Go.

## Demo login

After seeding demo data on the API (`php artisan db:seed-demo --force`):

| Field | Value |
|-------|--------|
| Email | `customer@dietelite.com` |
| Password | `password` (or `DEMO_SEED_PASSWORD`) |

## Branch workflow

Matches **diet-elite-api**:

| Branch | Purpose |
|--------|---------|
| `develop` | Day-to-day development (default checkout) |
| `staging` | Pre-production / QA |
| `main` | Production releases |

```bash
git checkout develop
git pull origin develop
```

**Promotion (required order):**

```powershell
# API or mobile — from repo root
.\scripts\promote-branches.ps1
```

Or: merge `develop` → `staging`, then `staging` → `main` (never `develop` → `main` directly).

## MVP screens (customer)

- Sign in / sign out (Bearer token)
- Home — plan access summary from `/api/v1/auth/me`
- Plans list + detail — `/api/v1/plans`
- Checkout — `/api/v1/plans/{id}/checkout` (demo mode when Razorpay is not configured)
- Payments — `/api/v1/payments`
- Bookings list, create, cancel — `/api/v1/bookings`

## Related repo

Backend + web app: **diet-elite-api** (Laravel + React SPA on Inertia).

When adding features:

1. Add or extend API in **diet-elite-api** (`routes/api.php`)
2. Add mobile screen here calling the same endpoint

## Project structure

```
app/                 Expo Router screens
src/lib/             API client, routes, config
src/context/         Auth provider
src/types/           Shared TypeScript types
components/ui/       Reusable UI
constants/theme.ts   Diet Elite brand colors
```

## Next steps

- [ ] Razorpay native checkout (EAS build + `react-native-razorpay`)
- [x] Notifications
- [x] Customer ↔ dietitian messages (all roles)
- [ ] EAS Build for App Store / Play Store
