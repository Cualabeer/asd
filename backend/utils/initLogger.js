import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { sendEmailAlert } from "./alertMailer.js";
import { sendSlackAlert } from "./alertSlack.js";

dotenv.config();

export async function logInitialization(periodic = false) {
  const logDir = path.join(process.cwd(), "logs");
  const logFile = path.join(logDir, "startup.log");

  try {
    // Ensure logs folder exists
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    // Construct message
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] Backend initialization ${
      periodic ? "(periodic)" : "(startup)"
    } ✅`;

    // Append to log file
    fs.appendFileSync(logFile, message + "\n");

    // Output to console
    console.log(message);

  } catch (err) {
    console.error("❌ Initialization report failed:", err.message);

    // Try sending alerts
    try {
      await sendEmailAlert(
        `Backend Init Failed${periodic ? " (periodic)" : ""}`,
        err.message
      );
    } catch (emailErr) {
      console.error("❌ Email alert failed:", emailErr.message);
    }

    try {
      await sendSlackAlert(`Backend Init Failed${periodic ? " (periodic)" : ""}: ${err.message}`);
    } catch (slackErr) {
      console.error("❌ Slack alert failed:", slackErr.message);
    }
  }
}