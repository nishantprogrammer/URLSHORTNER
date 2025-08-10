### URL Shortener — Full‑Stack App (React + Express + MongoDB)

A minimal, production‑minded URL shortener with custom aliases, QR codes, and basic analytics. The frontend is built with React (Vite + Tailwind), and the backend is built with Express + Mongoose, using nanoid for short codes.

---

## Features

- **Short links**: Convert a long URL into a compact short link
- **Custom slugs**: Choose your own alias (validated, collision‑checked, reserved words blocked)
- **Redirects**: Hitting the short link 302‑redirects to the original URL
- **QR codes**: Auto‑generated PNG QR code for each short link
- **Analytics**: Per‑short‑link history with per‑IP aggregated click counts; simple admin dashboard in the UI

---

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, lucide‑react icons
- **Backend**: Node.js, Express, Mongoose, nanoid
- **Database**: MongoDB (Atlas or local)

---

## Project Structure

```
URL SHORTNER/
  Backend/
    Controllers/
      url.js
    Models/
      Url.js
      Admin.js
    Routes/
      urlRoutes.js
    utils/
      db.js
    server.js
    package.json
  Frontend/
    src/
      Code/
        Logic.jsx
        Navigation.jsx
      main.jsx
      App.jsx
    index.html
    package.json
```

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ (or pnpm/yarn if you prefer; commands below use npm)
- A MongoDB connection string (Atlas or local)

---

## Quick Start

1) Backend setup

Create a `.env` file in `Backend/`:

```
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
PORT=8000
# Optional: set to your public origin in production (e.g., https://short.yourdomain.com)
PUBLIC_BASE_URL=http://localhost:8000
# Admin password will be set automatically on first use (default: "admin123")
# You can change it later through the admin interface
```

Install and run the backend:

```bash
cd Backend
npm install
npm start
# You should see: "MongoDb Connected Successfully" and "Server is Running on Port 8000"
```

2) Frontend setup

Create `Frontend/.env`:

```
VITE_API_BASE=http://localhost:8000
```

Install and run the frontend dev server:

```bash
cd ../Frontend
npm install
npm run dev
# Open the URL printed by Vite (default http://localhost:5173)
```

Note: The backend CORS origin is configured via `CORS_ORIGIN` (defaults to `http://localhost:5173`). If your frontend runs elsewhere, set `CORS_ORIGIN` in `Backend/.env`.

---

## Configuration Notes

- Frontend points to the backend via `VITE_API_BASE` exposed in `Frontend/.env` (fallbacks to `http://localhost:8000`). See `Frontend/src/config.js`.
- Admin access is controlled by a password-based authentication system stored in the database.
- Backend builds full short URLs using `PUBLIC_BASE_URL` if set; otherwise it defaults to `http://localhost:<PORT>`.

Admin Access:
- The Analytics section is only visible after successful admin login.
- Admin password is stored securely in the database (default: "admin123").
- Password can be changed through the admin interface after login.
- Rate limiting protects against brute force attacks (5 attempts, 5-minute lockout).

---

## Using the App (UI)

1) Open the frontend in your browser (default `http://localhost:5173`).
2) Paste a long URL. Optionally enable “Use custom short URL” and enter a slug.
3) Click “Shorten URL”.
4) Copy, open, or download the QR for the generated short link.
5) Click the “Analytics” tab to view basic stats (most recent 100 URLs, total clicks, unique visitors, created date). The admin endpoint is protected by an API key; see Security below. The Analytics tab is only visible if the frontend is configured with `VITE_ADMIN_KEY`.

Output example (UI):

- After shortening: you’ll see a read‑only field with your new short URL, copy and open buttons, and a QR preview with a “Download QR” button.
- In Analytics: you’ll see a table of short codes, their original URLs, click counts, creation dates, and an action to open the short URL.

---

## API Reference

Base URL (dev): `http://localhost:8000`

### POST /shorten

Create a short link.

Request body (JSON):

```json
{
  "originalUrl": "https://example.com/some/very/long/path",
  "customSlug": "optional-alias"
}
```

Responses:

- 201 Created (new short link)

```json
{
  "message": "Short URL created successfully",
  "data": {
    "_id": "673c...",
    "originalUrl": "https://example.com/some/very/long/path",
    "shortUrl": "abc123",
    "createdAt": "2025-01-01T12:34:56.789Z",
    "history": []
  },
  "fullShortUrl": "http://localhost:8000/abc123",
  "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=http%3A%2F%2Flocalhost%3A8000%2Fabc123"
}
```

- 200 OK (existing mapping found when no custom slug was requested)

```json
{
  "message": "Short URL already exists",
  "data": {
    "_id": "673c...",
    "originalUrl": "https://example.com/some/very/long/path",
    "shortUrl": "abc123",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "history": []
  },
  "fullShortUrl": "http://localhost:8000/abc123",
  "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=http%3A%2F%2Flocalhost%3A8000%2Fabc123"
}
```

