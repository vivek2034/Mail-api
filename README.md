# Portfolio Contact Form Server

Receives contact form submissions and emails them directly to you. Includes auto-reply to the visitor.

## Quick Start (Local)

```powershell
cd C:\Users\v9591\portfolio-contact
npm install
copy .env.example .env
# Edit .env with your Gmail + App Password
npm start
```

Server runs on `http://localhost:3000`.

## Gmail App Password (Required)

Gmail blocks regular passwords for SMTP. You need an **App Password**:

1. Enable **2-Step Verification** on your Google Account.
2. Go to Google Account → Security → 2-Step Verification → **App passwords** (at the bottom).
3. Select app: `Mail`, device: `Other (Custom name)` → type `Portfolio`.
4. Copy the 16-character password.
5. Paste it into `.env` as `EMAIL_PASS`.

`.env`:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop   # without spaces
OWNER_EMAIL=your-email@gmail.com
```

## Deploy to Render (Free Tier) — Get a Public Link

1. Push this folder to a GitHub repo.
2. Go to [render.com](https://render.com) → **New → Web Service**.
3. Connect your GitHub repo.
4. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add Environment Variables (from `.env`):
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `OWNER_EMAIL`
   - `PORT` = `10000` (Render assigns this automatically; leave default)
6. Click **Create Web Service**.
7. You get a link like: `https://portfolio-contact-xyz.onrender.com`

## Use the Link in Your Projects

Update `API_URL` in `public/index.html`:

```js
const API_URL = 'https://your-server.onrender.com/api/contact';
```

You can host `public/index.html` anywhere (GitHub Pages, Netlify, Vercel, or even alongside the server on Render). The form will POST to your Render URL and you'll get emails directly.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/contact` | Submit contact form |
| `GET` | `/health` | Health check |

## Security Features

- Rate limiting: 5 submissions per 15 min per IP
- Input validation (required fields + email format)
- Helmet security headers
- CORS restriction (set `ALLOWED_ORIGIN` to your domain in production)
