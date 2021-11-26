#!/bin/bash

#Starting the services ( Node service )

cd /app/esgapi

if [ "$DEPLOYMENT_GROUP_NAME" == "ESG-Backend-Deploy-Instances-Dev" ]; then
   pm2 start src/esgapi.js
   pm2 restart
   pm2 list
fi


if [ "$DEPLOYMENT_GROUP_NAME" == "ESGDS-Backend-prod-DeploymentGroup" ]; then
   STATUS="$(systemctl is-active web.service)"
   if [ "${STATUS}" = "active" ]; then
      echo " Success! Node is running ....."
   else
      echo " Node Service is not running.... so exiting "
      exit 1
fi


#zipping the folder after successfull deployment and build

if [ "$DEPLOYMENT_GROUP_NAME" == "ESGDS-Backend-prod-DeploymentGroup" ]; then
   cd /app
   rm -rf esgapi-$(date +"%Y-%m-%d")_old.zip
   mv esgapi-$(date +"%Y-%m-%d").zip esgapi-$(date +"%Y-%m-%d")_old.zip
   #rm -rf esgapi.zip
   zip -r -X esgapi-$(date +"%Y-%m-%d").zip esgapi

   ##upload to s3. AWS CLI must be installed

   sudo aws s3 cp esgapi-$(date +"%Y-%m-%d").zip s3://esg-codedeploy-revisions/esgapi-$(date +"%Y-%m-%d").zip
fi
