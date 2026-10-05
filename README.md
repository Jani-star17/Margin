# Margin

Margin is a free, ad-free, offline-first book-reading PWA with a small Node/SQLite community publishing backend.

## Features

- Mobile-first installable PWA
- TXT, PDF and EPUB import
- IndexedDB local library
- Remembered reading position
- Font size and light/dark theme
- Bookmarks and text highlights
- Browser text-to-speech read-aloud
- Community publishing without accounts or payments
- Search community books by title/author/category
- User-suggested categories
- Report button for community books
- Project Gutenberg metadata search and allow-listed public-domain text proxy
- Service-worker app-shell caching
- Tamil/English UI toggle
- No analytics, ads, tracking pixels or CDN scripts

## Requirements

- Node.js 18+
- npm

## Run

```bash
npm install
ADMIN_TOKEN="replace-with-a-long-random-secret" npm start
```

Then open `http://localhost:3000`.

On Windows PowerShell:

```powershell
$env:ADMIN_TOKEN="replace-with-a-long-random-secret"
npm start
```

For development:

```bash
npm run dev
```

The SQLite database is created automatically as `margin.sqlite`.

## Production deployment

Use a Node host such as a VPS or managed Node service. Set:

- `PORT` to the platform's supplied port
- `ADMIN_TOKEN` to a long random secret

Put HTTPS in front of the app in production so the PWA service worker and secure browser APIs work reliably.

## Moderation

Community books are public and anonymous. The backend applies basic per-IP rate limits and stores a one-way SHA-256 hash of the client IP rather than the raw IP.

Delete a book with:

```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://your-domain.example/api/books/123
```

Reports are stored in SQLite. This starter intentionally does not expose reports publicly.

For a real public deployment, add an authenticated admin dashboard or a protected process for reviewing the `reports` table.

## Content policy

Only publish content you own, have permission to distribute, or that is public domain. Do not upload or bundle copyrighted books without permission. Project Gutenberg availability varies by jurisdiction; users are responsible for confirming that a particular work is lawful to use where they live.

## Gutenberg

Search uses the Gutendex public catalog API from the server. The app only proxies text from explicit `www.gutenberg.org` URLs constructed from a selected Gutenberg ID. It does not accept arbitrary remote URLs.

## EPUB note

EPUB import is performed locally in the browser. The built-in ZIP reader handles standard stored/deflated EPUB entries and extracts the reading order from `container.xml`, the OPF manifest and spine. Some unusual EPUBs may require a more complete EPUB parser.

## Privacy

Margin does not include analytics, advertising, tracking scripts, or third-party browser scripts. Community publishing necessarily sends a published book to the Margin server.
