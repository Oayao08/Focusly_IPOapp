'use strict';

const { app, BrowserWindow, ipcMain, nativeImage, shell } = require('electron');
const path   = require('path');
const crypto = require('crypto');

// Load .env before anything else (for SMTP credentials)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Database   = require('better-sqlite3');
const nodemailer = require('nodemailer');
const bcrypt     = require('bcryptjs');

/* ════════════════════════════════════════
   DATABASE  — stored in user's AppData
════════════════════════════════════════ */
const DB_PATH = path.join(app.getPath('userData'), 'flowvity.db');
let db;

function initDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      username         TEXT    NOT NULL,
      email            TEXT    UNIQUE NOT NULL,
      password_hash    TEXT    NOT NULL,
      verification_code TEXT,
      code_expires_at  INTEGER,
      is_verified      INTEGER DEFAULT 0,
      created_at       INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT    UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);
}

/* ════════════════════════════════════════
   EMAIL
════════════════════════════════════════ */
let transporter = null;

function getMailer() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendVerificationEmail(email, username, code) {
  const mailer = getMailer();
  await mailer.sendMail({
    from: process.env.SMTP_FROM || `"Flowvity" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Flowvity verification code',
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#080C12;font-family:'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:48px 24px">
    <table width="480" cellpadding="0" cellspacing="0"
      style="background:#0F1520;border-radius:20px;border:1.5px solid rgba(255,255,255,0.07);overflow:hidden">
      <tr><td style="padding:40px 40px 0">
        <div style="display:inline-block;background:rgba(20,240,160,0.1);border:1.5px solid rgba(20,240,160,0.3);
          border-radius:14px;padding:12px 18px;margin-bottom:24px">
          <span style="font-size:20px;font-weight:800;color:#14F0A0;letter-spacing:-0.5px">F</span>
        </div>
        <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#E2EAF2;letter-spacing:-0.5px">flowvity</h1>
        <p style="margin:0 0 32px;font-size:13px;color:#485569">Focus. Flow. Grow.</p>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:0 0 32px">
        <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#E2EAF2">Verify your email</h2>
        <p style="margin:0 0 28px;font-size:14px;color:#94A3B8;line-height:1.7">
          Hi <strong style="color:#E2EAF2">${username}</strong> — welcome to Flowvity!<br>
          Enter the code below in the app to verify your account.
        </p>
      </td></tr>
      <tr><td style="padding:0 40px">
        <div style="background:rgba(20,240,160,0.08);border:2px solid rgba(20,240,160,0.25);
          border-radius:16px;padding:28px;text-align:center;margin-bottom:28px">
          <div style="font-size:42px;font-weight:800;letter-spacing:14px;color:#14F0A0;
            font-family:'Courier New',monospace">${code}</div>
          <div style="font-size:12px;color:#485569;margin-top:10px">Expires in 15 minutes</div>
        </div>
        <p style="font-size:12px;color:#485569;line-height:1.7;margin:0 0 40px">
          If you didn't create a Flowvity account, you can safely ignore this email.
          Never share this code with anyone.
        </p>
      </td></tr>
      <tr><td style="background:#080C12;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05)">
        <p style="margin:0;font-size:11px;color:#485569;text-align:center">
          © ${new Date().getFullYear()} Flowvity — Focus. Flow. Grow.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`,
  });
}

/* ════════════════════════════════════════
   WINDOW
════════════════════════════════════════ */
let mainWin = null;

function createWindow() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, 'assets', 'icon.png')
  );

  mainWin = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 560,
    icon,
    backgroundColor: '#080C12',
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,   // needed so preload can use require
    },
  });

  mainWin.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWin.once('ready-to-show', () => {
    mainWin.show();
  });

  // Open external links in the system browser
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

/* ════════════════════════════════════════
   IPC — WINDOW CONTROLS
════════════════════════════════════════ */
ipcMain.handle('win:minimize',     () => mainWin?.minimize());
ipcMain.handle('win:maximize',     () => mainWin?.isMaximized() ? mainWin.unmaximize() : mainWin.maximize());
ipcMain.handle('win:close',        () => mainWin?.close());
ipcMain.handle('win:is-maximized', () => mainWin?.isMaximized() ?? false);
ipcMain.handle('win:platform',     () => process.platform);

