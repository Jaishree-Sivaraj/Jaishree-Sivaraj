#!/bin/bash

if [ "$DEPLOYMENT_GROUP_NAME" == "ESGDS-Backend-prod-DeploymentGroup" ]; then
	STATUS="$(systemctl is-active web.service)"
	if [ "${STATUS}" = "active" ]; then
	   sudo systemctl stop web
	   echo " Service web is stopped successfully....."
	else
	   echo " Service failed to stop"
	fi
else 
  cd /app/esgapi/scripts
	bash nodeconfigure.sh
	bash webconfigure.sh
	cd ../ 
  echo " service runninc successfully.."
fi
