#!/bin/bash

service homebridge stop
rm -f /etc/homebridge/accessories/cachedAccessories
npm install -g .
service homebridge start
tail -f /var/log/syslog | grep homebridge
