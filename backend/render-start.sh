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
echo "✅ Dependencies installed"

# --------------------
# 3️⃣ Ensure .env exists
# --------------------
if [ ! -f .env ]; then
  echo "⚠️ .env not found, creating placeholder..."
  cat <<EOL > .env
PORT=10000
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
  echo "✅ .env created with placeholders"
fi

# --------------------
# 4️⃣ Check critical environment variables
# --------------------
required_vars=("PORT" "MONGO_URI" "JWT_SECRET" "EMAIL_HOST" "EMAIL_PORT" "EMAIL_USER" "EMAIL_PASS" "ALERT_EMAIL_RECIPIENT" "SLACK_WEBHOOK_URL" "REPORT_TOKEN")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Environment variable $var is missing. Aborting deploy."
    exit 1
  fi
done
echo "✅ All critical environment variables set"

# --------------------
# 5️⃣ Prepare logs folder
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
# 7️⃣ Test alert system (email + Slack)
# --------------------
echo "📣 Testing alert system (email + Slack)..."
node -e "
import dotenv from 'dotenv';
import { sendEmailAlert } from './utils/alertMailer.js';
import { sendSlackAlert } from './utils/alertSlack.js';
dotenv.config();

(async () => {
  try { await sendEmailAlert('Backend Startup Test', 'This is a test email.'); console.log('✅ Test email sent'); } catch(err){ console.error('❌ Email test failed:', err.message); }
  try { await sendSlackAlert('Backend Startup Test'); console.log('✅ Test Slack message sent'); } catch(err){ console.error('❌ Slack test failed:', err.message); }
})();
"

# --------------------
# 8️⃣ Start server (Render-compatible)
# --------------------
echo "🌐 Launching backend server..."
node server.js