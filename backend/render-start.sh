#!/bin/bash
echo "🌐 Starting Mobile Mechanic Backend (Render One-Command Deploy)"

# 1️⃣ Install dependencies
npm install

# 2️⃣ Ensure .env exists
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
  echo "✅ .env created"
fi

# 3️⃣ Start server directly (no cd or background processes)
node server.js