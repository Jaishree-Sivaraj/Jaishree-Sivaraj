#!/bin/bash
sudo systemctl daemon-reload
sudo systemctl start web
sudo systemctl stop web
sudo systemctl restart web
sudo systemctl enable web

# adding pm2 service too for dev env
# npm install pm2 -g && pm2 update 
cd /app/esgapi
pm2 restart src/esgapi.js
echo "pm2 list"

