#!/bin/bash

#Checking if services started and running ( Node service or pm2 service )


if [ "$DEPLOYMENT_GROUP_NAME" == "ESGDS-Backend-prod-DeploymentGroup" ]; then
	cd /app/esgapi
	STATUS="$(systemctl is-active web.service)"
	if [ "${STATUS}" = "active" ]; then
	   echo " Success! Node is running ....."
	else
	   echo " Node Service is not running.... so exiting "
	   exit 1
	fi

#zipping the folder after successfull deployment and build

	cd /app
	rm -rf esgapi-$(date +"%Y-%m-%d")_old.zip
	mv esgapi-$(date +"%Y-%m-%d").zip esgapi-$(date +"%Y-%m-%d")_old.zip
	#rm -rf esgapi.zip
	zip -r -X esgapi-$(date +"%Y-%m-%d").zip esgapi

#Zipping esgapi folder and starting upload process to s3 post successfull deployment of application. AWS CLI must be installed

	sudo aws s3 cp esgapi-$(date +"%Y-%m-%d").zip s3://esg-codedeploy-revisions/esgapi-$(date +"%Y-%m-%d").zip

else
    echo " Its not prod environment , all done "

fi
