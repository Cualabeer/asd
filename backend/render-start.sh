#!/bin/bash
echo "🚀 Starting Mobile Mechanic Backend (Render One-Command Deploy)"

# 1️⃣ Install dependencies
npm install

# 2️⃣ Ensure .env exists
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

# 3️⃣ Prepare logs folder
mkdir -p logs
echo "$(date) - Backend deploy started" >> logs/startup.log

# 4️⃣ MongoDB check
node -e "
import dotenv from 'dotenv';
import connectDB from './config/db.js';
dotenv.config();
connectDB().then(()=>console.log('✅ MongoDB connected')).catch(err=>{ console.error('❌ MongoDB failed:', err.message); process.exit(1); });
"

# 5️⃣ Start backend server
node server.js