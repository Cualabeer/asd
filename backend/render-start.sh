#!/bin/bash
echo "🚀 Starting Mobile Mechanic Backend"

npm install

if [ ! -f .env ]; then
cat <<EOL > .env
PORT=5000
MONGO_URI=your_mongo_uri_here
JWT_SECRET=your_jwt_secret_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_email_app_password
ALERT_EMAIL_RECIPIENT=alerts@yourdomain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
REPORT_TOKEN=supersecrettoken123
EOL
fi

mkdir -p logs
node server.js