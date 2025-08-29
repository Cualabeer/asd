#!/bin/bash
echo "🚀 Starting Mobile Mechanic Backend (Render One-Command Deploy)"

# 1️⃣ Install dependencies
npm install

# 2️⃣ Ensure .env exists
if [ ! -f .env ]; then
  cat <<EOL > .env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=youremail@example.com
EMAIL_PASS=your_email_password
ALERT_EMAIL_RECIPIENT=alerts@example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
EOL
  echo "✅ .env created with placeholders."
fi

# 3️⃣ MongoDB connection check
node -e "
import dotenv from 'dotenv';
import connectDB from './backend/config/db.js';
dotenv.config();
connectDB().then(()=>console.log('✅ MongoDB connection successful')).catch(err=>console.error('❌ MongoDB failed:', err.message));
"

# 4️⃣ Run color-coded initialization report
node -e "
import { logInitialization } from './backend/utils/initLogger.js';
logInitialization();
"

# 5️⃣ Start backend server
node backend/server.js