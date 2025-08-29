#!/bin/bash
echo "🌐 Starting Mobile Mechanic Backend (Render One-Command Deploy)"

# --------------------
# 1️⃣ Move to backend folder
# --------------------
cd backend || { echo "❌ Backend folder not found"; exit 1; }

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
  echo "✅ .env created with placeholders."
fi

# --------------------
# 4️⃣ MongoDB check
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
# 5️⃣ Start server on Render port
# --------------------
echo "🌐 Launching backend server..."
node server.js