/* ════════════════════════════════════════
   IPC — AUTH: REGISTER
════════════════════════════════════════ */
ipcMain.handle('auth:register', async (_e, { username, email, password }) => {
  try {
    // Validate inputs server-side
    if (!username?.trim() || !email?.trim() || !password) {
      return { success: false, error: 'All fields are required.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Invalid email address.' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return { success: false, error: 'This email is already registered.' };

    const hash    = await bcrypt.hash(password, 12);
    const code    = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 min

    db.prepare(`
      INSERT INTO users (username, email, password_hash, verification_code, code_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(username.trim(), email.toLowerCase(), hash, code, expires);

    await sendVerificationEmail(email.toLowerCase(), username.trim(), code);

    return { success: true };
  } catch (err) {
    console.error('[auth:register]', err);
    // Common SMTP errors get a user-friendly message
    if (err.code === 'EAUTH' || err.responseCode === 535) {
      return { success: false, error: 'Email sending failed. Check your SMTP configuration in .env' };
    }
    return { success: false, error: err.message };
  }
});

/* ════════════════════════════════════════
   IPC — AUTH: VERIFY
════════════════════════════════════════ */
ipcMain.handle('auth:verify', async (_e, { email, code }) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user)              return { success: false, error: 'User not found.' };
    if (user.is_verified)   return { success: false, error: 'Account already verified.' };
    if (user.verification_code !== code.trim())
                            return { success: false, error: 'Incorrect verification code.' };
    if (Date.now() > user.code_expires_at)
                            return { success: false, error: 'Code has expired. Please request a new one.' };

    db.prepare('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?').run(user.id);

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);

    return {
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email },
    };
  } catch (err) {
    console.error('[auth:verify]', err);
    return { success: false, error: err.message };
  }
});

/* ════════════════════════════════════════
   IPC — AUTH: LOGIN
════════════════════════════════════════ */
ipcMain.handle('auth:login', async (_e, { email, password }) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return { success: false, error: 'Invalid email or password.' };

    if (!user.is_verified) {
      return { success: false, error: 'Please verify your email first.', needsVerification: true, email: user.email };
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return { success: false, error: 'Invalid email or password.' };

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);

    return {
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email },
    };
  } catch (err) {
    console.error('[auth:login]', err);
    return { success: false, error: err.message };
  }
});

/* ════════════════════════════════════════
   IPC — AUTH: VALIDATE SESSION
════════════════════════════════════════ */
ipcMain.handle('auth:validate-session', async (_e, { token }) => {
  try {
    if (!token) return { valid: false };
    const row = db.prepare(`
      SELECT s.user_id, s.expires_at, u.username, u.email
      FROM   sessions s
      JOIN   users    u ON s.user_id = u.id
      WHERE  s.token = ?
    `).get(token);

    if (!row || Date.now() > row.expires_at) return { valid: false };
    return { valid: true, user: { id: row.user_id, username: row.username, email: row.email } };
  } catch (err) {
    return { valid: false };
  }
});

/* ════════════════════════════════════════
   IPC — AUTH: LOGOUT
════════════════════════════════════════ */
ipcMain.handle('auth:logout', async (_e, { token }) => {
  try {
    if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return { success: true };
  } catch {
    return { success: true };
  }
});

/* ════════════════════════════════════════
   IPC — AUTH: RESEND CODE
════════════════════════════════════════ */
ipcMain.handle('auth:resend-code', async (_e, { email }) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user)            return { success: false, error: 'User not found.' };
    if (user.is_verified) return { success: false, error: 'Account already verified.' };

    const code    = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 15 * 60 * 1000;

    db.prepare('UPDATE users SET verification_code = ?, code_expires_at = ? WHERE id = ?')
      .run(code, expires, user.id);

    await sendVerificationEmail(email.toLowerCase(), user.username, code);
    return { success: true };
  } catch (err) {
    console.error('[auth:resend-code]', err);
    return { success: false, error: err.message };
  }
});

/* ════════════════════════════════════════
   APP LIFECYCLE
════════════════════════════════════════ */
app.whenReady().then(() => {
  initDB();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (db) db.close();
});
