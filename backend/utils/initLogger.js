import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFile = path.join(logDir, "backend.log");

/**
 * Logs initialization info to console and file
 * @param {boolean} periodic - true if this is a periodic report
 */
export async function logInitialization(periodic = false) {
  const timestamp = new Date().toISOString();
  const type = periodic ? "Periodic" : "Startup";
  const message = `[${timestamp}] [${type}] Backend is running ✅\n`;

  console.log(message);

  fs.appendFile(logFile, message, err => {
    if (err) console.error("❌ Failed to write log:", err.message);
  });
}