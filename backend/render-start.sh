#!/bin/bash
echo "🚀 Starting Mobile Mechanic Backend (Render One-Command Deploy)"

# --------------------
# 1️⃣ Ensure dependencies
# --------------------
echo "📦 Installing dependencies..."
npm install

# --------------------
# 2️⃣ Validate critical environment variables
# --------------------
required_vars=("MONGO_URI" "JWT_SECRET" "EMAIL_HOST" "EMAIL_PORT" "EMAIL_USER" "EMAIL_PASS" "ALERT_EMAIL_RECIPIENT" "SLACK_WEBHOOK_URL")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Environment variable $var is missing. Aborting."
    exit 1
  fi
done
echo "✅ All critical environment variables are set."

# --------------------
# 3️⃣ Prepare logs
# --------------------
mkdir -p logs
echo "$(date) - Backend deploy started" >> logs/startup.log

# --------------------
# 4️⃣ Run MongoDB check
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
# 5️⃣ Start backend server
# --------------------
# Render sets the PORT automatically, we must use process.env.PORT
if [ -z "$PORT" ]; then
  echo "⚠️ PORT is not set by Render. Defaulting to 5000"
  PORT=5000
fi
echo "🌐 Starting server on port $PORT..."
node -e "
import dotenv from 'dotenv';
dotenv.config();
import './server.js';
"