#!/bin/bash
source /home/ubuntu/.bash_profile
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.38.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm --version
nvm ls-remote
nvm install 14.17.6
node --version
npm --version
