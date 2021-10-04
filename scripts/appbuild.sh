#!/bin/bash
sudo chown -R ubuntu:ubuntu /app
cd /app/esgapi
sudo rm -rf node_modules
sudo npm install
sudo npm run docs

