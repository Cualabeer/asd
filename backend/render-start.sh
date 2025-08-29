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
echo "$(date) - Backend deploy started" >> logs/startup.log
echo "✅ Logs folder ready"

# --------------------
# 7️⃣ MongoDB connection check
# --------------------
echo "🧪 Testing MongoDB connection..."
node -e "
import dotenv from 'dotenv';
import connectDB from './backend/config/db.js';
dotenv.config();
connectDB()
  .then(()=>console.log('✅ MongoDB connection successful'))
  .catch(err=>{
    console.error('❌ MongoDB failed:', err.message);
    process.exit(1); // Exit script if connection fails
  });
"

# --------------------
# 8️⃣ Test alert system (email + Slack)
# --------------------
echo "📣 Testing alert system (email + Slack)..."
node -e "
import dotenv from 'dotenv';
import { sendEmailAlert } from './backend/utils/alertMailer.js';
import { sendSlackAlert } from './backend/utils/alertSlack.js';
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
# 9️⃣ Automated health checks
# --------------------
echo "🩺 Running backend health check..."
node -e "
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
dotenv.config();

(async () => {
  try {
    // Check MongoDB collections
    const collections = await mongoose.connect(process.env.MONGO_URI).then(db => db.connection.db.listCollections().toArray());
    if (!collections || collections.length === 0) {
      console.error('❌ MongoDB has no collections!');
      process.exit(1);
    }
    console.log('✅ MongoDB collections found:', collections.map(c => c.name).join(', '));

    // Check API root endpoint
    const res = await fetch(`http://localhost:${process.env.PORT}/`);
    if (res.status !== 200) {
      console.error('❌ API root endpoint failed');
      process.exit(1);
    }
    console.log('✅ API root endpoint OK');
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    process.exit(1);
  }
})();
"

# --------------------
# 🔟 Run initial logInitialization report
# --------------------
echo "🧪 Running initialization report..."
node -e "
import { logInitialization } from './backend/utils/initLogger.js';
logInitialization();
"

# --------------------
# 1️⃣1️⃣ Start backend server
# --------------------
echo "🌐 Starting backend server..."
node backend/server.js