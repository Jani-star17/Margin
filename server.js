const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-me";
const MAX_TEXT = 500000;
const MAX_TITLE = 200;
const MAX_AUTHOR = 120;
const MAX_REPORT = 1000;
const MAX_IMAGE_PROMPT = 32000;
const MAX_IMAGE_DATA = 20 * 1024 * 1024;
const IMAGE_MODEL = process.env.MARGIN_IMAGE_MODEL || "gpt-image-2.5-sunburst";

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const db = new Database(path.join(__dirname, "margin.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip_hash TEXT NOT NULL,
  FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
`);

const allowedCategories = new Set([
  "school",
  "college",
  "fiction",
  "nonfiction",
  "other"
]);

const customCategories = new Set();

function ipHash(req) {
  const ip = String(
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    ""
  );

  return crypto
    .createHash("sha256")
    .update(ip)
    .digest("hex");
}

const buckets = new Map();

function rateLimit(limit, windowMs) {
  return (req, res, next) => {
    const key = ipHash(req);
    const now = Date.now();

    let b = buckets.get(key);

    if (!b || now - b.start > windowMs) {
      b = {
        start: now,
        count: 0
      };
    }

    b.count++;
    buckets.set(key, b);

    if (b.count > limit) {
      return res.status(429).json({
        error: "Too many requests. Please try again later."
      });
    }

    next();
  };
}

app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    name: "Margin"
  })
);

app.get("/api/categories", (_req, res) => {
  const base = [
    "school",
    "college",
    "fiction",
    "nonfiction",
    "other"
  ];

  const user = [...customCategories].filter(
    x => !base.includes(x)
  );

  res.json({
    categories: [...base, ...user].slice(0, 50)
  });
});

app.post(
  "/api/categories",
  rateLimit(10, 60 * 60 * 1000),
  (req, res) => {
    const name = String(req.body.name || "")
      .trim()
      .replace(/\s+/g, " ");

    if (
      !name ||
      name.length > 40 ||
      !/^[\p{L}\p{N} _-]+$/u.test(name)
    ) {
      return res.status(400).json({
        error: "Invalid category"
      });
    }

    customCategories.add(name.toLowerCase());

    res.status(201).json({
      category: name.toLowerCase()
    });
  }
);

app.get(
  "/api/books",
  rateLimit(120, 60 * 60 * 1000),
  (req, res) => {
    const q = String(req.query.q || "").trim();
    const category = String(
      req.query.category || ""
    ).trim().toLowerCase();

    const limit = Math.min(
      Math.max(Number(req.query.limit || 30), 1),
      
