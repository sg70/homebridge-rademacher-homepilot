# homebridge-rademacher-blinds
Homebridge plugin for Rademacher blinds.

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-ubnt-mfi) and should be installed "globally" by typing:
```
npm install -g homebridge-rademacher-blinds
```
Update your config.json file. See config.json in this repository for a sample.

# Configuration

Configuration sample:
```
  "platforms": [
      {
        "platform": "RademacherBlinds",
        "name": "RademacherBlinds",
        "url": "http://192.168.0.1/deviceajax.do"
      }
    ]
```