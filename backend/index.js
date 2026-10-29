const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;
const ENGINE_URL = process.env.ENGINE_URL || "http://127.0.0.1:8000";
const ALLOWED = new Set([".tf", ".yaml", ".yml"]);

app.use(cors());

// File RAM mein rakhte hain, max 1 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.post("/api/scan", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded (field name: file)" });
  }

  const name = path.basename(req.file.originalname);
  if (!ALLOWED.has(path.extname(name).toLowerCase())) {
    return res
      .status(400)
      .json({ error: "Only .tf, .yaml and .yml files are supported" });
  }

  try {
    const form = new FormData();
    form.append("file", new Blob([req.file.buffer]), name);

    const engineRes = await fetch(`${ENGINE_URL}/scan`, {
      method: "POST",
      body: form,
    });
    const data = await engineRes.json();
    return res.status(engineRes.status).json(data);
  } catch (err) {
    return res
      .status(502)
      .json({ error: "Engine is not reachable", detail: err.message });
  }
});

// multer ke errors (jaise file bohat badi)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});