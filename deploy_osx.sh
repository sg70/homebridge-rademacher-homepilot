#!/bin/bash

launchctl unload ~/Library/LaunchAgents/com.homebridge.server.plist
rm -f ~/.homebridge/accessories/cachedAccessories
npm install -g .
launchctl load ~/Library/LaunchAgents/com.homebridge.server.plist
tail -f ~/.homebridge/homebridge.log
