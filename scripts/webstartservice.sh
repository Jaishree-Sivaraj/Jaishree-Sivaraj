#!/bin/bash
sudo systemctl daemon-reload
sudo systemctl start web
sudo systemctl stop web
sudo systemctl restart web
sudo systemctl enable web
