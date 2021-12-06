#!/bin/bash

if [ "$DEPLOYMENT_GROUP_NAME" == "ESG-Backend-Deploy-Instances-Dev" ]; then
	STATUS="$(systemctl is-active web.service)"
	if [ "${STATUS}" = "active" ]; then
	   sudo systemctl stop web
	   echo " Service web is stopped successfully....."
	else
	   echo " Service failed to stop"
	fi
else 
  cd /app/esgapi/scripts
  pm2 stop src/esgapi.js
fi
