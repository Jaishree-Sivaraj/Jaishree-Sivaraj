#!/bin/bash


if [ "$DEPLOYMENT_GROUP_NAME" == "ESGDS-Backend-prod-DeploymentGroup" ]; then
	sudo systemctl daemon-reload
	sudo systemctl start web
	sudo systemctl stop web
	sudo systemctl restart web
	sudo systemctl enable web
else  
	cd /app/esgapi
	pm2 start src/esgapi.js -i max
	pm2 restart 0
	echo "pm2 list"
fi
