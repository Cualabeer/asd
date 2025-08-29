import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { sendEmailAlert } from "./alertMailer.js";
import { sendSlackAlert } from "./alertSlack.js";

dotenv.config();

export async function logInitialization(periodic = false) {
  try {
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    const message = `[${new Date().toISOString()}] Backend initialization ${
      periodic ? "(periodic)" : "(startup)"
    } ✅`;
    fs.appendFileSync(path.join(logDir, "startup.log"), message + "\n");

    console.log(message);
  } catch (err) {
    console.error("❌ Initialization report failed:", err.message);
    try { await sendEmailAlert("Backend Init Failed", err.message); } catch {}
    try { await sendSlackAlert(`Backend Init Failed: ${err.message}`); } catch {}
  }
}