#!/bin/bash
sudo systemctl daemon-reload
sudo systemctl start web
sudo systemctl stop web
sudo systemctl restart web
sudo systemctl enable web

# adding pm2 service too for dev env
npm install -y pm2 -g && pm2 update -y
cd /app/esgapi
pm2 start src/esgapi.js
echo "pm2 list"

