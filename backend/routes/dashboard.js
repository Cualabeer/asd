import express from "express";
import fs from "fs";
import mongoose from "mongoose";

const router = express.Router();

router.get("/status", async (req, res) => {
  const token = req.query.token;
  if(token !== process.env.REPORT_TOKEN) {
    return res.json({ error: "Invalid token" });
  }

  try {
    // MongoDB collections
    const db = await mongoose.connect(process.env.MONGO_URI);
    const collections = await db.connection.db.listCollections().toArray();
    await mongoose.disconnect();

    // Logs
    const logsPath = "./logs/startup.log";
    let logs = "";
    if(fs.existsSync(logsPath)) {
      logs = fs.readFileSync(logsPath, "utf-8");
    }

    res.json({
      message: "✅ Backend is running",
      collections: collections.map(c => c.name),
      logs
    });

  } catch (err) {
    res.json({ error: "❌ Failed to fetch dashboard: " + err.message });
  }
});

export default router;