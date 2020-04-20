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
        "password": "",
        "scenes_as_switch":"false"
      }
    ]
```

* `url`: address of HomePilot's web interface in your local network,
* `password`: password to HomePilot (if enabled in its web interface)

# Community

The official Homebridge Discord server and Reddit community are where users can discuss Homebridge and ask for help.

<span align="center">

[![Homebridge Discord](https://discordapp.com/api/guilds/432663330281226270/widget.png?style=banner2)](https://discord.gg/kqNCe2D) [![Homebridge Reddit](.github/homebridge-reddit.svg?sanitize=true)](https://www.reddit.com/r/homebridge/)

</span>

HomeKit communities can also be found on both [Discord](https://discord.gg/RcV7fa8) and [Reddit](https://www.reddit.com/r/homekit).


