// backend/utils/initReport.js
import { logInitialization } from './initLogger.js';
import fs from 'fs';
import path from 'path';

const logFilePath = path.resolve('./logs/backend.log');

// Ensure log folder exists
if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

// Helper to append messages to log file
const logToFile = async (msg) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${msg}\n`);
};

(async () => {
  try {
    await logInitialization();
    await logToFile('✅ Initialization report logged');
    console.log('✅ Initialization report completed');
  } catch (err) {
    await logToFile('❌ Initialization report failed: ' + err.message);
    console.error('❌ Initialization report failed:', err.message);
    process.exit(1);
  }
})();