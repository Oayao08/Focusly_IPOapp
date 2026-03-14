# Flowvity Desktop

> Focus. Flow. Grow. — Anti-procrastination desktop app built with Electron.

---

## Features

- ✅ Full desktop application (Windows, macOS, Linux)
- 🔐 User registration + email verification
- 🎯 Pomodoro focus timer
- ✅ Daily task system
- 🔥 Habit tracking with streaks
- 📊 Weekly productivity statistics
- 🤖 AI-powered insights (optional)
- 🏅 Gamification (points, levels, badges)
- 📵 Off-device activity suggestions

---

## Quick Start

### 1. Prerequisites

- **Node.js** 18+ (https://nodejs.org)
- **npm** 9+
- A Gmail account (or any SMTP server) for sending verification emails

### 2. Install dependencies

```bash
cd flowvity-desktop
npm install
```

### 3. Generate the app icon

```bash
npm run create-icon
```

This reads `assets/icon.svg` and generates `assets/icon.png` (and other sizes).

### 4. Configure email (SMTP)

```bash
cp .env.example .env
```

Edit `.env` with your SMTP credentials:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="Flowvity <you@gmail.com>"
```

#### Gmail setup (recommended)

1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create an App Password for "Mail"
4. Use that 16-character password as `SMTP_PASS`

### 5. Run in development

```bash
npm start
```

### 6. Build for distribution

```bash
npm run build
```

Output goes to `out/` directory.

---

## Project Structure

```
flowvity-desktop/
├── main.js              # Electron main process
│                          ├── BrowserWindow setup
│                          ├── SQLite database (auth)
│                          └── IPC handlers (auth + window)
├── preload.js           # Secure contextBridge IPC bridge
├── forge.config.js      # Electron Forge build config
├── .env                 # SMTP credentials (create from .env.example)
├── .env.example         # SMTP configuration template
│
├── src/
│   ├── index.html       # HTML shell + CSS + loads renderer.js
│   └── renderer.js      # Complete React app
│                          ├── Auth screens (Login, Register, Verify)
│                          ├── Custom titlebar (cross-platform)
│                          └── All 5 app screens (Home, Tasks, Focus, Habits, Stats)
│
├── assets/
│   ├── icon.svg         # SVG source icon
│   └── icon.png         # Generated PNG (run npm run create-icon)
│
└── scripts/
    └── create-icon.js   # Icon generator (uses sharp)
```

---

## Architecture

### Authentication Flow

```
App opens
    │
    ▼
Check localStorage for session token
    │
    ├── Token found → Validate with main process (SQLite)
    │       ├── Valid → Show App
    │       └── Invalid/expired → Show Login
    │
    └── No token → Show Login

Register flow:
  Fill form → Register (main.js: hash pw, save to SQLite, send code) → Verify screen
  Enter 6-digit code → Verify (main.js: check code, mark verified, create session) → App

Login flow:
  Email + password → Login (main.js: check hash, create session token) → App
```

### Database (SQLite)

Stored at: `~/.config/flowvity/flowvity.db` (Linux/Windows)
           `~/Library/Application Support/flowvity/flowvity.db` (macOS)

```sql
users    — id, username, email, password_hash, verification_code, is_verified
sessions — id, user_id, token, expires_at
```

Passwords are hashed with **bcryptjs** (12 rounds).
Session tokens are 32-byte random hex strings, valid for 30 days.

### User Data Isolation

Each user's productivity data (tasks, habits, sessions, points) is stored in
`localStorage` namespaced by their user ID:

```
{user.id}_tasks
{user.id}_habits
{user.id}_sessions
...
```

So multiple users can share the same device without mixing data.

### Security

- `contextIsolation: true` — renderer cannot access Node.js APIs directly
- `nodeIntegration: false` — no direct Node.js in renderer
- All auth logic runs in the main process (never exposed to renderer)
- `preload.js` uses `contextBridge` to expose only safe, typed methods

---

## Customization

### Change app colors

Edit the `C` object at the top of `src/renderer.js`:

```js
const C = {
  mint: '#14F0A0',   // primary accent
  amber: '#FBBF24',  // points / warnings
  blue: '#60A5FA',   // info
  ...
};
```

### Change window size

In `main.js`:

```js
const win = new BrowserWindow({
  width: 1280,   // default width
  height: 820,   // default height
  minWidth: 760, // minimum usable width
  minHeight: 560,
  ...
});
```

### Session duration

In `main.js`, change `30 * 24 * 60 * 60 * 1000` (30 days) to your preferred duration.

### Verification code expiry

In `main.js`, change `15 * 60 * 1000` (15 minutes) as needed.

---

## Building for Distribution

### Windows (.exe)
```bash
npm run build
# Output: out/make/squirrel.windows/
```

### macOS (.dmg)
```bash
npm run build
# Output: out/make/zip/darwin/
```
Note: macOS builds require code signing for distribution outside the App Store.

### Linux (.deb / .rpm)
```bash
npm run build
# Output: out/make/deb/ or out/make/rpm/
```

---

## Troubleshooting

### "Email sending failed" error
- Make sure `.env` file exists and has correct SMTP credentials
- For Gmail: use an App Password, not your regular password
- Test with `node -e "require('dotenv').config(); console.log(process.env.SMTP_USER)"`

### Icon not showing
- Run `npm run create-icon` first
- Make sure `assets/icon.png` exists

### App won't start
- Run `npm install` again
- Check Node.js version: `node --version` (needs 18+)
- Check for errors: `npm start` shows the dev console

### Native module rebuild errors
- Run `npm rebuild` or `npx electron-rebuild`
- Check that your Node.js version matches the Electron version

---

## License

MIT — Free to use, modify and distribute.
