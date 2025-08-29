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
# 2️⃣ Ensure .env exists
# --------------------
if [ ! -f .env ]; then
  echo -e "\033[1;31m⚠️ .env not found, creating placeholders...\033[0m"
  cat <<EOL > .env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_email_app_password
ALERT_EMAIL_RECIPIENT=alerts@yourdomain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
EOL
  echo -e "\033[1;32m✅ .env created with placeholders.\033[0m"
fi

# --------------------
# 3️⃣ Validate Email Environment Variables
# --------------------
required_vars=("EMAIL_HOST" "EMAIL_PORT" "EMAIL_USER" "EMAIL_PASS" "ALERT_EMAIL_RECIPIENT")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "\033[1;31m⚠️ Environment variable $var is missing. Filling placeholder...\033[0m"
    case $var in
      EMAIL_HOST) echo "EMAIL_HOST=smtp.example.com" >> .env ;;
      EMAIL_PORT) echo "EMAIL_PORT=587" >> .env ;;
      EMAIL_USER) echo "EMAIL_USER=youremail@example.com" >> .env ;;
      EMAIL_PASS) echo "EMAIL_PASS=your_email_password" >> .env ;;
      ALERT_EMAIL_RECIPIENT) echo "ALERT_EMAIL_RECIPIENT=alerts@example.com" >> .env ;;
    esac
  fi
done

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

    // Periodic monitoring every 5 minutes
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
# 7️⃣ Tail backend log in real-time (optional)
# --------------------
LOG_FILE="./logs/backend.log"
echo -e "\033[1;34m📖 Tailing backend log file in real time...\033[0m"

if [ -f "$LOG_FILE" ]; then
  tail -f "$LOG_FILE"
else
  echo -e "\033[1;31m⚠️ Log file not found: $LOG_FILE\033[0m"
fi