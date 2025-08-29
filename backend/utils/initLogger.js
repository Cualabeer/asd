import fs from "fs";
import path from "path";

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
  }
}