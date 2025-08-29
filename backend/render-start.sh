#!/bin/bash
echo -e "\033[1;34m🚀 Starting Mobile Mechanic Backend (Render One-Command Deploy)\033[0m"

# --------------------
# 1️⃣ Install dependencies
# --------------------
echo -e "\033[1;33m📦 Installing dependencies...\033[0m"
npm install

# --------------------
# 1.5️⃣ Preflight: Check module paths
# --------------------
echo -e "\033[1;33m🔍 Checking essential module paths...\033[0m"
node -e "
import fs from 'fs';
import path from 'path';

const modules = [
  './config/db.js',
  './utils/initLogger.js',
  './utils/alertMailer.js',
  './utils/alertSlack.js',
  './middleware/errorMiddleware.js',
  './routes/auth.js',
  './routes/users.js',
  './routes/bookings.js'
];

let allFound = true;

modules.forEach(mod => {
  const resolved = path.resolve(mod);
  if (!fs.existsSync(resolved)) {
    console.error('\033[1;31m❌ Missing module:\033[0m', mod);
    allFound = false;
  } else {
    console.log('\033[1;32m✅ Found module:\033[0m', mod);
  }
});

if (!allFound) {
  console.error('\033[1;31m❌ One or more modules are missing. Fix paths before deploying.\033[0m');
  process.exit(1);
} else {
  console.log('\033[1;32m✅ All modules verified successfully.\033[0m');
}
"

# --------------------
# 2️⃣ Environment Variable Validation
# --------------------
echo -e "\033[1;33m🔍 Validating critical environment variables...\033[0m"
node -e "
const requiredVars = [
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'ALERT_EMAIL_RECIPIENT'
];

let allSet = true;
requiredVars.forEach(v => {
  if (!process.env[v] || process.env[v].trim() === '') {
    console.error('\033[1;31m❌ Missing environment variable:\033[0m', v);
    allSet = false;
  } else {
    console.log('\033[1;32m✅ Found environment variable:\033[0m', v);
  }
});

if (!allSet) {
  console.error('\033[1;31m❌ One or more critical environment variables are missing. Fix them before starting the backend.\033[0m');
  process.exit(1);
} else {
  console.log('\033[1;32m✅ All critical environment variables are set.\033[0m');
}
"

# --------------------
# 3️⃣ Ensure .env exists (optional if using Render environment)
# --------------------
if [ ! -f .env ]; then
  echo -e "\033[1;31m⚠️ .env not found, creating placeholders...\033[0m"
  cat <<EOL > .env
PORT=5000
MONGO_URI=mongodb+srv://DB_USER:DB_PASSWORD@cluster.mongodb.net/garageApp?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_email_app_password
ALERT_EMAIL_RECIPIENT=alerts@yourdomain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
EOL
  echo -e "\033[1;32m✅ .env created with placeholders.\033[0m"
fi

# --------------------
# 4️⃣ MongoDB connection check
# --------------------
echo -e "\033[1;33m🧪 Testing MongoDB connection...\033[0m"
node -e "
import dotenv from 'dotenv';
import connectDB from './config/db.js';
dotenv.config();
connectDB()
  .then(() => console.log('\033[1;32m✅ MongoDB connection successful\033[0m'))
  .catch(err => console.error('\033[1;31m❌ MongoDB failed:\033[0m', err.message));
"

# --------------------
# 5️⃣ Run initialization report
# --------------------
echo -e "\033[1;33m🧪 Running initialization report...\033[0m"
node -e "
import { logInitialization } from './utils/initLogger.js';
import fs from 'fs';
import path from 'path';

const logFilePath = path.resolve('./logs/backend.log');
if (!fs.existsSync(path.dirname(logFilePath))) fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

const logToFile = async (msg) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, \`[\${timestamp}] \${msg}\n\`);
};

try {
  await logInitialization();
  console.log('\033[1;32m✅ Initialization report logged\033[0m');
  await logToFile('Initialization report logged ✅');
} catch (err) {
  console.error('\033[1;31m❌ Initialization report failed:\033[0m', err.message);
  await logToFile('Initialization report failed ❌: ' + err.message);
}
"

# --------------------
# 6️⃣ Start backend server with self-monitoring
# --------------------
echo -e "\033[1;34m🌐 Starting backend server with periodic monitoring...\033[0m"
node -e "
import dotenv from 'dotenv';
import express from 'express';
import connectDB from './config/db.js';
import { logInitialization } from './utils/initLogger.js';
import { sendEmailAlert } from './utils/alertMailer.js';
import { sendSlackAlert } from './utils/alertSlack.js';
import fs from 'fs';
import path from 'path';
dotenv.config();

const app = express();
app.get('/', (req, res) => res.send('Backend API is running ✅'));

const PORT = process.env.PORT || 5000;
const logFilePath = path.resolve('./logs/backend.log');
if (!fs.existsSync(path.dirname(logFilePath))) fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

const logToFile = async (msg) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, \`[\${timestamp}] \${msg}\n\`);
};

const startServer = async () => {
  try {
    await connectDB();
    console.log('\033[1;32m🚀 Server connected to MongoDB\033[0m');
    await logInitialization();
    console.log('\033[1;32m✅ Initialization report logged\033[0m');
    await logToFile('Server startup and initialization report ✅');

    app.listen(PORT, () => console.log(\`🚀 Server running on port \${PORT}\`));

    const intervalMs = 5 * 60 * 1000;
    setInterval(async () => {
      try {
        await logInitialization(true);
        console.log('\033[1;36m⏱ Periodic report sent successfully ✅\033[0m');
        await logToFile('Periodic initialization report sent ✅');
      } catch (err) {
        const errMsg = 'Periodic report failed: ' + err.message;
        console.error('\033[1;31m❌ ' + errMsg + '\033[0m');
        await logToFile(errMsg);
        await sendEmailAlert('Backend Alert: Periodic Report Failed', err.message);
        await sendSlackAlert('Backend Alert: Periodic Report Failed:\n' + err.message);
      }
    }, intervalMs);

  } catch (err) {
    const errMsg = 'Server failed to start: ' + err.message;
    console.error('\033[1;31m❌ ' + errMsg + '\033[0m');
    await logToFile(errMsg);
    await sendEmailAlert('Backend Alert: Startup Failure', err.message);
    await sendSlackAlert('Backend failed to start:\n' + err.message);
    process.exit(1);
  }
};

startServer();
"

# --------------------
# 7️⃣ Ensure log file exists before tailing
# --------------------
mkdir -p ./logs
touch ./logs/backend.log

# --------------------
# 8️⃣ Tail backend log in real-time (optional)
# --------------------
LOG_FILE="./logs/backend.log"
echo -e "\033[1;34m📖 Tailing backend log file in real time...\033[0m"
tail -f "$LOG_FILE"