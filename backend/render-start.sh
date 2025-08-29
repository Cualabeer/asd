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
EOL
  echo "✅ .env created with placeholders."
fi

# 3️⃣ Validate Email Environment Variables
required_vars=("EMAIL_HOST" "EMAIL_PORT" "EMAIL_USER" "EMAIL_PASS" "ALERT_EMAIL_RECIPIENT")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "⚠️ Environment variable $var is missing. Filling placeholder..."
    case $var in
      EMAIL_HOST) echo "EMAIL_HOST=smtp.example.com" >> .env ;;
      EMAIL_PORT) echo "EMAIL_PORT=587" >> .env ;;
      EMAIL_USER) echo "EMAIL_USER=youremail@example.com" >> .env ;;
      EMAIL_PASS) echo "EMAIL_PASS=your_email_password" >> .env ;;
      ALERT_EMAIL_RECIPIENT) echo "ALERT_EMAIL_RECIPIENT=alerts@example.com" >> .env ;;
    esac
  fi
done

# 4️⃣ MongoDB connection check
echo "🧪 Testing MongoDB connection..."
node -e "
import dotenv from 'dotenv';
import connectDB from './backend/config/db.js';
dotenv.config();
connectDB().then(()=>console.log('✅ MongoDB connection successful')).catch(err=>console.error('❌ MongoDB failed:', err.message));
"

# 5️⃣ Run color-coded initialization report
echo "🧪 Running initialization report..."
node -e "
import { logInitialization } from './backend/utils/initLogger.js';
logInitialization();
"

# 6️⃣ Start backend server
echo "🌐 Starting backend server..."
node backend/server.js