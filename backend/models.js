const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    file: { type: String, required: true },
    type: String,
    risk: {
      score: Number,
      level: String,
    },
    summary: {
      total: Number,
      high: Number,
      medium: Number,
      low: Number,
    },
    findings: [mongoose.Schema.Types.Mixed],
        reportKey: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scan", scanSchema);