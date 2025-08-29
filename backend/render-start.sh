#!/bin/bash
echo "🌐 Starting Mobile Mechanic Backend (Render One-Command Deploy)"

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
# 3️⃣ Ensure critical packages
# --------------------
critical_packages=(nodemailer node-fetch)
for pkg in "${critical_packages[@]}"; do
  if ! npm list "$pkg" >/dev/null 2>&1; then
    echo "⚠️ $pkg not found, installing..."
    npm install "$pkg"
  fi
done

# --------------------
# 4️⃣ Prepare logs folder
# --------------------
mkdir -p logs
echo "$(date) - Backend deploy started" >> logs/startup.log
echo "✅ Logs folder ready"

# --------------------
# 5️⃣ MongoDB connection check
# --------------------
echo "🧪 Testing MongoDB connection..."
node -e "
import dotenv from 'dotenv';
import connectDB from './config/db.js';
dotenv.config(); // This will use process.env if no .env file exists
connectDB()
  .then(()=>console.log('✅ MongoDB connection successful'))
  .catch(err=>{
    console.error('❌ MongoDB failed:', err.message);
    process.exit(1);
  });
"

# --------------------
# 6️⃣ Test alert system (email + Slack)
# --------------------
echo "📣 Testing alert system..."
node -e "
import dotenv from 'dotenv';
import { sendEmailAlert } from './utils/alertMailer.js';
import { sendSlackAlert } from './utils/alertSlack.js';
dotenv.config();

(async () => {
  try {
    await sendEmailAlert('Backend Startup Test', 'This is a test alert for email notifications.');
    console.log('✅ Test email sent successfully');
  } catch (err) {
    console.error('❌ Test email failed:', err.message);
  }

  try {
    await sendSlackAlert('Backend Startup Test: This is a Slack test message.');
    console.log('✅ Test Slack message sent successfully');
  } catch (err) {
    console.error('❌ Test Slack message failed:', err.message);
  }
})();
"

# --------------------
# 7️⃣ MongoDB health check
# --------------------
echo "🩺 Running backend health check..."
node -e "
import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

(async () => {
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    const collections = await db.connection.db.listCollections().toArray();
    if (!collections || collections.length === 0) {
      console.error('❌ MongoDB has no collections!');
      process.exit(1);
    }
    console.log('✅ MongoDB connection OK, collections found:', collections.map(c => c.name).join(', '));
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
"

# --------------------
# 8️⃣ Initialization report
# --------------------
echo "🧪 Running initialization report..."
node -e "
import { logInitialization } from './utils/initLogger.js';
logInitialization();
"

# --------------------
# 9️⃣ Start backend server
# --------------------
echo "🚀 Launching server..."
# Bind directly to the PORT environment variable for Render
node server.js