- 400 Bad Request (invalid URL or invalid custom slug)
- 409 Conflict (custom slug already taken)

Curl example:

```bash
curl -s -X POST http://localhost:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{
        "originalUrl": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        "customSlug": "js-docs"
      }'
```

### GET /:shortId

Redirects (302) to the original URL. Example:

```bash
curl -I http://localhost:8000/abc123
# HTTP/1.1 302 Found
# Location: https://example.com/some/very/long/path
```

### GET /analytics/:shortId

Returns analytics for a specific short link. No authentication required.

```bash
curl -s http://localhost:8000/analytics/abc123 | jq
```

Sample response:

```json
{
  "originalUrl": "https://example.com/some/very/long/path",
  "shortUrl": "abc123",
  "createdAt": "2025-01-01T12:34:56.789Z",
  "fullShortUrl": "http://localhost:8000/abc123",
  "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=http%3A%2F%2Flocalhost%3A8000%2Fabc123",
  "analytics": {
    "totalClicks": 4,
    "uniqueVisitors": 2,
    "recentClicks": [
      { "ip": "203.0.113.10", "count": 1 },
      { "ip": "198.51.100.21", "count": 3 }
    ]
  },
  "history": [
    { "ip": "203.0.113.10", "count": 1 },
    { "ip": "198.51.100.21", "count": 3 }
  ]
}
```

### GET /availability?slug=...

Checks if a custom alias is valid and available.

```bash
curl -s "http://localhost:8000/availability?slug=my-alias" | jq
```

Possible statuses in the JSON response:

- `available`
- `taken`
- `invalid` (bad format or reserved word)
- `error`

### GET /admin/stats

Returns an array of recent URLs plus a summary. No authentication required.

```bash
curl -s http://localhost:8000/admin/stats | jq
```

Sample response (truncated):

```json
{
  "message": "Stats retrieved successfully",
  "summary": {
    "totalUrls": 2,
    "totalClicks": 7,
    "totalUniqueVisitors": 3
  },
  "urls": [
    {
      "_id": "673c...",
      "originalUrl": "https://example.com/some/very/long/path",
      "shortUrl": "abc123",
      "createdAt": "2025-01-01T12:34:56.789Z",
      "totalClicks": 4,
      "uniqueVisitors": 2,
      "fullShortUrl": "http://localhost:8000/abc123",
      "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=http%3A%2F%2Flocalhost%3A8000%2Fabc123",
      "history": [ { "ip": "198.51.100.21", "count": 3 } ]
    }
  ]
}
```

---

## Custom Slug Rules

- Length: 3–20 characters
- Allowed: letters, numbers, hyphens (-), underscores (_)
- Blocked reserved words: `admin`, `api`, `www`, `root`, `system`, `login`, `logout`, `signup`, `register`, `help`, `support`, `status`, `static`, `assets`, `public`, `private`, `dashboard`, `settings`, `user`, `users`, `auth`, `oauth`, `security`, `shorten`, `analytics`, `availability`, `favicon.ico`

If a custom slug is provided and already exists, you’ll receive HTTP 409.

---

## How QR Codes Work

Each API response includes a `qrCodeUrl` that points to a PNG generated by `api.qrserver.com`. The QR encodes the full short URL (e.g., `http://localhost:8000/abc123`). In the UI, you can preview and download the QR as `qrcode-<slug>.png`.

---

## Troubleshooting

- Backend doesn’t start / Mongo errors
  - Verify `MONGO_URI` in `Backend/.env` is correct and reachable
  - Ensure your IP is allowed in MongoDB Atlas network access

- CORS error in the browser
  - The backend allows `http://localhost:5173` by default; update `Backend/server.js` CORS `origin` if your frontend runs elsewhere

- Short URL redirects to the wrong domain
  - Set `PUBLIC_BASE_URL` in `Backend/.env` to your public backend origin (e.g., `https://short.yourdomain.com`)

- Custom slug marked invalid
  - Check length/characters and ensure you’re not using a reserved word (see list above)

---

## Admin Authentication

The admin system uses a secure password-based authentication:

- **Default Password**: `admin123` (set automatically on first use)
- **Password Storage**: Securely stored in MongoDB database
- **Password Change**: Available through the admin interface after login
- **Rate Limiting**: 5 failed attempts result in a 5-minute lockout
- **Security Features**: Password visibility toggle, persistent lockout state

### Admin API Endpoints

- `POST /admin/verify` - Verify admin password
- `PUT /admin/password` - Change admin password

---

## Deployment Notes

- Set `PUBLIC_BASE_URL` to your public backend origin
- The admin system is database-backed and doesn't require environment variables
- Adjust CORS to your frontend’s domain
- For the frontend, build with `npm run build` and host the `dist/` folder

---

## License

This project is provided as‑is for learning and experimentation. Add your preferred license if you intend to publish.


