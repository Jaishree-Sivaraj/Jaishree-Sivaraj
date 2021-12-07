#!/bin/bash
# adding pm2 service too for dev env
# npm install pm2 -g && pm2 update 
cd /app/esgapi
pm2 start src/esgapi.js
pm2 restart 0
echo "pm2 list"

if [ "$DEPLOYMENT_GROUP_NAME" == "ESGDS-Backend-prod-DeploymentGroup" ]; then
   sudo systemctl daemon-reload
   sudo systemctl start web
   sudo systemctl stop web
   sudo systemctl restart web
   sudo systemctl enable web
fi