const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const db = new Database(process.env.DB_FILE || "books.db");
db.exec(`CREATE TABLE IF NOT EXISTS books(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL, author TEXT, category TEXT DEFAULT 'other',
  text TEXT NOT NULL, created INTEGER NOT NULL)`);
for (const c of ["cover TEXT", "images TEXT"]) { try { db.exec("ALTER TABLE books ADD COLUMN " + c); } catch (e) {} }
const okImg = s => typeof s === "string" && s.startsWith("data:image/jpeg;base64,") && s.length < 400000;

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "4mb" }));

const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 3600e3;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  if (arr.length >= 10) return true;
  arr.push(now); hits.set(ip, arr); return false;
}

const CATS = ["school", "college", "fiction", "nonfiction", "other"];

app.get("/api/books", (req, res) => {
  const q = "%" + String(req.query.q || "").slice(0, 100) + "%";
  const cat = CATS.includes(req.query.category) ? req.query.category : null;
  const rows = db.prepare(
    `SELECT id,title,author,category,created,cover FROM books
     WHERE (title LIKE ? OR author LIKE ?) AND (? IS NULL OR category = ?)
     ORDER BY created DESC LIMIT 50`).all(q, q, cat, cat);
  res.json(rows);
});

app.get("/api/books/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  try { row.images = JSON.parse(row.images || "[]"); } catch (e) { row.images = []; }
  res.json(row);
});

app.post("/api/books", (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Too many books this hour. Try later." });
  let { title, author, category, text, cover, images } = req.body || {};
  cover = okImg(cover) ? cover : null;
  images = Array.isArray(images) ? images.filter(okImg).slice(0, 8) : [];
  title = String(title || "").trim().slice(0, 200);
  author = String(author || "Anonymous").trim().slice(0, 100);
  text = String(text || "").trim();
  category = CATS.includes(category) ? category : "other";
  if (!title || text.length < 50 || text.length > 1000000)
    return res.status(400).json({ error: "Title required; text must be 50 to 1,000,000 characters." });
  const r = db.prepare("INSERT INTO books(title,author,category,text,created,cover,images) VALUES(?,?,?,?,?,?,?)")
    .run(title, author, category, text, Date.now(), cover, JSON.stringify(images));
  res.json({ id: r.lastInsertRowid });
});

app.delete("/api/books/:id", (req, res) => {
  if (!ADMIN_TOKEN || req.get("x-admin-token") !== ADMIN_TOKEN) return res.sendStatus(403);
  db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
  res.sendStatus(204);
});

const ALLOWED = ["gutendex.com", "gutenberg.org", "www.gutenberg.org"];
app.get("/api/proxy", async (req, res) => {
  try {
    const u = new URL(String(req.query.url));
    if (u.protocol !== "https:" || !ALLOWED.includes(u.hostname)) return res.status(400).send("Source not allowed");
    const r = await fetch(u, { redirect: "follow" });
    const type = r.headers.get("content-type") || "text/plain";
    if (!/^(text\/|application\/json)/.test(type)) return res.status(415).send("Unsupported type");
    const body = await r.text();
    if (body.length > 8000000) return res.status(413).send("Too large");
    res.type(type).send(body);
  } catch (e) { res.status(502).send("Fetch failed"); }
});

app.use(express.static(path.join(__dirname, "public")));
app.listen(PORT, () => console.log("Margin running on http://localhost:" + PORT));
