
#!/bin/bash
STATUS="$(systemctl is-active web.service)"
if [ "${STATUS}" = "active" ]; then
   sudo systemctl stop web
   echo " Service web is stopped successfully....."
else
   echo " Service failed to stop"
fi






