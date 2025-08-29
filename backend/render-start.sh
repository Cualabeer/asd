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
# 7️⃣ Start backend server (Render-compatible)
# --------------------
# Bind directly to $PORT for Render
echo "🌐 Starting backend server..."
# Run in background so the script exits immediately (Render sees open port)
nohup node server.js > logs/server.log 2>&1 &
echo "✅ Backend server launched in background"