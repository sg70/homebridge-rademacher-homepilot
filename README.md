# homebridge-rademacher-homepilot
Homebridge plugin for Rademacher Homepilot.

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-rademacher-homepilot) and should be installed "globally" by typing:
```
npm install -g homebridge-rademacher-homepilot
```
Update your config.json file. See config.json in this repository for a sample.

# Configuration

Configuration sample:
```
  "platforms": [
      {
        "platform": "RademacherHomePilot",
        "name": "RademacherHomePilot",
        "url": "http://192.168.0.1",
        "password": ""
      }
    ]
```

* `url`: address of HomePilot's web interface in your local network,
* `password`: password to HomePilot (if enabled in its web interface)

# Community

Join Homebridge slack team at https://homebridge-slackin.glitch.me/
Then add channel https://homebridgeteam.slack.com/messages/CNLGTM2SC

