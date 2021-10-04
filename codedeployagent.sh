#!/bin/bash
sudo apt update
sudo apt install ruby-full
sudo apt install wget
sudo cd /home/ubuntu
sudo wget https://aws-codedeploy-ap-south-1.s3.ap-south-1.amazonaws.com/latest/install
sudo chmod +x ./install
sudo ./install auto
sudo service codedeploy-agent status

