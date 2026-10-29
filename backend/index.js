const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const Scan = require("./models");
const { uploadReport } = require("./s3");

const app = express();
const PORT = 3000;
const ENGINE_URL = process.env.ENGINE_URL || "http://127.0.0.1:8000";
const MONGO_URL =
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/iac_analyzer";
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

    if (engineRes.ok) {
      try {
        const saved = await Scan.create(data);
        data.id = saved._id;

        // Report ko S3 par bhi save karo (fail ho to scan phir bhi return hoga)
        try {
          const key = await uploadReport(saved._id, data);
          saved.reportKey = key;
          await saved.save();
          data.reportKey = key;
        } catch (s3Err) {
          console.error("Could not upload report to S3:", s3Err.message);
        }
      } catch (dbErr) {
        console.error("Could not save scan:", dbErr.message);
      }
    }
    return res.status(engineRes.status).json(data);
  } catch (err) {
    return res
      .status(502)
      .json({ error: "Engine is not reachable", detail: err.message });
  }
});

app.get("/api/scans", async (req, res) => {
  try {
    const scans = await Scan.find(
      {},
      "file type risk summary reportKey createdAt"
    )
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(scans);
  } catch (err) {
    res.status(500).json({ error: "Could not read history" });
  }
});

app.get("/api/scans/:id", async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) return res.status(404).json({ error: "Scan not found" });
    res.json(scan);
  } catch (err) {
    res.status(400).json({ error: "Invalid scan id" });
  }
});

// multer ke errors (jaise file bohat badi)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Internal server error" });
});

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });