#!/bin/bash
echo -e "\x1b[1;34m🚀 Starting Mobile Mechanic Backend (Render Production Deploy)\x1b[0m"

# --------------------
# 1️⃣ Install dependencies
# --------------------
echo -e "\x1b[1;33m📦 Installing dependencies...\x1b[0m"
npm install

# --------------------
# 2️⃣ Validate environment variables
# --------------------
echo -e "\x1b[1;33m🔍 Checking environment variables...\x1b[0m"
node -e "
const requiredVars = ['PORT','MONGO_URI','JWT_SECRET','EMAIL_HOST','EMAIL_PORT','EMAIL_USER','EMAIL_PASS','ALERT_EMAIL_RECIPIENT','SLACK_WEBHOOK_URL'];
let allSet = true;
requiredVars.forEach(v => {
  if (!process.env[v] || process.env[v].trim()==='') { console.error('\x1b[1;31m❌ Missing env:\x1b[0m', v); allSet=false; } 
  else { console.log('\x1b[1;32m✅ Found env:\x1b[0m', v); }
});
if(!allSet){process.exit(1);}
"

# --------------------
# 3️⃣ Ensure log folder exists
# --------------------
mkdir -p ./logs
touch ./logs/backend.log

# --------------------
# 4️⃣ Run initialization report
# --------------------
echo -e "\x1b[1;33m🧪 Running initialization report...\x1b[0m"
node utils/initReport.js

# --------------------
# 5️⃣ Start backend server in background with monitoring
# --------------------
echo -e "\x1b[1;34m🌐 Starting backend server...\x1b[0m"
nohup node -e "
import dotenv from 'dotenv';
import express from 'express';
import connectDB from './config/db.js';
import { logInitialization } from './utils/initLogger.js';
import { sendEmailAlert } from './utils/alertMailer.js';
import { sendSlackAlert } from './utils/alertSlack.js';
import fs from 'fs';
import path from 'path';
dotenv.config();

const app = express();
app.use(express.json());
app.get('/', (req,res)=>res.send('Backend API is running ✅'));

const PORT = process.env.PORT || 5000;
const logFilePath = path.resolve('./logs/backend.log');
if (!fs.existsSync(path.dirname(logFilePath))) fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
const logToFile = async msg => { fs.appendFileSync(logFilePath, \`[\${new Date().toISOString()}] \${msg}\n\`); };

(async()=>{
  try {
    await connectDB();
    console.log('\x1b[1;32m🚀 MongoDB connected\x1b[0m');
    await logInitialization();
    await logToFile('✅ Server startup & initialization report logged');
    app.listen(PORT,()=>console.log(\`🚀 Server running on port \${PORT}\`));

    const intervalMs = 5*60*1000;
    setInterval(async()=>{
      try{
        await logInitialization(true);
        await logToFile('✅ Periodic initialization report sent');
      }catch(err){
        const errMsg='Periodic report failed: '+err.message;
        await logToFile('❌ '+errMsg);
        console.error('\x1b[1;31m❌ '+errMsg+'\x1b[0m');
        await sendEmailAlert('Backend Alert: Periodic Report Failed', err.message);
        await sendSlackAlert('Backend Alert: Periodic Report Failed:\\n'+err.message);
      }
    }, intervalMs);

  }catch(err){
    const errMsg='Server failed to start: '+err.message;
    await logToFile('❌ '+errMsg);
    console.error('\x1b[1;31m❌ '+errMsg+'\x1b[0m');
    await sendEmailAlert('Backend Alert: Startup Failure', err.message);
    await sendSlackAlert('Backend failed to start:\\n'+err.message);
    process.exit(1);
  }
})();
" >/dev/null 2>&1 &
echo -e "\x1b[1;32m✅ Backend started in background.\x1b[0m"
echo -e "\x1b[1;33m📝 Logs: ./logs/backend.log\x1b[0m"