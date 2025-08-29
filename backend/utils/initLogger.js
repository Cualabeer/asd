#!/bin/bash
echo "🚀 Starting Mobile Mechanic Backend (Render One-Command Deploy)"

# --------------------
# 1️⃣ Node.js version check
# --------------------
required_node_version="22"
current_node_version=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$current_node_version" -ne "$required_node_version" ]; then
  echo "❌ Node.js version mismatch: $current_node_version detected, $required_node_version required."
  exit 1
fi
echo "✅ Node.js version $current_node_version OK"

# --------------------
# 2️⃣ Install dependencies
# --------------------
npm install

# --------------------
# 3️⃣ Ensure .env exists
# --------------------
if [ ! -f .env ]; then
  echo "⚠️ .env not found, creating placeholders..."
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
REPORT_TOKEN=supersecrettoken123
EOL
  echo "✅ .env created with placeholders."
fi

# --------------------
# 4️⃣ Check critical environment variables
# --------------------
required_vars=("PORT" "MONGO_URI" "JWT_SECRET" "EMAIL_HOST" "EMAIL_PORT" "EMAIL_USER" "EMAIL_PASS" "ALERT_EMAIL_RECIPIENT" "SLACK_WEBHOOK_URL" "REPORT_TOKEN")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Environment variable $var is missing. Aborting deployment."
    exit 1
  fi
done
echo "✅ All critical environment variables are set."

# --------------------
# 5️⃣ Ensure critical packages
# --------------------
critical_packages=(nodemailer node-fetch)
for pkg in "${critical_packages[@]}"; do
  if ! npm list "$pkg" >/dev/null 2>&1; then
    echo "⚠️ $pkg not found, installing..."
    npm install "$pkg"
  fi
done

# --------------------
# 6️⃣ Prepare logs folder
# --------------------
mkdir -p logs
touch logs/startup.log logs/alerts.log
echo "$(date) - Backend deploy started" >> logs/startup.log
echo "✅ Logs folder ready"

# --------------------
# 7️⃣ MongoDB connection check
# --------------------
echo "🧪 Testing MongoDB connection..."
node -e "
import dotenv from 'dotenv';
import connectDB from './config/db.js';
dotenv.config();
connectDB()
  .then(()=>console.log('✅ MongoDB connection successful'))
  .catch(err=>{
    echo_msg = '❌ MongoDB failed: ' + err.message;
    console.error(echo_msg);
    require('fs').appendFileSync('./logs/alerts.log', echo_msg + '\n');
    process.exit(1);
  });
"

# --------------------
# 8️⃣ Test alert system (email + Slack)
# --------------------
echo "📣 Testing alert system (email + Slack)..."
node -e "
import dotenv from 'dotenv';
import { sendEmailAlert } from './utils/alertMailer.js';
import { sendSlackAlert } from './utils/alertSlack.js';
import fs from 'fs';
dotenv.config();

(async () => {
  try {
    await sendEmailAlert('Backend Startup Test', 'This is a test alert for email notifications.');
    console.log('✅ Test email sent successfully');
  } catch (err) {
    console.error('❌ Test email failed:', err.message);
    fs.appendFileSync('./logs/alerts.log', 'Email Test Failed: ' + err.message + '\n');
  }

  try {
    await sendSlackAlert('Backend Startup Test: This is a Slack test message.');
    console.log('✅ Test Slack message sent successfully');
  } catch (err) {
    console.error('❌ Test Slack message failed:', err.message);
    fs.appendFileSync('./logs/alerts.log', 'Slack Test Failed: ' + err.message + '\n');
  }
})();
"

# --------------------
# 9️⃣ MongoDB health check
# --------------------
echo "🩺 Running backend health check (MongoDB only)..."
node -e "
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
dotenv.config();

(async () => {
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    const collections = await db.connection.db.listCollections().toArray();

    if (!collections || collections.length === 0) {
      msg = '❌ MongoDB has no collections!';
      console.error(msg);
      fs.appendFileSync('./logs/alerts.log', msg + '\n');
      process.exit(1);
    }

    console.log('✅ MongoDB connection OK, collections found:', collections.map(c => c.name).join(', '));
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    fs.appendFileSync('./logs/alerts.log', 'Health Check Failed: ' + err.message + '\n');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
"

# --------------------
# 🔟 Initialization report
# --------------------
echo "🧪 Running initialization report..."
node -e "
import { logInitialization } from './utils/initLogger.js';
import fs from 'fs';
logInitialization().catch(err => fs.appendFileSync('./logs/alerts.log', 'Init Report Failed: ' + err.message + '\n'));
"

# --------------------
# 1️⃣1️⃣ Start backend server (Render-compatible)
# --------------------
echo "🌐 Starting backend server..."
# Bind to process.env.PORT for Render
node server.js 2>&1 | tee -a logs/startup.log | tee -a logs/alerts.log