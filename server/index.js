import express from "express";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = process.env.DATA_DIR || path.join(root, "data");
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "clients.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    profile TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    industry TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'fresh',
    remarks TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  )
`);

const STATUSES = ["fresh", "message sent", "got reply", "hired"];
const FIELDS = ["name", "profile", "email", "website", "industry", "status", "remarks"];

function clean(body = {}) {
  const out = {};
  for (const f of FIELDS) if (typeof body[f] === "string") out[f] = body[f].slice(0, 5000);
  if (out.status && !STATUSES.includes(out.status)) delete out.status;
  return out;
}

const getOne = db.prepare("SELECT * FROM clients WHERE id = ?");

const app = express();
app.use(express.json());

app.get("/api/clients", (req, res) => {
  res.json(db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all());
});

app.post("/api/clients", (req, res) => {
  const row = { name: "", profile: "", email: "", website: "", industry: "", status: "fresh", remarks: "", ...clean(req.body) };
  const id = randomUUID();
  db.prepare(`INSERT INTO clients (id, ${FIELDS.join(", ")}, created_at) VALUES (?, ${FIELDS.map(() => "?").join(", ")}, ?)`)
    .run(id, ...FIELDS.map((f) => row[f]), Date.now());
  res.status(201).json(getOne.get(id));
});

app.patch("/api/clients/:id", (req, res) => {
  const patch = clean(req.body);
  const keys = Object.keys(patch);
  if (keys.length) {
    db.prepare(`UPDATE clients SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`)
      .run(...keys.map((k) => patch[k]), req.params.id);
  }
  const row = getOne.get(req.params.id);
  row ? res.json(row) : res.status(404).json({ error: "Not found" });
});

app.delete("/api/clients/:id", (req, res) => {
  db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// In production, serve the built React app from the same process.
const dist = path.join(root, "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, "index.html")));
}

// In dev, PORT may belong to Vite; the API always uses 3001 to match the Vite proxy.
const port = process.argv.includes("--dev") ? 3001 : process.env.PORT || 3001;
app.listen(port, () => console.log(`Client Tracker running on http://localhost:${port}`));
