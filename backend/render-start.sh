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
# 3️⃣ Check .env
# --------------------
if [ ! -f .env ]; then
  echo "⚠️ .env not found. Please create it with proper environment variables."
  exit 1
fi

# --------------------
# 4️⃣ Check critical packages
# --------------------
critical_packages=(nodemailer node-fetch)
for pkg in "${critical_packages[@]}"; do
  if ! npm list "$pkg" >/dev/null 2>&1; then
    echo "⚠️ $pkg not found, installing..."
    npm install "$pkg"
  fi
done

# --------------------
# 5️⃣ Create logs folder
# --------------------
mkdir -p logs
echo "$(date) - Backend deploy started" >> logs/startup.log
echo "✅ Logs folder ready"

# --------------------
# 6️⃣ MongoDB connection check
# --------------------
echo "🧪 Testing MongoDB connection..."
node -e "
import dotenv from 'dotenv';
import connectDB from './config/db.js';
dotenv.config();
connectDB()
  .then(()=>console.log('✅ MongoDB connection successful'))
  .catch(err=>{
    console.error('❌ MongoDB failed:', err.message);
    process.exit(1);
  });
"

# --------------------
# 7️⃣ Test alerts
# --------------------
echo "📣 Testing alert system (email + Slack)..."
node -e "
import dotenv from 'dotenv';
import { sendEmailAlert } from './utils/alertMailer.js';
import { sendSlackAlert } from './utils/alertSlack.js';
dotenv.config();

(async () => {
  try { await sendEmailAlert('Backend Startup Test', 'Email alert test.'); console.log('✅ Email test sent'); } catch(err){console.error('❌ Email test failed', err.message);}
  try { await sendSlackAlert('Backend Startup Test: Slack message'); console.log('✅ Slack test sent'); } catch(err){console.error('❌ Slack test failed', err.message);}
})();
"

# --------------------
# 8️⃣ Start backend server (Render-compatible)
# --------------------
echo "🌐 Launching backend server..."
node server.js