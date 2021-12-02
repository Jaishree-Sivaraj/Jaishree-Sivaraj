#!/bin/bash


if [ "$DEPLOYMENT_GROUP_NAME" == "ESGDS-Backend-prod-DeploymentGroup" ]; then
	cd /home/ubuntu
	cp /app/esgapi/web.service /etc/systemd/system/
	sudo which npm
	sudo ln -s $(which npm) /usr/bin/npm
	sudo which node
	sudo ln -s $(which node) /usr/bin/node
	sudo mkdir -p /var/pids
else
#adding pm2 service for dev-qa environment
	npm install pm2 -g && pm2 update 
fi
