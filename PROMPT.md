# Original build prompt

Build "Margin", a free, ad-free, installable book reading web app (PWA) with a small Node backend.

Requirements:
1. Reader: paginated-scroll text reader with font size, light/dark theme, remembered reading position per book. Also opens PDFs.
2. Offline first: save books to IndexedDB; a service worker caches the app shell so the app opens with no internet. Minimal network use: search returns metadata only, full text fetched once on Save.
3. Writing and publishing: any visitor can write a book and publish it publicly with no account, no payment, no ads. Fields: title, author name (optional), category (school, college, fiction, nonfiction, other), text. Backend validates length, rate-limits per IP, stores in SQLite, and has an admin-token DELETE endpoint for moderation.
4. Discover: search community books by title/author/category, and search Project Gutenberg through an allow-listed server proxy (public-domain only).
5. Download and store: every book can be saved to the device and read offline; also let users import their own .txt and .pdf files.
6. Mobile first UI, 380px wide, accessible (focus rings, labels, reduced motion), no tracking or third-party scripts.
7. Stack: Node 18+, Express, better-sqlite3, plain HTML/CSS/JS (no build step).

Content policy: only public-domain or user-owned/permitted content. Do not scrape or bundle copyrighted books. Include a README explaining deployment and moderation.

Extension:
- EPUB import
- bookmarks and highlights
- Tamil language UI
- user-suggested categories
- report button on community books
- text-to-speech read-aloud button
