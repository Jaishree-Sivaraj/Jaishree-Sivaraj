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
zip -r -X esgapi.zip *

##upload to s3. AWS CLI must be installed
#sudo aws s3 cp esgapi.zip s3://esg-codedeploy-revisions/*
