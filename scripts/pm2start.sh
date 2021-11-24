#!/bin/bash
npm install pm2 -g && pm2 update
cd /app/esgapi
pm2 start src/esgapi.js
echo "pm2 list"
