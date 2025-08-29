import fs from "fs";
import path from "path";
import os from "os";

// Dashboard routes
app.get("/api/dashboard/status", (req, res) => {
  if (req.query.token !== process.env.REPORT_TOKEN) return res.status(403).json({ message: "Forbidden" });

  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  const cpuLoad = os.loadavg();

  res.json({
    backend: "✅ Running",
    nodeVersion: process.version,
    uptime: `${Math.floor(uptime/60)} min`,
    memory: `${Math.round(memoryUsage.rss/1024/1024)} MB`,
    cpuLoad: cpuLoad.map(x => x.toFixed(2)),
  });
});

app.get("/api/dashboard/logs", (req, res) => {
  if (req.query.token !== process.env.REPORT_TOKEN) return res.status(403).send("Forbidden");
  const logPath = path.join(process.cwd(), "logs/startup.log");
  fs.readFile(logPath, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Failed to read logs");
    res.send(data);
  });
});

app.get("/dashboard", (req, res) => {
  if (req.query.token !== process.env.REPORT_TOKEN) return res.status(403).send("Access Denied");
  res.sendFile(path.join(process.cwd(), "dashboard.html"));
});