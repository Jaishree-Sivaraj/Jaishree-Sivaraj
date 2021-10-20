#!/bin/bash
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
zip -r -X esgapi-$(date +"%Y-%m-%d").zip *

##upload to s3. AWS CLI must be installed

sudo aws s3 cp esgapi-$(date +"%Y-%m-%d").zip s3://esg-codedeploy-revisions/esgapi-$(date +"%Y-%m-%d").zip
