#!/bin/bash
echo "🌐 Starting Mobile Mechanic Backend"

# Install dependencies
npm install

# Ensure logs folder exists
mkdir -p logs

# Test MongoDB connection
node -e "
import dotenv from 'dotenv';
import connectDB from './config/db.js';
dotenv.config();
connectDB()
  .then(()=>console.log('✅ MongoDB connection successful'))
  .catch(err=>{console.error('❌ MongoDB failed:', err.message); process.exit(1);});
"

# Start server
node server.js