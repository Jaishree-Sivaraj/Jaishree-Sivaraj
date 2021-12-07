#!/bin/bash
cd /home/ubuntu
cp /app/esgapi/web.service /etc/systemd/system/
sudo which npm
sudo ln -s $(which npm) /usr/bin/npm
sudo which node
sudo ln -s $(which node) /usr/bin/node
sudo mkdir -p /var/pids