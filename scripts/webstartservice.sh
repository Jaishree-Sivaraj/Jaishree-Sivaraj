#!/bin/bash
sudo systemctl daemon-reload
sudo systemctl start web
sudo systemctl stop web
sudo systemctl restart web
sudo systemctl enable web

npm install pm2 -g && pm2 update
cd /app/esgapi
pm2 start src/esgapi.js
echo "pm2 list"

