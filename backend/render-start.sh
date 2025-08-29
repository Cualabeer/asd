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
  echo "❌ .env not found. Please create it with your real environment variables."
  exit 1
fi
echo "✅ .env file found"

# --------------------
# 4️⃣ Ensure critical packages
# --------------------
critical_packages=(express express-async-handler mongoose cors dotenv nodemailer node-fetch)
for pkg in "${critical_packages[@]}"; do
  if ! npm list "$pkg" >/dev/null 2>&1; then
    echo "⚠️ $pkg not found, installing..."
    npm install "$pkg"
  fi
done

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
import mongoose from 'mongoose';
dotenv.config();
mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log('✅ MongoDB connection successful'))
  .catch(err=>{
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
"

# --------------------
# 7️⃣ Start backend server (Render-compatible)
# --------------------
echo "🌐 Starting backend server..."
# Bind to process.env.PORT on 0.0.0.0
node -e "
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('Backend API is running ✅'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});
"